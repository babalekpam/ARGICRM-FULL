import { 
  type Project, type InsertProject,
  type Keyword, type InsertKeyword,
  type KeywordRanking, type InsertKeywordRanking,
  type TrafficData, type InsertTrafficData,
  type Backlink, type InsertBacklink,
  type Competitor, type InsertCompetitor,
  type SeoIssue, type InsertSeoIssue,
  type BacklinkGrowth, type InsertBacklinkGrowth,
  type User, type UpsertUser,
  type Tenant, type InsertTenant,
  projects, keywords, keywordRankings, trafficData, backlinks, competitors, seoIssues, backlinkGrowth, users, tenants
} from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { eq, desc, and } from "drizzle-orm";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

export interface IStorage {
  // Users - Required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Tenants
  getTenant(id: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  
  // Projects - all methods require tenantId for isolation
  getProject(tenantId: string, id: string): Promise<Project | undefined>;
  getAllProjects(tenantId: string): Promise<Project[]>;
  createProject(tenantId: string, project: InsertProject): Promise<Project>;
  updateProject(tenantId: string, id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(tenantId: string, id: string): Promise<boolean>;
  
  // Keywords - tenant-scoped
  getKeywordsByProject(tenantId: string, projectId: string): Promise<Keyword[]>;
  createKeyword(tenantId: string, keyword: InsertKeyword): Promise<Keyword>;
  
  // Keyword Rankings - tenant-scoped
  getKeywordRanking(tenantId: string, projectId: string): Promise<KeywordRanking | undefined>;
  
  // Traffic Data - tenant-scoped
  getTrafficDataByProject(tenantId: string, projectId: string): Promise<TrafficData[]>;
  
  // Backlinks - tenant-scoped
  getBacklinksByProject(tenantId: string, projectId: string): Promise<Backlink[]>;
  getBacklinkGrowth(tenantId: string, projectId: string): Promise<Array<{ date: string; backlinks: number }>>;
  
  // Competitors - tenant-scoped
  getCompetitorsByProject(tenantId: string, projectId: string): Promise<Competitor[]>;
  
  // SEO Issues - tenant-scoped
  getSeoIssuesByProject(tenantId: string, projectId: string): Promise<SeoIssue[]>;
}

// Database Storage Implementation
export class DbStorage implements IStorage {
  private db;

  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.db = drizzle(pool);
  }

  // User operations - Required for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await this.db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Tenant operations
  async getTenant(id: string): Promise<Tenant | undefined> {
    const [tenant] = await this.db.select().from(tenants).where(eq(tenants.id, id));
    return tenant;
  }

  async createTenant(insertTenant: InsertTenant): Promise<Tenant> {
    const [tenant] = await this.db.insert(tenants).values(insertTenant).returning();
    return tenant;
  }

  async getProject(tenantId: string, id: string): Promise<Project | undefined> {
    const result = await this.db.select().from(projects).where(and(eq(projects.tenantId, tenantId), eq(projects.id, id)));
    return result[0];
  }

  async getAllProjects(tenantId: string): Promise<Project[]> {
    return await this.db.select().from(projects).where(eq(projects.tenantId, tenantId));
  }

  async createProject(tenantId: string, insertProject: InsertProject): Promise<Project> {
    const result = await this.db.insert(projects).values({ ...insertProject, tenantId }).returning();
    return result[0];
  }

  async updateProject(tenantId: string, id: string, insertProject: Partial<InsertProject>): Promise<Project | undefined> {
    const result = await this.db.update(projects).set(insertProject).where(and(eq(projects.tenantId, tenantId), eq(projects.id, id))).returning();
    return result[0];
  }

  async deleteProject(tenantId: string, id: string): Promise<boolean> {
    const result = await this.db.delete(projects).where(and(eq(projects.tenantId, tenantId), eq(projects.id, id))).returning();
    return result.length > 0;
  }

  async getKeywordsByProject(tenantId: string, projectId: string): Promise<Keyword[]> {
    return await this.db.select().from(keywords).where(and(eq(keywords.tenantId, tenantId), eq(keywords.projectId, projectId)));
  }

  async createKeyword(tenantId: string, insertKeyword: InsertKeyword): Promise<Keyword> {
    const result = await this.db.insert(keywords).values({ ...insertKeyword, tenantId }).returning();
    return result[0];
  }

  async getKeywordRanking(tenantId: string, projectId: string): Promise<KeywordRanking | undefined> {
    const result = await this.db.select().from(keywordRankings).where(and(eq(keywordRankings.tenantId, tenantId), eq(keywordRankings.projectId, projectId)));
    return result[0];
  }

  async getTrafficDataByProject(tenantId: string, projectId: string): Promise<TrafficData[]> {
    return await this.db.select().from(trafficData)
      .where(and(eq(trafficData.tenantId, tenantId), eq(trafficData.projectId, projectId)))
      .orderBy(trafficData.date);
  }

  async getBacklinksByProject(tenantId: string, projectId: string): Promise<Backlink[]> {
    return await this.db.select().from(backlinks)
      .where(and(eq(backlinks.tenantId, tenantId), eq(backlinks.projectId, projectId)))
      .orderBy(desc(backlinks.date));
  }

  async getBacklinkGrowth(tenantId: string, projectId: string): Promise<Array<{ date: string; backlinks: number }>> {
    const growthData = await this.db.select().from(backlinkGrowth)
      .where(and(eq(backlinkGrowth.tenantId, tenantId), eq(backlinkGrowth.projectId, projectId)))
      .orderBy(backlinkGrowth.date);
    return growthData.map(g => ({
      date: g.date.substring(5), // Format: MM-DD
      backlinks: g.backlinkCount
    }));
  }

  async getCompetitorsByProject(tenantId: string, projectId: string): Promise<Competitor[]> {
    return await this.db.select().from(competitors).where(and(eq(competitors.tenantId, tenantId), eq(competitors.projectId, projectId)));
  }

  async getSeoIssuesByProject(tenantId: string, projectId: string): Promise<SeoIssue[]> {
    const issues = await this.db.select().from(seoIssues).where(and(eq(seoIssues.tenantId, tenantId), eq(seoIssues.projectId, projectId)));
    return issues.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder];
    });
  }
}

export const storage = new DbStorage();
