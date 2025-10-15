import { 
  type Project, type InsertProject,
  type Keyword, type InsertKeyword,
  type KeywordRanking, type InsertKeywordRanking,
  type TrafficData, type InsertTrafficData,
  type Backlink, type InsertBacklink,
  type Competitor, type InsertCompetitor,
  type SeoIssue, type InsertSeoIssue,
  type BacklinkGrowth, type InsertBacklinkGrowth,
  type BacklinkOpportunity, type InsertBacklinkOpportunity,
  type OutreachCampaign, type InsertOutreachCampaign,
  type OutreachContact, type InsertOutreachContact,
  type BacklinkGap, type InsertBacklinkGap,
  type KeywordRankHistory, type InsertKeywordRankHistory,
  type CompetitorRankSnapshot, type InsertCompetitorRankSnapshot,
  type User, type UpsertUser,
  type Tenant, type InsertTenant,
  projects, keywords, keywordRankings, trafficData, backlinks, competitors, seoIssues, backlinkGrowth, 
  backlinkOpportunities, outreachCampaigns, outreachContacts, backlinkGaps, keywordRankHistory, 
  competitorRankSnapshots, users, tenants
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
  
  // Backlink Opportunities - tenant-scoped
  getOpportunitiesByProject(tenantId: string, projectId: string): Promise<BacklinkOpportunity[]>;
  createOpportunity(tenantId: string, opportunity: InsertBacklinkOpportunity): Promise<BacklinkOpportunity>;
  updateOpportunity(tenantId: string, id: string, opportunity: Partial<InsertBacklinkOpportunity>): Promise<BacklinkOpportunity | undefined>;
  deleteOpportunity(tenantId: string, id: string): Promise<boolean>;
  
  // Outreach Campaigns - tenant-scoped
  getCampaignsByProject(tenantId: string, projectId: string): Promise<OutreachCampaign[]>;
  createCampaign(tenantId: string, campaign: InsertOutreachCampaign): Promise<OutreachCampaign>;
  updateCampaign(tenantId: string, id: string, campaign: Partial<InsertOutreachCampaign>): Promise<OutreachCampaign | undefined>;
  deleteCampaign(tenantId: string, id: string): Promise<boolean>;
  
  // Outreach Contacts - tenant-scoped
  getContactsByCampaign(tenantId: string, campaignId: string): Promise<OutreachContact[]>;
  createContact(tenantId: string, contact: InsertOutreachContact): Promise<OutreachContact>;
  updateContact(tenantId: string, id: string, contact: Partial<InsertOutreachContact>): Promise<OutreachContact | undefined>;
  
  // Backlink Gaps - tenant-scoped
  getGapsByProject(tenantId: string, projectId: string): Promise<BacklinkGap[]>;
  createGap(tenantId: string, gap: InsertBacklinkGap): Promise<BacklinkGap>;
  updateGap(tenantId: string, id: string, gap: Partial<InsertBacklinkGap>): Promise<BacklinkGap | undefined>;
  
  // Rank Tracking - tenant-scoped
  getRankHistoryByKeyword(tenantId: string, keywordId: string, startDate?: string, endDate?: string): Promise<KeywordRankHistory[]>;
  getRankHistoryByProject(tenantId: string, projectId: string, startDate?: string, endDate?: string): Promise<KeywordRankHistory[]>;
  createRankHistory(tenantId: string, rankHistory: InsertKeywordRankHistory): Promise<KeywordRankHistory>;
  
  // Competitor Rank Snapshots - tenant-scoped
  getCompetitorRanksByProject(tenantId: string, projectId: string, startDate?: string, endDate?: string): Promise<CompetitorRankSnapshot[]>;
  getCompetitorRanksByKeyword(tenantId: string, keywordId: string): Promise<CompetitorRankSnapshot[]>;
  createCompetitorRankSnapshot(tenantId: string, snapshot: InsertCompetitorRankSnapshot): Promise<CompetitorRankSnapshot>;
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

  // Backlink Opportunities
  async getOpportunitiesByProject(tenantId: string, projectId: string): Promise<BacklinkOpportunity[]> {
    return await this.db.select().from(backlinkOpportunities)
      .where(and(eq(backlinkOpportunities.tenantId, tenantId), eq(backlinkOpportunities.projectId, projectId)))
      .orderBy(desc(backlinkOpportunities.relevanceScore));
  }

  async createOpportunity(tenantId: string, insertOpportunity: InsertBacklinkOpportunity): Promise<BacklinkOpportunity> {
    const result = await this.db.insert(backlinkOpportunities).values({ ...insertOpportunity, tenantId }).returning();
    return result[0];
  }

  async updateOpportunity(tenantId: string, id: string, insertOpportunity: Partial<InsertBacklinkOpportunity>): Promise<BacklinkOpportunity | undefined> {
    const result = await this.db.update(backlinkOpportunities).set(insertOpportunity)
      .where(and(eq(backlinkOpportunities.tenantId, tenantId), eq(backlinkOpportunities.id, id)))
      .returning();
    return result[0];
  }

  async deleteOpportunity(tenantId: string, id: string): Promise<boolean> {
    const result = await this.db.delete(backlinkOpportunities)
      .where(and(eq(backlinkOpportunities.tenantId, tenantId), eq(backlinkOpportunities.id, id)))
      .returning();
    return result.length > 0;
  }

  // Outreach Campaigns
  async getCampaignsByProject(tenantId: string, projectId: string): Promise<OutreachCampaign[]> {
    return await this.db.select().from(outreachCampaigns)
      .where(and(eq(outreachCampaigns.tenantId, tenantId), eq(outreachCampaigns.projectId, projectId)))
      .orderBy(desc(outreachCampaigns.createdAt));
  }

  async createCampaign(tenantId: string, insertCampaign: InsertOutreachCampaign): Promise<OutreachCampaign> {
    const result = await this.db.insert(outreachCampaigns).values({ ...insertCampaign, tenantId }).returning();
    return result[0];
  }

  async updateCampaign(tenantId: string, id: string, insertCampaign: Partial<InsertOutreachCampaign>): Promise<OutreachCampaign | undefined> {
    const result = await this.db.update(outreachCampaigns).set(insertCampaign)
      .where(and(eq(outreachCampaigns.tenantId, tenantId), eq(outreachCampaigns.id, id)))
      .returning();
    return result[0];
  }

  async deleteCampaign(tenantId: string, id: string): Promise<boolean> {
    const result = await this.db.delete(outreachCampaigns)
      .where(and(eq(outreachCampaigns.tenantId, tenantId), eq(outreachCampaigns.id, id)))
      .returning();
    return result.length > 0;
  }

  // Outreach Contacts
  async getContactsByCampaign(tenantId: string, campaignId: string): Promise<OutreachContact[]> {
    return await this.db.select().from(outreachContacts)
      .where(and(eq(outreachContacts.tenantId, tenantId), eq(outreachContacts.campaignId, campaignId)));
  }

  async createContact(tenantId: string, insertContact: InsertOutreachContact): Promise<OutreachContact> {
    const result = await this.db.insert(outreachContacts).values({ ...insertContact, tenantId }).returning();
    return result[0];
  }

  async updateContact(tenantId: string, id: string, insertContact: Partial<InsertOutreachContact>): Promise<OutreachContact | undefined> {
    const result = await this.db.update(outreachContacts).set(insertContact)
      .where(and(eq(outreachContacts.tenantId, tenantId), eq(outreachContacts.id, id)))
      .returning();
    return result[0];
  }

  // Backlink Gaps
  async getGapsByProject(tenantId: string, projectId: string): Promise<BacklinkGap[]> {
    return await this.db.select().from(backlinkGaps)
      .where(and(eq(backlinkGaps.tenantId, tenantId), eq(backlinkGaps.projectId, projectId)))
      .orderBy(desc(backlinkGaps.domainAuthority));
  }

  async createGap(tenantId: string, insertGap: InsertBacklinkGap): Promise<BacklinkGap> {
    const result = await this.db.insert(backlinkGaps).values({ ...insertGap, tenantId }).returning();
    return result[0];
  }

  async updateGap(tenantId: string, id: string, insertGap: Partial<InsertBacklinkGap>): Promise<BacklinkGap | undefined> {
    const result = await this.db.update(backlinkGaps).set(insertGap)
      .where(and(eq(backlinkGaps.tenantId, tenantId), eq(backlinkGaps.id, id)))
      .returning();
    return result[0];
  }

  // Rank Tracking
  async getRankHistoryByKeyword(tenantId: string, keywordId: string, startDate?: string, endDate?: string): Promise<KeywordRankHistory[]> {
    let query = this.db.select().from(keywordRankHistory)
      .where(and(eq(keywordRankHistory.tenantId, tenantId), eq(keywordRankHistory.keywordId, keywordId)))
      .$dynamic();
    
    return await query.orderBy(keywordRankHistory.date);
  }

  async getRankHistoryByProject(tenantId: string, projectId: string, startDate?: string, endDate?: string): Promise<KeywordRankHistory[]> {
    return await this.db.select().from(keywordRankHistory)
      .where(and(eq(keywordRankHistory.tenantId, tenantId), eq(keywordRankHistory.projectId, projectId)))
      .orderBy(keywordRankHistory.date);
  }

  async createRankHistory(tenantId: string, insertRankHistory: InsertKeywordRankHistory): Promise<KeywordRankHistory> {
    const result = await this.db.insert(keywordRankHistory).values({ ...insertRankHistory, tenantId }).returning();
    return result[0];
  }

  // Competitor Rank Snapshots
  async getCompetitorRanksByProject(tenantId: string, projectId: string, startDate?: string, endDate?: string): Promise<CompetitorRankSnapshot[]> {
    return await this.db.select().from(competitorRankSnapshots)
      .where(and(eq(competitorRankSnapshots.tenantId, tenantId), eq(competitorRankSnapshots.projectId, projectId)))
      .orderBy(competitorRankSnapshots.date);
  }

  async getCompetitorRanksByKeyword(tenantId: string, keywordId: string): Promise<CompetitorRankSnapshot[]> {
    return await this.db.select().from(competitorRankSnapshots)
      .where(and(eq(competitorRankSnapshots.tenantId, tenantId), eq(competitorRankSnapshots.keywordId, keywordId)))
      .orderBy(competitorRankSnapshots.date);
  }

  async createCompetitorRankSnapshot(tenantId: string, insertSnapshot: InsertCompetitorRankSnapshot): Promise<CompetitorRankSnapshot> {
    const result = await this.db.insert(competitorRankSnapshots).values({ ...insertSnapshot, tenantId }).returning();
    return result[0];
  }
}

export const storage = new DbStorage();
