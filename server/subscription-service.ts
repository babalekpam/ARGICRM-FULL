import { db } from "./db";
import { 
  subscriptionPlans, 
  userSubscriptions, 
  packageFeatures, 
  planFeatureAccess,
  usageTracking,
  type SubscriptionPlan,
  type UserSubscription,
  type PackageFeature,
  type PlanFeatureAccess
} from "@shared/schema";
import { eq } from "drizzle-orm";

class SubscriptionService {
  private defaultPlans: Omit<SubscriptionPlan, 'createdAt' | 'updatedAt'>[] = [
    {
      id: 'starter',
      name: 'starter',
      displayName: 'Starter Package',
      description: 'Perfect for small teams getting started with CRM',
      price: "39.99",
      billingCycle: 'monthly',
      features: [
        'Basic contact management (up to 1,000 contacts)',
        'Email integration',
        'Basic reporting dashboard',
        'Mobile app access',
        'Standard support (email)',
        '2GB storage'
      ],
      limits: {
        users: 5,
        contacts: 1000,
        storage: 2,
        emails: 1000,
        sms: 100,
        forms: 5,
        apiCalls: 1000
      },
      isActive: true,
      sortOrder: 1
    },
    {
      id: 'professional',
      name: 'professional',
      displayName: 'Professional Package',
      description: 'Ideal for growing businesses with advanced needs',
      price: "89.99",
      billingCycle: 'monthly',
      features: [
        'Everything in Starter plus:',
        'Advanced contact management (up to 10,000 contacts)',
        'Sales pipeline automation',
        'Custom fields and workflows',
        'Email marketing integration',
        'Advanced reporting and analytics',
        'Priority support (phone + email)',
        '10GB storage',
        'API access'
      ],
      limits: {
        users: 15,
        contacts: 10000,
        storage: 10,
        emails: 10000,
        sms: 1000,
        forms: 25,
        apiCalls: 10000
      },
      isActive: true,
      sortOrder: 2
    },
    {
      id: 'enterprise',
      name: 'enterprise',
      displayName: 'Enterprise Package',
      description: 'Comprehensive solution for large organizations',
      price: '174.99',
      billingCycle: 'monthly',
      features: [
        'Everything in Professional plus:',
        'Unlimited contacts',
        'Advanced automation and AI features',
        'Multi-team collaboration tools',
        'Custom integrations',
        'Advanced security features',
        'Dedicated account manager',
        '50GB storage',
        'White-label client portal access',
        'Advanced API and webhook support'
      ],
      limits: {
        users: 100,
        contacts: -1,
        storage: 50,
        emails: -1,
        sms: -1,
        forms: 100,
        apiCalls: -1
      },
      isActive: true,
      sortOrder: 3
    },
    {
      id: 'white-label',
      name: 'white-label',
      displayName: 'White Label Solution',
      description: 'Custom quote for fully branded CRM solution',
      price: '0.00',
      billingCycle: 'custom',
      features: [
        'Everything in Enterprise plus:',
        'Complete white-label branding',
        'Custom development',
        'Dedicated infrastructure',
        'Custom training and onboarding',
        'SLA guarantees',
        'On-premise deployment options',
        '24/7 dedicated support team',
        'Custom feature development',
        'Multi-tenant architecture'
      ],
      limits: {
        users: -1,
        contacts: -1,
        storage: -1,
        emails: -1,
        sms: -1,
        forms: -1,
        apiCalls: -1
      },
      isActive: true,
      sortOrder: 4
    }
  ];

  private defaultFeatures: Omit<PackageFeature, 'createdAt'>[] = [
    { id: 'contact_management', name: 'contact_management', displayName: 'Contact Management', description: 'Organize and manage customer contacts', category: 'core', isCore: true, minPlanRequired: 'starter' },
    { id: 'basic_pipeline', name: 'basic_pipeline', displayName: 'Basic Pipeline', description: 'Simple sales pipeline tracking', category: 'core', isCore: true, minPlanRequired: 'starter' },
    { id: 'email_integration', name: 'email_integration', displayName: 'Email Integration', description: 'Connect with email providers', category: 'core', isCore: true, minPlanRequired: 'starter' },
    { id: 'mobile_app', name: 'mobile_app', displayName: 'Mobile App Access', description: 'Access CRM on mobile devices', category: 'core', isCore: true, minPlanRequired: 'starter' },
    { id: 'african_currencies', name: 'african_currencies', displayName: '54 African Currencies', description: 'Complete multi-currency support for all African markets', category: 'localization', isCore: true, minPlanRequired: 'starter' },
    { id: 'standard_support', name: 'standard_support', displayName: 'Standard Support', description: 'Email support during business hours', category: 'support', isCore: false, minPlanRequired: 'starter' },
    { id: 'ai_sentiment', name: 'ai_sentiment', displayName: 'AI Sentiment Analysis', description: 'Advanced sentiment analysis and customer insights', category: 'ai', isCore: false, minPlanRequired: 'professional' },
    { id: 'advanced_workflows', name: 'advanced_workflows', displayName: 'Advanced Workflows', description: 'Workflow automation and triggers', category: 'automation', isCore: false, minPlanRequired: 'professional' },
    { id: 'multilanguage', name: 'multilanguage', displayName: 'Multi-Language Support', description: 'Support for multiple languages and localization', category: 'localization', isCore: false, minPlanRequired: 'professional' },
    { id: 'email_marketing', name: 'email_marketing', displayName: 'Email Marketing', description: 'Send marketing campaigns', category: 'marketing', isCore: false, minPlanRequired: 'professional' },
    { id: 'advanced_analytics', name: 'advanced_analytics', displayName: 'Advanced Analytics', description: 'Detailed analytics and reporting', category: 'analytics', isCore: false, minPlanRequired: 'professional' },
    { id: 'priority_support', name: 'priority_support', displayName: 'Priority Support', description: 'Faster response times', category: 'support', isCore: false, minPlanRequired: 'professional' },
    { id: 'emotional_intelligence', name: 'emotional_intelligence', displayName: 'Emotional Intelligence AI', description: 'Advanced emotional analysis and customer insights', category: 'ai', isCore: false, minPlanRequired: 'enterprise' },
    { id: 'advanced_security', name: 'advanced_security', displayName: 'Advanced Security', description: 'Enhanced security features', category: 'security', isCore: false, minPlanRequired: 'enterprise' },
    { id: 'white_labeling', name: 'white_labeling', displayName: 'White Labeling', description: 'Custom branding and white-label options', category: 'customization', isCore: false, minPlanRequired: 'enterprise' },
    { id: 'offline_capabilities', name: 'offline_capabilities', displayName: 'Offline Capabilities', description: 'Works with intermittent connectivity', category: 'mobile', isCore: false, minPlanRequired: 'enterprise' },
    { id: 'custom_integrations', name: 'custom_integrations', displayName: 'Custom Integrations', description: 'Build custom API integrations', category: 'integrations', isCore: false, minPlanRequired: 'enterprise' },
    { id: 'predictive_analytics', name: 'predictive_analytics', displayName: 'Predictive Analytics', description: 'AI-powered predictive insights and forecasting', category: 'ai', isCore: false, minPlanRequired: 'ultimate' },
    { id: 'voice_emotion', name: 'voice_emotion', displayName: 'Voice Emotion Analysis', description: 'Advanced voice call emotional analysis', category: 'ai', isCore: false, minPlanRequired: 'ultimate' },
    { id: 'dedicated_manager', name: 'dedicated_manager', displayName: 'Dedicated Account Manager', description: 'Personal account management', category: 'support', isCore: false, minPlanRequired: 'ultimate' },
    { id: 'phone_support', name: 'phone_support', displayName: 'Phone Support', description: 'Direct phone support access', category: 'support', isCore: false, minPlanRequired: 'enterprise' },
    { id: 'unlimited_everything', name: 'unlimited_everything', displayName: 'Unlimited Everything', description: 'No limits on any features', category: 'unlimited', isCore: false, minPlanRequired: 'ultimate' },
    { id: 'white_label', name: 'white_label', displayName: 'White-label Options', description: 'Brand the platform as your own', category: 'customization', isCore: false, minPlanRequired: 'ultimate' },
    { id: 'api_access', name: 'api_access', displayName: 'Full API Access', description: 'Complete API access for development', category: 'integrations', isCore: false, minPlanRequired: 'ultimate' },
    { id: 'custom_development', name: 'custom_development', displayName: 'Custom Development', description: 'Custom feature development', category: 'development', isCore: false, minPlanRequired: 'ultimate' },
    { id: 'premium_support', name: 'premium_support', displayName: '24/7 Premium Support', description: 'Round-the-clock premium support', category: 'support', isCore: false, minPlanRequired: 'ultimate' }
  ];

  async initializeDefaultPlans(): Promise<void> {
    try {
      // Check if plans already exist
      const existingPlans = await db.select().from(subscriptionPlans);
      
      if (existingPlans.length === 0) {
        // Insert default plans
        await db.insert(subscriptionPlans).values(this.defaultPlans);
        console.log("✅ Default subscription plans initialized");
      } else {
        console.log("ℹ️ Subscription plans already exist");
      }
    } catch (error) {
      console.error("❌ Error initializing subscription plans:", error);
    }
  }

  async initializePackageFeatures(): Promise<void> {
    try {
      // Check if features already exist
      const existingFeatures = await db.select().from(packageFeatures);
      
      if (existingFeatures.length === 0) {
        // Insert default features
        await db.insert(packageFeatures).values(this.defaultFeatures);
        console.log("✅ Default package features initialized");
      } else {
        console.log("ℹ️ Package features already exist");
      }
    } catch (error) {
      console.error("❌ Error initializing package features:", error);
    }
  }

  async getAllPlans(): Promise<SubscriptionPlan[]> {
    try {
      return await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.isActive, true))
        .orderBy(subscriptionPlans.sortOrder);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      return [];
    }
  }

  async getUserSubscriptionDetails(userId: string): Promise<any> {
    try {
      // For now, return mock data since we don't have actual user subscriptions
      const plans = await this.getAllPlans();
      const starterPlan = plans.find(p => p.id === 'starter');
      
      return {
        subscription: {
          id: 'sub_demo',
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        },
        plan: starterPlan,
        features: [],
        limits: starterPlan?.limits || {},
        usage: {
          users: { usage: 1, limit: starterPlan?.limits.users || 3 },
          contacts: { usage: 25, limit: starterPlan?.limits.contacts || 1000 },
          storage: { usage: 0.5, limit: starterPlan?.limits.storage || 5 },
          emails: { usage: 150, limit: starterPlan?.limits.emails || 1000 },
          sms: { usage: 5, limit: starterPlan?.limits.sms || 100 },
          forms: { usage: 2, limit: starterPlan?.limits.forms || 5 },
          apiCalls: { usage: 2500, limit: starterPlan?.limits.apiCalls || 10000 }
        }
      };
    } catch (error) {
      console.error("Error fetching user subscription details:", error);
      return null;
    }
  }

  async changePlan(userId: string, newPlanId: string): Promise<boolean> {
    try {
      // For now, just return success - real implementation would handle payment processing
      console.log(`User ${userId} changing to plan ${newPlanId}`);
      return true;
    } catch (error) {
      console.error("Error changing plan:", error);
      return false;
    }
  }

  // Check if user's trial has expired
  async isTrialExpired(userId: string): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) return false;
      
      if (subscription.status === 'trial' && subscription.trialEndDate) {
        return new Date() > new Date(subscription.trialEndDate);
      }
      
      return false;
    } catch (error) {
      console.error("Error checking trial expiration:", error);
      return false;
    }
  }

  // Get trial remaining days
  async getTrialRemainingDays(userId: string): Promise<number | null> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription || subscription.status !== 'trial' || !subscription.trialEndDate) {
        return null;
      }
      
      const trialEnd = new Date(subscription.trialEndDate);
      const now = new Date();
      const diffTime = trialEnd.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return Math.max(0, diffDays);
    } catch (error) {
      console.error("Error calculating trial remaining days:", error);
      return null;
    }
  }

  // Lock user account for expired trial
  async lockAccountForExpiredTrial(userId: string): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) return false;

      // Update subscription status to locked
      await db.update(userSubscriptions)
        .set({ 
          status: 'locked',
          lockedAt: new Date(),
          lockReason: 'trial_expired'
        })
        .where(eq(userSubscriptions.userId, userId));

      console.log(`Account locked for user ${userId} due to trial expiration`);
      return true;
    } catch (error) {
      console.error("Error locking account:", error);
      return false;
    }
  }

  // Unlock account when payment is added
  async unlockAccountWithPayment(userId: string, paymentMethodId: string): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) return false;

      // Update subscription status to active
      await db.update(userSubscriptions)
        .set({ 
          status: 'active',
          lockedAt: null,
          lockReason: null,
          paymentMethodId: paymentMethodId,
          paidAt: new Date()
        })
        .where(eq(userSubscriptions.userId, userId));

      console.log(`Account unlocked for user ${userId} with payment method`);
      return true;
    } catch (error) {
      console.error("Error unlocking account:", error);
      return false;
    }
  }

  // Check account lock status
  async isAccountLocked(userId: string): Promise<{ locked: boolean; reason?: string; daysLocked?: number }> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) return { locked: false };

      if (subscription.status === 'locked') {
        let daysLocked = 0;
        if (subscription.lockedAt) {
          const lockDate = new Date(subscription.lockedAt);
          const now = new Date();
          const diffTime = now.getTime() - lockDate.getTime();
          daysLocked = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        }

        return {
          locked: true,
          reason: subscription.lockReason || 'unknown',
          daysLocked
        };
      }

      return { locked: false };
    } catch (error) {
      console.error("Error checking account lock status:", error);
      return { locked: false };
    }
  }
}

export const subscriptionService = new SubscriptionService();