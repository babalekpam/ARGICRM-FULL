import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Projects table
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  domain: text("domain").notNull(),
  seoScore: integer("seo_score").notNull().default(0),
  organicTraffic: integer("organic_traffic").notNull().default(0),
  totalBacklinks: integer("total_backlinks").notNull().default(0),
  referringDomains: integer("referring_domains").notNull().default(0),
  totalKeywords: integer("total_keywords").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Keywords table
export const keywords = pgTable("keywords", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  keyword: text("keyword").notNull(),
  searchVolume: integer("search_volume").notNull().default(0),
  difficulty: integer("difficulty").notNull().default(0),
  position: integer("position"),
  cpc: real("cpc").default(0),
  trend: text("trend").default('stable'), // up, down, stable
});

// Keyword ranking distribution
export const keywordRankings = pgTable("keyword_rankings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  top3: integer("top_3").notNull().default(0),
  top10: integer("top_10").notNull().default(0),
  top20: integer("top_20").notNull().default(0),
  top50: integer("top_50").notNull().default(0),
  over50: integer("over_50").notNull().default(0),
});

// Traffic analytics
export const trafficData = pgTable("traffic_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  visits: integer("visits").notNull().default(0),
});

// Backlinks
export const backlinks = pgTable("backlinks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  domainScore: integer("domain_score").notNull().default(0),
  anchorText: text("anchor_text"),
  date: text("date").notNull(),
});

// Competitors
export const competitors = pgTable("competitors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  domain: text("domain").notNull(),
  domainScore: integer("domain_score").notNull().default(0),
  topKeyword: text("top_keyword"),
  estimatedTraffic: integer("estimated_traffic").notNull().default(0),
  commonKeywords: integer("common_keywords").notNull().default(0),
});

// SEO Issues
export const seoIssues = pgTable("seo_issues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  severity: text("severity").notNull(), // critical, warning, info
  title: text("title").notNull(),
  description: text("description").notNull(),
  affectedPages: integer("affected_pages").notNull().default(1),
});

// Backlink Growth History
export const backlinkGrowth = pgTable("backlink_growth", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  backlinkCount: integer("backlink_count").notNull().default(0),
});

// Insert schemas
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true });
export const insertKeywordSchema = createInsertSchema(keywords).omit({ id: true });
export const insertKeywordRankingSchema = createInsertSchema(keywordRankings).omit({ id: true });
export const insertTrafficDataSchema = createInsertSchema(trafficData).omit({ id: true });
export const insertBacklinkSchema = createInsertSchema(backlinks).omit({ id: true });
export const insertCompetitorSchema = createInsertSchema(competitors).omit({ id: true });
export const insertSeoIssueSchema = createInsertSchema(seoIssues).omit({ id: true });
export const insertBacklinkGrowthSchema = createInsertSchema(backlinkGrowth).omit({ id: true });

// Types
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertKeyword = z.infer<typeof insertKeywordSchema>;
export type Keyword = typeof keywords.$inferSelect;

export type InsertKeywordRanking = z.infer<typeof insertKeywordRankingSchema>;
export type KeywordRanking = typeof keywordRankings.$inferSelect;

export type InsertTrafficData = z.infer<typeof insertTrafficDataSchema>;
export type TrafficData = typeof trafficData.$inferSelect;

export type InsertBacklink = z.infer<typeof insertBacklinkSchema>;
export type Backlink = typeof backlinks.$inferSelect;

export type InsertCompetitor = z.infer<typeof insertCompetitorSchema>;
export type Competitor = typeof competitors.$inferSelect;

export type InsertSeoIssue = z.infer<typeof insertSeoIssueSchema>;
export type SeoIssue = typeof seoIssues.$inferSelect;

export type InsertBacklinkGrowth = z.infer<typeof insertBacklinkGrowthSchema>;
export type BacklinkGrowth = typeof backlinkGrowth.$inferSelect;
