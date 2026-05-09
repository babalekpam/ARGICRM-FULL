/**
 * API key authentication middleware (§8.6).
 *
 * Authenticates requests using an Authorization: Bearer <key> header where
 * <key> is a plaintext API key in the format `argi_<prefix><random>`. The
 * prefix lets us look up the row efficiently; we then bcrypt.compare the
 * full plaintext against the stored hash.
 *
 * On success, populates req.user and req.tenantId so downstream handlers can
 * use the same code paths as session-authenticated routes. Also bumps
 * api_keys.last_used_at (best-effort, fire-and-forget).
 */
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { db } from "../db.js";
import { sql } from "drizzle-orm";

export interface ApiKeyRequest extends Request {
  user?: {
    id: string;          // synthetic 'api_key:<id>' for audit attribution
    tenantId: string;
    email: string;       // 'api-key+<name>@<tenant>'
    role: string;        // 'api_key'
    permissions: string[]; // = scopes
  };
  tenantId?: string;
  apiKey?: { id: string; tenantId: string; scopes: string[]; name: string };
}

/**
 * Resolves a Bearer key to its api_keys row. Returns null on miss.
 * Uses the prefix (first 8 chars after `argi_`) for an indexed lookup.
 */
async function resolveApiKey(plaintext: string) {
  if (!plaintext.startsWith("argi_")) return null;
  const body = plaintext.slice(5);
  if (body.length < 16) return null;
  const prefix = body.slice(0, 8);

  const r = await db.execute(sql`
    SELECT id, tenant_id, name, hashed_key, scopes, revoked_at
    FROM api_keys
    WHERE prefix = ${prefix} AND revoked_at IS NULL
    LIMIT 5
  `);
  // Multiple rows possible only if collisions; check them all.
  for (const row of r.rows as any[]) {
    const ok = await bcrypt.compare(plaintext, row.hashed_key);
    if (ok) {
      return {
        id: String(row.id),
        tenantId: String(row.tenant_id),
        name: String(row.name),
        scopes: (row.scopes || []) as string[],
      };
    }
  }
  return null;
}

export async function authenticateApiKey(req: ApiKeyRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing Bearer token. Provide Authorization: Bearer argi_<your-key>." });
  }
  const key = auth.slice(7).trim();

  try {
    const row = await resolveApiKey(key);
    if (!row) return res.status(401).json({ error: "Invalid or revoked API key" });

    req.apiKey = row;
    req.tenantId = row.tenantId;
    req.user = {
      id: `api_key:${row.id}`,
      tenantId: row.tenantId,
      email: `api-key+${row.name.replace(/[^a-zA-Z0-9._-]/g, "_")}@argilette`,
      role: "api_key",
      permissions: row.scopes,
    };

    // Best-effort touch of last_used_at — don't await.
    db.execute(sql`UPDATE api_keys SET last_used_at = now() WHERE id = ${row.id}`)
      .catch(() => { /* ignore */ });

    next();
  } catch (err: any) {
    console.error("[API_KEY] auth error:", err);
    res.status(500).json({ error: "Authentication failed" });
  }
}

/** Requires the API key to have all listed scopes. */
export function requireScope(...scopes: string[]) {
  return (req: ApiKeyRequest, res: Response, next: NextFunction) => {
    if (!req.apiKey) return res.status(401).json({ error: "Not authenticated" });
    const has = (s: string) => req.apiKey!.scopes.includes(s) || req.apiKey!.scopes.includes("*");
    if (!scopes.every(has)) {
      return res.status(403).json({
        error: `API key missing required scope(s): ${scopes.join(", ")}`,
        required: scopes,
        has: req.apiKey.scopes,
      });
    }
    next();
  };
}
