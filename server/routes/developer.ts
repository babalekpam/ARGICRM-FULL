/**
 * Developer settings — manage API keys and webhook subscriptions.
 * JWT-authenticated (workspace admins), mounted at /api/developer.
 */
import { Router } from "express";
import { authenticate, requireRole, type AuthRequest } from "../middleware/auth.js";
import { db } from "../db.js";
import { sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import { z } from "zod";
import { generateApiKey } from "../platform/keys.js";
import { listApiScopes } from "../platform/registry.js";
import { WEBHOOK_EVENTS } from "../platform/webhooks.js";

const router = Router();
router.use(authenticate);

// ── Discovery ───────────────────────────────────────────────────────────────
router.get("/scopes", (_req, res) => {
  res.json({ scopes: listApiScopes(), events: WEBHOOK_EVENTS });
});

// ── API keys ──────────────────────────────────────────────────────────────--
router.get("/keys", async (req: AuthRequest, res) => {
  const rows = await db.execute(sql`
    SELECT id, name, prefix, last4, scopes, rate_limit, last_used_at, expires_at, revoked_at, created_at
    FROM api_keys WHERE tenant_id = ${req.tenantId} ORDER BY created_at DESC
  `);
  res.json(rows.rows);
});

const createKeySchema = z.object({
  name: z.string().min(1).max(120),
  scopes: z.array(z.string()).default(["*"]),
  expiresAt: z.string().datetime().optional(),
});

router.post("/keys", requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
  const parsed = createKeySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const { name, scopes, expiresAt } = parsed.data;

  const key = generateApiKey();
  const inserted = await db.execute(sql`
    INSERT INTO api_keys (tenant_id, name, key_hash, prefix, last4, scopes, expires_at, created_by)
    VALUES (${req.tenantId}, ${name}, ${key.hash}, ${key.prefix}, ${key.last4},
            ${sql`ARRAY[${sql.join(scopes.map((s) => sql`${s}`), sql`, `)}]::text[]`},
            ${expiresAt ?? null}, ${req.user!.id})
    RETURNING id, name, prefix, last4, scopes, created_at
  `);
  // Plaintext is returned exactly once — never stored.
  res.status(201).json({ ...(inserted.rows[0] as any), key: key.plaintext });
});

router.delete("/keys/:id", requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
  await db.execute(sql`
    UPDATE api_keys SET revoked_at = now()
    WHERE id = ${req.params.id} AND tenant_id = ${req.tenantId}
  `);
  res.json({ success: true });
});

// ── Webhooks ────────────────────────────────────────────────────────────────
router.get("/webhooks", async (req: AuthRequest, res) => {
  const rows = await db.execute(sql`
    SELECT id, url, events, is_active, description, created_at, updated_at
    FROM webhooks WHERE tenant_id = ${req.tenantId} ORDER BY created_at DESC
  `);
  res.json(rows.rows);
});

const createHookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(WEBHOOK_EVENTS as [string, ...string[]])).min(1),
  description: z.string().max(240).optional(),
});

router.post("/webhooks", requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
  const parsed = createHookSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const { url, events, description } = parsed.data;
  const secret = `whsec_${randomBytes(24).toString("base64url")}`;

  const inserted = await db.execute(sql`
    INSERT INTO webhooks (tenant_id, url, events, secret, description, created_by)
    VALUES (${req.tenantId}, ${url},
            ${sql`ARRAY[${sql.join(events.map((e) => sql`${e}`), sql`, `)}]::text[]`},
            ${secret}, ${description ?? null}, ${req.user!.id})
    RETURNING id, url, events, is_active, description, created_at
  `);
  // Signing secret shown once.
  res.status(201).json({ ...(inserted.rows[0] as any), secret });
});

const updateHookSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.enum(WEBHOOK_EVENTS as [string, ...string[]])).min(1).optional(),
  isActive: z.boolean().optional(),
  description: z.string().max(240).optional(),
});

router.put("/webhooks/:id", requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
  const parsed = updateHookSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const { url, events, isActive, description } = parsed.data;

  const sets = [sql`updated_at = now()`];
  if (url !== undefined) sets.push(sql`url = ${url}`);
  if (events !== undefined) sets.push(sql`events = ${sql`ARRAY[${sql.join(events.map((e) => sql`${e}`), sql`, `)}]::text[]`}`);
  if (isActive !== undefined) sets.push(sql`is_active = ${isActive}`);
  if (description !== undefined) sets.push(sql`description = ${description}`);

  const updated = await db.execute(sql`
    UPDATE webhooks SET ${sql.join(sets, sql`, `)}
    WHERE id = ${req.params.id} AND tenant_id = ${req.tenantId}
    RETURNING id, url, events, is_active, description, updated_at
  `);
  if (!updated.rows.length) return res.status(404).json({ error: "Webhook not found" });
  res.json(updated.rows[0]);
});

router.delete("/webhooks/:id", requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
  await db.execute(sql`DELETE FROM webhooks WHERE id = ${req.params.id} AND tenant_id = ${req.tenantId}`);
  res.json({ success: true });
});

router.get("/webhooks/:id/deliveries", async (req: AuthRequest, res) => {
  const rows = await db.execute(sql`
    SELECT id, event, status, attempts, response_status, delivered_at, next_retry_at, created_at
    FROM webhook_deliveries
    WHERE webhook_id = ${req.params.id} AND tenant_id = ${req.tenantId}
    ORDER BY created_at DESC LIMIT 50
  `);
  res.json(rows.rows);
});

export default router;
