/**
 * Webhook endpoint management (§8.6) — mounted at /api/webhooks.
 * Tenant-scoped, super_admin/admin only for management; deliveries are
 * read-only for visibility.
 */
import { Router } from "express";
import { z } from "zod";
import { authenticate, requireRole, type AuthRequest } from "../middleware/auth.js";
import { db } from "../db.js";
import { sql } from "drizzle-orm";
import { generateWebhookSecret, dispatchEvent } from "../services/webhooks.js";

const router = Router();
router.use(authenticate);

const SUPPORTED_EVENTS = [
  "contact.created", "contact.updated", "contact.deleted",
  "lead.created", "lead.updated", "lead.converted",
  "deal.created", "deal.updated", "deal.won", "deal.lost",
  "invoice.created", "invoice.paid",
  "council.decision.created", "council.decision.applied", "council.decision.rejected",
  "user.invited", "user.role_changed",
];

// ─── GET /api/webhooks (list endpoints) ────────────────────────────
router.get("/", requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
  try {
    const r = await db.execute(sql`
      SELECT id, url, events, is_active, last_success_at, last_failure_at,
             failure_count, created_at
      FROM webhook_endpoints
      WHERE tenant_id = ${req.user!.tenantId}
      ORDER BY created_at DESC
    `);
    res.json(r.rows);
  } catch (err: any) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ─── POST /api/webhooks (create endpoint) ─────────────────────────
router.post("/", requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      url: z.string().url().refine(
        (u) => u.startsWith("https://") || process.env.NODE_ENV !== "production",
        { message: "Webhook URL must use https:// in production" },
      ),
      events: z.array(z.string()).default([]).refine(
        (arr) => arr.every(e => SUPPORTED_EVENTS.includes(e)),
        { message: `Unknown event. Supported: ${SUPPORTED_EVENTS.join(", ")}` },
      ),
    });
    const body = schema.parse(req.body);

    const secret = generateWebhookSecret();
    const r = await db.execute(sql`
      INSERT INTO webhook_endpoints (tenant_id, url, events, secret, created_by)
      VALUES (${req.user!.tenantId}, ${body.url}, ${body.events}::text[],
              ${secret}, ${req.user!.id})
      RETURNING id, url, events, is_active, created_at
    `);
    const row = r.rows[0] as any;
    res.status(201).json({
      ...row,
      secret,
      message: "Save the secret now — it won't be shown again. Use it to verify the X-Argilette-Signature header.",
    });
  } catch (err: any) {
    if (err.name === "ZodError") return res.status(400).json({ error: "Validation failed", details: err.errors });
    console.error("POST /webhooks:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/webhooks/:id (update events list / active flag) ───────────
router.put("/:id", requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      events: z.array(z.string()).optional(),
      isActive: z.boolean().optional(),
    });
    const body = schema.parse(req.body);

    if (body.events && !body.events.every(e => SUPPORTED_EVENTS.includes(e))) {
      return res.status(400).json({ error: `Unknown event in list` });
    }

    const r = await db.execute(sql`
      UPDATE webhook_endpoints
      SET events = COALESCE(${body.events as any}::text[], events),
          is_active = COALESCE(${body.isActive as any}::boolean, is_active),
          failure_count = CASE WHEN ${body.isActive as any}::boolean = true THEN 0 ELSE failure_count END
      WHERE id = ${req.params.id} AND tenant_id = ${req.user!.tenantId}
      RETURNING id, url, events, is_active
    `);
    if (r.rows.length === 0) return res.status(404).json({ error: "Webhook not found" });
    res.json(r.rows[0]);
  } catch (err: any) {
    if (err.name === "ZodError") return res.status(400).json({ error: "Validation failed", details: err.errors });
    console.error("PUT /webhooks/:id:", err); res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/webhooks/:id ──────────────────────────────────────
router.delete("/:id", requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
  try {
    const r = await db.execute(sql`
      DELETE FROM webhook_endpoints
      WHERE id = ${req.params.id} AND tenant_id = ${req.user!.tenantId}
      RETURNING id
    `);
    if (r.rows.length === 0) return res.status(404).json({ error: "Webhook not found" });
    res.json({ deleted: true });
  } catch (err: any) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ─── POST /api/webhooks/:id/test (fire a test event) ──────────────────
router.post("/:id/test", requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
  try {
    const r = await db.execute(sql`
      SELECT id FROM webhook_endpoints
      WHERE id = ${req.params.id} AND tenant_id = ${req.user!.tenantId}
    `);
    if (r.rows.length === 0) return res.status(404).json({ error: "Webhook not found" });

    // Fire-and-forget: dispatch a synthetic event
    dispatchEvent({
      tenantId: req.user!.tenantId,
      event: "test.ping",
      payload: { message: "This is a test ping from Argilette CRM", at: new Date().toISOString() },
    });
    res.json({ queued: true, message: "Test event dispatched. Check delivery status in /api/webhooks/deliveries." });
  } catch (err: any) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ─── GET /api/webhooks/deliveries (recent deliveries for tenant) ──────────
router.get("/deliveries", requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const r = await db.execute(sql`
      SELECT d.id, d.endpoint_id, e.url AS endpoint_url, d.event, d.status,
             d.attempts, d.last_status_code, d.last_attempt_at, d.delivered_at,
             d.created_at
      FROM webhook_deliveries d
      LEFT JOIN webhook_endpoints e ON e.id = d.endpoint_id
      WHERE d.tenant_id = ${req.user!.tenantId}
      ORDER BY d.created_at DESC
      LIMIT ${limit}
    `);
    res.json(r.rows);
  } catch (err: any) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ─── GET /api/webhooks/events (catalog) ─────────────────────────────
router.get("/events/list", (_req, res) => res.json(SUPPORTED_EVENTS));

export default router;
