/**
 * API key management routes (§8.6) — mounted at /api/api-keys.
 * Tenant-scoped, super_admin/admin only.
 *
 * Plaintext keys are returned ONCE on creation; afterwards only the
 * prefix is visible.
 */
import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import { authenticate, requireRole, type AuthRequest } from "../middleware/auth.js";
import { db } from "../db.js";
import { sql } from "drizzle-orm";

const router = Router();
router.use(authenticate);

const KNOWN_SCOPES = [
  "contacts:read", "contacts:write",
  "leads:read",    "leads:write",
  "deals:read",    "deals:write",
  "tasks:read",    "tasks:write",
  "accounts:read", "accounts:write",
  "invoices:read", "invoices:write",
  "council:read",  "council:write",
  "webhooks:read", "webhooks:write",
  "audit:read",
  "*", // wildcard — super_admin only
];

function generateApiKey(): { plaintext: string; prefix: string } {
  // Total format: argi_<8-char-prefix><40-char-random>
  const prefix = crypto.randomBytes(6).toString("base64url").slice(0, 8);
  const tail = crypto.randomBytes(30).toString("base64url");
  return { plaintext: `argi_${prefix}${tail}`, prefix };
}

// ─── GET /api/api-keys (tenant scope) ─────────────────────────────
router.get("/", requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
  try {
    const r = await db.execute(sql`
      SELECT id, name, prefix, scopes, last_used_at, revoked_at, created_at, created_by
      FROM api_keys
      WHERE tenant_id = ${req.user!.tenantId}
      ORDER BY created_at DESC
    `);
    res.json(r.rows);
  } catch (err: any) {
    console.error("GET /api-keys:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/api-keys (create) ───────────────────────────────────
router.post("/", requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      name: z.string().min(2).max(60),
      scopes: z.array(z.string()).min(1).refine(
        (arr) => arr.every(s => KNOWN_SCOPES.includes(s)),
        { message: `Unknown scope. Allowed: ${KNOWN_SCOPES.join(", ")}` },
      ),
    });
    const body = schema.parse(req.body);

    // Wildcard scope is super_admin only
    if (body.scopes.includes("*") && req.user!.role !== "super_admin") {
      return res.status(403).json({ error: "Only super_admin can create wildcard-scope keys" });
    }

    const { plaintext, prefix } = generateApiKey();
    const hashed = await bcrypt.hash(plaintext, 12);

    const r = await db.execute(sql`
      INSERT INTO api_keys (tenant_id, name, hashed_key, prefix, scopes, created_by)
      VALUES (${req.user!.tenantId}, ${body.name}, ${hashed}, ${prefix}, ${body.scopes}::text[], ${req.user!.id})
      RETURNING id, name, prefix, scopes, created_at
    `);
    const row = r.rows[0] as any;

    res.status(201).json({
      ...row,
      key: plaintext,
      message: "Save this key now — it will not be shown again. Use as: Authorization: Bearer <key>",
    });
  } catch (err: any) {
    if (err.name === "ZodError") return res.status(400).json({ error: "Validation failed", details: err.errors });
    console.error("POST /api-keys:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/api-keys/:id (revoke) ─────────────────────────────
router.delete("/:id", requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
  try {
    const r = await db.execute(sql`
      UPDATE api_keys
      SET revoked_at = now()
      WHERE id = ${req.params.id} AND tenant_id = ${req.user!.tenantId}
      RETURNING id
    `);
    if (r.rows.length === 0) return res.status(404).json({ error: "API key not found" });
    res.json({ revoked: true });
  } catch (err: any) {
    console.error("DELETE /api-keys/:id:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/api-keys/scopes (read-only catalog) ────────────────────
router.get("/scopes/list", (_req, res) => res.json(KNOWN_SCOPES));

export default router;
