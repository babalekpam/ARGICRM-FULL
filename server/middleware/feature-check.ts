import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

export interface FeatureCheckRequest extends Request {
  tenant?: any;
  user?: any;
  subscription?: any;
}

// Define all platform features with their plan requirements
export const FEATURE_DEFINITIONS = {
  // Core CRM Features
  'contacts.basic': ['starter', 'professional', 'enterprise', 'unlimited'],
  'contacts.advanced': ['professional', 'enterprise', 'unlimited'],
  'contacts.bulk_import': ['professional', 'enterprise', 'unlimited'],
  'contacts.export': ['professional', 'enterprise', 'unlimited'],
  
  'leads.basic': ['starter', 'professional', 'enterprise', 'unlimited'],
  'leads.scoring': ['professional', 'enterprise', 'unlimited'],
  'leads.automation': ['enterprise', 'unlimited'],
  
  'deals.basic': ['starter', 'professional', 'enterprise', 'unlimited'],
  'deals.pipeline': ['professional', 'enterprise', 'unlimited'],
  'deals.forecasting': ['enterprise', 'unlimited'],
  
  'accounts.basic': ['starter', 'professional', 'enterprise', 'unlimited'],
  'accounts.hierarchy': ['professional', 'enterprise', 'unlimited'],
  'accounts.territory': ['enterprise', 'unlimited'],
  
  // Marketing Features
  'email.basic': ['professional', 'enterprise', 'unlimited'],
  'email.automation': ['enterprise', 'unlimited'],
  'email.advanced_analytics': ['unlimited'],
  
  'sms.basic': ['professional', 'enterprise', 'unlimited'],
  'sms.automation': ['enterprise', 'unlimited'],
  
  'campaigns.basic': ['professional', 'enterprise', 'unlimited'],
  'campaigns.advanced': ['enterprise', 'unlimited'],
  
  'forms.basic': ['professional', 'enterprise', 'unlimited'],
  'forms.advanced': ['enterprise', 'unlimited'],
  'forms.unlimited': ['unlimited'],
  
  'landing_pages.basic': ['professional', 'enterprise', 'unlimited'],
  'landing_pages.advanced': ['enterprise', 'unlimited'],
  
  // Analytics & Reporting
  'analytics.basic': ['starter', 'professional', 'enterprise', 'unlimited'],
  'analytics.advanced': ['professional', 'enterprise', 'unlimited'],
  'analytics.custom_reports': ['enterprise', 'unlimited'],
  'analytics.real_time': ['unlimited'],
  
  'reports.basic': ['starter', 'professional', 'enterprise', 'unlimited'],
  'reports.custom': ['professional', 'enterprise', 'unlimited'],
  'reports.automated': ['enterprise', 'unlimited'],
  'reports.cross_tenant': ['unlimited'], // Super admin only
  
  // Operational Features
  'tasks.basic': ['starter', 'professional', 'enterprise', 'unlimited'],
  'tasks.automation': ['professional', 'enterprise', 'unlimited'],
  'tasks.advanced_workflow': ['enterprise', 'unlimited'],
  
  'projects.basic': ['professional', 'enterprise', 'unlimited'],
  'projects.advanced': ['enterprise', 'unlimited'],
  
  'tickets.basic': ['professional', 'enterprise', 'unlimited'],
  'tickets.sla': ['enterprise', 'unlimited'],
  'tickets.automation': ['unlimited'],
  
  'scheduling.basic': ['professional', 'enterprise', 'unlimited'],
  'scheduling.advanced': ['enterprise', 'unlimited'],
  
  // Financial Features
  'invoices.basic': ['professional', 'enterprise', 'unlimited'],
  'invoices.automation': ['enterprise', 'unlimited'],
  'invoices.multi_currency': ['unlimited'],
  
  'bookkeeping.basic': ['professional', 'enterprise', 'unlimited'],
  'bookkeeping.advanced': ['enterprise', 'unlimited'],
  'bookkeeping.multi_currency': ['unlimited'],
  
  'tax.basic': ['professional', 'enterprise', 'unlimited'],
  'tax.advanced': ['enterprise', 'unlimited'],
  'tax.compliance': ['unlimited'],
  
  // Team & Security Features
  'team.basic': ['starter', 'professional', 'enterprise', 'unlimited'],
  'team.advanced': ['professional', 'enterprise', 'unlimited'],
  'team.unlimited_users': ['unlimited'],
  
  'security.basic': ['starter', 'professional', 'enterprise', 'unlimited'],
  'security.advanced': ['professional', 'enterprise', 'unlimited'],
  'security.enterprise': ['enterprise', 'unlimited'],
  'security.audit_logs': ['unlimited'],
  
  'integrations.basic': ['starter', 'professional', 'enterprise', 'unlimited'],
  'integrations.advanced': ['professional', 'enterprise', 'unlimited'],
  'integrations.api_access': ['enterprise', 'unlimited'],
  'integrations.webhooks': ['unlimited'],
  
  // AI & Intelligence Features
  'ai.sentiment_analysis': ['professional', 'enterprise', 'unlimited'],
  'ai.predictive_scoring': ['enterprise', 'unlimited'],
  'ai.automation': ['unlimited'],
  
  // Platform Administration
  'platform.admin': ['platform_owner'], // Platform owner access
  'platform.tenant_management': ['platform_owner'],
  'platform.billing_management': ['platform_owner'],
  'platform_owner.read': ['platform_owner'],
  'platform_owner.write': ['platform_owner'],
  'platform_owner.unlimited': ['platform_owner'], // Unlimited access to all features
};

// Usage limits by plan
export const PLAN_LIMITS = {
  starter: {
    users: 3,
    contacts: 1000,
    storage: 1024, // 1GB in MB
    emailsPerMonth: 1000,
    smsPerMonth: 100,
    formsPerMonth: 10,
    apiCalls: 1000,
  },
  professional: {
    users: 10,
    contacts: 10000,
    storage: 10240, // 10GB
    emailsPerMonth: 10000,
    smsPerMonth: 1000,
    formsPerMonth: 100,
    apiCalls: 10000,
  },
  enterprise: {
    users: 50,
    contacts: 100000,
    storage: 102400, // 100GB
    emailsPerMonth: 100000,
    smsPerMonth: 10000,
    formsPerMonth: 1000,
    apiCalls: 100000,
  },
  unlimited: {
    users: -1, // Unlimited
    contacts: -1,
    storage: -1,
    emailsPerMonth: -1,
    smsPerMonth: -1,
    formsPerMonth: -1,
    apiCalls: -1,
  },
  platform_owner: {
    users: -1, // Unlimited for platform owner
    contacts: -1,
    storage: -1,
    emailsPerMonth: -1,
    smsPerMonth: -1,
    formsPerMonth: -1,
    apiCalls: -1,
  },
};

/**
 * Middleware to check if a tenant has access to a specific feature
 */
export function requireFeature(featureName: string) {
  return async (req: FeatureCheckRequest, res: Response, next: NextFunction) => {
    try {
      // Skip feature check for platform owner - abel@argilette.com
      if (req.user?.email === 'abel@argilette.com' || req.user?.role === 'platform_owner') {
        return next();
      }

      // Get tenant subscription
      const tenantId = req.tenant?.id || req.user?.tenantId;
      if (!tenantId) {
        return res.status(403).json({
          success: false,
          error: 'No tenant context found',
          code: 'NO_TENANT_CONTEXT'
        });
      }

      // Get subscription details
      const subscription = await getSubscriptionWithFeatures(tenantId);
      if (!subscription) {
        return res.status(403).json({
          success: false,
          error: 'No active subscription found',
          code: 'NO_SUBSCRIPTION'
        });
      }

      // Check if feature is available in current plan
      const hasFeature = checkFeatureAccess(featureName, subscription);
      if (!hasFeature) {
        return res.status(402).json({
          success: false,
          error: `Feature '${featureName}' not available in current plan`,
          code: 'FEATURE_NOT_AVAILABLE',
          currentPlan: subscription.planId,
          requiredPlans: FEATURE_DEFINITIONS[featureName as keyof typeof FEATURE_DEFINITIONS] || [],
          upgradeUrl: `/pricing?upgrade=${subscription.planId}`
        });
      }

      // Attach subscription to request for further use
      req.subscription = subscription;
      next();
    } catch (error) {
      console.error('Feature check error:', error);
      res.status(500).json({
        success: false,
        error: 'Feature check failed',
        code: 'FEATURE_CHECK_ERROR'
      });
    }
  };
}

/**
 * Middleware to check usage limits
 */
export function checkUsageLimit(resource: string) {
  return async (req: FeatureCheckRequest, res: Response, next: NextFunction) => {
    try {
      // Skip for platform owner - abel@argilette.com
      if (req.user?.email === 'abel@argilette.com' || req.user?.role === 'platform_owner') {
        return next();
      }

      const tenantId = req.tenant?.id || req.user?.tenantId;
      if (!tenantId) {
        return res.status(403).json({
          success: false,
          error: 'No tenant context found',
          code: 'NO_TENANT_CONTEXT'
        });
      }

      const subscription = await getSubscriptionWithFeatures(tenantId);
      if (!subscription) {
        return res.status(403).json({
          success: false,
          error: 'No active subscription',
          code: 'NO_SUBSCRIPTION'
        });
      }

      // Check usage limits
      const limit = subscription.usageLimits?.[resource as keyof typeof subscription.usageLimits];
      const current = subscription.currentUsage?.[resource as keyof typeof subscription.currentUsage] || 0;

      if (limit !== -1 && limit !== undefined && current >= limit) {
        return res.status(429).json({
          success: false,
          error: `Usage limit exceeded for ${resource}`,
          code: 'USAGE_LIMIT_EXCEEDED',
          limit,
          current,
          upgradeUrl: `/pricing?upgrade=${subscription.planId}`
        });
      }

      req.subscription = subscription;
      next();
    } catch (error) {
      console.error('Usage limit check error:', error);
      res.status(500).json({
        success: false,
        error: 'Usage limit check failed',
        code: 'USAGE_CHECK_ERROR'
      });
    }
  };
}

/**
 * Get subscription with feature details
 */
async function getSubscriptionWithFeatures(tenantId: string) {
  try {
    // In a real implementation, this would query the database
    // For now, we'll use mock data based on the tenant
    const mockSubscriptions = {
      '1': {
        id: 'sub-1',
        tenantId: '1',
        planId: 'enterprise',
        status: 'active',
        billingCycle: 'monthly',
        enabledFeatures: [],
        usageLimits: PLAN_LIMITS.enterprise,
        currentUsage: {
          users: 12,
          contacts: 2500,
          storage: 15360, // 15GB
          emailsThisMonth: 5000,
          smsThisMonth: 200,
          formsThisMonth: 25,
          apiCallsThisMonth: 15000,
        }
      },
      '2': {
        id: 'sub-2',
        tenantId: '2',
        planId: 'professional',
        status: 'active',
        billingCycle: 'yearly',
        enabledFeatures: [],
        usageLimits: PLAN_LIMITS.professional,
        currentUsage: {
          users: 5,
          contacts: 1200,
          storage: 3072, // 3GB
          emailsThisMonth: 2000,
          smsThisMonth: 50,
          formsThisMonth: 8,
          apiCallsThisMonth: 3000,
        }
      },
      '3': {
        id: 'sub-3',
        tenantId: '3',
        planId: 'starter',
        status: 'trial',
        billingCycle: 'monthly',
        enabledFeatures: [],
        usageLimits: PLAN_LIMITS.starter,
        currentUsage: {
          users: 2,
          contacts: 150,
          storage: 256, // 256MB
          emailsThisMonth: 100,
          smsThisMonth: 10,
          formsThisMonth: 2,
          apiCallsThisMonth: 500,
        }
      }
    };

    return mockSubscriptions[tenantId as keyof typeof mockSubscriptions] || null;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}

/**
 * Check if a feature is accessible for a subscription
 */
export function checkFeatureAccess(featureName: string, subscription: any): boolean {
  // Get required plans for this feature
  const requiredPlans = FEATURE_DEFINITIONS[featureName as keyof typeof FEATURE_DEFINITIONS];
  if (!requiredPlans) {
    return false; // Feature not defined
  }

  // Check if current plan supports this feature
  if (requiredPlans.includes(subscription.planId)) {
    return true;
  }

  // Check if feature is explicitly enabled (for custom configurations)
  if (subscription.enabledFeatures && subscription.enabledFeatures.includes(featureName)) {
    return true;
  }

  return false;
}

/**
 * Get all available features for a subscription
 */
export function getAvailableFeatures(subscription: any): string[] {
  const planFeatures: string[] = [];
  
  // Add features based on plan
  Object.entries(FEATURE_DEFINITIONS).forEach(([feature, plans]) => {
    if (plans.includes(subscription.planId)) {
      planFeatures.push(feature);
    }
  });

  // Add explicitly enabled features
  if (subscription.enabledFeatures) {
    subscription.enabledFeatures.forEach((feature: string) => {
      if (!planFeatures.includes(feature)) {
        planFeatures.push(feature);
      }
    });
  }

  return planFeatures;
}

/**
 * Update usage statistics
 */
export async function incrementUsage(tenantId: string, resource: string, amount: number = 1) {
  try {
    // In a real implementation, this would update the database
    // TODO: Implement database update
  } catch (error) {
    console.error('Error incrementing usage:', error);
  }
}

/**
 * Get subscription upgrade suggestions
 */
export function getUpgradeSuggestions(currentPlan: string, requestedFeature: string) {
  const requiredPlans = FEATURE_DEFINITIONS[requestedFeature as keyof typeof FEATURE_DEFINITIONS] || [];
  const planHierarchy = ['starter', 'professional', 'enterprise', 'unlimited'];
  
  const currentIndex = planHierarchy.indexOf(currentPlan);
  const availablePlans = requiredPlans.filter(plan => {
    const planIndex = planHierarchy.indexOf(plan);
    return planIndex > currentIndex;
  });

  return availablePlans.map(plan => ({
    plan,
    features: Object.keys(FEATURE_DEFINITIONS).filter(feature => 
      FEATURE_DEFINITIONS[feature as keyof typeof FEATURE_DEFINITIONS].includes(plan)
    ),
    limits: PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]
  }));
}