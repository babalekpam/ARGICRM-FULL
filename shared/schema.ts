import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, real, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Tenants/Organizations table - Must be defined before users
export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User storage table - Required for Replit Auth
// Keep the default config for id column as per Replit Auth blueprint
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Projects table
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
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
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
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
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
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
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  visits: integer("visits").notNull().default(0),
});

// Backlinks
export const backlinks = pgTable("backlinks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  domainScore: integer("domain_score").notNull().default(0),
  anchorText: text("anchor_text"),
  date: text("date").notNull(),
});

// Competitors
export const competitors = pgTable("competitors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
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
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  severity: text("severity").notNull(), // critical, warning, info
  title: text("title").notNull(),
  description: text("description").notNull(),
  affectedPages: integer("affected_pages").notNull().default(1),
});

// Backlink Growth History
export const backlinkGrowth = pgTable("backlink_growth", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  backlinkCount: integer("backlink_count").notNull().default(0),
});

// Insert schemas - omit id, createdAt/updatedAt, and tenantId (provided by server)
export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true, tenantId: true });
export const insertKeywordSchema = createInsertSchema(keywords).omit({ id: true, tenantId: true });
export const insertKeywordRankingSchema = createInsertSchema(keywordRankings).omit({ id: true, tenantId: true });
export const insertTrafficDataSchema = createInsertSchema(trafficData).omit({ id: true, tenantId: true });
export const insertBacklinkSchema = createInsertSchema(backlinks).omit({ id: true, tenantId: true });
export const insertCompetitorSchema = createInsertSchema(competitors).omit({ id: true, tenantId: true });
export const insertSeoIssueSchema = createInsertSchema(seoIssues).omit({ id: true, tenantId: true });
export const insertBacklinkGrowthSchema = createInsertSchema(backlinkGrowth).omit({ id: true, tenantId: true });

// User types - Required for Replit Auth
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Tenant types
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Tenant = typeof tenants.$inferSelect;

// Project types
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
