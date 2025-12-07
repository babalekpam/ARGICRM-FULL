import { Router, Request, Response } from "express";
import { db } from "../db.js";
import { conversationIntelligence, contacts, deals } from "../../shared/schema.js";
import { eq, desc, and, sql, gte, lte } from "drizzle-orm";
import { authenticate } from "../middleware/auth.js";
import { z } from "zod";
import OpenAI from "openai";

const router = Router();

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const createConversationSchema = z.object({
  contactId: z.string().optional(),
  dealId: z.string().optional(),
  conversationType: z.enum(["call", "meeting", "video_call"]),
  duration: z.number().optional(),
  participants: z.array(z.object({
    name: z.string(),
    email: z.string().optional(),
    role: z.string(),
    speakingTime: z.number().optional()
  })).optional(),
  transcription: z.string().optional(),
  recordingUrl: z.string().optional(),
  occurredAt: z.string()
});

router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { type, sentiment, startDate, endDate, limit = 50, offset = 0 } = req.query;

    let conditions: any[] = [eq(conversationIntelligence.tenantId, user.tenantId)];

    if (type) {
      conditions.push(eq(conversationIntelligence.conversationType, type as string));
    }
    if (sentiment) {
      conditions.push(eq(conversationIntelligence.sentiment, sentiment as string));
    }
    if (startDate) {
      conditions.push(gte(conversationIntelligence.occurredAt, new Date(startDate as string)));
    }
    if (endDate) {
      conditions.push(lte(conversationIntelligence.occurredAt, new Date(endDate as string)));
    }

    const conversations = await db
      .select()
      .from(conversationIntelligence)
      .where(and(...conditions))
      .orderBy(desc(conversationIntelligence.occurredAt))
      .limit(Number(limit))
      .offset(Number(offset));

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(conversationIntelligence)
      .where(and(...conditions));

    const total = totalResult[0]?.count || 0;

    res.json({
      success: true,
      data: conversations,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + conversations.length < total
      }
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ success: false, error: "Failed to fetch conversations" });
  }
});

router.get("/stats", authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const allConversations = await db
      .select()
      .from(conversationIntelligence)
      .where(eq(conversationIntelligence.tenantId, user.tenantId));

    const totalAnalyzed = allConversations.filter(c => c.analyzedAt).length;
    const totalConversations = allConversations.length;

    const sentimentCounts = {
      positive: allConversations.filter(c => c.sentiment === "positive").length,
      neutral: allConversations.filter(c => c.sentiment === "neutral").length,
      negative: allConversations.filter(c => c.sentiment === "negative").length
    };

    const avgSentimentScore = allConversations.length > 0
      ? allConversations.reduce((sum, c) => sum + (c.sentimentScore || 0), 0) / allConversations.length
      : 0;

    const topicCounts: Record<string, number> = {};
    allConversations.forEach(c => {
      (c.topics as any[])?.forEach((t: any) => {
        const topic = typeof t === "string" ? t : t.topic;
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    });

    const commonTopics = Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));

    const competitorCounts: Record<string, number> = {};
    allConversations.forEach(c => {
      (c.competitorMentions as string[])?.forEach(comp => {
        competitorCounts[comp] = (competitorCounts[comp] || 0) + 1;
      });
    });

    const topCompetitors = Object.entries(competitorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([competitor, count]) => ({ competitor, count }));

    const typeCounts = {
      call: allConversations.filter(c => c.conversationType === "call").length,
      meeting: allConversations.filter(c => c.conversationType === "meeting").length,
      video_call: allConversations.filter(c => c.conversationType === "video_call").length
    };

    res.json({
      success: true,
      data: {
        totalConversations,
        totalAnalyzed,
        sentimentCounts,
        avgSentimentScore: Math.round(avgSentimentScore * 100) / 100,
        commonTopics,
        topCompetitors,
        typeCounts
      }
    });
  } catch (error) {
    console.error("Error fetching conversation stats:", error);
    res.status(500).json({ success: false, error: "Failed to fetch conversation stats" });
  }
});

router.get("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const conversation = await db
      .select()
      .from(conversationIntelligence)
      .where(and(
        eq(conversationIntelligence.id, id),
        eq(conversationIntelligence.tenantId, user.tenantId)
      ))
      .limit(1);

    if (conversation.length === 0) {
      return res.status(404).json({ success: false, error: "Conversation not found" });
    }

    let contact = null;
    if (conversation[0].contactId) {
      const contactResult = await db
        .select()
        .from(contacts)
        .where(eq(contacts.id, Number(conversation[0].contactId)))
        .limit(1);
      contact = contactResult[0] || null;
    }

    res.json({
      success: true,
      data: {
        ...conversation[0],
        contact
      }
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ success: false, error: "Failed to fetch conversation" });
  }
});

router.get("/:id/highlights", authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const conversation = await db
      .select()
      .from(conversationIntelligence)
      .where(and(
        eq(conversationIntelligence.id, id),
        eq(conversationIntelligence.tenantId, user.tenantId)
      ))
      .limit(1);

    if (conversation.length === 0) {
      return res.status(404).json({ success: false, error: "Conversation not found" });
    }

    const conv = conversation[0];

    res.json({
      success: true,
      data: {
        summary: conv.summary,
        actionItems: conv.actionItems || [],
        objections: conv.objections || [],
        questions: conv.questions || [],
        dealSignals: conv.dealSignals || {},
        competitorMentions: conv.competitorMentions || [],
        nextSteps: conv.nextSteps || [],
        topics: conv.topics || [],
        sentiment: conv.sentiment,
        sentimentScore: conv.sentimentScore
      }
    });
  } catch (error) {
    console.error("Error fetching conversation highlights:", error);
    res.status(500).json({ success: false, error: "Failed to fetch highlights" });
  }
});

router.post("/", authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const validatedData = createConversationSchema.parse(req.body);

    const newConversation = await db
      .insert(conversationIntelligence)
      .values({
        tenantId: user.tenantId,
        contactId: validatedData.contactId,
        dealId: validatedData.dealId,
        conversationType: validatedData.conversationType,
        duration: validatedData.duration,
        participants: validatedData.participants || [],
        transcription: validatedData.transcription,
        recordingUrl: validatedData.recordingUrl,
        occurredAt: new Date(validatedData.occurredAt)
      })
      .returning();

    res.status(201).json({
      success: true,
      data: newConversation[0]
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "Invalid request data", details: error.errors });
    }
    res.status(500).json({ success: false, error: "Failed to create conversation" });
  }
});

router.post("/:id/analyze", authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const conversation = await db
      .select()
      .from(conversationIntelligence)
      .where(and(
        eq(conversationIntelligence.id, id),
        eq(conversationIntelligence.tenantId, user.tenantId)
      ))
      .limit(1);

    if (conversation.length === 0) {
      return res.status(404).json({ success: false, error: "Conversation not found" });
    }

    const conv = conversation[0];

    if (!conv.transcription) {
      return res.status(400).json({ success: false, error: "No transcription available for analysis" });
    }

    let analysis: any = {
      summary: "Conversation analysis pending AI processing.",
      sentiment: "neutral",
      sentimentScore: 0,
      topics: [],
      actionItems: [],
      questions: [],
      objections: [],
      competitorMentions: [],
      nextSteps: [],
      dealSignals: {}
    };

    if (openai) {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are an AI sales conversation analyst. Analyze the following conversation transcription and extract:
1. A brief summary (2-3 sentences)
2. Overall sentiment (positive, neutral, or negative) and score (-1 to 1)
3. Key topics discussed with confidence scores
4. Action items with assignees if mentioned
5. Questions asked by the prospect
6. Objections raised and how they were handled
7. Any competitor mentions
8. Suggested next steps
9. Deal signals (buying intent, budget discussed, timeline mentioned, decision makers identified, pain points)

Respond in JSON format.`
            },
            {
              role: "user",
              content: conv.transcription
            }
          ],
          response_format: { type: "json_object" }
        });

        analysis = JSON.parse(response.choices[0].message.content || "{}");
      } catch (aiError) {
        console.error("AI analysis error:", aiError);
      }
    }

    const updatedConversation = await db
      .update(conversationIntelligence)
      .set({
        summary: analysis.summary || "Conversation analyzed",
        sentiment: analysis.sentiment || "neutral",
        sentimentScore: analysis.sentimentScore || 0,
        topics: analysis.topics || [],
        actionItems: analysis.actionItems || [],
        questions: analysis.questions || [],
        objections: analysis.objections || [],
        competitorMentions: analysis.competitorMentions || [],
        nextSteps: analysis.nextSteps || [],
        dealSignals: analysis.dealSignals || {},
        analyzedAt: new Date()
      })
      .where(eq(conversationIntelligence.id, id))
      .returning();

    res.json({
      success: true,
      data: updatedConversation[0]
    });
  } catch (error) {
    console.error("Error analyzing conversation:", error);
    res.status(500).json({ success: false, error: "Failed to analyze conversation" });
  }
});

export function registerConversationIntelligenceRoutes(app: any) {
  app.use("/api/conversations", router);
}

export default router;
