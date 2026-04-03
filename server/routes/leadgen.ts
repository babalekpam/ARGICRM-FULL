import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { requireFeature } from "../middleware/feature-check.js";
import { db } from "../db.js";
import { prospects, companies, intentSignals, technographics } from "@shared/schema-extended";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  runAutonomousLeadGen, discoverCompanies, enrichCompanyFull,
  discoverContacts, detectBuyingIntent, scoreProspect
} from "../services/leadgen.js";
import {
  searchDuckDuckGo, verifyEmailDNS, detectTechStack,
  scrapeCompanyWebsite, scrapeYellowPages, searchGitHub,
  scrapeJobPostings, generateAndVerifyEmail, searchOpenCorporates,
  getSerpApiStatus
} from "../services/scraper.js";

const router = Router();

// Active jobs tracker
const activeJobs: Record<string, {
  status: "running" | "completed" | "failed";
  progress: number;
  result?: any;
  error?: string;
  startedAt: Date;
}> = {};

// ── Full autonomous campaign ────────────────────────────────────
router.post("/campaign", authenticate, requireFeature("ai.lead_generation"), async (req: AuthRequest, res) => {
  try {
    const {
      targetIndustry, targetTitles = ["VP Sales", "CEO", "Director"],
      targetSeniorities = ["vp", "c-suite", "director"],
      targetLocation, companySize, keywords = [],
      targetCount = 15, enrichmentDepth = "standard"
    } = req.body;

    if (!targetIndustry) return res.status(400).json({ error: "targetIndustry required" });

    const jobId = `lg-${Date.now()}`;
    activeJobs[jobId] = { status: "running", progress: 0, startedAt: new Date() };

    // Start async — respond immediately with job ID
    res.json({ jobId, status: "running", message: "Autonomous lead gen pipeline started. Check /status/:jobId for progress." });

    // Run in background
    setImmediate(async () => {
      try {
        const result = await runAutonomousLeadGen({
          tenantId: req.user!.tenantId,
          targetIndustry, targetTitles, targetSeniorities,
          targetLocation, companySize, keywords, targetCount,
          enrichmentDepth: enrichmentDepth as any,
        });
        activeJobs[jobId] = { status: "completed", progress: 100, result, startedAt: activeJobs[jobId].startedAt };
      } catch (err: any) {
        activeJobs[jobId] = { status: "failed", progress: 0, error: err.message, startedAt: activeJobs[jobId].startedAt };
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Job status ──────────────────────────────────────────────────
router.get("/status/:jobId", authenticate, (req: AuthRequest, res) => {
  const job = activeJobs[req.params.jobId];
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json(job);
});

// ── Discover companies ──────────────────────────────────────────
router.post("/discover-companies", authenticate, requireFeature("ai.lead_generation"), async (req: AuthRequest, res) => {
  try {
    const { industry, location, keywords, companySize, limit = 20 } = req.body;
    if (!industry) return res.status(400).json({ error: "industry required" });

    const found = await discoverCompanies({
      tenantId: req.user!.tenantId,
      industry, location, keywords, companySize, limit
    });
    res.json({ companies: found, count: found.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Enrich a single company ─────────────────────────────────────
router.post("/enrich/:companyId", authenticate, async (req: AuthRequest, res) => {
  try {
    const [company] = await db.select().from(companies)
      .where(and(eq(companies.id, req.params.companyId), eq(companies.tenantId, req.user!.tenantId)));
    if (!company) return res.status(404).json({ error: "Company not found" });

    const enriched = await enrichCompanyFull(company);
    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Find contacts at company ────────────────────────────────────
router.post("/find-contacts", authenticate, requireFeature("contacts.advanced"), async (req: AuthRequest, res) => {
  try {
    const { companyId, targetTitles = ["CEO", "VP Sales"], targetSeniorities = ["c-suite", "vp"], count = 3 } = req.body;
    const [company] = await db.select().from(companies)
      .where(and(eq(companies.id, companyId), eq(companies.tenantId, req.user!.tenantId)));
    if (!company) return res.status(404).json({ error: "Company not found" });

    const found = await discoverContacts({
      tenantId: req.user!.tenantId,
      company, targetTitles, targetSeniorities, count
    });
    res.json({ prospects: found, count: found.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Email verification (DNS only, zero API cost) ───────────────
router.post("/verify-email", authenticate, async (req: AuthRequest, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "email required" });
    const result = await verifyEmailDNS(email);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Bulk email verification ─────────────────────────────────────
router.post("/verify-emails-bulk", authenticate, async (req: AuthRequest, res) => {
  try {
    const { emails } = req.body;
    if (!Array.isArray(emails)) return res.status(400).json({ error: "emails array required" });

    const results = await Promise.all(
      emails.slice(0, 50).map(async (email: string) => {
        const result = await verifyEmailDNS(email);
        return { email, ...result };
      })
    );
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Email finder (generate + verify for a person) ──────────────
router.post("/find-email", authenticate, async (req: AuthRequest, res) => {
  try {
    const { firstName, lastName, domain } = req.body;
    if (!firstName || !lastName || !domain) return res.status(400).json({ error: "firstName, lastName, domain required" });
    const result = await generateAndVerifyEmail({ firstName, lastName, domain });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Tech stack detection (real website scan) ────────────────────
router.post("/tech-scan", authenticate, async (req: AuthRequest, res) => {
  try {
    const { domain } = req.body;
    if (!domain) return res.status(400).json({ error: "domain required" });
    const tech = await detectTechStack(domain);
    res.json({ domain, technologies: tech, count: tech.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Company website scrape ──────────────────────────────────────
router.post("/scrape-website", authenticate, async (req: AuthRequest, res) => {
  try {
    const { domain } = req.body;
    if (!domain) return res.status(400).json({ error: "domain required" });
    const data = await scrapeCompanyWebsite(domain);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── DuckDuckGo search ───────────────────────────────────────────
router.post("/search", authenticate, async (req: AuthRequest, res) => {
  try {
    const { query, maxResults = 10 } = req.body;
    if (!query) return res.status(400).json({ error: "query required" });
    const results = await searchDuckDuckGo(query, maxResults);
    res.json({ query, results, count: results.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Intent signals (real job + news scraping) ──────────────────
router.post("/detect-intent", authenticate, async (req: AuthRequest, res) => {
  try {
    const { companyId, keywords } = req.body;
    const [company] = await db.select().from(companies)
      .where(and(eq(companies.id, companyId), eq(companies.tenantId, req.user!.tenantId)));
    if (!company) return res.status(404).json({ error: "Company not found" });

    const signals = await detectBuyingIntent({
      tenantId: req.user!.tenantId,
      company, targetKeywords: keywords || ["CRM", "sales software"],
    });
    res.json({ signals, count: signals.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── OpenCorporates company lookup ──────────────────────────────
router.post("/company-registry", authenticate, async (req: AuthRequest, res) => {
  try {
    const { companyName, jurisdiction } = req.body;
    if (!companyName) return res.status(400).json({ error: "companyName required" });
    const results = await searchOpenCorporates(companyName, jurisdiction);
    res.json({ results, count: results.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GitHub org lookup ───────────────────────────────────────────
router.post("/github-lookup", authenticate, async (req: AuthRequest, res) => {
  try {
    const { orgName } = req.body;
    if (!orgName) return res.status(400).json({ error: "orgName required" });
    const result = await searchGitHub(orgName);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Job postings scraper ────────────────────────────────────────
router.post("/job-postings", authenticate, async (req: AuthRequest, res) => {
  try {
    const { company, keywords } = req.body;
    if (!company) return res.status(400).json({ error: "company required" });
    const jobs = await scrapeJobPostings(company, keywords);
    res.json({ jobs, count: jobs.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Import prospects to CRM contacts ────────────────────────────
router.post("/import-contacts", authenticate, async (req: AuthRequest, res) => {
  try {
    const { prospects: items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "prospects array required" });
    }
    const tenantId = req.user!.tenantId;
    const { contacts } = await import("@shared/schema");
    const { db: database } = await import("../db.js");

    const inserted = await Promise.all(
      items.map(async (p: any) => {
        const nameParts = (p.name || "").trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";
        const [row] = await database.insert(contacts).values({
          tenantId,
          firstName,
          lastName,
          name: p.name || `${firstName} ${lastName}`.trim(),
          email: p.email || null,
          company: p.company || null,
          jobTitle: p.title || p.jobTitle || null,
          source: "lead_finder",
          leadSource: "AI Lead Finder",
          status: "active",
          notes: p.score ? `Lead score: ${p.score}/100. Found via autonomous web search.` : "Found via autonomous web search.",
        }).returning();
        return row;
      })
    );
    res.json({ imported: inserted.length, contacts: inserted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Dashboard stats ─────────────────────────────────────────────
router.get("/stats", authenticate, async (req: AuthRequest, res) => {
  const [pc] = await db.select({ total: sql<number>`count(*)`, avgScore: sql<number>`avg(score)`, verified: sql<number>`sum(case when email_status in ('valid','likely') then 1 else 0 end)` })
    .from(prospects).where(eq(prospects.tenantId, req.user!.tenantId));
  const [cc] = await db.select({ total: sql<number>`count(*)` })
    .from(companies).where(eq(companies.tenantId, req.user!.tenantId));
  const [ic] = await db.select({ total: sql<number>`count(*)` })
    .from(intentSignals).where(eq(intentSignals.tenantId, req.user!.tenantId));
  const [tc] = await db.select({ total: sql<number>`count(*)` })
    .from(technographics).where(eq(technographics.tenantId, req.user!.tenantId));

  const activeJobCount = Object.values(activeJobs).filter(j => j.status === "running").length;

  const serpStatus = getSerpApiStatus();
  res.json({
    prospects: { total: Number(pc.total), avgScore: Math.round(Number(pc.avgScore) || 0), verified: Number(pc.verified) },
    companies: Number(cc.total),
    intentSignals: Number(ic.total),
    techFindings: Number(tc.total),
    activeJobs: activeJobCount,
    dataSources: ["DuckDuckGo Search", "Tavily AI Search", "SerpAPI (Google)", "Yellow Pages", "OpenCorporates", "GitHub API", "Company Websites", "Indeed Jobs", "DNS/MX Verification"],
    tavilyConfigured: !!process.env.TAVILY_API_KEY,
    serpApi: {
      keyCount: serpStatus.length,
      healthyKeys: serpStatus.filter(k => k.status === "healthy").length,
      keys: serpStatus,
    },
  });
});

export default router;
