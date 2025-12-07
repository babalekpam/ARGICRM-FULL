import { Router, Request, Response } from "express";
import { db } from "../db.js";
import { extensionSessions, extensionEvents, contacts, prospectDatabase } from "../../shared/schema.js";
import { eq, and, desc, sql } from "drizzle-orm";
import { authenticate } from "../middleware/auth.js";
import { z } from "zod";
import crypto from "crypto";

const router = Router();

const authSchema = z.object({
  extensionVersion: z.string().optional(),
  browserInfo: z.string().optional()
});

const eventSchema = z.object({
  sessionToken: z.string(),
  eventType: z.enum(["linkedin_profile_scraped", "linkedin_search_scraped", "email_found", "contact_saved"]),
  sourceUrl: z.string().optional(),
  scrapedData: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    title: z.string().optional(),
    company: z.string().optional(),
    linkedinUrl: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    headline: z.string().optional(),
    connections: z.number().optional()
  }).optional()
});

const linkedinScrapeSchema = z.object({
  sessionToken: z.string(),
  profileData: z.object({
    firstName: z.string(),
    lastName: z.string(),
    title: z.string().optional(),
    company: z.string().optional(),
    linkedinUrl: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    headline: z.string().optional(),
    connections: z.number().optional(),
    about: z.string().optional(),
    experience: z.array(z.object({
      title: z.string(),
      company: z.string(),
      duration: z.string().optional()
    })).optional()
  }),
  saveAsContact: z.boolean().optional(),
  saveAsProspect: z.boolean().optional()
});

router.post("/auth", authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const validatedData = authSchema.parse(req.body);

    const sessionToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const newSession = await db
      .insert(extensionSessions)
      .values({
        tenantId: user.tenantId,
        userId: user.id,
        sessionToken,
        extensionVersion: validatedData.extensionVersion,
        browserInfo: validatedData.browserInfo,
        isActive: true,
        lastActiveAt: new Date(),
        expiresAt
      })
      .returning();

    res.status(201).json({
      success: true,
      data: {
        sessionToken,
        expiresAt,
        sessionId: newSession[0].id
      }
    });
  } catch (error) {
    console.error("Error authenticating extension:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "Invalid request data", details: error.errors });
    }
    res.status(500).json({ success: false, error: "Failed to authenticate extension" });
  }
});

router.post("/events", async (req: Request, res: Response) => {
  try {
    const validatedData = eventSchema.parse(req.body);

    const session = await db
      .select()
      .from(extensionSessions)
      .where(and(
        eq(extensionSessions.sessionToken, validatedData.sessionToken),
        eq(extensionSessions.isActive, true)
      ))
      .limit(1);

    if (session.length === 0) {
      return res.status(401).json({ success: false, error: "Invalid or expired session" });
    }

    if (new Date() > new Date(session[0].expiresAt)) {
      await db
        .update(extensionSessions)
        .set({ isActive: false })
        .where(eq(extensionSessions.id, session[0].id));
      return res.status(401).json({ success: false, error: "Session expired" });
    }

    await db
      .update(extensionSessions)
      .set({ lastActiveAt: new Date() })
      .where(eq(extensionSessions.id, session[0].id));

    const newEvent = await db
      .insert(extensionEvents)
      .values({
        sessionId: session[0].id,
        eventType: validatedData.eventType,
        sourceUrl: validatedData.sourceUrl,
        scrapedData: validatedData.scrapedData
      })
      .returning();

    res.status(201).json({
      success: true,
      data: newEvent[0]
    });
  } catch (error) {
    console.error("Error recording extension event:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "Invalid request data", details: error.errors });
    }
    res.status(500).json({ success: false, error: "Failed to record event" });
  }
});

router.get("/sessions", authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const sessions = await db
      .select()
      .from(extensionSessions)
      .where(and(
        eq(extensionSessions.userId, user.id),
        eq(extensionSessions.isActive, true)
      ))
      .orderBy(desc(extensionSessions.lastActiveAt));

    res.json({
      success: true,
      data: sessions.map(s => ({
        id: s.id,
        extensionVersion: s.extensionVersion,
        browserInfo: s.browserInfo,
        lastActiveAt: s.lastActiveAt,
        expiresAt: s.expiresAt,
        createdAt: s.createdAt
      }))
    });
  } catch (error) {
    console.error("Error fetching extension sessions:", error);
    res.status(500).json({ success: false, error: "Failed to fetch sessions" });
  }
});

router.delete("/sessions/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const session = await db
      .select()
      .from(extensionSessions)
      .where(and(
        eq(extensionSessions.id, id),
        eq(extensionSessions.userId, user.id)
      ))
      .limit(1);

    if (session.length === 0) {
      return res.status(404).json({ success: false, error: "Session not found" });
    }

    await db
      .update(extensionSessions)
      .set({ isActive: false })
      .where(eq(extensionSessions.id, id));

    res.json({
      success: true,
      message: "Session revoked successfully"
    });
  } catch (error) {
    console.error("Error revoking extension session:", error);
    res.status(500).json({ success: false, error: "Failed to revoke session" });
  }
});

router.post("/scrape/linkedin", async (req: Request, res: Response) => {
  try {
    const validatedData = linkedinScrapeSchema.parse(req.body);

    const session = await db
      .select()
      .from(extensionSessions)
      .where(and(
        eq(extensionSessions.sessionToken, validatedData.sessionToken),
        eq(extensionSessions.isActive, true)
      ))
      .limit(1);

    if (session.length === 0) {
      return res.status(401).json({ success: false, error: "Invalid or expired session" });
    }

    if (new Date() > new Date(session[0].expiresAt)) {
      await db
        .update(extensionSessions)
        .set({ isActive: false })
        .where(eq(extensionSessions.id, session[0].id));
      return res.status(401).json({ success: false, error: "Session expired" });
    }

    await db
      .update(extensionSessions)
      .set({ lastActiveAt: new Date() })
      .where(eq(extensionSessions.id, session[0].id));

    const { profileData, saveAsContact, saveAsProspect } = validatedData;

    let savedContactId: string | null = null;
    let savedProspectId: string | null = null;

    if (saveAsContact) {
      const newContact = await db
        .insert(contacts)
        .values({
          tenantId: session[0].tenantId,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          title: profileData.title,
          company: profileData.company,
          email: profileData.email,
          phone: profileData.phone,
          linkedinUrl: profileData.linkedinUrl,
          address: profileData.location,
          source: "linkedin_extension",
          status: "active"
        })
        .returning();
      savedContactId = String(newContact[0].id);
    }

    if (saveAsProspect) {
      const newProspect = await db
        .insert(prospectDatabase)
        .values({
          tenantId: session[0].tenantId,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          title: profileData.title,
          company: profileData.company,
          email: profileData.email,
          phone: profileData.phone,
          linkedinUrl: profileData.linkedinUrl,
          location: profileData.location,
          headline: profileData.headline,
          source: "linkedin_extension",
          enrichmentStatus: profileData.email ? "enriched" : "pending"
        })
        .returning();
      savedProspectId = newProspect[0].id;
    }

    const event = await db
      .insert(extensionEvents)
      .values({
        sessionId: session[0].id,
        eventType: "linkedin_profile_scraped",
        sourceUrl: profileData.linkedinUrl,
        scrapedData: profileData as any,
        savedToContactId: savedContactId,
        savedToProspectId: savedProspectId
      })
      .returning();

    res.status(201).json({
      success: true,
      data: {
        event: event[0],
        savedContactId,
        savedProspectId
      }
    });
  } catch (error) {
    console.error("Error saving LinkedIn profile:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "Invalid request data", details: error.errors });
    }
    res.status(500).json({ success: false, error: "Failed to save LinkedIn profile" });
  }
});

router.get("/events", authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { limit = 50, offset = 0 } = req.query;

    const userSessions = await db
      .select({ id: extensionSessions.id })
      .from(extensionSessions)
      .where(eq(extensionSessions.userId, user.id));

    if (userSessions.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: { total: 0, limit: Number(limit), offset: Number(offset), hasMore: false }
      });
    }

    const sessionIds = userSessions.map(s => s.id);

    const events = await db
      .select()
      .from(extensionEvents)
      .where(sql`${extensionEvents.sessionId} = ANY(${sessionIds})`)
      .orderBy(desc(extensionEvents.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));

    res.json({
      success: true,
      data: events,
      pagination: {
        total: events.length,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: events.length === Number(limit)
      }
    });
  } catch (error) {
    console.error("Error fetching extension events:", error);
    res.status(500).json({ success: false, error: "Failed to fetch events" });
  }
});

export function registerExtensionRoutes(app: any) {
  app.use("/api/extension", router);
}

export default router;
