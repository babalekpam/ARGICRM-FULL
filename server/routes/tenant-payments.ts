import type { Express } from "express";
import { createHash } from "crypto";
import { tenantPaymentService } from "../services/tenant-payment-service";
import { 
  insertTenantPaymentConfigSchema, 
  insertTenantPaymentTransactionSchema,
  paymentConfigValidationSchema
} from "@shared/schema";
export function registerTenantPaymentRoutes(app: Express) {
  // Add test endpoint to verify route registration
  app.get('/api/tenant-payments/test', (req, res) => {
    console.log('TEST ENDPOINT REACHED - tenant-payments routes are working');
    res.json({ message: 'Tenant payment routes are registered and working' });
  });

  // Define simple auth middleware for tenant payment routes
  const simpleAuth = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization || req.headers['x-auth-token'];
    const token = authHeader ? authHeader.replace('Bearer ', '') : '';
    const userEmail = req.headers['x-auth-email'];
    
    console.log('TENANT PAYMENT AUTH DEBUG:');
    console.log('- Authorization header:', req.headers.authorization);
    console.log('- x-auth-token header:', req.headers['x-auth-token']);
    console.log('- Token extracted:', token);
    console.log('- User email:', userEmail);
    
    if (!userEmail) {
      return res.status(401).json({ error: 'User email header required' });
    }
    
    // Enhanced token validation to handle current format matching main routes
    const isValidToken = token === 'demo-token' || 
                        token.includes('demo-token') || 
                        token.startsWith('demo-auth-token-') ||
                        token.length > 10;
    
    console.log('- Token validation result:', isValidToken);
    
    if (isValidToken) {
      // Determine user data based on email - STRICT EMAIL CHECK
      if (userEmail === 'abel@argilette.com' || userEmail === 'admin@default.com') {
        req.user = {
          id: 'platform-owner-1',
          email: userEmail,
          role: 'platform_owner',
          firstName: userEmail === 'abel@argilette.com' ? 'Abel' : 'John',
          lastName: userEmail === 'abel@argilette.com' ? 'Gutierrez' : 'Smith',
          tenantId: '00000000-0000-0000-0000-000000000001'
        };
      } else {
        // Extract name from email for regular users
        const emailParts = userEmail.split('@')[0].split('.');
        const firstName = emailParts[0] ? emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1) : 'Demo';
        const lastName = emailParts[1] ? emailParts[1].charAt(0).toUpperCase() + emailParts[1].slice(1) : 'User';
        
        // Generate a deterministic UUID for the tenant based on email
        const emailHash = createHash('md5').update(userEmail).digest('hex');
        const tenantUuid = [
          emailHash.slice(0, 8),
          emailHash.slice(8, 12),
          emailHash.slice(12, 16),
          emailHash.slice(16, 20),
          emailHash.slice(20, 32)
        ].join('-');
        
        req.user = {
          id: 'demo-user-' + userEmail.split('@')[0],
          email: userEmail,
          role: 'demo_admin',
          firstName: firstName,
          lastName: lastName,
          tenantId: tenantUuid
        };
      }
      next();
    } else {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  // Get tenant payment configuration
  app.get("/api/tenant-payments/config", simpleAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { tenantId, email } = req.user;
      const config = await tenantPaymentService.getTenantPaymentConfig(tenantId, email);

      if (!config) {
        return res.json({
          success: true,
          config: null,
          message: "No payment configuration found"
        });
      }

      // Don't return sensitive data to frontend
      const sanitizedConfig = {
        ...config,
        stripeSecretKey: config.stripeSecretKey ? "••••••••" : null,
        stripeWebhookSecret: config.stripeWebhookSecret ? "••••••••" : null,
        visaApiKey: config.visaApiKey ? "••••••••" : null,
      };

      res.json({
        success: true,
        config: sanitizedConfig
      });
    } catch (error) {
      console.error("Error getting payment config:", error);
      res.status(500).json({ 
        error: "Failed to get payment configuration",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Save tenant payment configuration (for e-commerce stores only)
  app.post("/api/tenant-payments/config", simpleAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { tenantId, email } = req.user;
      
      // Validate request body
      const validationResult = paymentConfigValidationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid payment configuration",
          details: validationResult.error.errors
        });
      }

      const { provider, testMode, stripeConfig, visaConfig } = validationResult.data;

      // Build configuration object
      const configData: any = {
        defaultProvider: provider,
        testMode,
        // Settings specifically for e-commerce
        settings: {
          ecommerceOnly: true, // This is ONLY for e-commerce stores
          currencies: req.body.currencies || ["USD"],
          transactionFeeHandling: req.body.transactionFeeHandling || "merchant"
        }
      };

      // Add provider-specific configuration
      if (provider === "stripe" && stripeConfig) {
        configData.stripePublicKey = stripeConfig.publicKey;
        configData.stripeSecretKey = stripeConfig.secretKey;
        configData.stripeWebhookSecret = stripeConfig.webhookSecret;
        configData.stripeEnabled = true;
      }

      if (provider === "visa" && visaConfig) {
        configData.visaApiKey = visaConfig.apiKey;
        configData.visaMerchantId = visaConfig.merchantId;
        configData.visaEnabled = true;
      }

      const savedConfig = await tenantPaymentService.savePaymentConfig(
        tenantId, 
        email, 
        configData
      );

      if (!savedConfig) {
        return res.status(500).json({ 
          error: "Failed to save payment configuration" 
        });
      }

      res.json({
        success: true,
        message: "Payment configuration saved successfully",
        config: {
          id: savedConfig.id,
          defaultProvider: savedConfig.defaultProvider,
          testMode: savedConfig.testMode,
          stripeEnabled: savedConfig.stripeEnabled,
          visaEnabled: savedConfig.visaEnabled,
          verificationStatus: savedConfig.verificationStatus
        }
      });
    } catch (error) {
      console.error("Error saving payment config:", error);
      res.status(500).json({ 
        error: "Failed to save payment configuration",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Verify payment provider credentials
  app.post("/api/tenant-payments/verify/:provider", simpleAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { tenantId, email } = req.user;
      const provider = req.params.provider as "stripe" | "visa";

      if (!["stripe", "visa"].includes(provider)) {
        return res.status(400).json({ 
          error: "Invalid payment provider" 
        });
      }

      const verificationResult = await tenantPaymentService.verifyPaymentProvider(
        tenantId, 
        email, 
        provider
      );

      res.json({
        success: verificationResult.verified,
        provider,
        verified: verificationResult.verified,
        error: verificationResult.error || null
      });
    } catch (error) {
      console.error("Error verifying payment provider:", error);
      res.status(500).json({ 
        error: "Failed to verify payment provider",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get payment provider status
  app.get("/api/tenant-payments/status", simpleAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { tenantId, email } = req.user;
      const status = await tenantPaymentService.getPaymentProviderStatus(tenantId, email);

      res.json({
        success: true,
        status
      });
    } catch (error) {
      console.error("Error getting payment status:", error);
      res.status(500).json({ 
        error: "Failed to get payment status",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Log payment transaction (for e-commerce stores)
  app.post("/api/tenant-payments/transactions", simpleAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { tenantId } = req.user;
      
      // Validate transaction data
      const validationResult = insertTenantPaymentTransactionSchema.safeParse({
        ...req.body,
        tenantId
      });

      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid transaction data",
          details: validationResult.error.errors
        });
      }

      // Calculate revenue sharing (platform owner gets all e-commerce payments)
      const { tenantAmount, platformFee, platformOwnerAmount } = 
        tenantPaymentService.calculateRevenueSharing(validationResult.data.amount);

      const transactionData = {
        ...validationResult.data,
        platformFee,
        tenantAmount, // For reporting only
        // Note: Platform owner receives the full amount
        metadata: {
          ...validationResult.data.metadata,
          revenueSharing: {
            platformOwnerAmount,
            tenantReportingAmount: tenantAmount
          }
        }
      };

      const savedTransaction = await tenantPaymentService.logPaymentTransaction(transactionData);

      if (!savedTransaction) {
        return res.status(500).json({ 
          error: "Failed to log payment transaction" 
        });
      }

      res.json({
        success: true,
        message: "Payment transaction logged successfully",
        transaction: {
          id: savedTransaction.id,
          transactionId: savedTransaction.transactionId,
          amount: savedTransaction.amount,
          status: savedTransaction.status,
          provider: savedTransaction.provider,
          platformOwnerReceives: platformOwnerAmount
        }
      });
    } catch (error) {
      console.error("Error logging payment transaction:", error);
      res.status(500).json({ 
        error: "Failed to log payment transaction",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get payment transactions for tenant (e-commerce only)
  app.get("/api/tenant-payments/transactions", simpleAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { tenantId } = req.user;
      const storeId = req.query.storeId as string;
      const limit = parseInt(req.query.limit as string) || 50;

      const transactions = await tenantPaymentService.getPaymentTransactions(
        tenantId, 
        storeId, 
        limit
      );

      res.json({
        success: true,
        transactions: transactions.map(transaction => ({
          id: transaction.id,
          transactionId: transaction.transactionId,
          amount: transaction.amount,
          currency: transaction.currency,
          status: transaction.status,
          provider: transaction.provider,
          storeId: transaction.storeId,
          customerEmail: transaction.customerEmail,
          description: transaction.description,
          createdAt: transaction.createdAt,
          // Revenue sharing info
          platformFee: transaction.platformFee,
          tenantReportingAmount: transaction.tenantAmount
        }))
      });
    } catch (error) {
      console.error("Error getting payment transactions:", error);
      res.status(500).json({ 
        error: "Failed to get payment transactions",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get payment statistics for tenant
  app.get("/api/tenant-payments/statistics", simpleAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { tenantId } = req.user;
      const storeId = req.query.storeId as string;

      const statistics = await tenantPaymentService.getPaymentStatistics(tenantId, storeId);

      res.json({
        success: true,
        statistics: {
          ...statistics,
          note: "Revenue sharing: Platform owner receives all e-commerce payments"
        }
      });
    } catch (error) {
      console.error("Error getting payment statistics:", error);
      res.status(500).json({ 
        error: "Failed to get payment statistics",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Disable payment configuration
  app.delete("/api/tenant-payments/config", simpleAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { tenantId, email } = req.user;
      const success = await tenantPaymentService.disablePaymentConfig(tenantId, email);

      if (!success) {
        return res.status(500).json({ 
          error: "Failed to disable payment configuration" 
        });
      }

      res.json({
        success: true,
        message: "Payment configuration disabled successfully"
      });
    } catch (error) {
      console.error("Error disabling payment config:", error);
      res.status(500).json({ 
        error: "Failed to disable payment configuration",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}