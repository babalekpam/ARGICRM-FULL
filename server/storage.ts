import { 
  type Project, type InsertProject,
  type Keyword, type InsertKeyword,
  type KeywordRanking, type InsertKeywordRanking,
  type TrafficData, type InsertTrafficData,
  type Backlink, type InsertBacklink,
  type Competitor, type InsertCompetitor,
  type SeoIssue, type InsertSeoIssue
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Projects
  getProject(id: string): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  
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

export class MemStorage implements IStorage {
  private projects: Map<string, Project>;
  private keywords: Map<string, Keyword>;
  private keywordRankings: Map<string, KeywordRanking>;
  private trafficData: Map<string, TrafficData>;
  private backlinks: Map<string, Backlink>;
  private competitors: Map<string, Competitor>;
  private seoIssues: Map<string, SeoIssue>;

  constructor() {
    this.projects = new Map();
    this.keywords = new Map();
    this.keywordRankings = new Map();
    this.trafficData = new Map();
    this.backlinks = new Map();
    this.competitors = new Map();
    this.seoIssues = new Map();
    
    this.seedData();
  }

  private seedData() {
    // Create default projects
    const project1: Project = {
      id: "1",
      name: "Main Website",
      domain: "example.com",
      seoScore: 78,
      organicTraffic: 45230,
      totalBacklinks: 1247,
      referringDomains: 342,
      totalKeywords: 156,
      createdAt: new Date(),
    };
    this.projects.set("1", project1);

    const project2: Project = {
      id: "2",
      name: "Blog",
      domain: "blog.example.com",
      seoScore: 65,
      organicTraffic: 12500,
      totalBacklinks: 543,
      referringDomains: 178,
      totalKeywords: 89,
      createdAt: new Date(),
    };
    this.projects.set("2", project2);

    // Keyword rankings for both projects
    const ranking1: KeywordRanking = {
      id: randomUUID(),
      projectId: "1",
      top3: 12,
      top10: 34,
      top20: 48,
      top50: 42,
      over50: 20,
    };
    this.keywordRankings.set("1", ranking1);

    const ranking2: KeywordRanking = {
      id: randomUUID(),
      projectId: "2",
      top3: 8,
      top10: 22,
      top20: 31,
      top50: 18,
      over50: 10,
    };
    this.keywordRankings.set("2", ranking2);

    // Keywords for project 1
    const keywords1: Keyword[] = [
      { id: randomUUID(), projectId: "1", keyword: "seo tools", searchVolume: 12500, difficulty: 68, position: 3, cpc: 4.5, trend: "up" },
      { id: randomUUID(), projectId: "1", keyword: "keyword research", searchVolume: 8900, difficulty: 54, position: 7, cpc: 3.2, trend: "up" },
      { id: randomUUID(), projectId: "1", keyword: "backlink checker", searchVolume: 6700, difficulty: 62, position: 12, cpc: 5.1, trend: "stable" },
      { id: randomUUID(), projectId: "1", keyword: "seo audit tool", searchVolume: 4200, difficulty: 48, position: 5, cpc: 2.8, trend: "up" },
      { id: randomUUID(), projectId: "1", keyword: "competitor analysis", searchVolume: 3800, difficulty: 56, position: 15, cpc: 3.9, trend: "down" },
      { id: randomUUID(), projectId: "1", keyword: "traffic analyzer", searchVolume: 2100, difficulty: 42, position: 9, cpc: 2.3, trend: "stable" },
      { id: randomUUID(), projectId: "1", keyword: "domain authority", searchVolume: 5600, difficulty: 71, position: 18, cpc: 4.7, trend: "up" },
      { id: randomUUID(), projectId: "1", keyword: "rank tracker", searchVolume: 3200, difficulty: 52, position: 6, cpc: 3.4, trend: "up" },
    ];
    keywords1.forEach(k => this.keywords.set(k.id, k));

    // Keywords for project 2
    const keywords2: Keyword[] = [
      { id: randomUUID(), projectId: "2", keyword: "content marketing", searchVolume: 18000, difficulty: 72, position: 4, cpc: 5.2, trend: "up" },
      { id: randomUUID(), projectId: "2", keyword: "blog writing tips", searchVolume: 3400, difficulty: 38, position: 11, cpc: 1.8, trend: "stable" },
      { id: randomUUID(), projectId: "2", keyword: "seo blogging", searchVolume: 2800, difficulty: 45, position: 8, cpc: 2.1, trend: "up" },
    ];
    keywords2.forEach(k => this.keywords.set(k.id, k));

    // Traffic data for both projects
    this.seedTrafficData("1", 1200);
    this.seedTrafficData("2", 400);

    // Backlinks for project 1
    const backlinks1: Backlink[] = [
      { id: randomUUID(), projectId: "1", url: "https://techblog.com/seo-tools-review", domainScore: 82, anchorText: "best SEO tools", date: "2025-01-15" },
      { id: randomUUID(), projectId: "1", url: "https://marketingpro.io/resources", domainScore: 75, anchorText: "keyword research tool", date: "2025-01-10" },
      { id: randomUUID(), projectId: "1", url: "https://digitalguide.net/tools", domainScore: 68, anchorText: "SEO analytics", date: "2025-01-05" },
      { id: randomUUID(), projectId: "1", url: "https://seoblog.com/top-tools-2025", domainScore: 91, anchorText: "comprehensive SEO platform", date: "2024-12-28" },
      { id: randomUUID(), projectId: "1", url: "https://webmaster-hub.org/links", domainScore: 62, anchorText: null, date: "2024-12-20" },
      { id: randomUUID(), projectId: "1", url: "https://growthmarketing.io/tools", domainScore: 78, anchorText: "traffic analyzer", date: "2024-12-15" },
    ];
    backlinks1.forEach(b => this.backlinks.set(b.id, b));

    // Backlinks for project 2
    const backlinks2: Backlink[] = [
      { id: randomUUID(), projectId: "2", url: "https://contentmarketing.com/best-blogs", domainScore: 84, anchorText: "top marketing blog", date: "2025-01-12" },
      { id: randomUUID(), projectId: "2", url: "https://writinghub.net/resources", domainScore: 71, anchorText: "blogging tips", date: "2024-12-30" },
    ];
    backlinks2.forEach(b => this.backlinks.set(b.id, b));

    // Competitors for both projects
    const competitors1: Competitor[] = [
      { id: randomUUID(), projectId: "1", domain: "semrush.com", domainScore: 92, topKeyword: "seo audit", estimatedTraffic: 2500000, commonKeywords: 87 },
      { id: randomUUID(), projectId: "1", domain: "ahrefs.com", domainScore: 94, topKeyword: "backlink checker", estimatedTraffic: 3200000, commonKeywords: 93 },
      { id: randomUUID(), projectId: "1", domain: "moz.com", domainScore: 88, topKeyword: "domain authority", estimatedTraffic: 1800000, commonKeywords: 76 },
    ];
    competitors1.forEach(c => this.competitors.set(c.id, c));

    const competitors2: Competitor[] = [
      { id: randomUUID(), projectId: "2", domain: "hubspot.com", domainScore: 95, topKeyword: "content marketing", estimatedTraffic: 5000000, commonKeywords: 45 },
      { id: randomUUID(), projectId: "2", domain: "copyblogger.com", domainScore: 82, topKeyword: "copywriting", estimatedTraffic: 800000, commonKeywords: 28 },
    ];
    competitors2.forEach(c => this.competitors.set(c.id, c));

    // SEO Issues for both projects
    const seoIssues1: SeoIssue[] = [
      { id: randomUUID(), projectId: "1", severity: "critical", title: "Missing Meta Descriptions", description: "Several pages are missing meta descriptions which can impact click-through rates from search results.", affectedPages: 12 },
      { id: randomUUID(), projectId: "1", severity: "critical", title: "Broken Internal Links", description: "Found broken internal links that create poor user experience and hurt SEO.", affectedPages: 8 },
      { id: randomUUID(), projectId: "1", severity: "warning", title: "Large Image Sizes", description: "Multiple images are larger than recommended, slowing down page load times.", affectedPages: 23 },
      { id: randomUUID(), projectId: "1", severity: "warning", title: "H1 Tag Issues", description: "Some pages have multiple H1 tags or missing H1 tags.", affectedPages: 6 },
      { id: randomUUID(), projectId: "1", severity: "info", title: "Alt Text Missing", description: "Some images don't have descriptive alt text for accessibility and SEO.", affectedPages: 15 },
      { id: randomUUID(), projectId: "1", severity: "warning", title: "Slow Page Speed", description: "Page load time exceeds recommended thresholds on mobile devices.", affectedPages: 18 },
      { id: randomUUID(), projectId: "1", severity: "info", title: "Schema Markup Opportunities", description: "Pages could benefit from structured data markup for rich snippets.", affectedPages: 34 },
    ];
    seoIssues1.forEach(i => this.seoIssues.set(i.id, i));

    const seoIssues2: SeoIssue[] = [
      { id: randomUUID(), projectId: "2", severity: "warning", title: "Mobile Responsiveness Issues", description: "Some blog posts don't render properly on mobile devices.", affectedPages: 5 },
      { id: randomUUID(), projectId: "2", severity: "info", title: "Missing Open Graph Tags", description: "Blog posts lack Open Graph tags for better social media sharing.", affectedPages: 18 },
    ];
    seoIssues2.forEach(i => this.seoIssues.set(i.id, i));
  }

  private seedTrafficData(projectId: string, baseVisits: number) {
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const variance = Math.floor(Math.random() * (baseVisits * 0.3));
      const weekendMultiplier = date.getDay() === 0 || date.getDay() === 6 ? 0.7 : 1;
      const visits = Math.floor((baseVisits + variance) * weekendMultiplier);
      
      const traffic: TrafficData = {
        id: randomUUID(),
        projectId,
        date: dateStr,
        visits,
      };
      this.trafficData.set(traffic.id, traffic);
    }
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const project: Project = { 
      ...insertProject, 
      id,
      createdAt: new Date()
    };
    this.projects.set(id, project);
    return project;
  }

  async getKeywordsByProject(projectId: string): Promise<Keyword[]> {
    return Array.from(this.keywords.values()).filter(k => k.projectId === projectId);
  }

  async createKeyword(insertKeyword: InsertKeyword): Promise<Keyword> {
    const id = randomUUID();
    const keyword: Keyword = { ...insertKeyword, id };
    this.keywords.set(id, keyword);
    return keyword;
  }

  async getKeywordRanking(projectId: string): Promise<KeywordRanking | undefined> {
    return this.keywordRankings.get(projectId);
  }

  async getTrafficDataByProject(projectId: string): Promise<TrafficData[]> {
    return Array.from(this.trafficData.values())
      .filter(t => t.projectId === projectId)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getBacklinksByProject(projectId: string): Promise<Backlink[]> {
    return Array.from(this.backlinks.values())
      .filter(b => b.projectId === projectId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  async getBacklinkGrowth(projectId: string): Promise<Array<{ date: string; backlinks: number }>> {
    const growth = [];
    let count = 1000 + Math.floor(Math.random() * 200);
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i * 5);
      count += Math.floor(Math.random() * 30) + 10;
      growth.push({
        date: date.toISOString().split('T')[0].substring(5),
        backlinks: count,
      });
    }
    return growth;
  }

  async getCompetitorsByProject(projectId: string): Promise<Competitor[]> {
    return Array.from(this.competitors.values()).filter(c => c.projectId === projectId);
  }

  async getSeoIssuesByProject(projectId: string): Promise<SeoIssue[]> {
    return Array.from(this.seoIssues.values())
      .filter(i => i.projectId === projectId)
      .sort((a, b) => {
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        return severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder];
      });
  }
}

export const storage = new MemStorage();
