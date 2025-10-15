export type SubscriptionPlan = 'free' | 'individual' | 'business' | 'enterprise';

export interface PlanFeatures {
  name: string;
  displayName: string;
  price: number;
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
  individual: {
    name: 'individual',
    displayName: 'Individual',
    price: 29,
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
  business: {
    name: 'business',
    displayName: 'Business',
    price: 79,
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
  enterprise: {
    name: 'enterprise',
    displayName: 'Enterprise',
    price: 199,
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
