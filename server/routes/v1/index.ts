/**
 * /api/v1/* — versioned, API-key authenticated public API (§8.6).
 *
 * Mirrors a curated subset of internal routes for external integration
 * (Zapier, custom integrations, white-label clients). Authenticates via
 * Bearer API key; emits webhook events on mutations.
 *
 * Endpoints kept narrow and stable on purpose. Add to v2 rather than
 * mutating v1 contracts.
 */
import { Router } from "express";
import { z } from "zod";
import { authenticateApiKey, requireScope, type ApiKeyRequest } from "../../middleware/api-key.js";
import { dispatchEvent } from "../../services/webhooks.js";
import * as storage from "../../storage.js";
import { convene, getDecision, listDecisions, BUILTIN_TOPICS } from "../../services/council/index.js";

const router = Router();
router.use(authenticateApiKey);

// ─── Health ─────────────────────────────────────────────────────
router.get("/health", (_req, res) => {
  res.json({ status: "ok", version: "v1", timestamp: new Date().toISOString() });
});

// ─── OpenAPI spec (minimal hand-written; full generation is a follow-up) ────
router.get("/openapi.json", (_req, res) => {
  res.json({
    openapi: "3.1.0",
    info: { title: "Argilette CRM Public API", version: "1.0.0", description: "Versioned REST API for external integrations." },
    servers: [{ url: "/api/v1" }],
    components: {
      securitySchemes: {
        BearerAuth: { type: "http", scheme: "bearer", bearerFormat: "argi_<key>" },
      },
    },
    security: [{ BearerAuth: [] }],
    paths: {
      "/health":               { get: { summary: "Health check", responses: { "200": { description: "OK" } } } },
      "/contacts":             { get: { summary: "List contacts", parameters: [{ name: "limit", in: "query" }, { name: "search", in: "query" }] }, post: { summary: "Create contact" } },
      "/contacts/{id}":        { get: { summary: "Get contact" }, put: { summary: "Update contact" }, delete: { summary: "Delete contact" } },
      "/leads":                { get: { summary: "List leads" }, post: { summary: "Create lead" } },
      "/deals":                { get: { summary: "List deals" }, post: { summary: "Create deal" } },
      "/council/decisions":    { get: { summary: "List council decisions" }, post: { summary: "Convene a council decision" } },
      "/council/decisions/{id}": { get: { summary: "Get council decision" } },
      "/council/topics":       { get: { summary: "List built-in topics" } },
    },
  });
});

// ─── Contacts ──────────────────────────────────────────────────
router.get("/contacts", requireScope("contacts:read"), async (req: ApiKeyRequest, res) => {
  try {
    const result = await storage.getContacts(req.tenantId!, {
      search: req.query.search as string,
      limit: Math.min(Number(req.query.limit) || 50, 200),
      offset: Number(req.query.offset) || 0,
    });
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/contacts/:id", requireScope("contacts:read"), async (req: ApiKeyRequest, res) => {
  try {
    const contact = await storage.getContactById(req.params.id, req.tenantId!);
    if (!contact) return res.status(404).json({ error: "Contact not found" });
    res.json(contact);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post("/contacts", requireScope("contacts:write"), async (req: ApiKeyRequest, res) => {
  try {
    const contact = await storage.createContact({
      ...req.body, tenantId: req.tenantId!, createdBy: req.user!.id,
    });
    res.status(201).json(contact);
    dispatchEvent({ tenantId: req.tenantId!, event: "contact.created", payload: contact });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put("/contacts/:id", requireScope("contacts:write"), async (req: ApiKeyRequest, res) => {
  try {
    const contact = await storage.updateContact(req.params.id, req.tenantId!, req.body);
    res.json(contact);
    dispatchEvent({ tenantId: req.tenantId!, event: "contact.updated", payload: contact });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.delete("/contacts/:id", requireScope("contacts:write"), async (req: ApiKeyRequest, res) => {
  try {
    await storage.deleteContact(req.params.id, req.tenantId!);
    res.json({ deleted: true });
    dispatchEvent({ tenantId: req.tenantId!, event: "contact.deleted", payload: { id: req.params.id } });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── Leads ─────────────────────────────────────────────────────
router.get("/leads", requireScope("leads:read"), async (req: ApiKeyRequest, res) => {
  try {
    const result = await storage.getLeads(req.tenantId!, {
      search: req.query.search as string,
      limit: Math.min(Number(req.query.limit) || 50, 200),
    });
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post("/leads", requireScope("leads:write"), async (req: ApiKeyRequest, res) => {
  try {
    const lead = await storage.createLead({
      ...req.body, tenantId: req.tenantId!, createdBy: req.user!.id,
    });
    res.status(201).json(lead);
    dispatchEvent({ tenantId: req.tenantId!, event: "lead.created", payload: lead });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── Deals ─────────────────────────────────────────────────────
router.get("/deals", requireScope("deals:read"), async (req: ApiKeyRequest, res) => {
  try {
    const result = await storage.getDeals(req.tenantId!, { stage: req.query.stage as string });
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post("/deals", requireScope("deals:write"), async (req: ApiKeyRequest, res) => {
  try {
    const body = req.body;
    const deal = await storage.createDeal({
      ...body, title: body.name || body.title || "New Deal",
      tenantId: req.tenantId!, createdBy: req.user!.id,
    });
    res.status(201).json(deal);
    dispatchEvent({ tenantId: req.tenantId!, event: "deal.created", payload: deal });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── Council (decisions only — management is internal-UI) ─────────────
router.get("/council/topics", requireScope("council:read"), (_req, res) => {
  res.json(
    Object.entries(BUILTIN_TOPICS).map(([name, t]) => ({
      name, description: t.description, defaultMode: t.defaultMode,
      requiresManualApproval: t.requiresManualApproval, minPlan: t.minPlan,
    })),
  );
});

router.get("/council/decisions", requireScope("council:read"), async (req: ApiKeyRequest, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    res.json(await listDecisions(req.tenantId!, limit));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/council/decisions/:id", requireScope("council:read"), async (req: ApiKeyRequest, res) => {
  try {
    const d = await getDecision(req.params.id, req.tenantId!);
    if (!d) return res.status(404).json({ error: "Not found" });
    res.json(d);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post("/council/decisions", requireScope("council:write"), async (req: ApiKeyRequest, res) => {
  try {
    const schema = z.object({
      topic: z.string().min(1).max(80),
      mode: z.enum(["ensemble", "debate"]).optional(),
      inputs: z.record(z.any()),
    });
    const body = schema.parse(req.body);
    const result = await convene({
      tenantId: req.tenantId!,
      triggeredBy: req.user!.id,
      triggerSource: "api",
      topic: body.topic, mode: body.mode, inputs: body.inputs,
    });
    res.status(201).json(result);
    dispatchEvent({ tenantId: req.tenantId!, event: "council.decision.created", payload: result });
  } catch (err: any) {
    if (err?.code === "PLAN_UPGRADE_REQUIRED") {
      return res.status(402).json({
        error: err.message, code: err.code,
        currentPlan: err.currentPlan, requiredPlan: err.requiredPlan,
      });
    }
    if (err?.code === "COUNCIL_QUOTA_EXCEEDED") {
      return res.status(429).json({
        error: err.message, code: err.code, used: err.used, limit: err.limit,
      });
    }
    if (err.name === "ZodError") return res.status(400).json({ error: "Validation failed", details: err.errors });
    console.error("v1 POST /council/decisions:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
