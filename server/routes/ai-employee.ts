import type { Express } from 'express';
import { z } from 'zod';
import { AIEmployeeService } from '../services/ai-employee';
import { socialPosts, aiOperations, contacts, chatSessions, emailThreads } from '@shared/schema';
import { db } from '../db';
import { DatabaseStorage } from '../database-storage';
import { desc, gte, sql, eq } from 'drizzle-orm';

const aiEmployeeService = new AIEmployeeService();

// Request schemas
const SocialPostGenerateSchema = z.object({
  platform: z.enum(['linkedin', 'twitter', 'facebook', 'instagram']),
  topic: z.string().min(1, 'Topic is required'),
  targetAudience: z.string().optional(),
  cta: z.string().optional(),
  publishNow: z.boolean().default(false)
});

const OutreachEmailSchema = z.object({
  contactId: z.string().uuid(),
  personalization: z.string().optional()
});

const LeadScoreSchema = z.object({
  contactId: z.string().uuid()
});

const ProposalGenerateSchema = z.object({
  dealId: z.string().uuid()
});

export function registerAIEmployeeRoutes(app: Express) {
  // Get user storage from request (tenant-isolated)
  function getUserStorage(req: any): DatabaseStorage {
    const authenticatedUser = req.user;
    if (!authenticatedUser) {
      throw new Error('Authentication required');
    }
    const isPlatformOwner = authenticatedUser.email === 'abel@argilette.com';
    return new DatabaseStorage(
      authenticatedUser.email,
      authenticatedUser.tenantId,
      isPlatformOwner
    );
  }

  /**
   * POST /api/ai-employee/social/generate
   * Generate AI-powered social media posts
   */
  app.post('/api/ai-employee/social/generate', async (req, res) => {
    try {
      const { platform, topic, targetAudience, cta, publishNow } = SocialPostGenerateSchema.parse(req.body);
      const user = (req as any).user;
      
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const startTime = Date.now();

      // Generate social post using AI
      const result = await aiEmployeeService.generateSocialPost({
        platform,
        topic,
        targetAudience,
        cta
      });

      const processingTime = Date.now() - startTime;

      // Save to social_posts table
      const [savedPost] = await db.insert(socialPosts).values({
        tenantId: user.tenantId,
        platform,
        content: result.content,
        hashtags: result.hashtags,
        status: publishNow ? 'published' : 'draft',
        publishedAt: publishNow ? new Date() : null,
        createdBy: user.id
      }).returning();

      // Log AI operation
      await db.insert(aiOperations).values({
        tenantId: user.tenantId,
        operationType: 'social_post_generation',
        status: 'completed',
        input: { platform, topic, targetAudience, cta },
        output: result,
        tokensUsed: Math.ceil(result.content.length / 4), // Rough estimate
        processingTime
      });

      res.json({
        success: true,
        post: savedPost,
        content: result.content,
        hashtags: result.hashtags,
        mediaRecommendation: result.mediaRecommendation
      });
    } catch (error) {
      console.error('Social post generation error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      
      res.status(500).json({ error: 'Failed to generate social post' });
    }
  });

  /**
   * POST /api/ai-employee/outreach/generate
   * Generate personalized outreach emails
   */
  app.post('/api/ai-employee/outreach/generate', async (req, res) => {
    try {
      const { contactId, personalization } = OutreachEmailSchema.parse(req.body);
      const storage = getUserStorage(req);

      // Get contact details
      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      const startTime = Date.now();

      // Generate outreach email
      const result = await aiEmployeeService.generateOutreachEmail({
        contactName: contact.name || 'there',
        companyName: contact.company || 'your company',
        industry: undefined, // Contacts don't have industry field
        painPoint: contact.bio || undefined,
        personalization
      });

      const processingTime = Date.now() - startTime;

      // Log AI operation (sanitized - no email content)
      const user = (req as any).user;
      await db.insert(aiOperations).values({
        tenantId: user.tenantId,
        operationType: 'outreach_email_generation',
        status: 'completed',
        input: { contactId }, // Removed personalization to protect privacy
        output: { 
          subjectLength: result.subject.length,
          bodyLength: result.body.length,
          generated: true
        }, // Sanitized: removed actual email content
        tokensUsed: Math.ceil((result.subject.length + result.body.length) / 4),
        processingTime
      });

      res.json({
        success: true,
        subject: result.subject,
        body: result.body,
        contactId
      });
    } catch (error) {
      console.error('Outreach generation error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      
      res.status(500).json({ error: 'Failed to generate outreach email' });
    }
  });

  /**
   * POST /api/ai-employee/leads/score
   * Score a lead using AI
   */
  app.post('/api/ai-employee/leads/score', async (req, res) => {
    try {
      const { contactId } = LeadScoreSchema.parse(req.body);
      const storage = getUserStorage(req);

      // Get contact details
      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      const startTime = Date.now();

      // Score the lead
      const result = await aiEmployeeService.scoreLead({
        company: contact.company || undefined,
        jobTitle: contact.jobTitle || undefined,
        industry: undefined, // Contacts don't have industry field
        email: contact.email,
        phone: contact.phone || undefined,
        linkedin: contact.linkedin || undefined,
        numberOfEmployees: contact.numberOfEmployees || undefined,
        interactions: 0, // TODO: Get from activities table
        lastEngagement: undefined // Contacts don't have lastContactDate field
      });

      const processingTime = Date.now() - startTime;

      // Update contact with new score
      await storage.updateContact(contactId, {
        leadScore: result.score
      });

      // Log AI operation
      const user = (req as any).user;
      await db.insert(aiOperations).values({
        tenantId: user.tenantId,
        operationType: 'lead_scoring',
        status: 'completed',
        input: { contactId },
        output: result,
        tokensUsed: Math.ceil(JSON.stringify(result).length / 4),
        processingTime
      });

      res.json({
        success: true,
        contactId,
        score: result.score,
        reasoning: result.reasoning,
        fitScore: result.fitScore,
        engagementScore: result.engagementScore,
        readinessScore: result.readinessScore,
        recommendedAction: result.recommendedAction,
        priority: result.priority
      });
    } catch (error) {
      console.error('Lead scoring error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      
      res.status(500).json({ error: 'Failed to score lead' });
    }
  });

  /**
   * POST /api/ai-employee/proposals/generate
   * Generate deal proposal
   */
  app.post('/api/ai-employee/proposals/generate', async (req, res) => {
    try {
      const { dealId } = ProposalGenerateSchema.parse(req.body);
      const storage = getUserStorage(req);

      // Get deal details
      const deal = await storage.getDeal(dealId);
      if (!deal) {
        return res.status(404).json({ error: 'Deal not found' });
      }

      // Get contact details
      const contact = deal.contactId ? await storage.getContact(deal.contactId) : null;
      if (!contact) {
        return res.status(404).json({ error: 'Contact not found for this deal' });
      }

      const startTime = Date.now();

      // Generate proposal
      const proposal = await aiEmployeeService.generateProposal({
        contactName: contact.name || 'Valued Client',
        companyName: contact.company || 'Your Organization',
        requirements: deal.notes ? [deal.notes] : ['CRM implementation'],
        painPoints: contact.bio ? [contact.bio] : ['Business efficiency'],
        budget: deal.amount ? `$${deal.amount}` : undefined,
        timeline: deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : undefined
      });

      const processingTime = Date.now() - startTime;

      // Log AI operation (sanitized - no proposal content)
      const user = (req as any).user;
      await db.insert(aiOperations).values({
        tenantId: user.tenantId,
        operationType: 'proposal_generation',
        status: 'completed',
        input: { dealId },
        output: { 
          proposalLength: proposal.length,
          generated: true
        }, // Sanitized: removed actual proposal content
        tokensUsed: Math.ceil(proposal.length / 4),
        processingTime
      });

      res.json({
        success: true,
        dealId,
        proposal
      });
    } catch (error) {
      console.error('Proposal generation error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      
      res.status(500).json({ error: 'Failed to generate proposal' });
    }
  });

  /**
   * GET /api/ai-employee/stats
   * Get overview statistics for AI Employee dashboard
   */
  app.get('/api/ai-employee/stats', async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Get counts for each stat
      const [
        totalSocialPosts,
        leadsScored,
        activeChatSessions,
        emailThreadsProcessed
      ] = await Promise.all([
        db.select({ count: sql<number>`count(*)::int` })
          .from(socialPosts)
          .where(eq(socialPosts.tenantId, user.tenantId)),
        db.select({ count: sql<number>`count(*)::int` })
          .from(contacts)
          .where(
            sql`${contacts.tenantId} = ${user.tenantId} AND ${contacts.leadScore} IS NOT NULL AND ${contacts.updatedAt} >= ${startOfMonth}`
          ),
        db.select({ count: sql<number>`count(*)::int` })
          .from(chatSessions)
          .where(
            sql`${chatSessions.tenantId} = ${user.tenantId} AND ${chatSessions.status} = 'active'`
          ),
        db.select({ count: sql<number>`count(*)::int` })
          .from(emailThreads)
          .where(
            sql`${emailThreads.tenantId} = ${user.tenantId} AND ${emailThreads.aiProcessed} = true`
          )
      ]);

      res.json({
        totalSocialPosts: totalSocialPosts[0]?.count || 0,
        leadsScored: leadsScored[0]?.count || 0,
        activeChatSessions: activeChatSessions[0]?.count || 0,
        emailThreadsProcessed: emailThreadsProcessed[0]?.count || 0
      });
    } catch (error) {
      console.error('Stats fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  /**
   * GET /api/ai-employee/social-posts
   * Get recent social posts
   */
  app.get('/api/ai-employee/social-posts', async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const limit = parseInt(req.query.limit as string) || 50;

      const posts = await db.select()
        .from(socialPosts)
        .where(eq(socialPosts.tenantId, user.tenantId))
        .orderBy(desc(socialPosts.createdAt))
        .limit(limit);

      res.json(posts);
    } catch (error) {
      console.error('Social posts fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch social posts' });
    }
  });

  /**
   * GET /api/ai-employee/leads
   * Get top scored leads
   */
  app.get('/api/ai-employee/leads', async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const minScore = parseInt(req.query.minScore as string) || 70;
      const limit = parseInt(req.query.limit as string) || 50;

      const leads = await db.select()
        .from(contacts)
        .where(
          sql`${contacts.tenantId} = ${user.tenantId} AND ${contacts.leadScore} >= ${minScore}`
        )
        .orderBy(desc(contacts.leadScore))
        .limit(limit);

      res.json(leads);
    } catch (error) {
      console.error('Leads fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch leads' });
    }
  });

  /**
   * GET /api/ai-employee/operations
   * Get recent AI operations
   */
  app.get('/api/ai-employee/operations', async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const operationType = req.query.type as string;
      const limit = parseInt(req.query.limit as string) || 100;

      let query = db.select()
        .from(aiOperations)
        .where(eq(aiOperations.tenantId, user.tenantId))
        .orderBy(desc(aiOperations.createdAt))
        .limit(limit);

      // Filter by operation type if provided
      if (operationType) {
        query = db.select()
          .from(aiOperations)
          .where(
            sql`${aiOperations.tenantId} = ${user.tenantId} AND ${aiOperations.operationType} = ${operationType}`
          )
          .orderBy(desc(aiOperations.createdAt))
          .limit(limit);
      }

      const operations = await query;
      res.json(operations);
    } catch (error) {
      console.error('Operations fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch operations' });
    }
  });

  /**
   * GET /api/ai-employee/chat-sessions
   * Get active chat sessions
   */
  app.get('/api/ai-employee/chat-sessions', async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const status = req.query.status as string || 'active';
      const limit = parseInt(req.query.limit as string) || 50;

      const sessions = await db.select()
        .from(chatSessions)
        .where(
          sql`${chatSessions.tenantId} = ${user.tenantId} AND ${chatSessions.status} = ${status}`
        )
        .orderBy(desc(chatSessions.lastMessageAt))
        .limit(limit);

      res.json(sessions);
    } catch (error) {
      console.error('Chat sessions fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch chat sessions' });
    }
  });

  console.log('✅ AI Employee routes registered: POST /api/ai-employee/social/generate, /api/ai-employee/outreach/generate, /api/ai-employee/leads/score, /api/ai-employee/proposals/generate');
  console.log('✅ AI Employee GET routes registered: GET /api/ai-employee/stats, /api/ai-employee/social-posts, /api/ai-employee/leads, /api/ai-employee/operations, /api/ai-employee/chat-sessions');
}
