/**
 * AI Council REST API — mounted at /api/council by server/routes.ts.
 *
 * All endpoints are tenant-scoped via the global authenticate middleware
 * applied at the top of this router. Tenant isolation is enforced in the
 * orchestrator (server/services/council/index.ts) by always passing
 * req.user!.tenantId into the storage queries.
 */
import { Router } from "express";
import { z } from "zod";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import {
  convene, getDecision, listDecisions, applyDecision, rejectDecision,
  BUILTIN_TOPICS,
} from "../services/council/index.js";

const router = Router();
router.use(authenticate);

// ─── Convene a council decision ────────────────────────────────
router.post("/decisions", async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      topic: z.string().min(1).max(80),
      mode: z.enum(["ensemble", "debate"]).optional(),
      inputs: z.record(z.any()),
      participants: z.array(z.object({
        kind: z.enum(["provider", "agent"]),
        name: z.string().min(1).max(60),
        weight: z.number().optional(),
      })).max(10).optional(),
    });
    const body = schema.parse(req.body);

    const result = await convene({
      tenantId: req.user!.tenantId,
      triggeredBy: req.user!.id,
      triggerSource: "ui",
      topic: body.topic,
      mode: body.mode,
      inputs: body.inputs,
      participants: body.participants,
    });
    res.status(201).json(result);
  } catch (err: any) {
    if (err.name === "ZodError") return res.status(400).json({ error: "Validation failed", details: err.errors });
    if (String(err?.message || "").startsWith("Unknown council topic")) {
      return res.status(400).json({ error: err.message });
    }
    console.error("POST /council/decisions:", err);
    res.status(500).json({ error: err.message || "Failed to convene council" });
  }
});

// ─── List recent decisions ──────────────────────────────────────
router.get("/decisions", async (req: AuthRequest, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const decisions = await listDecisions(req.user!.tenantId, limit);
    res.json(decisions);
  } catch (err: any) {
    console.error("GET /council/decisions:", err);
    res.status(500).json({ error: err.message || "Failed to list decisions" });
  }
});

// ─── Get a specific decision (full transcript) ────────────────────
router.get("/decisions/:id", async (req: AuthRequest, res) => {
  try {
    const decision = await getDecision(req.params.id, req.user!.tenantId);
    if (!decision) return res.status(404).json({ error: "Decision not found" });
    res.json(decision);
  } catch (err: any) {
    console.error("GET /council/decisions/:id:", err);
    res.status(500).json({ error: err.message || "Failed to load decision" });
  }
});

// ─── Apply a succeeded decision (human approval gate) ───────────────
router.post("/decisions/:id/apply", async (req: AuthRequest, res) => {
  try {
    const result = await applyDecision(req.params.id, req.user!.tenantId, req.user!.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to apply decision" });
  }
});

// ─── Reject a decision (human override) ─────────────────────────
router.post("/decisions/:id/reject", async (req: AuthRequest, res) => {
  try {
    const result = await rejectDecision(req.params.id, req.user!.tenantId, req.user!.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to reject decision" });
  }
});

// ─── List built-in topic templates ───────────────────────────────
router.get("/topics", (_req: AuthRequest, res) => {
  res.json(
    Object.entries(BUILTIN_TOPICS).map(([name, t]) => ({
      name,
      description: t.description,
      defaultMode: t.defaultMode,
      defaultParticipants: t.defaultParticipants,
      requiresManualApproval: t.requiresManualApproval,
      minPlan: t.minPlan,
    })),
  );
});

export default router;
