export type SubscriptionPlan = 'free' | 'starter' | 'professional' | 'business' | 'enterprise';

export type BillingCycle = 'monthly' | 'annual';

export interface PlanFeatures {
  name: string;
  displayName: string;
  price: number;
  billingCycle: BillingCycle;
  priceId?: string; // Stripe price ID
  features: {
    maxProjects: number;
    maxKeywords: number;
    maxCompetitors: number;
    aiInsights: boolean;
    aiAnalysis: boolean;
    seoAudit: boolean;
    backlinks: boolean;
    trafficAnalytics: boolean;
    prioritySupport: boolean;
    customReports: boolean;
    apiAccess: boolean;
  };
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, PlanFeatures> = {
  free: {
    name: 'free',
    displayName: 'Free',
    price: 0,
    billingCycle: 'monthly',
    features: {
      maxProjects: 1,
      maxKeywords: 10,
      maxCompetitors: 3,
      aiInsights: false,
      aiAnalysis: false,
      seoAudit: true,
      backlinks: false,
      trafficAnalytics: true,
      prioritySupport: false,
      customReports: false,
      apiAccess: false,
    },
  },
  starter: {
    name: 'starter',
    displayName: 'Starter',
    price: 49.99, // $49.99/month
    billingCycle: 'monthly',
    features: {
      maxProjects: 5,
      maxKeywords: 100,
      maxCompetitors: 10,
      aiInsights: true,
      aiAnalysis: true,
      seoAudit: true,
      backlinks: true,
      trafficAnalytics: true,
      prioritySupport: false,
      customReports: false,
      apiAccess: false,
    },
  },
  professional: {
    name: 'professional',
    displayName: 'Professional',
    price: 149.99, // $149.99/month
    billingCycle: 'monthly',
    features: {
      maxProjects: 25,
      maxKeywords: 500,
      maxCompetitors: 25,
      aiInsights: true,
      aiAnalysis: true,
      seoAudit: true,
      backlinks: true,
      trafficAnalytics: true,
      prioritySupport: true,
      customReports: true,
      apiAccess: false,
    },
  },
  business: {
    name: 'business',
    displayName: 'Business',
    price: 299.99, // $299.99/month
    billingCycle: 'monthly',
    features: {
      maxProjects: 100,
      maxKeywords: 2000,
      maxCompetitors: 50,
      aiInsights: true,
      aiAnalysis: true,
      seoAudit: true,
      backlinks: true,
      trafficAnalytics: true,
      prioritySupport: true,
      customReports: true,
      apiAccess: true,
    },
  },
  enterprise: {
    name: 'enterprise',
    displayName: 'Enterprise',
    price: 799.99, // $799.99/month
    billingCycle: 'monthly',
    features: {
      maxProjects: 9999,
      maxKeywords: 9999,
      maxCompetitors: 9999,
      aiInsights: true,
      aiAnalysis: true,
      seoAudit: true,
      backlinks: true,
      trafficAnalytics: true,
      prioritySupport: true,
      customReports: true,
      apiAccess: true,
    },
  },
};

export function getPlanFeatures(plan: SubscriptionPlan): PlanFeatures {
  return SUBSCRIPTION_PLANS[plan];
}

export function canAccessFeature(
  userPlan: SubscriptionPlan,
  feature: keyof PlanFeatures['features']
): boolean {
  const value = SUBSCRIPTION_PLANS[userPlan].features[feature];
  return typeof value === 'boolean' ? value : value > 0;
}

export function canCreateProject(userPlan: SubscriptionPlan, currentCount: number): boolean {
  return currentCount < SUBSCRIPTION_PLANS[userPlan].features.maxProjects;
}

export function canAddKeyword(userPlan: SubscriptionPlan, currentCount: number): boolean {
  return currentCount < SUBSCRIPTION_PLANS[userPlan].features.maxKeywords;
}

export function canAddCompetitor(userPlan: SubscriptionPlan, currentCount: number): boolean {
  return currentCount < SUBSCRIPTION_PLANS[userPlan].features.maxCompetitors;
}
