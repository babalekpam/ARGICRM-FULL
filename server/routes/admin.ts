import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { db } from "../db.js";
import { tenants, users, contacts, leads, deals, agentSessions, agentMessages } from "@shared/schema";
import { eq, desc, sql, gte } from "drizzle-orm";

const router = Router();
const OWNER_EMAIL = process.env.PLATFORM_OWNER_EMAIL || "abel@argilette.com";

function requireOwner(req: AuthRequest, res: any, next: any) {
  if (req.user?.email !== OWNER_EMAIL) return res.status(403).json({ error: "Platform owner access required" });
  next();
}

// ── Platform overview ───────────────────────────────────────────
router.get("/overview", authenticate, requireOwner, async (req: AuthRequest, res) => {
  const [tenantCount] = await db.select({ n: sql<number>`count(*)` }).from(tenants);
  const [userCount] = await db.select({ n: sql<number>`count(*)` }).from(users);
  const [contactCount] = await db.select({ n: sql<number>`count(*)` }).from(contacts);
  const [leadCount] = await db.select({ n: sql<number>`count(*)` }).from(leads);
  const [dealStats] = await db.select({ count: sql<number>`count(*)`, revenue: sql<number>`coalesce(sum(value::numeric),0)` }).from(deals).where(eq(deals.stage, "closed_won"));
  const [sessionCount] = await db.select({ n: sql<number>`count(*)` }).from(agentSessions);
  const [messageCount] = await db.select({ n: sql<number>`count(*)` }).from(agentMessages);

  // New tenants in last 30 days
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const [newTenants] = await db.select({ n: sql<number>`count(*)` }).from(tenants).where(gte(tenants.createdAt, thirtyDaysAgo));

  // Plan distribution
  const planDist = await db.select({ plan: tenants.subscriptionPlan, count: sql<number>`count(*)` })
    .from(tenants).groupBy(tenants.subscriptionPlan);

  res.json({
    tenants: { total: Number(tenantCount.n), new30d: Number(newTenants.n) },
    users: Number(userCount.n),
    contacts: Number(contactCount.n),
    leads: Number(leadCount.n),
    deals: { won: Number(dealStats.count), revenue: Number(dealStats.revenue) },
    agents: { sessions: Number(sessionCount.n), messages: Number(messageCount.n) },
    plans: planDist.map(p => ({ plan: p.plan, count: Number(p.count) })),
  });
});

// ── All tenants ─────────────────────────────────────────────────
router.get("/tenants", authenticate, requireOwner, async (req: AuthRequest, res) => {
  const allTenants = await db.select().from(tenants).orderBy(desc(tenants.createdAt));

  const enriched = await Promise.all(allTenants.map(async t => {
    const [uc] = await db.select({ n: sql<number>`count(*)` }).from(users).where(eq(users.tenantId, t.id));
    const [cc] = await db.select({ n: sql<number>`count(*)` }).from(contacts).where(eq(contacts.tenantId, t.id));
    const [dc] = await db.select({ n: sql<number>`count(*)` }).from(deals).where(eq(deals.tenantId, t.id));
    return { ...t, stats: { users: Number(uc.n), contacts: Number(cc.n), deals: Number(dc.n) } };
  }));

  res.json(enriched);
});

// ── Tenant detail ───────────────────────────────────────────────
router.get("/tenants/:id", authenticate, requireOwner, async (req: AuthRequest, res) => {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, req.params.id));
  if (!tenant) return res.status(404).json({ error: "Tenant not found" });

  const tenantUsers = await db.select({ id: users.id, email: users.email, firstName: users.firstName, lastName: users.lastName, role: users.role, lastLoginAt: users.lastLoginAt, createdAt: users.createdAt })
    .from(users).where(eq(users.tenantId, tenant.id));

  const [stats] = await db.select({
    contacts: sql<number>`(SELECT count(*) FROM contacts WHERE tenant_id = ${tenant.id})`,
    leads: sql<number>`(SELECT count(*) FROM leads WHERE tenant_id = ${tenant.id})`,
    deals: sql<number>`(SELECT count(*) FROM deals WHERE tenant_id = ${tenant.id})`,
    agentSessions: sql<number>`(SELECT count(*) FROM agent_sessions WHERE tenant_id = ${tenant.id})`,
  }).from(tenants).where(eq(tenants.id, tenant.id));

  res.json({ tenant, users: tenantUsers, stats });
});

// ── Toggle tenant status ────────────────────────────────────────
router.put("/tenants/:id/status", authenticate, requireOwner, async (req: AuthRequest, res) => {
  const { isActive } = req.body;
  const [t] = await db.update(tenants).set({ isActive, updatedAt: new Date() }).where(eq(tenants.id, req.params.id)).returning();
  res.json(t);
});

// ── Update tenant plan ──────────────────────────────────────────
router.put("/tenants/:id/plan", authenticate, requireOwner, async (req: AuthRequest, res) => {
  const { plan, maxUsers, maxContacts } = req.body;
  const [t] = await db.update(tenants).set({ subscriptionPlan: plan, maxUsers, maxContacts, subscriptionStatus: "active", updatedAt: new Date() }).where(eq(tenants.id, req.params.id)).returning();
  res.json(t);
});

// ── Platform agent stats ────────────────────────────────────────
router.get("/agent-stats", authenticate, requireOwner, async (req: AuthRequest, res) => {
  const byAgent = await db.select({ agentType: agentSessions.agentType, sessions: sql<number>`count(*)`, messages: sql<number>`sum(message_count)`, tokens: sql<number>`sum(tokens_used)` })
    .from(agentSessions)
    .groupBy(agentSessions.agentType)
    .orderBy(desc(sql`count(*)`));

  const recentSessions = await db.select().from(agentSessions).orderBy(desc(agentSessions.updatedAt)).limit(20);

  res.json({ byAgent, recentSessions });
});

export default router;
