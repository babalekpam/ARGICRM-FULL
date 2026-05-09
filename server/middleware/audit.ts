import { Request, Response, NextFunction } from "express";
import { db } from "../db.js";
import { sql } from "drizzle-orm";

// Fields whose values should never reach the audit_logs table.
const SENSITIVE_FIELDS = new Set([
  "password", "currentpassword", "newpassword", "passwordhash", "password_hash",
  "token", "jwt", "csrf", "secret", "apikey", "api_key",
  "stripesecretkey", "stripe_secret_key", "stripepublishablekey", "stripe_publishable_key",
  "smtp", "pass", "smtp_pass", "totp_secret", "mfa_recovery_codes",
  "authorization", "cookie",
]);

function redact(obj: any, depth = 0): any {
  if (depth > 6) return "[truncated:depth]";
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.slice(0, 200).map(v => redact(v, depth + 1));
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.has(k.toLowerCase())) {
      out[k] = "[REDACTED]";
    } else {
      out[k] = redact(v, depth + 1);
    }
  }
  return out;
}

function deriveActionAndEntity(method: string, path: string): {
  action: string; entity: string; entityId: string | null;
} {
  const parts = path.replace(/^\/api\//, "").split("/").filter(Boolean);
  const entity = parts[0] || "unknown";
  // Heuristic: the second segment is an id if it's >= 8 chars (uuid-ish) or all digits
  let entityId: string | null = null;
  if (parts.length >= 2 && (parts[1].length >= 8 || /^\d+$/.test(parts[1]))) {
    entityId = parts[1];
  }

  let action = "unknown";
  switch (method.toUpperCase()) {
    case "POST":   action = entityId ? (parts[2] || "action") : "create"; break;
    case "PUT":
    case "PATCH":  action = "update"; break;
    case "DELETE": action = "delete"; break;
    case "GET":    action = path.includes("/export") ? "export" : "read"; break;
  }

  // Auth events are first-class
  if (entity === "auth") {
    if (path.includes("login"))    action = "login";
    else if (path.includes("logout")) action = "logout";
    else if (path.includes("register")) action = "register";
    else if (path.includes("password")) action = "password_change";
    else if (path.includes("invite"))   action = "invite_user";
  }

  return { action, entity, entityId };
}

// Routes that should never produce an audit row (high-volume / not security-relevant).
const SKIP_PATHS = [
  "/api/health",
  "/api/me",
  "/api/auth/me",
];
const SKIP_PREFIXES = [
  "/api/email/track/", // open/click pixels
  "/api/public/",
  "/api/sign/",
];

export async function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  const method = req.method.toUpperCase();

  // Only audit mutations + auth events. (Reads/exports of CRM data are
  // important too but would 10x the table volume; we surface them as a
  // follow-up via dedicated export-tracking when those endpoints land.)
  const isMutation = method === "POST" || method === "PUT" ||
                     method === "PATCH" || method === "DELETE";
  const isExport = method === "GET" && req.path.includes("/export");
  if (!isMutation && !isExport) return next();

  if (SKIP_PATHS.includes(req.path)) return next();
  if (SKIP_PREFIXES.some(p => req.path.startsWith(p))) return next();

  const startTime = Date.now();
  // Snapshot the request body NOW (handler may mutate it).
  const requestBody = redact(req.body);
  const { action, entity, entityId } = deriveActionAndEntity(method, req.path);

  res.on("finish", () => {
    // req.user is populated by `authenticate` if it ran on this route.
    const u = (req as any).user;
    const tenantId = u?.tenantId || null;
    const actorUserId = u?.id || null;
    const auth = req.headers.authorization;
    const actorType =
      auth && auth.startsWith("Bearer ") ? "user_or_api" :
      u ? "user" : "anonymous";

    // Best-effort insert; never block the response on logging failures.
    db.execute(sql`
      INSERT INTO audit_logs
        (tenant_id, actor_user_id, actor_type, action, entity, entity_id,
         method, path, status_code, ip, user_agent, request_body, latency_ms)
      VALUES
        (${tenantId}, ${actorUserId}, ${actorType}, ${action}, ${entity}, ${entityId},
         ${method}, ${req.path}, ${res.statusCode},
         ${(req.ip || req.headers["x-forwarded-for"] || null) as any},
         ${(req.headers["user-agent"] || null) as any},
         ${JSON.stringify(requestBody)}::jsonb,
         ${Date.now() - startTime})
    `).catch(e => console.warn("[AUDIT] insert failed:", String(e?.message || e).slice(0, 100)));
  });

  next();
}
