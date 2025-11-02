import { Router, type Request, Response, NextFunction } from "express";
import { z } from "zod";
import { storage } from "./seo-storage";
import { aiService } from "./seo-ai";

// Middleware to require admin access
async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const isAdmin = (req as any).isAdmin;
  if (!isAdmin) {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  next();
}

/**
 * Create ARGILETTE SEO Router
 * 
 * Returns an Express Router that can be mounted at any path in your CRM.
 * 
 * IMPORTANT: Apply authentication middleware BEFORE mounting this router
 * Your auth middleware MUST set req.tenantId and req.userId
 * 
 * Example:
 * ```
 * import { createSEORouter } from './argilette/server/seo-routes';
 * 
 * // Create auth middleware
 * app.use('/api/seo', (req, res, next) => {
 *   if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
 *   req.tenantId = req.user.organizationId;
 *   req.userId = req.user.id;
 *   req.isAdmin = req.user.role === 'admin';
 *   next();
 * });
 * 
 * // Mount SEO router
 * app.use('/api/seo', createSEORouter());
 * ```
 */
export function createSEORouter(): Router {
  const router = Router();

  // Dashboard data endpoint
  router.get("/dashboard", async (req: any, res: Response) => {
    try {
      const tenantId = req.tenantId;
      const projectId = req.query.projectId as string || "1";
      
      const project = await storage.getProject(tenantId, projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Fetch all related data for the project
      const [
        keywords,
        backlinks,
        keywordRanking,
        trafficData,
        competitors,
        seoIssues,
        backlinkGrowth
      ] = await Promise.all([
        storage.getKeywordsByProject(tenantId, projectId),
        storage.getBacklinksByProject(tenantId, projectId),
        storage.getKeywordRanking(tenantId, projectId),
        storage.getTrafficDataByProject(tenantId, projectId),
        storage.getCompetitorsByProject(tenantId, projectId),
        storage.getSeoIssuesByProject(tenantId, projectId),
        storage.getBacklinkGrowth(tenantId, projectId)
      ]);

      // Calculate real-time metrics from actual data
      const totalKeywords = keywords.length;
      const totalBacklinks = backlinks.length;
      
      // Calculate unique referring domains (extract domain from URL)
      const uniqueDomains = new Set(
        backlinks.map(b => {
          try {
            // Normalize URL: add https:// if no scheme present
            const url = b.url.includes('://') ? b.url : `https://${b.url}`;
            return new URL(url).hostname;
          } catch {
            return b.url;
          }
        })
      );
      const referringDomains = uniqueDomains.size;
      
      // Get latest organic traffic (sort by date first to ensure chronological order)
      const sortedTraffic = trafficData.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      const latestTraffic = sortedTraffic.length > 0 
        ? sortedTraffic[sortedTraffic.length - 1].visits 
        : 0;
      
      // Calculate SEO score based on issues (100 - weighted penalties)
      let seoScore = 100;
      seoIssues.forEach(issue => {
        if (issue.severity === 'critical') seoScore -= 10;
        else if (issue.severity === 'high') seoScore -= 5;
        else if (issue.severity === 'medium') seoScore -= 2;
        else if (issue.severity === 'low') seoScore -= 1;
      });
      seoScore = Math.max(0, Math.min(100, seoScore)); // Clamp between 0-100

      // Return enriched project data with calculated metrics
      const enrichedProject = {
        ...project,
        totalKeywords,
        totalBacklinks,
        referringDomains,
        organicTraffic: latestTraffic,
        seoScore
      };

      res.json({
        project: enrichedProject,
        keywordRanking,
        trafficData,
        competitors,
        seoIssues,
        backlinkGrowth,
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin routes - require authentication and admin role

  router.get("/admin/stats", requireAdmin, async (req: any, res: Response) => {
    try {
      const stats = await storage.getPlatformStats();
      res.json(stats);
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/admin/users", requireAdmin, async (req: any, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Admin users error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/admin/tenants", requireAdmin, async (req: any, res: Response) => {
    try {
      const tenants = await storage.getAllTenants();
      res.json(tenants);
    } catch (error) {
      console.error("Admin tenants error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Projects endpoints
  router.get("/projects", async (req: any, res: Response) => {
    try {
      const projects = await storage.getAllProjects(req.tenantId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/projects/:id", async (req: any, res: Response) => {
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

  router.post("/projects", async (req: any, res: Response) => {
    try {
      const { insertProjectSchema } = await import("./seo-schema");
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

  router.put("/projects/:id", async (req: any, res: Response) => {
    try {
      const { insertProjectSchema } = await import("./seo-schema");
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

  router.delete("/projects/:id", async (req: any, res: Response) => {
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
  router.get("/keywords", async (req: any, res: Response) => {
    try {
      const projectId = req.query.projectId as string || "1";
      const keywords = await storage.getKeywordsByProject(req.tenantId, projectId);
      res.json(keywords);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.post("/keywords", async (req: any, res: Response) => {
    try {
      const { insertKeywordSchema } = await import("./seo-schema");
      const validatedData = insertKeywordSchema.parse(req.body);
      const keyword = await storage.createKeyword(req.tenantId, validatedData);
      res.json(keyword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid keyword data" });
      }
      console.error("Error creating keyword:", error);
      res.status(500).json({ error: "Failed to create keyword" });
    }
  });

  // Traffic endpoints
  router.get("/traffic", async (req: any, res: Response) => {
    try {
      const projectId = req.query.projectId as string || "1";
      const trafficData = await storage.getTrafficDataByProject(req.tenantId, projectId);
      res.json(trafficData);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // SEO Issues endpoints
  router.get("/seo-issues", async (req: any, res: Response) => {
    try {
      const projectId = req.query.projectId as string || "1";
      const seoIssues = await storage.getSeoIssuesByProject(req.tenantId, projectId);
      res.json(seoIssues);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Backlinks endpoints
  router.get("/backlinks", async (req: any, res: Response) => {
    try {
      const projectId = req.query.projectId as string || "1";
      const backlinks = await storage.getBacklinksByProject(req.tenantId, projectId);
      res.json(backlinks);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.post("/backlinks/generate", async (req: any, res: Response) => {
    try {
      const generateBacklinksSchema = z.object({
        domain: z.string().min(1, "Domain is required"),
        projectId: z.string().min(1, "Project ID is required"),
        limit: z.number().int().min(1).max(100).default(50),
      });

      const { domain, projectId, limit } = generateBacklinksSchema.parse(req.body);
      
      // Verify project belongs to tenant
      const project = await storage.getProject(req.tenantId, projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found or access denied" });
      }

      // Get context for better AI generation
      const keywords = await storage.getKeywordsByProject(req.tenantId, projectId);
      const competitors = await storage.getCompetitorsByProject(req.tenantId, projectId);
      
      // Generate AI-powered backlinks
      const aiBacklinks = await aiService.generateBacklinks(domain, limit, { keywords, competitors });
      
      // Store backlinks with 'ai' source
      const storedBacklinks = [];
      for (const item of aiBacklinks) {
        const backlinkData = {
          projectId,
          url: item.url,
          domainScore: item.domainScore,
          anchorText: item.anchorText || domain,
          date: item.date,
          source: 'ai' as const,
        };
        const stored = await storage.createBacklink(req.tenantId, backlinkData);
        storedBacklinks.push(stored);
      }

      res.json({
        backlinks: storedBacklinks,
        generated: storedBacklinks.length,
        source: 'ai'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Generate AI backlinks error:", error);
      res.status(500).json({ error: "Failed to generate AI backlinks" });
    }
  });

  router.post("/backlinks/fetch", async (req: any, res: Response) => {
    try {
      const fetchBacklinksSchema = z.object({
        domain: z.string().min(1, "Domain is required"),
        projectId: z.string().min(1, "Project ID is required"),
        limit: z.number().int().min(1).max(1000).default(100),
      });

      const { domain, projectId, limit } = fetchBacklinksSchema.parse(req.body);
      
      // Verify project belongs to tenant
      const project = await storage.getProject(req.tenantId, projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found or access denied" });
      }

      const { createDataForSEOService } = await import("./dataforseo");
      const dataforSEO = createDataForSEOService();
      
      const { backlinks: apiBacklinks, totalCount } = await dataforSEO.fetchBacklinks(domain, limit);
      
      // Transform and store backlinks with 'api' source
      const storedBacklinks = [];
      for (const item of apiBacklinks) {
        const backlinkData = {
          ...dataforSEO.transformToBacklink(item, projectId),
          source: 'api' as const,
        };
        const stored = await storage.createBacklink(req.tenantId, backlinkData);
        storedBacklinks.push(stored);
      }

      res.json({
        backlinks: storedBacklinks,
        totalCount,
        fetched: storedBacklinks.length,
        source: 'api'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Fetch backlinks error:", error);
      res.status(500).json({ error: "Failed to fetch backlinks from DataForSEO" });
    }
  });

  // Competitors endpoints
  router.get("/competitors", async (req: any, res: Response) => {
    try {
      const projectId = req.query.projectId as string || "1";
      const competitors = await storage.getCompetitorsByProject(req.tenantId, projectId);
      res.json(competitors);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Rank Tracking endpoints
  router.get("/rank-tracking/history", async (req: any, res: Response) => {
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

  router.post("/rank-tracking/history", async (req: any, res: Response) => {
    try {
      const { insertKeywordRankHistorySchema } = await import("./seo-schema");
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

  router.get("/rank-tracking/competitor-ranks", async (req: any, res: Response) => {
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

  router.post("/rank-tracking/competitor-snapshot", async (req: any, res: Response) => {
    try {
      const { insertCompetitorRankSnapshotSchema } = await import("./seo-schema");
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
  router.post("/ai/chat", async (req: any, res: Response) => {
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

  router.post("/ai/insights", async (req: any, res: Response) => {
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

  router.post("/ai/analyze-keywords", async (req: any, res: Response) => {
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

  router.post("/ai/analyze-competitors", async (req: any, res: Response) => {
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

  router.post("/ai/prioritize-issues", async (req: any, res: Response) => {
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

  router.post("/ai/recommend-backlinks", async (req: any, res: Response) => {
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
  router.get("/content/briefs/:projectId", async (req: any, res: Response) => {
    try {
      const briefs = await storage.getBriefsByProject(req.tenantId, req.params.projectId);
      res.json(briefs);
    } catch (error) {
      console.error("Error fetching briefs:", error);
      res.status(500).json({ error: "Failed to fetch content briefs" });
    }
  });

  router.post("/content/briefs", async (req: any, res: Response) => {
    try {
      const { targetKeyword, contentType = 'blog_post', wordCountTarget = 1500, projectId } = req.body;
      
      if (!targetKeyword || !projectId) {
        return res.status(400).json({ error: "targetKeyword and projectId are required" });
      }

      // Generate AI content brief
      const briefData = await aiService.generateContentBrief(targetKeyword, contentType, wordCountTarget);
      
      // Save to database
      const { insertContentBriefSchema } = await import("./seo-schema");
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

  router.delete("/content/briefs/:id", async (req: any, res: Response) => {
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
  router.get("/content/scorecards/:projectId", async (req: any, res: Response) => {
    try {
      const scorecards = await storage.getScorecardsByProject(req.tenantId, req.params.projectId);
      res.json(scorecards);
    } catch (error) {
      console.error("Error fetching scorecards:", error);
      res.status(500).json({ error: "Failed to fetch content scorecards" });
    }
  });

  router.post("/content/score", async (req: any, res: Response) => {
    try {
      const { url, content, targetKeyword, projectId } = req.body;
      
      if (!url || !content || !targetKeyword || !projectId) {
        return res.status(400).json({ error: "url, content, targetKeyword, and projectId are required" });
      }

      // Score content using AI
      const scoreData = await aiService.scoreContent(url, content, targetKeyword);
      
      // Save to database
      const { insertContentScorecardSchema } = await import("./seo-schema");
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

  router.delete("/content/scorecards/:id", async (req: any, res: Response) => {
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
  router.post("/content/serp-analysis", async (req: any, res: Response) => {
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
  router.post("/content/gap-analysis", async (req: any, res: Response) => {
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

  // Technical SEO Audit - Get Audit Scans
  router.get("/technical-audit/scans/:projectId", async (req: any, res: Response) => {
    try {
      const scans = await storage.getAuditScansByProject(req.tenantId, req.params.projectId);
      res.json(scans);
    } catch (error) {
      console.error("Error fetching audit scans:", error);
      res.status(500).json({ error: "Failed to fetch audit scans" });
    }
  });

  // Technical SEO Audit - Get Latest Audit Scan
  router.get("/technical-audit/latest/:projectId", async (req: any, res: Response) => {
    try {
      const scan = await storage.getLatestAuditScan(req.tenantId, req.params.projectId);
      res.json(scan || null);
    } catch (error) {
      console.error("Error fetching latest audit scan:", error);
      res.status(500).json({ error: "Failed to fetch latest audit scan" });
    }
  });

  // Technical SEO Audit - Start New Audit
  router.post("/technical-audit/start", async (req: any, res: Response) => {
    try {
      const requestSchema = z.object({
        projectId: z.string(),
        urls: z.array(z.string().url()).min(1).max(10),
      });
      
      const validation = requestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid request", details: validation.error });
      }
      
      const { projectId, urls } = validation.data;

      // Ensure project exists - create it if it doesn't
      let project = await storage.getProject(req.tenantId, projectId);
      if (!project) {
        // Create default project
        project = await storage.createProject(req.tenantId, {
          id: projectId,
          name: projectId === "default-project" ? "Default SEO Project" : projectId,
          domain: urls[0] || "https://example.com",
          isActive: true
        });
      }

      // Create audit scan record
      const scan = await storage.createAuditScan(req.tenantId, {
        projectId,
        status: 'running',
        pagesScanned: 0,
        issuesFound: 0
      });

      // Simulate audit process (in production, this would use real PageSpeed API)
      // For MVP, generate mock data
      const pageMetrics = [];
      for (const url of urls.slice(0, 10)) { // Limit to 10 URLs for demo
        const performanceScore = Math.floor(Math.random() * 40) + 60; // 60-100
        const metric = await storage.createPageMetric(req.tenantId, {
          auditScanId: scan.id,
          url,
          performanceScore,
          loadTime: Math.random() * 3 + 1, // 1-4 seconds
          pageSize: Math.floor(Math.random() * 2000000) + 500000, // 500KB - 2.5MB
          requestCount: Math.floor(Math.random() * 50) + 20, // 20-70 requests
          mobileUsable: Math.random() > 0.2 ? 'yes' : 'warning',
          hasHttps: 'yes',
          metaTitleLength: Math.floor(Math.random() * 40) + 30, // 30-70
          metaDescriptionLength: Math.floor(Math.random() * 80) + 100, // 100-180
          h1Count: Math.floor(Math.random() * 2) + 1, // 1-3
          imageCount: Math.floor(Math.random() * 20) + 5, // 5-25
          imagesWithoutAlt: Math.floor(Math.random() * 5), // 0-5
          brokenLinks: Math.floor(Math.random() * 3), // 0-3
        });

        // Create Core Web Vitals
        const lcp = Math.random() * 2 + 1.5; // 1.5-3.5s
        const fid = Math.random() * 200 + 50; // 50-250ms
        const cls = Math.random() * 0.2; // 0-0.2
        
        await storage.createCoreWebVital(req.tenantId, {
          pageMetricId: metric.id,
          lcp,
          fid,
          cls,
          fcp: Math.random() * 2 + 1, // 1-3s
          ttfb: Math.random() * 500 + 200, // 200-700ms
          tbt: Math.random() * 300 + 100, // 100-400ms
          speedIndex: Math.random() * 3 + 2, // 2-5s
          lcpRating: lcp <= 2.5 ? 'good' : lcp <= 4 ? 'needs-improvement' : 'poor',
          fidRating: fid <= 100 ? 'good' : fid <= 300 ? 'needs-improvement' : 'poor',
          clsRating: cls <= 0.1 ? 'good' : cls <= 0.25 ? 'needs-improvement' : 'poor',
        });

        pageMetrics.push(metric);
      }

      // Calculate overall scores
      const avgPerformance = Math.floor(pageMetrics.reduce((sum, m) => sum + (m.performanceScore || 0), 0) / pageMetrics.length);
      const avgSeo = Math.floor(Math.random() * 20) + 70; // 70-90
      const avgAccessibility = Math.floor(Math.random() * 20) + 75; // 75-95
      const avgBestPractices = Math.floor(Math.random() * 20) + 70; // 70-90

      // Update scan with results
      const completedScan = await storage.updateAuditScan(req.tenantId, scan.id, {
        status: 'completed',
        performanceScore: avgPerformance,
        seoScore: avgSeo,
        accessibilityScore: avgAccessibility,
        bestPracticesScore: avgBestPractices,
        pagesScanned: pageMetrics.length,
        issuesFound: pageMetrics.reduce((sum, m) => sum + (m.brokenLinks || 0) + (m.imagesWithoutAlt || 0), 0),
        completedAt: new Date(),
      });

      res.json(completedScan);
    } catch (error) {
      console.error("Start audit error:", error);
      res.status(500).json({ error: "Failed to start audit" });
    }
  });

  // Technical SEO Audit - Get Page Metrics
  router.get("/technical-audit/metrics/:auditScanId", async (req: any, res: Response) => {
    try {
      const metrics = await storage.getPageMetricsByAuditScan(req.tenantId, req.params.auditScanId);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching page metrics:", error);
      res.status(500).json({ error: "Failed to fetch page metrics" });
    }
  });

  // Technical SEO Audit - Get Core Web Vitals
  router.get("/technical-audit/vitals/:pageMetricId", async (req: any, res: Response) => {
    try {
      const vitals = await storage.getCoreWebVitalsByPageMetric(req.tenantId, req.params.pageMetricId);
      res.json(vitals || null);
    } catch (error) {
      console.error("Error fetching core web vitals:", error);
      res.status(500).json({ error: "Failed to fetch core web vitals" });
    }
  });

  // Link Building - Backlink Opportunities
  router.get("/link-building/opportunities/:projectId", async (req: any, res: Response) => {
    try {
      const opportunities = await storage.getOpportunitiesByProject(req.tenantId, req.params.projectId);
      res.json(opportunities);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      res.status(500).json({ error: "Failed to fetch opportunities" });
    }
  });

  router.post("/link-building/opportunities", async (req: any, res: Response) => {
    try {
      const { insertBacklinkOpportunitySchema } = await import("./seo-schema");
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

  router.patch("/link-building/opportunities/:id", async (req: any, res: Response) => {
    try {
      const { insertBacklinkOpportunitySchema } = await import("./seo-schema");
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

  router.delete("/link-building/opportunities/:id", async (req: any, res: Response) => {
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
  router.get("/link-building/campaigns/:projectId", async (req: any, res: Response) => {
    try {
      const campaigns = await storage.getCampaignsByProject(req.tenantId, req.params.projectId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  router.post("/link-building/campaigns", async (req: any, res: Response) => {
    try {
      const { insertOutreachCampaignSchema } = await import("./seo-schema");
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

  router.patch("/link-building/campaigns/:id", async (req: any, res: Response) => {
    try {
      const { insertOutreachCampaignSchema } = await import("./seo-schema");
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

  router.delete("/link-building/campaigns/:id", async (req: any, res: Response) => {
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
  router.get("/link-building/contacts/:campaignId", async (req: any, res: Response) => {
    try {
      const contacts = await storage.getContactsByCampaign(req.tenantId, req.params.campaignId);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  router.post("/link-building/contacts", async (req: any, res: Response) => {
    try {
      const { insertOutreachContactSchema } = await import("./seo-schema");
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

  router.patch("/link-building/contacts/:id", async (req: any, res: Response) => {
    try {
      const { insertOutreachContactSchema } = await import("./seo-schema");
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
  router.get("/link-building/gaps/:projectId", async (req: any, res: Response) => {
    try {
      const gaps = await storage.getGapsByProject(req.tenantId, req.params.projectId);
      res.json(gaps);
    } catch (error) {
      console.error("Error fetching gaps:", error);
      res.status(500).json({ error: "Failed to fetch gaps" });
    }
  });

  router.post("/link-building/gaps", async (req: any, res: Response) => {
    try {
      const { insertBacklinkGapSchema } = await import("./seo-schema");
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

  router.patch("/link-building/gaps/:id", async (req: any, res: Response) => {
    try {
      const { insertBacklinkGapSchema } = await import("./seo-schema");
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

  // API Keys Management
  router.get("/keys", async (req: any, res: Response) => {
    try {
      const keys = await storage.getApiKeysByTenant(req.tenantId);
      // Don't return the actual key value for security
      const sanitizedKeys = keys.map(({ key, ...rest }) => ({
        ...rest,
        keyPreview: `${key.substring(0, 8)}...${key.substring(key.length - 4)}`
      }));
      res.json(sanitizedKeys);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      res.status(500).json({ error: "Failed to fetch API keys" });
    }
  });

  router.post("/keys", async (req: any, res: Response) => {
    try {
      const { insertApiKeySchema } = await import("./seo-schema");
      const crypto = await import("crypto");
      
      // Generate a random API key
      const apiKey = `arg_${crypto.randomBytes(32).toString('hex')}`;
      
      // Hash the key for storage
      const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');
      
      const validatedData = insertApiKeySchema.parse({
        ...req.body,
        key: hashedKey
      });
      
      const createdKey = await storage.createApiKey(req.tenantId, validatedData);
      
      // Return the actual key only once (on creation)
      res.json({
        ...createdKey,
        apiKey, // The unhashed key - shown only once
        keyPreview: `${hashedKey.substring(0, 8)}...${hashedKey.substring(hashedKey.length - 4)}`
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid API key data" });
      }
      console.error("Error creating API key:", error);
      res.status(500).json({ error: "Failed to create API key" });
    }
  });

  router.patch("/keys/:id", async (req: any, res: Response) => {
    try {
      const { insertApiKeySchema } = await import("./seo-schema");
      const updateSchema = insertApiKeySchema.partial().omit({ key: true });
      
      const validatedData = updateSchema.parse(req.body);
      const apiKey = await storage.updateApiKey(req.tenantId, req.params.id, validatedData);
      if (!apiKey) {
        return res.status(404).json({ error: "API key not found" });
      }
      res.json(apiKey);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid update data" });
      }
      console.error("Error updating API key:", error);
      res.status(500).json({ error: "Failed to update API key" });
    }
  });

  router.delete("/keys/:id", async (req: any, res: Response) => {
    try {
      const deleted = await storage.deleteApiKey(req.tenantId, req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "API key not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting API key:", error);
      res.status(500).json({ error: "Failed to delete API key" });
    }
  });

  // API Usage Statistics
  router.get("/keys/:id/usage", async (req: any, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const usage = await storage.getApiUsageByKey(req.tenantId, req.params.id, limit);
      res.json(usage);
    } catch (error) {
      console.error("Error fetching API usage:", error);
      res.status(500).json({ error: "Failed to fetch API usage" });
    }
  });

  router.get("/usage", async (req: any, res: Response) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const usage = await storage.getApiUsageByTenant(req.tenantId, startDate, endDate);
      res.json(usage);
    } catch (error) {
      console.error("Error fetching API usage:", error);
      res.status(500).json({ error: "Failed to fetch API usage" });
    }
  });

  // ====== Local SEO Routes ======

  // Local Rankings
  router.get("/projects/:projectId/local-rankings", async (req: any, res: Response) => {
    try {
      const rankings = await storage.getLocalRankingsByProject(req.tenantId, req.params.projectId);
      res.json(rankings);
    } catch (error) {
      console.error("Error fetching local rankings:", error);
      res.status(500).json({ error: "Failed to fetch local rankings" });
    }
  });

  router.post("/projects/:projectId/local-rankings", async (req: any, res: Response) => {
    try {
      const { insertLocalRankingSchema } = await import("./seo-schema");
      const validatedData = insertLocalRankingSchema.parse({ ...req.body, projectId: req.params.projectId });
      const ranking = await storage.createLocalRanking(req.tenantId, validatedData);
      res.json(ranking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid local ranking data" });
      }
      console.error("Error creating local ranking:", error);
      res.status(500).json({ error: "Failed to create local ranking" });
    }
  });

  router.delete("/local-rankings/:id", async (req: any, res: Response) => {
    try {
      const deleted = await storage.deleteLocalRanking(req.tenantId, req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Local ranking not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting local ranking:", error);
      res.status(500).json({ error: "Failed to delete local ranking" });
    }
  });

  // Google Business Profile
  router.get("/projects/:projectId/google-business-profile", async (req: any, res: Response) => {
    try {
      const profile = await storage.getGoogleBusinessProfileByProject(req.tenantId, req.params.projectId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching Google Business Profile:", error);
      res.status(500).json({ error: "Failed to fetch Google Business Profile" });
    }
  });

  router.post("/projects/:projectId/google-business-profile", async (req: any, res: Response) => {
    try {
      const { insertGoogleBusinessProfileSchema } = await import("./seo-schema");
      const validatedData = insertGoogleBusinessProfileSchema.parse({ ...req.body, projectId: req.params.projectId });
      const profile = await storage.createGoogleBusinessProfile(req.tenantId, validatedData);
      res.json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid Google Business Profile data" });
      }
      console.error("Error creating Google Business Profile:", error);
      res.status(500).json({ error: "Failed to create Google Business Profile" });
    }
  });

  router.patch("/google-business-profiles/:id", async (req: any, res: Response) => {
    try {
      const { insertGoogleBusinessProfileSchema } = await import("./seo-schema");
      const updateSchema = insertGoogleBusinessProfileSchema.partial();
      const validatedData = updateSchema.parse(req.body);
      const profile = await storage.updateGoogleBusinessProfile(req.tenantId, req.params.id, validatedData);
      if (!profile) {
        return res.status(404).json({ error: "Google Business Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid update data" });
      }
      console.error("Error updating Google Business Profile:", error);
      res.status(500).json({ error: "Failed to update Google Business Profile" });
    }
  });

  // Local Citations
  router.get("/projects/:projectId/local-citations", async (req: any, res: Response) => {
    try {
      const citations = await storage.getLocalCitationsByProject(req.tenantId, req.params.projectId);
      res.json(citations);
    } catch (error) {
      console.error("Error fetching local citations:", error);
      res.status(500).json({ error: "Failed to fetch local citations" });
    }
  });

  router.post("/projects/:projectId/local-citations", async (req: any, res: Response) => {
    try {
      const { insertLocalCitationSchema } = await import("./seo-schema");
      const validatedData = insertLocalCitationSchema.parse({ ...req.body, projectId: req.params.projectId });
      const citation = await storage.createLocalCitation(req.tenantId, validatedData);
      res.json(citation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid local citation data" });
      }
      console.error("Error creating local citation:", error);
      res.status(500).json({ error: "Failed to create local citation" });
    }
  });

  router.patch("/local-citations/:id", async (req: any, res: Response) => {
    try {
      const { insertLocalCitationSchema } = await import("./seo-schema");
      const updateSchema = insertLocalCitationSchema.partial();
      const validatedData = updateSchema.parse(req.body);
      const citation = await storage.updateLocalCitation(req.tenantId, req.params.id, validatedData);
      if (!citation) {
        return res.status(404).json({ error: "Local citation not found" });
      }
      res.json(citation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid update data" });
      }
      console.error("Error updating local citation:", error);
      res.status(500).json({ error: "Failed to update local citation" });
    }
  });

  router.delete("/local-citations/:id", async (req: any, res: Response) => {
    try {
      const deleted = await storage.deleteLocalCitation(req.tenantId, req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Local citation not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting local citation:", error);
      res.status(500).json({ error: "Failed to delete local citation" });
    }
  });

  // AI-Powered Local SEO Generation
  router.post("/projects/:projectId/local-seo/generate", async (req: any, res: Response) => {
    try {
      const projectId = req.params.projectId;
      const { businessName, locations, numCitations } = req.body;

      if (!businessName || !Array.isArray(locations) || locations.length === 0) {
        return res.status(400).json({ error: "Business name and locations are required" });
      }

      // Get project keywords for context
      const keywords = await storage.getKeywordsByProject(req.tenantId, projectId);
      const keywordStrings = keywords.slice(0, 5).map(k => k.keyword);

      // Generate Google Business Profile
      const profileData = await aiService.generateGoogleBusinessProfile(businessName);
      
      // Create or update Google Business Profile
      const existingProfile = await storage.getGoogleBusinessProfileByProject(req.tenantId, projectId);
      let profile;
      if (existingProfile) {
        profile = await storage.updateGoogleBusinessProfile(req.tenantId, existingProfile.id, profileData);
      } else {
        profile = await storage.createGoogleBusinessProfile(req.tenantId, {
          ...profileData,
          projectId
        });
      }

      // Generate local rankings
      const rankingsData = await aiService.generateLocalRankings(
        keywordStrings.length > 0 ? keywordStrings : [businessName],
        locations
      );
      
      const rankings = await Promise.all(
        rankingsData.map(ranking => 
          storage.createLocalRanking(req.tenantId, {
            ...ranking,
            projectId
          })
        )
      );

      // Generate citations
      const citationsData = await aiService.generateLocalCitations(businessName, numCitations || 20);
      const citations = await Promise.all(
        citationsData.map(citation =>
          storage.createLocalCitation(req.tenantId, {
            ...citation,
            projectId
          })
        )
      );

      res.json({
        success: true,
        profile,
        rankings: rankings.length,
        citations: citations.length,
        source: 'ai'
      });
    } catch (error) {
      console.error("Error generating local SEO data:", error);
      res.status(500).json({ error: "Failed to generate local SEO data" });
    }
  });

  // ====== Social Media Monitoring Routes ======

  // Social Accounts
  router.get("/projects/:projectId/social-accounts", async (req: any, res: Response) => {
    try {
      const accounts = await storage.getSocialAccountsByProject(req.tenantId, req.params.projectId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching social accounts:", error);
      res.status(500).json({ error: "Failed to fetch social accounts" });
    }
  });

  router.post("/projects/:projectId/social-accounts", async (req: any, res: Response) => {
    try {
      const { insertSocialAccountSchema } = await import("./seo-schema");
      const validatedData = insertSocialAccountSchema.parse({ ...req.body, projectId: req.params.projectId });
      const account = await storage.createSocialAccount(req.tenantId, validatedData);
      res.json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid social account data" });
      }
      console.error("Error creating social account:", error);
      res.status(500).json({ error: "Failed to create social account" });
    }
  });

  router.delete("/social-accounts/:id", async (req: any, res: Response) => {
    try {
      const deleted = await storage.deleteSocialAccount(req.tenantId, req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Social account not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting social account:", error);
      res.status(500).json({ error: "Failed to delete social account" });
    }
  });

  // Social Posts
  router.get("/social-accounts/:accountId/posts", async (req: any, res: Response) => {
    try {
      const posts = await storage.getSocialPostsByAccount(req.tenantId, req.params.accountId);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching social posts:", error);
      res.status(500).json({ error: "Failed to fetch social posts" });
    }
  });

  router.post("/social-accounts/:accountId/posts", async (req: any, res: Response) => {
    try {
      const { insertSocialPostSchema } = await import("./seo-schema");
      const validatedData = insertSocialPostSchema.parse({ ...req.body, accountId: req.params.accountId });
      const post = await storage.createSocialPost(req.tenantId, validatedData);
      res.json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid social post data" });
      }
      console.error("Error creating social post:", error);
      res.status(500).json({ error: "Failed to create social post" });
    }
  });

  // Social Metrics
  router.get("/social-accounts/:accountId/metrics", async (req: any, res: Response) => {
    try {
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const metrics = await storage.getSocialMetricsByAccount(req.tenantId, req.params.accountId, startDate, endDate);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching social metrics:", error);
      res.status(500).json({ error: "Failed to fetch social metrics" });
    }
  });

  router.post("/social-accounts/:accountId/metrics", async (req: any, res: Response) => {
    try {
      const { insertSocialMetricSchema } = await import("./seo-schema");
      const validatedData = insertSocialMetricSchema.parse({ ...req.body, accountId: req.params.accountId });
      const metric = await storage.createSocialMetric(req.tenantId, validatedData);
      res.json(metric);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid social metric data" });
      }
      console.error("Error creating social metric:", error);
      res.status(500).json({ error: "Failed to create social metric" });
    }
  });

  // ========== MULTI-PLATFORM SEARCH OPTIMIZATION ENDPOINTS ==========
  // Following NP Digital's "Search Everywhere Optimization" methodology

  // Initialize AI platforms for a project
  router.post("/multi-platform/:projectId/initialize", async (req: any, res: Response) => {
    try {
      const { initializeAIPlatforms } = await import("./ai-search-optimization");
      await initializeAIPlatforms(req.tenantId, req.params.projectId);
      res.json({ success: true, message: "AI platforms initialized successfully" });
    } catch (error) {
      console.error("Error initializing AI platforms:", error);
      res.status(500).json({ error: "Failed to initialize AI platforms" });
    }
  });

  // Track brand mentions across AI platforms
  router.post("/multi-platform/:projectId/track-mentions", async (req: any, res: Response) => {
    try {
      const { trackBrandMentions } = await import("./ai-search-optimization");
      const { brandName, queries } = req.body;
      
      if (!brandName || !queries || !Array.isArray(queries)) {
        return res.status(400).json({ error: "brandName and queries array are required" });
      }

      const result = await trackBrandMentions(req.tenantId, req.params.projectId, brandName, queries);
      res.json(result);
    } catch (error) {
      console.error("Error tracking brand mentions:", error);
      res.status(500).json({ error: "Failed to track brand mentions" });
    }
  });

  // Get brand mention statistics
  router.get("/multi-platform/:projectId/mention-stats", async (req: any, res: Response) => {
    try {
      const { getBrandMentionStats } = await import("./ai-search-optimization");
      const stats = await getBrandMentionStats(req.tenantId, req.params.projectId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching brand mention stats:", error);
      res.status(500).json({ error: "Failed to fetch brand mention statistics" });
    }
  });

  // Get AI platform performance dashboard
  router.get("/multi-platform/:projectId/dashboard", async (req: any, res: Response) => {
    try {
      const { multiPlatformPerformance } = await import("./seo-schema");
      const { db } = await import("../db");
      const { eq, and, desc } = await import("drizzle-orm");

      const performance = await db
        .select()
        .from(multiPlatformPerformance)
        .where(and(
          eq(multiPlatformPerformance.tenantId, req.tenantId),
          eq(multiPlatformPerformance.projectId, req.params.projectId)
        ))
        .orderBy(desc(multiPlatformPerformance.date))
        .limit(30);

      res.json(performance);
    } catch (error) {
      console.error("Error fetching multi-platform dashboard:", error);
      res.status(500).json({ error: "Failed to fetch multi-platform dashboard" });
    }
  });

  // Get AI brand mentions
  router.get("/multi-platform/:projectId/ai-mentions", async (req: any, res: Response) => {
    try {
      const { aiBrandMentions } = await import("./seo-schema");
      const { db } = await import("../db");
      const { eq, and, desc } = await import("drizzle-orm");

      const platform = req.query.platform as string | undefined;
      const limit = parseInt(req.query.limit as string) || 50;

      // Build conditions array to ensure tenant isolation is always enforced
      const conditions = [
        eq(aiBrandMentions.tenantId, req.tenantId),
        eq(aiBrandMentions.projectId, req.params.projectId)
      ];

      if (platform) {
        conditions.push(eq(aiBrandMentions.platform, platform));
      }

      const mentions = await db
        .select()
        .from(aiBrandMentions)
        .where(and(...conditions))
        .orderBy(desc(aiBrandMentions.checkedAt))
        .limit(limit);

      res.json(mentions);
    } catch (error) {
      console.error("Error fetching AI brand mentions:", error);
      res.status(500).json({ error: "Failed to fetch AI brand mentions" });
    }
  });

  // Get sentiment analysis results
  router.get("/multi-platform/:projectId/sentiment", async (req: any, res: Response) => {
    try {
      const { aiSentimentAnalysis } = await import("./seo-schema");
      const { db } = await import("../db");
      const { eq, and, desc } = await import("drizzle-orm");

      const platform = req.query.platform as string | undefined;
      const limit = parseInt(req.query.limit as string) || 50;

      // Build conditions array to ensure tenant isolation is always enforced
      const conditions = [
        eq(aiSentimentAnalysis.tenantId, req.tenantId),
        eq(aiSentimentAnalysis.projectId, req.params.projectId)
      ];

      if (platform) {
        conditions.push(eq(aiSentimentAnalysis.platform, platform));
      }

      const sentimentData = await db
        .select()
        .from(aiSentimentAnalysis)
        .where(and(...conditions))
        .orderBy(desc(aiSentimentAnalysis.analyzedAt))
        .limit(limit);

      res.json(sentimentData);
    } catch (error) {
      console.error("Error fetching sentiment analysis:", error);
      res.status(500).json({ error: "Failed to fetch sentiment analysis" });
    }
  });

  // Get AI citations
  router.get("/multi-platform/:projectId/citations", async (req: any, res: Response) => {
    try {
      const { aiCitations } = await import("./seo-schema");
      const { db } = await import("../db");
      const { eq, and, desc } = await import("drizzle-orm");

      const platform = req.query.platform as string | undefined;
      const limit = parseInt(req.query.limit as string) || 50;

      // Build conditions array to ensure tenant isolation is always enforced
      const conditions = [
        eq(aiCitations.tenantId, req.tenantId),
        eq(aiCitations.projectId, req.params.projectId)
      ];

      if (platform) {
        conditions.push(eq(aiCitations.platform, platform));
      }

      const citations = await db
        .select()
        .from(aiCitations)
        .where(and(...conditions))
        .orderBy(desc(aiCitations.checkedAt))
        .limit(limit);

      res.json(citations);
    } catch (error) {
      console.error("Error fetching AI citations:", error);
      res.status(500).json({ error: "Failed to fetch AI citations" });
    }
  });

  // Search prompt library
  router.get("/multi-platform/prompts/search", async (req: any, res: Response) => {
    try {
      const { promptLibrary } = await import("./seo-schema");
      const { db } = await import("../db");
      const { eq, and, like, desc } = await import("drizzle-orm");

      const category = req.query.category as string | undefined;
      const industry = req.query.industry as string | undefined;
      const searchTerm = req.query.q as string | undefined;
      const limit = parseInt(req.query.limit as string) || 100;

      let conditions = [eq(promptLibrary.tenantId, req.tenantId)];

      if (category) {
        conditions.push(eq(promptLibrary.category, category));
      }
      if (industry) {
        conditions.push(eq(promptLibrary.industry, industry));
      }
      if (searchTerm) {
        conditions.push(like(promptLibrary.prompt, `%${searchTerm}%`));
      }

      const prompts = await db
        .select()
        .from(promptLibrary)
        .where(and(...conditions))
        .orderBy(desc(promptLibrary.searchVolume))
        .limit(limit);

      res.json(prompts);
    } catch (error) {
      console.error("Error searching prompt library:", error);
      res.status(500).json({ error: "Failed to search prompt library" });
    }
  });

  // Add prompt to library
  router.post("/multi-platform/prompts", async (req: any, res: Response) => {
    try {
      const { insertPromptLibrarySchema } = await import("./seo-schema");
      const { db } = await import("../db");
      const { promptLibrary } = await import("./seo-schema");

      const validatedData = insertPromptLibrarySchema.parse({ ...req.body, tenantId: req.tenantId });
      const [newPrompt] = await db.insert(promptLibrary).values(validatedData).returning();
      
      res.json(newPrompt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid prompt data", details: error.errors });
      }
      console.error("Error adding prompt:", error);
      res.status(500).json({ error: "Failed to add prompt to library" });
    }
  });

  // Get social search metrics
  router.get("/multi-platform/:projectId/social-search", async (req: any, res: Response) => {
    try {
      const { socialSearchMetrics } = await import("./seo-schema");
      const { db } = await import("../db");
      const { eq, and, desc } = await import("drizzle-orm");

      const platform = req.query.platform as string | undefined;
      const limit = parseInt(req.query.limit as string) || 50;

      // Build conditions array to ensure tenant isolation is always enforced
      const conditions = [
        eq(socialSearchMetrics.tenantId, req.tenantId),
        eq(socialSearchMetrics.projectId, req.params.projectId)
      ];

      if (platform) {
        conditions.push(eq(socialSearchMetrics.platform, platform));
      }

      const metrics = await db
        .select()
        .from(socialSearchMetrics)
        .where(and(...conditions))
        .orderBy(desc(socialSearchMetrics.checkedAt))
        .limit(limit);

      res.json(metrics);
    } catch (error) {
      console.error("Error fetching social search metrics:", error);
      res.status(500).json({ error: "Failed to fetch social search metrics" });
    }
  });

  // Get competitive AI benchmark
  router.get("/multi-platform/:projectId/competitive-benchmark", async (req: any, res: Response) => {
    try {
      const { competitiveAiBenchmark } = await import("./seo-schema");
      const { db } = await import("../db");
      const { eq, and, desc } = await import("drizzle-orm");

      const benchmarks = await db
        .select()
        .from(competitiveAiBenchmark)
        .where(and(
          eq(competitiveAiBenchmark.tenantId, req.tenantId),
          eq(competitiveAiBenchmark.projectId, req.params.projectId)
        ))
        .orderBy(desc(competitiveAiBenchmark.lastAnalyzed));

      res.json(benchmarks);
    } catch (error) {
      console.error("Error fetching competitive benchmark:", error);
      res.status(500).json({ error: "Failed to fetch competitive benchmark" });
    }
  });

  // Get audience insights
  router.get("/multi-platform/:projectId/audience-insights", async (req: any, res: Response) => {
    try {
      const { audienceInsights } = await import("./seo-schema");
      const { db } = await import("../db");
      const { eq, and, desc } = await import("drizzle-orm");

      const insights = await db
        .select()
        .from(audienceInsights)
        .where(and(
          eq(audienceInsights.tenantId, req.tenantId),
          eq(audienceInsights.projectId, req.params.projectId)
        ))
        .orderBy(desc(audienceInsights.priority), desc(audienceInsights.createdAt));

      res.json(insights);
    } catch (error) {
      console.error("Error fetching audience insights:", error);
      res.status(500).json({ error: "Failed to fetch audience insights" });
    }
  });

  // Get EEAT signals
  router.get("/multi-platform/:projectId/eeat-signals", async (req: any, res: Response) => {
    try {
      const { eeatSignals } = await import("./seo-schema");
      const { db } = await import("../db");
      const { eq, and, desc } = await import("drizzle-orm");

      const url = req.query.url as string | undefined;

      let query = db
        .select()
        .from(eeatSignals)
        .where(and(
          eq(eeatSignals.tenantId, req.tenantId),
          eq(eeatSignals.projectId, req.params.projectId)
        ));

      if (url) {
        query = query.where(eq(eeatSignals.url, url));
      }

      const signals = await query.orderBy(desc(eeatSignals.overallEeatScore), desc(eeatSignals.analyzedAt));
      res.json(signals);
    } catch (error) {
      console.error("Error fetching EEAT signals:", error);
      res.status(500).json({ error: "Failed to fetch EEAT signals" });
    }
  });

  return router;
}
