import type { Express } from "express";
import { db } from "../db.js";
import { 
  engagementEvents, 
  intentScores, 
  contacts,
  accounts,
  insertEngagementEventSchema,
  insertIntentScoreSchema
} from "../../shared/schema.js";
import { eq, and, desc, sql, gte, lte, count } from "drizzle-orm";
import { authenticate } from "../middleware/auth.js";
import { z } from "zod";

const EVENT_SCORES: Record<string, number> = {
  email_open: 5,
  email_click: 10,
  page_view: 15,
  website_visit: 15,
  form_submit: 25,
  form_submission: 25,
  content_download: 20,
  download: 20,
  demo_request: 50,
  meeting_booked: 75,
  meeting_scheduled: 75,
};

function calculateTrend(last7DaysScore: number, last30DaysScore: number): string {
  if (last30DaysScore === 0) return "stable";
  const weeklyAverage30Days = last30DaysScore / 4;
  const ratio = last7DaysScore / weeklyAverage30Days;
  if (ratio > 1.2) return "rising";
  if (ratio < 0.8) return "declining";
  return "stable";
}

function getScoreTier(score: number): string {
  if (score >= 76) return "sizzling";
  if (score >= 51) return "hot";
  if (score >= 26) return "warm";
  return "cold";
}

export function registerIntentRoutes(app: Express) {

  // GET /api/intent/scores - Get all intent scores for tenant
  app.get('/api/intent/scores', authenticate as any, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const { tier, trend, limit = "50", offset = "0" } = req.query;

      let query = db.select({
        score: intentScores,
        contact: contacts,
        account: accounts,
      })
        .from(intentScores)
        .leftJoin(contacts, eq(intentScores.contactId, contacts.id))
        .leftJoin(accounts, eq(intentScores.accountId, accounts.id))
        .where(eq(intentScores.tenantId, tenantId))
        .orderBy(desc(intentScores.overallScore))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));

      const scores = await query;

      const filteredScores = scores.filter(s => {
        const scoreTier = getScoreTier(s.score.overallScore || 0);
        if (tier && scoreTier !== tier) return false;
        if (trend && s.score.trend !== trend) return false;
        return true;
      });

      const [totalCount] = await db.select({ count: count() })
        .from(intentScores)
        .where(eq(intentScores.tenantId, tenantId));

      const tiers = await db.select({
        cold: sql<number>`count(*) filter (where ${intentScores.overallScore} <= 25)`,
        warm: sql<number>`count(*) filter (where ${intentScores.overallScore} > 25 and ${intentScores.overallScore} <= 50)`,
        hot: sql<number>`count(*) filter (where ${intentScores.overallScore} > 50 and ${intentScores.overallScore} <= 75)`,
        sizzling: sql<number>`count(*) filter (where ${intentScores.overallScore} > 75)`,
        avgScore: sql<number>`avg(${intentScores.overallScore})`,
        rising: sql<number>`count(*) filter (where ${intentScores.trend} = 'rising')`,
      })
        .from(intentScores)
        .where(eq(intentScores.tenantId, tenantId));

      res.json({
        success: true,
        scores: filteredScores.map(s => ({
          ...s.score,
          contact: s.contact,
          account: s.account,
          tier: getScoreTier(s.score.overallScore || 0),
        })),
        total: Number(totalCount?.count || 0),
        metrics: {
          cold: Number(tiers[0]?.cold || 0),
          warm: Number(tiers[0]?.warm || 0),
          hot: Number(tiers[0]?.hot || 0),
          sizzling: Number(tiers[0]?.sizzling || 0),
          averageScore: Math.round(Number(tiers[0]?.avgScore || 0)),
          trendingUp: Number(tiers[0]?.rising || 0),
        }
      });
    } catch (error: any) {
      console.error("Error fetching intent scores:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/intent/scores/:id - Get intent score details
  app.get('/api/intent/scores/:id', authenticate as any, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const [score] = await db.select({
        score: intentScores,
        contact: contacts,
        account: accounts,
      })
        .from(intentScores)
        .leftJoin(contacts, eq(intentScores.contactId, contacts.id))
        .leftJoin(accounts, eq(intentScores.accountId, accounts.id))
        .where(and(
          eq(intentScores.id, id),
          eq(intentScores.tenantId, tenantId)
        ));

      if (!score) {
        return res.status(404).json({ success: false, error: "Intent score not found" });
      }

      const recentEvents = await db.select()
        .from(engagementEvents)
        .where(and(
          eq(engagementEvents.tenantId, tenantId),
          score.score.contactId ? eq(engagementEvents.contactId, score.score.contactId) : sql`true`,
        ))
        .orderBy(desc(engagementEvents.createdAt))
        .limit(20);

      res.json({
        success: true,
        score: {
          ...score.score,
          contact: score.contact,
          account: score.account,
          tier: getScoreTier(score.score.overallScore || 0),
        },
        recentEvents,
      });
    } catch (error: any) {
      console.error("Error fetching intent score:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /api/intent/events - Record an engagement event
  app.post('/api/intent/events', authenticate as any, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const eventScore = EVENT_SCORES[req.body.eventType] || 1;

      const validatedData = insertEngagementEventSchema.parse({
        ...req.body,
        tenantId,
        score: eventScore,
      });

      const [newEvent] = await db.insert(engagementEvents)
        .values(validatedData)
        .returning();

      res.json({
        success: true,
        event: newEvent,
        message: "Engagement event recorded successfully"
      });
    } catch (error: any) {
      console.error("Error recording engagement event:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /api/intent/calculate/:contactId - Recalculate intent score for a contact
  app.post('/api/intent/calculate/:contactId', authenticate as any, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      const { contactId } = req.params;

      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const events30Days = await db.select()
        .from(engagementEvents)
        .where(and(
          eq(engagementEvents.tenantId, tenantId),
          eq(engagementEvents.contactId, contactId),
          gte(engagementEvents.createdAt, thirtyDaysAgo)
        ));

      const events7Days = events30Days.filter(e => 
        e.createdAt && new Date(e.createdAt) >= sevenDaysAgo
      );

      const score7Days = events7Days.reduce((sum, e) => sum + (e.score || EVENT_SCORES[e.eventType] || 1), 0);
      const score30Days = events30Days.reduce((sum, e) => sum + (e.score || EVENT_SCORES[e.eventType] || 1), 0);

      const overallScore = Math.min(100, score30Days);
      const trend = calculateTrend(score7Days, score30Days);

      const breakdown: Record<string, number> = {};
      events30Days.forEach(e => {
        const category = e.eventType.includes('email') ? 'emailEngagement' :
                        e.eventType.includes('page') || e.eventType.includes('website') ? 'websiteActivity' :
                        e.eventType.includes('download') ? 'contentDownloads' :
                        e.eventType.includes('meeting') ? 'meetingIntent' :
                        e.eventType.includes('demo') ? 'buyingSignals' : 'socialEngagement';
        breakdown[category] = (breakdown[category] || 0) + (e.score || 1);
      });

      const topSignals = events30Days
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 5)
        .map(e => ({
          type: e.eventType,
          description: `${e.eventType.replace(/_/g, ' ')} event`,
          score: e.score || 1,
          timestamp: e.createdAt?.toISOString() || new Date().toISOString(),
        }));

      const [existingScore] = await db.select()
        .from(intentScores)
        .where(and(
          eq(intentScores.tenantId, tenantId),
          eq(intentScores.contactId, contactId)
        ));

      let result;
      if (existingScore) {
        [result] = await db.update(intentScores)
          .set({
            overallScore,
            trend,
            scoreBreakdown: breakdown,
            topSignals,
            signalCount: events30Days.length,
            lastActivityAt: events30Days[0]?.createdAt || null,
            updatedAt: new Date(),
          })
          .where(eq(intentScores.id, existingScore.id))
          .returning();
      } else {
        [result] = await db.insert(intentScores)
          .values({
            tenantId,
            contactId,
            overallScore,
            trend,
            scoreBreakdown: breakdown,
            topSignals,
            signalCount: events30Days.length,
            lastActivityAt: events30Days[0]?.createdAt || null,
          })
          .returning();
      }

      res.json({
        success: true,
        score: result,
        tier: getScoreTier(overallScore),
        message: "Intent score calculated successfully"
      });
    } catch (error: any) {
      console.error("Error calculating intent score:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST /api/intent/calculate-batch - Batch recalculate scores
  app.post('/api/intent/calculate-batch', authenticate as any, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const { contactIds } = req.body;

      if (!contactIds || !Array.isArray(contactIds)) {
        return res.status(400).json({ success: false, error: "contactIds array required" });
      }

      const results: any[] = [];
      for (const contactId of contactIds.slice(0, 100)) {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const events30Days = await db.select()
          .from(engagementEvents)
          .where(and(
            eq(engagementEvents.tenantId, tenantId),
            eq(engagementEvents.contactId, contactId),
            gte(engagementEvents.createdAt, thirtyDaysAgo)
          ));

        const events7Days = events30Days.filter(e => 
          e.createdAt && new Date(e.createdAt) >= sevenDaysAgo
        );

        const score7Days = events7Days.reduce((sum, e) => sum + (e.score || 1), 0);
        const score30Days = events30Days.reduce((sum, e) => sum + (e.score || 1), 0);

        const overallScore = Math.min(100, score30Days);
        const trend = calculateTrend(score7Days, score30Days);

        const [existingScore] = await db.select()
          .from(intentScores)
          .where(and(
            eq(intentScores.tenantId, tenantId),
            eq(intentScores.contactId, contactId)
          ));

        if (existingScore) {
          await db.update(intentScores)
            .set({
              overallScore,
              trend,
              signalCount: events30Days.length,
              updatedAt: new Date(),
            })
            .where(eq(intentScores.id, existingScore.id));
        } else {
          await db.insert(intentScores)
            .values({
              tenantId,
              contactId,
              overallScore,
              trend,
              signalCount: events30Days.length,
            });
        }

        results.push({ contactId, overallScore, trend });
      }

      res.json({
        success: true,
        processed: results.length,
        results,
        message: `Batch recalculated ${results.length} intent scores`
      });
    } catch (error: any) {
      console.error("Error batch calculating intent scores:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/intent/signals/:accountId - Get signals for an account
  app.get('/api/intent/signals/:accountId', authenticate as any, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      const { accountId } = req.params;

      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const signals = await db.select({
        event: engagementEvents,
        contact: contacts,
      })
        .from(engagementEvents)
        .leftJoin(contacts, eq(engagementEvents.contactId, contacts.id))
        .where(and(
          eq(engagementEvents.tenantId, tenantId),
          eq(engagementEvents.accountId, accountId)
        ))
        .orderBy(desc(engagementEvents.createdAt))
        .limit(50);

      const byType = signals.reduce((acc, s) => {
        const type = s.event.eventType;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const [account] = await db.select()
        .from(accounts)
        .where(eq(accounts.id, accountId));

      const [intentScore] = await db.select()
        .from(intentScores)
        .where(and(
          eq(intentScores.tenantId, tenantId),
          eq(intentScores.accountId, accountId)
        ));

      res.json({
        success: true,
        account,
        intentScore: intentScore ? {
          ...intentScore,
          tier: getScoreTier(intentScore.overallScore || 0),
        } : null,
        signals: signals.map(s => ({
          ...s.event,
          contact: s.contact,
        })),
        signalsByType: byType,
        total: signals.length,
      });
    } catch (error: any) {
      console.error("Error fetching account signals:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // GET /api/intent/trending - Get trending/rising accounts
  app.get('/api/intent/trending', authenticate as any, async (req: any, res) => {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const { limit = "20" } = req.query;

      const trendingScores = await db.select({
        score: intentScores,
        contact: contacts,
        account: accounts,
      })
        .from(intentScores)
        .leftJoin(contacts, eq(intentScores.contactId, contacts.id))
        .leftJoin(accounts, eq(intentScores.accountId, accounts.id))
        .where(and(
          eq(intentScores.tenantId, tenantId),
          eq(intentScores.trend, 'rising')
        ))
        .orderBy(desc(intentScores.overallScore))
        .limit(parseInt(limit as string));

      const recentActivity = await db.select({
        event: engagementEvents,
        contact: contacts,
      })
        .from(engagementEvents)
        .leftJoin(contacts, eq(engagementEvents.contactId, contacts.id))
        .where(eq(engagementEvents.tenantId, tenantId))
        .orderBy(desc(engagementEvents.createdAt))
        .limit(20);

      res.json({
        success: true,
        trending: trendingScores.map(s => ({
          ...s.score,
          contact: s.contact,
          account: s.account,
          tier: getScoreTier(s.score.overallScore || 0),
        })),
        recentActivity: recentActivity.map(a => ({
          ...a.event,
          contact: a.contact,
        })),
        total: trendingScores.length,
      });
    } catch (error: any) {
      console.error("Error fetching trending accounts:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
}
