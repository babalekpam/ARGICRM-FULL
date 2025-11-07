// Platform permissions utility
export interface User {
  id: string;
  email: string;
  role: string;
}

export const isPlatformOwner = (user: User | null): boolean => {
  return user?.email === 'abel@argilette.com';
};

export const hasFeatureAccess = (user: User | null, featureId: string): boolean => {
  // Platform owners have access to all features
  if (isPlatformOwner(user)) {
    return true;
  }

  // Define feature access by subscription plan
  const featureRequirements: Record<string, string[]> = {
    'ai_predictions': ['Enterprise', 'Unlimited'],
    'reputation_management': ['Professional', 'Enterprise', 'Unlimited'],
    'advanced_analytics': ['Professional', 'Enterprise', 'Unlimited'],
    'white_label': ['Enterprise', 'Unlimited'],
    'custom_domain': ['Enterprise', 'Unlimited'],
    'api_access': ['Professional', 'Enterprise', 'Unlimited']
  };

  // For demo purposes, assume users have 'Starter' plan unless they're platform owner
  const userPlan = 'Starter';
  const requiredPlans = featureRequirements[featureId];
  
  return requiredPlans ? requiredPlans.includes(userPlan) : false;
};

export const getPlanDisplayName = (user: User | null): string => {
  if (isPlatformOwner(user)) {
    return 'Platform Owner';
  }
  return 'Starter';
};

export const getFeatureStatus = (user: User | null, featureId: string): {
  hasAccess: boolean;
  reason?: string;
  requiredPlan?: string;
} => {
  if (isPlatformOwner(user)) {
    return { hasAccess: true };
  }

  const featureRequirements: Record<string, string> = {
    'ai_predictions': 'Enterprise',
    'reputation_management': 'Professional',
    'advanced_analytics': 'Professional',
    'white_label': 'Enterprise',
    'custom_domain': 'Enterprise',
    'api_access': 'Professional'
  };

  const requiredPlan = featureRequirements[featureId];
  
  return {
    hasAccess: false,
    reason: `Requires ${requiredPlan} plan`,
    requiredPlan
  };
};