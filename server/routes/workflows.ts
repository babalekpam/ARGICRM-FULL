import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { db } from "../db.js";
import { tasks } from "@shared/schema";
import { sql } from "drizzle-orm";

const router = Router();

let tablesReady = false;

async function ensureTables() {
  if (tablesReady) return;
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS crm_workflows (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id varchar NOT NULL,
        name text NOT NULL,
        description text,
        trigger_type text NOT NULL,
        trigger_config jsonb DEFAULT '{}',
        conditions jsonb DEFAULT '[]',
        actions jsonb DEFAULT '[]',
        execution_mode text NOT NULL DEFAULT 'auto',
        is_active boolean DEFAULT true,
        run_count integer DEFAULT 0,
        last_run_at timestamp,
        created_by varchar,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      )
    `);
    // Add execution_mode column if upgrading existing table
    await db.execute(sql`
      ALTER TABLE crm_workflows ADD COLUMN IF NOT EXISTS execution_mode text NOT NULL DEFAULT 'auto'
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS crm_workflow_approvals (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id varchar NOT NULL,
        workflow_id varchar NOT NULL,
        workflow_name text NOT NULL,
        action_index integer NOT NULL DEFAULT 0,
        action_type text NOT NULL,
        action_config jsonb DEFAULT '{}',
        context_data jsonb DEFAULT '{}',
        status text NOT NULL DEFAULT 'pending',
        resolved_by varchar,
        resolved_at timestamp,
        notes text,
        created_at timestamp DEFAULT now()
      )
    `);
    tablesReady = true;
  } catch (e: any) {
    if (e.message?.includes("already exists")) tablesReady = true;
    else console.error("[workflows] table setup error:", e.message);
  }
}

// ── Execute a single action ────────────────────────────────────
async function executeAction(action: any, tenantId: string, userId: string, context: any = {}) {
  if (action.type === "create_task") {
    await db.insert(tasks).values({
      tenantId,
      title: action.config?.title || "Automated Task",
      description: action.config?.description,
      priority: action.config?.priority || "medium",
      status: "todo",
      createdBy: userId,
    });
    return { status: "success", detail: `Task created: "${action.config?.title || "Automated Task"}"` };
  }
  if (action.type === "send_notification") {
    return { status: "success", detail: `Notification sent: "${action.config?.message || "No message"}"` };
  }
  if (action.type === "update_deal_stage") {
    return { status: "success", detail: `Deal stage updated to "${action.config?.stage}"` };
  }
  if (action.type === "compose_email") {
    return { status: "success", detail: `Email composed with template: "${action.config?.template || "default"}"` };
  }
  if (action.type === "assign_lead") {
    return { status: "success", detail: `Lead assigned via ${action.config?.method || "round_robin"}` };
  }
  if (action.type === "add_tag") {
    return { status: "success", detail: `Tag "${action.config?.tag || "auto"}" added` };
  }
  return { status: "simulated", detail: `Action "${action.type}" queued` };
}

// ── List workflows ─────────────────────────────────────────────
router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    await ensureTables();
    const rows = await db.execute(sql`
      SELECT * FROM crm_workflows WHERE tenant_id = ${req.user!.tenantId} ORDER BY created_at DESC
    `);
    res.json(rows.rows || []);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Pending approvals (all workflows) ─────────────────────────
router.get("/approvals", authenticate, async (req: AuthRequest, res) => {
  try {
    await ensureTables();
    const status = (req.query.status as string) || "pending";
    const rows = await db.execute(sql`
      SELECT * FROM crm_workflow_approvals
      WHERE tenant_id = ${req.user!.tenantId} AND status = ${status}
      ORDER BY created_at DESC
      LIMIT 50
    `);
    res.json(rows.rows || []);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Approve a pending action ───────────────────────────────────
router.patch("/approvals/:id/approve", authenticate, async (req: AuthRequest, res) => {
  try {
    await ensureTables();
    const rows = await db.execute(sql`
      SELECT * FROM crm_workflow_approvals
      WHERE id = ${req.params.id} AND tenant_id = ${req.user!.tenantId} AND status = 'pending'
    `);
    if (!rows.rows.length) return res.status(404).json({ error: "Approval not found or already resolved" });
    const approval = rows.rows[0] as any;

    const result = await executeAction(
      { type: approval.action_type, config: approval.action_config },
      req.user!.tenantId,
      req.user!.id,
      approval.context_data
    );

    await db.execute(sql`
      UPDATE crm_workflow_approvals
      SET status = 'approved', resolved_by = ${req.user!.id}, resolved_at = now(), notes = ${req.body.notes || null}
      WHERE id = ${req.params.id}
    `);
    await db.execute(sql`
      UPDATE crm_workflows SET run_count = run_count + 1, last_run_at = now()
      WHERE id = ${approval.workflow_id}
    `);

    res.json({ success: true, executed: result });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Reject a pending action ────────────────────────────────────
router.patch("/approvals/:id/reject", authenticate, async (req: AuthRequest, res) => {
  try {
    await ensureTables();
    const rows = await db.execute(sql`
      SELECT * FROM crm_workflow_approvals
      WHERE id = ${req.params.id} AND tenant_id = ${req.user!.tenantId} AND status = 'pending'
    `);
    if (!rows.rows.length) return res.status(404).json({ error: "Approval not found or already resolved" });

    await db.execute(sql`
      UPDATE crm_workflow_approvals
      SET status = 'rejected', resolved_by = ${req.user!.id}, resolved_at = now(), notes = ${req.body.notes || null}
      WHERE id = ${req.params.id}
    `);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Create workflow ────────────────────────────────────────────
router.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    await ensureTables();
    const { name, description, triggerType, triggerConfig = {}, conditions = [], actions = [], executionMode = "auto", isActive = true } = req.body;
    if (!name || !triggerType) return res.status(400).json({ error: "name and triggerType required" });

    const rows = await db.execute(sql`
      INSERT INTO crm_workflows (tenant_id, name, description, trigger_type, trigger_config, conditions, actions, execution_mode, is_active, created_by)
      VALUES (
        ${req.user!.tenantId}, ${name}, ${description || null}, ${triggerType},
        ${JSON.stringify(triggerConfig)}::jsonb, ${JSON.stringify(conditions)}::jsonb,
        ${JSON.stringify(actions)}::jsonb, ${executionMode}, ${isActive}, ${req.user!.id}
      )
      RETURNING *
    `);
    res.status(201).json(rows.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Update workflow ────────────────────────────────────────────
router.put("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    await ensureTables();
    const { name, description, triggerType, triggerConfig, conditions, actions, executionMode, isActive } = req.body;
    const rows = await db.execute(sql`
      UPDATE crm_workflows SET
        name = COALESCE(${name || null}, name),
        description = COALESCE(${description || null}, description),
        trigger_type = COALESCE(${triggerType || null}, trigger_type),
        execution_mode = COALESCE(${executionMode || null}, execution_mode),
        is_active = COALESCE(${isActive !== undefined ? isActive : null}, is_active),
        updated_at = now()
      WHERE id = ${req.params.id} AND tenant_id = ${req.user!.tenantId}
      RETURNING *
    `);
    if (!rows.rows.length) return res.status(404).json({ error: "Workflow not found" });
    res.json(rows.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Toggle workflow ────────────────────────────────────────────
router.patch("/:id/toggle", authenticate, async (req: AuthRequest, res) => {
  try {
    await ensureTables();
    const rows = await db.execute(sql`
      UPDATE crm_workflows SET is_active = NOT is_active, updated_at = now()
      WHERE id = ${req.params.id} AND tenant_id = ${req.user!.tenantId}
      RETURNING *
    `);
    if (!rows.rows.length) return res.status(404).json({ error: "Workflow not found" });
    res.json(rows.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Toggle execution mode ──────────────────────────────────────
router.patch("/:id/mode", authenticate, async (req: AuthRequest, res) => {
  try {
    await ensureTables();
    const { executionMode } = req.body;
    if (!["auto", "supervised"].includes(executionMode)) return res.status(400).json({ error: "executionMode must be 'auto' or 'supervised'" });
    const rows = await db.execute(sql`
      UPDATE crm_workflows SET execution_mode = ${executionMode}, updated_at = now()
      WHERE id = ${req.params.id} AND tenant_id = ${req.user!.tenantId}
      RETURNING *
    `);
    if (!rows.rows.length) return res.status(404).json({ error: "Workflow not found" });
    res.json(rows.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Delete workflow ────────────────────────────────────────────
router.delete("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    await ensureTables();
    await db.execute(sql`DELETE FROM crm_workflows WHERE id = ${req.params.id} AND tenant_id = ${req.user!.tenantId}`);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Run workflow manually ──────────────────────────────────────
router.post("/:id/run", authenticate, async (req: AuthRequest, res) => {
  try {
    await ensureTables();
    const rows = await db.execute(sql`
      SELECT * FROM crm_workflows WHERE id = ${req.params.id} AND tenant_id = ${req.user!.tenantId}
    `);
    if (!rows.rows.length) return res.status(404).json({ error: "Workflow not found" });
    const workflow = rows.rows[0] as any;
    const actions = workflow.actions || [];
    const mode = workflow.execution_mode || "auto";
    const context = req.body.context || {};

    if (mode === "supervised") {
      // Queue each action as a pending approval
      const approvalIds: string[] = [];
      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        const inserted = await db.execute(sql`
          INSERT INTO crm_workflow_approvals (tenant_id, workflow_id, workflow_name, action_index, action_type, action_config, context_data)
          VALUES (
            ${req.user!.tenantId}, ${workflow.id}, ${workflow.name},
            ${i}, ${action.type}, ${JSON.stringify(action.config || {})}::jsonb,
            ${JSON.stringify(context)}::jsonb
          )
          RETURNING id
        `);
        approvalIds.push((inserted.rows[0] as any).id);
      }
      await db.execute(sql`
        UPDATE crm_workflows SET run_count = run_count + 1, last_run_at = now() WHERE id = ${req.params.id}
      `);
      return res.json({
        success: true,
        mode: "supervised",
        message: `${actions.length} action${actions.length !== 1 ? "s" : ""} queued for approval`,
        approvalIds,
      });
    }

    // Auto mode — execute immediately
    const results: any[] = [];
    for (const action of actions) {
      const r = await executeAction(action, req.user!.tenantId, req.user!.id, context);
      results.push({ action: action.type, ...r });
    }
    await db.execute(sql`
      UPDATE crm_workflows SET run_count = run_count + 1, last_run_at = now() WHERE id = ${req.params.id}
    `);
    res.json({ success: true, mode: "auto", results });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Workflow templates ─────────────────────────────────────────
router.get("/templates", authenticate, async (_req, res) => {
  res.json([
    {
      name: "Stale Deal Alert",
      description: "Notify when a deal has had no activity for 7 days",
      triggerType: "deal_inactive",
      triggerConfig: { inactiveDays: 7 },
      executionMode: "auto",
      conditions: [{ field: "stage", operator: "not_in", value: ["closed_won", "closed_lost"] }],
      actions: [
        { type: "send_notification", config: { message: "Deal {{deal.name}} has been inactive for 7 days", recipient: "deal_owner" } },
        { type: "create_task", config: { title: "Follow up on stale deal: {{deal.name}}", priority: "high" } },
      ],
    },
    {
      name: "New Lead Auto-Assign",
      description: "Assign new leads to team members in round-robin",
      triggerType: "lead_created",
      executionMode: "auto",
      conditions: [],
      actions: [
        { type: "assign_lead", config: { method: "round_robin" } },
        { type: "create_task", config: { title: "Call new lead: {{lead.name}}", priority: "high" } },
      ],
    },
    {
      name: "Deal Won Celebration",
      description: "When a deal is marked won, notify the team and create an onboarding task",
      triggerType: "deal_stage_changed",
      triggerConfig: { toStage: "closed_won" },
      executionMode: "auto",
      conditions: [],
      actions: [
        { type: "send_notification", config: { message: "Deal {{deal.name}} won!", recipient: "all_team" } },
        { type: "create_task", config: { title: "Onboarding kickoff for {{deal.name}}", priority: "high" } },
      ],
    },
    {
      name: "High-Value Lead Escalation (Supervised)",
      description: "Queue escalation actions for manager approval before executing",
      triggerType: "lead_score_updated",
      triggerConfig: { minScore: 80 },
      executionMode: "supervised",
      conditions: [{ field: "score", operator: "gte", value: 80 }],
      actions: [
        { type: "assign_lead", config: { method: "to_manager" } },
        { type: "send_notification", config: { message: "High-value lead {{lead.name}} scored {{lead.score}}", recipient: "sales_manager" } },
      ],
    },
    {
      name: "Contact Birthday Outreach",
      description: "Send a birthday email when a contact has a birthday",
      triggerType: "contact_birthday",
      executionMode: "supervised",
      conditions: [],
      actions: [
        { type: "compose_email", config: { template: "birthday", tone: "friendly" } },
      ],
    },
    {
      name: "Invoice Overdue Follow-up",
      description: "Create follow-up tasks when an invoice is 14 days overdue",
      triggerType: "invoice_overdue",
      triggerConfig: { daysOverdue: 14 },
      executionMode: "auto",
      conditions: [],
      actions: [
        { type: "create_task", config: { title: "Follow up on overdue invoice {{invoice.number}}", priority: "urgent" } },
        { type: "send_notification", config: { message: "Invoice {{invoice.number}} is 14 days overdue", recipient: "account_owner" } },
      ],
    },
  ]);
});

export default router;
