import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { requireFeature } from "../middleware/feature-check.js";
import { db } from "../db.js";
import { deals, contacts, leads, tasks } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { isAIAvailable } from "../services/ai-adapter.js";
import { askJSONForTenant } from "../services/tenant-ai.js";

const router = Router();

// ── Deal Intelligence ────────────────────────────────────────────
router.post("/deal-intelligence", authenticate, requireFeature("ai.tools"), async (req: AuthRequest, res) => {
  try {
    const { dealId } = req.body;
    const tenantId = req.user!.tenantId;

    const dealRows = await db.select().from(deals)
      .where(and(eq(deals.id, dealId), eq(deals.tenantId, tenantId)))
      .limit(1);
    if (!dealRows.length) return res.status(404).json({ error: "Deal not found" });
    const deal = dealRows[0];

    const daysSinceUpdate = deal.updatedAt
      ? Math.floor((Date.now() - new Date(deal.updatedAt).getTime()) / 86400000)
      : 0;
    const daysInPipeline = deal.createdAt
      ? Math.floor((Date.now() - new Date(deal.createdAt).getTime()) / 86400000)
      : 0;
    const isStale = daysSinceUpdate > 7;
    const isHighValue = (deal.value ?? 0) > 50000;

    let healthScore = 70;
    if (isStale) healthScore -= 20;
    if (daysInPipeline > 90) healthScore -= 15;
    if (isHighValue) healthScore += 10;
    if (deal.stage === "closed_won") healthScore = 100;
    if (deal.stage === "closed_lost") healthScore = 0;
    healthScore = Math.max(0, Math.min(100, healthScore));

    const risks: string[] = [];
    if (isStale) risks.push(`No activity for ${daysSinceUpdate} days`);
    if (daysInPipeline > 90) risks.push("Deal has been open for over 90 days");
    if (!deal.value || deal.value === 0) risks.push("No deal value set");

    let aiInsights = null;
    if (isAIAvailable()) {
      const prompt = `Analyze this CRM deal and provide actionable sales intelligence:
Deal: ${deal.name}
Stage: ${deal.stage}
Value: $${deal.value ?? 0}
Days in pipeline: ${daysInPipeline}
Days since last update: ${daysSinceUpdate}
Risks: ${risks.join(", ") || "none detected"}

Respond with JSON: { "summary": "2-sentence deal assessment", "nextActions": ["action1","action2","action3"], "talkingPoints": ["point1","point2"], "closingProbability": 0-100, "recommendation": "one sentence recommendation" }`;

      aiInsights = await askJSONForTenant(tenantId, prompt);
    }

    res.json({
      deal: { id: deal.id, name: deal.name, stage: deal.stage, value: deal.value },
      healthScore,
      risks,
      daysInPipeline,
      daysSinceLastActivity: daysSinceUpdate,
      isStale,
      aiInsights: aiInsights || {
        summary: `This ${deal.stage} deal${isStale ? " has been stale" : " is progressing"}. ${risks.length ? "Attention needed." : "Looks healthy."}`,
        nextActions: isStale
          ? ["Send a check-in email", "Schedule a follow-up call", "Review deal requirements"]
          : ["Update deal notes", "Set next follow-up date", "Confirm budget and timeline"],
        talkingPoints: ["ROI and business impact", "Implementation timeline and support"],
        closingProbability: healthScore,
        recommendation: isStale ? "Re-engage this deal immediately" : "Keep momentum going with consistent follow-up",
      }
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Smart Email Composer ────────────────────────────────────────
router.post("/compose-email", authenticate, requireFeature("ai.tools"), async (req: AuthRequest, res) => {
  try {
    const { contactName, company, dealName, stage, purpose, tone = "professional", additionalContext = "" } = req.body;

    const purposes: Record<string, string> = {
      followup: "a follow-up after no response",
      intro: "a first outreach / cold introduction",
      proposal: "sending a proposal",
      checkin: "a friendly check-in to maintain the relationship",
      close: "pushing towards closing the deal",
      winback: "re-engaging a lost or cold contact",
    };

    const purposeDesc = purposes[purpose] || purpose;

    const prompt = `You are an expert B2B sales email writer. Write ${purposeDesc} email.

Contact: ${contactName || "the prospect"}
Company: ${company || "their company"}
${dealName ? `Deal: ${dealName}` : ""}
${stage ? `Deal Stage: ${stage}` : ""}
Tone: ${tone}
${additionalContext ? `Context: ${additionalContext}` : ""}

Write a concise, personalized email that doesn't sound generic. 
Respond with JSON: { "subject": "email subject", "body": "full email body with proper greeting and sign-off", "followUpTips": ["tip1","tip2"] }`;

    if (!isAIAvailable()) {
      return res.json({
        subject: `Following up - ${dealName || company || "our conversation"}`,
        body: `Hi ${contactName || "there"},\n\nI wanted to follow up on ${dealName || "our recent conversation"}. I'd love to connect and discuss how we can help ${company || "your team"}.\n\nWould you have 15 minutes this week?\n\nBest regards`,
        followUpTips: ["Send at 9am Tuesday-Thursday for best open rates", "Keep subject lines under 50 characters"],
      });
    }

    const result = await askJSONForTenant(req.user!.tenantId, prompt);
    res.json(result);
  } catch (err: any) { res.status((err as any).status || 500).json({ error: err.message }); }
});

// ── Meeting Summarizer ──────────────────────────────────────────
router.post("/summarize-meeting", authenticate, requireFeature("ai.tools"), async (req: AuthRequest, res) => {
  try {
    const { transcript, contactName, dealName } = req.body;
    if (!transcript?.trim()) return res.status(400).json({ error: "Transcript is required" });

    const prompt = `You are a CRM assistant. Analyze this sales meeting transcript and extract structured information.

${contactName ? `Contact: ${contactName}` : ""}
${dealName ? `Deal: ${dealName}` : ""}

TRANSCRIPT:
${transcript.slice(0, 8000)}

Respond with JSON:
{
  "summary": "3-4 sentence meeting summary",
  "keyPoints": ["point1","point2","point3"],
  "actionItems": [{"task":"task description","owner":"prospect|rep","dueDate":"timeframe like 'by Friday' or null","priority":"high|medium|low"}],
  "objections": ["objection1","objection2"],
  "nextSteps": "agreed next step with timeline",
  "sentiment": "positive|neutral|negative",
  "dealSignals": {"buyingIntent":"high|medium|low","budgetMentioned":true,"timelineMentioned":true,"competitorsMentioned":[]},
  "suggestedStageUpdate": "stage name or null if no change"
}`;

    if (!isAIAvailable()) {
      return res.json({
        summary: "Meeting transcript analyzed. Key topics discussed include product requirements and next steps.",
        keyPoints: ["Requirements discussed", "Timeline reviewed", "Follow-up scheduled"],
        actionItems: [{ task: "Send proposal", owner: "rep", dueDate: "within 3 days", priority: "high" }],
        objections: [],
        nextSteps: "Send follow-up email with proposal",
        sentiment: "positive",
        dealSignals: { buyingIntent: "medium", budgetMentioned: false, timelineMentioned: false, competitorsMentioned: [] },
        suggestedStageUpdate: null,
      });
    }

    const result = await askJSONForTenant(req.user!.tenantId, prompt);
    res.json(result);
  } catch (err: any) { res.status((err as any).status || 500).json({ error: err.message }); }
});

// ── Company Enrichment ──────────────────────────────────────────
router.post("/enrich-company", authenticate, requireFeature("contacts.advanced"), async (req: AuthRequest, res) => {
  try {
    const { domain, companyName } = req.body;
    if (!domain && !companyName) return res.status(400).json({ error: "domain or companyName required" });

    const prompt = `Based on the ${domain ? `domain: ${domain}` : `company name: ${companyName}`}, provide realistic B2B company intelligence data.

Respond with JSON: {
  "name": "company name",
  "industry": "industry vertical",
  "size": "employee range like 51-200",
  "revenue": "revenue range like $10M-$50M",
  "description": "2-sentence company description",
  "headquarters": "City, Country",
  "founded": "year as number",
  "technologies": ["tech1","tech2","tech3"],
  "keyDecisionMakers": [{"title":"CTO","department":"Engineering"}],
  "fundingStage": "stage like Series B",
  "linkedinUrl": "https://linkedin.com/company/...",
  "confidence": "high|medium|low"
}`;

    if (!isAIAvailable()) {
      return res.json({
        name: companyName || domain?.replace(/\.(com|io|co|net|org)$/, "") || "Unknown",
        industry: "Technology",
        size: "51-200",
        revenue: "$5M-$25M",
        description: "A technology company focused on software solutions.",
        headquarters: "San Francisco, USA",
        founded: 2018,
        technologies: ["AWS", "React", "Salesforce"],
        keyDecisionMakers: [{ title: "CEO", department: "Executive" }, { title: "CTO", department: "Engineering" }],
        fundingStage: "Series A",
        linkedinUrl: null,
        confidence: "low",
      });
    }

    const result = await askJSONForTenant(req.user!.tenantId, prompt);
    res.json(result);
  } catch (err: any) { res.status((err as any).status || 500).json({ error: err.message }); }
});

// ── Contact Enrichment ─────────────────────────────────────────
router.post("/enrich-contact", authenticate, requireFeature("contacts.advanced"), async (req: AuthRequest, res) => {
  try {
    const { email, firstName, lastName, company } = req.body;
    if (!email && !firstName) return res.status(400).json({ error: "email or firstName required" });

    const prompt = `Based on this B2B contact information, provide enriched professional data.
Email: ${email || "unknown"}
Name: ${[firstName, lastName].filter(Boolean).join(" ") || "unknown"}
Company: ${company || "unknown"}

Respond with JSON: {
  "title": "likely job title",
  "department": "department",
  "seniority": "c-suite|vp|director|manager|individual",
  "linkedinUrl": "linkedin url or null",
  "phone": "phone or null",
  "location": "City, Country",
  "skills": ["skill1","skill2"],
  "bio": "1-sentence professional bio",
  "confidence": "high|medium|low"
}`;

    if (!isAIAvailable()) {
      return res.json({
        title: "Account Executive",
        department: "Sales",
        seniority: "manager",
        linkedinUrl: null,
        phone: null,
        location: "United States",
        skills: ["Sales", "CRM", "Business Development"],
        bio: "Sales professional focused on B2B partnerships.",
        confidence: "low",
      });
    }

    const result = await askJSONForTenant(req.user!.tenantId, prompt);
    res.json(result);
  } catch (err: any) { res.status((err as any).status || 500).json({ error: err.message }); }
});

// ── AI Status ─────────────────────────────────────────────────
router.get("/status", authenticate, async (_req, res) => {
  res.json({ available: isAIAvailable() });
});

export default router;
