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

  const httpServer = createServer(app);

  return httpServer;
}
