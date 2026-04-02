import { Router } from "express";
import { authenticate, requireRole, type AuthRequest } from "../middleware/auth.js";
import { db } from "../db.js";
import { projects, landingPages, abTests } from "@shared/schema";
import { employees, projectTasks, documents, funnels, reputationReviews, whitelabelSettings, clientPortalAccess } from "@shared/schema-extended";
import { eq, and, desc, sql, asc } from "drizzle-orm";
import { isAIAvailable, getActiveProvider } from "../services/ai-adapter.js";
import { completeForTenant } from "../services/tenant-ai.js";

const router = Router();

// ══════════════════════════════════
// EMPLOYEES
// ══════════════════════════════════
router.get("/employees", authenticate, async (req: AuthRequest, res) => {
  const rows = await db.select().from(employees).where(eq(employees.tenantId, req.user!.tenantId)).orderBy(asc(employees.firstName));
  res.json(rows);
});
router.post("/employees", authenticate, async (req: AuthRequest, res) => {
  const [e] = await db.insert(employees).values({ tenantId: req.user!.tenantId, ...req.body }).returning();
  res.status(201).json(e);
});
router.put("/employees/:id", authenticate, async (req: AuthRequest, res) => {
  const [e] = await db.update(employees).set({ ...req.body, updatedAt: new Date() }).where(and(eq(employees.id, req.params.id), eq(employees.tenantId, req.user!.tenantId))).returning();
  res.json(e);
});
router.delete("/employees/:id", authenticate, async (req: AuthRequest, res) => {
  await db.delete(employees).where(and(eq(employees.id, req.params.id), eq(employees.tenantId, req.user!.tenantId)));
  res.json({ success: true });
});

// ══════════════════════════════════
// PROJECTS + GANTT
// ══════════════════════════════════
router.get("/projects", authenticate, async (req: AuthRequest, res) => {
  const rows = await db.select().from(projects).where(eq(projects.tenantId, req.user!.tenantId)).orderBy(desc(projects.createdAt));
  res.json(rows);
});
router.post("/projects", authenticate, async (req: AuthRequest, res) => {
  const [p] = await db.insert(projects).values({ tenantId: req.user!.tenantId, ownerId: req.user!.id, ...req.body }).returning();
  res.status(201).json(p);
});
router.put("/projects/:id", authenticate, async (req: AuthRequest, res) => {
  const [p] = await db.update(projects).set({ ...req.body, updatedAt: new Date() }).where(and(eq(projects.id, req.params.id), eq(projects.tenantId, req.user!.tenantId))).returning();
  res.json(p);
});
router.delete("/projects/:id", authenticate, async (req: AuthRequest, res) => {
  await db.delete(projectTasks).where(eq(projectTasks.projectId, req.params.id));
  await db.delete(projects).where(and(eq(projects.id, req.params.id), eq(projects.tenantId, req.user!.tenantId)));
  res.json({ success: true });
});

// Project tasks (Gantt)
router.get("/projects/:id/tasks", authenticate, async (req: AuthRequest, res) => {
  const tasks = await db.select().from(projectTasks).where(eq(projectTasks.projectId, req.params.id)).orderBy(asc(projectTasks.order));
  res.json(tasks);
});
router.post("/projects/:id/tasks", authenticate, async (req: AuthRequest, res) => {
  const [t] = await db.insert(projectTasks).values({ tenantId: req.user!.tenantId, projectId: req.params.id, ...req.body }).returning();
  // Update project progress
  const allTasks = await db.select().from(projectTasks).where(eq(projectTasks.projectId, req.params.id));
  const done = allTasks.filter(t => t.status === "done").length;
  const progress = allTasks.length > 0 ? Math.round((done / allTasks.length) * 100) : 0;
  await db.update(projects).set({ progress, updatedAt: new Date() }).where(eq(projects.id, req.params.id));
  res.status(201).json(t);
});
router.put("/projects/:projectId/tasks/:taskId", authenticate, async (req: AuthRequest, res) => {
  const [t] = await db.update(projectTasks).set({ ...req.body, updatedAt: new Date() }).where(eq(projectTasks.id, req.params.taskId)).returning();
  // Recalculate progress
  const allTasks = await db.select().from(projectTasks).where(eq(projectTasks.projectId, req.params.projectId));
  const done = allTasks.filter(t => t.status === "done").length;
  const progress = allTasks.length > 0 ? Math.round((done / allTasks.length) * 100) : 0;
  await db.update(projects).set({ progress, updatedAt: new Date() }).where(eq(projects.id, req.params.projectId));
  res.json(t);
});
router.delete("/projects/:projectId/tasks/:taskId", authenticate, async (req: AuthRequest, res) => {
  await db.delete(projectTasks).where(eq(projectTasks.id, req.params.taskId));
  res.json({ success: true });
});

// ══════════════════════════════════
// DOCUMENTS
// ══════════════════════════════════
router.get("/documents", authenticate, async (req: AuthRequest, res) => {
  const { parentId } = req.query as any;
  const rows = await db.select().from(documents).where(
    and(eq(documents.tenantId, req.user!.tenantId), parentId ? eq(documents.parentId, parentId) : sql`parent_id IS NULL`)
  ).orderBy(asc(documents.type), asc(documents.name));
  res.json(rows);
});
router.post("/documents", authenticate, async (req: AuthRequest, res) => {
  const [d] = await db.insert(documents).values({ tenantId: req.user!.tenantId, uploadedBy: req.user!.id, ...req.body }).returning();
  res.status(201).json(d);
});
router.put("/documents/:id", authenticate, async (req: AuthRequest, res) => {
  const [d] = await db.update(documents).set({ ...req.body, updatedAt: new Date() }).where(and(eq(documents.id, req.params.id), eq(documents.tenantId, req.user!.tenantId))).returning();
  res.json(d);
});
router.delete("/documents/:id", authenticate, async (req: AuthRequest, res) => {
  await db.delete(documents).where(and(eq(documents.id, req.params.id), eq(documents.tenantId, req.user!.tenantId)));
  res.json({ success: true });
});

// AI document summarization
router.post("/documents/:id/summarize", authenticate, async (req: AuthRequest, res) => {
  const [doc] = await db.select().from(documents).where(and(eq(documents.id, req.params.id), eq(documents.tenantId, req.user!.tenantId)));
  if (!doc?.content) return res.status(400).json({ error: "Document has no text content to summarize" });

  if (!isAIAvailable()) return res.json({ summary: doc.content.slice(0, 200) + "..." });

  const msg = await completeForTenant(req.user!.tenantId, { messages: [{ role: "user", content: `Summarize this document in 3-5 bullet points:\n\n${doc.content.slice(0, 3000)}` }], maxTokens: 400 });
  res.json({ summary: msg });
});

// ══════════════════════════════════
// LANDING PAGES
// ══════════════════════════════════
router.get("/landing-pages", authenticate, async (req: AuthRequest, res) => {
  const rows = await db.select().from(landingPages).where(eq(landingPages.tenantId, req.user!.tenantId)).orderBy(desc(landingPages.createdAt));
  res.json(rows);
});
router.post("/landing-pages", authenticate, async (req: AuthRequest, res) => {
  const slug = req.body.name?.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Date.now().toString().slice(-4);
  const [page] = await db.insert(landingPages).values({ tenantId: req.user!.tenantId, slug, createdBy: req.user!.id, ...req.body }).returning();
  res.status(201).json(page);
});
router.put("/landing-pages/:id", authenticate, async (req: AuthRequest, res) => {
  const [page] = await db.update(landingPages).set({ ...req.body, updatedAt: new Date() }).where(and(eq(landingPages.id, req.params.id), eq(landingPages.tenantId, req.user!.tenantId))).returning();
  res.json(page);
});
router.delete("/landing-pages/:id", authenticate, async (req: AuthRequest, res) => {
  await db.delete(landingPages).where(and(eq(landingPages.id, req.params.id), eq(landingPages.tenantId, req.user!.tenantId)));
  res.json({ success: true });
});

// AI Landing page generator
router.post("/landing-pages/generate", authenticate, async (req: AuthRequest, res) => {
  const { offer, audience, tone = "professional" } = req.body;
  if (!offer) return res.status(400).json({ error: "offer required" });

  if (!isAIAvailable()) {
    const page = { headline: `The Best ${offer} Solution`, subheadline: `Designed for ${audience || "modern businesses"}`, cta: "Get Started Free", blocks: [] };
    return res.json(page);
  }

  const msg = await completeForTenant(req.user!.tenantId, { messages: [{ role: "user", content: `Create a high-converting landing page for: "${offer}" targeting "${audience || "B2B teams"}". Tone: ${tone}.

Return ONLY JSON:
{
  "headline": "powerful value proposition headline",
  "subheadline": "supporting sentence expanding on benefit",
  "cta": "primary CTA button text",
  "ctaSecondary": "secondary link text",
  "features": [{"icon":"star","title":"Feature","description":"benefit-focused description"}]
}` }], maxTokens: 1200 });
  const result = JSON.parse(msg.replace(/```json|```/g, "").trim());
  res.json(result);
});

// ══════════════════════════════════
// AI FUNNEL BUILDER
// ══════════════════════════════════
router.get("/funnels", authenticate, async (req: AuthRequest, res) => {
  const rows = await db.select().from(funnels).where(eq(funnels.tenantId, req.user!.tenantId)).orderBy(desc(funnels.createdAt));
  res.json(rows);
});
router.post("/funnels/generate", authenticate, async (req: AuthRequest, res) => {
  try {
    const { offer, audience, goal = "lead_generation" } = req.body;
    if (!offer) return res.status(400).json({ error: "offer required" });

    let funnelData: any;

    if (process.env.ANTHROPIC_API_KEY) {
      const msg = await completeForTenant(req.user!.tenantId, { messages: [{ role: "user", content: `Generate a complete marketing funnel for: "${offer}" targeting "${audience || "B2B decision-makers"}". Goal: ${goal}.

Return ONLY JSON:
{
  "name": "Funnel name",
  "steps": [
    {"id":"1","type":"awareness","name":"Top of Funnel","content":{"headline":"","copy":"","cta":""},"order":1},
    {"id":"2","type":"consideration","name":"Middle of Funnel","content":{"headline":"","copy":"","cta":""},"order":2},
    {"id":"3","type":"conversion","name":"Bottom of Funnel","content":{"headline":"","copy":"","cta":""},"order":3},
    {"id":"4","type":"retention","name":"Post-Purchase","content":{"headline":"","copy":"","cta":""},"order":4}
  ]
}` }], maxTokens: 2000 });
      funnelData = JSON.parse(msg.replace(/```json|```/g, "").trim());
    } else {
      funnelData = {
        name: `${offer} Funnel`,
        steps: [
          { id: "1", type: "awareness", name: "Awareness", content: { headline: `Discover ${offer}`, copy: "Learn how we can help", cta: "Learn More" }, order: 1 },
          { id: "2", type: "consideration", name: "Consideration", content: { headline: "Why Choose Us", copy: "Compare options", cta: "See Pricing" }, order: 2 },
          { id: "3", type: "conversion", name: "Conversion", content: { headline: "Get Started Today", copy: "Join thousands", cta: "Start Free Trial" }, order: 3 },
        ],
        emailSequence: [{ subject: "Welcome!", body: "Thanks for signing up.", delayDays: 0 }],
        adCopy: [{ platform: "Google Ads", headline: offer, body: "Best solution", cta: "Learn More" }]
      };
    }

    const [funnel] = await db.insert(funnels).values({
      tenantId: req.user!.tenantId,
      name: funnelData.name,
      offer,
      targetAudience: audience,
      steps: funnelData.steps,
      emailSequence: funnelData.emailSequence,
      adCopy: funnelData.adCopy,
      status: "draft",
    }).returning();

    res.status(201).json({ funnel, ...funnelData });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
router.delete("/funnels/:id", authenticate, async (req: AuthRequest, res) => {
  await db.delete(funnels).where(and(eq(funnels.id, req.params.id), eq(funnels.tenantId, req.user!.tenantId)));
  res.json({ success: true });
});

// ══════════════════════════════════
// A/B TESTING
// ══════════════════════════════════
router.get("/ab-tests", authenticate, async (req: AuthRequest, res) => {
  const rows = await db.select().from(abTests).where(eq(abTests.tenantId, req.user!.tenantId)).orderBy(desc(abTests.createdAt));
  res.json(rows);
});
router.post("/ab-tests", authenticate, async (req: AuthRequest, res) => {
  const [test] = await db.insert(abTests).values({ tenantId: req.user!.tenantId, ...req.body }).returning();
  res.status(201).json(test);
});
router.put("/ab-tests/:id", authenticate, async (req: AuthRequest, res) => {
  const [test] = await db.update(abTests).set({ ...req.body, updatedAt: new Date() }).where(and(eq(abTests.id, req.params.id), eq(abTests.tenantId, req.user!.tenantId))).returning();
  res.json(test);
});
router.post("/ab-tests/:id/record", authenticate, async (req: AuthRequest, res) => {
  const { variantId, event } = req.body; // event: "view" | "conversion"
  const [test] = await db.select().from(abTests).where(and(eq(abTests.id, req.params.id), eq(abTests.tenantId, req.user!.tenantId)));
  if (!test) return res.status(404).json({ error: "Test not found" });

  const variants = (test.variants || []) as any[];
  const updated = variants.map(v => v.id === variantId
    ? { ...v, visitors: v.visitors + (event === "view" ? 1 : 0), conversions: v.conversions + (event === "conversion" ? 1 : 0) }
    : v
  );

  await db.update(abTests).set({ variants: updated }).where(eq(abTests.id, req.params.id));
  res.json({ success: true });
});

// ══════════════════════════════════
// REPUTATION MANAGEMENT
// ══════════════════════════════════
router.get("/reviews", authenticate, async (req: AuthRequest, res) => {
  const { platform, sentiment } = req.query as any;
  const rows = await db.select().from(reputationReviews).where(
    and(
      eq(reputationReviews.tenantId, req.user!.tenantId),
      platform ? eq(reputationReviews.platform, platform) : undefined,
      sentiment ? eq(reputationReviews.sentiment, sentiment) : undefined,
    )
  ).orderBy(desc(reputationReviews.publishedAt));
  res.json(rows);
});
router.post("/reviews", authenticate, async (req: AuthRequest, res) => {
  const [review] = await db.insert(reputationReviews).values({ tenantId: req.user!.tenantId, ...req.body }).returning();
  res.status(201).json(review);
});
router.post("/reviews/:id/respond", authenticate, async (req: AuthRequest, res) => {
  let response = req.body.response;

  // AI-generated response if not provided
  if (!response && process.env.ANTHROPIC_API_KEY) {
    const [review] = await db.select().from(reputationReviews).where(eq(reputationReviews.id, req.params.id));
    const msg = await completeForTenant(req.user!.tenantId, { messages: [{ role: "user", content: `Write a professional, empathetic business response to this ${review.sentiment} review (rating: ${review.rating}/5): "${review.content}". Keep it under 100 words, genuine, no generic phrases.` }], maxTokens: 200 });
    response = msg;
  }

  const [updated] = await db.update(reputationReviews).set({ response, respondedAt: new Date() }).where(and(eq(reputationReviews.id, req.params.id), eq(reputationReviews.tenantId, req.user!.tenantId))).returning();
  res.json(updated);
});

// ══════════════════════════════════
// WHITE-LABEL SETTINGS
// ══════════════════════════════════
router.get("/whitelabel", authenticate, async (req: AuthRequest, res) => {
  const [settings] = await db.select().from(whitelabelSettings).where(eq(whitelabelSettings.tenantId, req.user!.tenantId));
  res.json(settings || {});
});
router.put("/whitelabel", authenticate, requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
  const existing = await db.select().from(whitelabelSettings).where(eq(whitelabelSettings.tenantId, req.user!.tenantId));
  if (existing.length) {
    const [updated] = await db.update(whitelabelSettings).set({ ...req.body, updatedAt: new Date() }).where(eq(whitelabelSettings.tenantId, req.user!.tenantId)).returning();
    res.json(updated);
  } else {
    const [created] = await db.insert(whitelabelSettings).values({ tenantId: req.user!.tenantId, ...req.body }).returning();
    res.status(201).json(created);
  }
});

// ══════════════════════════════════
// CLIENT PORTAL
// ══════════════════════════════════
router.get("/client-portal/access", authenticate, async (req: AuthRequest, res) => {
  const rows = await db.select().from(clientPortalAccess).where(eq(clientPortalAccess.tenantId, req.user!.tenantId));
  res.json(rows);
});
router.post("/client-portal/invite", authenticate, async (req: AuthRequest, res) => {
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const [access] = await db.insert(clientPortalAccess).values({
    tenantId: req.user!.tenantId,
    email: req.body.email,
    contactId: req.body.contactId,
    accessToken: token,
    permissions: req.body.permissions || ["view_projects", "view_invoices"],
    isActive: true,
  }).returning();
  res.status(201).json({ ...access, portalUrl: `${process.env.APP_URL || "http://localhost:5000"}/portal/${token}` });
});

export default router;
