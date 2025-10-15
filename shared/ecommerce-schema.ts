import { pgTable, text, integer, decimal, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Store configuration table
export const stores = pgTable("stores", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  tenantId: text("tenant_id"),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  domain: text("domain").unique(),
  subdomain: text("subdomain").unique(),
  description: text("description"),
  logo: text("logo"),
  favicon: text("favicon"),
  primaryColor: text("primary_color").default("#3b82f6"),
  secondaryColor: text("secondary_color").default("#1f2937"),
  currency: text("currency").default("USD"),
  timezone: text("timezone").default("UTC"),
  isActive: boolean("is_active").default(true),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Products table
export const products = pgTable("products", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  storeId: integer("store_id").references(() => stores.id),
  tenantId: text("tenant_id"),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  shortDescription: text("short_description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  sku: text("sku"),
  barcode: text("barcode"),
  inventoryQuantity: integer("inventory_quantity").default(0),
  trackInventory: boolean("track_inventory").default(true),
  allowBackorder: boolean("allow_backorder").default(false),
  weight: decimal("weight", { precision: 8, scale: 2 }),
  dimensions: jsonb("dimensions").default({}),
  images: jsonb("images").default([]),
  categories: jsonb("categories").default([]),
  tags: jsonb("tags").default([]),
  variants: jsonb("variants").default([]),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Product categories table
export const categories = pgTable("categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  storeId: integer("store_id").references(() => stores.id),
  tenantId: text("tenant_id"),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  image: text("image"),
  parentId: integer("parent_id"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Orders table
export const orders = pgTable("orders", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  storeId: integer("store_id").references(() => stores.id),
  tenantId: text("tenant_id"),
  orderNumber: text("order_number").notNull(),
  customerId: text("customer_id"),
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  billingAddress: jsonb("billing_address").notNull(),
  shippingAddress: jsonb("shipping_address").notNull(),
  items: jsonb("items").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  shippingAmount: decimal("shipping_amount", { precision: 10, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  status: text("status").default("pending"), // pending, confirmed, processing, shipped, delivered, cancelled
  paymentStatus: text("payment_status").default("pending"), // pending, paid, failed, refunded
  paymentMethod: text("payment_method"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  notes: text("notes"),
  fulfillmentStatus: text("fulfillment_status").default("unfulfilled"), // unfulfilled, partial, fulfilled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Customers table
export const customers = pgTable("customers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  storeId: integer("store_id").references(() => stores.id),
  tenantId: text("tenant_id"),
  email: text("email").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  addresses: jsonb("addresses").default([]),
  totalOrders: integer("total_orders").default(0),
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).default("0"),
  lastOrderAt: timestamp("last_order_at"),
  acceptsMarketing: boolean("accepts_marketing").default(false),
  notes: text("notes"),
  tags: jsonb("tags").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Store pages table (for custom pages)
export const storePages = pgTable("store_pages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  storeId: integer("store_id").references(() => stores.id),
  tenantId: text("tenant_id"),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  content: text("content"),
  type: text("type").default("page"), // page, blog, policy
  isActive: boolean("is_active").default(true),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Zod schemas for validation
export const insertStoreSchema = createInsertSchema(stores, {
  isActive: z.boolean().default(true),
  isPublished: z.boolean().default(false),
  enableInventoryTracking: z.boolean().default(true),
  allowGuestCheckout: z.boolean().default(true),
  enableCoupons: z.boolean().default(false),
  enableReviews: z.boolean().default(true)
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertProductSchema = createInsertSchema(products, {
  price: z.union([z.string(), z.number()]).transform(val => String(val)),
  compareAtPrice: z.union([z.string(), z.number(), z.null()]).transform(val => val ? String(val) : null).optional(),
  cost: z.union([z.string(), z.number(), z.null()]).transform(val => val ? String(val) : null).optional(),
  weight: z.union([z.string(), z.number(), z.null()]).transform(val => val ? String(val) : null).optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  trackInventory: z.boolean().default(true),
  allowBackorder: z.boolean().default(false)
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCategorySchema = createInsertSchema(categories, {
  isActive: z.boolean().default(true)
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertStorePageSchema = createInsertSchema(storePages, {
  isPublished: z.boolean().default(false)
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// TypeScript types
export type Store = typeof stores.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type StorePage = typeof storePages.$inferSelect;

export type InsertStore = z.infer<typeof insertStoreSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type InsertStorePage = z.infer<typeof insertStorePageSchema>;