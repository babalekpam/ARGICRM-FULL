import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { db } from "../db.js";
import { agentSessions, agentMessages, agentMemories, agentTasks, agentLeadGenResults, leads } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { runAgent, runLeadGenCampaign, saveMemory, AGENT_DEFINITIONS, type AgentType } from "../services/agents.js";

const router = Router();

// ── List all agent types & their definitions ────────────────────
router.get("/types", authenticate, async (req: AuthRequest, res) => {
  const defs = Object.entries(AGENT_DEFINITIONS).map(([type, def]) => ({
    type,
    name: def.name,
    role: def.role,
    emoji: def.emoji,
    color: def.color,
    department: def.department,
    skills: def.skills,
  }));
  res.json(defs);
});

// ── Get agent sessions ──────────────────────────────────────────
router.get("/sessions", authenticate, async (req: AuthRequest, res) => {
  const sessions = await db.select()
    .from(agentSessions)
    .where(and(eq(agentSessions.tenantId, req.user!.tenantId), eq(agentSessions.userId, req.user!.id)))
    .orderBy(desc(agentSessions.updatedAt))
    .limit(50);
  res.json(sessions);
});

// ── Get session messages ────────────────────────────────────────
router.get("/sessions/:sessionId/messages", authenticate, async (req: AuthRequest, res) => {
  const messages = await db.select()
    .from(agentMessages)
    .where(eq(agentMessages.sessionId, req.params.sessionId))
    .orderBy(agentMessages.createdAt);
  res.json(messages);
});

// ── Chat with agent ─────────────────────────────────────────────
router.post("/chat", authenticate, async (req: AuthRequest, res) => {
  try {
    const { agentType, message, sessionId } = req.body;

    if (!agentType || !message) {
      return res.status(400).json({ error: "agentType and message are required" });
    }

    // Get business context for the agent
    const businessContext = req.body.businessContext || {};

    const result = await runAgent({
      tenantId: req.user!.tenantId,
      userId: req.user!.id,
      agentType: agentType as AgentType,
      userMessage: message,
      sessionId,
      businessContext,
    });

    res.json(result);
  } catch (err: any) {
    console.error("Agent chat error:", err);
    res.status(500).json({ error: err.message || "Agent failed to respond" });
  }
});

// ── Get agent memories ──────────────────────────────────────────
router.get("/memories/:agentType", authenticate, async (req: AuthRequest, res) => {
  const memories = await db.select()
    .from(agentMemories)
    .where(and(
      eq(agentMemories.tenantId, req.user!.tenantId),
      eq(agentMemories.agentType, req.params.agentType)
    ))
    .orderBy(desc(agentMemories.importance), desc(agentMemories.createdAt));
  res.json(memories);
});

// ── Add manual memory ──────────────────────────────────────────
router.post("/memories/:agentType", authenticate, async (req: AuthRequest, res) => {
  const { category, key, value, importance } = req.body;
  await saveMemory(req.user!.tenantId, req.params.agentType, category, key, value, importance || 7, "user_explicit");
  res.json({ success: true });
});

// ── Delete memory ───────────────────────────────────────────────
router.delete("/memories/:memoryId", authenticate, async (req: AuthRequest, res) => {
  await db.delete(agentMemories).where(and(eq(agentMemories.id, req.params.memoryId), eq(agentMemories.tenantId, req.user!.tenantId)));
  res.json({ success: true });
});

// ── Lead generation campaign ────────────────────────────────────
router.post("/lead-gen", authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await runLeadGenCampaign({
      tenantId: req.user!.tenantId,
      userId: req.user!.id,
      ...req.body,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Get lead gen results ────────────────────────────────────────
router.get("/lead-gen/results", authenticate, async (req: AuthRequest, res) => {
  const results = await db.select()
    .from(agentLeadGenResults)
    .where(eq(agentLeadGenResults.tenantId, req.user!.tenantId))
    .orderBy(desc(agentLeadGenResults.createdAt))
    .limit(100);
  res.json(results);
});

// ── Import lead gen result as CRM lead ─────────────────────────
router.post("/lead-gen/:resultId/import", authenticate, async (req: AuthRequest, res) => {
  try {
    const [result] = await db.select().from(agentLeadGenResults)
      .where(and(eq(agentLeadGenResults.id, req.params.resultId), eq(agentLeadGenResults.tenantId, req.user!.tenantId)));

    if (!result) return res.status(404).json({ error: "Result not found" });

    const [lead] = await db.insert(leads).values({
      tenantId: req.user!.tenantId,
      firstName: result.firstName || "Unknown",
      lastName: result.lastName,
      email: result.email,
      company: result.company,
      jobTitle: result.jobTitle,
      phone: result.phone,
      source: result.source || "ai_prospected",
      score: result.score,
      status: "new",
      createdBy: req.user!.id,
    }).returning();

    await db.update(agentLeadGenResults)
      .set({ importedAsLeadId: lead.id, outreachStatus: "contacted" })
      .where(eq(agentLeadGenResults.id, result.id));

    res.json({ lead, success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Agent stats ─────────────────────────────────────────────────
router.get("/stats", authenticate, async (req: AuthRequest, res) => {
  const sessionCounts = await db.select({ agent: agentSessions.agentType, count: sql<number>`count(*)` })
    .from(agentSessions)
    .where(eq(agentSessions.tenantId, req.user!.tenantId))
    .groupBy(agentSessions.agentType);

  const memoryCounts = await db.select({ agent: agentMemories.agentType, count: sql<number>`count(*)` })
    .from(agentMemories)
    .where(eq(agentMemories.tenantId, req.user!.tenantId))
    .groupBy(agentMemories.agentType);

  const leadGenCount = await db.select({ count: sql<number>`count(*)` })
    .from(agentLeadGenResults)
    .where(eq(agentLeadGenResults.tenantId, req.user!.tenantId));

  res.json({
    sessions: sessionCounts,
    memories: memoryCounts,
    totalLeadsGenerated: Number(leadGenCount[0]?.count || 0),
  });
});

export default router;
