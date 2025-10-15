import { pgTable, text, varchar, decimal, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Subscription Plans
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  displayName: varchar("display_name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  billingCycle: varchar("billing_cycle").notNull(), // monthly, annual
  features: jsonb("features").$type<string[]>().notNull(),
  limits: jsonb("limits").$type<{
    users: number;
    contacts: number;
    storage: number; // GB
    emails: number; // per month
    sms: number; // per month
    forms: number;
    apiCalls: number; // per month
  }>().notNull(),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Subscriptions
export const userSubscriptions = pgTable("user_subscriptions", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  planId: varchar("plan_id").notNull(),
  status: varchar("status").notNull(), // active, inactive, trial, expired, cancelled
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  trialEndDate: timestamp("trial_end_date"),
  autoRenew: boolean("auto_renew").default(true),
  paymentMethod: varchar("payment_method"), // stripe, manual, etc
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  stripeCustomerId: varchar("stripe_customer_id"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Package Features
export const packageFeatures = pgTable("package_features", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  displayName: varchar("display_name").notNull(),
  description: text("description"),
  category: varchar("category").notNull(), // core, crm, marketing, analytics, etc
  isCore: boolean("is_core").default(false),
  minPlanRequired: varchar("min_plan_required").notNull(), // starter, professional, enterprise, ultimate
  createdAt: timestamp("created_at").defaultNow(),
});

// Plan Feature Access
export const planFeatureAccess = pgTable("plan_feature_access", {
  id: varchar("id").primaryKey(),
  planId: varchar("plan_id").notNull(),
  featureId: varchar("feature_id").notNull(),
  isEnabled: boolean("is_enabled").default(true),
  customLimits: jsonb("custom_limits").$type<Record<string, any>>(),
});

// Usage Tracking
export const usageTracking = pgTable("usage_tracking", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  subscriptionId: varchar("subscription_id").notNull(),
  metric: varchar("metric").notNull(), // users, contacts, emails_sent, etc
  value: integer("value").notNull(),
  period: varchar("period").notNull(), // monthly, daily
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans);
export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions);
export const insertPackageFeatureSchema = createInsertSchema(packageFeatures);
export const insertPlanFeatureAccessSchema = createInsertSchema(planFeatureAccess);
export const insertUsageTrackingSchema = createInsertSchema(usageTracking);

// Types
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type PackageFeature = typeof packageFeatures.$inferSelect;
export type PlanFeatureAccess = typeof planFeatureAccess.$inferSelect;
export type UsageTracking = typeof usageTracking.$inferSelect;

export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;
export type InsertPackageFeature = z.infer<typeof insertPackageFeatureSchema>;
export type InsertPlanFeatureAccess = z.infer<typeof insertPlanFeatureAccessSchema>;
export type InsertUsageTracking = z.infer<typeof insertUsageTrackingSchema>;