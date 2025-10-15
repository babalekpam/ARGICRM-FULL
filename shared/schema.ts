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
  plan: varchar("plan").notNull().default('free'), // free, individual, business, enterprise
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status").default('inactive'), // active, inactive, canceled, past_due
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

// Backlink Opportunities - Potential websites to get backlinks from
export const backlinkOpportunities = pgTable("backlink_opportunities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  domain: text("domain").notNull(),
  url: text("url").notNull(),
  domainAuthority: integer("domain_authority").notNull().default(0),
  pageAuthority: integer("page_authority").notNull().default(0),
  relevanceScore: integer("relevance_score").notNull().default(0), // 0-100
  contactEmail: text("contact_email"),
  status: text("status").notNull().default('discovered'), // discovered, contacted, rejected, acquired
  notes: text("notes"),
  discoveredDate: text("discovered_date").notNull(),
  acquiredDate: text("acquired_date"),
});

// Outreach Campaigns - Email outreach campaigns for link building
export const outreachCampaigns = pgTable("outreach_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  emailTemplate: text("email_template").notNull(),
  status: text("status").notNull().default('draft'), // draft, active, paused, completed
  totalSent: integer("total_sent").notNull().default(0),
  totalReplies: integer("total_replies").notNull().default(0),
  successfulLinks: integer("successful_links").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Outreach Contacts - Individual contacts in outreach campaigns
export const outreachContacts = pgTable("outreach_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  campaignId: varchar("campaign_id").notNull().references(() => outreachCampaigns.id, { onDelete: "cascade" }),
  opportunityId: varchar("opportunity_id").references(() => backlinkOpportunities.id, { onDelete: "set null" }),
  email: text("email").notNull(),
  status: text("status").notNull().default('pending'), // pending, sent, replied, accepted, rejected
  sentDate: text("sent_date"),
  repliedDate: text("replied_date"),
  notes: text("notes"),
});

// Backlink Gap Analysis - Competitor backlink gaps
export const backlinkGaps = pgTable("backlink_gaps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  competitorDomain: text("competitor_domain").notNull(),
  backlinkUrl: text("backlink_url").notNull(),
  linkingDomain: text("linking_domain").notNull(),
  domainAuthority: integer("domain_authority").notNull().default(0),
  anchorText: text("anchor_text"),
  priority: text("priority").notNull().default('medium'), // high, medium, low
  status: text("status").notNull().default('open'), // open, in_progress, acquired, dismissed
});

// Keyword Rank History - Daily ranking snapshots for keywords
export const keywordRankHistory = pgTable("keyword_rank_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  keywordId: varchar("keyword_id").notNull().references(() => keywords.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  position: integer("position").notNull(),
  searchVolume: integer("search_volume").notNull().default(0),
  url: text("url"), // URL that ranked for this keyword
  change: integer("change").default(0), // Change from previous day
});

// Competitor Rank Snapshots - Track competitor rankings for comparison
export const competitorRankSnapshots = pgTable("competitor_rank_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  competitorId: varchar("competitor_id").notNull().references(() => competitors.id, { onDelete: "cascade" }),
  keywordId: varchar("keyword_id").notNull().references(() => keywords.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  position: integer("position").notNull(),
  url: text("url"), // Competitor URL that ranked
});

// Content Briefs - AI-generated content outlines
export const contentBriefs = pgTable("content_briefs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  targetKeyword: text("target_keyword").notNull(),
  title: text("title").notNull(),
  outline: jsonb("outline").notNull(), // Array of sections with headings and subheadings
  wordCountTarget: integer("word_count_target").notNull().default(1500),
  contentType: text("content_type").notNull().default('blog_post'), // blog_post, landing_page, product_page
  seoTips: jsonb("seo_tips"), // AI-generated SEO recommendations
  createdAt: timestamp("created_at").defaultNow(),
});

// Content Scorecards - SEO content analysis results
export const contentScorecards = pgTable("content_scorecards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  targetKeyword: text("target_keyword").notNull(),
  seoScore: integer("seo_score").notNull().default(0), // 0-100
  readabilityScore: integer("readability_score").notNull().default(0), // 0-100
  keywordDensity: real("keyword_density").notNull().default(0), // Percentage
  wordCount: integer("word_count").notNull().default(0),
  headingsCount: integer("headings_count").notNull().default(0),
  imageCount: integer("image_count").notNull().default(0),
  linksCount: integer("links_count").notNull().default(0),
  suggestions: jsonb("suggestions"), // Array of improvement suggestions
  analyzedAt: timestamp("analyzed_at").defaultNow(),
});

// SERP Snapshots - Search result page analysis
export const serpSnapshots = pgTable("serp_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  keyword: text("keyword").notNull(),
  location: text("location").default('United States'), // Geographic location for search
  serpResults: jsonb("serp_results").notNull(), // Array of {position, url, title, snippet, domain}
  featuredSnippet: jsonb("featured_snippet"), // If present: {type, content, url}
  peopleAlsoAsk: jsonb("people_also_ask"), // Array of related questions
  relatedSearches: jsonb("related_searches"), // Array of related search terms
  capturedAt: timestamp("captured_at").defaultNow(),
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
export const insertBacklinkOpportunitySchema = createInsertSchema(backlinkOpportunities).omit({ id: true, tenantId: true });
export const insertOutreachCampaignSchema = createInsertSchema(outreachCampaigns).omit({ id: true, createdAt: true, tenantId: true });
export const insertOutreachContactSchema = createInsertSchema(outreachContacts).omit({ id: true, tenantId: true });
export const insertBacklinkGapSchema = createInsertSchema(backlinkGaps).omit({ id: true, tenantId: true });
export const insertKeywordRankHistorySchema = createInsertSchema(keywordRankHistory).omit({ id: true, tenantId: true });
export const insertCompetitorRankSnapshotSchema = createInsertSchema(competitorRankSnapshots).omit({ id: true, tenantId: true });
export const insertContentBriefSchema = createInsertSchema(contentBriefs).omit({ id: true, createdAt: true, tenantId: true });
export const insertContentScorecardSchema = createInsertSchema(contentScorecards).omit({ id: true, analyzedAt: true, tenantId: true });
export const insertSerpSnapshotSchema = createInsertSchema(serpSnapshots).omit({ id: true, capturedAt: true, tenantId: true });

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

export type InsertBacklinkOpportunity = z.infer<typeof insertBacklinkOpportunitySchema>;
export type BacklinkOpportunity = typeof backlinkOpportunities.$inferSelect;

export type InsertOutreachCampaign = z.infer<typeof insertOutreachCampaignSchema>;
export type OutreachCampaign = typeof outreachCampaigns.$inferSelect;

export type InsertOutreachContact = z.infer<typeof insertOutreachContactSchema>;
export type OutreachContact = typeof outreachContacts.$inferSelect;

export type InsertBacklinkGap = z.infer<typeof insertBacklinkGapSchema>;
export type BacklinkGap = typeof backlinkGaps.$inferSelect;

export type InsertKeywordRankHistory = z.infer<typeof insertKeywordRankHistorySchema>;
export type KeywordRankHistory = typeof keywordRankHistory.$inferSelect;

export type InsertCompetitorRankSnapshot = z.infer<typeof insertCompetitorRankSnapshotSchema>;
export type CompetitorRankSnapshot = typeof competitorRankSnapshots.$inferSelect;

export type InsertContentBrief = z.infer<typeof insertContentBriefSchema>;
export type ContentBrief = typeof contentBriefs.$inferSelect;

export type InsertContentScorecard = z.infer<typeof insertContentScorecardSchema>;
export type ContentScorecard = typeof contentScorecards.$inferSelect;

export type InsertSerpSnapshot = z.infer<typeof insertSerpSnapshotSchema>;
export type SerpSnapshot = typeof serpSnapshots.$inferSelect;
