import { db } from "../db";
import { tenantPaymentConfigs, tenantPaymentTransactions } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import type { 
  TenantPaymentConfig, 
  InsertTenantPaymentConfig, 
  TenantPaymentTransaction, 
  InsertTenantPaymentTransaction,
  PaymentProviderStatus
} from "@shared/schema";
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.PAYMENT_ENCRYPTION_KEY || "your-32-character-key-for-payment-encryption"; // Should be 32 chars
const ALGORITHM = 'aes-256-cbc';

// Encryption utilities for sensitive payment data
function encrypt(text: string): string {
  if (!text) return text;
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string): string {
  if (!text || !text.includes(':')) return text;
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = textParts.join(':');
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export class TenantPaymentService {
  // Get tenant payment configuration
  async getTenantPaymentConfig(tenantId: string, tenantEmail: string): Promise<TenantPaymentConfig | null> {
    try {
      const [config] = await db
        .select()
        .from(tenantPaymentConfigs)
        .where(
          and(
            eq(tenantPaymentConfigs.tenantId, tenantId),
            eq(tenantPaymentConfigs.tenantEmail, tenantEmail)
          )
        );

      if (!config) return null;

      // Decrypt sensitive data before returning
      return {
        ...config,
        stripeSecretKey: config.stripeSecretKey ? decrypt(config.stripeSecretKey) : null,
        stripeWebhookSecret: config.stripeWebhookSecret ? decrypt(config.stripeWebhookSecret) : null,
        visaApiKey: config.visaApiKey ? decrypt(config.visaApiKey) : null,
      };
    } catch (error) {
      console.error("Error getting tenant payment config:", error);
      return null;
    }
  }

  // Create or update tenant payment configuration
  async savePaymentConfig(
    tenantId: string, 
    tenantEmail: string, 
    config: Partial<InsertTenantPaymentConfig>
  ): Promise<TenantPaymentConfig | null> {
    try {
      // Encrypt sensitive data before saving
      const encryptedConfig = {
        ...config,
        tenantId,
        tenantEmail,
        stripeSecretKey: config.stripeSecretKey ? encrypt(config.stripeSecretKey) : undefined,
        stripeWebhookSecret: config.stripeWebhookSecret ? encrypt(config.stripeWebhookSecret) : undefined,
        visaApiKey: config.visaApiKey ? encrypt(config.visaApiKey) : undefined,
        updatedAt: new Date(),
      };

      // Check if config exists
      const existingConfig = await this.getTenantPaymentConfig(tenantId, tenantEmail);

      if (existingConfig) {
        // Update existing configuration
        const [updatedConfig] = await db
          .update(tenantPaymentConfigs)
          .set(encryptedConfig)
          .where(
            and(
              eq(tenantPaymentConfigs.tenantId, tenantId),
              eq(tenantPaymentConfigs.tenantEmail, tenantEmail)
            )
          )
          .returning();

        return this.getTenantPaymentConfig(tenantId, tenantEmail);
      } else {
        // Create new configuration
        const [newConfig] = await db
          .insert(tenantPaymentConfigs)
          .values(encryptedConfig as InsertTenantPaymentConfig)
          .returning();

        return this.getTenantPaymentConfig(tenantId, tenantEmail);
      }
    } catch (error) {
      console.error("Error saving tenant payment config:", error);
      return null;
    }
  }

  // Verify payment provider credentials
  async verifyPaymentProvider(
    tenantId: string, 
    tenantEmail: string, 
    provider: "stripe" | "visa"
  ): Promise<{ verified: boolean; error?: string }> {
    try {
      const config = await this.getTenantPaymentConfig(tenantId, tenantEmail);
      if (!config) {
        return { verified: false, error: "Payment configuration not found" };
      }

      if (provider === "stripe") {
        if (!config.stripeSecretKey || !config.stripePublicKey) {
          return { verified: false, error: "Stripe credentials not configured" };
        }

        // Basic Stripe key validation
        if (!config.stripeSecretKey.startsWith("sk_") || !config.stripePublicKey.startsWith("pk_")) {
          return { verified: false, error: "Invalid Stripe key format" };
        }

        // Update verification status
        await this.updateVerificationStatus(tenantId, tenantEmail, "verified");
        return { verified: true };

      } else if (provider === "visa") {
        if (!config.visaApiKey || !config.visaMerchantId) {
          return { verified: false, error: "Visa credentials not configured" };
        }

        // Basic Visa validation - would need actual API call in production
        if (config.visaApiKey.length < 10) {
          return { verified: false, error: "Invalid Visa API key format" };
        }

        // Update verification status
        await this.updateVerificationStatus(tenantId, tenantEmail, "verified");
        return { verified: true };
      }

      return { verified: false, error: "Unsupported payment provider" };

    } catch (error) {
      console.error("Error verifying payment provider:", error);
      return { verified: false, error: "Verification failed" };
    }
  }

  // Update verification status
  async updateVerificationStatus(
    tenantId: string, 
    tenantEmail: string, 
    status: "pending" | "verified" | "failed"
  ): Promise<void> {
    try {
      await db
        .update(tenantPaymentConfigs)
        .set({ 
          verificationStatus: status, 
          updatedAt: new Date() 
        })
        .where(
          and(
            eq(tenantPaymentConfigs.tenantId, tenantId),
            eq(tenantPaymentConfigs.tenantEmail, tenantEmail)
          )
        );
    } catch (error) {
      console.error("Error updating verification status:", error);
    }
  }

  // Get payment provider status
  async getPaymentProviderStatus(tenantId: string, tenantEmail: string): Promise<PaymentProviderStatus> {
    try {
      const config = await this.getTenantPaymentConfig(tenantId, tenantEmail);
      
      if (!config) {
        return {
          stripe: { enabled: false, configured: false, testMode: true },
          visa: { enabled: false, configured: false, testMode: true }
        };
      }

      return {
        stripe: {
          enabled: config.stripeEnabled || false,
          configured: !!(config.stripePublicKey && config.stripeSecretKey),
          testMode: config.testMode || true,
          lastUsed: config.lastUsed?.toISOString()
        },
        visa: {
          enabled: config.visaEnabled || false,
          configured: !!(config.visaApiKey && config.visaMerchantId),
          testMode: config.testMode || true,
          lastUsed: config.lastUsed?.toISOString()
        }
      };
    } catch (error) {
      console.error("Error getting payment provider status:", error);
      return {
        stripe: { enabled: false, configured: false, testMode: true },
        visa: { enabled: false, configured: false, testMode: true }
      };
    }
  }

  // Log payment transaction for e-commerce stores
  async logPaymentTransaction(transaction: InsertTenantPaymentTransaction): Promise<TenantPaymentTransaction | null> {
    try {
      const [savedTransaction] = await db
        .insert(tenantPaymentTransactions)
        .values({
          ...transaction,
          createdAt: new Date()
        })
        .returning();

      // Update last used timestamp for the payment config
      if (transaction.configId) {
        await db
          .update(tenantPaymentConfigs)
          .set({ lastUsed: new Date() })
          .where(eq(tenantPaymentConfigs.id, transaction.configId));
      }

      return savedTransaction;
    } catch (error) {
      console.error("Error logging payment transaction:", error);
      return null;
    }
  }

  // Get payment transactions for a tenant (e-commerce only)
  async getPaymentTransactions(
    tenantId: string, 
    storeId?: string, 
    limit: number = 50
  ): Promise<TenantPaymentTransaction[]> {
    try {
      const query = db
        .select()
        .from(tenantPaymentTransactions)
        .where(eq(tenantPaymentTransactions.tenantId, tenantId))
        .limit(limit)
        .orderBy(tenantPaymentTransactions.createdAt);

      if (storeId) {
        query.where(
          and(
            eq(tenantPaymentTransactions.tenantId, tenantId),
            eq(tenantPaymentTransactions.storeId, storeId)
          )
        );
      }

      return await query;
    } catch (error) {
      console.error("Error getting payment transactions:", error);
      return [];
    }
  }

  // Revenue sharing calculation - all e-commerce payments go to platform owner
  calculateRevenueSharing(amount: string, platformFeePercent: number = 10): {
    tenantAmount: string;
    platformFee: string;
    platformOwnerAmount: string;
  } {
    const totalAmount = parseFloat(amount);
    const platformFee = totalAmount * (platformFeePercent / 100);
    const tenantAmount = totalAmount - platformFee;
    
    // For the revenue sharing model: platform owner receives ALL payments
    // But we track what would go to tenant for reporting purposes
    return {
      tenantAmount: tenantAmount.toFixed(2), // For reporting only
      platformFee: platformFee.toFixed(2),
      platformOwnerAmount: totalAmount.toFixed(2) // Platform owner gets everything
    };
  }

  // Disable tenant payment configuration
  async disablePaymentConfig(tenantId: string, tenantEmail: string): Promise<boolean> {
    try {
      await db
        .update(tenantPaymentConfigs)
        .set({ 
          isActive: false, 
          updatedAt: new Date() 
        })
        .where(
          and(
            eq(tenantPaymentConfigs.tenantId, tenantId),
            eq(tenantPaymentConfigs.tenantEmail, tenantEmail)
          )
        );
      return true;
    } catch (error) {
      console.error("Error disabling payment config:", error);
      return false;
    }
  }

  // Get payment statistics for tenant
  async getPaymentStatistics(tenantId: string, storeId?: string): Promise<{
    totalTransactions: number;
    totalRevenue: string;
    averageTransaction: string;
    successRate: number;
    providerBreakdown: { stripe: number; visa: number };
  }> {
    try {
      const transactions = await this.getPaymentTransactions(tenantId, storeId, 1000);
      
      const totalTransactions = transactions.length;
      const successfulTransactions = transactions.filter(t => t.status === "completed");
      const totalRevenue = successfulTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const averageTransaction = totalTransactions > 0 ? (totalRevenue / totalTransactions) : 0;
      const successRate = totalTransactions > 0 ? (successfulTransactions.length / totalTransactions) * 100 : 0;
      
      const providerBreakdown = {
        stripe: transactions.filter(t => t.provider === "stripe").length,
        visa: transactions.filter(t => t.provider === "visa").length
      };

      return {
        totalTransactions,
        totalRevenue: totalRevenue.toFixed(2),
        averageTransaction: averageTransaction.toFixed(2),
        successRate: parseFloat(successRate.toFixed(2)),
        providerBreakdown
      };
    } catch (error) {
      console.error("Error getting payment statistics:", error);
      return {
        totalTransactions: 0,
        totalRevenue: "0.00",
        averageTransaction: "0.00",
        successRate: 0,
        providerBreakdown: { stripe: 0, visa: 0 }
      };
    }
  }
}

export const tenantPaymentService = new TenantPaymentService();