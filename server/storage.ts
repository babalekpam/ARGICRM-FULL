import { 
  type Project, type InsertProject,
  type Keyword, type InsertKeyword,
  type KeywordRanking, type InsertKeywordRanking,
  type TrafficData, type InsertTrafficData,
  type Backlink, type InsertBacklink,
  type Competitor, type InsertCompetitor,
  type SeoIssue, type InsertSeoIssue,
  type BacklinkGrowth, type InsertBacklinkGrowth,
  projects, keywords, keywordRankings, trafficData, backlinks, competitors, seoIssues, backlinkGrowth
} from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { eq, desc } from "drizzle-orm";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

export interface IStorage {
  // Projects
  getProject(id: string): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;
  
  // Keywords
  getKeywordsByProject(projectId: string): Promise<Keyword[]>;
  createKeyword(keyword: InsertKeyword): Promise<Keyword>;
  
  // Keyword Rankings
  getKeywordRanking(projectId: string): Promise<KeywordRanking | undefined>;
  
  // Traffic Data
  getTrafficDataByProject(projectId: string): Promise<TrafficData[]>;
  
  // Backlinks
  getBacklinksByProject(projectId: string): Promise<Backlink[]>;
  getBacklinkGrowth(projectId: string): Promise<Array<{ date: string; backlinks: number }>>;
  
  // Competitors
  getCompetitorsByProject(projectId: string): Promise<Competitor[]>;
  
  // SEO Issues
  getSeoIssuesByProject(projectId: string): Promise<SeoIssue[]>;
}

// Database Storage Implementation
export class DbStorage implements IStorage {
  private db;

  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.db = drizzle(pool);
  }

  async getProject(id: string): Promise<Project | undefined> {
    const result = await this.db.select().from(projects).where(eq(projects.id, id));
    return result[0];
  }

  async getAllProjects(): Promise<Project[]> {
    return await this.db.select().from(projects);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const result = await this.db.insert(projects).values(insertProject).returning();
    return result[0];
  }

  async updateProject(id: string, insertProject: Partial<InsertProject>): Promise<Project | undefined> {
    const result = await this.db.update(projects).set(insertProject).where(eq(projects.id, id)).returning();
    return result[0];
  }

  async deleteProject(id: string): Promise<boolean> {
    const result = await this.db.delete(projects).where(eq(projects.id, id)).returning();
    return result.length > 0;
  }

  async getKeywordsByProject(projectId: string): Promise<Keyword[]> {
    return await this.db.select().from(keywords).where(eq(keywords.projectId, projectId));
  }

  async createKeyword(insertKeyword: InsertKeyword): Promise<Keyword> {
    const result = await this.db.insert(keywords).values(insertKeyword).returning();
    return result[0];
  }

  async getKeywordRanking(projectId: string): Promise<KeywordRanking | undefined> {
    const result = await this.db.select().from(keywordRankings).where(eq(keywordRankings.projectId, projectId));
    return result[0];
  }

  async getTrafficDataByProject(projectId: string): Promise<TrafficData[]> {
    return await this.db.select().from(trafficData)
      .where(eq(trafficData.projectId, projectId))
      .orderBy(trafficData.date);
  }

  async getBacklinksByProject(projectId: string): Promise<Backlink[]> {
    return await this.db.select().from(backlinks)
      .where(eq(backlinks.projectId, projectId))
      .orderBy(desc(backlinks.date));
  }

  async getBacklinkGrowth(projectId: string): Promise<Array<{ date: string; backlinks: number }>> {
    const growthData = await this.db.select().from(backlinkGrowth)
      .where(eq(backlinkGrowth.projectId, projectId))
      .orderBy(backlinkGrowth.date);
    return growthData.map(g => ({
      date: g.date.substring(5), // Format: MM-DD
      backlinks: g.backlinkCount
    }));
  }

  async getCompetitorsByProject(projectId: string): Promise<Competitor[]> {
    return await this.db.select().from(competitors).where(eq(competitors.projectId, projectId));
  }

  async getSeoIssuesByProject(projectId: string): Promise<SeoIssue[]> {
    const issues = await this.db.select().from(seoIssues).where(eq(seoIssues.projectId, projectId));
    return issues.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder];
    });
  }
}

export const storage = new DbStorage();
