import { pgTable, text, serial, integer, boolean, timestamp, decimal, date, jsonb, varchar, index, real, uuid } from "drizzle-orm/pg-core";
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
  role: text("role").default("user"), // super_admin, admin, manager, user, viewer
  isActive: boolean("is_active").default(true),
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  lastLoginAt: timestamp("last_login_at"),
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
  planId: text("plan_id").notNull(), // starter, professional, enterprise, unlimited
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

// Enhanced projects with Gantt chart support
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("planning"), // planning, active, on_hold, completed, cancelled
  priority: text("priority").default("medium"), // low, medium, high, critical
  startDate: date("start_date"),
  endDate: date("end_date"),
  plannedStartDate: date("planned_start_date"),
  plannedEndDate: date("planned_end_date"),
  actualStartDate: date("actual_start_date"),
  actualEndDate: date("actual_end_date"),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  actualCost: decimal("actual_cost", { precision: 10, scale: 2 }),
  progress: integer("progress").default(0), // 0-100
  projectManagerId: uuid("project_manager_id").references(() => users.id),
  clientId: uuid("client_id").references(() => contacts.id),
  parentProjectId: uuid("parent_project_id").references(() => projects.id),
  templates: jsonb("templates").$type<string[]>().default([]),
  customFields: jsonb("custom_fields").$type<Record<string, any>>().default({}),
  tags: jsonb("tags").$type<string[]>().default([]),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_projects_tenant").on(table.tenantId),
  index("idx_projects_manager").on(table.projectManagerId),
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

// Create insert and select schemas
export const insertProjectSchema = createInsertSchema(projects);
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

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

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



// Advanced Bookkeeping Tables - Multi-Currency Support
export const chartOfAccounts = pgTable("chart_of_accounts", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  type: text("type", { enum: ["asset", "liability", "equity", "income", "expense"] }).notNull(),
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0.00"),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  parentAccountId: integer("parent_account_id"),
  isActive: boolean("is_active").default(true),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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
  chartAccountId: integer("chart_account_id").references(() => chartOfAccounts.id),
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
export type ChartOfAccount = typeof chartOfAccounts.$inferSelect;
export type InsertChartOfAccount = typeof chartOfAccounts.$inferInsert;
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
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
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

export const insertTerritorySchema = createInsertSchema(territories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

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
export type Territory = typeof territories.$inferSelect;
export type InsertTerritory = z.infer<typeof insertTerritorySchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
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
