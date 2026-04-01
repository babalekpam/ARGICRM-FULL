import { pgTable, text, integer, boolean, timestamp, decimal, jsonb, uuid, index, varchar } from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ═══════════════════════════════════════════════════
// TENANTS (one per company/account)
// ═══════════════════════════════════════════════════
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  domain: text("domain").unique().notNull(),
  slug: text("slug").unique().notNull(), // URL-friendly identifier
  logo: text("logo"),
  primaryColor: text("primary_color").default("#3b82f6"),
  subscriptionPlan: text("subscription_plan").default("trial"), // trial, starter, pro, business, enterprise
  subscriptionStatus: text("subscription_status").default("trialing"), // trialing, active, past_due, canceled
  trialEndsAt: timestamp("trial_ends_at"),
  maxUsers: integer("max_users").default(3),
  maxContacts: integer("max_contacts").default(500),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  settings: jsonb("settings").$type<{
    timezone?: string;
    currency?: string;
    language?: string;
    emailSignature?: string;
    features?: string[];
    customFields?: Record<string, any>;
  }>().default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ═══════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  avatar: text("avatar"),
  passwordHash: text("password_hash").notNull(),
  role: text("role").default("user"), // platform_owner, super_admin, admin, manager, user, viewer
  permissions: jsonb("permissions").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true),
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: text("email_verification_token"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  lastLoginAt: timestamp("last_login_at"),
  preferredLanguage: text("preferred_language").default("en"),
  timezone: text("timezone").default("UTC"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("idx_users_tenant_email").on(t.tenantId, t.email),
]);

// ═══════════════════════════════════════════════════
// CONTACTS
// ═══════════════════════════════════════════════════
export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  jobTitle: text("job_title"),
  website: text("website"),
  linkedin: text("linkedin"),
  address: text("address"),
  city: text("city"),
  country: text("country"),
  avatar: text("avatar"),
  status: text("status").default("active"), // active, inactive, lead, customer, churned
  source: text("source"), // website, referral, cold_outreach, linkedin, etc.
  tags: jsonb("tags").$type<string[]>().default([]),
  customFields: jsonb("custom_fields").$type<Record<string, any>>().default({}),
  notes: text("notes"),
  assignedTo: uuid("assigned_to").references(() => users.id),
  lastContactedAt: timestamp("last_contacted_at"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("idx_contacts_tenant").on(t.tenantId),
  index("idx_contacts_email").on(t.tenantId, t.email),
]);

// ═══════════════════════════════════════════════════
// LEADS
// ═══════════════════════════════════════════════════
export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  jobTitle: text("job_title"),
  source: text("source"), // website, cold_email, linkedin, referral, ad
  status: text("status").default("new"), // new, contacted, qualified, unqualified, converted
  score: integer("score").default(0), // 0-100 lead score
  estimatedValue: decimal("estimated_value", { precision: 12, scale: 2 }),
  notes: text("notes"),
  tags: jsonb("tags").$type<string[]>().default([]),
  assignedTo: uuid("assigned_to").references(() => users.id),
  convertedToContactId: uuid("converted_to_contact_id").references(() => contacts.id),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("idx_leads_tenant").on(t.tenantId),
]);

// ═══════════════════════════════════════════════════
// PIPELINES & DEALS
// ═══════════════════════════════════════════════════
export const pipelines = pgTable("pipelines", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  stages: jsonb("stages").$type<Array<{ id: string; name: string; order: number; color: string; probability: number }>>().default([]),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const deals = pgTable("deals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  pipelineId: uuid("pipeline_id").references(() => pipelines.id),
  contactId: uuid("contact_id").references(() => contacts.id),
  title: text("title").notNull(),
  stage: text("stage").notNull().default("prospecting"), // prospecting, qualification, proposal, negotiation, closed_won, closed_lost
  value: decimal("value", { precision: 12, scale: 2 }).default("0"),
  currency: text("currency").default("USD"),
  probability: integer("probability").default(0), // 0-100
  expectedCloseDate: timestamp("expected_close_date"),
  closedAt: timestamp("closed_at"),
  notes: text("notes"),
  tags: jsonb("tags").$type<string[]>().default([]),
  assignedTo: uuid("assigned_to").references(() => users.id),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("idx_deals_tenant").on(t.tenantId),
  index("idx_deals_stage").on(t.tenantId, t.stage),
]);

// ═══════════════════════════════════════════════════
// TASKS
// ═══════════════════════════════════════════════════
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("todo"), // todo, in_progress, done, cancelled
  priority: text("priority").default("medium"), // low, medium, high, urgent
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  contactId: uuid("contact_id").references(() => contacts.id),
  dealId: uuid("deal_id").references(() => deals.id),
  assignedTo: uuid("assigned_to").references(() => users.id),
  createdBy: uuid("created_by").references(() => users.id),
  tags: jsonb("tags").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("idx_tasks_tenant").on(t.tenantId),
  index("idx_tasks_assignee").on(t.assignedTo),
]);

// ═══════════════════════════════════════════════════
// ACCOUNTS (Companies)
// ═══════════════════════════════════════════════════
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  website: text("website"),
  industry: text("industry"),
  size: text("size"), // 1-10, 11-50, 51-200, 201-500, 500+
  revenue: decimal("revenue", { precision: 15, scale: 2 }),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  city: text("city"),
  country: text("country"),
  logo: text("logo"),
  status: text("status").default("active"),
  notes: text("notes"),
  tags: jsonb("tags").$type<string[]>().default([]),
  assignedTo: uuid("assigned_to").references(() => users.id),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("idx_accounts_tenant").on(t.tenantId),
]);

// ═══════════════════════════════════════════════════
// ACTIVITIES (notes, calls, emails, meetings)
// ═══════════════════════════════════════════════════
export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(), // note, call, email, meeting, task_completed
  title: text("title").notNull(),
  description: text("description"),
  contactId: uuid("contact_id").references(() => contacts.id),
  dealId: uuid("deal_id").references(() => deals.id),
  leadId: uuid("lead_id").references(() => leads.id),
  accountId: uuid("account_id").references(() => accounts.id),
  createdBy: uuid("created_by").references(() => users.id),
  scheduledAt: timestamp("scheduled_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("idx_activities_tenant").on(t.tenantId),
  index("idx_activities_contact").on(t.contactId),
]);

// ═══════════════════════════════════════════════════
// EMAIL CAMPAIGNS
// ═══════════════════════════════════════════════════
export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  subject: text("subject"),
  type: text("type").default("email"), // email, sms, linkedin
  status: text("status").default("draft"), // draft, scheduled, sending, sent, paused
  content: text("content"),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  recipientCount: integer("recipient_count").default(0),
  openCount: integer("open_count").default(0),
  clickCount: integer("click_count").default(0),
  replyCount: integer("reply_count").default(0),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("idx_campaigns_tenant").on(t.tenantId),
]);

// ═══════════════════════════════════════════════════
// INVOICES
// ═══════════════════════════════════════════════════
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  number: text("number").notNull(),
  contactId: uuid("contact_id").references(() => contacts.id),
  accountId: uuid("account_id").references(() => accounts.id),
  dealId: uuid("deal_id").references(() => deals.id),
  status: text("status").default("draft"), // draft, sent, paid, overdue, cancelled
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default("0"),
  tax: decimal("tax", { precision: 12, scale: 2 }).default("0"),
  total: decimal("total", { precision: 12, scale: 2 }).default("0"),
  currency: text("currency").default("USD"),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  items: jsonb("items").$type<Array<{ description: string; quantity: number; unitPrice: number; total: number }>>().default([]),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("idx_invoices_tenant").on(t.tenantId),
]);

// ═══════════════════════════════════════════════════
// AI USAGE TRACKING
// ═══════════════════════════════════════════════════
export const aiUsage = pgTable("ai_usage", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id),
  type: text("type").notNull(), // email_generation, lead_scoring, contact_enrichment, etc.
  tokens: integer("tokens").default(0),
  cost: decimal("cost", { precision: 8, scale: 6 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("idx_ai_usage_tenant").on(t.tenantId),
]);

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
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(), // one of agentTypes
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true),
  personality: text("personality"), // custom personality overrides
  totalSessions: integer("total_sessions").default(0),
  totalMessages: integer("total_messages").default(0),
  lastActiveAt: timestamp("last_active_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Long-term agent memories — persisted facts the agent has learned
export const agentMemories = pgTable("agent_memories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  agentType: text("agent_type").notNull(),
  category: text("category").notNull(), // "business_context", "user_preference", "learned_fact", "goal", "relationship", "process"
  key: text("key").notNull(), // short identifier
  value: text("value").notNull(), // the actual memory content
  importance: integer("importance").default(5), // 1-10
  source: text("source"), // "conversation", "crm_data", "user_explicit", "inferred"
  relatedEntityId: uuid("related_entity_id"), // contact/deal/lead id if applicable
  relatedEntityType: text("related_entity_type"), // "contact", "deal", "lead"
  expiresAt: timestamp("expires_at"),
  usageCount: integer("usage_count").default(0),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("idx_memories_tenant_agent").on(t.tenantId, t.agentType),
  index("idx_memories_category").on(t.tenantId, t.agentType, t.category),
]);

// Conversation sessions
export const agentSessions = pgTable("agent_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  agentType: text("agent_type").notNull(),
  title: text("title"),
  summary: text("summary"), // AI-generated summary of the session
  messageCount: integer("message_count").default(0),
  tokensUsed: integer("tokens_used").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("idx_sessions_tenant_agent").on(t.tenantId, t.agentType),
  index("idx_sessions_user").on(t.userId),
]);

// Individual messages in sessions
export const agentMessages = pgTable("agent_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: uuid("session_id").references(() => agentSessions.id, { onDelete: "cascade" }).notNull(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  role: text("role").notNull(), // "user" | "assistant"
  content: text("content").notNull(),
  tokensUsed: integer("tokens_used").default(0),
  // Tool calls made during this message
  toolCalls: jsonb("tool_calls").$type<Array<{ tool: string; input: any; output: any }>>().default([]),
  // Memories triggered during this message
  memoriesUsed: jsonb("memories_used").$type<string[]>().default([]),
  // New memories created from this message
  memoriesCreated: jsonb("memories_created").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("idx_messages_session").on(t.sessionId),
]);

// Agent-generated tasks (agents can create tasks autonomously)
export const agentTasks = pgTable("agent_tasks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  agentType: text("agent_type").notNull(),
  sessionId: uuid("session_id").references(() => agentSessions.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("pending"), // pending, in_progress, completed, failed
  priority: text("priority").default("medium"),
  result: text("result"), // outcome/result when completed
  assignedToUserId: uuid("assigned_to_user_id").references(() => users.id),
  dueAt: timestamp("due_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("idx_agent_tasks_tenant").on(t.tenantId),
]);

// Agent lead generation results
export const agentLeadGenResults = pgTable("agent_lead_gen_results", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  sessionId: uuid("session_id").references(() => agentSessions.id),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  company: text("company"),
  jobTitle: text("job_title"),
  phone: text("phone"),
  source: text("source"), // "linkedin_scrape", "website_visitor", "ai_prospected", "referral_chain"
  score: integer("score").default(0),
  enrichmentData: jsonb("enrichment_data").$type<Record<string, any>>().default({}),
  outreachStatus: text("outreach_status").default("pending"), // pending, contacted, replied, converted, rejected
  importedAsLeadId: uuid("imported_as_lead_id").references(() => leads.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Agent = typeof agents.$inferSelect;
export type AgentMemory = typeof agentMemories.$inferSelect;
export type AgentSession = typeof agentSessions.$inferSelect;
export type AgentMessage = typeof agentMessages.$inferSelect;
export type AgentTask = typeof agentTasks.$inferSelect;

// ═══════════════════════════════════════════════════
// ZOD SCHEMAS
// ═══════════════════════════════════════════════════
export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertContactSchema = createInsertSchema(contacts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDealSchema = createInsertSchema(deals).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAccountSchema = createInsertSchema(accounts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, createdAt: true });
export const insertCampaignSchema = createInsertSchema(campaigns).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true, updatedAt: true });

// ═══════════════════════════════════════════════════
// LEAD INTELLIGENCE — ZoomInfo-grade prospecting
// ═══════════════════════════════════════════════════

// Enriched company database
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  domain: text("domain"),
  website: text("website"),
  industry: text("industry"),
  subIndustry: text("sub_industry"),
  size: text("size"), // 1-10,11-50,51-200,201-500,500-1000,1000+
  employeeCount: integer("employee_count"),
  revenue: text("revenue"), // <1M, 1-10M, 10-50M, 50-100M, 100M+
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
  fundingStage: text("funding_stage"), // seed, series-a, series-b, ipo, bootstrapped
  totalFunding: text("total_funding"),
  lastFundingDate: text("last_funding_date"),
  intentSignals: jsonb("intent_signals").$type<Array<{ signal: string; strength: number; date: string }>>().default([]),
  score: integer("score").default(0), // 0-100 ICP fit score
  tags: jsonb("tags").$type<string[]>().default([]),
  dataSource: text("data_source").default("enriched"),
  lastEnrichedAt: timestamp("last_enriched_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("idx_companies_tenant").on(t.tenantId),
  index("idx_companies_domain").on(t.domain),
]);

// Enriched prospect contacts
export const prospects = pgTable("prospects", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  companyId: uuid("company_id").references(() => companies.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  email: text("email"),
  emailStatus: text("email_status").default("unknown"), // valid, invalid, catch-all, unknown
  workEmail: text("work_email"),
  personalEmail: text("personal_email"),
  phone: text("phone"),
  directPhone: text("direct_phone"),
  mobilePhone: text("mobile_phone"),
  jobTitle: text("job_title"),
  seniority: text("seniority"), // c-suite, vp, director, manager, individual
  department: text("department"), // sales, marketing, engineering, finance, hr, ops
  company: text("company"),
  companyDomain: text("company_domain"),
  linkedinUrl: text("linkedin_url"),
  twitterUrl: text("twitter_url"),
  location: text("location"),
  city: text("city"),
  country: text("country"),
  timezone: text("timezone"),
  bio: text("bio"),
  score: integer("score").default(0), // 0-100 lead score
  intentScore: integer("intent_score").default(0), // buying intent 0-100
  buyingSignals: jsonb("buying_signals").$type<Array<{ signal: string; strength: number; date: string }>>().default([]),
  techStack: jsonb("tech_stack").$type<string[]>().default([]),
  skills: jsonb("skills").$type<string[]>().default([]),
  tags: jsonb("tags").$type<string[]>().default([]),
  // Outreach tracking
  outreachStatus: text("outreach_status").default("new"), // new, contacted, replied, meeting_booked, not_interested, converted
  lastContactedAt: timestamp("last_contacted_at"),
  sequenceId: uuid("sequence_id"),
  // CRM link
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

// Saved prospect searches / lists
export const prospectLists = pgTable("prospect_lists", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
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

// Email sequences for outreach
export const sequences = pgTable("sequences", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("draft"), // draft, active, paused, archived
  steps: jsonb("steps").$type<Array<{
    id: string; stepNumber: number; type: string; // email, linkedin, call, task
    delayDays: number; subject?: string; body?: string; taskTitle?: string;
  }>>().default([]),
  totalEnrolled: integer("total_enrolled").default(0),
  totalReplied: integer("total_replied").default(0),
  totalConverted: integer("total_converted").default(0),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [index("idx_sequences_tenant").on(t.tenantId)]);

// Website visitor tracking
export const websiteVisitors = pgTable("website_visitors", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  visitorId: text("visitor_id"), // anonymous fingerprint
  companyName: text("company_name"),
  companyDomain: text("company_domain"),
  ipAddress: text("ip_address"),
  country: text("country"),
  city: text("city"),
  pages: jsonb("pages").$type<Array<{ url: string; time: number; title: string }>>().default([]),
  sessionCount: integer("session_count").default(1),
  totalTimeOnSite: integer("total_time_on_site").default(0), // seconds
  lastSeen: timestamp("last_seen").defaultNow(),
  firstSeen: timestamp("first_seen").defaultNow(),
  score: integer("score").default(0),
  identifiedAsProspectId: uuid("identified_as_prospect_id").references(() => prospects.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [index("idx_visitors_tenant").on(t.tenantId)]);

// Technographics — tech stack of prospect companies
export const technographics = pgTable("technographics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  companyId: uuid("company_id").references(() => companies.id),
  companyDomain: text("company_domain"),
  technology: text("technology").notNull(),
  category: text("category"), // CRM, ERP, Marketing, Analytics, Engineering, etc.
  vendor: text("vendor"),
  confidence: integer("confidence").default(80), // 0-100
  detectedAt: timestamp("detected_at").defaultNow(),
}, (t) => [index("idx_technographics_company").on(t.companyId)]);

// Intent signals
export const intentSignals = pgTable("intent_signals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  companyDomain: text("company_domain"),
  companyName: text("company_name"),
  topic: text("topic").notNull(), // "CRM software", "Sales automation", etc.
  signalType: text("signal_type").notNull(), // web_research, review_site, job_posting, funding, news
  strength: integer("strength").default(50), // 0-100
  description: text("description"),
  sourceUrl: text("source_url"),
  detectedAt: timestamp("detected_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
}, (t) => [index("idx_intent_tenant").on(t.tenantId)]);

// ═══════════════════════════════════════════════════
// CODE HEALING SYSTEM
// ═══════════════════════════════════════════════════

// System health checks
export const healthChecks = pgTable("health_checks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  checkType: text("check_type").notNull(), // database, server, api, auth, storage, ai_service
  status: text("status").notNull(), // healthy, degraded, critical, offline
  latencyMs: integer("latency_ms"),
  message: text("message"),
  details: jsonb("details").$type<Record<string, any>>().default({}),
  checkedAt: timestamp("checked_at").defaultNow(),
}, (t) => [index("idx_health_type").on(t.checkType)]);

// Error log
export const errorLogs = pgTable("error_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id"),
  severity: text("severity").notNull(), // info, warning, error, critical
  category: text("category").notNull(), // auth, database, api, validation, integration, agent
  message: text("message").notNull(),
  stack: text("stack"),
  context: jsonb("context").$type<Record<string, any>>().default({}),
  userId: uuid("user_id"),
  endpoint: text("endpoint"),
  resolved: boolean("resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: text("resolved_by"), // "auto_healer" | user_id
  healingAttempts: integer("healing_attempts").default(0),
  healingLog: jsonb("healing_log").$type<Array<{ attempt: number; action: string; result: string; timestamp: string }>>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("idx_errors_severity").on(t.severity),
  index("idx_errors_resolved").on(t.resolved),
]);

// Auto-healing rules
export const healingRules = pgTable("healing_rules", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  trigger: text("trigger").notNull(), // error pattern / condition
  pattern: text("pattern").notNull(), // regex or exact match on error message
  category: text("category").notNull(),
  action: text("action").notNull(), // restart_service, clear_cache, fix_schema, retry_connection, etc.
  actionConfig: jsonb("action_config").$type<Record<string, any>>().default({}),
  isActive: boolean("is_active").default(true),
  successCount: integer("success_count").default(0),
  failureCount: integer("failure_count").default(0),
  lastTriggeredAt: timestamp("last_triggered_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Performance metrics
export const performanceMetrics = pgTable("performance_metrics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  metricType: text("metric_type").notNull(), // response_time, memory_usage, cpu_usage, db_connections, error_rate
  value: decimal("value", { precision: 10, scale: 4 }).notNull(),
  unit: text("unit"), // ms, MB, %, count
  endpoint: text("endpoint"),
  tags: jsonb("tags").$type<Record<string, string>>().default({}),
  recordedAt: timestamp("recorded_at").defaultNow(),
}, (t) => [
  index("idx_metrics_type_time").on(t.metricType, t.recordedAt),
]);

// ═══════════════════════════════════════════════════
// SEO PLATFORM (Ubersuggest-grade)
// ═══════════════════════════════════════════════════
export const seoProjects = pgTable("seo_projects", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  domain: text("domain").notNull(),
  country: text("country").default("US"),
  language: text("language").default("en"),
  competitors: jsonb("competitors").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [index("idx_seo_projects_tenant").on(t.tenantId)]);

export const keywords = pgTable("keywords", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  projectId: uuid("project_id").references(() => seoProjects.id),
  keyword: text("keyword").notNull(),
  searchVolume: integer("search_volume").default(0),
  difficulty: integer("difficulty").default(0), // 0-100
  cpc: decimal("cpc", { precision: 8, scale: 2 }).default("0"),
  currentRank: integer("current_rank"),
  previousRank: integer("previous_rank"),
  url: text("url"),
  intent: text("intent"), // informational, navigational, transactional, commercial
  country: text("country").default("US"),
  tags: jsonb("tags").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [index("idx_keywords_tenant").on(t.tenantId)]);

export const backlinks = pgTable("backlinks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  projectId: uuid("project_id").references(() => seoProjects.id),
  sourceUrl: text("source_url").notNull(),
  sourceDomain: text("source_domain"),
  targetUrl: text("target_url").notNull(),
  anchorText: text("anchor_text"),
  domainAuthority: integer("domain_authority").default(0),
  pageAuthority: integer("page_authority").default(0),
  isDoFollow: boolean("is_do_follow").default(true),
  isActive: boolean("is_active").default(true),
  firstSeen: timestamp("first_seen").defaultNow(),
  lastSeen: timestamp("last_seen").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const seoAudits = pgTable("seo_audits", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  projectId: uuid("project_id").references(() => seoProjects.id),
  score: integer("score").default(0), // 0-100
  issues: jsonb("issues").$type<Array<{ type: string; severity: string; description: string; count: number; urls: string[] }>>().default([]),
  summary: jsonb("summary").$type<{ critical: number; warnings: number; passed: number; totalPages: number }>().default({ critical: 0, warnings: 0, passed: 0, totalPages: 0 }),
  crawledAt: timestamp("crawled_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contentIdeas = pgTable("content_ideas", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  projectId: uuid("project_id").references(() => seoProjects.id),
  title: text("title").notNull(),
  keyword: text("keyword"),
  searchVolume: integer("search_volume").default(0),
  difficulty: integer("difficulty").default(0),
  contentType: text("content_type").default("blog"), // blog, video, infographic, guide
  outline: jsonb("outline").$type<string[]>().default([]),
  status: text("status").default("idea"), // idea, writing, published
  createdAt: timestamp("created_at").defaultNow(),
});

// ═══════════════════════════════════════════════════
// E-COMMERCE
// ═══════════════════════════════════════════════════
export const stores = pgTable("stores", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  description: text("description"),
  logo: text("logo"),
  banner: text("banner"),
  currency: text("currency").default("USD"),
  primaryColor: text("primary_color").default("#3b82f6"),
  isPublished: boolean("is_published").default(false),
  domain: text("domain"),
  settings: jsonb("settings").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [index("idx_stores_tenant").on(t.tenantId)]);

export const products = pgTable("products", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
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
  aiScore: integer("ai_score").default(0), // AI recommendation score
  attributes: jsonb("attributes").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [index("idx_products_tenant").on(t.tenantId)]);

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  storeId: uuid("store_id").references(() => stores.id),
  orderNumber: text("order_number").notNull(),
  status: text("status").default("pending"), // pending, processing, shipped, delivered, cancelled, refunded
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  shippingAddress: jsonb("shipping_address").$type<Record<string, any>>().default({}),
  items: jsonb("items").$type<Array<{ productId: string; name: string; qty: number; price: number; total: number }>>().default([]),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default("0"),
  tax: decimal("tax", { precision: 12, scale: 2 }).default("0"),
  shipping: decimal("shipping", { precision: 12, scale: 2 }).default("0"),
  total: decimal("total", { precision: 12, scale: 2 }).default("0"),
  currency: text("currency").default("USD"),
  paymentStatus: text("payment_status").default("unpaid"), // unpaid, paid, refunded
  paymentMethod: text("payment_method"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [index("idx_orders_tenant").on(t.tenantId)]);

// ═══════════════════════════════════════════════════
// FINANCIAL MANAGEMENT
// ═══════════════════════════════════════════════════
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(), // income, expense, transfer
  category: text("category"),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 6 }).default("1"),
  amountUsd: decimal("amount_usd", { precision: 15, scale: 2 }),
  date: timestamp("date").notNull(),
  accountId: text("account_id"),
  contactId: uuid("contact_id").references(() => contacts.id),
  invoiceId: uuid("invoice_id").references(() => invoices.id),
  tags: jsonb("tags").$type<string[]>().default([]),
  reconciled: boolean("reconciled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [index("idx_transactions_tenant").on(t.tenantId)]);

export const bankAccounts = pgTable("bank_accounts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  type: text("type").default("checking"), // checking, savings, credit, crypto
  currency: text("currency").default("USD"),
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0"),
  institution: text("institution"),
  accountNumber: text("account_number"), // last 4 digits only
  isActive: boolean("is_active").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const taxRates = pgTable("tax_rates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  rate: decimal("rate", { precision: 6, scale: 4 }).notNull(), // e.g. 0.2000 for 20%
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
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  email: text("email"),
  phone: text("phone"),
  avatar: text("avatar"),
  department: text("department"),
  jobTitle: text("job_title"),
  employmentType: text("employment_type").default("full_time"), // full_time, part_time, contractor
  status: text("status").default("active"), // active, inactive, on_leave
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

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("planning"), // planning, active, on_hold, completed, cancelled
  priority: text("priority").default("medium"),
  color: text("color").default("#3b82f6"),
  startDate: timestamp("start_date"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  progress: integer("progress").default(0), // 0-100
  ownerId: uuid("owner_id").references(() => users.id),
  members: jsonb("members").$type<string[]>().default([]),
  tags: jsonb("tags").$type<string[]>().default([]),
  dealId: uuid("deal_id").references(() => deals.id),
  contactId: uuid("contact_id").references(() => contacts.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [index("idx_projects_tenant").on(t.tenantId)]);

export const projectTasks = pgTable("project_tasks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
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
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  type: text("type").default("file"), // file, folder, note, template
  mimeType: text("mime_type"),
  size: integer("size").default(0), // bytes
  url: text("url"),
  content: text("content"), // for notes/text docs
  parentId: uuid("parent_id"),
  tags: jsonb("tags").$type<string[]>().default([]),
  sharedWith: jsonb("shared_with").$type<string[]>().default([]),
  uploadedBy: uuid("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [index("idx_documents_tenant").on(t.tenantId)]);

// ═══════════════════════════════════════════════════
// MARKETING
// ═══════════════════════════════════════════════════
export const landingPages = pgTable("landing_pages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  title: text("title"),
  description: text("description"),
  template: text("template").default("blank"),
  blocks: jsonb("blocks").$type<Array<{ id: string; type: string; content: any; style: any }>>().default([]),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at"),
  views: integer("views").default(0),
  conversions: integer("conversions").default(0),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [index("idx_landing_pages_tenant").on(t.tenantId)]);

export const funnels = pgTable("funnels", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  offer: text("offer"), // what are you selling
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

export const abTests = pgTable("ab_tests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  hypothesis: text("hypothesis"),
  status: text("status").default("draft"), // draft, running, paused, completed
  type: text("type").default("email"), // email, landing_page, ad, headline
  variants: jsonb("variants").$type<Array<{ id: string; name: string; content: any; visitors: number; conversions: number }>>().default([]),
  winnerVariantId: text("winner_variant_id"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  significance: decimal("significance", { precision: 6, scale: 4 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [index("idx_ab_tests_tenant").on(t.tenantId)]);

export const reputationReviews = pgTable("reputation_reviews", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  platform: text("platform").notNull(), // google, yelp, g2, trustpilot, capterra
  reviewerName: text("reviewer_name"),
  rating: integer("rating").default(5), // 1-5
  content: text("content"),
  response: text("response"), // business response
  sentiment: text("sentiment").default("positive"), // positive, neutral, negative
  url: text("url"),
  publishedAt: timestamp("published_at"),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [index("idx_reviews_tenant").on(t.tenantId)]);

// ═══════════════════════════════════════════════════
// ENTERPRISE FEATURES
// ═══════════════════════════════════════════════════
export const clientPortalAccess = pgTable("client_portal_access", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
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
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull().unique(),
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

// ─── Additional Types ─────────────────────────────────
export type SeoProject = typeof seoProjects.$inferSelect;
export type Keyword = typeof keywords.$inferSelect;
export type Store = typeof stores.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type ProjectTask = typeof projectTasks.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type LandingPage = typeof landingPages.$inferSelect;
export type Funnel = typeof funnels.$inferSelect;
export type AbTest = typeof abTests.$inferSelect;

export type InsertTenant = typeof tenants.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;
export type Deal = typeof deals.$inferSelect;
export type InsertDeal = typeof deals.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type Prospect = typeof prospects.$inferSelect;
export type ProspectList = typeof prospectLists.$inferSelect;
export type Sequence = typeof sequences.$inferSelect;
export type HealthCheck = typeof healthChecks.$inferSelect;
export type ErrorLog = typeof errorLogs.$inferSelect;

