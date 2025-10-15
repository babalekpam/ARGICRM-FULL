import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard data endpoint
  app.get("/api/dashboard", async (req, res) => {
    try {
      const projectId = req.query.projectId as string || "1";
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const keywordRanking = await storage.getKeywordRanking(projectId);
      const trafficData = await storage.getTrafficDataByProject(projectId);
      const competitors = await storage.getCompetitorsByProject(projectId);
      const seoIssues = await storage.getSeoIssuesByProject(projectId);
      const backlinkGrowth = await storage.getBacklinkGrowth(projectId);

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
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const { insertProjectSchema } = await import("@shared/schema");
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.json(project);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid project data" });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const { insertProjectSchema } = await import("@shared/schema");
      // Create a partial schema that only validates fields that are provided
      const partialSchema = insertProjectSchema.partial();
      const validatedData = partialSchema.parse(req.body);
      const project = await storage.updateProject(req.params.id, validatedData);
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

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProject(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Keywords endpoints
  app.get("/api/keywords", async (req, res) => {
    try {
      const projectId = req.query.projectId as string || "1";
      const keywords = await storage.getKeywordsByProject(projectId);
      res.json(keywords);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Traffic endpoints
  app.get("/api/traffic", async (req, res) => {
    try {
      const projectId = req.query.projectId as string || "1";
      const trafficData = await storage.getTrafficDataByProject(projectId);
      res.json(trafficData);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // SEO Issues endpoints
  app.get("/api/seo-issues", async (req, res) => {
    try {
      const projectId = req.query.projectId as string || "1";
      const seoIssues = await storage.getSeoIssuesByProject(projectId);
      res.json(seoIssues);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Backlinks endpoints
  app.get("/api/backlinks", async (req, res) => {
    try {
      const projectId = req.query.projectId as string || "1";
      const backlinks = await storage.getBacklinksByProject(projectId);
      res.json(backlinks);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Competitors endpoints
  app.get("/api/competitors", async (req, res) => {
    try {
      const projectId = req.query.projectId as string || "1";
      const competitors = await storage.getCompetitorsByProject(projectId);
      res.json(competitors);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
