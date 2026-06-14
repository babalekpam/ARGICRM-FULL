/**
 * API-key authentication for the public Developer API and the MCP server.
 *
 * Parallels middleware/auth.ts `authenticate`, but resolves an API key instead
 * of a JWT. On success it sets `req.tenantId` (so the tenant-scoped storage
 * layer works unchanged) plus `req.apiKey` with the key's scopes + limit.
 */
import { Response, NextFunction } from "express";
import { db } from "../db.js";
import { sql } from "drizzle-orm";
import { hashApiKey } from "../platform/keys.js";
import type { AuthRequest } from "./auth.js";

export interface ApiKeyContext {
  id: string;
  tenantId: string;
  name: string;
  scopes: string[];
  rateLimit: number;
}

export interface ApiKeyRequest extends AuthRequest {
  apiKey?: ApiKeyContext;
}

function extractKey(req: ApiKeyRequest): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7).trim();
  const x = req.headers["x-api-key"];
  if (typeof x === "string" && x) return x.trim();
  return null;
}

export async function authenticateApiKey(req: ApiKeyRequest, res: Response, next: NextFunction) {
  try {
    const key = extractKey(req);
    if (!key) return res.status(401).json({ error: "API key required", code: "missing_api_key" });

    const hash = hashApiKey(key);
    const result = await db.execute(sql`
      SELECT id, tenant_id, name, scopes, rate_limit, revoked_at, expires_at
      FROM api_keys
      WHERE key_hash = ${hash}
      LIMIT 1
    `);
    const row = (result.rows as any[])[0];

    if (!row) return res.status(401).json({ error: "Invalid API key", code: "invalid_api_key" });
    if (row.revoked_at) return res.status(401).json({ error: "API key revoked", code: "revoked_api_key" });
    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      return res.status(401).json({ error: "API key expired", code: "expired_api_key" });
    }

    req.tenantId = row.tenant_id;
    req.apiKey = {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      scopes: Array.isArray(row.scopes) ? row.scopes : [],
      rateLimit: row.rate_limit ?? 100,
    };

    // Best-effort last-used stamp; never blocks the request.
    void db.execute(sql`UPDATE api_keys SET last_used_at = now() WHERE id = ${row.id}`).catch(() => {});

    next();
  } catch (err) {
    console.error("[api-key-auth] error:", err);
    res.status(500).json({ error: "Authentication failed" });
  }
}

/**
 * Scope guard. A key satisfies a scope if it holds the exact scope, the
 * resource wildcard ("contacts:*"), or the global wildcard ("*").
 */
export function requireScope(...required: string[]) {
  return (req: ApiKeyRequest, res: Response, next: NextFunction) => {
    const held = req.apiKey?.scopes ?? [];
    if (held.includes("*")) return next();
    const ok = required.every((need) => {
      const [resource] = need.split(":");
      return held.includes(need) || held.includes(`${resource}:*`);
    });
    if (!ok) {
      return res.status(403).json({ error: `Missing required scope: ${required.join(", ")}`, code: "insufficient_scope" });
    }
    next();
  };
}
