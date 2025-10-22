import { pgTable, text, serial, integer, boolean, timestamp, decimal, date, jsonb, varchar, index, real, uuid, numeric } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Multi-tenant system: Each company gets its own isolated environment
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  domain: text("domain").unique(), // Custom subdomain like company.argilette.com
  subscriptionPlan: text("subscription_plan").default("starter"), // starter, professional, enterprise
  maxUsers: integer("max_users").default(5),
  settings: jsonb("settings").$type<{
    theme?: string;
    timezone?: string;
    currency?: string;
    features?: string[];
  }>().default({}),
  // Stripe integration for payment processing
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripePaymentMethodId: text("stripe_payment_method_id"),
  trialEndsAt: timestamp("trial_ends_at"),
  subscriptionStatus: text("subscription_status").default("trialing"), // trialing, active, past_due, canceled, unpaid
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User management with tenant isolation
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  passwordHash: text("password_hash").notNull(),
  role: text("role").default("user"), // platform_owner, super_admin, admin, manager, user, viewer
  isActive: boolean("is_active").default(true),
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  lastLoginAt: timestamp("last_login_at"),
  preferredLanguage: text("preferred_language").default("en"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_users_tenant_email").on(table.tenantId, table.email),
]);

// Role-based permissions system
export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(), // Sales Manager, Marketing Lead, etc.
  description: text("description"),
  permissions: jsonb("permissions").$type<string[]>().default([]),
  isSystemRole: boolean("is_system_role").default(false), // Cannot be deleted
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_roles_tenant").on(table.tenantId),
]);

// User role assignments
export const userRoles = pgTable("user_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  roleId: uuid("role_id").references(() => roles.id).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
  assignedBy: uuid("assigned_by").references(() => users.id),
}, (table) => [
  index("idx_user_roles_user").on(table.userId),
  index("idx_user_roles_role").on(table.roleId),
]);

// Permission definitions
export const permissions = pgTable("permissions", {
  id: text("id").primaryKey(), // contacts.read, contacts.write, deals.read, etc.
  name: text("name").notNull(),
  description: text("description"),
  module: text("module").notNull(), // contacts, deals, accounts, reports, etc.
  action: text("action").notNull(), // read, write, delete, admin
});

// Session management for multi-tenant
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_sessions_user").on(table.userId),
  index("idx_sessions_tenant").on(table.tenantId),
]);

// Tenant subscriptions with feature entitlements
export const tenantSubscriptions = pgTable("tenant_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  planId: text("plan_id").notNull(), // starter, professional, enterprise, unlimited, platform_owner
  status: text("status").default("active"), // active, canceled, past_due, trial, suspended
  billingCycle: text("billing_cycle").default("monthly"), // monthly, yearly
  currentPeriodStart: timestamp("current_period_start").defaultNow(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),
  canceledAt: timestamp("canceled_at"),
  enabledFeatures: jsonb("enabled_features").$type<string[]>().default([]),
  usageLimits: jsonb("usage_limits").$type<{
    users?: number;
    contacts?: number;
    storage?: number;
    emailsPerMonth?: number;
    smsPerMonth?: number;
    formsPerMonth?: number;
    apiCalls?: number;
  }>().default({}),
  currentUsage: jsonb("current_usage").$type<{
    users?: number;
    contacts?: number;
    storage?: number;
    emailsThisMonth?: number;
    smsThisMonth?: number;
    formsThisMonth?: number;
    apiCallsThisMonth?: number;
  }>().default({}),
  monthlyRevenue: decimal("monthly_revenue", { precision: 10, scale: 2 }).default("0.00"),
  yearlyRevenue: decimal("yearly_revenue", { precision: 10, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_tenant_subscriptions_tenant").on(table.tenantId),
  index("idx_tenant_subscriptions_status").on(table.status),
]);

// Tenant Payment Configuration - for e-commerce stores only
export const tenantPaymentConfigs = pgTable("tenant_payment_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  tenantEmail: text("tenant_email").notNull(),
  
  // Stripe Configuration
  stripePublicKey: text("stripe_public_key"),
  stripeSecretKey: text("stripe_secret_key"), // Encrypted
  stripeWebhookSecret: text("stripe_webhook_secret"), // Encrypted
  stripeEnabled: boolean("stripe_enabled").default(false),
  
  // Visa Configuration
  visaApiKey: text("visa_api_key"), // Encrypted
  visaMerchantId: text("visa_merchant_id"),
  visaEnabled: boolean("visa_enabled").default(false),
  
  // Configuration metadata
  defaultProvider: text("default_provider").default("stripe"), // stripe, visa
  testMode: boolean("test_mode").default(true),
  
  // Settings and preferences for e-commerce only
  settings: jsonb("settings").$type<{
    currencies?: string[];
    webhookUrl?: string;
    failoverProvider?: string;
    autoSwitchOnFailure?: boolean;
    transactionFeeHandling?: 'merchant' | 'customer' | 'split';
    minimumAmount?: number;
    maximumAmount?: number;
    ecommerceOnly?: boolean; // Always true - this is only for e-commerce
  }>().default({ ecommerceOnly: true }),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastUsed: timestamp("last_used"),
  
  // Status
  isActive: boolean("is_active").default(true),
  verificationStatus: text("verification_status").default("pending"), // pending, verified, failed
}, (table) => [
  index("idx_tenant_payment_configs_tenant").on(table.tenantId),
  index("idx_tenant_payment_configs_email").on(table.tenantEmail),
]);

// Tenant E-commerce Payment Transactions Log
export const tenantPaymentTransactions = pgTable("tenant_payment_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  configId: uuid("config_id").references(() => tenantPaymentConfigs.id),
  
  // Transaction details
  transactionId: text("transaction_id").notNull(),
  externalTransactionId: text("external_transaction_id"), // From payment provider
  provider: text("provider").notNull(), // stripe, visa
  amount: text("amount").notNull(), // Store as string to avoid floating point issues
  currency: text("currency").notNull(),
  
  // Transaction status
  status: text("status").notNull(), // pending, completed, failed, refunded
  paymentMethod: text("payment_method"), // card, bank_transfer, wallet
  
  // Customer information
  customerEmail: text("customer_email"),
  customerName: text("customer_name"),
  
  // E-commerce specific
  storeId: text("store_id"), // Which e-commerce store this payment is for
  orderId: text("order_id"),
  productIds: jsonb("product_ids").$type<string[]>(),
  
  // Metadata
  description: text("description"),
  metadata: jsonb("metadata"),
  
  // Provider response
  providerResponse: jsonb("provider_response"),
  errorMessage: text("error_message"),
  
  // Revenue sharing - payments go to platform owner
  platformFee: text("platform_fee"), // Fee taken by platform
  tenantAmount: text("tenant_amount"), // Amount that would go to tenant (for reporting)
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("idx_tenant_payment_transactions_tenant").on(table.tenantId),
  index("idx_tenant_payment_transactions_store").on(table.storeId),
  index("idx_tenant_payment_transactions_status").on(table.status),
]);

// Audit logs for tracking all platform activities
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id),
  userId: uuid("user_id").references(() => users.id),
  action: text("action").notNull(), // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
  resource: text("resource").notNull(), // contacts, deals, settings, etc.
  resourceId: text("resource_id"), // ID of the affected resource
  details: jsonb("details").$type<{
    before?: any;
    after?: any;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  }>().default({}),
  severity: text("severity").default("info"), // info, warning, error, critical
  outcome: text("outcome").default("success"), // success, failure, partial
  timestamp: timestamp("timestamp").defaultNow(),
  expiresAt: timestamp("expires_at"), // For automatic cleanup
}, (table) => [
  index("idx_audit_logs_tenant").on(table.tenantId),
  index("idx_audit_logs_user").on(table.userId),
  index("idx_audit_logs_action").on(table.action),
  index("idx_audit_logs_timestamp").on(table.timestamp),
]);

// System metrics for platform monitoring
export const systemMetrics = pgTable("system_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  metricType: text("metric_type").notNull(), // revenue, users, performance, errors
  metricName: text("metric_name").notNull(), // daily_revenue, active_users, response_time
  value: decimal("value", { precision: 15, scale: 4 }).notNull(),
  unit: text("unit"), // USD, count, ms, percent
  tags: jsonb("tags").$type<Record<string, string>>().default({}),
  timestamp: timestamp("timestamp").defaultNow(),
  aggregationPeriod: text("aggregation_period"), // hour, day, week, month
}, (table) => [
  index("idx_system_metrics_type").on(table.metricType),
  index("idx_system_metrics_timestamp").on(table.timestamp),
]);

// ==================== ADVANCED PROJECT MANAGEMENT ====================

// Enhanced projects with Gantt chart support - matching actual database structure
export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id"),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("planning"), // planning, active, on_hold, completed, cancelled
  priority: text("priority").default("medium"), // low, medium, high, critical
  startDate: date("start_date"),
  endDate: date("end_date"),
  plannedStartDate: date("planned_start_date"),
  plannedEndDate: date("planned_end_date"),
  budget: decimal("budget"),
  actualCost: decimal("actual_cost"),
  progress: integer("progress").default(0), // 0-100
  managerId: integer("manager_id"),
  accountId: integer("account_id"),
  clientId: text("client_id"),
  customFields: jsonb("custom_fields").$type<Record<string, any>>().default({}),
  tags: text("tags").array(),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_projects_tenant").on(table.tenantId),
  index("idx_projects_status").on(table.status),
]);

// Project tasks with dependencies for Gantt charts
export const projectTasks = pgTable("project_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  projectId: uuid("project_id").references(() => projects.id).notNull(),
  parentTaskId: uuid("parent_task_id").references(() => projectTasks.id),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("todo"), // todo, in_progress, review, done, blocked
  priority: text("priority").default("medium"), // low, medium, high, critical
  startDate: date("start_date"),
  endDate: date("end_date"),
  plannedHours: integer("planned_hours"),
  actualHours: integer("actual_hours"),
  progress: integer("progress").default(0), // 0-100
  assigneeId: uuid("assignee_id").references(() => users.id),
  dependencies: jsonb("dependencies").$type<string[]>().default([]), // Task IDs this task depends on
  tags: jsonb("tags").$type<string[]>().default([]),
  customFields: jsonb("custom_fields").$type<Record<string, any>>().default({}),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_project_tasks_tenant").on(table.tenantId),
  index("idx_project_tasks_project").on(table.projectId),
  index("idx_project_tasks_assignee").on(table.assigneeId),
  index("idx_project_tasks_status").on(table.status),
]);

// Resource allocation and capacity planning
export const resourceAllocations = pgTable("resource_allocations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  projectId: uuid("project_id").references(() => projects.id).notNull(),
  taskId: uuid("task_id").references(() => projectTasks.id),
  userId: uuid("user_id").references(() => users.id).notNull(),
  allocatedHours: integer("allocated_hours").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  utilizationPercent: integer("utilization_percent").default(100), // 0-100
  billableRate: decimal("billable_rate", { precision: 10, scale: 2 }),
  status: text("status").default("planned"), // planned, active, completed
  notes: text("notes"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_resource_allocations_tenant").on(table.tenantId),
  index("idx_resource_allocations_project").on(table.projectId),
  index("idx_resource_allocations_user").on(table.userId),
]);

// Time tracking for projects and tasks
export const timeEntries = pgTable("time_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  projectId: uuid("project_id").references(() => projects.id),
  taskId: uuid("task_id").references(() => projectTasks.id),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in minutes
  billable: boolean("billable").default(true),
  billableRate: decimal("billable_rate", { precision: 10, scale: 2 }),
  status: text("status").default("completed"), // running, completed, approved, invoiced
  tags: jsonb("tags").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_time_entries_tenant").on(table.tenantId),
  index("idx_time_entries_user").on(table.userId),
  index("idx_time_entries_project").on(table.projectId),
  index("idx_time_entries_date").on(table.startTime),
]);

// ==================== ENHANCED HR MANAGEMENT ====================

// Performance management
export const performanceReviews = pgTable("performance_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  employeeId: uuid("employee_id").references(() => users.id).notNull(),
  reviewerId: uuid("reviewer_id").references(() => users.id).notNull(),
  reviewPeriod: text("review_period").notNull(), // Q1-2024, Annual-2024, etc.
  reviewType: text("review_type").default("annual"), // annual, quarterly, monthly, project
  status: text("status").default("draft"), // draft, in_progress, completed, approved
  overallRating: integer("overall_rating"), // 1-5 scale
  goals: jsonb("goals").$type<Array<{
    id: string;
    title: string;
    description: string;
    target: string;
    achievement: string;
    rating: number;
    weight: number;
  }>>().default([]),
  competencies: jsonb("competencies").$type<Array<{
    id: string;
    name: string;
    description: string;
    rating: number;
    comments: string;
  }>>().default([]),
  strengths: text("strengths"),
  areasForImprovement: text("areas_for_improvement"),
  developmentPlan: text("development_plan"),
  reviewerComments: text("reviewer_comments"),
  employeeComments: text("employee_comments"),
  hrComments: text("hr_comments"),
  reviewDate: date("review_date"),
  dueDate: date("due_date"),
  completedDate: date("completed_date"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_performance_reviews_tenant").on(table.tenantId),
  index("idx_performance_reviews_employee").on(table.employeeId),
  index("idx_performance_reviews_reviewer").on(table.reviewerId),
  index("idx_performance_reviews_period").on(table.reviewPeriod),
]);

// Employee attendance and time tracking
export const attendanceRecords = pgTable("attendance_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  employeeId: uuid("employee_id").references(() => users.id).notNull(),
  date: date("date").notNull(),
  clockInTime: timestamp("clock_in_time"),
  clockOutTime: timestamp("clock_out_time"),
  totalHours: decimal("total_hours", { precision: 4, scale: 2 }),
  regularHours: decimal("regular_hours", { precision: 4, scale: 2 }),
  overtimeHours: decimal("overtime_hours", { precision: 4, scale: 2 }),
  breakTime: integer("break_time"), // in minutes
  status: text("status").default("present"), // present, absent, late, half_day, sick, vacation
  notes: text("notes"),
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_attendance_records_tenant").on(table.tenantId),
  index("idx_attendance_records_employee").on(table.employeeId),
  index("idx_attendance_records_date").on(table.date),
]);

// Leave management
export const leaveRequests = pgTable("leave_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  employeeId: uuid("employee_id").references(() => users.id).notNull(),
  leaveType: text("leave_type").notNull(), // vacation, sick, personal, maternity, bereavement
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  totalDays: integer("total_days").notNull(),
  reason: text("reason"),
  status: text("status").default("pending"), // pending, approved, denied, cancelled
  approverId: uuid("approver_id").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  approverComments: text("approver_comments"),
  emergencyContact: text("emergency_contact"),
  handoverNotes: text("handover_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_leave_requests_tenant").on(table.tenantId),
  index("idx_leave_requests_employee").on(table.employeeId),
  index("idx_leave_requests_status").on(table.status),
]);

// ==================== INVENTORY & ORDER MANAGEMENT ====================

// Product catalog
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  sku: text("sku").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  brand: text("brand"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
  currency: text("currency").default("USD"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0.00"),
  weight: decimal("weight", { precision: 8, scale: 2 }),
  dimensions: jsonb("dimensions").$type<{
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  }>().default({}),
  images: jsonb("images").$type<string[]>().default([]),
  status: text("status").default("active"), // active, inactive, discontinued
  trackInventory: boolean("track_inventory").default(true),
  stockQuantity: integer("stock_quantity").default(0),
  minStockLevel: integer("min_stock_level").default(10),
  maxStockLevel: integer("max_stock_level"),
  reorderPoint: integer("reorder_point").default(5),
  supplier: text("supplier"),
  barcode: text("barcode"),
  tags: jsonb("tags").$type<string[]>().default([]),
  customFields: jsonb("custom_fields").$type<Record<string, any>>().default({}),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_products_tenant").on(table.tenantId),
  index("idx_products_sku").on(table.sku),
  index("idx_products_category").on(table.category),
  index("idx_products_status").on(table.status),
]);

// Inventory movements
export const inventoryMovements = pgTable("inventory_movements", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  productId: uuid("product_id").references(() => products.id).notNull(),
  movementType: text("movement_type").notNull(), // in, out, adjustment, transfer
  quantity: integer("quantity").notNull(),
  previousQuantity: integer("previous_quantity").notNull(),
  newQuantity: integer("new_quantity").notNull(),
  reason: text("reason"), // sale, purchase, return, adjustment, damage, etc.
  referenceId: uuid("reference_id"), // Order ID, Invoice ID, etc.
  referenceType: text("reference_type"), // order, invoice, return, adjustment
  notes: text("notes"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_inventory_movements_tenant").on(table.tenantId),
  index("idx_inventory_movements_product").on(table.productId),
  index("idx_inventory_movements_type").on(table.movementType),
  index("idx_inventory_movements_date").on(table.createdAt),
]);

// Purchase orders
export const purchaseOrders = pgTable("purchase_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  poNumber: text("po_number").notNull(),
  supplierId: uuid("supplier_id").references(() => contacts.id).notNull(),
  orderDate: date("order_date").notNull(),
  expectedDeliveryDate: date("expected_delivery_date"),
  actualDeliveryDate: date("actual_delivery_date"),
  status: text("status").default("draft"), // draft, sent, confirmed, partial, delivered, cancelled
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0.00"),
  shippingAmount: decimal("shipping_amount", { precision: 10, scale: 2 }).default("0.00"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  paymentTerms: text("payment_terms"),
  shippingAddress: jsonb("shipping_address").$type<{
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  }>().default({}),
  notes: text("notes"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_purchase_orders_tenant").on(table.tenantId),
  index("idx_purchase_orders_supplier").on(table.supplierId),
  index("idx_purchase_orders_status").on(table.status),
  index("idx_purchase_orders_date").on(table.orderDate),
]);

// Purchase order items
export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  purchaseOrderId: uuid("purchase_order_id").references(() => purchaseOrders.id).notNull(),
  productId: uuid("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  receivedQuantity: integer("received_quantity").default(0),
  status: text("status").default("pending"), // pending, partial, received, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_purchase_order_items_tenant").on(table.tenantId),
  index("idx_purchase_order_items_po").on(table.purchaseOrderId),
  index("idx_purchase_order_items_product").on(table.productId),
]);

// ==================== E-COMMERCE PLATFORM ====================

// Online stores (tenant-specific storefronts)
export const stores = pgTable("stores", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  userId: text("user_id").notNull(), // Required field for store ownership
  name: text("name").notNull(),
  description: text("description"),
  subdomain: text("subdomain").unique(), // custom-store.nodecrm.com
  customDomain: text("custom_domain"), // www.mystore.com
  logo: text("logo"),
  favicon: text("favicon"),
  primaryColor: text("primary_color").default("#3b82f6"),
  secondaryColor: text("secondary_color").default("#1f2937"),
  theme: text("theme").default("modern"), // modern, classic, minimal, custom
  currency: text("currency").default("USD"),
  timezone: text("timezone").default("UTC"),
  language: text("language").default("en"),
  status: text("status").default("active"), // active, inactive, maintenance
  isPublic: boolean("is_public").default(true),
  seoSettings: jsonb("seo_settings").$type<{
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    ogImage?: string;
  }>().default({}),
  socialLinks: jsonb("social_links").$type<{
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  }>().default({}),
  paymentMethods: jsonb("payment_methods").$type<{
    stripe?: boolean;
    paypal?: boolean;
    applePay?: boolean;
    googlePay?: boolean;
    bankTransfer?: boolean;
  }>().default({}),
  shippingSettings: jsonb("shipping_settings").$type<{
    freeShippingThreshold?: number;
    shippingRates?: Array<{
      name: string;
      price: number;
      estimatedDays: string;
    }>;
  }>().default({}),
  taxSettings: jsonb("tax_settings").$type<{
    includeTax?: boolean;
    taxRate?: number;
    taxName?: string;
  }>().default({}),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_stores_tenant").on(table.tenantId),
  index("idx_stores_subdomain").on(table.subdomain),
]);

// Enhanced product catalog for e-commerce
export const ecommerceProducts = pgTable("ecommerce_products", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  storeId: uuid("store_id").references(() => stores.id).notNull(),
  sku: text("sku").notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull(), // SEO-friendly URL
  shortDescription: text("short_description"),
  longDescription: text("long_description"),
  productType: text("product_type").default("physical"), // physical, digital, service, subscription
  category: text("category"),
  subcategory: text("subcategory"),
  brand: text("brand"),
  tags: jsonb("tags").$type<string[]>().default([]),
  
  // Pricing
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
  compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
  currency: text("currency").default("USD"),
  taxable: boolean("taxable").default(true),
  
  // Inventory
  trackInventory: boolean("track_inventory").default(true),
  stockQuantity: integer("stock_quantity").default(0),
  allowBackorders: boolean("allow_backorders").default(false),
  lowStockThreshold: integer("low_stock_threshold").default(10),
  
  // SEO and Marketing
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  seoKeywords: jsonb("seo_keywords").$type<string[]>().default([]),
  featured: boolean("featured").default(false),
  
  // Media
  images: jsonb("images").$type<Array<{
    url: string;
    alt: string;
    primary?: boolean;
  }>>().default([]),
  videos: jsonb("videos").$type<Array<{
    url: string;
    thumbnail: string;
    title?: string;
  }>>().default([]),
  
  // Shipping
  weight: decimal("weight", { precision: 8, scale: 3 }),
  dimensions: jsonb("dimensions").$type<{
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  }>().default({}),
  shippingClass: text("shipping_class"),
  
  // Status and visibility
  status: text("status").default("draft"), // draft, active, archived
  visibility: text("visibility").default("visible"), // visible, hidden, password
  publishedAt: timestamp("published_at"),
  
  // Advanced features
  variants: boolean("has_variants").default(false),
  customFields: jsonb("custom_fields").$type<Record<string, any>>().default({}),
  relatedProducts: jsonb("related_products").$type<string[]>().default([]),
  crossSells: jsonb("cross_sells").$type<string[]>().default([]),
  upSells: jsonb("up_sells").$type<string[]>().default([]),
  
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_ecommerce_products_tenant").on(table.tenantId),
  index("idx_ecommerce_products_store").on(table.storeId),
  index("idx_ecommerce_products_sku").on(table.sku),
  index("idx_ecommerce_products_slug").on(table.slug),
  index("idx_ecommerce_products_status").on(table.status),
  index("idx_ecommerce_products_category").on(table.category),
]);

// Product variants (size, color, etc.)
export const productVariants = pgTable("product_variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  productId: uuid("product_id").references(() => ecommerceProducts.id).notNull(),
  sku: text("sku").notNull(),
  name: text("name").notNull(),
  options: jsonb("options").$type<Record<string, string>>().default({}), // {size: "Large", color: "Red"}
  price: decimal("price", { precision: 10, scale: 2 }),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
  stockQuantity: integer("stock_quantity").default(0),
  image: text("image"),
  weight: decimal("weight", { precision: 8, scale: 3 }),
  barcode: text("barcode"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_product_variants_tenant").on(table.tenantId),
  index("idx_product_variants_product").on(table.productId),
  index("idx_product_variants_sku").on(table.sku),
]);

// Product categories and collections
export const productCategories = pgTable("product_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  storeId: uuid("store_id").references(() => stores.id).notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  parentId: uuid("parent_id").references(() => productCategories.id),
  image: text("image"),
  sortOrder: integer("sort_order").default(0),
  isVisible: boolean("is_visible").default(true),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_product_categories_tenant").on(table.tenantId),
  index("idx_product_categories_store").on(table.storeId),
  index("idx_product_categories_parent").on(table.parentId),
]);

// Customer accounts for e-commerce
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  storeId: uuid("store_id").references(() => stores.id).notNull(),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  dateOfBirth: date("date_of_birth"),
  gender: text("gender"),
  passwordHash: text("password_hash"),
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: text("email_verification_token"),
  isActive: boolean("is_active").default(true),
  acceptsMarketing: boolean("accepts_marketing").default(false),
  tags: jsonb("tags").$type<string[]>().default([]),
  notes: text("notes"),
  totalOrders: integer("total_orders").default(0),
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).default("0.00"),
  averageOrderValue: decimal("average_order_value", { precision: 10, scale: 2 }).default("0.00"),
  lastOrderAt: timestamp("last_order_at"),
  lastActiveAt: timestamp("last_active_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_customers_tenant").on(table.tenantId),
  index("idx_customers_store").on(table.storeId),
  index("idx_customers_email").on(table.email),
]);

// Customer addresses
export const customerAddresses = pgTable("customer_addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  customerId: uuid("customer_id").references(() => customers.id).notNull(),
  type: text("type").default("shipping"), // shipping, billing
  firstName: text("first_name"),
  lastName: text("last_name"),
  company: text("company"),
  address1: text("address1").notNull(),
  address2: text("address2"),
  city: text("city").notNull(),
  state: text("state"),
  zipCode: text("zip_code").notNull(),
  country: text("country").notNull(),
  phone: text("phone"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_customer_addresses_tenant").on(table.tenantId),
  index("idx_customer_addresses_customer").on(table.customerId),
]);

// E-commerce orders
export const ecommerceOrders = pgTable("ecommerce_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  storeId: uuid("store_id").references(() => stores.id).notNull(),
  orderNumber: text("order_number").notNull().unique(),
  customerId: uuid("customer_id").references(() => customers.id),
  
  // Order status
  status: text("status").default("pending"), // pending, processing, shipped, delivered, cancelled, refunded
  financialStatus: text("financial_status").default("pending"), // pending, paid, partially_paid, refunded, voided
  fulfillmentStatus: text("fulfillment_status").default("unfulfilled"), // unfulfilled, partial, fulfilled
  
  // Customer information
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  customerNotes: text("customer_notes"),
  
  // Pricing
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0.00"),
  shippingAmount: decimal("shipping_amount", { precision: 10, scale: 2 }).default("0.00"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0.00"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  
  // Addresses
  shippingAddress: jsonb("shipping_address").$type<{
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    state?: string;
    zipCode: string;
    country: string;
    phone?: string;
  }>(),
  billingAddress: jsonb("billing_address").$type<{
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    state?: string;
    zipCode: string;
    country: string;
    phone?: string;
  }>(),
  
  // Payment and shipping
  paymentMethod: text("payment_method"),
  paymentGateway: text("payment_gateway"),
  transactionId: text("transaction_id"),
  shippingMethod: text("shipping_method"),
  trackingNumber: text("tracking_number"),
  trackingUrl: text("tracking_url"),
  
  // Dates
  orderDate: timestamp("order_date").defaultNow(),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  cancelledAt: timestamp("cancelled_at"),
  
  // Additional fields
  tags: jsonb("tags").$type<string[]>().default([]),
  internalNotes: text("internal_notes"),
  source: text("source").default("online_store"), // online_store, pos, api, manual
  
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_ecommerce_orders_tenant").on(table.tenantId),
  index("idx_ecommerce_orders_store").on(table.storeId),
  index("idx_ecommerce_orders_customer").on(table.customerId),
  index("idx_ecommerce_orders_status").on(table.status),
  index("idx_ecommerce_orders_date").on(table.orderDate),
]);

// Order line items
export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  orderId: uuid("order_id").references(() => ecommerceOrders.id).notNull(),
  productId: uuid("product_id").references(() => ecommerceProducts.id).notNull(),
  variantId: uuid("variant_id").references(() => productVariants.id),
  sku: text("sku").notNull(),
  productName: text("product_name").notNull(),
  variantTitle: text("variant_title"),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0.00"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0.00"),
  fulfillmentStatus: text("fulfillment_status").default("unfulfilled"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_order_items_tenant").on(table.tenantId),
  index("idx_order_items_order").on(table.orderId),
  index("idx_order_items_product").on(table.productId),
]);

// Shopping cart for guests and customers
export const shoppingCarts = pgTable("shopping_carts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  storeId: uuid("store_id").references(() => stores.id).notNull(),
  customerId: uuid("customer_id").references(() => customers.id),
  sessionId: text("session_id"), // For guest users
  items: jsonb("items").$type<Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>>().default([]),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).default("0.00"),
  discountCodes: jsonb("discount_codes").$type<string[]>().default([]),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0.00"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_shopping_carts_tenant").on(table.tenantId),
  index("idx_shopping_carts_store").on(table.storeId),
  index("idx_shopping_carts_customer").on(table.customerId),
  index("idx_shopping_carts_session").on(table.sessionId),
]);

// Discount codes and promotions
export const discountCodes = pgTable("discount_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  storeId: uuid("store_id").references(() => stores.id).notNull(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // percentage, fixed_amount, free_shipping
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  minimumAmount: decimal("minimum_amount", { precision: 10, scale: 2 }),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").default(0),
  customerUsageLimit: integer("customer_usage_limit"),
  applicableProducts: jsonb("applicable_products").$type<string[]>().default([]),
  applicableCategories: jsonb("applicable_categories").$type<string[]>().default([]),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_discount_codes_tenant").on(table.tenantId),
  index("idx_discount_codes_store").on(table.storeId),
  index("idx_discount_codes_code").on(table.code),
]);

// ==================== DOCUMENT MANAGEMENT ====================

// Document storage and version control
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  fileType: text("file_type").notNull(),
  filePath: text("file_path").notNull(),
  fileHash: text("file_hash"), // For duplicate detection
  version: integer("version").default(1),
  parentDocumentId: uuid("parent_document_id").references(() => documents.id),
  folderId: uuid("folder_id").references(() => documentFolders.id),
  status: text("status").default("active"), // active, archived, deleted
  accessLevel: text("access_level").default("private"), // private, team, company, public
  tags: jsonb("tags").$type<string[]>().default([]),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  uploadedBy: uuid("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_documents_tenant").on(table.tenantId),
  index("idx_documents_folder").on(table.folderId),
  index("idx_documents_parent").on(table.parentDocumentId),
  index("idx_documents_status").on(table.status),
]);

// Document folders
export const documentFolders = pgTable("document_folders", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  parentFolderId: uuid("parent_folder_id").references(() => documentFolders.id),
  path: text("path").notNull(),
  accessLevel: text("access_level").default("private"), // private, team, company, public
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_document_folders_tenant").on(table.tenantId),
  index("idx_document_folders_parent").on(table.parentFolderId),
]);

// Document approval workflows
export const documentApprovals = pgTable("document_approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  documentId: uuid("document_id").references(() => documents.id).notNull(),
  workflowId: uuid("workflow_id").references(() => approvalWorkflows.id).notNull(),
  status: text("status").default("pending"), // pending, approved, rejected, cancelled
  currentStep: integer("current_step").default(1),
  totalSteps: integer("total_steps").notNull(),
  submittedBy: uuid("submitted_by").references(() => users.id),
  submittedAt: timestamp("submitted_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_document_approvals_tenant").on(table.tenantId),
  index("idx_document_approvals_document").on(table.documentId),
  index("idx_document_approvals_workflow").on(table.workflowId),
  index("idx_document_approvals_status").on(table.status),
]);

// Approval workflows
export const approvalWorkflows = pgTable("approval_workflows", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  steps: jsonb("steps").$type<Array<{
    stepNumber: number;
    name: string;
    approverId: string;
    approverRole?: string;
    required: boolean;
    parallelApproval?: boolean;
  }>>().default([]),
  documentTypes: jsonb("document_types").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_approval_workflows_tenant").on(table.tenantId),
  index("idx_approval_workflows_active").on(table.isActive),
]);

// Document approval steps
export const documentApprovalSteps = pgTable("document_approval_steps", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  documentApprovalId: uuid("document_approval_id").references(() => documentApprovals.id).notNull(),
  stepNumber: integer("step_number").notNull(),
  approverId: uuid("approver_id").references(() => users.id).notNull(),
  status: text("status").default("pending"), // pending, approved, rejected, skipped
  decision: text("decision"), // approve, reject, delegate
  comments: text("comments"),
  decidedAt: timestamp("decided_at"),
  delegatedTo: uuid("delegated_to").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_document_approval_steps_tenant").on(table.tenantId),
  index("idx_document_approval_steps_approval").on(table.documentApprovalId),
  index("idx_document_approval_steps_approver").on(table.approverId),
  index("idx_document_approval_steps_status").on(table.status),
]);

// ==================== TERRITORY MANAGEMENT ====================

// Sales territories
export const territories = pgTable("territories", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  territoryType: text("territory_type").notNull(), // geographic, account_based, industry, hybrid
  parentTerritoryId: uuid("parent_territory_id").references(() => territories.id),
  managerId: uuid("manager_id").references(() => users.id),
  geographicBounds: jsonb("geographic_bounds").$type<{
    countries?: string[];
    states?: string[];
    cities?: string[];
    zipCodes?: string[];
    coordinates?: Array<{ lat: number; lng: number }>;
  }>().default({}),
  accountCriteria: jsonb("account_criteria").$type<{
    industries?: string[];
    companySize?: string[];
    revenue?: { min?: number; max?: number };
    customFields?: Record<string, any>;
  }>().default({}),
  quotas: jsonb("quotas").$type<{
    annual?: number;
    quarterly?: number;
    monthly?: number;
    currency?: string;
  }>().default({}),
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_territories_tenant").on(table.tenantId),
  index("idx_territories_manager").on(table.managerId),
  index("idx_territories_parent").on(table.parentTerritoryId),
  index("idx_territories_type").on(table.territoryType),
]);

// Territory assignments
export const territoryAssignments = pgTable("territory_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  territoryId: uuid("territory_id").references(() => territories.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  role: text("role").default("rep"), // rep, manager, support
  assignedAt: timestamp("assigned_at").defaultNow(),
  assignedBy: uuid("assigned_by").references(() => users.id),
  isActive: boolean("is_active").default(true),
  quotas: jsonb("quotas").$type<{
    annual?: number;
    quarterly?: number;
    monthly?: number;
    currency?: string;
  }>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_territory_assignments_tenant").on(table.tenantId),
  index("idx_territory_assignments_territory").on(table.territoryId),
  index("idx_territory_assignments_user").on(table.userId),
]);

// Account territory assignments
export const accountTerritoryAssignments = pgTable("account_territory_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  accountId: uuid("account_id").references(() => accounts.id).notNull(),
  territoryId: uuid("territory_id").references(() => territories.id).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
  assignedBy: uuid("assigned_by").references(() => users.id),
  isActive: boolean("is_active").default(true),
  assignmentReason: text("assignment_reason"), // geographic, strategic, custom
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_account_territory_assignments_tenant").on(table.tenantId),
  index("idx_account_territory_assignments_account").on(table.accountId),
  index("idx_account_territory_assignments_territory").on(table.territoryId),
]);

// ==================== ADVANCED ACCOUNTING ====================

// Chart of accounts
export const chartOfAccounts = pgTable("chart_of_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  accountCode: text("account_code").notNull(),
  accountName: text("account_name").notNull(),
  accountType: text("account_type").notNull(), // asset, liability, equity, revenue, expense
  parentAccountId: uuid("parent_account_id").references(() => chartOfAccounts.id),
  subType: text("sub_type"), // current_asset, fixed_asset, current_liability, etc.
  normalBalance: text("normal_balance").notNull(), // debit, credit
  description: text("description"),
  isActive: boolean("is_active").default(true),
  isBankAccount: boolean("is_bank_account").default(false),
  bankAccountDetails: jsonb("bank_account_details").$type<{
    accountNumber?: string;
    routingNumber?: string;
    bankName?: string;
    accountType?: string;
  }>().default({}),
  taxCode: text("tax_code"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_chart_of_accounts_tenant").on(table.tenantId),
  index("idx_chart_of_accounts_code").on(table.accountCode),
  index("idx_chart_of_accounts_type").on(table.accountType),
  index("idx_chart_of_accounts_parent").on(table.parentAccountId),
]);

// Journal entries
export const journalEntries = pgTable("journal_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  entryNumber: text("entry_number").notNull(),
  entryDate: date("entry_date").notNull(),
  description: text("description").notNull(),
  reference: text("reference"),
  totalDebit: decimal("total_debit", { precision: 15, scale: 2 }).notNull(),
  totalCredit: decimal("total_credit", { precision: 15, scale: 2 }).notNull(),
  status: text("status").default("draft"), // draft, posted, reversed
  reversalEntryId: uuid("reversal_entry_id").references(() => journalEntries.id),
  isAdjustment: boolean("is_adjustment").default(false),
  adjustmentReason: text("adjustment_reason"),
  recurringEntryId: uuid("recurring_entry_id").references(() => recurringEntries.id),
  createdBy: uuid("created_by").references(() => users.id),
  postedBy: uuid("posted_by").references(() => users.id),
  postedAt: timestamp("posted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_journal_entries_tenant").on(table.tenantId),
  index("idx_journal_entries_number").on(table.entryNumber),
  index("idx_journal_entries_date").on(table.entryDate),
  index("idx_journal_entries_status").on(table.status),
]);

// Journal entry line items
export const journalEntryLineItems = pgTable("journal_entry_line_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  journalEntryId: uuid("journal_entry_id").references(() => journalEntries.id).notNull(),
  accountId: uuid("account_id").references(() => chartOfAccounts.id).notNull(),
  description: text("description"),
  debitAmount: decimal("debit_amount", { precision: 15, scale: 2 }).default("0.00"),
  creditAmount: decimal("credit_amount", { precision: 15, scale: 2 }).default("0.00"),
  reference: text("reference"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_journal_entry_line_items_tenant").on(table.tenantId),
  index("idx_journal_entry_line_items_entry").on(table.journalEntryId),
  index("idx_journal_entry_line_items_account").on(table.accountId),
]);

// Recurring journal entries
export const recurringEntries = pgTable("recurring_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  frequency: text("frequency").notNull(), // daily, weekly, monthly, quarterly, yearly
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  nextRunDate: date("next_run_date").notNull(),
  lastRunDate: date("last_run_date"),
  isActive: boolean("is_active").default(true),
  template: jsonb("template").$type<{
    description: string;
    lineItems: Array<{
      accountId: string;
      description: string;
      debitAmount?: number;
      creditAmount?: number;
    }>;
  }>().notNull(),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_recurring_entries_tenant").on(table.tenantId),
  index("idx_recurring_entries_next_run").on(table.nextRunDate),
  index("idx_recurring_entries_active").on(table.isActive),
]);

// Financial periods
export const financialPeriods = pgTable("financial_periods", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  periodType: text("period_type").notNull(), // month, quarter, year
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: text("status").default("open"), // open, closed, locked
  closedBy: uuid("closed_by").references(() => users.id),
  closedAt: timestamp("closed_at"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_financial_periods_tenant").on(table.tenantId),
  index("idx_financial_periods_dates").on(table.startDate, table.endDate),
  index("idx_financial_periods_status").on(table.status),
]);

// Account balances
export const accountBalances = pgTable("account_balances", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  accountId: uuid("account_id").references(() => chartOfAccounts.id).notNull(),
  periodId: uuid("period_id").references(() => financialPeriods.id).notNull(),
  openingBalance: decimal("opening_balance", { precision: 15, scale: 2 }).default("0.00"),
  closingBalance: decimal("closing_balance", { precision: 15, scale: 2 }).default("0.00"),
  debitTotal: decimal("debit_total", { precision: 15, scale: 2 }).default("0.00"),
  creditTotal: decimal("credit_total", { precision: 15, scale: 2 }).default("0.00"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_account_balances_tenant").on(table.tenantId),
  index("idx_account_balances_account").on(table.accountId),
  index("idx_account_balances_period").on(table.periodId),
]);

// ==================== PAYROLL SYSTEM ====================

// Payroll profiles
export const payrollProfiles = pgTable("payroll_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  employeeId: uuid("employee_id").references(() => employees.id).notNull(),
  payrollId: text("payroll_id").notNull(), // Unique payroll identifier
  payType: text("pay_type").notNull(), // salary, hourly, commission, contract
  baseSalary: decimal("base_salary", { precision: 15, scale: 2 }).default("0.00"),
  hourlyRate: decimal("hourly_rate", { precision: 15, scale: 2 }).default("0.00"),
  currency: text("currency").default("USD"),
  payFrequency: text("pay_frequency").notNull(), // weekly, bi-weekly, monthly, quarterly
  payPeriodStart: date("pay_period_start"),
  payPeriodEnd: date("pay_period_end"),
  bankAccount: jsonb("bank_account").$type<{
    accountNumber?: string;
    routingNumber?: string;
    bankName?: string;
    accountType?: string;
  }>().default({}),
  taxSettings: jsonb("tax_settings").$type<{
    federalTaxRate?: number;
    stateTaxRate?: number;
    localTaxRate?: number;
    socialSecurityRate?: number;
    medicareRate?: number;
    exemptions?: number;
    additionalWithholdings?: number;
  }>().default({}),
  benefits: jsonb("benefits").$type<{
    healthInsurance?: { amount: number; deductible: boolean };
    dentalInsurance?: { amount: number; deductible: boolean };
    retirement401k?: { amount: number; employerMatch: number };
    lifeInsurance?: { amount: number; deductible: boolean };
    vacationDays?: number;
    sickDays?: number;
    personalDays?: number;
  }>().default({}),
  deductions: jsonb("deductions").$type<{
    unionDues?: number;
    childSupport?: number;
    garnishments?: number;
    otherDeductions?: Array<{ name: string; amount: number; recurring: boolean }>;
  }>().default({}),
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_payroll_profiles_tenant").on(table.tenantId),
  index("idx_payroll_profiles_employee").on(table.employeeId),
  index("idx_payroll_profiles_payroll_id").on(table.payrollId),
]);

// Payroll periods
export const payrollPeriods = pgTable("payroll_periods", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  periodName: text("period_name").notNull(),
  payFrequency: text("pay_frequency").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  payDate: date("pay_date").notNull(),
  status: text("status").default("draft"), // draft, processing, completed, approved, paid
  totalGrossPay: decimal("total_gross_pay", { precision: 15, scale: 2 }).default("0.00"),
  totalNetPay: decimal("total_net_pay", { precision: 15, scale: 2 }).default("0.00"),
  totalTaxes: decimal("total_taxes", { precision: 15, scale: 2 }).default("0.00"),
  totalDeductions: decimal("total_deductions", { precision: 15, scale: 2 }).default("0.00"),
  employeeCount: integer("employee_count").default(0),
  processedBy: uuid("processed_by").references(() => users.id),
  processedAt: timestamp("processed_at"),
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_payroll_periods_tenant").on(table.tenantId),
  index("idx_payroll_periods_dates").on(table.startDate, table.endDate),
  index("idx_payroll_periods_status").on(table.status),
]);

// Payroll entries (individual employee payroll records)
export const payrollEntries = pgTable("payroll_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  payrollPeriodId: uuid("payroll_period_id").references(() => payrollPeriods.id).notNull(),
  employeeId: uuid("employee_id").references(() => employees.id).notNull(),
  payrollProfileId: uuid("payroll_profile_id").references(() => payrollProfiles.id).notNull(),
  
  // Earnings
  basePay: decimal("base_pay", { precision: 15, scale: 2 }).default("0.00"),
  overtimePay: decimal("overtime_pay", { precision: 15, scale: 2 }).default("0.00"),
  bonusPay: decimal("bonus_pay", { precision: 15, scale: 2 }).default("0.00"),
  commissionPay: decimal("commission_pay", { precision: 15, scale: 2 }).default("0.00"),
  holidayPay: decimal("holiday_pay", { precision: 15, scale: 2 }).default("0.00"),
  grossPay: decimal("gross_pay", { precision: 15, scale: 2 }).default("0.00"),
  
  // Hours
  regularHours: decimal("regular_hours", { precision: 8, scale: 2 }).default("0.00"),
  overtimeHours: decimal("overtime_hours", { precision: 8, scale: 2 }).default("0.00"),
  vacationHours: decimal("vacation_hours", { precision: 8, scale: 2 }).default("0.00"),
  sickHours: decimal("sick_hours", { precision: 8, scale: 2 }).default("0.00"),
  holidayHours: decimal("holiday_hours", { precision: 8, scale: 2 }).default("0.00"),
  
  // Taxes
  federalTax: decimal("federal_tax", { precision: 15, scale: 2 }).default("0.00"),
  stateTax: decimal("state_tax", { precision: 15, scale: 2 }).default("0.00"),
  localTax: decimal("local_tax", { precision: 15, scale: 2 }).default("0.00"),
  socialSecurity: decimal("social_security", { precision: 15, scale: 2 }).default("0.00"),
  medicare: decimal("medicare", { precision: 15, scale: 2 }).default("0.00"),
  unemployment: decimal("unemployment", { precision: 15, scale: 2 }).default("0.00"),
  
  // Deductions
  healthInsurance: decimal("health_insurance", { precision: 15, scale: 2 }).default("0.00"),
  dentalInsurance: decimal("dental_insurance", { precision: 15, scale: 2 }).default("0.00"),
  retirement401k: decimal("retirement_401k", { precision: 15, scale: 2 }).default("0.00"),
  lifeInsurance: decimal("life_insurance", { precision: 15, scale: 2 }).default("0.00"),
  otherDeductions: decimal("other_deductions", { precision: 15, scale: 2 }).default("0.00"),
  
  // Net pay
  totalTaxes: decimal("total_taxes", { precision: 15, scale: 2 }).default("0.00"),
  totalDeductions: decimal("total_deductions", { precision: 15, scale: 2 }).default("0.00"),
  netPay: decimal("net_pay", { precision: 15, scale: 2 }).default("0.00"),
  
  // Year-to-date totals
  ytdGrossPay: decimal("ytd_gross_pay", { precision: 15, scale: 2 }).default("0.00"),
  ytdNetPay: decimal("ytd_net_pay", { precision: 15, scale: 2 }).default("0.00"),
  ytdTaxes: decimal("ytd_taxes", { precision: 15, scale: 2 }).default("0.00"),
  ytdDeductions: decimal("ytd_deductions", { precision: 15, scale: 2 }).default("0.00"),
  
  // Status and metadata
  status: text("status").default("draft"), // draft, calculated, approved, paid
  payMethod: text("pay_method").default("direct_deposit"), // direct_deposit, check, cash
  checkNumber: text("check_number"),
  transactionId: text("transaction_id"),
  paidDate: date("paid_date"),
  notes: text("notes"),
  
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_payroll_entries_tenant").on(table.tenantId),
  index("idx_payroll_entries_period").on(table.payrollPeriodId),
  index("idx_payroll_entries_employee").on(table.employeeId),
  index("idx_payroll_entries_profile").on(table.payrollProfileId),
  index("idx_payroll_entries_status").on(table.status),
]);

// Time tracking for payroll
export const timeSheets = pgTable("time_sheets", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  employeeId: uuid("employee_id").references(() => employees.id).notNull(),
  payrollPeriodId: uuid("payroll_period_id").references(() => payrollPeriods.id),
  
  // Time entries
  workDate: date("work_date").notNull(),
  clockIn: timestamp("clock_in"),
  clockOut: timestamp("clock_out"),
  breakTime: decimal("break_time", { precision: 4, scale: 2 }).default("0.00"), // in hours
  regularHours: decimal("regular_hours", { precision: 8, scale: 2 }).default("0.00"),
  overtimeHours: decimal("overtime_hours", { precision: 8, scale: 2 }).default("0.00"),
  doubleTimeHours: decimal("double_time_hours", { precision: 8, scale: 2 }).default("0.00"),
  
  // Time off
  vacationHours: decimal("vacation_hours", { precision: 8, scale: 2 }).default("0.00"),
  sickHours: decimal("sick_hours", { precision: 8, scale: 2 }).default("0.00"),
  holidayHours: decimal("holiday_hours", { precision: 8, scale: 2 }).default("0.00"),
  personalHours: decimal("personal_hours", { precision: 8, scale: 2 }).default("0.00"),
  
  // Project/task tracking
  projectId: uuid("project_id").references(() => projects.id),
  taskDescription: text("task_description"),
  location: text("location"),
  deviceUsed: text("device_used"),
  ipAddress: text("ip_address"),
  
  // Approval
  status: text("status").default("pending"), // pending, approved, rejected, needs_review
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  
  // Metadata
  submittedBy: uuid("submitted_by").references(() => users.id),
  submittedAt: timestamp("submitted_at"),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_time_sheets_tenant").on(table.tenantId),
  index("idx_time_sheets_employee").on(table.employeeId),
  index("idx_time_sheets_period").on(table.payrollPeriodId),
  index("idx_time_sheets_date").on(table.workDate),
  index("idx_time_sheets_status").on(table.status),
]);

// Payroll tax filings
export const payrollTaxFilings = pgTable("payroll_tax_filings", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  filingType: text("filing_type").notNull(), // quarterly_941, annual_940, w2, state_quarterly
  taxYear: integer("tax_year").notNull(),
  quarter: integer("quarter"), // 1, 2, 3, 4 (null for annual filings)
  filingPeriodStart: date("filing_period_start").notNull(),
  filingPeriodEnd: date("filing_period_end").notNull(),
  dueDate: date("due_date").notNull(),
  
  // Tax amounts
  totalWages: decimal("total_wages", { precision: 15, scale: 2 }).default("0.00"),
  totalFederalTax: decimal("total_federal_tax", { precision: 15, scale: 2 }).default("0.00"),
  totalStateTax: decimal("total_state_tax", { precision: 15, scale: 2 }).default("0.00"),
  totalSocialSecurity: decimal("total_social_security", { precision: 15, scale: 2 }).default("0.00"),
  totalMedicare: decimal("total_medicare", { precision: 15, scale: 2 }).default("0.00"),
  totalUnemployment: decimal("total_unemployment", { precision: 15, scale: 2 }).default("0.00"),
  
  // Filing details
  filingData: jsonb("filing_data").default({}),
  status: text("status").default("pending"), // pending, submitted, accepted, rejected
  confirmationNumber: text("confirmation_number"),
  submittedDate: date("submitted_date"),
  acceptedDate: date("accepted_date"),
  rejectionReason: text("rejection_reason"),
  
  // Metadata
  preparedBy: uuid("prepared_by").references(() => users.id),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  submittedBy: uuid("submitted_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_payroll_tax_filings_tenant").on(table.tenantId),
  index("idx_payroll_tax_filings_type").on(table.filingType),
  index("idx_payroll_tax_filings_year").on(table.taxYear),
  index("idx_payroll_tax_filings_due_date").on(table.dueDate),
  index("idx_payroll_tax_filings_status").on(table.status),
]);

// ==================== MODERN BOOKKEEPING ENHANCEMENTS ====================

// Automated bank reconciliation
export const bankReconciliations = pgTable("bank_reconciliations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  bankAccountId: integer("bank_account_id").references(() => bankAccounts.id).notNull(),
  reconciliationDate: date("reconciliation_date").notNull(),
  statementDate: date("statement_date").notNull(),
  
  // Balances
  statementBalance: decimal("statement_balance", { precision: 15, scale: 2 }).default("0.00"),
  bookBalance: decimal("book_balance", { precision: 15, scale: 2 }).default("0.00"),
  reconciledBalance: decimal("reconciled_balance", { precision: 15, scale: 2 }).default("0.00"),
  
  // Reconciliation items
  outstandingChecks: decimal("outstanding_checks", { precision: 15, scale: 2 }).default("0.00"),
  depositsInTransit: decimal("deposits_in_transit", { precision: 15, scale: 2 }).default("0.00"),
  bankAdjustments: decimal("bank_adjustments", { precision: 15, scale: 2 }).default("0.00"),
  bookAdjustments: decimal("book_adjustments", { precision: 15, scale: 2 }).default("0.00"),
  
  // Status and metadata
  status: text("status").default("draft"), // draft, in_progress, completed, reviewed, approved
  reconciliationMethod: text("reconciliation_method").default("manual"), // manual, automatic, assisted
  discrepancyAmount: decimal("discrepancy_amount", { precision: 15, scale: 2 }).default("0.00"),
  
  // Approval workflow
  reconciledBy: uuid("reconciled_by").references(() => users.id),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  approvedBy: uuid("approved_by").references(() => users.id),
  
  reconciliationItems: jsonb("reconciliation_items").$type<Array<{
    transactionId: string;
    amount: number;
    type: 'matched' | 'unmatched' | 'adjustment';
    description: string;
    resolved: boolean;
  }>>().default([]),
  
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_bank_reconciliations_tenant").on(table.tenantId),
  index("idx_bank_reconciliations_account").on(table.bankAccountId),
  index("idx_bank_reconciliations_date").on(table.reconciliationDate),
  index("idx_bank_reconciliations_status").on(table.status),
]);

// Smart expense categorization
export const expenseCategories = pgTable("expense_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  parentCategoryId: uuid("parent_category_id").references(() => expenseCategories.id),
  accountId: uuid("account_id").references(() => chartOfAccounts.id),
  
  // AI categorization rules
  keywords: jsonb("keywords").$type<string[]>().default([]),
  patterns: jsonb("patterns").$type<string[]>().default([]),
  vendors: jsonb("vendors").$type<string[]>().default([]),
  amountRanges: jsonb("amount_ranges").$type<Array<{
    min: number;
    max: number;
    confidence: number;
  }>>().default([]),
  
  // Tax and compliance
  taxDeductible: boolean("tax_deductible").default(false),
  taxCategory: text("tax_category"),
  requiresReceipt: boolean("requires_receipt").default(false),
  approvalRequired: boolean("approval_required").default(false),
  
  // Budgeting
  budgetAmount: decimal("budget_amount", { precision: 15, scale: 2 }).default("0.00"),
  budgetPeriod: text("budget_period").default("monthly"), // monthly, quarterly, annually
  
  // Metadata
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  color: text("color").default("#4F46E5"),
  icon: text("icon").default("receipt"),
  
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_expense_categories_tenant").on(table.tenantId),
  index("idx_expense_categories_parent").on(table.parentCategoryId),
  index("idx_expense_categories_account").on(table.accountId),
  index("idx_expense_categories_active").on(table.isActive),
]);

// Enhanced receipt management
export const receipts = pgTable("receipts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  transactionId: uuid("transaction_id").references(() => transactions.id),
  expenseId: uuid("expense_id"), // Reference to expense if different from transaction
  
  // Receipt details
  receiptNumber: text("receipt_number"),
  vendor: text("vendor").notNull(),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  receiptDate: date("receipt_date").notNull(),
  
  // Digital storage
  fileName: text("file_name"),
  fileUrl: text("file_url"),
  fileType: text("file_type"), // pdf, jpg, png, etc.
  fileSize: integer("file_size"),
  
  // AI-extracted data
  extractedData: jsonb("extracted_data").$type<{
    items?: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      category?: string;
    }>;
    taxes?: Array<{
      type: string;
      rate: number;
      amount: number;
    }>;
    paymentMethod?: string;
    merchantInfo?: {
      name: string;
      address: string;
      phone: string;
      taxId: string;
    };
  }>().default({}),
  
  // Processing status
  processingStatus: text("processing_status").default("pending"), // pending, processed, failed, manual_review
  ocrConfidence: decimal("ocr_confidence", { precision: 5, scale: 2 }).default("0.00"),
  verificationStatus: text("verification_status").default("unverified"), // unverified, verified, flagged
  
  // Categorization
  categoryId: uuid("category_id").references(() => expenseCategories.id),
  categoryConfidence: decimal("category_confidence", { precision: 5, scale: 2 }).default("0.00"),
  
  // Compliance
  isBusinessExpense: boolean("is_business_expense").default(true),
  taxDeductible: boolean("tax_deductible").default(false),
  requiresApproval: boolean("requires_approval").default(false),
  approvalStatus: text("approval_status").default("pending"), // pending, approved, rejected
  
  // Metadata
  uploadedBy: uuid("uploaded_by").references(() => users.id),
  verifiedBy: uuid("verified_by").references(() => users.id),
  approvedBy: uuid("approved_by").references(() => users.id),
  
  notes: text("notes"),
  tags: jsonb("tags").$type<string[]>().default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_receipts_tenant").on(table.tenantId),
  index("idx_receipts_transaction").on(table.transactionId),
  index("idx_receipts_vendor").on(table.vendor),
  index("idx_receipts_date").on(table.receiptDate),
  index("idx_receipts_category").on(table.categoryId),
  index("idx_receipts_status").on(table.processingStatus),
]);

// Create insert and select schemas
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true });
export const insertProjectTaskSchema = createInsertSchema(projectTasks);
export const insertResourceAllocationSchema = createInsertSchema(resourceAllocations);
export const insertTimeEntrySchema = createInsertSchema(timeEntries);
export const insertPerformanceReviewSchema = createInsertSchema(performanceReviews);
export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecords);
export const insertLeaveRequestSchema = createInsertSchema(leaveRequests);
export const insertProductSchema = createInsertSchema(products);
export const insertInventoryMovementSchema = createInsertSchema(inventoryMovements);
export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders);
export const insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItems);
export const insertDocumentSchema = createInsertSchema(documents);
export const insertDocumentFolderSchema = createInsertSchema(documentFolders);
export const insertDocumentApprovalSchema = createInsertSchema(documentApprovals);
export const insertApprovalWorkflowSchema = createInsertSchema(approvalWorkflows);
export const insertTerritorySchema = createInsertSchema(territories);
export const insertTerritoryAssignmentSchema = createInsertSchema(territoryAssignments);
export const insertAccountTerritoryAssignmentSchema = createInsertSchema(accountTerritoryAssignments);
export const insertChartOfAccountSchema = createInsertSchema(chartOfAccounts);
export const insertJournalEntrySchema = createInsertSchema(journalEntries);
export const insertJournalEntryLineItemSchema = createInsertSchema(journalEntryLineItems);
export const insertRecurringEntrySchema = createInsertSchema(recurringEntries);
export const insertFinancialPeriodSchema = createInsertSchema(financialPeriods);
export const insertAccountBalanceSchema = createInsertSchema(accountBalances);
export const insertPayrollProfileSchema = createInsertSchema(payrollProfiles);
export const insertPayrollPeriodSchema = createInsertSchema(payrollPeriods);
export const insertPayrollEntrySchema = createInsertSchema(payrollEntries);
export const insertTimeSheetSchema = createInsertSchema(timeSheets);
export const insertPayrollTaxFilingSchema = createInsertSchema(payrollTaxFilings);
export const insertBankReconciliationSchema = createInsertSchema(bankReconciliations);
export const insertExpenseCategorySchema = createInsertSchema(expenseCategories);
export const insertReceiptSchema = createInsertSchema(receipts);

// Type definitions
export type Project = typeof projects.$inferSelect;
export type ProjectTask = typeof projectTasks.$inferSelect;
export type ResourceAllocation = typeof resourceAllocations.$inferSelect;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type PerformanceReview = typeof performanceReviews.$inferSelect;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type Product = typeof products.$inferSelect;
export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type DocumentFolder = typeof documentFolders.$inferSelect;
export type DocumentApproval = typeof documentApprovals.$inferSelect;
export type ApprovalWorkflow = typeof approvalWorkflows.$inferSelect;
export type Territory = typeof territories.$inferSelect;
export type TerritoryAssignment = typeof territoryAssignments.$inferSelect;
export type AccountTerritoryAssignment = typeof accountTerritoryAssignments.$inferSelect;
export type ChartOfAccount = typeof chartOfAccounts.$inferSelect;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type JournalEntryLineItem = typeof journalEntryLineItems.$inferSelect;
export type RecurringEntry = typeof recurringEntries.$inferSelect;
export type FinancialPeriod = typeof financialPeriods.$inferSelect;
export type AccountBalance = typeof accountBalances.$inferSelect;
export type PayrollProfile = typeof payrollProfiles.$inferSelect;
export type PayrollPeriod = typeof payrollPeriods.$inferSelect;
export type PayrollEntry = typeof payrollEntries.$inferSelect;
export type TimeSheet = typeof timeSheets.$inferSelect;
export type PayrollTaxFiling = typeof payrollTaxFilings.$inferSelect;
export type BankReconciliation = typeof bankReconciliations.$inferSelect;
export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type Receipt = typeof receipts.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertProjectTask = z.infer<typeof insertProjectTaskSchema>;
export type InsertResourceAllocation = z.infer<typeof insertResourceAllocationSchema>;
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;
export type InsertPerformanceReview = z.infer<typeof insertPerformanceReviewSchema>;
export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;
export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertInventoryMovement = z.infer<typeof insertInventoryMovementSchema>;
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type InsertPurchaseOrderItem = z.infer<typeof insertPurchaseOrderItemSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InsertDocumentFolder = z.infer<typeof insertDocumentFolderSchema>;
export type InsertDocumentApproval = z.infer<typeof insertDocumentApprovalSchema>;
export type InsertApprovalWorkflow = z.infer<typeof insertApprovalWorkflowSchema>;
export type InsertTerritory = z.infer<typeof insertTerritorySchema>;
export type InsertTerritoryAssignment = z.infer<typeof insertTerritoryAssignmentSchema>;
export type InsertAccountTerritoryAssignment = z.infer<typeof insertAccountTerritoryAssignmentSchema>;
export type InsertChartOfAccount = z.infer<typeof insertChartOfAccountSchema>;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type InsertJournalEntryLineItem = z.infer<typeof insertJournalEntryLineItemSchema>;
export type InsertRecurringEntry = z.infer<typeof insertRecurringEntrySchema>;
export type InsertFinancialPeriod = z.infer<typeof insertFinancialPeriodSchema>;
export type InsertAccountBalance = z.infer<typeof insertAccountBalanceSchema>;
export type InsertPayrollProfile = z.infer<typeof insertPayrollProfileSchema>;
export type InsertPayrollPeriod = z.infer<typeof insertPayrollPeriodSchema>;
export type InsertPayrollEntry = z.infer<typeof insertPayrollEntrySchema>;
export type InsertTimeSheet = z.infer<typeof insertTimeSheetSchema>;
export type InsertPayrollTaxFiling = z.infer<typeof insertPayrollTaxFilingSchema>;
export type InsertBankReconciliation = z.infer<typeof insertBankReconciliationSchema>;
export type InsertExpenseCategory = z.infer<typeof insertExpenseCategorySchema>;
export type InsertReceipt = z.infer<typeof insertReceiptSchema>;

// Company Device Management Tables
export const companyDevices = pgTable("company_devices", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  userEmail: text("user_email").notNull(),
  deviceName: text("device_name").notNull(),
  deviceType: text("device_type").notNull(), // desktop, laptop, mobile, tablet
  operatingSystem: text("operating_system").notNull(),
  ipAddress: text("ip_address").notNull(), // IPv4 or IPv6
  macAddress: text("mac_address").notNull(),
  internalIp: text("internal_ip"), // Local network IP
  locationCountry: text("location_country"),
  locationRegion: text("location_region"),
  locationCity: text("location_city"),
  locationLatitude: decimal("location_latitude", { precision: 10, scale: 8 }),
  locationLongitude: decimal("location_longitude", { precision: 11, scale: 8 }),
  locationTimezone: text("location_timezone"),
  isTrusted: boolean("is_trusted").default(false),
  isActive: boolean("is_active").default(true),
  lastSeen: timestamp("last_seen"),
  securityScore: integer("security_score").default(100), // 0-100
  riskLevel: text("risk_level").default("low"), // low, medium, high, critical
  deviceFingerprint: text("device_fingerprint"), // Browser/system fingerprint
  vpnDetected: boolean("vpn_detected").default(false),
  proxyDetected: boolean("proxy_detected").default(false),
  torDetected: boolean("tor_detected").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_company_devices_tenant_user").on(table.tenantId, table.userEmail),
  index("idx_company_devices_ip").on(table.ipAddress),
  index("idx_company_devices_mac").on(table.macAddress),
]);

export const deviceActivityLogs = pgTable("device_activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  deviceId: uuid("device_id").references(() => companyDevices.id).notNull(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  userEmail: text("user_email").notNull(),
  activityType: text("activity_type").notNull(), // login, logout, access_attempt, security_alert
  activityDescription: text("activity_description"),
  ipAddress: text("ip_address").notNull(),
  locationCountry: text("location_country"),
  locationCity: text("location_city"),
  success: boolean("success").default(true),
  riskScore: integer("risk_score").default(0),
  metadata: jsonb("metadata"), // Additional activity data
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_device_activity_device").on(table.deviceId),
  index("idx_device_activity_tenant").on(table.tenantId),
  index("idx_device_activity_time").on(table.createdAt),
]);

export const deviceSecurityPolicies = pgTable("device_security_policies", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  policyName: text("policy_name").notNull(),
  policyType: text("policy_type").notNull(), // ip_whitelist, geo_restriction, device_trust
  policyRules: jsonb("policy_rules").$type<{
    allowedIps?: string[];
    blockedIps?: string[];
    allowedCountries?: string[];
    blockedCountries?: string[];
    trustedDevicesOnly?: boolean;
    maxDevicesPerUser?: number;
    requireMacValidation?: boolean;
    allowVpn?: boolean;
    allowProxy?: boolean;
    allowTor?: boolean;
    workingHours?: { start: string; end: string; timezone: string };
  }>().notNull(),
  isActive: boolean("is_active").default(true),
  appliesToAll: boolean("applies_to_all").default(false),
  specificUsers: text("specific_users").array(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_device_policies_tenant").on(table.tenantId),
  index("idx_device_policies_active").on(table.isActive),
]);

// Device Management Schemas
export const insertCompanyDeviceSchema = createInsertSchema(companyDevices);
export const insertDeviceActivityLogSchema = createInsertSchema(deviceActivityLogs);
export const insertDeviceSecurityPolicySchema = createInsertSchema(deviceSecurityPolicies);

// Device Management Types
export type CompanyDevice = typeof companyDevices.$inferSelect;
export type DeviceActivityLog = typeof deviceActivityLogs.$inferSelect;
export type DeviceSecurityPolicy = typeof deviceSecurityPolicies.$inferSelect;

export type InsertCompanyDevice = z.infer<typeof insertCompanyDeviceSchema>;
export type InsertDeviceActivityLog = z.infer<typeof insertDeviceActivityLogSchema>;
export type InsertDeviceSecurityPolicy = z.infer<typeof insertDeviceSecurityPolicySchema>;

// Core CRM with tenant isolation
export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  jobTitle: text("job_title"),
  leadSource: text("lead_source"),
  status: text("status").default("active"), // active, inactive, prospect, customer
  tags: jsonb("tags").$type<string[]>().default([]),
  assignedTo: uuid("assigned_to").references(() => users.id),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_contacts_tenant").on(table.tenantId),
  index("idx_contacts_assigned").on(table.assignedTo),
]);

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  industry: text("industry"),
  website: text("website"),
  phone: text("phone"),
  email: text("email"),
  billingAddress: text("billing_address"),
  shippingAddress: text("shipping_address"),
  accountType: text("account_type"), // prospect, customer, partner
  parentAccountId: uuid("parent_account_id"),
  annualRevenue: decimal("annual_revenue"),
  employees: integer("employees"),
  ownerId: uuid("owner_id").references(() => users.id),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_accounts_tenant").on(table.tenantId),
  index("idx_accounts_owner").on(table.ownerId),
]);

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  jobTitle: text("job_title"),
  leadSource: text("lead_source"),
  status: text("status").default("new"), // new, contacted, qualified, unqualified
  score: integer("score").default(0),
  convertedContactId: integer("converted_contact_id"),
  convertedAccountId: integer("converted_account_id"),
  convertedDealId: integer("converted_deal_id"),
  assignedTo: integer("assigned_to"),
  tenantId: text("tenant_id"), // Multi-tenant support
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  accountId: integer("account_id"),
  contactId: integer("contact_id"),
  amount: decimal("amount"),
  stage: text("stage").default("qualification"), // qualification, proposal, negotiation, closed-won, closed-lost
  probability: integer("probability").default(0),
  closeDate: date("close_date"),
  nextStep: text("next_step"),
  description: text("description"),
  source: text("source"),
  ownerId: integer("owner_id"),
  tenantId: text("tenant_id"), // Multi-tenant support
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type"), // call, email, meeting, follow-up
  priority: text("priority").default("medium"), // low, medium, high, urgent
  status: text("status").default("pending"), // pending, in-progress, completed, cancelled
  dueDate: text("due_date"),
  assignedTo: integer("assigned_to"),
  relatedTo: text("related_to"), // contact, lead, deal, account
  relatedId: integer("related_id"),
  tenantId: text("tenant_id"), // Multi-tenant support
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type"), // email, social, webinar, event
  status: text("status").default("draft"), // draft, active, paused, completed
  startDate: date("start_date"),
  endDate: date("end_date"),
  budget: decimal("budget"),
  expectedRevenue: decimal("expected_revenue"),
  actualCost: decimal("actual_cost"),
  description: text("description"),
  targetAudience: text("target_audience"),
  ownerId: integer("owner_id"),
  tenantId: text("tenant_id"), // Multi-tenant support
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  description: text("description"),
  priority: text("priority").default("medium"), // low, medium, high, urgent
  status: text("status").default("open"), // open, in-progress, resolved, closed
  category: text("category"),
  subCategory: text("sub_category"),
  contactId: text("contact_id"),
  accountId: integer("account_id"),
  assignedTo: integer("assigned_to"),
  dueDate: timestamp("due_date"),
  resolvedAt: timestamp("resolved_at"),
  tenantId: text("tenant_id"), // Multi-tenant support
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Legacy projects table removed - using enhanced version with tenant support above

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  accountId: integer("account_id").notNull(),
  contactId: integer("contact_id"),
  amount: decimal("amount").notNull(),
  tax: decimal("tax").default("0"),
  discount: decimal("discount").default("0"),
  total: decimal("total").notNull(),
  status: text("status").default("draft"), // draft, sent, paid, overdue, cancelled
  dueDate: date("due_date"),
  paidDate: date("paid_date"),
  items: jsonb("items").$type<any[]>().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  department: text("department"),
  position: text("position"),
  manager: integer("manager"),
  hireDate: date("hire_date"),
  salary: decimal("salary"),
  status: text("status").default("active"), // active, inactive, terminated
  address: text("address"),
  dateOfBirth: date("date_of_birth"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sentimentAnalyses = pgTable("sentiment_analyses", {
  id: serial("id").primaryKey(),
  contactId: text("contact_id").notNull(),
  message: text("message").notNull(),
  sentiment: text("sentiment").notNull(),
  score: integer("score").notNull(),
  keywords: text("keywords"),
  emotionalTone: text("emotional_tone"),
  urgencyLevel: text("urgency_level"),
  tenantId: text("tenant_id").notNull().default("default-tenant"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Advanced Enterprise Tables
export const workflows = pgTable("workflows", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  triggerType: text("trigger_type").notNull(),
  triggerConditions: text("trigger_conditions"),
  actions: text("actions").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  reportType: text("report_type").notNull(), // sales, revenue, customer, activity, forecast, pipeline
  status: text("status").default("draft"), // draft, scheduled, running, completed, failed
  config: jsonb("config").$type<{
    dateRange?: string;
    accounts?: number[];
    includeMetrics?: { [key: string]: boolean };
    filters?: { [key: string]: any };
  }>().default({}),
  data: jsonb("data").$type<any[]>().default([]),
  lastRun: timestamp("last_run"),
  nextRun: timestamp("next_run"),
  schedule: text("schedule"), // cron expression for scheduled reports
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_reports_tenant").on(table.tenantId),
  index("idx_reports_type").on(table.reportType),
  index("idx_reports_status").on(table.status),
]);

export const salesForecasts = pgTable("sales_forecasts", {
  id: serial("id").primaryKey(),
  period: text("period").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  forecastAmount: decimal("forecast_amount", { precision: 12, scale: 2 }).notNull(),
  actualAmount: decimal("actual_amount", { precision: 12, scale: 2 }),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(),
  methodology: text("methodology"),
  createdBy: integer("created_by").references(() => employees.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Legacy role tables renamed to avoid conflicts with multi-tenant system
export const legacyRoles = pgTable("legacy_roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  permissions: text("permissions").array().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const legacyUserRoles = pgTable("legacy_user_roles", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  roleId: integer("role_id").references(() => legacyRoles.id).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
});

export const emailSequences = pgTable("email_sequences", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  steps: text("steps").notNull(),
  triggerEvent: text("trigger_event"),
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").references(() => employees.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const leadScoring = pgTable("lead_scoring", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id).notNull(),
  score: integer("score").notNull(),
  factors: text("factors").notNull(),
  lastCalculated: timestamp("last_calculated").defaultNow().notNull(),
});

// Legacy tables removed - using enhanced versions above

export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  quoteNumber: text("quote_number").notNull().unique(),
  contactId: integer("contact_id").references(() => contacts.id),
  dealId: integer("deal_id").references(() => deals.id),
  items: text("items").notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 12, scale: 2 }).default("0"),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  validUntil: date("valid_until"),
  status: text("status").default("draft"),
  createdBy: integer("created_by").references(() => employees.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});



// Audit logs moved to Super Admin section above

// Insert schemas
export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tenantId: z.string().optional(),
  assignedTo: z.string().nullable().optional(),
  createdBy: z.string().nullable().optional(),
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  contactId: z.string().nullable().optional(),
});

// Duplicate insertProjectSchema removed

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  amount: z.union([z.string(), z.number()]).transform((val) => String(val)),
  tax: z.union([z.string(), z.number()]).transform((val) => String(val)).optional(),
  discount: z.union([z.string(), z.number()]).transform((val) => String(val)).optional(),
  total: z.union([z.string(), z.number()]).transform((val) => String(val)),
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSentimentAnalysisSchema = createInsertSchema(sentimentAnalyses).omit({
  id: true,
  createdAt: true,
});

// ==================== E-COMMERCE TYPES ====================

// Store schemas
export const insertStoreSchema = createInsertSchema(stores).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEcommerceProductSchema = createInsertSchema(ecommerceProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductVariantSchema = createInsertSchema(productVariants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductCategorySchema = createInsertSchema(productCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerAddressSchema = createInsertSchema(customerAddresses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEcommerceOrderSchema = createInsertSchema(ecommerceOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
});

export const insertShoppingCartSchema = createInsertSchema(shoppingCarts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDiscountCodeSchema = createInsertSchema(discountCodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type definitions
export type Store = typeof stores.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;

export type EcommerceProduct = typeof ecommerceProducts.$inferSelect;
export type InsertEcommerceProduct = z.infer<typeof insertEcommerceProductSchema>;

export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertProductVariant = z.infer<typeof insertProductVariantSchema>;

export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = z.infer<typeof insertProductCategorySchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type CustomerAddress = typeof customerAddresses.$inferSelect;
export type InsertCustomerAddress = z.infer<typeof insertCustomerAddressSchema>;

export type EcommerceOrder = typeof ecommerceOrders.$inferSelect;
export type InsertEcommerceOrder = z.infer<typeof insertEcommerceOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type ShoppingCart = typeof shoppingCarts.$inferSelect;
export type InsertShoppingCart = z.infer<typeof insertShoppingCartSchema>;

export type DiscountCode = typeof discountCodes.$inferSelect;
export type InsertDiscountCode = z.infer<typeof insertDiscountCodeSchema>;



// Duplicate chartOfAccounts table definition removed - using enhanced version above

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }).default("1.0000"),
  baseCurrencyAmount: decimal("base_currency_amount", { precision: 15, scale: 2 }),
  type: text("type", { enum: ["income", "expense", "transfer"] }).notNull(),
  category: varchar("category", { length: 100 }),
  accountId: integer("account_id").references(() => chartOfAccounts.id).notNull(),
  reference: varchar("reference", { length: 100 }),
  attachments: text("attachments").array(),
  reconciled: boolean("reconciled").default(false),
  reconciledDate: timestamp("reconciled_date"),
  taxDeductible: boolean("tax_deductible").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const currencies = pgTable("currencies", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 3 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  symbol: varchar("symbol", { length: 10 }).notNull(),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }).notNull(),
  isBaseCurrency: boolean("is_base_currency").default(false),
  isActive: boolean("is_active").default(true),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  period: text("period", { enum: ["monthly", "quarterly", "yearly"] }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  totalBudget: decimal("total_budget", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  spent: decimal("spent", { precision: 15, scale: 2 }).default("0.00"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Advanced Invoice Generation and Tracking
export const invoiceGeneration = pgTable("invoice_generation", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  contactId: integer("contact_id").references(() => contacts.id),
  dealId: integer("deal_id").references(() => deals.id),
  issueDate: date("issue_date").notNull(),
  dueDate: date("due_date").notNull(),
  status: text("status", { enum: ["draft", "sent", "paid", "overdue", "cancelled"] }).default("draft"),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 15, scale: 2 }).default("0.00"),
  discountAmount: decimal("discount_amount", { precision: 15, scale: 2 }).default("0.00"),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 15, scale: 2 }).default("0.00"),
  remainingBalance: decimal("remaining_balance", { precision: 15, scale: 2 }),
  paymentTerms: varchar("payment_terms", { length: 100 }),
  notes: text("notes"),
  templateUsed: varchar("template_used", { length: 100 }),
  sentDate: timestamp("sent_date"),
  paidDate: timestamp("paid_date"),
  remindersSent: integer("reminders_sent").default(0),
  lastReminderDate: timestamp("last_reminder_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const invoiceLineItems = pgTable("invoice_line_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoiceGeneration.id).notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 15, scale: 2 }).notNull(),
  lineTotal: decimal("line_total", { precision: 15, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0.00"),
  taxAmount: decimal("tax_amount", { precision: 15, scale: 2 }).default("0.00"),
  productId: integer("product_id").references(() => products.id),
  sortOrder: integer("sort_order").default(0),
});

// Financial Reports
export const financialReports = pgTable("financial_reports", {
  id: serial("id").primaryKey(),
  reportType: text("report_type", { enum: ["profit_loss", "balance_sheet", "cash_flow", "trial_balance", "tax_summary"] }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  periodType: text("period_type", { enum: ["monthly", "quarterly", "yearly", "custom"] }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  reportData: jsonb("report_data").notNull(),
  summary: jsonb("summary"),
  generatedBy: integer("generated_by").references(() => employees.id),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bank Statement Integration and Reconciliation
export const bankAccounts = pgTable("bank_accounts", {
  id: serial("id").primaryKey(),
  accountName: varchar("account_name", { length: 255 }).notNull(),
  bankName: varchar("bank_name", { length: 255 }).notNull(),
  accountNumber: varchar("account_number", { length: 50 }).notNull(),
  accountType: text("account_type", { enum: ["checking", "savings", "credit", "investment"] }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  currentBalance: decimal("current_balance", { precision: 15, scale: 2 }).default("0.00"),
  statementBalance: decimal("statement_balance", { precision: 15, scale: 2 }).default("0.00"),
  lastReconciled: timestamp("last_reconciled"),
  chartAccountId: uuid("chart_account_id").references(() => chartOfAccounts.id),
  isActive: boolean("is_active").default(true),
  routingNumber: varchar("routing_number", { length: 20 }),
  swiftCode: varchar("swift_code", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bankStatements = pgTable("bank_statements", {
  id: serial("id").primaryKey(),
  bankAccountId: integer("bank_account_id").references(() => bankAccounts.id).notNull(),
  statementDate: date("statement_date").notNull(),
  statementPeriodStart: date("statement_period_start").notNull(),
  statementPeriodEnd: date("statement_period_end").notNull(),
  openingBalance: decimal("opening_balance", { precision: 15, scale: 2 }).notNull(),
  closingBalance: decimal("closing_balance", { precision: 15, scale: 2 }).notNull(),
  fileName: varchar("file_name", { length: 255 }),
  uploadDate: timestamp("upload_date").defaultNow(),
  processedDate: timestamp("processed_date"),
  reconciliationStatus: text("reconciliation_status", { enum: ["pending", "in_progress", "completed", "discrepancy"] }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bankTransactions = pgTable("bank_transactions", {
  id: serial("id").primaryKey(),
  bankAccountId: integer("bank_account_id").references(() => bankAccounts.id).notNull(),
  statementId: integer("statement_id").references(() => bankStatements.id),
  transactionDate: date("transaction_date").notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  transactionType: text("transaction_type", { enum: ["debit", "credit"] }).notNull(),
  balance: decimal("balance", { precision: 15, scale: 2 }),
  reference: varchar("reference", { length: 100 }),
  category: varchar("category", { length: 100 }),
  matchedTransactionId: integer("matched_transaction_id").references(() => transactions.id),
  reconciliationStatus: text("reconciliation_status", { enum: ["unmatched", "matched", "disputed"] }).default("unmatched"),
  reconciliationDate: timestamp("reconciliation_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tax Preparation and Compliance
export const taxCategories = pgTable("tax_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  taxCode: varchar("tax_code", { length: 50 }),
  deductible: boolean("deductible").default(false),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }),
  jurisdictionType: text("jurisdiction_type", { enum: ["federal", "state", "local", "international"] }).notNull(),
  jurisdiction: varchar("jurisdiction", { length: 100 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const taxReturns = pgTable("tax_returns", {
  id: serial("id").primaryKey(),
  taxYear: integer("tax_year").notNull(),
  returnType: text("return_type", { enum: ["individual", "corporate", "partnership", "llc"] }).notNull(),
  jurisdiction: varchar("jurisdiction", { length: 100 }).notNull(),
  filingStatus: varchar("filing_status", { length: 50 }),
  preparerName: varchar("preparer_name", { length: 255 }),
  preparerLicense: varchar("preparer_license", { length: 100 }),
  status: text("status", { enum: ["draft", "review", "filed", "amended", "audit"] }).default("draft"),
  grossIncome: decimal("gross_income", { precision: 15, scale: 2 }).default("0.00"),
  totalDeductions: decimal("total_deductions", { precision: 15, scale: 2 }).default("0.00"),
  taxableIncome: decimal("taxable_income", { precision: 15, scale: 2 }).default("0.00"),
  taxOwed: decimal("tax_owed", { precision: 15, scale: 2 }).default("0.00"),
  taxPaid: decimal("tax_paid", { precision: 15, scale: 2 }).default("0.00"),
  refundOwed: decimal("refund_owed", { precision: 15, scale: 2 }).default("0.00"),
  filingDate: date("filing_date"),
  dueDate: date("due_date").notNull(),
  extensionDate: date("extension_date"),
  auditFlag: boolean("audit_flag").default(false),
  notes: text("notes"),
  attachments: text("attachments").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const taxDeductions = pgTable("tax_deductions", {
  id: serial("id").primaryKey(),
  taxReturnId: integer("tax_return_id").references(() => taxReturns.id).notNull(),
  categoryId: integer("category_id").references(() => taxCategories.id).notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  transactionId: integer("transaction_id").references(() => transactions.id),
  documentationPath: varchar("documentation_path", { length: 500 }),
  verificationStatus: text("verification_status", { enum: ["pending", "verified", "rejected"] }).default("pending"),
  auditRisk: text("audit_risk", { enum: ["low", "medium", "high"] }).default("low"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const taxCompliance = pgTable("tax_compliance", {
  id: serial("id").primaryKey(),
  complianceType: text("compliance_type", { enum: ["quarterly_filing", "annual_filing", "sales_tax", "payroll_tax", "estimated_tax"] }).notNull(),
  jurisdiction: varchar("jurisdiction", { length: 100 }).notNull(),
  taxPeriod: varchar("tax_period", { length: 50 }).notNull(),
  dueDate: date("due_date").notNull(),
  filedDate: date("filed_date"),
  status: text("status", { enum: ["pending", "filed", "late", "amended"] }).default("pending"),
  amountDue: decimal("amount_due", { precision: 15, scale: 2 }).default("0.00"),
  amountPaid: decimal("amount_paid", { precision: 15, scale: 2 }).default("0.00"),
  penalties: decimal("penalties", { precision: 15, scale: 2 }).default("0.00"),
  interest: decimal("interest", { precision: 15, scale: 2 }).default("0.00"),
  confirmationNumber: varchar("confirmation_number", { length: 100 }),
  remindersSent: integer("reminders_sent").default(0),
  nextReminderDate: date("next_reminder_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  duration: integer("duration").notNull().default(30), // in minutes
  type: text("type").notNull().default("meeting"), // meeting, call, demo, consultation
  location: text("location"),
  meetingUrl: text("meeting_url"),
  status: text("status").notNull().default("scheduled"), // scheduled, confirmed, cancelled, completed
  reminderSent: boolean("reminder_sent").default(false),
  notes: text("notes"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Security Feature Management System
export const securityToggles = pgTable("security_toggles", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // "authentication", "authorization", "audit", "compliance"
  feature: text("feature").notNull(), // "mfa", "session_timeout", "audit_logging", etc.
  enabled: boolean("enabled").default(false),
  configuration: jsonb("configuration").$type<Record<string, any>>().default({}),
  lastModifiedBy: text("last_modified_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_security_toggles_tenant").on(table.tenantId),
  index("idx_security_toggles_feature").on(table.feature),
]);

export const securityRules = pgTable("security_rules", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  ruleType: text("rule_type").notNull(), // "access_control", "rate_limit", "ip_whitelist", "user_restriction"
  conditions: jsonb("conditions").$type<Record<string, any>>().notNull(),
  actions: jsonb("actions").$type<Record<string, any>>().notNull(),
  priority: integer("priority").default(0), // Higher priority = executed first
  enabled: boolean("enabled").default(true),
  lastTriggered: timestamp("last_triggered"),
  triggerCount: integer("trigger_count").default(0),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_security_rules_tenant").on(table.tenantId),
  index("idx_security_rules_type").on(table.ruleType),
  index("idx_security_rules_priority").on(table.priority),
]);

// Access Control Matrix for granular permission management
export const accessControlMatrix = pgTable("access_control_matrix", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  resource: text("resource").notNull(), // "contacts", "deals", "reports", etc.
  operation: text("operation").notNull(), // "create", "read", "update", "delete", "execute"
  role: text("role").notNull(), // "admin", "manager", "user", "viewer"
  permission: text("permission").notNull(), // "allow", "deny", "conditional"
  conditions: jsonb("conditions").$type<Record<string, any>>().default({}),
  priority: integer("priority").default(0),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: text("created_by").notNull(),
}, (table) => [
  index("idx_access_control_tenant").on(table.tenantId),
  index("idx_access_control_resource").on(table.resource),
  index("idx_access_control_role").on(table.role),
]);



// Financial Management Types
export type FinancialTransaction = typeof transactions.$inferSelect;
export type InsertFinancialTransaction = typeof transactions.$inferInsert;
export type Currency = typeof currencies.$inferSelect;
export type InsertCurrency = typeof currencies.$inferInsert;
export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = typeof budgets.$inferInsert;
export type InvoiceGeneration = typeof invoiceGeneration.$inferSelect;
export type InsertInvoiceGeneration = typeof invoiceGeneration.$inferInsert;
export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect;
export type InsertInvoiceLineItem = typeof invoiceLineItems.$inferInsert;
export type FinancialReport = typeof financialReports.$inferSelect;
export type InsertFinancialReport = typeof financialReports.$inferInsert;
export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertBankAccount = typeof bankAccounts.$inferInsert;
export type BankStatement = typeof bankStatements.$inferSelect;
export type InsertBankStatement = typeof bankStatements.$inferInsert;
export type BankTransaction = typeof bankTransactions.$inferSelect;
export type InsertBankTransaction = typeof bankTransactions.$inferInsert;
export type TaxCategory = typeof taxCategories.$inferSelect;
export type InsertTaxCategory = typeof taxCategories.$inferInsert;
export type TaxReturn = typeof taxReturns.$inferSelect;
export type InsertTaxReturn = typeof taxReturns.$inferInsert;
export type TaxDeduction = typeof taxDeductions.$inferSelect;
export type InsertTaxDeduction = typeof taxDeductions.$inferInsert;
export type TaxCompliance = typeof taxCompliance.$inferSelect;
export type InsertTaxCompliance = typeof taxCompliance.$inferInsert;

// Tax Rates Table
export const taxRates = pgTable("tax_rates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "US Sales Tax", "VAT", "GST"
  rate: decimal("rate", { precision: 5, scale: 4 }).notNull(), // Tax rate as decimal (0.0825 for 8.25%)
  type: text("type").notNull(), // "sales_tax", "vat", "gst", "income_tax"
  jurisdiction: text("jurisdiction").notNull(), // "US-CA", "UK", "AU", etc.
  region: text("region"), // State, Province, County
  city: text("city"),
  zipCode: text("zip_code"),
  isActive: boolean("is_active").default(true),
  effectiveDate: timestamp("effective_date").defaultNow(),
  expiryDate: timestamp("expiry_date"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tax Calculation Rules Table
export const taxCalculationRules = pgTable("tax_calculation_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  priority: integer("priority").default(0), // Higher priority rules override lower
  conditions: jsonb("conditions"), // JSON rules for when to apply
  taxRateId: integer("tax_rate_id").references(() => taxRates.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTaxRateSchema = createInsertSchema(taxRates);
export type InsertTaxRate = z.infer<typeof insertTaxRateSchema>;
export type TaxRate = typeof taxRates.$inferSelect;

export const insertTaxCalculationRuleSchema = createInsertSchema(taxCalculationRules);
export type InsertTaxCalculationRule = z.infer<typeof insertTaxCalculationRuleSchema>;
export type TaxCalculationRule = typeof taxCalculationRules.$inferSelect;

// Security System Schema Types
export const insertSecurityToggleSchema = createInsertSchema(securityToggles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSecurityToggle = z.infer<typeof insertSecurityToggleSchema>;
export type SecurityToggle = typeof securityToggles.$inferSelect;

export const insertSecurityRuleSchema = createInsertSchema(securityRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastTriggered: true,
  triggerCount: true,
});
export type InsertSecurityRule = z.infer<typeof insertSecurityRuleSchema>;
export type SecurityRule = typeof securityRules.$inferSelect;

export const insertAccessControlMatrixSchema = createInsertSchema(accessControlMatrix).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAccessControlMatrix = z.infer<typeof insertAccessControlMatrixSchema>;
export type AccessControlMatrix = typeof accessControlMatrix.$inferSelect;

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// Super Admin Dashboard Schema Types
export const insertTenantSubscriptionSchema = createInsertSchema(tenantSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTenantSubscription = z.infer<typeof insertTenantSubscriptionSchema>;
export type TenantSubscription = typeof tenantSubscriptions.$inferSelect;

// Audit log schema and types already defined in Super Admin section above

export const insertSystemMetricSchema = createInsertSchema(systemMetrics).omit({
  id: true,
  timestamp: true,
});
export type InsertSystemMetric = z.infer<typeof insertSystemMetricSchema>;
export type SystemMetric = typeof systemMetrics.$inferSelect;

export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Tenant = typeof tenants.$inferSelect;

// User schema and types
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Types
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Deal = typeof deals.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type SentimentAnalysis = typeof sentimentAnalyses.$inferSelect;
export type InsertSentimentAnalysis = z.infer<typeof insertSentimentAnalysisSchema>;

// Advanced feature schemas
export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  tenantId: z.string().optional(),
  createdBy: z.string().nullable().optional(),
});

export const insertSalesForecastSchema = createInsertSchema(salesForecasts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserRoleSchema = createInsertSchema(userRoles).omit({
  id: true,
  assignedAt: true,
});

export const insertEmailSequenceSchema = createInsertSchema(emailSequences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeadScoringSchema = createInsertSchema(leadScoring).omit({
  id: true,
  lastCalculated: true,
});

// Duplicate schema exports removed - using enhanced versions above

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Duplicate audit log schema removed - using Super Admin version above

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Advanced feature types
export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type SalesForecast = typeof salesForecasts.$inferSelect;
export type InsertSalesForecast = z.infer<typeof insertSalesForecastSchema>;
export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
export type EmailSequence = typeof emailSequences.$inferSelect;
export type InsertEmailSequence = z.infer<typeof insertEmailSequenceSchema>;
export type LeadScoring = typeof leadScoring.$inferSelect;
export type InsertLeadScoring = z.infer<typeof insertLeadScoringSchema>;
export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
// Duplicate audit log types removed - using Super Admin version above
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

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
  status: varchar("status").notNull(), // active, inactive, trial, expired, cancelled, locked
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  trialEndDate: timestamp("trial_end_date"),
  autoRenew: boolean("auto_renew").default(true),
  paymentMethod: varchar("payment_method"), // stripe, manual, etc
  paymentMethodId: varchar("payment_method_id"), // Stripe payment method ID
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  stripeCustomerId: varchar("stripe_customer_id"),
  paidAt: timestamp("paid_at"), // When first payment was made
  lockedAt: timestamp("locked_at"), // When account was locked
  lockReason: varchar("lock_reason"), // trial_expired, payment_failed, etc
  trialWarningsSent: integer("trial_warnings_sent").default(0), // Number of warnings sent
  lastWarningAt: timestamp("last_warning_at"), // When last warning was sent
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

// Subscription schemas
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans);
export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions);
export const insertPackageFeatureSchema = createInsertSchema(packageFeatures);
export const insertPlanFeatureAccessSchema = createInsertSchema(planFeatureAccess);
export const insertUsageTrackingSchema = createInsertSchema(usageTracking);

// Customer Journey Visualization Tables
export const customerJourneyStages = pgTable("customer_journey_stages", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  displayName: varchar("display_name").notNull(),
  description: text("description"),
  stageType: varchar("stage_type").notNull(), // lead, prospect, customer, advocate, churned
  sortOrder: integer("sort_order").default(0),
  color: varchar("color").default("#3B82F6"), // hex color for visualization
  icon: varchar("icon").default("user"), // lucide icon name
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customerJourneyEvents = pgTable("customer_journey_events", {
  id: varchar("id").primaryKey(),
  contactId: varchar("contact_id").references(() => contacts.id).notNull(),
  eventType: varchar("event_type").notNull(), // stage_change, interaction, milestone, touchpoint
  eventName: varchar("event_name").notNull(),
  description: text("description"),
  fromStage: varchar("from_stage"), // for stage_change events
  toStage: varchar("to_stage"), // for stage_change events
  metadata: jsonb("metadata").$type<{
    channel?: string; // email, phone, web, social, in-person
    source?: string; // campaign, referral, organic, etc.
    value?: number; // monetary value if applicable
    duration?: number; // time spent in minutes
    outcome?: string; // success, failure, pending
    tags?: string[];
    customFields?: Record<string, any>;
  }>(),
  triggeredBy: varchar("triggered_by"), // user_id or system
  eventDate: timestamp("event_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_journey_events_contact").on(table.contactId),
  index("idx_journey_events_date").on(table.eventDate),
  index("idx_journey_events_type").on(table.eventType),
]);

export const customerJourneyMilestones = pgTable("customer_journey_milestones", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  displayName: varchar("display_name").notNull(),
  description: text("description"),
  stageId: varchar("stage_id").references(() => customerJourneyStages.id).notNull(),
  triggerConditions: jsonb("trigger_conditions").$type<{
    eventTypes?: string[];
    timeInStage?: number; // minutes
    interactionCount?: number;
    dealValue?: number;
    customCriteria?: Record<string, any>;
  }>(),
  isAutomatic: boolean("is_automatic").default(true), // auto-triggered vs manual
  points: integer("points").default(0), // scoring points for achieving milestone
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customerJourneyProgress = pgTable("customer_journey_progress", {
  id: varchar("id").primaryKey(),
  contactId: varchar("contact_id").references(() => contacts.id).notNull(),
  currentStage: varchar("current_stage").references(() => customerJourneyStages.id).notNull(),
  stageEntryDate: timestamp("stage_entry_date").notNull(),
  totalDurationInStage: integer("total_duration_in_stage").default(0), // minutes
  interactionCount: integer("interaction_count").default(0),
  lastInteractionDate: timestamp("last_interaction_date"),
  journeyScore: integer("journey_score").default(0), // accumulated points
  completedMilestones: jsonb("completed_milestones").$type<string[]>().default([]),
  nextPredictedStage: varchar("next_predicted_stage"),
  stageConfidence: real("stage_confidence"), // AI confidence in current stage (0-1)
  estimatedTimeToNextStage: integer("estimated_time_to_next_stage"), // minutes
  riskScore: real("risk_score"), // churn/drop-off risk (0-1)
  metadata: jsonb("metadata").$type<{
    preferences?: Record<string, any>;
    behaviors?: string[];
    segments?: string[];
    predictions?: Record<string, any>;
  }>(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_journey_progress_contact").on(table.contactId),
  index("idx_journey_progress_stage").on(table.currentStage),
]);

// Journey Analytics and Insights
export const journeyAnalytics = pgTable("journey_analytics", {
  id: varchar("id").primaryKey(),
  period: varchar("period").notNull(), // daily, weekly, monthly
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  metrics: jsonb("metrics").$type<{
    totalContacts: number;
    stageDistribution: Record<string, number>;
    conversionRates: Record<string, number>; // stage to stage conversion
    averageStageTime: Record<string, number>; // average time in each stage
    dropOffRates: Record<string, number>;
    topEvents: Array<{ event: string; count: number }>;
    journeyVelocity: number; // overall speed through journey
    completionRate: number; // percentage reaching final stage
  }>(),
  insights: jsonb("insights").$type<{
    trends: string[];
    opportunities: string[];
    risks: string[];
    recommendations: string[];
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_journey_analytics_period").on(table.period, table.periodStart),
]);

// Insert schemas for journey tables
export const insertCustomerJourneyStageSchema = createInsertSchema(customerJourneyStages);
export const insertCustomerJourneyEventSchema = createInsertSchema(customerJourneyEvents);
export const insertCustomerJourneyMilestoneSchema = createInsertSchema(customerJourneyMilestones);
export const insertCustomerJourneyProgressSchema = createInsertSchema(customerJourneyProgress);
export const insertJourneyAnalyticsSchema = createInsertSchema(journeyAnalytics);

// Types for journey tables
export type CustomerJourneyStage = typeof customerJourneyStages.$inferSelect;
export type CustomerJourneyEvent = typeof customerJourneyEvents.$inferSelect;
export type CustomerJourneyMilestone = typeof customerJourneyMilestones.$inferSelect;
export type CustomerJourneyProgress = typeof customerJourneyProgress.$inferSelect;
export type JourneyAnalytics = typeof journeyAnalytics.$inferSelect;

export type InsertCustomerJourneyStage = z.infer<typeof insertCustomerJourneyStageSchema>;
export type InsertCustomerJourneyEvent = z.infer<typeof insertCustomerJourneyEventSchema>;
export type InsertCustomerJourneyMilestone = z.infer<typeof insertCustomerJourneyMilestoneSchema>;
export type InsertCustomerJourneyProgress = z.infer<typeof insertCustomerJourneyProgressSchema>;
export type InsertJourneyAnalytics = z.infer<typeof insertJourneyAnalyticsSchema>;

// Subscription types
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

// ===============================================
// ADVANCED CRM FEATURES FOR MARKET LEADERSHIP
// ===============================================

// Advanced Lead Management with AI Scoring
export const crmLeads = pgTable("crm_leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  company: varchar("company", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  source: varchar("source", { length: 100 }), // organic, paid, referral, etc
  status: varchar("status", { length: 50 }).default("new"), // new, contacted, qualified, converted
  
  // AI-Powered Lead Scoring
  aiScore: integer("ai_score").default(0), // 0-100 score
  predictedValue: decimal("predicted_value", { precision: 10, scale: 2 }).default("0"),
  conversionProbability: decimal("conversion_probability", { precision: 5, scale: 2 }).default("0"), // 0-100%
  
  // Behavioral Data
  websiteVisits: integer("website_visits").default(0),
  emailOpens: integer("email_opens").default(0),
  emailClicks: integer("email_clicks").default(0),
  lastActivity: timestamp("last_activity"),
  
  // Geographic and Demographic
  country: varchar("country", { length: 2 }), // ISO country code
  city: varchar("city", { length: 100 }),
  industry: varchar("industry", { length: 100 }),
  companySize: varchar("company_size", { length: 50 }),
  
  // Metadata
  assignedTo: uuid("assigned_to").references(() => users.id),
  notes: text("notes"),
  tags: text("tags").array(), // ["hot", "enterprise", "technical"]
  customFields: jsonb("custom_fields").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Advanced Pipeline Management
export const pipelines = pgTable("pipelines", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  stages: jsonb("stages").notNull(), // [{id, name, probability, color}]
  isDefault: boolean("is_default").default(false),
  currency: varchar("currency", { length: 3 }).default("USD"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Advanced Deals with AI Predictions
export const crmDeals = pgTable("crm_deals", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("USD"),
  
  // Pipeline Management
  pipelineId: uuid("pipeline_id").references(() => pipelines.id),
  stageId: varchar("stage_id", { length: 50 }),
  probability: integer("probability").default(0), // 0-100%
  
  // Relationships
  contactId: uuid("contact_id"),
  companyId: uuid("company_id"),
  assignedTo: uuid("assigned_to").references(() => users.id),
  
  // AI Predictions
  aiCloseDate: timestamp("ai_close_date"), // AI predicted close date
  aiCloseProbability: decimal("ai_close_probability", { precision: 5, scale: 2 }),
  riskLevel: varchar("risk_level", { length: 20 }).default("low"), // low, medium, high
  
  // Dates
  expectedCloseDate: timestamp("expected_close_date"),
  actualCloseDate: timestamp("actual_close_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  
  // Additional fields
  source: varchar("source", { length: 100 }),
  lostReason: varchar("lost_reason", { length: 255 }),
  notes: text("notes"),
  customFields: jsonb("custom_fields").default({}),
});

// Enhanced Contact Management
export const crmContacts = pgTable("crm_contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  email: varchar("email", { length: 255 }).unique(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  phone: varchar("phone", { length: 50 }),
  mobile: varchar("mobile", { length: 50 }),
  
  // Professional Info
  jobTitle: varchar("job_title", { length: 150 }),
  department: varchar("department", { length: 100 }),
  companyId: uuid("company_id"),
  
  // Communication Preferences
  preferredChannel: varchar("preferred_channel", { length: 50 }).default("email"), // email, phone, whatsapp, sms
  timezone: varchar("timezone", { length: 50 }),
  language: varchar("language", { length: 10 }).default("en"),
  
  // Social Media
  linkedinUrl: varchar("linkedin_url", { length: 500 }),
  twitterHandle: varchar("twitter_handle", { length: 100 }),
  facebookUrl: varchar("facebook_url", { length: 500 }),
  
  // Engagement Data
  lastContactDate: timestamp("last_contact_date"),
  contactFrequency: integer("contact_frequency").default(0), // days between contacts
  engagementScore: integer("engagement_score").default(0), // 0-100
  
  // Metadata
  tags: text("tags").array(),
  status: varchar("status", { length: 50 }).default("active"), // active, inactive, bounced
  source: varchar("source", { length: 100 }),
  assignedTo: uuid("assigned_to").references(() => users.id),
  customFields: jsonb("custom_fields").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Company/Account Management
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  website: varchar("website", { length: 500 }),
  industry: varchar("industry", { length: 100 }),
  
  // Business Information
  employeeCount: integer("employee_count"),
  annualRevenue: decimal("annual_revenue", { precision: 15, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("USD"),
  
  // Contact Information
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  
  // Address
  street: varchar("street", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  country: varchar("country", { length: 2 }), // ISO code
  
  // Business Details
  businessType: varchar("business_type", { length: 100 }), // corporation, partnership, etc
  taxId: varchar("tax_id", { length: 50 }),
  registrationNumber: varchar("registration_number", { length: 100 }),
  
  // CRM Data
  status: varchar("status", { length: 50 }).default("active"),
  customerSince: timestamp("customer_since"),
  lastActivity: timestamp("last_activity"),
  assignedTo: uuid("assigned_to").references(() => users.id),
  
  // AI Insights
  healthScore: integer("health_score").default(50), // 0-100
  churnRisk: varchar("churn_risk", { length: 20 }).default("low"), // low, medium, high
  lifetimeValue: decimal("lifetime_value", { precision: 15, scale: 2 }).default("0"),
  
  // Metadata
  tags: text("tags").array(),
  customFields: jsonb("custom_fields").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Activities and Interactions
export const crmActivities = pgTable("crm_activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // call, email, meeting, task, note
  title: varchar("title", { length: 255 }),
  description: text("description"),
  
  // Relationships
  contactId: uuid("contact_id"),
  companyId: uuid("company_id"),
  dealId: uuid("deal_id"),
  leadId: uuid("lead_id"),
  
  // Activity Details
  status: varchar("status", { length: 50 }).default("completed"), // scheduled, completed, cancelled
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high
  duration: integer("duration"), // minutes
  
  // Scheduling
  scheduledAt: timestamp("scheduled_at"),
  completedAt: timestamp("completed_at"),
  dueDate: timestamp("due_date"),
  
  // Communication Data
  direction: varchar("direction", { length: 10 }), // inbound, outbound
  channel: varchar("channel", { length: 50 }), // email, phone, whatsapp, meeting
  outcome: varchar("outcome", { length: 100 }), // connected, left_voicemail, no_answer, etc
  
  // AI Analysis
  sentimentScore: decimal("sentiment_score", { precision: 3, scale: 2 }), // -1 to 1
  keywords: text("keywords").array(),
  actionItems: jsonb("action_items"), // extracted action items from AI
  
  // Metadata
  createdBy: uuid("created_by").references(() => users.id),
  assignedTo: uuid("assigned_to").references(() => users.id),
  isPrivate: boolean("is_private").default(false),
  customFields: jsonb("custom_fields").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email Marketing and Automation
export const emailCampaigns = pgTable("email_campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }),
  content: text("content"),
  templateId: uuid("template_id"),
  
  // Campaign Settings
  type: varchar("type", { length: 50 }).default("one_time"), // one_time, drip, trigger
  status: varchar("status", { length: 50 }).default("draft"), // draft, scheduled, sending, sent, paused
  
  // Scheduling
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  
  // Targeting
  segmentId: uuid("segment_id"),
  recipientCount: integer("recipient_count").default(0),
  
  // Performance Metrics
  openRate: decimal("open_rate", { precision: 5, scale: 2 }).default("0"),
  clickRate: decimal("click_rate", { precision: 5, scale: 2 }).default("0"),
  bounceRate: decimal("bounce_rate", { precision: 5, scale: 2 }).default("0"),
  unsubscribeRate: decimal("unsubscribe_rate", { precision: 5, scale: 2 }).default("0"),
  
  // AI Optimization
  aiOptimized: boolean("ai_optimized").default(false),
  aiSubjectLine: varchar("ai_subject_line", { length: 255 }),
  aiSendTime: timestamp("ai_send_time"),
  
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// CRM Workflow Automation
export const crmWorkflows = pgTable("crm_workflows", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Workflow Configuration
  trigger: jsonb("trigger").notNull(), // {type: "contact_created", conditions: [...]}
  actions: jsonb("actions").notNull(), // [{type: "send_email", config: {...}}, ...]
  
  // Status and Control
  isActive: boolean("is_active").default(true),
  version: integer("version").default(1),
  
  // Performance
  executionCount: integer("execution_count").default(0),
  successRate: decimal("success_rate", { precision: 5, scale: 2 }).default("100"),
  lastExecuted: timestamp("last_executed"),
  
  // Metadata
  createdBy: uuid("created_by").references(() => users.id),
  tags: text("tags").array(),
  category: varchar("category", { length: 100 }), // sales, marketing, support
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Communication Channels
export const communicationChannels = pgTable("communication_channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // whatsapp, sms, email, voice
  name: varchar("name", { length: 255 }),
  
  // Configuration
  config: jsonb("config").notNull(), // channel-specific settings
  isActive: boolean("is_active").default(true),
  
  // Usage Statistics
  messagesSent: integer("messages_sent").default(0),
  messagesReceived: integer("messages_received").default(0),
  lastUsed: timestamp("last_used"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Predictions and Insights
export const aiInsights = pgTable("ai_insights", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(), // lead, deal, contact, company
  entityId: uuid("entity_id").notNull(),
  
  // Insight Data
  insightType: varchar("insight_type", { length: 100 }).notNull(), // churn_risk, upsell_opportunity, etc
  confidence: decimal("confidence", { precision: 5, scale: 2 }), // 0-100%
  value: jsonb("value"), // insight-specific data
  
  // Recommendations
  recommendations: jsonb("recommendations"), // suggested actions
  impact: varchar("impact", { length: 20 }), // low, medium, high
  
  // Lifecycle
  isActive: boolean("is_active").default(true),
  acknowledgedBy: uuid("acknowledged_by").references(() => users.id),
  acknowledgedAt: timestamp("acknowledged_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// CRM Reports and Analytics
export const crmReports = pgTable("crm_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Report Configuration
  type: varchar("type", { length: 50 }).notNull(), // sales, marketing, activity, custom
  config: jsonb("config").notNull(), // filters, grouping, metrics
  
  // Scheduling
  isScheduled: boolean("is_scheduled").default(false),
  schedule: jsonb("schedule"), // cron-like schedule
  recipients: text("recipients").array(), // email addresses
  
  // Access Control
  isPublic: boolean("is_public").default(false),
  sharedWith: text("shared_with").array(), // user emails
  
  // Metadata
  createdBy: uuid("created_by").references(() => users.id),
  lastGenerated: timestamp("last_generated"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Integration Management
export const integrations = pgTable("integrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(), // zapier, webhook, api, email
  
  // Configuration
  config: jsonb("config").notNull(),
  isActive: boolean("is_active").default(true),
  
  // Authentication
  authType: varchar("auth_type", { length: 50 }), // oauth, api_key, basic
  credentials: jsonb("credentials"), // encrypted credentials
  
  // Performance
  lastSync: timestamp("last_sync"),
  syncStatus: varchar("sync_status", { length: 50 }).default("active"), // active, error, paused
  errorCount: integer("error_count").default(0),
  
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Custom Fields Definition
export const customFields = pgTable("custom_fields", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(), // lead, contact, company, deal
  name: varchar("name", { length: 255 }).notNull(),
  label: varchar("label", { length: 255 }),
  
  // Field Configuration
  fieldType: varchar("field_type", { length: 50 }).notNull(), // text, number, date, select, multi_select
  isRequired: boolean("is_required").default(false),
  defaultValue: text("default_value"),
  
  // Select field options
  options: jsonb("options"), // for select/multi_select fields
  
  // Validation
  validation: jsonb("validation"), // regex, min/max, etc
  
  // Display
  displayOrder: integer("display_order").default(0),
  isVisible: boolean("is_visible").default(true),
  
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// WhatsApp Integration
export const whatsappMessages = pgTable("whatsapp_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  contactId: uuid("contact_id"),
  
  // Message Data
  messageId: varchar("message_id", { length: 255 }), // WhatsApp message ID
  direction: varchar("direction", { length: 10 }).notNull(), // inbound, outbound
  messageType: varchar("message_type", { length: 50 }).default("text"), // text, image, document, etc
  content: text("content"),
  
  // Status
  status: varchar("status", { length: 50 }).default("pending"), // pending, sent, delivered, read, failed
  timestamp: timestamp("timestamp").defaultNow(),
  
  // Metadata
  phoneNumber: varchar("phone_number", { length: 20 }),
  mediaUrl: varchar("media_url", { length: 500 }),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Mobile App User Sessions
export const mobileSessions = pgTable("mobile_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  userId: uuid("user_id").references(() => users.id),
  
  // Session Data
  deviceType: varchar("device_type", { length: 50 }), // ios, android
  deviceId: varchar("device_id", { length: 255 }),
  appVersion: varchar("app_version", { length: 20 }),
  
  // Activity
  lastActivity: timestamp("last_activity").defaultNow(),
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Advanced CRM Types
export type CrmLead = typeof crmLeads.$inferSelect;
export type InsertCrmLead = typeof crmLeads.$inferInsert;
export type Pipeline = typeof pipelines.$inferSelect;
export type InsertPipeline = typeof pipelines.$inferInsert;
export type CrmDeal = typeof crmDeals.$inferSelect;
export type InsertCrmDeal = typeof crmDeals.$inferInsert;
export type CrmContact = typeof crmContacts.$inferSelect;
export type InsertCrmContact = typeof crmContacts.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;
export type CrmActivity = typeof crmActivities.$inferSelect;
export type InsertCrmActivity = typeof crmActivities.$inferInsert;
export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type InsertEmailCampaign = typeof emailCampaigns.$inferInsert;
export type CrmWorkflow = typeof crmWorkflows.$inferSelect;
export type InsertCrmWorkflow = typeof crmWorkflows.$inferInsert;
export type WhatsappMessage = typeof whatsappMessages.$inferSelect;
export type InsertWhatsappMessage = typeof whatsappMessages.$inferInsert;

// Insert schemas for CRM features
export const insertCrmLeadSchema = createInsertSchema(crmLeads);
export const insertPipelineSchema = createInsertSchema(pipelines);
export const insertCrmDealSchema = createInsertSchema(crmDeals);
export const insertCrmContactSchema = createInsertSchema(crmContacts);
export const insertCompanySchema = createInsertSchema(companies);
export const insertCrmActivitySchema = createInsertSchema(crmActivities);
export const insertEmailCampaignSchema = createInsertSchema(emailCampaigns);
export const insertCrmWorkflowSchema = createInsertSchema(crmWorkflows);
export const insertWhatsappMessageSchema = createInsertSchema(whatsappMessages);

// Tenant Payment Configuration Schemas and Types
export const insertTenantPaymentConfigSchema = createInsertSchema(tenantPaymentConfigs, {
  stripePublicKey: z.string().startsWith("pk_").optional(),
  stripeSecretKey: z.string().startsWith("sk_").optional(),
  visaApiKey: z.string().min(1).optional(),
  visaMerchantId: z.string().min(1).optional(),
  defaultProvider: z.enum(["stripe", "visa"]).default("stripe"),
  testMode: z.boolean().default(true),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectTenantPaymentConfigSchema = createInsertSchema(tenantPaymentConfigs);

export const insertTenantPaymentTransactionSchema = createInsertSchema(tenantPaymentTransactions, {
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format"),
  currency: z.string().length(3, "Currency must be 3 characters"),
  status: z.enum(["pending", "completed", "failed", "refunded"]),
  provider: z.enum(["stripe", "visa"]),
}).omit({
  id: true,
  createdAt: true,
});

export const selectTenantPaymentTransactionSchema = createInsertSchema(tenantPaymentTransactions);

// TypeScript types for tenant payment system
export type TenantPaymentConfig = typeof tenantPaymentConfigs.$inferSelect;
export type InsertTenantPaymentConfig = z.infer<typeof insertTenantPaymentConfigSchema>;
export type TenantPaymentTransaction = typeof tenantPaymentTransactions.$inferSelect;
export type InsertTenantPaymentTransaction = z.infer<typeof insertTenantPaymentTransactionSchema>;

// Payment provider status interface
export interface PaymentProviderStatus {
  stripe: {
    enabled: boolean;
    configured: boolean;
    testMode: boolean;
    lastUsed?: string;
  };
  visa: {
    enabled: boolean;
    configured: boolean;
    testMode: boolean;
    lastUsed?: string;
  };
}

// Payment configuration validation
export const paymentConfigValidationSchema = z.object({
  provider: z.enum(["stripe", "visa"]),
  testMode: z.boolean(),
  stripeConfig: z.object({
    publicKey: z.string().startsWith("pk_").optional(),
    secretKey: z.string().startsWith("sk_").optional(),
    webhookSecret: z.string().optional(),
  }).optional(),
  visaConfig: z.object({
    apiKey: z.string().min(1).optional(),
    merchantId: z.string().min(1).optional(),
  }).optional(),
});

export type PaymentConfigValidation = z.infer<typeof paymentConfigValidationSchema>;

// ==================== E-COMMERCE HEALTH MONITORING ====================

// E-commerce platform health metrics
export const ecommerceHealthMetrics = pgTable("ecommerce_health_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  storeId: integer("store_id"),
  metricType: text("metric_type").notNull(), // sales, inventory, performance, customer, system
  metricName: text("metric_name").notNull(),
  metricValue: decimal("metric_value", { precision: 15, scale: 2 }).notNull(),
  metricUnit: text("metric_unit").default("count"), // count, percentage, currency, time, bytes
  
  // Threshold management
  warningThreshold: decimal("warning_threshold", { precision: 15, scale: 2 }),
  criticalThreshold: decimal("critical_threshold", { precision: 15, scale: 2 }),
  healthStatus: text("health_status").default("healthy"), // healthy, warning, critical, unknown
  
  // Time-based data
  recordedAt: timestamp("recorded_at").defaultNow(),
  timeWindow: text("time_window").default("1h"), // 1h, 24h, 7d, 30d
  
  // Contextual data
  metadata: jsonb("metadata").$type<{
    source?: string;
    category?: string;
    tags?: string[];
    description?: string;
    calculation?: string;
  }>().default({}),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ecommerce_health_tenant").on(table.tenantId),
  index("idx_ecommerce_health_store").on(table.storeId),
  index("idx_ecommerce_health_type").on(table.metricType),
  index("idx_ecommerce_health_recorded").on(table.recordedAt),
  index("idx_ecommerce_health_status").on(table.healthStatus),
]);

// E-commerce system alerts
export const ecommerceSystemAlerts = pgTable("ecommerce_system_alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  storeId: integer("store_id"),
  alertType: text("alert_type").notNull(), // performance, inventory, sales, security, system
  severity: text("severity").notNull(), // low, medium, high, critical
  
  // Alert details
  title: text("title").notNull(),
  message: text("message").notNull(),
  source: text("source").notNull(), // system, user, integration, monitor
  
  // Resolution tracking
  status: text("status").default("open"), // open, acknowledged, resolved, suppressed
  acknowledgedBy: uuid("acknowledged_by").references(() => users.id),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolvedBy: uuid("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  resolution: text("resolution"),
  
  // Context and metadata
  affectedComponents: jsonb("affected_components").$type<string[]>().default([]),
  metadata: jsonb("metadata").$type<{
    threshold?: number;
    actualValue?: number;
    expectedValue?: number;
    impact?: string;
    recommendation?: string;
    relatedAlerts?: string[];
  }>().default({}),
  
  // Notification tracking
  notificationsSent: jsonb("notifications_sent").$type<Array<{
    channel: string;
    recipient: string;
    sentAt: string;
    status: string;
  }>>().default([]),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_ecommerce_alerts_tenant").on(table.tenantId),
  index("idx_ecommerce_alerts_store").on(table.storeId),
  index("idx_ecommerce_alerts_type").on(table.alertType),
  index("idx_ecommerce_alerts_severity").on(table.severity),
  index("idx_ecommerce_alerts_status").on(table.status),
  index("idx_ecommerce_alerts_created").on(table.createdAt),
]);

// E-commerce performance snapshots
export const ecommercePerformanceSnapshots = pgTable("ecommerce_performance_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  storeId: integer("store_id"),
  snapshotType: text("snapshot_type").notNull(), // hourly, daily, weekly, monthly
  
  // Sales metrics
  totalSales: decimal("total_sales", { precision: 15, scale: 2 }).default("0.00"),
  orderCount: integer("order_count").default(0),
  averageOrderValue: decimal("average_order_value", { precision: 15, scale: 2 }).default("0.00"),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }).default("0.00"),
  
  // Traffic metrics
  totalVisitors: integer("total_visitors").default(0),
  uniqueVisitors: integer("unique_visitors").default(0),
  pageViews: integer("page_views").default(0),
  bounceRate: decimal("bounce_rate", { precision: 5, scale: 2 }).default("0.00"),
  
  // Performance metrics
  averageLoadTime: decimal("average_load_time", { precision: 8, scale: 3 }).default("0.000"),
  uptime: decimal("uptime", { precision: 5, scale: 2 }).default("100.00"),
  errorRate: decimal("error_rate", { precision: 5, scale: 2 }).default("0.00"),
  
  // Inventory metrics
  totalProducts: integer("total_products").default(0),
  lowStockProducts: integer("low_stock_products").default(0),
  outOfStockProducts: integer("out_of_stock_products").default(0),
  
  // Customer metrics
  newCustomers: integer("new_customers").default(0),
  returningCustomers: integer("returning_customers").default(0),
  customerSatisfaction: decimal("customer_satisfaction", { precision: 5, scale: 2 }).default("0.00"),
  
  // Financial metrics
  totalRevenue: decimal("total_revenue", { precision: 15, scale: 2 }).default("0.00"),
  totalCosts: decimal("total_costs", { precision: 15, scale: 2 }).default("0.00"),
  profitMargin: decimal("profit_margin", { precision: 5, scale: 2 }).default("0.00"),
  
  // Time range
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  // Metadata
  dataQuality: decimal("data_quality", { precision: 5, scale: 2 }).default("100.00"),
  calculatedAt: timestamp("calculated_at").defaultNow(),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ecommerce_snapshots_tenant").on(table.tenantId),
  index("idx_ecommerce_snapshots_store").on(table.storeId),
  index("idx_ecommerce_snapshots_type").on(table.snapshotType),
  index("idx_ecommerce_snapshots_period").on(table.periodStart, table.periodEnd),
]);

// Zod schemas for health monitoring
export const ecommerceHealthMetricInsertSchema = createInsertSchema(ecommerceHealthMetrics);
export const ecommerceSystemAlertInsertSchema = createInsertSchema(ecommerceSystemAlerts);
export const ecommercePerformanceSnapshotInsertSchema = createInsertSchema(ecommercePerformanceSnapshots);

export type EcommerceHealthMetric = typeof ecommerceHealthMetrics.$inferSelect;
export type EcommerceSystemAlert = typeof ecommerceSystemAlerts.$inferSelect;
export type EcommercePerformanceSnapshot = typeof ecommercePerformanceSnapshots.$inferSelect;

export type InsertEcommerceHealthMetric = z.infer<typeof ecommerceHealthMetricInsertSchema>;
export type InsertEcommerceSystemAlert = z.infer<typeof ecommerceSystemAlertInsertSchema>;
export type InsertEcommercePerformanceSnapshot = z.infer<typeof ecommercePerformanceSnapshotInsertSchema>;

// ==================== AI EMOTIONAL INTELLIGENCE SYSTEM ====================

// Customer Emotional Intelligence tables
export const customerEmotionalProfiles = pgTable("customer_emotional_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull(),
  interactionDate: timestamp("interaction_date").defaultNow().notNull(),
  primaryEmotion: varchar("primary_emotion"),
  sentimentScore: decimal("sentiment_score", { precision: 3, scale: 2 }),
  stressIndicators: jsonb("stress_indicators").$type<string[]>(),
  preferredCommunicationStyle: varchar("preferred_communication_style"),
  emotionalTriggers: jsonb("emotional_triggers").$type<string[]>(),
  satisfactionTrend: varchar("satisfaction_trend"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const emotionalAnalysisLogs = pgTable("emotional_analysis_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id"),
  interactionId: varchar("interaction_id"),
  channel: varchar("channel"), // email, chat, phone, social
  analysisType: varchar("analysis_type"), // sentiment, emotion, voice
  analysisResult: jsonb("analysis_result"),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  urgencyLevel: varchar("urgency_level"),
  recommendedActions: jsonb("recommended_actions").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow()
});

export const agentPerformanceMetrics = pgTable("agent_performance_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull(),
  metricType: varchar("metric_type"), // resolution_time, satisfaction, emotional_handling
  metricValue: decimal("metric_value", { precision: 5, scale: 2 }),
  period: varchar("period"), // daily, weekly, monthly
  date: timestamp("date").defaultNow(),
  emotionalContexts: jsonb("emotional_contexts").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow()
});

export const ticketRoutingDecisions = pgTable("ticket_routing_decisions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").notNull(),
  customerId: varchar("customer_id"),
  emotionalAnalysis: jsonb("emotional_analysis"),
  assignedAgent: varchar("assigned_agent"),
  priority: varchar("priority"),
  routingReason: text("routing_reason"),
  actualResolutionTime: integer("actual_resolution_time"),
  customerSatisfaction: decimal("customer_satisfaction", { precision: 3, scale: 2 }),
  routingAccuracy: decimal("routing_accuracy", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow()
});

export const churnPredictions = pgTable("churn_predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().unique(),
  riskLevel: varchar("risk_level"), // HIGH, MEDIUM, LOW
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  riskFactors: jsonb("risk_factors").$type<string[]>(),
  recommendedInterventions: jsonb("recommended_interventions").$type<string[]>(),
  predictionDate: timestamp("prediction_date").defaultNow(),
  actualChurnDate: timestamp("actual_churn_date"),
  predictionAccuracy: varchar("prediction_accuracy"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Create insert schemas for emotional intelligence tables
export const insertCustomerEmotionalProfileSchema = createInsertSchema(customerEmotionalProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmotionalAnalysisLogSchema = createInsertSchema(emotionalAnalysisLogs).omit({
  id: true,
  createdAt: true,
});

export const insertAgentPerformanceMetricsSchema = createInsertSchema(agentPerformanceMetrics).omit({
  id: true,
  createdAt: true,
});

export const insertTicketRoutingDecisionSchema = createInsertSchema(ticketRoutingDecisions).omit({
  id: true,
  createdAt: true,
});

export const insertChurnPredictionSchema = createInsertSchema(churnPredictions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for emotional intelligence
export type CustomerEmotionalProfile = typeof customerEmotionalProfiles.$inferSelect;
export type InsertCustomerEmotionalProfile = z.infer<typeof insertCustomerEmotionalProfileSchema>;
export type EmotionalAnalysisLog = typeof emotionalAnalysisLogs.$inferSelect;
export type InsertEmotionalAnalysisLog = z.infer<typeof insertEmotionalAnalysisLogSchema>;
export type AgentPerformanceMetric = typeof agentPerformanceMetrics.$inferSelect;
export type InsertAgentPerformanceMetric = z.infer<typeof insertAgentPerformanceMetricsSchema>;
export type TicketRoutingDecision = typeof ticketRoutingDecisions.$inferSelect;
export type InsertTicketRoutingDecision = z.infer<typeof insertTicketRoutingDecisionSchema>;
export type ChurnPrediction = typeof churnPredictions.$inferSelect;
export type InsertChurnPrediction = z.infer<typeof insertChurnPredictionSchema>;

// ================================
// SALES CHANNELS & INTEGRATIONS  
// ================================

// Sales channel integrations (TikTok, Facebook, Instagram, Google Ads, etc.)
export const salesChannels = pgTable("sales_channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(), // CRITICAL: Tenant isolation
  userId: uuid("user_id").references(() => users.id).notNull(), // Who connected this channel
  platformId: text("platform_id").notNull(), // tiktok, facebook_business, instagram_business, google_ads, etc.
  platformName: text("platform_name").notNull(), // Human-readable name
  status: text("status").notNull().default("disconnected"), // connected, disconnected, error, pending_auth
  
  // Platform-specific configuration (encrypted in production)
  config: jsonb("config").$type<{
    apiKey?: string;
    accessToken?: string;
    refreshToken?: string;
    clientId?: string;
    clientSecret?: string;
    accountId?: string;
    pixelId?: string;
    businessManagerId?: string;
    webhookUrl?: string;
    settings?: Record<string, any>;
  }>().default({}),
  
  lastSync: timestamp("last_sync"),
  syncStats: jsonb("sync_stats").$type<{
    totalLeads: number;
    totalOrders: number;
    totalRevenue: number;
    lastSyncResult: 'success' | 'error' | 'partial';
    lastError?: string;
  }>().default({
    totalLeads: 0,
    totalOrders: 0,
    totalRevenue: 0,
    lastSyncResult: 'success'
  }),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_sales_channels_tenant").on(table.tenantId),
  index("idx_sales_channels_platform").on(table.platformId),
  index("idx_sales_channels_status").on(table.status),
]);

// Sales channel metrics and analytics
export const salesChannelMetrics = pgTable("sales_channel_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  channelId: uuid("channel_id").references(() => salesChannels.id).notNull(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(), // CRITICAL: Tenant isolation
  
  // Time period for this metric snapshot
  metricDate: date("metric_date").notNull(),
  period: text("period").notNull().default("daily"), // daily, weekly, monthly
  
  // Performance metrics
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  revenue: decimal("revenue", { precision: 12, scale: 2 }).default("0.00"),
  cost: decimal("cost", { precision: 12, scale: 2 }).default("0.00"),
  
  // Calculated metrics
  ctr: real("ctr").default(0), // Click-through rate
  cpc: decimal("cpc", { precision: 8, scale: 2 }).default("0.00"), // Cost per click
  cpm: decimal("cpm", { precision: 8, scale: 2 }).default("0.00"), // Cost per mille
  roas: real("roas").default(0), // Return on ad spend
  conversionRate: real("conversion_rate").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_sales_channel_metrics_tenant").on(table.tenantId),
  index("idx_sales_channel_metrics_channel").on(table.channelId),
  index("idx_sales_channel_metrics_date").on(table.metricDate),
]);

// Sales channel leads/contacts integration
export const salesChannelLeads = pgTable("sales_channel_leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  channelId: uuid("channel_id").references(() => salesChannels.id).notNull(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(), // CRITICAL: Tenant isolation
  contactId: uuid("contact_id").references(() => contacts.id), // Link to CRM contact
  
  // Lead source data
  platformLeadId: text("platform_lead_id").notNull(), // ID from the platform
  campaignId: text("campaign_id"),
  campaignName: text("campaign_name"),
  adSetId: text("ad_set_id"),
  adSetName: text("ad_set_name"),
  adId: text("ad_id"),
  adName: text("ad_name"),
  
  // Lead information
  email: text("email"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  company: text("company"),
  
  // Lead metadata
  leadSource: text("lead_source"), // organic, paid, social, etc.
  leadValue: decimal("lead_value", { precision: 12, scale: 2 }),
  leadStatus: text("lead_status").default("new"), // new, contacted, qualified, converted
  
  // Platform-specific data
  platformData: jsonb("platform_data").$type<Record<string, any>>().default({}),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_sales_channel_leads_tenant").on(table.tenantId),
  index("idx_sales_channel_leads_channel").on(table.channelId),
  index("idx_sales_channel_leads_email").on(table.email),
  index("idx_sales_channel_leads_platform").on(table.platformLeadId),
]);

// Schema exports for sales channels
export type SalesChannel = typeof salesChannels.$inferSelect;
export type InsertSalesChannel = typeof salesChannels.$inferInsert;
export type SalesChannelMetrics = typeof salesChannelMetrics.$inferSelect;
export type InsertSalesChannelMetrics = typeof salesChannelMetrics.$inferInsert;
export type SalesChannelLead = typeof salesChannelLeads.$inferSelect;
export type InsertSalesChannelLead = typeof salesChannelLeads.$inferInsert;

// Insert schemas for validation
export const insertSalesChannelSchema = createInsertSchema(salesChannels);
export const insertSalesChannelMetricsSchema = createInsertSchema(salesChannelMetrics);
export const insertSalesChannelLeadSchema = createInsertSchema(salesChannelLeads);

// ================================
// AI CAMPAIGN STUDIO & CONTENT GENERATION
// ================================

// AI-generated content (ads and emails)
export const aiContents = pgTable("ai_contents", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  
  type: text("type").notNull(),
  channel: text("channel"),
  campaignId: uuid("campaign_id"),
  salesChannelId: uuid("sales_channel_id").references(() => salesChannels.id),
  
  input: jsonb("input").$type<{
    url?: string;
    contactIds?: string[];
    audience?: string;
    productIds?: string[];
    tone?: string;
    objective?: string;
    numVariants?: number;
  }>().default({}),
  
  prompt: text("prompt"),
  
  output: jsonb("output").$type<{
    headline?: string;
    body?: string;
    cta?: string;
    subject?: string;
    variants?: Array<{
      headline?: string;
      body?: string;
      cta?: string;
      subject?: string;
      hashtags?: string[];
    }>;
    hashtags?: string[];
    images?: string[];
  }>().default({}),
  
  status: text("status").notNull().default("draft"),
  
  modelUsed: text("model_used"),
  costCents: integer("cost_cents").default(0),
  tokensIn: integer("tokens_in").default(0),
  tokensOut: integer("tokens_out").default(0),
  
  scheduledFor: timestamp("scheduled_for"),
  publishedAt: timestamp("published_at"),
  
  performance: jsonb("performance").$type<{
    impressions?: number;
    clicks?: number;
    conversions?: number;
    engagement?: number;
  }>().default({}),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_ai_contents_tenant").on(table.tenantId),
  index("idx_ai_contents_user").on(table.userId),
  index("idx_ai_contents_type").on(table.type),
  index("idx_ai_contents_status").on(table.status),
  index("idx_ai_contents_channel").on(table.channel),
  index("idx_ai_contents_campaign").on(table.campaignId),
  index("idx_ai_contents_sales_channel").on(table.salesChannelId),
  index("idx_ai_contents_tenant_created").on(table.tenantId, table.createdAt),
]);

// AI Campaign grouping
export const aiCampaigns = pgTable("ai_campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  
  name: text("name").notNull(),
  description: text("description"),
  goal: text("goal"),
  
  channels: jsonb("channels").$type<string[]>().default([]),
  
  schedule: jsonb("schedule").$type<{
    startDate?: string;
    endDate?: string;
    frequency?: string;
  }>().default({}),
  
  budget: decimal("budget", { precision: 12, scale: 2 }),
  spent: decimal("spent", { precision: 12, scale: 2 }).default("0.00"),
  
  status: text("status").notNull().default("active"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_ai_campaigns_tenant").on(table.tenantId),
  index("idx_ai_campaigns_status").on(table.status),
]);

// AI Usage tracking
export const aiUsage = pgTable("ai_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  userId: uuid("user_id").references(() => users.id),
  
  provider: text("provider").notNull(),
  model: text("model"),
  
  tokensIn: integer("tokens_in").default(0),
  tokensOut: integer("tokens_out").default(0),
  costCents: integer("cost_cents").default(0),
  
  requestType: text("request_type"),
  success: boolean("success").default(true),
  errorMessage: text("error_message"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ai_usage_tenant").on(table.tenantId),
  index("idx_ai_usage_provider").on(table.provider),
  index("idx_ai_usage_created").on(table.createdAt),
  index("idx_ai_usage_tenant_created").on(table.tenantId, table.createdAt),
  index("idx_ai_usage_tenant_provider").on(table.tenantId, table.provider),
]);

// Schema exports for AI content
export type AIContent = typeof aiContents.$inferSelect;
export type InsertAIContent = typeof aiContents.$inferInsert;
export type AICampaign = typeof aiCampaigns.$inferSelect;
export type InsertAICampaign = typeof aiCampaigns.$inferInsert;
export type AIUsage = typeof aiUsage.$inferSelect;
export type InsertAIUsage = typeof aiUsage.$inferInsert;

// Insert schemas for validation
export const insertAIContentSchema = createInsertSchema(aiContents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAICampaignSchema = createInsertSchema(aiCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAIUsageSchema = createInsertSchema(aiUsage).omit({
  id: true,
  createdAt: true,
});

// Re-export SEO schemas from server/argilette/seo-schema.ts for client use
export { 
  keywords,
  insertKeywordSchema,
  type Keyword,
  type InsertKeyword
} from "../server/argilette/seo-schema";

