import { pgTable, uuid, text, timestamp, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Tenant Payment Configuration table
export const tenantPaymentConfigs = pgTable("tenant_payment_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
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
  
  // PayPal Configuration (for future expansion)
  paypalClientId: text("paypal_client_id"),
  paypalClientSecret: text("paypal_client_secret"), // Encrypted
  paypalEnabled: boolean("paypal_enabled").default(false),
  
  // Configuration metadata
  defaultProvider: text("default_provider").default("stripe"), // stripe, visa, paypal
  testMode: boolean("test_mode").default(true),
  
  // Settings and preferences
  settings: json("settings").$type<{
    currencies?: string[];
    webhookUrl?: string;
    failoverProvider?: string;
    autoSwitchOnFailure?: boolean;
    transactionFeeHandling?: 'merchant' | 'customer' | 'split';
    minimumAmount?: number;
    maximumAmount?: number;
  }>(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastUsed: timestamp("last_used"),
  
  // Status
  isActive: boolean("is_active").default(true),
  verificationStatus: text("verification_status").default("pending"), // pending, verified, failed
});

// Tenant Payment Transactions Log
export const tenantPaymentTransactions = pgTable("tenant_payment_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  configId: uuid("config_id").notNull(),
  
  // Transaction details
  transactionId: text("transaction_id").notNull(),
  externalTransactionId: text("external_transaction_id"), // From payment provider
  provider: text("provider").notNull(), // stripe, visa, paypal
  amount: text("amount").notNull(), // Store as string to avoid floating point issues
  currency: text("currency").notNull(),
  
  // Transaction status
  status: text("status").notNull(), // pending, completed, failed, refunded
  paymentMethod: text("payment_method"), // card, bank_transfer, wallet
  
  // Customer information
  customerEmail: text("customer_email"),
  customerName: text("customer_name"),
  
  // Metadata
  orderId: text("order_id"),
  description: text("description"),
  metadata: json("metadata"),
  
  // Provider response
  providerResponse: json("provider_response"),
  errorMessage: text("error_message"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  completedAt: timestamp("completed_at"),
});

// Zod schemas for validation
export const insertTenantPaymentConfigSchema = createInsertSchema(tenantPaymentConfigs, {
  stripePublicKey: z.string().startsWith("pk_").optional(),
  stripeSecretKey: z.string().startsWith("sk_").optional(),
  visaApiKey: z.string().min(1).optional(),
  visaMerchantId: z.string().min(1).optional(),
  paypalClientId: z.string().min(1).optional(),
  defaultProvider: z.enum(["stripe", "visa", "paypal"]).default("stripe"),
  testMode: z.boolean().default(true),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectTenantPaymentConfigSchema = createSelectSchema(tenantPaymentConfigs);

export const insertTenantPaymentTransactionSchema = createInsertSchema(tenantPaymentTransactions, {
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format"),
  currency: z.string().length(3, "Currency must be 3 characters"),
  status: z.enum(["pending", "completed", "failed", "refunded"]),
  provider: z.enum(["stripe", "visa", "paypal"]),
}).omit({
  id: true,
  createdAt: true,
});

export const selectTenantPaymentTransactionSchema = createSelectSchema(tenantPaymentTransactions);

// TypeScript types
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
  paypal: {
    enabled: boolean;
    configured: boolean;
    testMode: boolean;
    lastUsed?: string;
  };
}

// Payment configuration validation
export const paymentConfigValidationSchema = z.object({
  provider: z.enum(["stripe", "visa", "paypal"]),
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
  paypalConfig: z.object({
    clientId: z.string().min(1).optional(),
    clientSecret: z.string().min(1).optional(),
  }).optional(),
});

export type PaymentConfigValidation = z.infer<typeof paymentConfigValidationSchema>;