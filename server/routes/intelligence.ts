import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { db } from "../db.js";
import { leads, contacts } from "@shared/schema";
import {
  companies, prospects, prospectLists, sequences, websiteVisitors,
  intentSignals, technographics,
} from "@shared/schema-extended";
import { eq, and, desc, sql, like, or, gte, inArray } from "drizzle-orm";
import {
  enrichCompany, discoverContacts, searchProspects,
  generateOutreachSequence, detectIntentSignals, detectTechnographics,
  findAndVerifyEmail, buildOrgChart, importProspectsFromCSV, exportProspects,
  identifyVisitor
} from "../services/intelligence.js";

const router = Router();

// ── Prospect search / database ──────────────────────────────────
router.post("/prospects/search", authenticate, async (req: AuthRequest, res) => {
  try {
    const { filters = {}, limit = 25, offset = 0, enrichmentDepth = "standard" } = req.body;
    const result = await searchProspects({
      tenantId: req.user!.tenantId, filters, limit, offset, enrichmentDepth
    });
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/prospects", authenticate, async (req: AuthRequest, res) => {
  const { search, status, minScore, limit = "50", offset = "0" } = req.query as any;
  const rows = await db.select().from(prospects)
    .where(and(
      eq(prospects.tenantId, req.user!.tenantId),
      status ? eq(prospects.outreachStatus, status) : undefined,
      search ? or(
        like(prospects.firstName, `%${search}%`),
        like(prospects.email, `%${search}%`),
        like(prospects.company, `%${search}%`),
        like(prospects.jobTitle, `%${search}%`),
      ) : undefined,
    ))
    .orderBy(desc(prospects.score))
    .limit(Number(limit)).offset(Number(offset));

  const [{ total }] = await db.select({ total: sql<number>`count(*)` })
    .from(prospects).where(eq(prospects.tenantId, req.user!.tenantId));

  res.json({ data: rows, total: Number(total) });
});

router.delete("/prospects/:id", authenticate, async (req: AuthRequest, res) => {
  await db.delete(prospects).where(and(eq(prospects.id, req.params.id), eq(prospects.tenantId, req.user!.tenantId)));
  res.json({ success: true });
});

// ── Import prospect as CRM lead ─────────────────────────────────
router.post("/prospects/:id/to-lead", authenticate, async (req: AuthRequest, res) => {
  try {
    const [prospect] = await db.select().from(prospects)
      .where(and(eq(prospects.id, req.params.id), eq(prospects.tenantId, req.user!.tenantId)));
    if (!prospect) return res.status(404).json({ error: "Prospect not found" });

    const [lead] = await db.insert(leads).values({
      tenantId: req.user!.tenantId,
      firstName: prospect.firstName,
      lastName: prospect.lastName,
      email: prospect.email,
      phone: prospect.phone || prospect.directPhone,
      company: prospect.company,
      jobTitle: prospect.jobTitle,
      source: "intelligence_platform",
      score: prospect.score,
      status: "new",
      createdBy: req.user!.id,
    }).returning();

    await db.update(prospects).set({ importedAsLeadId: lead.id, outreachStatus: "contacted" })
      .where(eq(prospects.id, prospect.id));

    res.json({ lead, success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Import as CRM contact ───────────────────────────────────────
router.post("/prospects/:id/to-contact", authenticate, async (req: AuthRequest, res) => {
  try {
    const [prospect] = await db.select().from(prospects)
      .where(and(eq(prospects.id, req.params.id), eq(prospects.tenantId, req.user!.tenantId)));
    if (!prospect) return res.status(404).json({ error: "Prospect not found" });

    const [contact] = await db.insert(contacts).values({
      tenantId: req.user!.tenantId,
      firstName: prospect.firstName,
      lastName: prospect.lastName,
      email: prospect.email,
      phone: prospect.phone || prospect.directPhone,
      company: prospect.company,
      jobTitle: prospect.jobTitle,
      linkedin: prospect.linkedinUrl,
      status: "lead",
      source: "intelligence_platform",
      createdBy: req.user!.id,
    }).returning();

    await db.update(prospects).set({ importedAsContactId: contact.id })
      .where(eq(prospects.id, prospect.id));

    res.json({ contact, success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Company enrichment ──────────────────────────────────────────
router.post("/companies/enrich", authenticate, async (req: AuthRequest, res) => {
  try {
    const company = await enrichCompany({ tenantId: req.user!.tenantId, ...req.body });
    res.json(company);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/companies", authenticate, async (req: AuthRequest, res) => {
  const { search, limit = "50" } = req.query as any;
  const rows = await db.select().from(companies)
    .where(and(
      eq(companies.tenantId, req.user!.tenantId),
      search ? like(companies.name, `%${search}%`) : undefined
    ))
    .orderBy(desc(companies.score))
    .limit(Number(limit));

  const [{ total }] = await db.select({ total: sql<number>`count(*)` })
    .from(companies).where(eq(companies.tenantId, req.user!.tenantId));

  res.json({ data: rows, total: Number(total) });
});

// ── Contact discovery ───────────────────────────────────────────
router.post("/discover", authenticate, async (req: AuthRequest, res) => {
  try {
    const found = await discoverContacts({ tenantId: req.user!.tenantId, ...req.body });
    res.json(found);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Email finder ────────────────────────────────────────────────
router.post("/email-finder", authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await findAndVerifyEmail(req.body);
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Intent signals ──────────────────────────────────────────────
router.post("/intent", authenticate, async (req: AuthRequest, res) => {
  try {
    const signals = await detectIntentSignals({ tenantId: req.user!.tenantId, ...req.body });
    res.json(signals);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get("/intent", authenticate, async (req: AuthRequest, res) => {
  const recent = await db.select().from(intentSignals)
    .where(eq(intentSignals.tenantId, req.user!.tenantId))
    .orderBy(desc(intentSignals.detectedAt))
    .limit(50);
  res.json(recent);
});

// ── Technographics ──────────────────────────────────────────────
router.post("/technographics", authenticate, async (req: AuthRequest, res) => {
  try {
    const techs = await detectTechnographics({ tenantId: req.user!.tenantId, ...req.body });
    res.json(techs);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Org chart ───────────────────────────────────────────────────
router.post("/org-chart", authenticate, async (req: AuthRequest, res) => {
  try {
    const chart = await buildOrgChart(req.body);
    res.json(chart);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Sequences ───────────────────────────────────────────────────
router.get("/sequences", authenticate, async (req: AuthRequest, res) => {
  const seqs = await db.select().from(sequences)
    .where(eq(sequences.tenantId, req.user!.tenantId))
    .orderBy(desc(sequences.createdAt));
  res.json(seqs);
});

router.post("/sequences/generate", authenticate, async (req: AuthRequest, res) => {
  try {
    const seq = await generateOutreachSequence({ tenantId: req.user!.tenantId, ...req.body });
    res.json(seq);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put("/sequences/:id", authenticate, async (req: AuthRequest, res) => {
  const [seq] = await db.update(sequences).set({ ...req.body, updatedAt: new Date() })
    .where(and(eq(sequences.id, req.params.id), eq(sequences.tenantId, req.user!.tenantId))).returning();
  res.json(seq);
});

router.delete("/sequences/:id", authenticate, async (req: AuthRequest, res) => {
  await db.delete(sequences).where(and(eq(sequences.id, req.params.id), eq(sequences.tenantId, req.user!.tenantId)));
  res.json({ success: true });
});

// ── Saved lists ─────────────────────────────────────────────────
router.get("/lists", authenticate, async (req: AuthRequest, res) => {
  const lists = await db.select().from(prospectLists)
    .where(eq(prospectLists.tenantId, req.user!.tenantId))
    .orderBy(desc(prospectLists.createdAt));
  res.json(lists);
});

router.post("/lists", authenticate, async (req: AuthRequest, res) => {
  const [list] = await db.insert(prospectLists).values({
    tenantId: req.user!.tenantId,
    name: req.body.name,
    description: req.body.description,
    filters: req.body.filters || {},
    createdBy: req.user!.id,
  }).returning();
  res.status(201).json(list);
});

// ── Website visitors ────────────────────────────────────────────
router.get("/visitors", authenticate, async (req: AuthRequest, res) => {
  const visitors = await db.select().from(websiteVisitors)
    .where(eq(websiteVisitors.tenantId, req.user!.tenantId))
    .orderBy(desc(websiteVisitors.lastSeen))
    .limit(100);
  res.json(visitors);
});

// ── CSV import ──────────────────────────────────────────────────
router.post("/import", authenticate, async (req: AuthRequest, res) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows)) return res.status(400).json({ error: "rows array required" });
    const result = await importProspectsFromCSV(req.user!.tenantId, rows);
    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Export ──────────────────────────────────────────────────────
router.get("/export", authenticate, async (req: AuthRequest, res) => {
  const data = await exportProspects(req.user!.tenantId, req.query as any);
  res.json(data);
});

// ── Dashboard stats ─────────────────────────────────────────────
router.get("/stats", authenticate, async (req: AuthRequest, res) => {
  const [pc] = await db.select({ total: sql<number>`count(*)`, avgScore: sql<number>`avg(score)` })
    .from(prospects).where(eq(prospects.tenantId, req.user!.tenantId));
  const [cc] = await db.select({ total: sql<number>`count(*)` })
    .from(companies).where(eq(companies.tenantId, req.user!.tenantId));
  const [sc] = await db.select({ total: sql<number>`count(*)` })
    .from(sequences).where(eq(sequences.tenantId, req.user!.tenantId));
  const [ic] = await db.select({ total: sql<number>`count(*)` })
    .from(intentSignals).where(eq(intentSignals.tenantId, req.user!.tenantId));
  const [vc] = await db.select({ total: sql<number>`count(*)` })
    .from(websiteVisitors).where(eq(websiteVisitors.tenantId, req.user!.tenantId));
  const statusDist = await db.select({ status: prospects.outreachStatus, count: sql<number>`count(*)` })
    .from(prospects).where(eq(prospects.tenantId, req.user!.tenantId)).groupBy(prospects.outreachStatus);

  res.json({
    prospects: { total: Number(pc.total), avgScore: Math.round(Number(pc.avgScore) || 0) },
    companies: Number(cc.total),
    sequences: Number(sc.total),
    intentSignals: Number(ic.total),
    visitors: Number(vc.total),
    outreachStatus: statusDist.map(s => ({ status: s.status, count: Number(s.count) })),
  });
});

export default router;
