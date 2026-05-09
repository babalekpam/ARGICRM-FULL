/**
 * schema-extended.ts
 * ──────────────────────────────────────────────────────────
 * Tables NOT yet in the production database.
 * This file is intentionally excluded from drizzle.config.ts
 * so drizzle-kit never tries to push them (avoiding publish
 * conflict dialogs). They are created on first production
 * boot via the startup migration in server/index.ts and
 * server/migrations/extra-startup.ts.
 */
import {
  pgTable, text, integer, boolean, timestamp, decimal,
  jsonb, uuid, index, varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import {
  tenants, users, contacts, leads, deals, accounts,
  stores, projects, landingPages,
} from "./schema.js";

// ═══════════════════════════════════════════════════
// PIPELINES
// ═══════════════════════════════════════════════════
export const pipelines = pgTable("pipelines", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  stages: jsonb("stages").$type<Array<{ id: string; name: string; order: number; color: string; probability: number }>>().default([]),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ═══════════════════════════════════════════════════
// INVOICES
// ═══════════════════════════════════════════════════
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  number: text("invoice_number").notNull(),
  contactId: uuid("contact_id").references(() => contacts.id),
  accountId: uuid("account_id").references(() => accounts.id),
  dealId: uuid("deal_id").references(() => deals.id),
  status: text("status").default("draft"),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default("0"),
  tax: decimal("tax_amount", { precision: 12, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }).default("0"),
  total: decimal("total", { precision: 12, scale: 2 }).default("0"),
  currency: text("currency").default("USD"),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  items: jsonb("line_items").$type<Array<{ description: string; quantity: number; unitPrice: number; total: number }>>().default([]),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [index("idx_invoices_tenant").on(t.tenantId)]);

export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true, updatedAt: true });
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

// ═══════════════════════════════════════════════════
// AI USAGE TRACKING
// ═══════════════════════════════════════════════════
export const aiUsage = pgTable("ai_usage", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id),
  type: text("type").notNull(),
  tokens: integer("tokens").default(0),
  cost: decimal("cost", { precision: 8, scale: 6 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [index("idx_ai_usage_tenant").on(t.tenantId)]);

// ═══════════════════════════════════════════════════
// AI AGENTS
// ═══════════════════════════════════════════════════
export const agentTypes = [
  "chief_of_staff", "sales", "marketing", "customer_support",
  "finance", "hr_recruiting", "operations", "compliance",
  "bi_insights", "devops", "product", "research"
] as const;
export type AgentType = typeof agentTypes[number];

export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true),
  personality: text("personality"),
  totalSessions: integer("total_sessions").default(0),
  totalMessages: integer("total_messages").default(0),
  lastActiveAt: timestamp("last_active_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const agentMemories = pgTable("agent_memories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  agentType: text("agent_type").notNull(),
  category: text("category").notNull(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  importance: integer("importance").default(5),
  source: text("source"),
  relatedEntityId: uuid("related_entity_id"),
  relatedEntityType: text("related_entity_type"),
  expiresAt: timestamp("expires_at"),
  usageCount: integer("usage_count").default(0),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("idx_memories_tenant_agent").on(t.tenantId, t.agentType),
  index("idx_memories_category").on(t.tenantId, t.agentType, t.category),
]);

export const agentSessions = pgTable("agent_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  agentType: text("agent_type").notNull(),
  title: text("title"),
  summary: text("summary"),
  messageCount: integer("message_count").default(0),
  tokensUsed: integer("tokens_used").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("idx_sessions_tenant_agent").on(t.tenantId, t.agentType),
  index("idx_sessions_user").on(t.userId),
]);

export const agentMessages = pgTable("agent_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: uuid("session_id").references(() => agentSessions.id, { onDelete: "cascade" }).notNull(),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  tokensUsed: integer("tokens_used").default(0),
  toolCalls: jsonb("tool_calls").$type<Array<{ tool: string; input: any; output: any }>>().default([]),
  memoriesUsed: jsonb("memories_used").$type<string[]>().default([]),
  memoriesCreated: jsonb("memories_created").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [index("idx_messages_session").on(t.sessionId)]);

export const agentTasks = pgTable("agent_tasks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  agentType: text("agent_type").notNull(),
  sessionId: uuid("session_id").references(() => agentSessions.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("pending"),
  priority: text("priority").default("medium"),
  result: text("result"),
  assignedToUserId: uuid("assigned_to_user_id").references(() => users.id),
  dueAt: timestamp("due_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [index("idx_agent_tasks_tenant").on(t.tenantId)]);

export const agentLeadGenResults = pgTable("agent_lead_gen_results", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  sessionId: uuid("session_id").references(() => agentSessions.id),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  company: text("company"),
  jobTitle: text("job_title"),
  phone: text("phone"),
  source: text("source"),
  score: integer("score").default(0),
  enrichmentData: jsonb("enrichment_data").$type<Record<string, any>>().default({}),
  outreachStatus: text("outreach_status").default("pending"),
  importedAsLeadId: uuid("imported_as_lead_id").references(() => leads.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Agent = typeof agents.$inferSelect;
export type AgentMemory = typeof agentMemories.$inferSelect;
export type AgentSession = typeof agentSessions.$inferSelect;
export type AgentMessage = typeof agentMessages.$inferSelect;
export type AgentTask = typeof agentTasks.$inferSelect;

// ═══════════════════════════════════════════════════
// LEAD INTELLIGENCE
// ═══════════════════════════════════════════════════
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  domain: text("domain"),
  website: text("website"),
  industry: text("industry"),
  subIndustry: text("sub_industry"),
  size: text("size"),
  employeeCount: integer("employee_count"),
  revenue: text("revenue"),
  founded: integer("founded"),
  hqCity: text("hq_city"),
  hqState: text("hq_state"),
  hqCountry: text("hq_country"),
  description: text("description"),
  linkedinUrl: text("linkedin_url"),
  twitterUrl: text("twitter_url"),
  crunchbaseUrl: text("crunchbase_url"),
  techStack: jsonb("tech_stack").$type<string[]>().default([]),
  keywords: jsonb("keywords").$type<string[]>().default([]),
  fundingStage: text("funding_stage"),
  totalFunding: text("total_funding"),
  lastFundingDate: text("last_funding_date"),
  intentSignals: jsonb("intent_signals").$type<Array<{ signal: string; strength: number; date: string }>>().default([]),
  score: integer("score").default(0),
  tags: jsonb("tags").$type<string[]>().default([]),
  dataSource: text("data_source").default("enriched"),
  lastEnrichedAt: timestamp("last_enriched_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("idx_companies_tenant").on(t.tenantId),
  index("idx_companies_domain").on(t.domain),
]);

export const prospects = pgTable("prospects", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  companyId: uuid("company_id").references(() => companies.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  email: text("email"),
  emailStatus: text("email_status").default("unknown"),
  workEmail: text("work_email"),
  personalEmail: text("personal_email"),
  phone: text("phone"),
  directPhone: text("direct_phone"),
  mobilePhone: text("mobile_phone"),
  jobTitle: text("job_title"),
  seniority: text("seniority"),
  department: text("department"),
  company: text("company"),
  companyDomain: text("company_domain"),
  linkedinUrl: text("linkedin_url"),
  twitterUrl: text("twitter_url"),
  location: text("location"),
  city: text("city"),
  country: text("country"),
  timezone: text("timezone"),
  bio: text("bio"),
  score: integer("score").default(0),
  intentScore: integer("intent_score").default(0),
  buyingSignals: jsonb("buying_signals").$type<Array<{ signal: string; strength: number; date: string }>>().default([]),
  techStack: jsonb("tech_stack").$type<string[]>().default([]),
  skills: jsonb("skills").$type<string[]>().default([]),
  tags: jsonb("tags").$type<string[]>().default([]),
  outreachStatus: text("outreach_status").default("new"),
  lastContactedAt: timestamp("last_contacted_at"),
  sequenceId: uuid("sequence_id"),
  importedAsLeadId: uuid("imported_as_lead_id").references(() => leads.id),
  importedAsContactId: uuid("imported_as_contact_id").references(() => contacts.id),
  dataSource: text("data_source").default("enriched"),
  lastEnrichedAt: timestamp("last_enriched_at"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("idx_prospects_tenant").on(t.tenantId),
  index("idx_prospects_email").on(t.tenantId, t.email),
  index("idx_prospects_company").on(t.companyId),
]);

export const prospectLists = pgTable("prospect_lists", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  filters: jsonb("filters").$type<{
    industries?: string[];
    titles?: string[];
    seniorities?: string[];
    companySizes?: string[];
    countries?: string[];
    technologies?: string[];
    keywords?: string[];
    intentTopics?: string[];
    fundingStages?: string[];
    revenueRanges?: string[];
  }>().default({}),
  prospectCount: integer("prospect_count").default(0),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sequences = pgTable("sequences", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("draft"),
  steps: jsonb("steps").$type<Array<{
    id: string; stepNumber: number; type: string;
    delayDays: number; subject?: string; body?: string; taskTitle?: string;
  }>>().default([]),
  totalEnrolled: integer("total_enrolled").default(0),
  totalReplied: integer("total_replied").default(0),
  totalConverted: integer("total_converted").default(0),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [index("idx_sequences_tenant").on(t.tenantId)]);

export const websiteVisitors = pgTable("website_visitors", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  visitorId: text("visitor_id"),
  companyName: text("company_name"),
  companyDomain: text("company_domain"),
  ipAddress: text("ip_address"),
  country: text("country"),
  city: text("city"),
  pages: jsonb("pages").$type<Array<{ url: string; time: number; title: string }>>().default([]),
  sessionCount: integer("session_count").default(1),
  totalTimeOnSite: integer("total_time_on_site").default(0),
  lastSeen: timestamp("last_seen").defaultNow(),
  firstSeen: timestamp("first_seen").defaultNow(),
  score: integer("score").default(0),
  identifiedAsProspectId: uuid("identified_as_prospect_id").references(() => prospects.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [index("idx_visitors_tenant").on(t.tenantId)]);

export const technographics = pgTable("technographics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  companyId: uuid("company_id").references(() => companies.id),
  companyDomain: text("company_domain"),
  technology: text("technology").notNull(),
  category: text("category"),
  vendor: text("vendor"),
  confidence: integer("confidence").default(80),
  detectedAt: timestamp("detected_at").defaultNow(),
}, (t) => [index("idx_technographics_company").on(t.companyId)]);

export const intentSignals = pgTable("intent_signals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  companyDomain: text("company_domain"),
  companyName: text("company_name"),
  topic: text("topic").notNull(),
  signalType: text("signal_type").notNull(),
  strength: integer("strength").default(50),
  description: text("description"),
  sourceUrl: text("source_url"),
  detectedAt: timestamp("detected_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
}, (t) => [index("idx_intent_tenant").on(t.tenantId)]);

export type Company = typeof companies.$inferSelect;
export type Prospect = typeof prospects.$inferSelect;
export type ProspectList = typeof prospectLists.$inferSelect;
export type Sequence = typeof sequences.$inferSelect;

// ═══════════════════════════════════════════════════
// CODE HEALING SYSTEM
// ═══════════════════════════════════════════════════
export const healthChecks = pgTable("health_checks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  checkType: text("check_type").notNull(),
  status: text("status").notNull(),
  latencyMs: integer("latency_ms"),
  message: text("message"),
  details: jsonb("details").$type<Record<string, any>>().default({}),
  checkedAt: timestamp("checked_at").defaultNow(),
}, (t) => [index("idx_health_type").on(t.checkType)]);

export const errorLogs = pgTable("error_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id"),
  severity: text("severity").notNull(),
  category: text("category").notNull(),
  message: text("message").notNull(),
  stack: text("stack"),
  context: jsonb("context").$type<Record<string, any>>().default({}),
  userId: uuid("user_id"),
  endpoint: text("endpoint"),
  resolved: boolean("resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: text("resolved_by"),
  healingAttempts: integer("healing_attempts").default(0),
  healingLog: jsonb("healing_log").$type<Array<{ attempt: number; action: string; result: string; timestamp: string }>>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("idx_errors_severity").on(t.severity),
  index("idx_errors_resolved").on(t.resolved),
]);

export const healingRules = pgTable("healing_rules", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  trigger: text("trigger").notNull(),
  pattern: text("pattern").notNull(),
  category: text("category").notNull(),
  action: text("action").notNull(),
  actionConfig: jsonb("action_config").$type<Record<string, any>>().default({}),
  isActive: boolean("is_active").default(true),
  successCount: integer("success_count").default(0),
  failureCount: integer("failure_count").default(0),
  lastTriggeredAt: timestamp("last_triggered_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const performanceMetrics = pgTable("performance_metrics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  metricType: text("metric_type").notNull(),
  value: decimal("value", { precision: 10, scale: 4 }).notNull(),
  unit: text("unit"),
  endpoint: text("endpoint"),
  tags: jsonb("tags").$type<Record<string, string>>().default({}),
  recordedAt: timestamp("recorded_at").defaultNow(),
}, (t) => [index("idx_metrics_type_time").on(t.metricType, t.recordedAt)]);

export type HealthCheck = typeof healthChecks.$inferSelect;
export type ErrorLog = typeof errorLogs.$inferSelect;

// ═══════════════════════════════════════════════════
// SEO PLATFORM
// ═══════════════════════════════════════════════════
export const seoProjects = pgTable("seo_projects", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  domain: text("domain").notNull(),
  status: text("status").default("active"),
  settings: jsonb("settings").$type<Record<string, any>>().default({}),
  country: text("country").default("US"),
  language: text("language").default("en"),
  competitors: jsonb("competitors").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [index("idx_seo_projects_tenant").on(t.tenantId)]);

export const seoAudits = pgTable("seo_audits", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  projectId: uuid("project_id").references(() => seoProjects.id),
  score: integer("score").default(0),
  issues: jsonb("issues").$type<Array<{ type: string; severity: string; description: string; count: number; urls: string[] }>>().default([]),
  summary: jsonb("summary").$type<{ critical: number; warnings: number; passed: number; totalPages: number }>().default({ critical: 0, warnings: 0, passed: 0, totalPages: 0 }),
  crawledAt: timestamp("crawled_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contentIdeas = pgTable("content_ideas", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  projectId: uuid("project_id").references(() => seoProjects.id),
  title: text("title").notNull(),
  keyword: text("keyword"),
  searchVolume: integer("search_volume").default(0),
  difficulty: integer("difficulty").default(0),
  contentType: text("content_type").default("blog"),
  outline: jsonb("outline").$type<string[]>().default([]),
  status: text("status").default("idea"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type SeoProject = typeof seoProjects.$inferSelect;

// ═══════════════════════════════════════════════════
// E-COMMERCE (products & orders)
// ═══════════════════════════════════════════════════
export const products = pgTable("products", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  storeId: uuid("store_id").references(() => stores.id),
  name: text("name").notNull(),
  slug: text("slug"),
  description: text("description"),
  shortDescription: text("short_description"),
  sku: text("sku"),
  barcode: text("barcode"),
  price: decimal("price", { precision: 12, scale: 2 }).notNull().default("0"),
  compareAtPrice: decimal("compare_at_price", { precision: 12, scale: 2 }),
  cost: decimal("cost", { precision: 12, scale: 2 }),
  currency: text("currency").default("USD"),
  category: text("category"),
  tags: jsonb("tags").$type<string[]>().default([]),
  images: jsonb("images").$type<string[]>().default([]),
  weight: decimal("weight", { precision: 8, scale: 2 }),
  dimensions: jsonb("dimensions").$type<{ length?: number; width?: number; height?: number }>().default({}),
  inventory: integer("inventory").default(0),
  lowStockThreshold: integer("low_stock_threshold").default(10),
  trackInventory: boolean("track_inventory").default(true),
  isAvailable: boolean("is_available").default(true),
  isFeatured: boolean("is_featured").default(false),
  aiScore: integer("ai_score").default(0),
  attributes: jsonb("attributes").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [index("idx_products_tenant").on(t.tenantId)]);

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  storeId: uuid("store_id").references(() => stores.id),
  orderNumber: text("order_number").notNull(),
  status: text("status").default("pending"),
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone").default(""),
  shippingAddress: jsonb("shipping_address").$type<Record<string, any>>().default({}),
  items: jsonb("items").$type<Array<{ productId: string; name: string; qty: number; price: number; total: number }>>().default([]),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default("0"),
  tax: decimal("tax", { precision: 12, scale: 2 }).default("0"),
  shipping: decimal("shipping", { precision: 12, scale: 2 }).default("0"),
  total: decimal("total", { precision: 12, scale: 2 }).default("0"),
  currency: text("currency").default("USD"),
  paymentStatus: text("payment_status").default("unpaid"),
  paymentMethod: text("payment_method"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [index("idx_orders_tenant").on(t.tenantId)]);

export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;

// ═══════════════════════════════════════════════════
// FINANCIAL MANAGEMENT
// ═══════════════════════════════════════════════════
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(),
  category: text("category"),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 6 }).default("1"),
  amountUsd: decimal("amount_usd", { precision: 15, scale: 2 }),
  date: timestamp("transaction_date"),
  accountId: text("account_id"),
  contactId: uuid("contact_id").references(() => contacts.id),
  tags: jsonb("tags").$type<string[]>().default([]),
  reconciled: boolean("reconciled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [index("idx_transactions_tenant").on(t.tenantId)]);

export const bankAccounts = pgTable("bank_accounts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  accountType: text("account_type").default("checking"),
  currency: text("currency").default("USD"),
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0"),
  institution: text("institution"),
  accountNumberLast4: text("account_number_last4"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const taxRates = pgTable("tax_rates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  rate: decimal("rate", { precision: 6, scale: 4 }).notNull(),
  country: text("country"),
  region: text("region"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ═══════════════════════════════════════════════════
// HR & OPERATIONS
// ═══════════════════════════════════════════════════
export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  email: text("email"),
  phone: text("phone"),
  avatar: text("avatar"),
  department: text("department"),
  jobTitle: text("job_title"),
  employmentType: text("employment_type").default("full_time"),
  status: text("status").default("active"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  salary: decimal("salary", { precision: 12, scale: 2 }),
  currency: text("currency").default("USD"),
  managerId: uuid("manager_id"),
  skills: jsonb("skills").$type<string[]>().default([]),
  location: text("location"),
  timezone: text("timezone"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [index("idx_employees_tenant").on(t.tenantId)]);

export const projectTasks = pgTable("project_tasks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("todo"),
  priority: text("priority").default("medium"),
  assigneeId: uuid("assignee_id").references(() => users.id),
  startDate: timestamp("start_date"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  estimatedHours: decimal("estimated_hours", { precision: 6, scale: 2 }),
  actualHours: decimal("actual_hours", { precision: 6, scale: 2 }),
  parentId: uuid("parent_id"),
  order: integer("order").default(0),
  dependencies: jsonb("dependencies").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [index("idx_project_tasks_project").on(t.projectId)]);

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  type: text("type").default("file"),
  mimeType: text("mime_type"),
  size: integer("size").default(0),
  url: text("url"),
  content: text("content"),
  parentId: uuid("parent_id"),
  tags: jsonb("tags").$type<string[]>().default([]),
  sharedWith: jsonb("shared_with").$type<string[]>().default([]),
  uploadedBy: uuid("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [index("idx_documents_tenant").on(t.tenantId)]);

export type Employee = typeof employees.$inferSelect;
export type ProjectTask = typeof projectTasks.$inferSelect;
export type Document = typeof documents.$inferSelect;

// ═══════════════════════════════════════════════════
// MARKETING
// ═══════════════════════════════════════════════════
export const funnels = pgTable("funnels", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  offer: text("offer"),
  targetAudience: text("target_audience"),
  status: text("status").default("draft"),
  steps: jsonb("steps").$type<Array<{ id: string; type: string; name: string; content: any; order: number }>>().default([]),
  emailSequence: jsonb("email_sequence").$type<Array<{ subject: string; body: string; delayDays: number }>>().default([]),
  adCopy: jsonb("ad_copy").$type<Array<{ platform: string; headline: string; body: string; cta: string }>>().default([]),
  landingPageId: uuid("landing_page_id").references(() => landingPages.id),
  totalLeads: integer("total_leads").default(0),
  totalConversions: integer("total_conversions").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [index("idx_funnels_tenant").on(t.tenantId)]);

export const reputationReviews = pgTable("reputation_reviews", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  platform: text("platform").notNull(),
  reviewerName: text("reviewer_name"),
  rating: integer("rating").default(5),
  content: text("content"),
  response: text("response"),
  sentiment: text("sentiment").default("positive"),
  url: text("url"),
  publishedAt: timestamp("published_at"),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [index("idx_reviews_tenant").on(t.tenantId)]);

export type Funnel = typeof funnels.$inferSelect;

// ═══════════════════════════════════════════════════
// ENTERPRISE FEATURES
// ═══════════════════════════════════════════════════
export const clientPortalAccess = pgTable("client_portal_access", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  contactId: uuid("contact_id").references(() => contacts.id),
  email: text("email").notNull(),
  accessToken: text("access_token"),
  permissions: jsonb("permissions").$type<string[]>().default(["view_projects", "view_invoices"]),
  lastLoginAt: timestamp("last_login_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const whitelabelSettings = pgTable("whitelabel_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull().unique(),
  brandName: text("brand_name"),
  logo: text("logo"),
  favicon: text("favicon"),
  primaryColor: text("primary_color").default("#3b82f6"),
  secondaryColor: text("secondary_color").default("#8b5cf6"),
  customDomain: text("custom_domain"),
  customCss: text("custom_css"),
  emailFromName: text("email_from_name"),
  emailFromAddress: text("email_from_address"),
  supportEmail: text("support_email"),
  privacyUrl: text("privacy_url"),
  termsUrl: text("terms_url"),
  hideArgiletteBranding: boolean("hide_argilette_branding").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ═══════════════════════════════════════════════════
// DATA MARKETPLACE — Unified lead pool (shared across tenants)
// ═══════════════════════════════════════════════════
export const marketplaceLeads = pgTable("marketplace_leads", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  source: text("source").notNull(),           // 'npi','overpass','cms','opencorporates','yelp','yellowpages'
  market: text("market").notNull().default("US"), // 'US','Africa'
  category: text("category"),                 // Healthcare, Legal, Real Estate…
  fullName: text("full_name"),
  companyName: text("company_name"),
  title: text("title"),
  email: text("email"),
  phone: text("phone"),
  website: text("website"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  country: text("country").default("US"),
  zip: text("zip"),
  industry: text("industry"),
  specialty: text("specialty"),
  employeeSize: text("employee_size"),
  revenueRange: text("revenue_range"),
  rating: decimal("rating", { precision: 3, scale: 1 }),
  linkedinUrl: text("linkedin_url"),
  language: text("language").default("EN"),   // EN / FR
  verified: boolean("verified").default(false),
  qualityScore: integer("quality_score").default(0), // 1-10
  timesSold: integer("times_sold").default(0),
  available: boolean("available").default(true),
  externalId: text("external_id"),            // original ID from source (unique per source)
  rawData: jsonb("raw_data"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ingestionLogs = pgTable("ingestion_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  source: text("source").notNull(),
  market: text("market"),
  recordsAdded: integer("records_added").default(0),
  recordsUpdated: integer("records_updated").default(0),
  recordsSkipped: integer("records_skipped").default(0),
  errors: jsonb("errors").$type<string[]>().default([]),
  duration: integer("duration"),              // ms
  status: text("status").default("success"),  // success | failed | partial
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const marketplaceExports = pgTable("marketplace_exports", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").notNull(),
  leadId: uuid("lead_id").references(() => marketplaceLeads.id),
  exportedAt: timestamp("exported_at").defaultNow(),
});

export const marketplaceUsage = pgTable("marketplace_usage", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").notNull(),
  month: text("month").notNull(),             // "2026-04"
  exportsUsed: integer("exports_used").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ═══════════════════════════════════════════════════
// ARIA AUDIT LOG
// ═══════════════════════════════════════════════════
export const ariaAuditLog = pgTable("aria_audit_log", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  userId: varchar("user_id").notNull(),
  instruction: text("instruction").notNull(),
  intentModule: text("intent_module"),
  intentAction: text("intent_action"),
  result: text("result"),
  status: text("status").default("success"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ═══════════════════════════════════════════════════
// AUDIT LOGS (§8.5) — security audit trail
// Tenant-scoped. One row per mutation + auth event. Sensitive fields
// (password, token, apiKey, stripe secrets, smtp pass, totp_secret)
// are redacted by server/middleware/audit.ts before insert.
// ═══════════════════════════════════════════════════
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id"),
  actorUserId: varchar("actor_user_id"),
  actorType: varchar("actor_type").notNull().default("user"), // user | api_key | system | agent | anonymous
  action: varchar("action").notNull(),                         // create | update | delete | login | logout | register | password_change | invite_user | export | ...
  entity: varchar("entity").notNull(),                         // contact | deal | invoice | user | tenant | settings | auth | ...
  entityId: varchar("entity_id"),
  method: varchar("method"),
  path: text("path"),
  statusCode: integer("status_code"),
  ip: varchar("ip"),
  userAgent: text("user_agent"),
  requestBody: jsonb("request_body"),
  responseMeta: jsonb("response_meta"),
  latencyMs: integer("latency_ms"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("idx_audit_logs_tenant_created").on(t.tenantId, t.createdAt),
  index("idx_audit_logs_tenant_entity").on(t.tenantId, t.entity, t.entityId),
  index("idx_audit_logs_actor").on(t.tenantId, t.actorUserId),
]);
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ═══════════════════════════════════════════════════
// AI COUNCIL (§9) — multi-provider/specialist deliberation layer
// ═══════════════════════════════════════════════════
//
// council_topics: pre-defined decision types (discount.approve, lead.score,
// deal.advance, ...). Tenant-specific overrides supported via a non-null
// tenant_id; null tenant_id = global default.
//
// council_decisions: every deliberation produces one row. Stores the full
// per-round transcript, the consensus outcome, dissent record, cost in
// credits + USD, and the human approver (if any). Replay reads from this
// row and re-runs against participants[].providers/agent versions.
//
export const councilTopics = pgTable("council_topics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id"), // null = global default
  name: varchar("name").notNull(),
  description: text("description"),
  defaultMode: varchar("default_mode").notNull(), // 'ensemble' | 'debate'
  defaultParticipants: jsonb("default_participants").notNull().default(sql`'[]'::jsonb`),
  systemPromptTemplate: text("system_prompt_template").notNull(),
  guardrails: jsonb("guardrails").notNull().default(sql`'{}'::jsonb`),
  requiresManualApproval: boolean("requires_manual_approval").notNull().default(true),
  minPlan: varchar("min_plan").notNull().default("starter"),
  createdAt: timestamp("created_at").defaultNow(),
});
export type CouncilTopic = typeof councilTopics.$inferSelect;
export type InsertCouncilTopic = typeof councilTopics.$inferInsert;

export const councilDecisions = pgTable("council_decisions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  topic: varchar("topic").notNull(),
  mode: varchar("mode").notNull(), // 'ensemble' | 'debate'
  status: varchar("status").notNull().default("pending"), // pending | running | succeeded | failed | rejected_by_human | applied
  inputs: jsonb("inputs").notNull(),
  participants: jsonb("participants").notNull(), // [{kind:'provider'|'agent', name, weight?}]
  rounds: jsonb("rounds").notNull().default(sql`'[]'::jsonb`), // [{round:1, statements:[{participant, text, vote?}]}]
  outcome: jsonb("outcome"), // {recommendation, vote, confidence: 0..1, reasons: [...]}
  dissent: jsonb("dissent"), // [{participant, position, why}]
  costCredits: integer("cost_credits").notNull().default(0),
  costUsd: decimal("cost_usd", { precision: 10, scale: 6 }).notNull().default("0"),
  latencyMs: integer("latency_ms"),
  triggeredBy: varchar("triggered_by"),
  triggerSource: varchar("trigger_source"), // 'ui' | 'workflow' | 'api' | 'agent'
  approvedBy: varchar("approved_by"),
  appliedAt: timestamp("applied_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("idx_council_decisions_tenant_created").on(t.tenantId, t.createdAt),
  index("idx_council_decisions_tenant_topic").on(t.tenantId, t.topic, t.status),
  index("idx_council_decisions_triggered_by").on(t.tenantId, t.triggeredBy),
]);
export type CouncilDecision = typeof councilDecisions.$inferSelect;
export type InsertCouncilDecision = typeof councilDecisions.$inferInsert;
