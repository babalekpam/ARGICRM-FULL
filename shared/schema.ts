import { pgTable, text, integer, boolean, timestamp, numeric, jsonb, varchar, real, date } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// All table definitions mirror the production database exactly.
// Do NOT add columns that don't exist in production — they trigger publish dialogs.

export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
  plan: varchar("plan").notNull().default("free"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status").default("inactive"),
  stripePaymentMethodId: text("stripe_payment_method_id"),
  trialEndsAt: timestamp("trial_ends_at"),
  domain: text("domain"),
  subscriptionPlan: text("subscription_plan").default("starter"),
  maxUsers: integer("max_users").default(5),
  settings: jsonb("settings").default(sql`'{}'::jsonb`),
  isActive: boolean("is_active").default(true),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  tenantId: varchar("tenant_id").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
  isAdmin: boolean("is_admin").notNull().default(false),
  passwordHash: text("password_hash"),
  role: text("role").default("user"),
  isActive: boolean("is_active").default(true),
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  lastLoginAt: timestamp("last_login_at"),
  preferredLanguage: text("preferred_language").default("en"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
});

export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  email: varchar("email"),
  phone: varchar("phone"),
  company: varchar("company"),
  jobTitle: varchar("job_title"),
  status: varchar("status").default("active"),
  source: varchar("source"),
  tags: text("tags").array(),
  notes: text("notes"),
  sentimentScore: numeric("sentiment_score"),
  sentimentLabel: varchar("sentiment_label"),
  lastContactDate: timestamp("last_contact_date"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
  name: varchar("name"),
  accountId: varchar("account_id"),
  leadSource: text("lead_source"),
  assignedTo: varchar("assigned_to"),
  createdBy: varchar("created_by"),
  location: text("location"),
  bio: text("bio"),
  linkedin: text("linkedin"),
  companyWebsite: text("company_website"),
  numberOfEmployees: text("number_of_employees"),
  leadScore: integer("lead_score").default(0),
  lastIntent: text("last_intent"),
  lastChannel: text("last_channel"),
  optIn: boolean("opt_in").default(false),
  locale: text("locale").default("en"),
});

export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  email: varchar("email"),
  phone: varchar("phone"),
  company: varchar("company"),
  jobTitle: varchar("job_title"),
  source: varchar("source"),
  status: varchar("status").default("new"),
  score: integer("score").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
  leadSource: varchar("lead_source"),
  convertedToContactId: varchar("converted_to_contact_id"),
  convertedAt: timestamp("converted_at"),
  createdBy: varchar("created_by"),
});

export const deals = pgTable("deals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  contactId: varchar("contact_id"),
  title: varchar("title").notNull(),
  value: numeric("value"),
  currency: varchar("currency").default("USD"),
  stage: varchar("stage").default("prospect"),
  probability: integer("probability").default(0),
  expectedCloseDate: date("expected_close_date"),
  status: varchar("status").default("open"),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
  accountId: varchar("account_id"),
  name: text("name"),
  amount: numeric("amount"),
  createdBy: varchar("created_by"),
  score: integer("score").default(0),
  nextBestAction: text("next_best_action"),
  lastTouch: timestamp("last_touch"),
  ownerId: varchar("owner_id"),
  source: text("source"),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  userId: varchar("user_id"),
  contactId: varchar("contact_id"),
  dealId: varchar("deal_id"),
  title: varchar("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  priority: varchar("priority").default("medium"),
  status: varchar("status").default("pending"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
  type: text("type"),
  assignedTo: varchar("assigned_to"),
  createdBy: varchar("created_by"),
});

export const accounts = pgTable("accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  name: varchar("name").notNull(),
  industry: varchar("industry"),
  website: varchar("website"),
  phone: varchar("phone"),
  email: varchar("email"),
  address: text("address"),
  city: varchar("city"),
  state: varchar("state"),
  country: varchar("country"),
  postalCode: varchar("postal_code"),
  annualRevenue: numeric("annual_revenue"),
  employeeCount: integer("employee_count"),
  status: varchar("status").default("active"),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
  billingAddress: text("billing_address"),
  shippingAddress: text("shipping_address"),
  accountType: varchar("account_type"),
  parentAccountId: varchar("parent_account_id"),
  employees: integer("employees"),
  ownerId: varchar("owner_id"),
  createdBy: varchar("created_by"),
});

export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  contactId: varchar("contact_id"),
  dealId: varchar("deal_id"),
  type: text("type").notNull(),
  channel: text("channel").notNull(),
  direction: text("direction").notNull(),
  content: text("content").notNull(),
  meta: jsonb("meta").default(sql`'{}'::jsonb`),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  name: varchar("name").notNull(),
  type: varchar("type"),
  status: varchar("status").default("draft"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  budget: numeric("budget"),
  actualCost: numeric("actual_cost"),
  targetAudience: text("target_audience"),
  goals: text("goals"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const keywords = pgTable("keywords", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  keyword: text("keyword").notNull(),
  searchVolume: integer("search_volume").notNull().default(0),
  difficulty: integer("difficulty").notNull().default(0),
  position: integer("position"),
  cpc: real("cpc").default(0),
  trend: text("trend").default("stable"),
  tenantId: varchar("tenant_id").notNull(),
});

export const backlinks = pgTable("backlinks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  url: text("url").notNull(),
  domainScore: integer("domain_score").notNull().default(0),
  anchorText: text("anchor_text"),
  date: text("date").notNull(),
  tenantId: varchar("tenant_id").notNull(),
  source: text("source").notNull().default("ai"),
});

export const stores = pgTable("stores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  tenantId: varchar("tenant_id").notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  currency: varchar("currency").notNull(),
  theme: varchar("theme").default("modern"),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  domain: text("domain").notNull(),
  seoScore: integer("seo_score").notNull().default(0),
  organicTraffic: integer("organic_traffic").notNull().default(0),
  totalBacklinks: integer("total_backlinks").notNull().default(0),
  referringDomains: integer("referring_domains").notNull().default(0),
  totalKeywords: integer("total_keywords").notNull().default(0),
  createdAt: timestamp("created_at").default(sql`now()`),
  tenantId: varchar("tenant_id").notNull(),
});

export const landingPages = pgTable("landing_pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stepId: varchar("step_id").notNull(),
  headline: varchar("headline").notNull(),
  subheadline: varchar("subheadline"),
  heroContent: text("hero_content"),
  benefits: jsonb("benefits"),
  testimonials: jsonb("testimonials"),
  ctaText: varchar("cta_text"),
  faqs: jsonb("faqs"),
  formFields: jsonb("form_fields"),
  stylePreset: varchar("style_preset"),
  customCss: text("custom_css"),
  customScripts: text("custom_scripts"),
  aiGenerationId: varchar("ai_generation_id"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
  ctaUrl: text("cta_url"),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  heroImageUrl: text("hero_image_url"),
});

export const abTests = pgTable("ab_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  targetUrl: text("target_url"),
  status: text("status").notNull().default("draft"),
  trafficSplit: jsonb("traffic_split").default(sql`'{}'::jsonb`),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  winnerVariantId: varchar("winner_variant_id"),
  configuration: jsonb("configuration").default(sql`'{}'::jsonb`),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

// ─── Insert Schemas ────────────────────────────────────────────────────────
export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertContactSchema = createInsertSchema(contacts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLeadSchema = createInsertSchema(leads).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDealSchema = createInsertSchema(deals).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAccountSchema = createInsertSchema(accounts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, createdAt: true });
export const insertCampaignSchema = createInsertSchema(campaigns).omit({ id: true, createdAt: true, updatedAt: true });

// ─── Types ─────────────────────────────────────────────────────────────────
export type InsertTenant = typeof tenants.$inferInsert;
export type Tenant = typeof tenants.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type InsertDeal = typeof deals.$inferInsert;
export type Deal = typeof deals.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;
export type Campaign = typeof campaigns.$inferSelect;
export type Keyword = typeof keywords.$inferSelect;
export type Backlink = typeof backlinks.$inferSelect;
export type Store = typeof stores.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type LandingPage = typeof landingPages.$inferSelect;
export type AbTest = typeof abTests.$inferSelect;
