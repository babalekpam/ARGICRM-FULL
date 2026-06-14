/**
 * Public Developer API — v1.
 *
 * Stable, key-authenticated REST surface over every object (built-in + custom),
 * driven by the metadata registry and the generic CRUD engine. Per-key rate
 * limiting, scope enforcement, pagination and batch create included.
 *
 *   Auth:   Authorization: Bearer <api_key>   (or  X-API-Key: <api_key>)
 *   Base:   /api/v1
 */
import { Router, type Response } from "express";
import rateLimit from "express-rate-limit";
import { authenticateApiKey, type ApiKeyRequest } from "../middleware/api-key-auth.js";
import { resolveDescriptor, listObjects } from "../platform/objects.js";
import { listRecords, getRecord, createRecord, updateRecord, deleteRecord } from "../platform/crud.js";
import type { ObjectDescriptor } from "../platform/registry.js";

const router = Router();

router.use(authenticateApiKey);

// Per-key rate limiting (default 100/min, overridable per key) — matches the
// documented public-API budget.
router.use(
  rateLimit({
    windowMs: 60_000,
    max: (req: ApiKeyRequest) => req.apiKey?.rateLimit ?? 100,
    keyGenerator: (req: ApiKeyRequest) => req.apiKey?.id ?? req.ip ?? "anon",
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Rate limit exceeded", code: "rate_limited" },
  }),
);

function hasScope(req: ApiKeyRequest, scope: string): boolean {
  const held = req.apiKey?.scopes ?? [];
  if (held.includes("*")) return true;
  const [resource] = scope.split(":");
  return held.includes(scope) || held.includes(`${resource}:*`);
}

function deny(res: Response, scope: string) {
  return res.status(403).json({ error: `Missing required scope: ${scope}`, code: "insufficient_scope" });
}

// ── Discovery ─────────────────────────────────────────────────────────────--
router.get("/objects", async (req: ApiKeyRequest, res) => {
  res.json({ data: await listObjects(req.tenantId!) });
});

// Resolve :object → descriptor for all record routes.
async function load(req: ApiKeyRequest, res: Response): Promise<ObjectDescriptor | null> {
  const d = await resolveDescriptor(req.tenantId!, req.params.object);
  if (!d) {
    res.status(404).json({ error: `Unknown object "${req.params.object}"`, code: "unknown_object" });
    return null;
  }
  return d;
}

// ── List ──────────────────────────────────────────────────────────────────--
router.get("/:object", async (req: ApiKeyRequest, res) => {
  try {
    const d = await load(req, res);
    if (!d) return;
    if (!hasScope(req, `${d.scope}:read`)) return deny(res, `${d.scope}:read`);

    const { limit, offset, search, sort, ...filters } = req.query as Record<string, any>;
    const result = await listRecords(d, req.tenantId!, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      search,
      sort,
      filters,
    });
    res.json(result);
  } catch (err) {
    console.error("[v1] list error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// ── Get one ─────────────────────────────────────────────────────────────────
router.get("/:object/:id", async (req: ApiKeyRequest, res) => {
  try {
    const d = await load(req, res);
    if (!d) return;
    if (!hasScope(req, `${d.scope}:read`)) return deny(res, `${d.scope}:read`);
    const row = await getRecord(d, req.params.id, req.tenantId!);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ data: row });
  } catch (err) {
    console.error("[v1] get error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// ── Create (single or batch of up to 60) ──────────────────────────────────--
router.post("/:object", async (req: ApiKeyRequest, res) => {
  try {
    const d = await load(req, res);
    if (!d) return;
    if (!hasScope(req, `${d.scope}:write`)) return deny(res, `${d.scope}:write`);

    if (Array.isArray(req.body)) {
      if (req.body.length > 60) return res.status(400).json({ error: "Batch limited to 60 records", code: "batch_too_large" });
      const created = [];
      for (const item of req.body) created.push(await createRecord(d, req.tenantId!, item, req.apiKey?.id));
      return res.status(201).json({ data: created });
    }

    const row = await createRecord(d, req.tenantId!, req.body, req.apiKey?.id);
    res.status(201).json({ data: row });
  } catch (err) {
    console.error("[v1] create error:", err);
    res.status(400).json({ error: (err as Error).message || "Create failed" });
  }
});

// ── Update ────────────────────────────────────────────────────────────────--
async function handleUpdate(req: ApiKeyRequest, res: Response) {
  try {
    const d = await load(req, res);
    if (!d) return;
    if (!hasScope(req, `${d.scope}:write`)) return deny(res, `${d.scope}:write`);
    const row = await updateRecord(d, req.params.id, req.tenantId!, req.body);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ data: row });
  } catch (err) {
    console.error("[v1] update error:", err);
    res.status(400).json({ error: (err as Error).message || "Update failed" });
  }
}
router.patch("/:object/:id", handleUpdate);
router.put("/:object/:id", handleUpdate);

// ── Delete ────────────────────────────────────────────────────────────────--
router.delete("/:object/:id", async (req: ApiKeyRequest, res) => {
  try {
    const d = await load(req, res);
    if (!d) return;
    if (!hasScope(req, `${d.scope}:write`)) return deny(res, `${d.scope}:write`);
    const ok = await deleteRecord(d, req.params.id, req.tenantId!);
    if (!ok) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("[v1] delete error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;
