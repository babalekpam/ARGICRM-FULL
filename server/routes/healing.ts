import { Router } from "express";
import { authenticate, requireRole, type AuthRequest } from "../middleware/auth.js";
import { db } from "../db.js";
import { healthChecks, errorLogs, performanceMetrics } from "@shared/schema-extended";
import { eq, desc, and, sql, gte, lt } from "drizzle-orm";
import {
  runAllHealthChecks, runHealthCheck, getPerformanceSummary,
  logError, attemptAutoHeal, pauseHealing, resumeHealing, isHealingPaused
} from "../services/healing.js";

const router = Router();
const OWNER = process.env.PLATFORM_OWNER_EMAIL || "abel@argilette.com";

// ── Full system health ──────────────────────────────────────────
router.get("/health", authenticate, async (req: AuthRequest, res) => {
  const results = await runAllHealthChecks();
  const overall = Object.values(results).every((r: any) => r.status === "healthy") ? "healthy"
    : Object.values(results).some((r: any) => r.status === "critical") ? "critical" : "degraded";
  res.json({ overall, checks: results, timestamp: new Date().toISOString() });
});

// ── Single check ────────────────────────────────────────────────
router.get("/health/:type", authenticate, async (req: AuthRequest, res) => {
  const result = await runHealthCheck(req.params.type);
  res.json(result);
});

// ── Health history ──────────────────────────────────────────────
router.get("/health-history", authenticate, async (req: AuthRequest, res) => {
  const history = await db.select().from(healthChecks)
    .orderBy(desc(healthChecks.checkedAt))
    .limit(200);
  res.json(history);
});

// ── Error logs ──────────────────────────────────────────────────
router.get("/errors", authenticate, async (req: AuthRequest, res) => {
  const { severity, resolved, limit = "100" } = req.query as any;
  const errors = await db.select().from(errorLogs)
    .where(and(
      severity ? eq(errorLogs.severity, severity) : undefined,
      resolved !== undefined ? eq(errorLogs.resolved, resolved === "true") : undefined,
    ))
    .orderBy(desc(errorLogs.createdAt))
    .limit(Number(limit));
  res.json(errors);
});

// ── Manually trigger heal ───────────────────────────────────────
router.post("/errors/:id/heal", authenticate, requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
  const [error] = await db.select().from(errorLogs).where(eq(errorLogs.id, req.params.id));
  if (!error) return res.status(404).json({ error: "Error not found" });
  await attemptAutoHeal(error.id, error.message, error.category, error.stack);
  const [updated] = await db.select().from(errorLogs).where(eq(errorLogs.id, req.params.id));
  res.json(updated);
});

// ── Mark resolved ───────────────────────────────────────────────
router.put("/errors/:id/resolve", authenticate, async (req: AuthRequest, res) => {
  const [updated] = await db.update(errorLogs)
    .set({ resolved: true, resolvedAt: new Date(), resolvedBy: req.user!.id })
    .where(eq(errorLogs.id, req.params.id)).returning();
  res.json(updated);
});

// ── Performance metrics ─────────────────────────────────────────
router.get("/performance", authenticate, async (req: AuthRequest, res) => {
  const summary = await getPerformanceSummary();
  const recent = await db.select().from(performanceMetrics)
    .orderBy(desc(performanceMetrics.recordedAt))
    .limit(500);
  res.json({ summary, recent });
});

// ── Circuit breaker status ──────────────────────────────────────
router.get("/circuits", authenticate, async (req: AuthRequest, res) => {
  res.json(circuits);
});

// ── Reset circuit ───────────────────────────────────────────────
router.post("/circuits/:name/reset", authenticate, requireRole("super_admin", "admin", "platform_owner"), async (req: AuthRequest, res) => {
  const circuit = (circuits as any)[req.params.name];
  if (!circuit) return res.status(404).json({ error: "Circuit not found" });
  circuit.failures = 0;
  circuit.state = "closed";
  res.json({ success: true, message: `Circuit ${req.params.name} reset to CLOSED` });
});

// ── Error stats ─────────────────────────────────────────────────
router.get("/stats", authenticate, async (req: AuthRequest, res) => {
  const [total] = await db.select({ n: sql<number>`count(*)` }).from(errorLogs);
  const [unresolved] = await db.select({ n: sql<number>`count(*)` }).from(errorLogs).where(eq(errorLogs.resolved, false));
  const [autoHealed] = await db.select({ n: sql<number>`count(*)` }).from(errorLogs).where(eq(errorLogs.resolvedBy, "auto_healer"));

  const bySeverity = await db.select({ severity: errorLogs.severity, count: sql<number>`count(*)` })
    .from(errorLogs).groupBy(errorLogs.severity);

  const byCategory = await db.select({ category: errorLogs.category, count: sql<number>`count(*)` })
    .from(errorLogs).groupBy(errorLogs.category).orderBy(desc(sql`count(*)`));

  const perfSummary = await getPerformanceSummary();

  res.json({
    errors: { total: Number(total.n), unresolved: Number(unresolved.n), autoHealed: Number(autoHealed.n) },
    healingRate: total.n > 0 ? Math.round((Number(autoHealed.n) / Number(total.n)) * 100) : 0,
    bySeverity: bySeverity.map(s => ({ severity: s.severity, count: Number(s.count) })),
    byCategory: byCategory.map(c => ({ category: c.category, count: Number(c.count) })),
    performance: perfSummary,
    circuits: Object.entries(circuits).map(([name, c]) => ({ name, state: c.state, failures: c.failures })),
  });
});

// ── Healing system kill switch ──────────────────────────────────
router.post("/pause", authenticate, requireRole("super_admin", "admin", "platform_owner"), (req, res) => {
  pauseHealing();
  console.warn("[HEALING] System paused by admin:", (req as any).user?.email);
  res.json({ status: "paused", message: "Healing system paused. No auto-fixes will run until resumed." });
});

router.post("/resume", authenticate, requireRole("super_admin", "admin", "platform_owner"), (req, res) => {
  resumeHealing();
  console.log("[HEALING] System resumed by admin:", (req as any).user?.email);
  res.json({ status: "running", message: "Healing system resumed. Auto-fixes are active." });
});

router.get("/status", authenticate, (req, res) => {
  res.json({ paused: isHealingPaused(), status: isHealingPaused() ? "paused" : "running" });
});

export default router;
