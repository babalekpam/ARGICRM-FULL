import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Crown, Zap, Star, ArrowRight, X } from 'lucide-react';

interface SubscriptionData {
  planId: string;
  status: string;
  enabledFeatures: string[];
  usageLimits: Record<string, number>;
  currentUsage: Record<string, number>;
}

interface FeatureGateContextType {
  subscription: SubscriptionData | null;
  hasFeature: (feature: string) => boolean;
  isLoading: boolean;
  error: any;
}

const FeatureGateContext = createContext<FeatureGateContextType | null>(null);

export function FeatureGateProvider({ children }: { children: ReactNode }) {
  const { data: subscription, isLoading, error } = useQuery({
    queryKey: ['/api/subscription/current'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const hasFeature = (feature: string) => {
    if (!subscription) return false;
    
    // Define feature availability by plan
    const featureMap: Record<string, string[]> = {
      'contacts.basic': ['starter', 'professional', 'enterprise', 'unlimited'],
      'contacts.advanced': ['professional', 'enterprise', 'unlimited'],
      'contacts.bulk_import': ['professional', 'enterprise', 'unlimited'],
      'leads.scoring': ['professional', 'enterprise', 'unlimited'],
      'leads.automation': ['enterprise', 'unlimited'],
      'deals.forecasting': ['enterprise', 'unlimited'],
      'email.automation': ['enterprise', 'unlimited'],
      'analytics.advanced': ['professional', 'enterprise', 'unlimited'],
      'analytics.custom_reports': ['enterprise', 'unlimited'],
      'analytics.real_time': ['unlimited'],
      'team.unlimited_users': ['unlimited'],
      'security.enterprise': ['enterprise', 'unlimited'],
      'ai.predictive_scoring': ['enterprise', 'unlimited'],
      'ai.automation': ['unlimited'],
    };

    const requiredPlans = featureMap[feature] || [];
    return requiredPlans.includes(subscription.planId) || 
           subscription.enabledFeatures.includes(feature);
  };

  return (
    <FeatureGateContext.Provider value={{ subscription, hasFeature, isLoading, error }}>
      {children}
    </FeatureGateContext.Provider>
  );
}

export function useFeatureGate() {
  const context = useContext(FeatureGateContext);
  if (!context) {
    throw new Error('useFeatureGate must be used within a FeatureGateProvider');
  }
  return context;
}

interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgrade?: boolean;
}

export function FeatureGate({ feature, children, fallback, showUpgrade = true }: FeatureGateProps) {
  const { hasFeature, subscription, isLoading } = useFeatureGate();

  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-32" />
    );
  }

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgrade) {
    return <UpgradePrompt feature={feature} currentPlan={subscription?.planId || 'starter'} />;
  }

  return null;
}

interface UpgradePromptProps {
  feature: string;
  currentPlan: string;
}

function UpgradePrompt({ feature, currentPlan }: UpgradePromptProps) {
  const featureLabels: Record<string, string> = {
    'contacts.advanced': 'Advanced Contact Management',
    'contacts.bulk_import': 'Bulk Contact Import',
    'leads.scoring': 'AI Lead Scoring',
    'leads.automation': 'Lead Automation',
    'deals.forecasting': 'Sales Forecasting',
    'email.automation': 'Email Marketing Automation',
    'analytics.advanced': 'Advanced Analytics',
    'analytics.custom_reports': 'Custom Reports',
    'analytics.real_time': 'Real-time Analytics',
    'team.unlimited_users': 'Unlimited Team Members',
    'security.enterprise': 'Enterprise Security',
    'ai.predictive_scoring': 'AI Predictive Scoring',
    'ai.automation': 'AI-Powered Automation',
  };

  const planHierarchy = ['starter', 'professional', 'enterprise', 'unlimited'];
  const planLabels = {
    starter: 'Starter',
    professional: 'Professional',
    enterprise: 'Enterprise',
    unlimited: 'Ultimate'
  };

  const planIcons = {
    starter: Star,
    professional: Zap,
    enterprise: Crown,
    unlimited: Crown
  };

  const getRequiredPlans = (feature: string) => {
    const featureMap: Record<string, string[]> = {
      'contacts.advanced': ['professional', 'enterprise', 'unlimited'],
      'contacts.bulk_import': ['professional', 'enterprise', 'unlimited'],
      'leads.scoring': ['professional', 'enterprise', 'unlimited'],
      'leads.automation': ['enterprise', 'unlimited'],
      'deals.forecasting': ['enterprise', 'unlimited'],
      'email.automation': ['enterprise', 'unlimited'],
      'analytics.advanced': ['professional', 'enterprise', 'unlimited'],
      'analytics.custom_reports': ['enterprise', 'unlimited'],
      'analytics.real_time': ['unlimited'],
      'team.unlimited_users': ['unlimited'],
      'security.enterprise': ['enterprise', 'unlimited'],
      'ai.predictive_scoring': ['enterprise', 'unlimited'],
      'ai.automation': ['unlimited'],
    };
    return featureMap[feature] || [];
  };

  const requiredPlans = getRequiredPlans(feature);
  const currentIndex = planHierarchy.indexOf(currentPlan);
  const availablePlans = requiredPlans.filter(plan => {
    const planIndex = planHierarchy.indexOf(plan);
    return planIndex > currentIndex;
  });

  const recommendedPlan = availablePlans[0];
  const RecommendedIcon = recommendedPlan ? planIcons[recommendedPlan as keyof typeof planIcons] : Lock;

  return (
    <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
          <RecommendedIcon className="w-6 h-6 text-white" />
        </div>
        <CardTitle className="text-lg">
          {featureLabels[feature] || 'Premium Feature'}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            This feature requires a higher subscription plan to access.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Currently on: <Badge variant="outline">{planLabels[currentPlan as keyof typeof planLabels]}</Badge>
          </p>
          {recommendedPlan && (
            <p className="text-sm">
              Upgrade to: <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                {planLabels[recommendedPlan as keyof typeof planLabels]}
              </Badge>
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button 
            onClick={() => window.location.href = `/pricing?upgrade=${currentPlan}`}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Upgrade Now
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/pricing'}>
            View All Plans
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface UsageLimitProps {
  resource: string;
  current: number;
  limit: number;
  label: string;
  unit?: string;
}

export function UsageLimitIndicator({ resource, current, limit, label, unit = '' }: UsageLimitProps) {
  const percentage = limit === -1 ? 0 : Math.min((current / limit) * 100, 100);
  const isNearLimit = percentage > 80;
  const isOverLimit = current >= limit && limit !== -1;

  const getStatusColor = () => {
    if (limit === -1) return 'bg-green-500';
    if (isOverLimit) return 'bg-red-500';
    if (isNearLimit) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getStatusText = () => {
    if (limit === -1) return 'Unlimited';
    if (isOverLimit) return 'Limit Exceeded';
    if (isNearLimit) return 'Near Limit';
    return 'Available';
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        <Badge variant={isOverLimit ? 'destructive' : isNearLimit ? 'secondary' : 'default'}>
          {getStatusText()}
        </Badge>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{current.toLocaleString()}{unit} used</span>
          <span>{limit === -1 ? 'Unlimited' : `${limit.toLocaleString()}${unit} limit`}</span>
        </div>
        
        {limit !== -1 && (
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getStatusColor()}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        )}
      </div>

      {isOverLimit && (
        <Alert variant="destructive" className="mt-2">
          <X className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Usage limit exceeded. Upgrade your plan to continue using this feature.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

interface SubscriptionBannerProps {
  className?: string;
}

export function SubscriptionBanner({ className }: SubscriptionBannerProps) {
  const { subscription, isLoading } = useFeatureGate();

  if (isLoading || !subscription) return null;

  const isTrialOrExpiring = subscription.status === 'trial' || subscription.status === 'past_due';

  if (!isTrialOrExpiring) return null;

  return (
    <Alert className={`border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800 ${className}`}>
      <Crown className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-orange-800 dark:text-orange-200">
          {subscription.status === 'trial' ? 
            'Your trial is active. Upgrade to continue using all features.' :
            'Your subscription needs attention. Please update your billing information.'
          }
        </span>
        <Button 
          size="sm" 
          className="ml-4 bg-orange-600 hover:bg-orange-700 text-white"
          onClick={() => window.location.href = '/pricing'}
        >
          {subscription.status === 'trial' ? 'Upgrade Now' : 'Update Billing'}
        </Button>
      </AlertDescription>
    </Alert>
  );
}

// Enhanced component for subscription-aware feature display
interface ConditionalFeatureProps {
  feature: string;
  children: ReactNode;
  upgradeMessage?: string;
  planRequired?: string;
}

export function ConditionalFeature({ 
  feature, 
  children, 
  upgradeMessage,
  planRequired 
}: ConditionalFeatureProps) {
  const { hasFeature, subscription } = useFeatureGate();

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="filter blur-sm pointer-events-none opacity-50">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/80 rounded-lg">
        <div className="text-center space-y-2 p-4">
          <Lock className="w-8 h-8 mx-auto text-gray-500" />
          <p className="text-sm font-medium">
            {upgradeMessage || `Upgrade to ${planRequired || 'Professional'} to unlock this feature`}
          </p>
          <Button 
            size="sm" 
            onClick={() => window.location.href = `/pricing?upgrade=${subscription?.planId}`}
            className="bg-gradient-to-r from-purple-500 to-blue-500"
          >
            Upgrade Now
          </Button>
        </div>
      </div>
    </div>
  );
}