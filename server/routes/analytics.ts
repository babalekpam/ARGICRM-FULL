import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { db } from "../db.js";
import { deals, contacts, leads, users, tasks, activities } from "@shared/schema";
import { eq, and, sql, desc, gte, lte, count, sum, avg } from "drizzle-orm";

const router = Router();

const STAGE_WEIGHTS: Record<string, number> = {
  prospecting: 0.1,
  qualification: 0.2,
  proposal: 0.4,
  negotiation: 0.7,
  "closed_won": 1.0,
  "closed_lost": 0.0,
};

// ── Revenue Forecast ────────────────────────────────────────────
router.get("/forecast", authenticate, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;

    const allDeals = await db.select().from(deals)
      .where(and(eq(deals.tenantId, tenantId)));

    const byStage: Record<string, { count: number; total: number; weighted: number; deals: any[] }> = {};

    for (const deal of allDeals) {
      const stage = deal.stage || "prospecting";
      const value = Number(deal.value) || 0;
      const weight = STAGE_WEIGHTS[stage] ?? 0.1;
      if (!byStage[stage]) byStage[stage] = { count: 0, total: 0, weighted: 0, deals: [] };
      byStage[stage].count++;
      byStage[stage].total += value;
      byStage[stage].weighted += value * weight;
      byStage[stage].deals.push({ id: deal.id, name: deal.name, value, stage });
    }

    const totalPipeline = Object.values(byStage).reduce((s, v) => s + v.total, 0);
    const weightedForecast = Object.values(byStage).reduce((s, v) => s + v.weighted, 0);
    const closedWon = byStage["closed_won"]?.total || 0;

    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const wonDeals = allDeals.filter(d => d.stage === "closed_won" && d.closedAt && new Date(d.closedAt) >= sixMonthsAgo);
    const monthlyMap: Record<string, number> = {};
    for (const d of wonDeals) {
      const mo = new Date(d.closedAt!).toLocaleString("en-US", { month: "short", year: "2-digit" });
      monthlyMap[mo] = (monthlyMap[mo] || 0) + (Number(d.value) || 0);
    }

    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      months.push(d.toLocaleString("en-US", { month: "short", year: "2-digit" }));
    }
    const trend = months.map(m => ({ month: m, revenue: monthlyMap[m] || 0 }));

    res.json({
      totalPipeline,
      weightedForecast,
      closedWon,
      stageBreakdown: Object.entries(byStage).map(([stage, data]) => ({
        stage,
        ...data,
        probability: (STAGE_WEIGHTS[stage] ?? 0.1) * 100,
      })),
      trend,
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Win / Loss Analysis ─────────────────────────────────────────
router.get("/win-loss", authenticate, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;
    const allDeals = await db.select().from(deals)
      .where(and(eq(deals.tenantId, tenantId)));

    const closed = allDeals.filter(d => d.stage === "closed_won" || d.stage === "closed_lost");
    const won = closed.filter(d => d.stage === "closed_won");
    const lost = closed.filter(d => d.stage === "closed_lost");

    const winRate = closed.length > 0 ? Math.round((won.length / closed.length) * 100) : 0;
    const avgWonValue = won.length > 0 ? won.reduce((s, d) => s + Number(d.value || 0), 0) / won.length : 0;
    const avgLostValue = lost.length > 0 ? lost.reduce((s, d) => s + Number(d.value || 0), 0) / lost.length : 0;

    // Monthly win rate
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      months.push(d.toLocaleString("en-US", { month: "short", year: "2-digit" }));
    }

    const monthlyWinLoss = months.map(month => {
      const monthWon = won.filter(d => d.closedAt && new Date(d.closedAt).toLocaleString("en-US", { month: "short", year: "2-digit" }) === month);
      const monthLost = lost.filter(d => d.closedAt && new Date(d.closedAt).toLocaleString("en-US", { month: "short", year: "2-digit" }) === month);
      return { month, won: monthWon.length, lost: monthLost.length };
    });

    // By source
    const sourceMap: Record<string, { won: number; lost: number }> = {};
    for (const d of closed) {
      const src = d.source || "direct";
      if (!sourceMap[src]) sourceMap[src] = { won: 0, lost: 0 };
      if (d.stage === "closed_won") sourceMap[src].won++;
      else sourceMap[src].lost++;
    }

    res.json({
      summary: { total: closed.length, won: won.length, lost: lost.length, winRate, avgWonValue, avgLostValue },
      monthlyTrend: monthlyWinLoss,
      bySource: Object.entries(sourceMap).map(([source, data]) => ({
        source,
        ...data,
        winRate: data.won + data.lost > 0 ? Math.round((data.won / (data.won + data.lost)) * 100) : 0,
      })),
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Sales Velocity ──────────────────────────────────────────────
router.get("/velocity", authenticate, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;
    const allDeals = await db.select().from(deals).where(eq(deals.tenantId, tenantId));

    const won = allDeals.filter(d => d.stage === "closed_won" && d.createdAt && d.closedAt);
    const avgCycleLength = won.length > 0
      ? Math.round(won.reduce((s, d) => s + (new Date(d.closedAt!).getTime() - new Date(d.createdAt!).getTime()) / 86400000, 0) / won.length)
      : 0;

    const openDeals = allDeals.filter(d => d.stage !== "closed_won" && d.stage !== "closed_lost");
    const avgOpenAge = openDeals.length > 0
      ? Math.round(openDeals.reduce((s, d) => s + (Date.now() - new Date(d.createdAt!).getTime()) / 86400000, 0) / openDeals.length)
      : 0;

    // By stage avg days
    const stageOrder = ["prospecting", "qualification", "proposal", "negotiation"];
    const byStage = stageOrder.map(stage => {
      const stageDeals = allDeals.filter(d => d.stage === stage && d.createdAt);
      const avg = stageDeals.length > 0
        ? Math.round(stageDeals.reduce((s, d) => s + (Date.now() - new Date(d.createdAt!).getTime()) / 86400000, 0) / stageDeals.length)
        : 0;
      return { stage, avgDays: avg, count: stageDeals.length };
    });

    const totalPipeline = openDeals.reduce((s, d) => s + Number(d.value || 0), 0);
    const winRate = allDeals.filter(d => d.stage === "closed_won" || d.stage === "closed_lost").length > 0
      ? allDeals.filter(d => d.stage === "closed_won").length / allDeals.filter(d => d.stage === "closed_won" || d.stage === "closed_lost").length
      : 0;
    const avgDealValue = won.length > 0 ? won.reduce((s, d) => s + Number(d.value || 0), 0) / won.length : 0;
    const salesVelocity = avgCycleLength > 0 ? Math.round((openDeals.length * winRate * avgDealValue) / avgCycleLength) : 0;

    res.json({ avgCycleLength, avgOpenAge, byStage, totalPipeline, salesVelocity, openDeals: openDeals.length });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Rep Performance ─────────────────────────────────────────────
router.get("/rep-performance", authenticate, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;
    const [allDeals, allTasks, teamUsers] = await Promise.all([
      db.select().from(deals).where(eq(deals.tenantId, tenantId)),
      db.select().from(tasks).where(eq(tasks.tenantId, tenantId)),
      db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email, role: users.role })
        .from(users).where(and(eq(users.tenantId, tenantId), eq(users.isActive, true))),
    ]);

    const repMap: Record<string, {
      user: any; totalDeals: number; wonDeals: number; lostDeals: number;
      openDeals: number; totalValue: number; wonValue: number; tasksCompleted: number; tasksOpen: number;
    }> = {};

    for (const u of teamUsers) {
      repMap[u.id] = {
        user: u, totalDeals: 0, wonDeals: 0, lostDeals: 0, openDeals: 0,
        totalValue: 0, wonValue: 0, tasksCompleted: 0, tasksOpen: 0,
      };
    }

    for (const d of allDeals) {
      const assignedId = d.assignedTo || d.createdBy;
      if (!assignedId || !repMap[assignedId]) continue;
      repMap[assignedId].totalDeals++;
      repMap[assignedId].totalValue += Number(d.value || 0);
      if (d.stage === "closed_won") { repMap[assignedId].wonDeals++; repMap[assignedId].wonValue += Number(d.value || 0); }
      else if (d.stage === "closed_lost") repMap[assignedId].lostDeals++;
      else repMap[assignedId].openDeals++;
    }

    for (const t of allTasks) {
      if (!t.assignedTo || !repMap[t.assignedTo]) continue;
      if (t.status === "completed") repMap[t.assignedTo].tasksCompleted++;
      else repMap[t.assignedTo].tasksOpen++;
    }

    const reps = Object.values(repMap).map(r => ({
      ...r,
      winRate: (r.wonDeals + r.lostDeals) > 0 ? Math.round((r.wonDeals / (r.wonDeals + r.lostDeals)) * 100) : 0,
      activityScore: r.tasksCompleted * 10 + r.wonDeals * 25 + r.openDeals * 5,
    })).sort((a, b) => b.wonValue - a.wonValue);

    res.json({ reps });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Activity Summary ────────────────────────────────────────────
router.get("/activity-feed", authenticate, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user!.tenantId;
    const limit = Number(req.query.limit) || 30;

    const recentTasks = await db.select().from(tasks)
      .where(eq(tasks.tenantId, tenantId))
      .orderBy(desc(tasks.updatedAt))
      .limit(limit);

    const feed = recentTasks.map(t => ({
      id: t.id,
      type: "task",
      title: t.title,
      status: t.status,
      priority: t.priority,
      assignedTo: t.assignedTo,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    res.json(feed);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
