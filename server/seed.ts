import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { 
  projects, keywords, keywordRankings, trafficData, 
  backlinks, competitors, seoIssues, backlinkGrowth
} from "@shared/schema";
import ws from "ws";

neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function seed() {

  await db.delete(seoIssues);
  await db.delete(competitors);
  await db.delete(backlinkGrowth);
  await db.delete(backlinks);
  await db.delete(trafficData);
  await db.delete(keywords);
  await db.delete(keywordRankings);
  await db.delete(projects);

  const [project1] = await db.insert(projects).values({
    name: "Main Website",
    domain: "example.com",
    seoScore: 78,
    organicTraffic: 45230,
    totalBacklinks: 1247,
    referringDomains: 342,
    totalKeywords: 156,
  }).returning();

  const [project2] = await db.insert(projects).values({
    name: "Blog",
    domain: "blog.example.com",
    seoScore: 65,
    organicTraffic: 12500,
    totalBacklinks: 543,
    referringDomains: 178,
    totalKeywords: 89,
  }).returning();


  await db.insert(keywordRankings).values([
    { projectId: project1.id, top3: 12, top10: 34, top20: 48, top50: 42, over50: 20 },
    { projectId: project2.id, top3: 8, top10: 22, top20: 31, top50: 18, over50: 10 },
  ]);

  await db.insert(keywords).values([
    { projectId: project1.id, keyword: "seo tools", searchVolume: 12500, difficulty: 68, position: 3, cpc: 4.5, trend: "up" },
    { projectId: project1.id, keyword: "keyword research", searchVolume: 8900, difficulty: 54, position: 7, cpc: 3.2, trend: "up" },
    { projectId: project1.id, keyword: "backlink checker", searchVolume: 6700, difficulty: 62, position: 12, cpc: 5.1, trend: "stable" },
    { projectId: project1.id, keyword: "seo audit tool", searchVolume: 4200, difficulty: 48, position: 5, cpc: 2.8, trend: "up" },
    { projectId: project1.id, keyword: "competitor analysis", searchVolume: 3800, difficulty: 56, position: 15, cpc: 3.9, trend: "down" },
    { projectId: project1.id, keyword: "traffic analyzer", searchVolume: 2100, difficulty: 42, position: 9, cpc: 2.3, trend: "stable" },
    { projectId: project1.id, keyword: "domain authority", searchVolume: 5600, difficulty: 71, position: 18, cpc: 4.7, trend: "up" },
    { projectId: project1.id, keyword: "rank tracker", searchVolume: 3200, difficulty: 52, position: 6, cpc: 3.4, trend: "up" },
    { projectId: project2.id, keyword: "content marketing", searchVolume: 18000, difficulty: 72, position: 4, cpc: 5.2, trend: "up" },
    { projectId: project2.id, keyword: "blog writing tips", searchVolume: 3400, difficulty: 38, position: 11, cpc: 1.8, trend: "stable" },
    { projectId: project2.id, keyword: "seo blogging", searchVolume: 2800, difficulty: 45, position: 8, cpc: 2.1, trend: "up" },
  ]);

  const trafficRecords = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const variance = Math.floor(Math.random() * 360);
    const weekendMultiplier = date.getDay() === 0 || date.getDay() === 6 ? 0.7 : 1;
    trafficRecords.push({
      projectId: project1.id,
      date: dateStr,
      visits: Math.floor((1200 + variance) * weekendMultiplier),
    });
    trafficRecords.push({
      projectId: project2.id,
      date: dateStr,
      visits: Math.floor((400 + Math.floor(Math.random() * 120)) * weekendMultiplier),
    });
  }
  await db.insert(trafficData).values(trafficRecords);

  await db.insert(backlinks).values([
    { projectId: project1.id, url: "https://techblog.com/seo-tools-review", domainScore: 82, anchorText: "best SEO tools", date: "2025-01-15" },
    { projectId: project1.id, url: "https://marketingpro.io/resources", domainScore: 75, anchorText: "keyword research tool", date: "2025-01-10" },
    { projectId: project1.id, url: "https://digitalguide.net/tools", domainScore: 68, anchorText: "SEO analytics", date: "2025-01-05" },
    { projectId: project1.id, url: "https://seoblog.com/top-tools-2025", domainScore: 91, anchorText: "comprehensive SEO platform", date: "2024-12-28" },
    { projectId: project1.id, url: "https://webmaster-hub.org/links", domainScore: 62, anchorText: null, date: "2024-12-20" },
    { projectId: project1.id, url: "https://growthmarketing.io/tools", domainScore: 78, anchorText: "traffic analyzer", date: "2024-12-15" },
    { projectId: project2.id, url: "https://contentmarketing.com/best-blogs", domainScore: 84, anchorText: "top marketing blog", date: "2025-01-12" },
    { projectId: project2.id, url: "https://writinghub.net/resources", domainScore: 71, anchorText: "blogging tips", date: "2024-12-30" },
  ]);

  await db.insert(competitors).values([
    { projectId: project1.id, domain: "semrush.com", domainScore: 92, topKeyword: "seo audit", estimatedTraffic: 2500000, commonKeywords: 87 },
    { projectId: project1.id, domain: "ahrefs.com", domainScore: 94, topKeyword: "backlink checker", estimatedTraffic: 3200000, commonKeywords: 93 },
    { projectId: project1.id, domain: "moz.com", domainScore: 88, topKeyword: "domain authority", estimatedTraffic: 1800000, commonKeywords: 76 },
    { projectId: project2.id, domain: "hubspot.com", domainScore: 95, topKeyword: "content marketing", estimatedTraffic: 5000000, commonKeywords: 45 },
    { projectId: project2.id, domain: "copyblogger.com", domainScore: 82, topKeyword: "copywriting", estimatedTraffic: 800000, commonKeywords: 28 },
  ]);

  await db.insert(seoIssues).values([
    { projectId: project1.id, severity: "critical", title: "Missing Meta Descriptions", description: "Several pages are missing meta descriptions which can impact click-through rates from search results.", affectedPages: 12 },
    { projectId: project1.id, severity: "critical", title: "Broken Internal Links", description: "Found broken internal links that create poor user experience and hurt SEO.", affectedPages: 8 },
    { projectId: project1.id, severity: "warning", title: "Large Image Sizes", description: "Multiple images are larger than recommended, slowing down page load times.", affectedPages: 23 },
    { projectId: project1.id, severity: "warning", title: "H1 Tag Issues", description: "Some pages have multiple H1 tags or missing H1 tags.", affectedPages: 6 },
    { projectId: project1.id, severity: "info", title: "Alt Text Missing", description: "Some images don't have descriptive alt text for accessibility and SEO.", affectedPages: 15 },
    { projectId: project1.id, severity: "warning", title: "Slow Page Speed", description: "Page load time exceeds recommended thresholds on mobile devices.", affectedPages: 18 },
    { projectId: project1.id, severity: "info", title: "Schema Markup Opportunities", description: "Pages could benefit from structured data markup for rich snippets.", affectedPages: 34 },
    { projectId: project2.id, severity: "warning", title: "Mobile Responsiveness Issues", description: "Some blog posts don't render properly on mobile devices.", affectedPages: 5 },
    { projectId: project2.id, severity: "info", title: "Missing Open Graph Tags", description: "Blog posts lack Open Graph tags for better social media sharing.", affectedPages: 18 },
  ]);

  const backlinkGrowthRecords = [];
  let count1 = 1000;
  let count2 = 400;
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i * 5);
    count1 += Math.floor(Math.random() * 30) + 10;
    count2 += Math.floor(Math.random() * 15) + 5;
    backlinkGrowthRecords.push({
      projectId: project1.id,
      date: date.toISOString().split('T')[0],
      backlinkCount: count1,
    });
    backlinkGrowthRecords.push({
      projectId: project2.id,
      date: date.toISOString().split('T')[0],
      backlinkCount: count2,
    });
  }
  await db.insert(backlinkGrowth).values(backlinkGrowthRecords);

  await pool.end();
}

seed().catch(console.error);
