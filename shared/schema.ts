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
  slug: text("slug").unique().notNull(),
  logo: text("logo"),
  primaryColor: text("primary_color").default("#3b82f6"),
  subscriptionPlan: text("subscription_plan").default("trial"),
  subscriptionStatus: text("subscription_status").default("trialing"),
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
  role: text("role").default("user"),
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
  status: text("status").default("active"),
  source: text("source"),
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
  source: text("source"),
  status: text("status").default("new"),
  score: integer("score").default(0),
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
// DEALS
// ═══════════════════════════════════════════════════
export const deals = pgTable("deals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  pipelineId: uuid("pipeline_id"), // FK removed — pipelines table created via startup migration
  contactId: uuid("contact_id").references(() => contacts.id),
  title: text("title").notNull(),
  stage: text("stage").notNull().default("prospecting"),
  value: decimal("value", { precision: 12, scale: 2 }).default("0"),
  currency: text("currency").default("USD"),
  probability: integer("probability").default(0),
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
  status: text("status").default("todo"),
  priority: text("priority").default("medium"),
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
  size: text("size"),
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
// ACTIVITIES
// ═══════════════════════════════════════════════════
export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  type: text("type").notNull(),
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
  type: text("type").default("email"),
  status: text("status").default("draft"),
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
// SEO — keywords & backlinks (already in prod)
// ═══════════════════════════════════════════════════
export const keywords = pgTable("keywords", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  projectId: uuid("project_id"), // FK removed — seo_projects created via startup migration
  keyword: text("keyword").notNull(),
  searchVolume: integer("search_volume").default(0),
  difficulty: integer("difficulty").default(0),
  cpc: decimal("cpc", { precision: 8, scale: 2 }).default("0"),
  currentRank: integer("current_rank"),
  previousRank: integer("previous_rank"),
  url: text("url"),
  intent: text("intent"),
  country: text("country").default("US"),
  tags: jsonb("tags").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [index("idx_keywords_tenant").on(t.tenantId)]);

export const backlinks = pgTable("backlinks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  projectId: uuid("project_id"), // FK removed — seo_projects created via startup migration
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

// ═══════════════════════════════════════════════════
// E-COMMERCE STORES (already in prod)
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

// ═══════════════════════════════════════════════════
// PROJECTS (already in prod)
// ═══════════════════════════════════════════════════
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("planning"),
  priority: text("priority").default("medium"),
  color: text("color").default("#3b82f6"),
  startDate: timestamp("start_date"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  progress: integer("progress").default(0),
  ownerId: uuid("owner_id").references(() => users.id),
  members: jsonb("members").$type<string[]>().default([]),
  tags: jsonb("tags").$type<string[]>().default([]),
  dealId: uuid("deal_id").references(() => deals.id),
  contactId: uuid("contact_id").references(() => contacts.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [index("idx_projects_tenant").on(t.tenantId)]);

// ═══════════════════════════════════════════════════
// LANDING PAGES (already in prod)
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

// ═══════════════════════════════════════════════════
// A/B TESTS (already in prod)
// ═══════════════════════════════════════════════════
export const abTests = pgTable("ab_tests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  hypothesis: text("hypothesis"),
  status: text("status").default("draft"),
  type: text("type").default("email"),
  variants: jsonb("variants").$type<Array<{ id: string; name: string; content: any; visitors: number; conversions: number }>>().default([]),
  winnerVariantId: text("winner_variant_id"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  significance: decimal("significance", { precision: 6, scale: 4 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [index("idx_ab_tests_tenant").on(t.tenantId)]);

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

// ═══════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════
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
export type Keyword = typeof keywords.$inferSelect;
export type Store = typeof stores.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type LandingPage = typeof landingPages.$inferSelect;
export type AbTest = typeof abTests.$inferSelect;
