import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { db } from "../db.js";
import { tasks, leads, deals, contacts, accounts } from "@shared/schema";
import { eq, and, lte } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { sendGenericEmail } from "../services/email.js";

const router = Router();

// ── Table bootstrap ────────────────────────────────────────────────────────
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
    await db.execute(sql`ALTER TABLE crm_workflows ADD COLUMN IF NOT EXISTS execution_mode text NOT NULL DEFAULT 'auto'`);
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
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS crm_notifications (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id varchar NOT NULL,
        user_id varchar,
        title text NOT NULL,
        message text,
        type text DEFAULT 'info',
        is_read boolean DEFAULT false,
        created_at timestamp DEFAULT now()
      )
    `);
    tablesReady = true;
  } catch (e: any) {
    if (e.message?.includes("already exists")) tablesReady = true;
    else console.error("[workflows] table setup error:", e.message);
  }
}

// ── Template variable interpolation ───────────────────────────────────────
function interpolate(template: string, ctx: Record<string, any>): string {
  if (!template) return "";
  return template.replace(/\{\{([\w.]+)\}\}/g, (match, path) => {
    const keys = path.split(".");
    let val: any = ctx;
    for (const k of keys) val = val?.[k];
    return val !== undefined && val !== null ? String(val) : match;
  });
}

// ── Condition evaluator ────────────────────────────────────────────────────
function evaluateConditions(conditions: any[], ctx: Record<string, any>): boolean {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every(c => {
    const val = ctx[c.field];
    switch (c.operator) {
      case "equals":       return String(val) === String(c.value);
      case "not_equals":   return String(val) !== String(c.value);
      case "greater_than": return parseFloat(val) > parseFloat(c.value);
      case "less_than":    return parseFloat(val) < parseFloat(c.value);
      case "gte":          return parseFloat(val) >= parseFloat(c.value);
      case "contains":     return String(val || "").toLowerCase().includes(String(c.value).toLowerCase());
      case "not_in": {
        const arr = Array.isArray(c.value) ? c.value : String(c.value).split(",").map((s: string) => s.trim());
        return !arr.includes(val);
      }
      default: return true;
    }
  });
}

// ── Real action executor ───────────────────────────────────────────────────
async function executeAction(
  action: any,
  tenantId: string,
  userId: string,
  ctx: Record<string, any> = {}
): Promise<{ status: string; detail: string }> {
  const { type, config = {} } = action;
  const c = config;

  // ── Create Task ──────────────────────────────────────────────────────────
  if (type === "create_task") {
    const title = interpolate(c.title || "Automated Task", ctx);
    const due = c.dueDays ? new Date(Date.now() + parseInt(c.dueDays) * 86_400_000) : null;
    await db.insert(tasks).values({
      tenantId,
      userId,
      createdBy: userId,
      title,
      description: c.description ? interpolate(c.description, ctx) : null,
      priority:    c.priority || "medium",
      status:      "pending",
      type:        c.type || "other",
      dueDate:     due,
    });
    return { status: "success", detail: `Task created: "${title}"` };
  }

  // ── In-App Notification ──────────────────────────────────────────────────
  if (type === "send_notification") {
    const msg = interpolate(c.message || "Workflow notification", ctx);
    await db.execute(sql`
      INSERT INTO crm_notifications (tenant_id, user_id, title, message, type)
      VALUES (${tenantId}, ${userId}, ${"Workflow Alert"}, ${msg}, ${"workflow"})
    `);
    return { status: "success", detail: `Notification: "${msg}"` };
  }

  // ── Send Real Email ──────────────────────────────────────────────────────
  if (type === "send_email" || type === "compose_email") {
    const to      = c.to || ctx.email || ctx.contactEmail;
    const subject = interpolate(c.subject || "Message from your CRM", ctx);
    const body    = interpolate(c.body || c.template || "", ctx);
    if (to) {
      try {
        await sendGenericEmail({ to, subject, body });
        return { status: "success", detail: `Email sent to ${to}` };
      } catch (err: any) {
        return { status: "warning", detail: `Email to ${to} failed: ${err.message}` };
      }
    }
    return { status: "warning", detail: "No recipient email — email skipped" };
  }

  // ── Update Deal Stage ────────────────────────────────────────────────────
  if (type === "update_deal_stage") {
    const dealId = ctx.dealId || c.dealId;
    const stage  = c.stage || c.toStage;
    if (dealId && stage) {
      await db.update(deals)
        .set({ stage, updatedAt: new Date() })
        .where(and(eq(deals.id, dealId), eq(deals.tenantId, tenantId)));
      return { status: "success", detail: `Deal "${ctx["deal.name"] || dealId}" stage → "${stage}"` };
    }
    return { status: "skipped", detail: "No dealId or stage provided" };
  }

  // ── Update Lead Status ───────────────────────────────────────────────────
  if (type === "update_lead_status") {
    const leadId = ctx.leadId || c.leadId;
    const status = c.status;
    if (leadId && status) {
      await db.update(leads)
        .set({ status, updatedAt: new Date() })
        .where(and(eq(leads.id, leadId), eq(leads.tenantId, tenantId)));
      return { status: "success", detail: `Lead status → "${status}"` };
    }
    return { status: "skipped", detail: "No leadId or status provided" };
  }

  // ── Assign Lead (round-robin or to specific user) ──────────────────────
  if (type === "assign_lead") {
    const leadId = ctx.leadId || c.leadId;
    if (leadId) {
      if (c.assignTo) {
        await db.update(leads).set({ createdBy: c.assignTo, updatedAt: new Date() })
          .where(and(eq(leads.id, leadId), eq(leads.tenantId, tenantId)));
        return { status: "success", detail: `Lead assigned to user ${c.assignTo}` };
      }
      // Round-robin: pick random team member
      const members = await db.execute(sql`
        SELECT id FROM users WHERE tenant_id = ${tenantId} AND role IN ('admin','account_owner','user') LIMIT 10
      `);
      if (members.rows.length > 0) {
        const pick = (members.rows[Math.floor(Math.random() * members.rows.length)] as any).id;
        await db.update(leads).set({ createdBy: pick, updatedAt: new Date() })
          .where(and(eq(leads.id, leadId), eq(leads.tenantId, tenantId)));
        return { status: "success", detail: "Lead assigned via round-robin" };
      }
    }
    return { status: "skipped", detail: "No leadId — assignment skipped" };
  }

  // ── Add Tag (appended to contact/lead notes) ───────────────────────────
  if (type === "add_tag") {
    const tag = c.tag || "auto";
    const contactId = ctx.contactId || c.contactId;
    const leadId    = ctx.leadId    || c.leadId;
    if (contactId) {
      await db.execute(sql`
        UPDATE contacts SET notes = COALESCE(notes,'') || ${` [tag:${tag}]`}, updated_at = now()
        WHERE id = ${contactId} AND tenant_id = ${tenantId}
      `);
      return { status: "success", detail: `Tag "${tag}" added to contact` };
    }
    if (leadId) {
      await db.execute(sql`
        UPDATE leads SET notes = COALESCE(notes,'') || ${` [tag:${tag}]`}, updated_at = now()
        WHERE id = ${leadId} AND tenant_id = ${tenantId}
      `);
      return { status: "success", detail: `Tag "${tag}" added to lead` };
    }
    return { status: "skipped", detail: "No contact or lead ID for tagging" };
  }

  // ── Update Contact ───────────────────────────────────────────────────────
  if (type === "update_contact") {
    const contactId = ctx.contactId || c.contactId;
    if (contactId) {
      const upd: any = { updatedAt: new Date() };
      if (c.notes) upd.notes = c.notes;
      if (c.company) upd.company = c.company;
      if (c.phone) upd.phone = c.phone;
      await db.update(contacts).set(upd)
        .where(and(eq(contacts.id, contactId), eq(contacts.tenantId, tenantId)));
      return { status: "success", detail: "Contact updated" };
    }
    return { status: "skipped", detail: "No contactId provided" };
  }

  // ── Create Invoice Task ──────────────────────────────────────────────────
  if (type === "create_invoice_task") {
    const title = interpolate(c.title || "Follow up on invoice {{invoice.number}}", ctx);
    await db.insert(tasks).values({
      tenantId, userId, createdBy: userId,
      title, priority: c.priority || "high", status: "pending", type: "follow_up",
    });
    return { status: "success", detail: `Invoice task created: "${title}"` };
  }

  return { status: "simulated", detail: `Action "${type}" acknowledged` };
}

// ── CRM Event hook — called by other routes ───────────────────────────────
export async function fireWorkflowEvent(
  tenantId: string,
  triggerType: string,
  context: Record<string, any>,
  userId?: string
): Promise<void> {
  try {
    await ensureTables();
    const rows = await db.execute(sql`
      SELECT * FROM crm_workflows
      WHERE tenant_id = ${tenantId} AND trigger_type = ${triggerType} AND is_active = true
    `);
    for (const wf of rows.rows as any[]) {
      const conditions: any[] = typeof wf.conditions === "string" ? JSON.parse(wf.conditions) : (wf.conditions || []);
      const actions:    any[] = typeof wf.actions    === "string" ? JSON.parse(wf.actions)    : (wf.actions    || []);
      if (!evaluateConditions(conditions, context)) continue;
      const execId = userId || wf.created_by;
      if (wf.execution_mode === "supervised") {
        for (let i = 0; i < actions.length; i++) {
          const a = actions[i];
          await db.execute(sql`
            INSERT INTO crm_workflow_approvals
              (tenant_id, workflow_id, workflow_name, action_index, action_type, action_config, context_data)
            VALUES
              (${tenantId}, ${wf.id}, ${wf.name}, ${i}, ${a.type},
               ${JSON.stringify(a.config || {})}::jsonb, ${JSON.stringify(context)}::jsonb)
          `);
        }
      } else {
        for (const a of actions) {
          await executeAction(a, tenantId, execId, context).catch(e =>
            console.error(`[workflow] action ${a.type} error:`, e.message)
          );
        }
      }
      await db.execute(sql`
        UPDATE crm_workflows SET run_count = run_count + 1, last_run_at = now() WHERE id = ${wf.id}
      `);
    }
  } catch (e: any) {
    console.error("[workflow] fireWorkflowEvent error:", e.message);
  }
}

// ── Scheduled trigger evaluator ────────────────────────────────────────────
async function evaluateScheduledTriggers() {
  try {
    await ensureTables();

    // deal_inactive — deals with no activity for N days
    const inactiveRows = await db.execute(sql`
      SELECT DISTINCT w.id, w.tenant_id, w.trigger_config, w.created_by
      FROM crm_workflows w
      WHERE w.trigger_type = 'deal_inactive' AND w.is_active = true
    `);
    for (const wf of inactiveRows.rows as any[]) {
      const cfg = typeof wf.trigger_config === "string" ? JSON.parse(wf.trigger_config) : (wf.trigger_config || {});
      const days = parseInt(cfg.inactiveDays || "7");
      const cutoff = new Date(Date.now() - days * 86_400_000);
      const stale = await db.execute(sql`
        SELECT id, title, owner_id FROM deals
        WHERE tenant_id = ${wf.tenant_id} AND status = 'open' AND updated_at < ${cutoff.toISOString()}
        LIMIT 20
      `);
      for (const d of stale.rows as any[]) {
        await fireWorkflowEvent(wf.tenant_id, "deal_inactive", {
          dealId: d.id, dealName: d.title,
          "deal.name": d.title, "deal.id": d.id,
        }, d.owner_id || wf.created_by);
      }
    }

    // invoice_overdue — invoices past due date not yet paid
    const overdueRows = await db.execute(sql`
      SELECT DISTINCT w.id, w.tenant_id, w.trigger_config, w.created_by
      FROM crm_workflows w
      WHERE w.trigger_type = 'invoice_overdue' AND w.is_active = true
    `);
    for (const wf of overdueRows.rows as any[]) {
      const cfg = typeof wf.trigger_config === "string" ? JSON.parse(wf.trigger_config) : (wf.trigger_config || {});
      const daysOverdue = parseInt(cfg.daysOverdue || "14");
      const cutoff = new Date(Date.now() - daysOverdue * 86_400_000);
      const invs = await db.execute(sql`
        SELECT id, number, created_by FROM invoices
        WHERE tenant_id::text = ${wf.tenant_id}
          AND status != 'paid' AND due_date IS NOT NULL AND due_date < ${cutoff.toISOString()}
        LIMIT 20
      `);
      for (const inv of invs.rows as any[]) {
        await fireWorkflowEvent(wf.tenant_id, "invoice_overdue", {
          invoiceId: inv.id, invoiceNumber: inv.number,
          "invoice.number": inv.number, "invoice.id": inv.id,
        }, inv.created_by || wf.created_by);
      }
    }

    // lead_score_updated — leads above threshold (checked periodically)
    const scoreRows = await db.execute(sql`
      SELECT DISTINCT w.id, w.tenant_id, w.trigger_config, w.created_by
      FROM crm_workflows w
      WHERE w.trigger_type = 'lead_score_updated' AND w.is_active = true
    `);
    for (const wf of scoreRows.rows as any[]) {
      const cfg = typeof wf.trigger_config === "string" ? JSON.parse(wf.trigger_config) : (wf.trigger_config || {});
      const minScore = parseInt(cfg.minScore || "80");
      const highScoreLeads = await db.execute(sql`
        SELECT id, first_name, last_name, email, score, created_by FROM leads
        WHERE tenant_id = ${wf.tenant_id} AND score >= ${minScore} AND status NOT IN ('converted','disqualified')
        LIMIT 10
      `);
      for (const lead of highScoreLeads.rows as any[]) {
        await fireWorkflowEvent(wf.tenant_id, "lead_score_updated", {
          leadId: lead.id, score: lead.score,
          "lead.name": [lead.first_name, lead.last_name].filter(Boolean).join(" "),
          "lead.score": lead.score, "lead.email": lead.email,
        }, lead.created_by || wf.created_by);
      }
    }

  } catch (e: any) {
    console.error("[WorkflowScheduler] evaluate error:", e.message);
  }
}

export function startWorkflowScheduler() {
  evaluateScheduledTriggers(); // run once at startup
  setInterval(evaluateScheduledTriggers, 30 * 60 * 1000); // every 30 min
  console.log("[WorkflowScheduler] started — checking every 30 minutes");
}

// ── REST routes ────────────────────────────────────────────────────────────

// List workflows
router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    await ensureTables();
    const rows = await db.execute(sql`
      SELECT * FROM crm_workflows WHERE tenant_id = ${req.user!.tenantId} ORDER BY created_at DESC
    `);
    res.json(rows.rows || []);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Pending approvals
router.get("/approvals", authenticate, async (req: AuthRequest, res) => {
  try {
    await ensureTables();
    const status = (req.query.status as string) || "pending";
    const rows = await db.execute(sql`
      SELECT * FROM crm_workflow_approvals
      WHERE tenant_id = ${req.user!.tenantId} AND status = ${status}
      ORDER BY created_at DESC LIMIT 50
    `);
    res.json(rows.rows || []);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Approve
router.patch("/approvals/:id/approve", authenticate, async (req: AuthRequest, res) => {
  try {
    await ensureTables();
    const rows = await db.execute(sql`
      SELECT * FROM crm_workflow_approvals
      WHERE id = ${req.params.id} AND tenant_id = ${req.user!.tenantId} AND status = 'pending'
    `);
    if (!rows.rows.length) return res.status(404).json({ error: "Approval not found or already resolved" });
    const ap = rows.rows[0] as any;
    const actionConfig = typeof ap.action_config === "string" ? JSON.parse(ap.action_config) : (ap.action_config || {});
    const contextData  = typeof ap.context_data  === "string" ? JSON.parse(ap.context_data)  : (ap.context_data  || {});
    const result = await executeAction(
      { type: ap.action_type, config: actionConfig },
      req.user!.tenantId, req.user!.id, contextData
    );
    await db.execute(sql`
      UPDATE crm_workflow_approvals
      SET status = 'approved', resolved_by = ${req.user!.id}, resolved_at = now(), notes = ${req.body.notes || null}
      WHERE id = ${req.params.id}
    `);
    await db.execute(sql`
      UPDATE crm_workflows SET run_count = run_count + 1, last_run_at = now() WHERE id = ${ap.workflow_id}
    `);
    res.json({ success: true, executed: result });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Reject
router.patch("/approvals/:id/reject", authenticate, async (req: AuthRequest, res) => {
  try {
    await ensureTables();
    const rows = await db.execute(sql`
      SELECT id FROM crm_workflow_approvals
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

// Create workflow
router.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    await ensureTables();
    const { name, description, triggerType, triggerConfig = {}, conditions = [], actions = [], executionMode = "auto", isActive = true } = req.body;
    if (!name || !triggerType) return res.status(400).json({ error: "name and triggerType required" });
    const rows = await db.execute(sql`
      INSERT INTO crm_workflows
        (tenant_id, name, description, trigger_type, trigger_config, conditions, actions, execution_mode, is_active, created_by)
      VALUES
        (${req.user!.tenantId}, ${name}, ${description || null}, ${triggerType},
         ${JSON.stringify(triggerConfig)}::jsonb, ${JSON.stringify(conditions)}::jsonb,
         ${JSON.stringify(actions)}::jsonb, ${executionMode}, ${isActive}, ${req.user!.id})
      RETURNING *
    `);
    res.status(201).json(rows.rows[0]);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Update workflow
router.put("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    await ensureTables();
    const { name, description, triggerType, triggerConfig, conditions, actions, executionMode, isActive } = req.body;
    const rows = await db.execute(sql`
      UPDATE crm_workflows SET
        name = COALESCE(${name || null}, name),
        description = COALESCE(${description || null}, description),
        trigger_type = COALESCE(${triggerType || null}, trigger_type),
        trigger_config = CASE WHEN ${triggerConfig ? JSON.stringify(triggerConfig) : null}::jsonb IS NULL THEN trigger_config ELSE ${triggerConfig ? JSON.stringify(triggerConfig) : "{}"}::jsonb END,
        conditions = CASE WHEN ${conditions ? JSON.stringify(conditions) : null}::jsonb IS NULL THEN conditions ELSE ${conditions ? JSON.stringify(conditions) : "[]"}::jsonb END,
        actions    = CASE WHEN ${actions    ? JSON.stringify(actions)    : null}::jsonb IS NULL THEN actions    ELSE ${actions    ? JSON.stringify(actions)    : "[]"}::jsonb END,
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

// Toggle active
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

// Toggle execution mode
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

// Delete workflow
router.delete("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    await ensureTables();
    await db.execute(sql`DELETE FROM crm_workflows WHERE id = ${req.params.id} AND tenant_id = ${req.user!.tenantId}`);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Manual run
router.post("/:id/run", authenticate, async (req: AuthRequest, res) => {
  try {
    await ensureTables();
    const rows = await db.execute(sql`
      SELECT * FROM crm_workflows WHERE id = ${req.params.id} AND tenant_id = ${req.user!.tenantId}
    `);
    if (!rows.rows.length) return res.status(404).json({ error: "Workflow not found" });
    const wf      = rows.rows[0] as any;
    const actions = typeof wf.actions === "string" ? JSON.parse(wf.actions) : (wf.actions || []);
    const mode    = wf.execution_mode || "auto";
    const context = req.body.context || {};

    if (mode === "supervised") {
      const approvalIds: string[] = [];
      for (let i = 0; i < actions.length; i++) {
        const a = actions[i];
        const inserted = await db.execute(sql`
          INSERT INTO crm_workflow_approvals
            (tenant_id, workflow_id, workflow_name, action_index, action_type, action_config, context_data)
          VALUES
            (${req.user!.tenantId}, ${wf.id}, ${wf.name}, ${i},
             ${a.type}, ${JSON.stringify(a.config || {})}::jsonb, ${JSON.stringify(context)}::jsonb)
          RETURNING id
        `);
        approvalIds.push((inserted.rows[0] as any).id);
      }
      await db.execute(sql`UPDATE crm_workflows SET run_count = run_count + 1, last_run_at = now() WHERE id = ${req.params.id}`);
      return res.json({
        success: true, mode: "supervised",
        message: `${actions.length} action${actions.length !== 1 ? "s" : ""} queued for approval`,
        approvalIds,
      });
    }

    // Auto mode — execute immediately
    const results: any[] = [];
    for (const a of actions) {
      const r = await executeAction(a, req.user!.tenantId, req.user!.id, context);
      results.push({ action: a.type, ...r });
    }
    await db.execute(sql`UPDATE crm_workflows SET run_count = run_count + 1, last_run_at = now() WHERE id = ${req.params.id}`);
    res.json({ success: true, mode: "auto", results });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// In-app notifications for current user
router.get("/notifications", authenticate, async (req: AuthRequest, res) => {
  try {
    await ensureTables();
    const rows = await db.execute(sql`
      SELECT * FROM crm_notifications
      WHERE tenant_id = ${req.user!.tenantId}
        AND (user_id IS NULL OR user_id = ${req.user!.id})
        AND is_read = false
      ORDER BY created_at DESC LIMIT 30
    `);
    res.json(rows.rows || []);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch("/notifications/:id/read", authenticate, async (req: AuthRequest, res) => {
  try {
    await ensureTables();
    await db.execute(sql`
      UPDATE crm_notifications SET is_read = true WHERE id = ${req.params.id} AND tenant_id = ${req.user!.tenantId}
    `);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Workflow templates
router.get("/templates", authenticate, async (_req, res) => {
  res.json([
    {
      name: "Stale Deal Alert",
      description: "Notify + create follow-up task when a deal has no activity for 7 days",
      triggerType: "deal_inactive",
      triggerConfig: { inactiveDays: 7 },
      executionMode: "auto",
      conditions: [{ field: "stage", operator: "not_in", value: "won,lost" }],
      actions: [
        { type: "send_notification", config: { message: "Deal {{deal.name}} has been inactive for 7 days", recipient: "deal_owner" } },
        { type: "create_task", config: { title: "Follow up on stale deal: {{deal.name}}", priority: "high", dueDays: 1 } },
      ],
    },
    {
      name: "New Lead Auto-Assign",
      description: "Round-robin assign new leads and create a call task automatically",
      triggerType: "lead_created",
      executionMode: "auto",
      conditions: [],
      actions: [
        { type: "assign_lead", config: { method: "round_robin" } },
        { type: "create_task", config: { title: "Call new lead: {{lead.name}}", priority: "high", type: "call", dueDays: 1 } },
      ],
    },
    {
      name: "Deal Won — Onboarding",
      description: "Notify the team and create an onboarding task when a deal is won",
      triggerType: "deal_stage_changed",
      triggerConfig: { toStage: "won" },
      executionMode: "auto",
      conditions: [],
      actions: [
        { type: "send_notification", config: { message: "Deal {{deal.name}} has been won!", recipient: "all_team" } },
        { type: "create_task", config: { title: "Onboarding kickoff for {{deal.name}}", priority: "high", type: "meeting", dueDays: 3 } },
      ],
    },
    {
      name: "High-Value Lead Escalation",
      description: "Queue escalation actions for manager review when a lead scores 80+",
      triggerType: "lead_score_updated",
      triggerConfig: { minScore: 80 },
      executionMode: "supervised",
      conditions: [{ field: "score", operator: "gte", value: 80 }],
      actions: [
        { type: "assign_lead", config: { method: "to_manager" } },
        { type: "send_email", config: { subject: "High-value lead: {{lead.name}}", body: "Lead {{lead.name}} scored {{lead.score}}. Please review." } },
      ],
    },
    {
      name: "Invoice Overdue Follow-up",
      description: "Create urgent task + notify when an invoice is 14+ days overdue",
      triggerType: "invoice_overdue",
      triggerConfig: { daysOverdue: 14 },
      executionMode: "auto",
      conditions: [],
      actions: [
        { type: "create_task", config: { title: "Follow up on overdue invoice {{invoice.number}}", priority: "urgent", type: "email", dueDays: 0 } },
        { type: "send_notification", config: { message: "Invoice {{invoice.number}} is 14+ days overdue" } },
      ],
    },
    {
      name: "Welcome New Contact",
      description: "Send a welcome email when a new contact is added to the CRM",
      triggerType: "contact_created",
      executionMode: "supervised",
      conditions: [],
      actions: [
        { type: "send_email", config: { subject: "Welcome!", body: "Hi {{contact.name}},\n\nThank you for connecting with us. We look forward to working with you." } },
      ],
    },
  ]);
});

export default router;
