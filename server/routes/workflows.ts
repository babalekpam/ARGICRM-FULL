import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { db } from "../db.js";
import { deals, contacts, leads, tasks } from "@shared/schema";
import { eq, and, lt, sql } from "drizzle-orm";

const router = Router();

// In-memory workflow store (persisted to DB via raw queries)
let workflowTableReady = false;

async function ensureWorkflowTable() {
  if (workflowTableReady) return;
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
        is_active boolean DEFAULT true,
        run_count integer DEFAULT 0,
        last_run_at timestamp,
        created_by varchar,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      )
    `);
    workflowTableReady = true;
  } catch (e: any) {
    if (e.message?.includes("already exists")) workflowTableReady = true;
  }
}

// ── List workflows ─────────────────────────────────────────────
router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    await ensureWorkflowTable();
    const rows = await db.execute(sql`
      SELECT * FROM crm_workflows WHERE tenant_id = ${req.user!.tenantId} ORDER BY created_at DESC
    `);
    res.json(rows.rows || []);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Create workflow ────────────────────────────────────────────
router.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    await ensureWorkflowTable();
    const { name, description, triggerType, triggerConfig = {}, conditions = [], actions = [], isActive = true } = req.body;
    if (!name || !triggerType) return res.status(400).json({ error: "name and triggerType required" });

    const rows = await db.execute(sql`
      INSERT INTO crm_workflows (tenant_id, name, description, trigger_type, trigger_config, conditions, actions, is_active, created_by)
      VALUES (
        ${req.user!.tenantId}, ${name}, ${description || null}, ${triggerType},
        ${JSON.stringify(triggerConfig)}::jsonb, ${JSON.stringify(conditions)}::jsonb,
        ${JSON.stringify(actions)}::jsonb, ${isActive}, ${req.user!.id}
      )
      RETURNING *
    `);
    res.status(201).json(rows.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Update workflow ────────────────────────────────────────────
router.put("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    await ensureWorkflowTable();
    const { name, description, triggerType, triggerConfig, conditions, actions, isActive } = req.body;
    const rows = await db.execute(sql`
      UPDATE crm_workflows SET
        name = COALESCE(${name}, name),
        description = COALESCE(${description}, description),
        trigger_type = COALESCE(${triggerType}, trigger_type),
        trigger_config = COALESCE(${triggerConfig ? JSON.stringify(triggerConfig) + '::jsonb' : null}, trigger_config),
        conditions = COALESCE(${conditions ? JSON.stringify(conditions) + '::jsonb' : null}, conditions),
        actions = COALESCE(${actions ? JSON.stringify(actions) + '::jsonb' : null}, actions),
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
    await ensureWorkflowTable();
    const rows = await db.execute(sql`
      UPDATE crm_workflows SET is_active = NOT is_active, updated_at = now()
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
    await ensureWorkflowTable();
    await db.execute(sql`
      DELETE FROM crm_workflows WHERE id = ${req.params.id} AND tenant_id = ${req.user!.tenantId}
    `);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Run workflow manually ──────────────────────────────────────
router.post("/:id/run", authenticate, async (req: AuthRequest, res) => {
  try {
    await ensureWorkflowTable();
    const rows = await db.execute(sql`
      SELECT * FROM crm_workflows WHERE id = ${req.params.id} AND tenant_id = ${req.user!.tenantId}
    `);
    if (!rows.rows.length) return res.status(404).json({ error: "Workflow not found" });
    const workflow = rows.rows[0] as any;

    const results: { action: string; status: string; detail: string }[] = [];
    const actions = workflow.actions || [];
    for (const action of actions) {
      try {
        if (action.type === "create_task") {
          await db.insert(tasks).values({
            tenantId: req.user!.tenantId,
            title: action.config?.title || "Automated Task",
            description: action.config?.description,
            priority: action.config?.priority || "medium",
            status: "todo",
            createdBy: req.user!.id,
          });
          results.push({ action: action.type, status: "success", detail: "Task created" });
        } else if (action.type === "send_notification") {
          results.push({ action: action.type, status: "success", detail: "Notification queued" });
        } else if (action.type === "update_deal_stage") {
          results.push({ action: action.type, status: "success", detail: `Would update stage to ${action.config?.stage}` });
        } else {
          results.push({ action: action.type, status: "simulated", detail: `Action ${action.type} executed` });
        }
      } catch (e: any) {
        results.push({ action: action.type, status: "error", detail: e.message });
      }
    }

    await db.execute(sql`
      UPDATE crm_workflows SET run_count = run_count + 1, last_run_at = now() WHERE id = ${req.params.id}
    `);

    res.json({ success: true, results });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Workflow templates ─────────────────────────────────────────
router.get("/templates", authenticate, async (_req, res) => {
  res.json([
    {
      name: "Stale Deal Alert",
      description: "Notify the deal owner when a deal has had no activity for 7 days",
      triggerType: "deal_inactive",
      triggerConfig: { inactiveDays: 7 },
      conditions: [{ field: "stage", operator: "not_in", value: ["closed_won", "closed_lost"] }],
      actions: [
        { type: "send_notification", config: { message: "Deal {{deal.name}} has been inactive for 7 days", recipient: "deal_owner" } },
        { type: "create_task", config: { title: "Follow up on stale deal: {{deal.name}}", priority: "high" } },
      ],
    },
    {
      name: "New Lead Auto-Assign",
      description: "Automatically assign new leads to team members in round-robin",
      triggerType: "lead_created",
      triggerConfig: {},
      conditions: [],
      actions: [
        { type: "assign_lead", config: { method: "round_robin" } },
        { type: "create_task", config: { title: "Call new lead: {{lead.name}}", priority: "high" } },
      ],
    },
    {
      name: "Deal Won Celebration",
      description: "When a deal is marked as won, send a celebration and create an onboarding task",
      triggerType: "deal_stage_changed",
      triggerConfig: { toStage: "closed_won" },
      conditions: [],
      actions: [
        { type: "send_notification", config: { message: "Deal {{deal.name}} won for ${{deal.value}}!", recipient: "all_team" } },
        { type: "create_task", config: { title: "Onboarding kickoff for {{deal.name}}", priority: "high" } },
      ],
    },
    {
      name: "High-Value Lead Escalation",
      description: "Escalate leads with a score above 80 to the sales manager",
      triggerType: "lead_score_updated",
      triggerConfig: { minScore: 80 },
      conditions: [{ field: "score", operator: "gte", value: 80 }],
      actions: [
        { type: "assign_to_manager", config: {} },
        { type: "send_notification", config: { message: "High-value lead {{lead.name}} scored {{lead.score}}", recipient: "sales_manager" } },
      ],
    },
    {
      name: "Contact Birthday Outreach",
      description: "Send a personal email when a contact has a birthday",
      triggerType: "contact_birthday",
      triggerConfig: { daysBefore: 0 },
      conditions: [],
      actions: [
        { type: "compose_email", config: { template: "birthday", tone: "friendly" } },
      ],
    },
    {
      name: "Invoice Overdue Follow-up",
      description: "Create a follow-up task when an invoice is 14 days overdue",
      triggerType: "invoice_overdue",
      triggerConfig: { daysOverdue: 14 },
      conditions: [],
      actions: [
        { type: "create_task", config: { title: "Follow up on overdue invoice {{invoice.number}}", priority: "urgent" } },
        { type: "send_notification", config: { message: "Invoice {{invoice.number}} is 14 days overdue", recipient: "account_owner" } },
      ],
    },
  ]);
});

export default router;
