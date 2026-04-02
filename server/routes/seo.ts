import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { db } from "../db.js";
import { keywords, backlinks } from "@shared/schema";
import { seoProjects, seoAudits, contentIdeas } from "@shared/schema-extended";
import { eq, and, desc, sql, like, gte } from "drizzle-orm";
import { ask, askJSON, complete, isAIAvailable, getActiveProvider } from "../services/ai-adapter.js";

const router = Router();

// ── Projects ───────────────────────────────────────────────────
router.get("/projects", authenticate, async (req: AuthRequest, res) => {
  const rows = await db.select().from(seoProjects).where(eq(seoProjects.tenantId, req.user!.tenantId)).orderBy(desc(seoProjects.createdAt));
  res.json(rows);
});

router.post("/projects", authenticate, async (req: AuthRequest, res) => {
  const [p] = await db.insert(seoProjects).values({ tenantId: req.user!.tenantId, ...req.body }).returning();
  res.status(201).json(p);
});

router.put("/projects/:id", authenticate, async (req: AuthRequest, res) => {
  const [p] = await db.update(seoProjects).set({ ...req.body, updatedAt: new Date() }).where(and(eq(seoProjects.id, req.params.id), eq(seoProjects.tenantId, req.user!.tenantId))).returning();
  res.json(p);
});

router.delete("/projects/:id", authenticate, async (req: AuthRequest, res) => {
  await db.delete(seoProjects).where(and(eq(seoProjects.id, req.params.id), eq(seoProjects.tenantId, req.user!.tenantId)));
  res.json({ success: true });
});

// ── Keyword Research ───────────────────────────────────────────
router.post("/keywords/research", authenticate, async (req: AuthRequest, res) => {
  try {
    const { seed, country = "US", limit = 20, projectId } = req.body;
    if (!seed) return res.status(400).json({ error: "seed keyword required" });

    let generated: any[] = [];
    if (process.env.ANTHROPIC_API_KEY) {
      const msg = await complete({ messages: [{ role: "user", content: `You are a professional SEO tool. Generate ${limit} keyword variations and related keywords for: "${seed}"

Return ONLY a JSON array (no markdown):
[{
  "keyword": "exact keyword phrase",
  "searchVolume": 2400,
  "difficulty": 45,
  "cpc": 1.25,
  "intent": "informational|navigational|transactional|commercial",
  "trend": "rising|stable|declining"
}]` }], maxTokens: 1500 });
      const text = msg;
      generated = JSON.parse(text.replace(/```json|```/g, "").trim());
    } else {
      return res.status(503).json({ error: "ANTHROPIC_API_KEY required for keyword research. Add it to your environment secrets." });
    }

    // Save to DB
    const saved = [];
    for (const kw of generated) {
      const [k] = await db.insert(keywords).values({
        tenantId: req.user!.tenantId,
        projectId: projectId || null,
        keyword: kw.keyword,
        searchVolume: kw.searchVolume ?? 0,
        difficulty: kw.difficulty ?? 0,
        cpc: kw.cpc ?? 0,
        trend: kw.trend ?? "stable",
      }).returning();
      saved.push(k);
    }
    res.json(saved);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/keywords", authenticate, async (req: AuthRequest, res) => {
  const { projectId, search, limit = "100" } = req.query as any;
  const rows = await db.select().from(keywords).where(
    and(
      eq(keywords.tenantId, req.user!.tenantId),
      projectId ? eq(keywords.projectId, projectId) : undefined,
      search ? like(keywords.keyword, `%${search}%`) : undefined,
    )
  ).orderBy(desc(keywords.searchVolume)).limit(Number(limit));

  const [{ total }] = await db.select({ total: sql<number>`count(*)` }).from(keywords).where(eq(keywords.tenantId, req.user!.tenantId));
  res.json({ data: rows, total: Number(total) });
});

router.delete("/keywords/:id", authenticate, async (req: AuthRequest, res) => {
  await db.delete(keywords).where(and(eq(keywords.id, req.params.id), eq(keywords.tenantId, req.user!.tenantId)));
  res.json({ success: true });
});

// ── Site Audit ─────────────────────────────────────────────────
router.post("/audit", authenticate, async (req: AuthRequest, res) => {
  try {
    const { domain, projectId } = req.body;
    if (!domain) return res.status(400).json({ error: "domain required" });

    let auditResult: any;

    if (process.env.ANTHROPIC_API_KEY) {
      const msg = await complete({ messages: [{ role: "user", content: `You are a professional SEO audit tool. Generate a comprehensive SEO audit report for the domain: "${domain}"

Return ONLY JSON:
{
  "score": 72,
  "summary": { "critical": 3, "warnings": 8, "passed": 24, "totalPages": 45 },
  "issues": [
    { "type": "missing_meta_description", "severity": "critical", "description": "23 pages missing meta descriptions", "count": 23, "urls": ["/blog/post-1", "/about"] }
  ]
}` }], maxTokens: 1200 });
      const text = msg;
      auditResult = JSON.parse(text.replace(/```json|```/g, "").trim());
    } else {
      return res.status(503).json({ error: "ANTHROPIC_API_KEY required for site audits." });
    }

    const [audit] = await db.insert(seoAudits).values({
      tenantId: req.user!.tenantId,
      projectId: projectId || null,
      score: auditResult.score,
      issues: auditResult.issues,
      summary: auditResult.summary,
    }).returning();

    res.json(audit);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/audits", authenticate, async (req: AuthRequest, res) => {
  const rows = await db.select().from(seoAudits).where(eq(seoAudits.tenantId, req.user!.tenantId)).orderBy(desc(seoAudits.crawledAt)).limit(20);
  res.json(rows);
});

// ── Backlink Analysis ──────────────────────────────────────────
router.post("/backlinks/analyze", authenticate, async (req: AuthRequest, res) => {
  try {
    const { domain, projectId } = req.body;

    let generated: any[] = [];
    if (process.env.ANTHROPIC_API_KEY) {
      const msg = await complete({ messages: [{ role: "user", content: `Generate a realistic backlink profile analysis for domain "${domain}". Return ONLY JSON array of 10 backlinks:
[{"url":"https://example.com/post","anchorText":"related anchor","domainScore":45,"date":"2024-01-15","source":"organic"}]` }], maxTokens: 800 });
      generated = JSON.parse(msg.replace(/```json|```/g, "").trim());
    } else {
      return res.status(503).json({ error: "ANTHROPIC_API_KEY required for backlink analysis." });
    }

    const saved = [];
    for (const bl of generated) {
      const [b] = await db.insert(backlinks).values({
        tenantId: req.user!.tenantId,
        projectId: projectId || null,
        url: bl.url || bl.sourceUrl || "",
        anchorText: bl.anchorText,
        domainScore: bl.domainScore ?? bl.domainAuthority ?? 0,
        date: bl.date || new Date().toISOString().split("T")[0],
        source: bl.source || "ai",
      }).returning();
      saved.push(b);
    }
    res.json(saved);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/backlinks", authenticate, async (req: AuthRequest, res) => {
  const rows = await db.select().from(backlinks).where(eq(backlinks.tenantId, req.user!.tenantId)).orderBy(desc(backlinks.domainScore)).limit(200);
  const [{ total }] = await db.select({ total: sql<number>`count(*)` }).from(backlinks).where(eq(backlinks.tenantId, req.user!.tenantId));
  res.json({ data: rows, total: Number(total) });
});

// ── Competitor Analysis ────────────────────────────────────────
router.post("/competitor/analyze", authenticate, async (req: AuthRequest, res) => {
  try {
    const { domain, competitor } = req.body;

    if (!isAIAvailable()) {
      return res.status(503).json({ error: "ANTHROPIC_API_KEY required for competitor analysis." });
    }

    const msg = await complete({ messages: [{ role: "user", content: `Analyze competitor domain "${competitor}" vs "${domain}" for SEO. Return ONLY JSON:
{"competitor":"${competitor}","metrics":{"domainAuthority":50,"backlinks":5000,"organicKeywords":2000,"organicTraffic":30000},"topKeywords":[{"keyword":"example","volume":1000,"rank":5}]}` }], maxTokens: 800 });
    const result = JSON.parse(msg.replace(/```json|```/g, "").trim());
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Content Intelligence ───────────────────────────────────────
router.post("/content/ideas", authenticate, async (req: AuthRequest, res) => {
  try {
    const { topic, audience, projectId, count = 10 } = req.body;

    if (!isAIAvailable()) {
      return res.status(503).json({ error: "ANTHROPIC_API_KEY required for content ideas generation." });
    }

    const msg = await complete({ messages: [{ role: "user", content: `Generate ${count} SEO content ideas for topic "${topic}" targeting "${audience || "B2B SaaS"}".

Return ONLY JSON array:
[{"title":"Article Title","keyword":"target keyword","searchVolume":2400,"difficulty":42,"contentType":"blog|guide|video|infographic","outline":["Section 1","Section 2","Section 3"]}]` }], maxTokens: 1200 });
    const ideas = JSON.parse(msg.replace(/```json|```/g, "").trim());

    const saved = [];
    for (const idea of ideas) {
      const [ci] = await db.insert(contentIdeas).values({ tenantId: req.user!.tenantId, projectId: projectId || null, ...idea }).returning();
      saved.push(ci);
    }
    res.json(saved);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Stats ──────────────────────────────────────────────────────
router.get("/stats", authenticate, async (req: AuthRequest, res) => {
  const [kc] = await db.select({ total: sql<number>`count(*)`, avgVol: sql<number>`avg(search_volume)`, avgDiff: sql<number>`avg(difficulty)` }).from(keywords).where(eq(keywords.tenantId, req.user!.tenantId));
  const [bc] = await db.select({ total: sql<number>`count(*)`, avgDA: sql<number>`avg(domain_authority)` }).from(backlinks).where(eq(backlinks.tenantId, req.user!.tenantId));
  const [ac] = await db.select({ total: sql<number>`count(*)` }).from(seoAudits).where(eq(seoAudits.tenantId, req.user!.tenantId));
  const [pc] = await db.select({ total: sql<number>`count(*)` }).from(seoProjects).where(eq(seoProjects.tenantId, req.user!.tenantId));
  const latestAudit = await db.select().from(seoAudits).where(eq(seoAudits.tenantId, req.user!.tenantId)).orderBy(desc(seoAudits.crawledAt)).limit(1);

  res.json({
    projects: Number(pc.total),
    keywords: { total: Number(kc.total), avgVolume: Math.round(Number(kc.avgVol) || 0), avgDifficulty: Math.round(Number(kc.avgDiff) || 0) },
    backlinks: { total: Number(bc.total), avgDA: Math.round(Number(bc.avgDA) || 0) },
    audits: Number(ac.total),
    latestScore: latestAudit[0]?.score || null,
  });
});

export default router;
