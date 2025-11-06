import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, real, jsonb, index, boolean } from "drizzle-orm/pg-core";
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
  isAdmin: boolean("is_admin").notNull().default(false),
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
  source: text("source").notNull().default('ai'), // 'ai' or 'api' - tracks data provenance
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
  severity: text("severity").notNull(), // critical, high, medium, low
  category: text("category").notNull(), // on-page, technical, content
  title: text("title").notNull(),
  description: text("description").notNull(),
  affectedUrl: text("affected_url"),
  affectedPages: integer("affected_pages").notNull().default(1),
  recommendation: text("recommendation").notNull(),
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

// Technical SEO Audit Scans - Track audit runs
export const auditScans = pgTable("audit_scans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  status: text("status").notNull().default('pending'), // pending, running, completed, failed
  performanceScore: integer("performance_score"), // 0-100
  seoScore: integer("seo_score"), // 0-100
  accessibilityScore: integer("accessibility_score"), // 0-100
  bestPracticesScore: integer("best_practices_score"), // 0-100
  pagesScanned: integer("pages_scanned").default(0),
  issuesFound: integer("issues_found").default(0),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Page Metrics - Detailed metrics per page
export const pageMetrics = pgTable("page_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  auditScanId: varchar("audit_scan_id").notNull().references(() => auditScans.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  performanceScore: integer("performance_score"), // 0-100
  loadTime: real("load_time"), // Seconds
  pageSize: integer("page_size"), // Bytes
  requestCount: integer("request_count"),
  mobileUsable: text("mobile_usable").default('yes'), // yes, no, warning
  hasHttps: text("has_https").default('yes'), // yes, no
  metaTitleLength: integer("meta_title_length"),
  metaDescriptionLength: integer("meta_description_length"),
  h1Count: integer("h1_count"),
  imageCount: integer("image_count"),
  imagesWithoutAlt: integer("images_without_alt"),
  brokenLinks: integer("broken_links"),
  analyzedAt: timestamp("analyzed_at").defaultNow(),
});

// Core Web Vitals - Performance metrics
export const coreWebVitals = pgTable("core_web_vitals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  pageMetricId: varchar("page_metric_id").notNull().references(() => pageMetrics.id, { onDelete: "cascade" }),
  lcp: real("lcp"), // Largest Contentful Paint (seconds)
  fid: real("fid"), // First Input Delay (milliseconds)
  cls: real("cls"), // Cumulative Layout Shift (score)
  fcp: real("fcp"), // First Contentful Paint (seconds)
  ttfb: real("ttfb"), // Time to First Byte (milliseconds)
  tbt: real("tbt"), // Total Blocking Time (milliseconds)
  speedIndex: real("speed_index"), // Speed Index (seconds)
  lcpRating: text("lcp_rating").default('needs-improvement'), // good, needs-improvement, poor
  fidRating: text("fid_rating").default('needs-improvement'),
  clsRating: text("cls_rating").default('needs-improvement'),
  measuredAt: timestamp("measured_at").defaultNow(),
});

// Automated Reporting - Report Configurations
export const reportConfigs = pgTable("report_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  reportType: text("report_type").notNull().default('full'), // full, keywords, traffic, technical, backlinks
  frequency: text("frequency").notNull().default('weekly'), // daily, weekly, monthly, manual
  format: text("format").notNull().default('json'), // json, csv, pdf
  recipients: text("recipients").array(), // Email addresses for delivery
  includeKeywords: integer("include_keywords").notNull().default(1), // Boolean as int
  includeTraffic: integer("include_traffic").notNull().default(1),
  includeBacklinks: integer("include_backlinks").notNull().default(1),
  includeTechnicalAudit: integer("include_technical_audit").notNull().default(1),
  includeCompetitors: integer("include_competitors").notNull().default(1),
  isActive: integer("is_active").notNull().default(1), // Boolean as int
  createdAt: timestamp("created_at").defaultNow(),
});

// Generated Reports - Stored report outputs
export const generatedReports = pgTable("generated_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  configId: varchar("config_id").notNull().references(() => reportConfigs.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  reportData: jsonb("report_data").notNull(), // Complete report content
  format: text("format").notNull(), // json, csv, pdf
  generatedAt: timestamp("generated_at").defaultNow(),
});

// API Keys - Developer API access management
export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // User-friendly name for the key
  key: varchar("key").notNull().unique(), // The actual API key (hashed)
  permissions: text("permissions").array().notNull().default(sql`ARRAY['read']::text[]`), // read, write, delete
  rateLimit: integer("rate_limit").notNull().default(1000), // Requests per hour
  isActive: integer("is_active").notNull().default(1), // Boolean as int
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"), // Optional expiration
  createdAt: timestamp("created_at").defaultNow(),
});

// API Usage - Track API consumption and rate limiting
export const apiUsage = pgTable("api_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  apiKeyId: varchar("api_key_id").notNull().references(() => apiKeys.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(), // API endpoint called
  method: text("method").notNull(), // GET, POST, PUT, DELETE
  statusCode: integer("status_code").notNull(), // HTTP status code
  responseTime: integer("response_time"), // Milliseconds
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  requestedAt: timestamp("requested_at").defaultNow(),
});

// Local SEO - Location-based ranking data
export const localRankings = pgTable("local_rankings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  keyword: text("keyword").notNull(),
  location: text("location").notNull(), // City, State or coordinates
  position: integer("position"),
  localPackRank: integer("local_pack_rank"), // Position in local 3-pack (1-3) or null
  mapRank: integer("map_rank"), // Position in Google Maps results
  searchVolume: integer("search_volume"),
  url: text("url"),
  checkedAt: timestamp("checked_at").defaultNow(),
});

// Google Business Profile - GBP metrics and data
export const googleBusinessProfiles = pgTable("google_business_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  businessName: text("business_name").notNull(),
  rating: real("rating"), // Average rating (e.g., 4.5)
  reviewCount: integer("review_count"),
  photoCount: integer("photo_count"),
  postCount: integer("post_count"),
  views: integer("views"), // Profile views
  searches: integer("searches"), // Discovery searches
  calls: integer("calls"), // Call clicks
  directions: integer("directions"), // Direction requests
  websiteClicks: integer("website_clicks"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Local Citations - Business directory listings
export const localCitations = pgTable("local_citations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  source: text("source").notNull(), // Directory name (Yelp, Yellow Pages, etc.)
  url: text("url").notNull(),
  status: text("status").notNull().default('active'), // active, pending, removed
  nap: text("nap"), // Name, Address, Phone consistency check
  isConsistent: integer("is_consistent").notNull().default(1), // NAP consistency boolean
  lastChecked: timestamp("last_checked").defaultNow(),
});

// Social Media Accounts - Connected social profiles
export const socialAccounts = pgTable("social_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(), // twitter, facebook, instagram, linkedin, tiktok
  username: text("username").notNull(),
  profileUrl: text("profile_url").notNull(),
  followers: integer("followers"),
  following: integer("following"),
  isVerified: integer("is_verified").notNull().default(0),
  connectedAt: timestamp("connected_at").defaultNow(),
});

// Social Posts - Track social media posts
export const socialPosts = pgTable("social_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  accountId: varchar("account_id").notNull().references(() => socialAccounts.id, { onDelete: "cascade" }),
  postId: text("post_id").notNull(), // Platform's post ID
  content: text("content"),
  url: text("url").notNull(),
  likes: integer("likes").notNull().default(0),
  comments: integer("comments").notNull().default(0),
  shares: integer("shares").notNull().default(0),
  reach: integer("reach"), // Impressions/reach
  engagement: real("engagement"), // Engagement rate
  postedAt: timestamp("posted_at").notNull(),
  lastSyncedAt: timestamp("last_synced_at").defaultNow(),
});

// Social Metrics - Aggregated social metrics over time
export const socialMetrics = pgTable("social_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  accountId: varchar("account_id").notNull().references(() => socialAccounts.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  followers: integer("followers"),
  totalPosts: integer("total_posts"),
  totalLikes: integer("total_likes"),
  totalComments: integer("total_comments"),
  totalShares: integer("total_shares"),
  avgEngagement: real("avg_engagement"),
  brandMentions: integer("brand_mentions"), // Mentions of brand
  recordedAt: timestamp("recorded_at").defaultNow(),
});

// ========== MULTI-PLATFORM SEARCH OPTIMIZATION (NP Digital "Search Everywhere") ==========

// AI Search Platforms - Track configured AI platforms
export const aiSearchPlatforms = pgTable("ai_search_platforms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(), // chatgpt, perplexity, gemini, copilot, google_ai_overviews, claude
  isActive: integer("is_active").notNull().default(1), // Boolean as int
  trackingEnabled: integer("tracking_enabled").notNull().default(1),
  lastChecked: timestamp("last_checked"),
  apiKey: text("api_key"), // Optional API key for platform-specific tracking
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Brand Mentions - Track brand visibility in AI responses
export const aiBrandMentions = pgTable("ai_brand_mentions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  platformId: varchar("platform_id").notNull().references(() => aiSearchPlatforms.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(), // chatgpt, perplexity, gemini, copilot, google_ai_overviews
  query: text("query").notNull(), // User query that triggered mention
  brandName: text("brand_name").notNull(),
  mentionType: text("mention_type").notNull().default('direct'), // direct, indirect, competitive, citation
  position: integer("position"), // Position in AI response (1 = first mention)
  context: text("context"), // Surrounding text context
  fullResponse: text("full_response"), // Complete AI response
  citationUrl: text("citation_url"), // URL cited if applicable
  domainAuthority: integer("domain_authority"), // DA of cited source
  sentiment: text("sentiment").default('neutral'), // positive, negative, neutral
  sentimentScore: real("sentiment_score"), // -1.0 to 1.0
  visibility: text("visibility").default('low'), // high, medium, low (based on position/prominence)
  competitorMentioned: text("competitor_mentioned"), // Competitor name if mentioned
  queryIntent: text("query_intent"), // informational, transactional, navigational, commercial
  queryCategory: text("query_category"), // Product research, comparison, how-to, etc.
  checkedAt: timestamp("checked_at").defaultNow(),
});

// AI Citation Tracking - Monitor domain citations in LLM responses
export const aiCitations = pgTable("ai_citations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  platformId: varchar("platform_id").notNull().references(() => aiSearchPlatforms.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),
  domain: text("domain").notNull(), // Cited domain
  url: text("url").notNull(), // Specific URL cited
  pageTitle: text("page_title"),
  query: text("query").notNull(), // Query that triggered citation
  citationPosition: integer("citation_position"), // Position in citation list
  citationType: text("citation_type").default('source'), // source, reference, supporting_link
  domainAuthority: integer("domain_authority"),
  pageAuthority: integer("page_authority"),
  totalCitations: integer("total_citations").notNull().default(1), // Count of citations
  isCompetitor: integer("is_competitor").notNull().default(0), // Boolean
  competitorName: text("competitor_name"),
  checkedAt: timestamp("checked_at").defaultNow(),
});

// AI Sentiment Analysis - Track how AI platforms describe brands
export const aiSentimentAnalysis = pgTable("ai_sentiment_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  platformId: varchar("platform_id").notNull().references(() => aiSearchPlatforms.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),
  query: text("query").notNull(),
  brandName: text("brand_name").notNull(),
  sentiment: text("sentiment").notNull(), // positive, negative, neutral, mixed
  sentimentScore: real("sentiment_score").notNull(), // -1.0 to 1.0
  positiveAspects: text("positive_aspects").array(), // Array of positive mentions
  negativeAspects: text("negative_aspects").array(), // Array of negative mentions
  neutralAspects: text("neutral_aspects").array(),
  emotions: text("emotions").array(), // trust, anticipation, joy, fear, etc.
  emotionScores: jsonb("emotion_scores"), // {trust: 0.8, joy: 0.5, etc.}
  keyPhrases: text("key_phrases").array(), // Important phrases used
  comparisonMade: integer("comparison_made").notNull().default(0), // Boolean - was brand compared to others
  comparedTo: text("compared_to").array(), // Competitor names mentioned in comparison
  overallTone: text("overall_tone").default('factual'), // factual, promotional, critical, enthusiastic
  aiGeneratedSummary: text("ai_generated_summary"), // AI summary of sentiment
  analyzedAt: timestamp("analyzed_at").defaultNow(),
});

// Prompt Mining Database - Consumer search prompts library
export const promptLibrary = pgTable("prompt_library", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // industry, product_type, use_case
  industry: text("industry"), // Technology, Healthcare, Finance, etc.
  prompt: text("prompt").notNull(),
  promptType: text("prompt_type").notNull(), // question, comparison, how-to, what-is, best-for
  searchIntent: text("search_intent").notNull(), // informational, commercial, transactional, navigational
  searchVolume: integer("search_volume"), // Estimated monthly searches
  difficulty: integer("difficulty"), // 0-100 ranking difficulty
  platforms: text("platforms").array(), // Platforms where prompt performs well
  avgResponseLength: integer("avg_response_length"), // Average AI response length
  topBrands: text("top_brands").array(), // Brands mentioned in responses
  topDomains: text("top_domains").array(), // Domains cited in responses
  seasonality: text("seasonality"), // Year-round, seasonal, trending
  trendDirection: text("trend_direction").default('stable'), // rising, falling, stable
  relatedPrompts: text("related_prompts").array(), // Similar prompts
  userJourneyStage: text("user_journey_stage"), // awareness, consideration, decision, retention
  conversionPotential: text("conversion_potential").default('medium'), // high, medium, low
  contentRecommendations: jsonb("content_recommendations"), // Suggested content types
  lastUpdated: timestamp("last_updated").defaultNow(),
  isActive: integer("is_active").notNull().default(1),
});

// Social Search Optimization - TikTok, Instagram, YouTube search tracking
export const socialSearchMetrics = pgTable("social_search_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  accountId: varchar("account_id").references(() => socialAccounts.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(), // tiktok, instagram, youtube, pinterest
  searchTerm: text("search_term").notNull(),
  contentId: text("content_id"), // Platform-specific content ID
  contentUrl: text("content_url").notNull(),
  contentType: text("content_type"), // video, image, reel, short, story, pin
  rankingPosition: integer("ranking_position"), // Position in search results
  searchVolume: integer("search_volume"), // Platform-specific search volume
  views: integer("views").notNull().default(0),
  likes: integer("likes").notNull().default(0),
  comments: integer("comments").notNull().default(0),
  shares: integer("shares").notNull().default(0),
  saves: integer("saves").notNull().default(0),
  engagementRate: real("engagement_rate"), // Overall engagement percentage
  clickThroughRate: real("click_through_rate"), // CTR to profile/website
  conversionRate: real("conversion_rate"), // Actions taken after viewing
  avgWatchTime: integer("avg_watch_time"), // Seconds (for video)
  completionRate: real("completion_rate"), // % who watched entire video
  hashtags: text("hashtags").array(), // Hashtags used
  visualMetadata: jsonb("visual_metadata"), // Alt text, captions, tags
  audioTrack: text("audio_track"), // Audio/music used (TikTok/Reels)
  trending: integer("trending").notNull().default(0), // Boolean - is content trending
  viralScore: integer("viral_score"), // 0-100 viral potential score
  competitorContent: jsonb("competitor_content"), // Similar competitor content
  checkedAt: timestamp("checked_at").defaultNow(),
});

// Multi-Platform Performance Dashboard - Unified tracking
export const multiPlatformPerformance = pgTable("multi_platform_performance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD
  // Traditional SEO
  googlePosition: integer("google_position"),
  googleTraffic: integer("google_traffic"),
  googleImpressions: integer("google_impressions"),
  googleCtr: real("google_ctr"),
  bingPosition: integer("bing_position"),
  bingTraffic: integer("bing_traffic"),
  // AI Search
  chatgptMentions: integer("chatgpt_mentions").notNull().default(0),
  perplexityMentions: integer("perplexity_mentions").notNull().default(0),
  geminiMentions: integer("gemini_mentions").notNull().default(0),
  copilotMentions: integer("copilot_mentions").notNull().default(0),
  googleAiMentions: integer("google_ai_mentions").notNull().default(0),
  totalAiMentions: integer("total_ai_mentions").notNull().default(0),
  avgAiPosition: real("avg_ai_position"), // Average position across AI platforms
  aiCitations: integer("ai_citations").notNull().default(0),
  aiSentimentScore: real("ai_sentiment_score"), // Average sentiment -1.0 to 1.0
  // Social Search
  tiktokSearchViews: integer("tiktok_search_views").notNull().default(0),
  instagramSearchReach: integer("instagram_search_reach").notNull().default(0),
  youtubeSearchViews: integer("youtube_search_views").notNull().default(0),
  pinterestSearchImpressions: integer("pinterest_search_impressions").notNull().default(0),
  totalSocialSearchEngagement: integer("total_social_search_engagement").notNull().default(0),
  // Unified Metrics
  totalVisibility: integer("total_visibility").notNull().default(0), // Combined visibility score
  totalTraffic: integer("total_traffic").notNull().default(0), // All sources combined
  totalEngagement: integer("total_engagement").notNull().default(0),
  overallSentiment: text("overall_sentiment").default('neutral'),
  platformDiversity: real("platform_diversity"), // Distribution across platforms 0-1
  recordedAt: timestamp("recorded_at").defaultNow(),
});

// Competitive AI Benchmarking - Compare brand against competitors
export const competitiveAiBenchmark = pgTable("competitive_ai_benchmark", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  competitorId: varchar("competitor_id").references(() => competitors.id, { onDelete: "cascade" }),
  competitorDomain: text("competitor_domain").notNull(),
  competitorName: text("competitor_name").notNull(),
  platform: text("platform").notNull(), // chatgpt, perplexity, gemini, copilot, google_ai, all
  // AI Visibility Metrics
  totalMentions: integer("total_mentions").notNull().default(0),
  avgPosition: real("avg_position"), // Average position in AI responses
  citationCount: integer("citation_count").notNull().default(0),
  sentimentScore: real("sentiment_score"), // -1.0 to 1.0
  visibilityShare: real("visibility_share"), // % of total market mentions
  // Competitive Positioning
  winRate: real("win_rate"), // % queries where they rank higher than us
  lossRate: real("loss_rate"), // % queries where we rank higher
  tieRate: real("tie_rate"), // % queries with equal positioning
  avgPositionDifference: real("avg_position_difference"), // Their avg pos - our avg pos
  // Social Search Metrics
  socialSearchVolume: integer("social_search_volume").notNull().default(0),
  socialEngagementRate: real("social_engagement_rate"),
  socialViralScore: integer("social_viral_score"),
  // Content Strategy Insights
  topPerformingTopics: text("top_performing_topics").array(),
  contentGaps: text("content_gaps").array(), // Topics they cover that we don't
  contentStrengths: text("content_strengths").array(), // Our advantages
  recommendedActions: jsonb("recommended_actions"), // AI-generated recommendations
  lastAnalyzed: timestamp("last_analyzed").defaultNow(),
});

// Audience Targeting Platform (ATP) - Transform search intent into content
export const audienceInsights = pgTable("audience_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  audienceSegment: text("audience_segment").notNull(), // SMB owners, Enterprise CIOs, etc.
  searchIntent: text("search_intent").notNull(), // What they're searching for
  intentCategory: text("intent_category").notNull(), // informational, commercial, transactional
  painPoints: text("pain_points").array(), // Problems they're trying to solve
  questions: text("questions").array(), // Questions they're asking
  comparisons: text("comparisons").array(), // Comparisons they're making
  language: text("language").array(), // Language patterns they use
  platforms: text("platforms").array(), // Where they search
  preferredContentTypes: text("preferred_content_types").array(), // video, article, infographic
  journeyStage: text("journey_stage"), // awareness, consideration, decision
  // Content Brief Generation
  suggestedTopics: text("suggested_topics").array(),
  suggestedKeywords: text("suggested_keywords").array(),
  suggestedHeadings: text("suggested_headings").array(),
  toneRecommendation: text("tone_recommendation"), // professional, casual, technical
  lengthRecommendation: integer("length_recommendation"), // Suggested word count
  multiMediaRecommendations: jsonb("multi_media_recommendations"), // Images, videos, infographics
  competitorContentAnalysis: jsonb("competitor_content_analysis"),
  contentBrief: text("content_brief"), // AI-generated complete brief
  estimatedImpact: text("estimated_impact").default('medium'), // high, medium, low
  priority: integer("priority").notNull().default(50), // 0-100 priority score
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// EEAT Optimization - Track Experience, Expertise, Authoritativeness, Trustworthiness signals
export const eeatSignals = pgTable("eeat_signals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  pageTitle: text("page_title"),
  // Experience Signals
  hasAuthorBio: integer("has_author_bio").notNull().default(0),
  authorCredentials: text("author_credentials"),
  authorExperience: text("author_experience"),
  firstHandExperience: integer("first_hand_experience").notNull().default(0),
  caseStudies: integer("case_studies").notNull().default(0),
  customerTestimonials: integer("customer_testimonials").notNull().default(0),
  // Expertise Signals
  industryExpertise: text("industry_expertise"),
  certifications: text("certifications").array(),
  publications: text("publications").array(),
  speakingEngagements: text("speaking_engagements").array(),
  awardsMentions: text("awards_mentions").array(),
  // Authoritativeness Signals
  backlinkCount: integer("backlink_count").notNull().default(0),
  domainAuthority: integer("domain_authority"),
  brandMentions: integer("brand_mentions").notNull().default(0),
  mediaCoverage: text("media_coverage").array(),
  industryRecognition: text("industry_recognition").array(),
  // Trustworthiness Signals
  hasPrivacyPolicy: integer("has_privacy_policy").notNull().default(0),
  hasTermsOfService: integer("has_terms_of_service").notNull().default(0),
  hasContactInfo: integer("has_contact_info").notNull().default(0),
  hasSecureConnection: integer("has_secure_connection").notNull().default(1),
  hasTransparency: integer("has_transparency").notNull().default(0), // About us, team page
  reviewRating: real("review_rating"), // Average customer rating
  reviewCount: integer("review_count"),
  contentFreshness: timestamp("content_freshness"), // Last updated date
  // Schema Markup
  hasSchemaMarkup: integer("has_schema_markup").notNull().default(0),
  schemaTypes: text("schema_types").array(), // Article, Person, Organization, etc.
  structuredDataScore: integer("structured_data_score"), // 0-100
  // Overall Scores
  experienceScore: integer("experience_score").notNull().default(0), // 0-100
  expertiseScore: integer("expertise_score").notNull().default(0),
  authoritativenessScore: integer("authoritativeness_score").notNull().default(0),
  trustworthinessScore: integer("trustworthiness_score").notNull().default(0),
  overallEeatScore: integer("overall_eeat_score").notNull().default(0), // 0-100
  improvementSuggestions: jsonb("improvement_suggestions"),
  analyzedAt: timestamp("analyzed_at").defaultNow(),
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
export const insertAuditScanSchema = createInsertSchema(auditScans).omit({ id: true, startedAt: true, tenantId: true });
export const insertPageMetricSchema = createInsertSchema(pageMetrics).omit({ id: true, analyzedAt: true, tenantId: true });
export const insertCoreWebVitalSchema = createInsertSchema(coreWebVitals).omit({ id: true, measuredAt: true, tenantId: true });
export const insertReportConfigSchema = createInsertSchema(reportConfigs).omit({ id: true, createdAt: true, tenantId: true });
export const insertGeneratedReportSchema = createInsertSchema(generatedReports).omit({ id: true, generatedAt: true, tenantId: true });
export const insertApiKeySchema = createInsertSchema(apiKeys).omit({ id: true, createdAt: true, tenantId: true });
export const insertApiUsageSchema = createInsertSchema(apiUsage).omit({ id: true, requestedAt: true, tenantId: true });
export const insertLocalRankingSchema = createInsertSchema(localRankings).omit({ id: true, checkedAt: true, tenantId: true });
export const insertGoogleBusinessProfileSchema = createInsertSchema(googleBusinessProfiles).omit({ id: true, updatedAt: true, tenantId: true });
export const insertLocalCitationSchema = createInsertSchema(localCitations).omit({ id: true, lastChecked: true, tenantId: true });
export const insertSocialAccountSchema = createInsertSchema(socialAccounts).omit({ id: true, connectedAt: true, tenantId: true });
export const insertSocialPostSchema = createInsertSchema(socialPosts).omit({ id: true, lastSyncedAt: true, tenantId: true });
export const insertSocialMetricSchema = createInsertSchema(socialMetrics).omit({ id: true, recordedAt: true, tenantId: true });

// Multi-Platform Search Optimization Insert Schemas
export const insertAiSearchPlatformSchema = createInsertSchema(aiSearchPlatforms).omit({ id: true, createdAt: true, tenantId: true });
export const insertAiBrandMentionSchema = createInsertSchema(aiBrandMentions).omit({ id: true, checkedAt: true, tenantId: true });
export const insertAiCitationSchema = createInsertSchema(aiCitations).omit({ id: true, checkedAt: true, tenantId: true });
export const insertAiSentimentAnalysisSchema = createInsertSchema(aiSentimentAnalysis).omit({ id: true, analyzedAt: true, tenantId: true });
export const insertPromptLibrarySchema = createInsertSchema(promptLibrary).omit({ id: true, lastUpdated: true, tenantId: true });
export const insertSocialSearchMetricSchema = createInsertSchema(socialSearchMetrics).omit({ id: true, checkedAt: true, tenantId: true });
export const insertMultiPlatformPerformanceSchema = createInsertSchema(multiPlatformPerformance).omit({ id: true, recordedAt: true, tenantId: true });
export const insertCompetitiveAiBenchmarkSchema = createInsertSchema(competitiveAiBenchmark).omit({ id: true, lastAnalyzed: true, tenantId: true });
export const insertAudienceInsightSchema = createInsertSchema(audienceInsights).omit({ id: true, createdAt: true, updatedAt: true, tenantId: true });
export const insertEeatSignalSchema = createInsertSchema(eeatSignals).omit({ id: true, analyzedAt: true, tenantId: true });

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

export type InsertAuditScan = z.infer<typeof insertAuditScanSchema>;
export type AuditScan = typeof auditScans.$inferSelect;

export type InsertPageMetric = z.infer<typeof insertPageMetricSchema>;
export type PageMetric = typeof pageMetrics.$inferSelect;

export type InsertCoreWebVital = z.infer<typeof insertCoreWebVitalSchema>;
export type CoreWebVital = typeof coreWebVitals.$inferSelect;

export type InsertReportConfig = z.infer<typeof insertReportConfigSchema>;
export type ReportConfig = typeof reportConfigs.$inferSelect;

export type InsertGeneratedReport = z.infer<typeof insertGeneratedReportSchema>;
export type GeneratedReport = typeof generatedReports.$inferSelect;

export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;

export type InsertApiUsage = z.infer<typeof insertApiUsageSchema>;
export type ApiUsage = typeof apiUsage.$inferSelect;

export type InsertLocalRanking = z.infer<typeof insertLocalRankingSchema>;
export type LocalRanking = typeof localRankings.$inferSelect;

export type InsertGoogleBusinessProfile = z.infer<typeof insertGoogleBusinessProfileSchema>;
export type GoogleBusinessProfile = typeof googleBusinessProfiles.$inferSelect;

export type InsertLocalCitation = z.infer<typeof insertLocalCitationSchema>;
export type LocalCitation = typeof localCitations.$inferSelect;

export type InsertSocialAccount = z.infer<typeof insertSocialAccountSchema>;
export type SocialAccount = typeof socialAccounts.$inferSelect;

export type InsertSocialPost = z.infer<typeof insertSocialPostSchema>;
export type SocialPost = typeof socialPosts.$inferSelect;

export type InsertSocialMetric = z.infer<typeof insertSocialMetricSchema>;
export type SocialMetric = typeof socialMetrics.$inferSelect;

// Multi-Platform Search Optimization Types
export type InsertAiSearchPlatform = z.infer<typeof insertAiSearchPlatformSchema>;
export type AiSearchPlatform = typeof aiSearchPlatforms.$inferSelect;

export type InsertAiBrandMention = z.infer<typeof insertAiBrandMentionSchema>;
export type AiBrandMention = typeof aiBrandMentions.$inferSelect;

export type InsertAiCitation = z.infer<typeof insertAiCitationSchema>;
export type AiCitation = typeof aiCitations.$inferSelect;

export type InsertAiSentimentAnalysis = z.infer<typeof insertAiSentimentAnalysisSchema>;
export type AiSentimentAnalysis = typeof aiSentimentAnalysis.$inferSelect;

export type InsertPromptLibrary = z.infer<typeof insertPromptLibrarySchema>;
export type PromptLibrary = typeof promptLibrary.$inferSelect;

export type InsertSocialSearchMetric = z.infer<typeof insertSocialSearchMetricSchema>;
export type SocialSearchMetric = typeof socialSearchMetrics.$inferSelect;

export type InsertMultiPlatformPerformance = z.infer<typeof insertMultiPlatformPerformanceSchema>;
export type MultiPlatformPerformance = typeof multiPlatformPerformance.$inferSelect;

export type InsertCompetitiveAiBenchmark = z.infer<typeof insertCompetitiveAiBenchmarkSchema>;
export type CompetitiveAiBenchmark = typeof competitiveAiBenchmark.$inferSelect;

export type InsertAudienceInsight = z.infer<typeof insertAudienceInsightSchema>;
export type AudienceInsight = typeof audienceInsights.$inferSelect;

export type InsertEeatSignal = z.infer<typeof insertEeatSignalSchema>;
export type EeatSignal = typeof eeatSignals.$inferSelect;
