import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { aiService } from "./ai";
import { setupAuth, isAuthenticated } from "./replitAuth";

// Middleware to attach tenantId to request
async function attachTenantId(req: Request, res: Response, next: NextFunction) {
  const user = req.user as any;
  if (!user || !user.claims || !user.claims.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const userId = user.claims.sub;
  const dbUser = await storage.getUser(userId);
  
  if (!dbUser) {
    return res.status(401).json({ message: "User not found" });
  }
  
  (req as any).tenantId = dbUser.tenantId;
  (req as any).userId = userId;
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Protected routes - require authentication and tenant context
  const requireAuth = [isAuthenticated, attachTenantId];

  // Dashboard data endpoint
  app.get("/api/dashboard", requireAuth, async (req: any, res: Response) => {
    try {
      const tenantId = req.tenantId;
      const projectId = req.query.projectId as string || "1";
      
      const project = await storage.getProject(tenantId, projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const keywordRanking = await storage.getKeywordRanking(tenantId, projectId);
      const trafficData = await storage.getTrafficDataByProject(tenantId, projectId);
      const competitors = await storage.getCompetitorsByProject(tenantId, projectId);
      const seoIssues = await storage.getSeoIssuesByProject(tenantId, projectId);
      const backlinkGrowth = await storage.getBacklinkGrowth(tenantId, projectId);

      res.json({
        project,
        keywordRanking,
        trafficData,
        competitors,
        seoIssues,
        backlinkGrowth,
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Projects endpoints
  app.get("/api/projects", requireAuth, async (req: any, res: Response) => {
    try {
      const projects = await storage.getAllProjects(req.tenantId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/projects/:id", requireAuth, async (req: any, res: Response) => {
    try {
      const project = await storage.getProject(req.tenantId, req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/projects", requireAuth, async (req: any, res: Response) => {
    try {
      const { insertProjectSchema } = await import("@shared/schema");
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(req.tenantId, validatedData);
      res.json(project);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid project data" });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/projects/:id", requireAuth, async (req: any, res: Response) => {
    try {
      const { insertProjectSchema } = await import("@shared/schema");
      // Create a partial schema that only validates fields that are provided
      const partialSchema = insertProjectSchema.partial();
      const validatedData = partialSchema.parse(req.body);
      const project = await storage.updateProject(req.tenantId, req.params.id, validatedData);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid project data" });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/projects/:id", requireAuth, async (req: any, res: Response) => {
    try {
      const deleted = await storage.deleteProject(req.tenantId, req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Keywords endpoints
  app.get("/api/keywords", requireAuth, async (req: any, res: Response) => {
    try {
      const projectId = req.query.projectId as string || "1";
      const keywords = await storage.getKeywordsByProject(req.tenantId, projectId);
      res.json(keywords);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Traffic endpoints
  app.get("/api/traffic", requireAuth, async (req: any, res: Response) => {
    try {
      const projectId = req.query.projectId as string || "1";
      const trafficData = await storage.getTrafficDataByProject(req.tenantId, projectId);
      res.json(trafficData);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // SEO Issues endpoints
  app.get("/api/seo-issues", requireAuth, async (req: any, res: Response) => {
    try {
      const projectId = req.query.projectId as string || "1";
      const seoIssues = await storage.getSeoIssuesByProject(req.tenantId, projectId);
      res.json(seoIssues);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Backlinks endpoints
  app.get("/api/backlinks", requireAuth, async (req: any, res: Response) => {
    try {
      const projectId = req.query.projectId as string || "1";
      const backlinks = await storage.getBacklinksByProject(req.tenantId, projectId);
      res.json(backlinks);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Competitors endpoints
  app.get("/api/competitors", requireAuth, async (req: any, res: Response) => {
    try {
      const projectId = req.query.projectId as string || "1";
      const competitors = await storage.getCompetitorsByProject(req.tenantId, projectId);
      res.json(competitors);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Rank Tracking endpoints
  app.get("/api/rank-tracking/history", requireAuth, async (req: any, res: Response) => {
    try {
      const projectId = req.query.projectId as string;
      const keywordId = req.query.keywordId as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      if (!projectId) {
        return res.status(400).json({ error: "Project ID is required" });
      }

      let rankHistory;
      if (keywordId) {
        rankHistory = await storage.getRankHistoryByKeyword(req.tenantId, keywordId, startDate, endDate);
      } else {
        rankHistory = await storage.getRankHistoryByProject(req.tenantId, projectId, startDate, endDate);
      }

      res.json(rankHistory);
    } catch (error) {
      console.error("Rank tracking history error:", error);
      res.status(500).json({ error: "Failed to fetch rank history" });
    }
  });

  app.post("/api/rank-tracking/history", requireAuth, async (req: any, res: Response) => {
    try {
      const { insertKeywordRankHistorySchema } = await import("@shared/schema");
      const validatedData = insertKeywordRankHistorySchema.parse(req.body);
      const rankHistory = await storage.createRankHistory(req.tenantId, validatedData);
      res.json(rankHistory);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid rank history data" });
      }
      console.error("Create rank history error:", error);
      res.status(500).json({ error: "Failed to create rank history" });
    }
  });

  app.get("/api/rank-tracking/competitor-ranks", requireAuth, async (req: any, res: Response) => {
    try {
      const projectId = req.query.projectId as string | undefined;
      const keywordId = req.query.keywordId as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      if (!projectId && !keywordId) {
        return res.status(400).json({ error: "Either projectId or keywordId is required" });
      }

      let competitorRanks;
      if (keywordId) {
        competitorRanks = await storage.getCompetitorRanksByKeyword(req.tenantId, keywordId);
      } else if (projectId) {
        competitorRanks = await storage.getCompetitorRanksByProject(req.tenantId, projectId, startDate, endDate);
      }

      res.json(competitorRanks);
    } catch (error) {
      console.error("Competitor ranks error:", error);
      res.status(500).json({ error: "Failed to fetch competitor ranks" });
    }
  });

  app.post("/api/rank-tracking/competitor-snapshot", requireAuth, async (req: any, res: Response) => {
    try {
      const { insertCompetitorRankSnapshotSchema } = await import("@shared/schema");
      const validatedData = insertCompetitorRankSnapshotSchema.parse(req.body);
      const snapshot = await storage.createCompetitorRankSnapshot(req.tenantId, validatedData);
      res.json(snapshot);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid competitor snapshot data" });
      }
      console.error("Create competitor snapshot error:", error);
      res.status(500).json({ error: "Failed to create competitor snapshot" });
    }
  });

  // AI Chat endpoints
  app.post("/api/ai/chat", requireAuth, async (req: any, res: Response) => {
    try {
      const { message, projectId } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Optionally load context if projectId provided
      let context = undefined;
      if (projectId) {
        const project = await storage.getProject(req.tenantId, projectId);
        const keywords = await storage.getKeywordsByProject(req.tenantId, projectId);
        const trafficData = await storage.getTrafficDataByProject(req.tenantId, projectId);
        const competitors = await storage.getCompetitorsByProject(req.tenantId, projectId);
        const seoIssues = await storage.getSeoIssuesByProject(req.tenantId, projectId);

        context = {
          project: project || undefined,
          keywords,
          trafficData,
          competitors,
          seoIssues
        };
      }

      const response = await aiService.chat(message, context);
      res.json({ response });
    } catch (error) {
      console.error("AI chat error:", error);
      res.status(500).json({ error: "Failed to generate AI response" });
    }
  });

  app.post("/api/ai/insights", requireAuth, async (req: any, res: Response) => {
    try {
      const { projectId } = req.body;
      
      if (!projectId) {
        return res.status(400).json({ error: "Project ID is required" });
      }

      const project = await storage.getProject(req.tenantId, projectId);
      const keywords = await storage.getKeywordsByProject(req.tenantId, projectId);
      const trafficData = await storage.getTrafficDataByProject(req.tenantId, projectId);
      const competitors = await storage.getCompetitorsByProject(req.tenantId, projectId);
      const seoIssues = await storage.getSeoIssuesByProject(req.tenantId, projectId);

      const context = {
        project: project || undefined,
        keywords,
        trafficData,
        competitors,
        seoIssues
      };

      const insights = await aiService.generateInsights(context);
      res.json({ insights });
    } catch (error) {
      console.error("AI insights error:", error);
      res.status(500).json({ error: "Failed to generate insights" });
    }
  });

  app.post("/api/ai/analyze-keywords", requireAuth, async (req: any, res: Response) => {
    try {
      const { projectId } = req.body;
      
      if (!projectId) {
        return res.status(400).json({ error: "Project ID is required" });
      }

      const keywords = await storage.getKeywordsByProject(req.tenantId, projectId);
      const analysis = await aiService.analyzeKeywords(keywords);
      res.json({ analysis });
    } catch (error) {
      console.error("AI keyword analysis error:", error);
      res.status(500).json({ error: "Failed to analyze keywords" });
    }
  });

  app.post("/api/ai/analyze-competitors", requireAuth, async (req: any, res: Response) => {
    try {
      const { projectId } = req.body;
      
      if (!projectId) {
        return res.status(400).json({ error: "Project ID is required" });
      }

      const competitors = await storage.getCompetitorsByProject(req.tenantId, projectId);
      const analysis = await aiService.analyzeCompetitors(competitors);
      res.json({ analysis });
    } catch (error) {
      console.error("AI competitor analysis error:", error);
      res.status(500).json({ error: "Failed to analyze competitors" });
    }
  });

  app.post("/api/ai/prioritize-issues", requireAuth, async (req: any, res: Response) => {
    try {
      const { projectId } = req.body;
      
      if (!projectId) {
        return res.status(400).json({ error: "Project ID is required" });
      }

      const seoIssues = await storage.getSeoIssuesByProject(req.tenantId, projectId);
      const analysis = await aiService.prioritizeSEOIssues(seoIssues);
      res.json({ analysis });
    } catch (error) {
      console.error("AI issue prioritization error:", error);
      res.status(500).json({ error: "Failed to prioritize issues" });
    }
  });

  app.post("/api/ai/recommend-backlinks", requireAuth, async (req: any, res: Response) => {
    try {
      const { projectId } = req.body;
      
      if (!projectId) {
        return res.status(400).json({ error: "Project ID is required" });
      }

      const project = await storage.getProject(req.tenantId, projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const opportunities = await storage.getOpportunitiesByProject(req.tenantId, projectId);
      const keywords = await storage.getKeywordsByProject(req.tenantId, projectId);
      const competitors = await storage.getCompetitorsByProject(req.tenantId, projectId);
      
      const recommendations = await aiService.recommendBacklinkOpportunities(
        project, 
        opportunities, 
        keywords, 
        competitors
      );
      
      res.json({ recommendations });
    } catch (error) {
      console.error("AI backlink recommendations error:", error);
      res.status(500).json({ error: "Failed to generate recommendations" });
    }
  });

  // Content Intelligence - Content Briefs
  app.get("/api/content/briefs/:projectId", requireAuth, async (req: any, res: Response) => {
    try {
      const briefs = await storage.getBriefsByProject(req.tenantId, req.params.projectId);
      res.json(briefs);
    } catch (error) {
      console.error("Error fetching briefs:", error);
      res.status(500).json({ error: "Failed to fetch content briefs" });
    }
  });

  app.post("/api/content/briefs", requireAuth, async (req: any, res: Response) => {
    try {
      const { targetKeyword, contentType = 'blog_post', wordCountTarget = 1500, projectId } = req.body;
      
      if (!targetKeyword || !projectId) {
        return res.status(400).json({ error: "targetKeyword and projectId are required" });
      }

      // Generate AI content brief
      const briefData = await aiService.generateContentBrief(targetKeyword, contentType, wordCountTarget);
      
      // Save to database
      const { insertContentBriefSchema } = await import("@shared/schema");
      const validatedData = insertContentBriefSchema.parse({
        projectId,
        targetKeyword,
        title: briefData.title,
        outline: briefData.outline,
        wordCountTarget,
        contentType,
        seoTips: briefData.seoTips
      });
      
      const brief = await storage.createBrief(req.tenantId, validatedData);
      res.json(brief);
    } catch (error) {
      console.error("Generate content brief error:", error);
      res.status(500).json({ error: "Failed to generate content brief" });
    }
  });

  app.delete("/api/content/briefs/:id", requireAuth, async (req: any, res: Response) => {
    try {
      const deleted = await storage.deleteBrief(req.tenantId, req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Content brief not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete brief error:", error);
      res.status(500).json({ error: "Failed to delete content brief" });
    }
  });

  // Content Intelligence - Content Scoring
  app.get("/api/content/scorecards/:projectId", requireAuth, async (req: any, res: Response) => {
    try {
      const scorecards = await storage.getScorecardsByProject(req.tenantId, req.params.projectId);
      res.json(scorecards);
    } catch (error) {
      console.error("Error fetching scorecards:", error);
      res.status(500).json({ error: "Failed to fetch content scorecards" });
    }
  });

  app.post("/api/content/score", requireAuth, async (req: any, res: Response) => {
    try {
      const { url, content, targetKeyword, projectId } = req.body;
      
      if (!url || !content || !targetKeyword || !projectId) {
        return res.status(400).json({ error: "url, content, targetKeyword, and projectId are required" });
      }

      // Score content using AI
      const scoreData = await aiService.scoreContent(url, content, targetKeyword);
      
      // Save to database
      const { insertContentScorecardSchema } = await import("@shared/schema");
      const validatedData = insertContentScorecardSchema.parse({
        projectId,
        url,
        targetKeyword,
        ...scoreData
      });
      
      const scorecard = await storage.createScorecard(req.tenantId, validatedData);
      res.json(scorecard);
    } catch (error) {
      console.error("Score content error:", error);
      res.status(500).json({ error: "Failed to score content" });
    }
  });

  app.delete("/api/content/scorecards/:id", requireAuth, async (req: any, res: Response) => {
    try {
      const deleted = await storage.deleteScorecard(req.tenantId, req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Content scorecard not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete scorecard error:", error);
      res.status(500).json({ error: "Failed to delete content scorecard" });
    }
  });

  // Content Intelligence - SERP Analysis
  app.post("/api/content/serp-analysis", requireAuth, async (req: any, res: Response) => {
    try {
      const { keyword, serpResults } = req.body;
      
      if (!keyword || !serpResults || !Array.isArray(serpResults)) {
        return res.status(400).json({ error: "keyword and serpResults array are required" });
      }

      const analysis = await aiService.analyzeSERP(keyword, serpResults);
      res.json(analysis);
    } catch (error) {
      console.error("SERP analysis error:", error);
      res.status(500).json({ error: "Failed to analyze SERP" });
    }
  });

  // Content Intelligence - Content Gap Analysis
  app.post("/api/content/gap-analysis", requireAuth, async (req: any, res: Response) => {
    try {
      const { projectId } = req.body;
      
      if (!projectId) {
        return res.status(400).json({ error: "projectId is required" });
      }

      const project = await storage.getProject(req.tenantId, projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const keywords = await storage.getKeywordsByProject(req.tenantId, projectId);
      const competitors = await storage.getCompetitorsByProject(req.tenantId, projectId);
      
      const analysis = await aiService.analyzeContentGaps(project, keywords, competitors);
      res.json({ analysis });
    } catch (error) {
      console.error("Content gap analysis error:", error);
      res.status(500).json({ error: "Failed to analyze content gaps" });
    }
  });

  // Link Building - Backlink Opportunities
  app.get("/api/link-building/opportunities/:projectId", requireAuth, async (req: any, res: Response) => {
    try {
      const opportunities = await storage.getOpportunitiesByProject(req.tenantId, req.params.projectId);
      res.json(opportunities);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      res.status(500).json({ error: "Failed to fetch opportunities" });
    }
  });

  app.post("/api/link-building/opportunities", requireAuth, async (req: any, res: Response) => {
    try {
      const { insertBacklinkOpportunitySchema } = await import("@shared/schema");
      const validatedData = insertBacklinkOpportunitySchema.parse(req.body);
      const opportunity = await storage.createOpportunity(req.tenantId, validatedData);
      res.json(opportunity);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid opportunity data" });
      }
      console.error("Error creating opportunity:", error);
      res.status(500).json({ error: "Failed to create opportunity" });
    }
  });

  app.patch("/api/link-building/opportunities/:id", requireAuth, async (req: any, res: Response) => {
    try {
      const { insertBacklinkOpportunitySchema } = await import("@shared/schema");
      const partialSchema = insertBacklinkOpportunitySchema.partial();
      const validatedData = partialSchema.parse(req.body);
      const opportunity = await storage.updateOpportunity(req.tenantId, req.params.id, validatedData);
      if (!opportunity) {
        return res.status(404).json({ error: "Opportunity not found" });
      }
      res.json(opportunity);
    } catch (error) {
      console.error("Error updating opportunity:", error);
      res.status(500).json({ error: "Failed to update opportunity" });
    }
  });

  app.delete("/api/link-building/opportunities/:id", requireAuth, async (req: any, res: Response) => {
    try {
      const success = await storage.deleteOpportunity(req.tenantId, req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Opportunity not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting opportunity:", error);
      res.status(500).json({ error: "Failed to delete opportunity" });
    }
  });

  // Link Building - Outreach Campaigns
  app.get("/api/link-building/campaigns/:projectId", requireAuth, async (req: any, res: Response) => {
    try {
      const campaigns = await storage.getCampaignsByProject(req.tenantId, req.params.projectId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/link-building/campaigns", requireAuth, async (req: any, res: Response) => {
    try {
      const { insertOutreachCampaignSchema } = await import("@shared/schema");
      const validatedData = insertOutreachCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign(req.tenantId, validatedData);
      res.json(campaign);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid campaign data" });
      }
      console.error("Error creating campaign:", error);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  app.patch("/api/link-building/campaigns/:id", requireAuth, async (req: any, res: Response) => {
    try {
      const { insertOutreachCampaignSchema } = await import("@shared/schema");
      const partialSchema = insertOutreachCampaignSchema.partial();
      const validatedData = partialSchema.parse(req.body);
      const campaign = await storage.updateCampaign(req.tenantId, req.params.id, validatedData);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Error updating campaign:", error);
      res.status(500).json({ error: "Failed to update campaign" });
    }
  });

  app.delete("/api/link-building/campaigns/:id", requireAuth, async (req: any, res: Response) => {
    try {
      const success = await storage.deleteCampaign(req.tenantId, req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({ error: "Failed to delete campaign" });
    }
  });

  // Link Building - Outreach Contacts
  app.get("/api/link-building/contacts/:campaignId", requireAuth, async (req: any, res: Response) => {
    try {
      const contacts = await storage.getContactsByCampaign(req.tenantId, req.params.campaignId);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  app.post("/api/link-building/contacts", requireAuth, async (req: any, res: Response) => {
    try {
      const { insertOutreachContactSchema } = await import("@shared/schema");
      const validatedData = insertOutreachContactSchema.parse(req.body);
      const contact = await storage.createContact(req.tenantId, validatedData);
      res.json(contact);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid contact data" });
      }
      console.error("Error creating contact:", error);
      res.status(500).json({ error: "Failed to create contact" });
    }
  });

  app.patch("/api/link-building/contacts/:id", requireAuth, async (req: any, res: Response) => {
    try {
      const { insertOutreachContactSchema } = await import("@shared/schema");
      const partialSchema = insertOutreachContactSchema.partial();
      const validatedData = partialSchema.parse(req.body);
      const contact = await storage.updateContact(req.tenantId, req.params.id, validatedData);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      console.error("Error updating contact:", error);
      res.status(500).json({ error: "Failed to update contact" });
    }
  });

  // Link Building - Backlink Gaps
  app.get("/api/link-building/gaps/:projectId", requireAuth, async (req: any, res: Response) => {
    try {
      const gaps = await storage.getGapsByProject(req.tenantId, req.params.projectId);
      res.json(gaps);
    } catch (error) {
      console.error("Error fetching gaps:", error);
      res.status(500).json({ error: "Failed to fetch gaps" });
    }
  });

  app.post("/api/link-building/gaps", requireAuth, async (req: any, res: Response) => {
    try {
      const { insertBacklinkGapSchema } = await import("@shared/schema");
      const validatedData = insertBacklinkGapSchema.parse(req.body);
      const gap = await storage.createGap(req.tenantId, validatedData);
      res.json(gap);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid gap data" });
      }
      console.error("Error creating gap:", error);
      res.status(500).json({ error: "Failed to create gap" });
    }
  });

  app.patch("/api/link-building/gaps/:id", requireAuth, async (req: any, res: Response) => {
    try {
      const { insertBacklinkGapSchema } = await import("@shared/schema");
      const partialSchema = insertBacklinkGapSchema.partial();
      const validatedData = partialSchema.parse(req.body);
      const gap = await storage.updateGap(req.tenantId, req.params.id, validatedData);
      if (!gap) {
        return res.status(404).json({ error: "Gap not found" });
      }
      res.json(gap);
    } catch (error) {
      console.error("Error updating gap:", error);
      res.status(500).json({ error: "Failed to update gap" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
