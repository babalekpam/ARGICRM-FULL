import { Router } from "express";
import { authenticate, requireRole, type AuthRequest } from "../middleware/auth.js";
import { db } from "../db.js";
import {
  marketplaceLeads, ingestionLogs, marketplaceExports, marketplaceUsage,
} from "@shared/schema-extended";
import { eq, and, ilike, or, sql, desc, gte, lte, ne } from "drizzle-orm";
import { MARKETPLACE_MONTHLY_QUOTA, planAtLeast, type PlanId } from "@shared/plans.js";
import { triggerIngestion, ingestionRunning } from "../services/marketplace-ingestion.js";

const router = Router();

const PLATFORM_OWNER_EMAIL = "abel@argilette.com";

function getEffectivePlan(req: AuthRequest): PlanId {
  if (
    req.user?.email === PLATFORM_OWNER_EMAIL ||
    req.user?.role === "platform_owner"
  ) {
    return "enterprise";
  }
  return ((req.user as any)?.plan || "starter") as PlanId;
}

function isOwner(req: AuthRequest): boolean {
  return (
    req.user?.email === PLATFORM_OWNER_EMAIL ||
    req.user?.role === "platform_owner"
  );
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ── Quota helpers ────────────────────────────────────────────────
async function getUsage(tenantId: string): Promise<number> {
  const month = currentMonth();
  const [row] = await db.select({ used: marketplaceUsage.exportsUsed })
    .from(marketplaceUsage)
    .where(and(eq(marketplaceUsage.tenantId, tenantId as any), eq(marketplaceUsage.month, month)))
    .limit(1);
  return row?.used ?? 0;
}

async function incrementUsage(tenantId: string, count: number): Promise<void> {
  const month = currentMonth();
  const existing = await db.select({ id: marketplaceUsage.id })
    .from(marketplaceUsage)
    .where(and(eq(marketplaceUsage.tenantId, tenantId as any), eq(marketplaceUsage.month, month)))
    .limit(1);

  if (existing.length > 0) {
    await db.update(marketplaceUsage)
      .set({ exportsUsed: sql`exports_used + ${count}`, updatedAt: new Date() })
      .where(and(eq(marketplaceUsage.tenantId, tenantId as any), eq(marketplaceUsage.month, month)));
  } else {
    await db.insert(marketplaceUsage).values({ tenantId: tenantId as any, month, exportsUsed: count });
  }
}

// ── GET /api/marketplace/stats ──────────────────────────────────
// Returns totals, user quota, ingestion health
router.get("/stats", authenticate, async (req: AuthRequest, res) => {
  const [totalRow] = await db.select({ count: sql<number>`count(*)` }).from(marketplaceLeads);
  const [usRow] = await db.select({ count: sql<number>`count(*)` }).from(marketplaceLeads).where(eq(marketplaceLeads.market, "US"));
  const [afRow] = await db.select({ count: sql<number>`count(*)` }).from(marketplaceLeads).where(eq(marketplaceLeads.market, "Africa"));

  const recentLogs = await db.select().from(ingestionLogs).orderBy(desc(ingestionLogs.startedAt)).limit(10);
  const exportsUsed = await getUsage(req.user!.tenantId);

  const plan = getEffectivePlan(req);
  const quota = MARKETPLACE_MONTHLY_QUOTA[plan as PlanId] ?? 0;

  res.json({
    total: Number(totalRow.count),
    us: Number(usRow.count),
    africa: Number(afRow.count),
    quota,
    exportsUsed,
    exportsRemaining: quota === -1 ? -1 : Math.max(0, quota - exportsUsed),
    ingestionLogs: recentLogs,
    ingestionRunning,
    sources: ["NPI Registry", "CMS Medicare", "OpenStreetMap/Africa", "Yellow Pages", "OpenCorporates"],
  });
});

// ── POST /api/marketplace/search ────────────────────────────────
// Search & filter leads — returns full preview for first 3, blurred for rest
router.post("/search", authenticate, async (req: AuthRequest, res) => {
  const plan = getEffectivePlan(req);
  if (!isOwner(req) && !planAtLeast(plan, "professional")) {
    return res.status(402).json({ error: "Upgrade to Professional to access the Data Marketplace", upgrade: true });
  }

  const {
    market, industry, specialty, country, state, city,
    language, category, search, freshDays, page = 1, limit = 50,
  } = req.body;

  const conditions: any[] = [eq(marketplaceLeads.available, true)];

  if (market && market !== "Both") conditions.push(eq(marketplaceLeads.market, market));
  if (industry) conditions.push(ilike(marketplaceLeads.industry, `%${industry}%`));
  if (specialty) conditions.push(ilike(marketplaceLeads.specialty, `%${specialty}%`));
  if (country) conditions.push(ilike(marketplaceLeads.country, `%${country}%`));
  if (state) conditions.push(ilike(marketplaceLeads.state, `%${state}%`));
  if (city) conditions.push(ilike(marketplaceLeads.city, `%${city}%`));
  if (language) conditions.push(eq(marketplaceLeads.language, language));
  if (category) conditions.push(ilike(marketplaceLeads.category, `%${category}%`));

  if (search) {
    conditions.push(or(
      ilike(marketplaceLeads.fullName, `%${search}%`),
      ilike(marketplaceLeads.companyName, `%${search}%`),
      ilike(marketplaceLeads.city, `%${search}%`),
      ilike(marketplaceLeads.specialty, `%${search}%`),
    ));
  }

  if (freshDays && Number(freshDays) > 0) {
    const cutoff = new Date(Date.now() - Number(freshDays) * 24 * 60 * 60 * 1000);
    conditions.push(gte(marketplaceLeads.createdAt, cutoff));
  }

  const offset = (Number(page) - 1) * Number(limit);

  const [countRow] = await db.select({ count: sql<number>`count(*)` })
    .from(marketplaceLeads)
    .where(and(...conditions));

  const rows = await db.select().from(marketplaceLeads)
    .where(and(...conditions))
    .orderBy(desc(marketplaceLeads.qualityScore), desc(marketplaceLeads.createdAt))
    .limit(Number(limit))
    .offset(offset);

  const exportsUsed = await getUsage(req.user!.tenantId);
  const quota = MARKETPLACE_MONTHLY_QUOTA[plan as PlanId] ?? 0;
  const canExport = isOwner(req) || quota === -1 || exportsUsed < quota;
  const owner = isOwner(req);

  // Return full data for first 3 — blur rest (platform owner sees everything)
  const results = rows.map((r, i) => {
    const isVisible = owner || i < 3;
    return {
      id: r.id,
      source: r.source,
      market: r.market,
      category: r.category,
      industry: r.industry,
      specialty: r.specialty,
      city: r.city,
      state: r.state,
      country: r.country,
      language: r.language,
      qualityScore: r.qualityScore,
      available: r.available,
      createdAt: r.createdAt,
      // Full data only for preview rows
      fullName: isVisible ? r.fullName : maskName(r.fullName),
      companyName: isVisible ? r.companyName : maskCompany(r.companyName),
      title: isVisible ? r.title : r.title, // title always visible
      email: isVisible ? maskEmail(r.email) : "••••@••••••.•••",
      phone: isVisible ? maskPhone(r.phone) : "••• ••• ••••",
      website: isVisible ? r.website : null,
      address: isVisible ? r.address : null,
      zip: isVisible ? r.zip : null,
      blurred: !isVisible,
    };
  });

  res.json({
    total: Number(countRow.count),
    page: Number(page),
    limit: Number(limit),
    results,
    quota,
    exportsUsed,
    exportsRemaining: quota === -1 ? -1 : Math.max(0, quota - exportsUsed),
    canExport,
  });
});

// Masking helpers for blurred preview
function maskName(name: string | null): string {
  if (!name) return "• •••••••";
  const parts = name.split(" ");
  return parts.map((p, i) => i === 0 ? p[0] + "•".repeat(Math.min(p.length - 1, 5)) : "•".repeat(Math.min(p.length, 6))).join(" ");
}
function maskCompany(name: string | null): string {
  if (!name) return "••••••••• Inc";
  return name.slice(0, 2) + "•".repeat(Math.min(name.length - 2, 8));
}
function maskEmail(email: string | null): string {
  if (!email) return null as any;
  const [local, domain] = email.split("@");
  if (!domain) return "••••@••••.com";
  return (local?.[0] || "•") + "•••@" + domain;
}
function maskPhone(phone: string | null): string {
  if (!phone) return null as any;
  return phone.replace(/\d(?=\d{4})/g, "•");
}

// ── POST /api/marketplace/export ────────────────────────────────
// Export selected leads — deducts from quota, records export
router.post("/export", authenticate, async (req: AuthRequest, res) => {
  const plan = getEffectivePlan(req);
  const quota = MARKETPLACE_MONTHLY_QUOTA[plan as PlanId] ?? 0;

  if (!isOwner(req) && quota === 0) {
    return res.status(402).json({ error: "Upgrade to Professional or higher to export leads", upgrade: true });
  }

  const { leadIds } = req.body;
  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    return res.status(400).json({ error: "No leads selected" });
  }

  const exportsUsed = await getUsage(req.user!.tenantId);
  const remaining = quota === -1 ? Infinity : quota - exportsUsed;

  if (leadIds.length > remaining) {
    return res.status(402).json({
      error: `You only have ${remaining} exports remaining this month`,
      remaining,
      upgrade: true,
    });
  }

  // Fetch full records
  const leads = await db.select().from(marketplaceLeads)
    .where(sql`id = ANY(${leadIds}::uuid[])`);

  if (leads.length === 0) return res.status(404).json({ error: "No leads found" });

  // Record exports (skip already exported by this tenant)
  let actuallyExported = 0;
  for (const lead of leads) {
    const alreadyExported = await db.select({ id: marketplaceExports.id })
      .from(marketplaceExports)
      .where(and(
        eq(marketplaceExports.tenantId, req.user!.tenantId as any),
        eq(marketplaceExports.leadId, lead.id),
      ))
      .limit(1);

    if (alreadyExported.length > 0) continue;

    await db.insert(marketplaceExports).values({
      tenantId: req.user!.tenantId as any,
      leadId: lead.id,
    });

    // Track times_sold
    await db.update(marketplaceLeads)
      .set({ timesSold: sql`times_sold + 1` })
      .where(eq(marketplaceLeads.id, lead.id));

    // Mark unavailable if sold to 3+ tenants
    const [soldCount] = await db.select({ count: sql<number>`count(distinct tenant_id)` })
      .from(marketplaceExports)
      .where(eq(marketplaceExports.leadId, lead.id));
    if (Number(soldCount.count) >= 3) {
      await db.update(marketplaceLeads).set({ available: false }).where(eq(marketplaceLeads.id, lead.id));
    }

    actuallyExported++;
  }

  await incrementUsage(req.user!.tenantId, actuallyExported);

  res.json({
    exported: actuallyExported,
    leads: leads.map(l => ({
      id: l.id,
      fullName: l.fullName,
      companyName: l.companyName,
      title: l.title,
      email: l.email,
      phone: l.phone,
      website: l.website,
      address: l.address,
      city: l.city,
      state: l.state,
      country: l.country,
      zip: l.zip,
      industry: l.industry,
      specialty: l.specialty,
      source: l.source,
      market: l.market,
      language: l.language,
    })),
  });
});

// ── POST /api/marketplace/push-to-crm ───────────────────────────
// Export + immediately push to CRM contacts
router.post("/push-to-crm", authenticate, async (req: AuthRequest, res) => {
  const { leadIds } = req.body;
  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    return res.status(400).json({ error: "No leads selected" });
  }

  // Reuse export endpoint logic by calling it internally
  const exportRes = await db.select().from(marketplaceLeads)
    .where(sql`id = ANY(${leadIds}::uuid[])`);

  // Insert as CRM contacts
  const { contacts } = await import("@shared/schema.js");
  let added = 0;
  for (const lead of exportRes) {
    try {
      await db.insert(contacts).values({
        tenantId: req.user!.tenantId,
        firstName: lead.fullName?.split(" ")[0] || lead.companyName || "Unknown",
        lastName: lead.fullName?.split(" ").slice(1).join(" ") || "",
        email: lead.email,
        phone: lead.phone,
        company: lead.companyName,
        jobTitle: lead.title,
        industry: lead.industry,
        city: lead.city,
        country: lead.country,
        website: lead.website,
        leadSource: `marketplace_${lead.source}`,
        status: "new",
        tags: [lead.category, lead.market, lead.source].filter(Boolean) as string[],
      } as any).onConflictDoNothing();
      added++;
    } catch { continue; }
  }

  res.json({ pushed: added });
});

// ── GET /api/marketplace/my-exports ─────────────────────────────
// List this tenant's previously exported leads
router.get("/my-exports", authenticate, async (req: AuthRequest, res) => {
  const exports = await db.select({
    id: marketplaceLeads.id,
    fullName: marketplaceLeads.fullName,
    companyName: marketplaceLeads.companyName,
    email: marketplaceLeads.email,
    phone: marketplaceLeads.phone,
    industry: marketplaceLeads.industry,
    market: marketplaceLeads.market,
    exportedAt: marketplaceExports.exportedAt,
  })
    .from(marketplaceExports)
    .innerJoin(marketplaceLeads, eq(marketplaceExports.leadId, marketplaceLeads.id))
    .where(eq(marketplaceExports.tenantId, req.user!.tenantId as any))
    .orderBy(desc(marketplaceExports.exportedAt))
    .limit(200);

  res.json(exports);
});

// ── GET /api/marketplace/admin/stats ────────────────────────────
// Admin-only: full ingestion + revenue view
router.get("/admin/stats", authenticate, requireRole("admin"), async (req: AuthRequest, res) => {
  const [total] = await db.select({ count: sql<number>`count(*)` }).from(marketplaceLeads);
  const bySource = await db.select({
    source: marketplaceLeads.source,
    count: sql<number>`count(*)`,
  }).from(marketplaceLeads).groupBy(marketplaceLeads.source);

  const byMarket = await db.select({
    market: marketplaceLeads.market,
    count: sql<number>`count(*)`,
  }).from(marketplaceLeads).groupBy(marketplaceLeads.market);

  const recentLogs = await db.select().from(ingestionLogs)
    .orderBy(desc(ingestionLogs.startedAt)).limit(20);

  const totalExports = await db.select({ count: sql<number>`count(*)` }).from(marketplaceExports);
  const lowQuality = await db.select({ count: sql<number>`count(*)` })
    .from(marketplaceLeads).where(sql`quality_score < 3`);

  res.json({
    totalLeads: Number(total.count),
    bySource: bySource.map(r => ({ source: r.source, count: Number(r.count) })),
    byMarket: byMarket.map(r => ({ market: r.market, count: Number(r.count) })),
    totalExports: Number(totalExports[0].count),
    lowQualityLeads: Number(lowQuality[0].count),
    ingestionRunning,
    recentLogs,
  });
});

// ── POST /api/marketplace/admin/trigger ─────────────────────────
// Admin: manually trigger ingestion for a specific source
router.post("/admin/trigger", authenticate, requireRole("admin"), async (req: AuthRequest, res) => {
  const { source } = req.body;
  res.json({ message: `Ingestion triggered for: ${source || "all"}`, started: true });
  // Fire async — don't block response
  triggerIngestion(source).catch(err => console.error("[Marketplace] Manual trigger error:", err));
});

export default router;
