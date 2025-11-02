interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  limits: {
    users: number;
    contacts: number;
    storage: number; // in GB
    emailsPerMonth: number;
    smsPerMonth: number;
    formsPerMonth: number;
    apiCalls: number;
  };
  isPopular?: boolean;
  isTrial?: boolean;
}

interface TenantConfig {
  id: string;
  subdomain: string;
  customDomain?: string;
  companyName: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  language: string;
  features: string[];
  subscriptionPlan: string;
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'trial';
  trialEndsAt?: Date;
  nextBillingDate?: Date;
}

interface UsageMetrics {
  users: number;
  contacts: number;
  storage: number;
  emailsSent: number;
  smsSent: number;
  formsCreated: number;
  apiCallsMade: number;
  period: 'current_month' | 'last_month';
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 17.99,
    currency: 'USD',
    billingCycle: 'monthly',
    features: [
      'contacts_basic',
      'leads_basic',
      'deals_basic',
      'tasks_basic',
      'calendar_basic',
      'email_integration',
      'mobile_app',
      'basic_reports',
      'standard_support'
    ],
    limits: {
      users: 5,
      contacts: 5000,
      storage: 1,
      emailsPerMonth: 5000,
      smsPerMonth: 500,
      formsPerMonth: 10,
      apiCalls: 20000
    }
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 59.99,
    currency: 'USD',
    billingCycle: 'monthly',
    features: [
      'contacts_advanced',
      'leads_advanced',
      'deals_advanced',
      'tasks_advanced',
      'calendar_advanced',
      'email_integration',
      'mobile_app',
      'advanced_reports',
      'sales_automation',
      'marketing_campaigns',
      'territory_management',
      'custom_fields',
      'email_marketing',
      'priority_support',
      'ai_basic',
      'reputation_basic'
    ],
    limits: {
      users: -1,
      contacts: 50000,
      storage: 10,
      emailsPerMonth: 50000,
      smsPerMonth: 5000,
      formsPerMonth: 100,
      apiCalls: 100000
    },
    isPopular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 119.99,
    currency: 'USD',
    billingCycle: 'monthly',
    features: [
      'contacts_enterprise',
      'leads_enterprise',
      'deals_enterprise',
      'tasks_enterprise',
      'calendar_enterprise',
      'email_integration',
      'mobile_app',
      'enterprise_reports',
      'advanced_automation',
      'advanced_marketing',
      'territory_management_advanced',
      'custom_fields_unlimited',
      'email_marketing_advanced',
      'api_access_advanced',
      'ai_advanced',
      'reputation_advanced',
      'security_compliance',
      'custom_apps',
      'integrations_advanced',
      'dedicated_support'
    ],
    limits: {
      users: -1,
      contacts: -1,
      storage: 100,
      emailsPerMonth: -1,
      smsPerMonth: -1,
      formsPerMonth: -1,
      apiCalls: 500000
    }
  },
  {
    id: 'unlimited',
    name: 'Ultimate',
    price: 199.99,
    currency: 'USD',
    billingCycle: 'monthly',
    features: [
      'contacts_unlimited',
      'leads_unlimited',
      'deals_unlimited',
      'tasks_unlimited',
      'calendar_unlimited',
      'email_integration',
      'mobile_app',
      'unlimited_reports',
      'unlimited_automation',
      'unlimited_marketing',
      'territory_management_unlimited',
      'custom_fields_unlimited',
      'email_marketing_unlimited',
      'api_access_unlimited',
      'ai_premium',
      'reputation_premium',
      'security_premium',
      'custom_apps_unlimited',
      'integrations_unlimited',
      'white_glove_support',
      'white_label',
      'custom_implementation'
    ],
    limits: {
      users: -1,
      contacts: -1,
      storage: -1,
      emailsPerMonth: -1,
      smsPerMonth: -1,
      formsPerMonth: -1,
      apiCalls: -1
    }
  },
  {
    id: 'trial',
    name: 'Free Trial',
    price: 0,
    currency: 'USD',
    billingCycle: 'monthly',
    features: [
      'contacts_basic',
      'leads_basic',
      'deals_basic',
      'tasks_basic',
      'email_integration',
      'mobile_app',
      'basic_reports'
    ],
    limits: {
      users: 3,
      contacts: 100,
      storage: 0.5,
      emailsPerMonth: 100,
      smsPerMonth: 10,
      formsPerMonth: 3,
      apiCalls: 1000
    },
    isTrial: true
  }
];

const oldPlans = [
  {
    id: 'enterprise_old',
    name: 'Enterprise (Legacy)',
    price: 199,
    currency: 'USD',
    billingCycle: 'monthly',
    features: [
      'Unlimited users',
      'Unlimited contacts',
      '1TB storage',
      'All CRM features',
      'Advanced automation',
      'White-label options',
      'API access',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee'
    ],
    limits: {
      users: -1,
      contacts: -1,
      storage: 1000,
      emailsPerMonth: -1,
      smsPerMonth: -1,
      formsPerMonth: -1,
      apiCalls: -1
    }
  }
];

export class SaaSFeatureService {
  private static instance: SaaSFeatureService;
  private currentTenant: TenantConfig | null = null;
  private currentPlan: SubscriptionPlan | null = null;
  private usageMetrics: UsageMetrics | null = null;

  static getInstance(): SaaSFeatureService {
    if (!SaaSFeatureService.instance) {
      SaaSFeatureService.instance = new SaaSFeatureService();
    }
    return SaaSFeatureService.instance;
  }

  constructor() {
    this.loadTenantConfig();
  }

  private loadTenantConfig() {
    // In a real implementation, this would load from API based on subdomain
    const mockTenant: TenantConfig = {
      id: 'tenant_1',
      subdomain: 'demo',
      companyName: 'ARGILETTE Demo',
      primaryColor: '#3b82f6',
      secondaryColor: '#1e40af',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      currency: 'USD',
      language: 'en',
      features: [
        'contacts_basic',
        'contacts_advanced',
        'leads_basic',
        'leads_advanced',
        'deals_basic',
        'deals_advanced',
        'tasks_basic',
        'tasks_advanced',
        'calendar_basic',
        'calendar_advanced',
        'email_integration',
        'mobile_app',
        'advanced_reports',
        'sales_automation',
        'marketing_campaigns',
        'territory_management',
        'custom_fields',
        'email_marketing',
        'priority_support',
        'ai_basic',
        'reputation_basic',
        'aiPredictions',
        'reputationManagement',
        'advancedAnalytics',
        'whiteLabel',
        'customDomain',
        'apiAccess',
        'custom_apps'
      ],
      subscriptionPlan: 'enterprise',
      subscriptionStatus: 'active',
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };

    this.currentTenant = mockTenant;
    this.currentPlan = subscriptionPlans.find(plan => plan.id === mockTenant.subscriptionPlan) || null;
    this.loadUsageMetrics();
  }

  private loadUsageMetrics() {
    // Mock usage data
    this.usageMetrics = {
      users: 12,
      contacts: 3450,
      storage: 45.2,
      emailsSent: 8750,
      smsSent: 1250,
      formsCreated: 23,
      apiCallsMade: 45000,
      period: 'current_month'
    };
  }

  public getCurrentTenant(): TenantConfig | null {
    return this.currentTenant;
  }

  public getCurrentPlan(): SubscriptionPlan | null {
    return this.currentPlan;
  }

  public getUsageMetrics(): UsageMetrics | null {
    return this.usageMetrics;
  }

  public getAllPlans(): SubscriptionPlan[] {
    return subscriptionPlans;
  }

  public hasFeature(featureName: string): boolean {
    // Check if user is platform owner first
    const user = this.getCurrentUser();
    if (user?.email === 'admin@default.com' || user?.email === 'abel@argilette.org' || user?.role === 'platform_owner') {
      return true; // Platform owners have access to all features
    }
    
    return this.currentTenant?.features.includes(featureName) || false;
  }

  private getCurrentUser() {
    // Access current user from localStorage or auth service
    try {
      // Try different localStorage keys that might contain user data
      const userData = localStorage.getItem('user') || 
                      localStorage.getItem('auth_user') ||
                      localStorage.getItem('currentUser');
      
      if (userData) {
        return JSON.parse(userData);
      }
      
      // Also check for email in localStorage as fallback
      const email = localStorage.getItem('user_email') || localStorage.getItem('userEmail');
      if (email) {
        return { email, role: email.includes('abel@argilette.org') ? 'platform_owner' : 'user' };
      }
      
      return null;
    } catch {
      return null;
    }
  }

  public checkLimit(limitType: keyof UsageMetrics): { 
    current: number; 
    limit: number; 
    percentage: number; 
    exceeded: boolean 
  } {
    if (!this.currentPlan || !this.usageMetrics) {
      return { current: 0, limit: 0, percentage: 0, exceeded: false };
    }

    const current = this.usageMetrics[limitType] as number;
    const limit = this.currentPlan.limits[limitType as keyof typeof this.currentPlan.limits] as number;
    
    if (limit === -1) {
      return { current, limit: -1, percentage: 0, exceeded: false };
    }

    const percentage = (current / limit) * 100;
    const exceeded = current >= limit;

    return { current, limit, percentage, exceeded };
  }

  public getSubscriptionStatus(): {
    status: string;
    daysRemaining?: number;
    nextBillingDate?: Date;
    isTrialExpiring?: boolean;
  } {
    if (!this.currentTenant) {
      return { status: 'unknown' };
    }

    const status = this.currentTenant.subscriptionStatus;
    
    if (status === 'trial' && this.currentTenant.trialEndsAt) {
      const daysRemaining = Math.ceil(
        (this.currentTenant.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return {
        status,
        daysRemaining,
        isTrialExpiring: daysRemaining <= 3
      };
    }

    return {
      status,
      nextBillingDate: this.currentTenant.nextBillingDate
    };
  }

  public canUpgrade(): boolean {
    if (!this.currentPlan) return false;
    
    const currentPlanIndex = subscriptionPlans.findIndex(plan => plan.id === this.currentPlan?.id);
    return currentPlanIndex < subscriptionPlans.length - 1;
  }

  public getUpgradeOptions(): SubscriptionPlan[] {
    if (!this.currentPlan) return subscriptionPlans;
    
    const currentPlanIndex = subscriptionPlans.findIndex(plan => plan.id === this.currentPlan?.id);
    return subscriptionPlans.slice(currentPlanIndex + 1);
  }

  public calculateMonthlySavings(planId: string): number {
    const plan = subscriptionPlans.find(p => p.id === planId);
    if (!plan || !this.currentPlan) return 0;
    
    // Calculate potential savings based on usage vs limits
    const savings = Math.max(0, this.currentPlan.price - plan.price);
    return savings;
  }

  public getFeatureAvailability(featureName: string): {
    available: boolean;
    requiresUpgrade: boolean;
    availableInPlans: string[];
  } {
    const available = this.hasFeature(featureName);
    const availableInPlans = subscriptionPlans
      .filter(plan => this.planHasFeature(plan, featureName))
      .map(plan => plan.name);
    
    return {
      available,
      requiresUpgrade: !available && availableInPlans.length > 0,
      availableInPlans
    };
  }

  private planHasFeature(plan: SubscriptionPlan, featureName: string): boolean {
    return plan.features.includes(featureName);
  }

  // Feature mapping for navigation items
  public getFeatureRequirement(navigationPath: string): string | null {
    const featureMap: Record<string, string | null> = {
      '/contacts': 'contacts_basic',
      '/accounts': 'contacts_basic',
      '/leads': 'leads_basic',
      '/deals': 'deals_basic',
      '/tasks': 'tasks_basic',
      '/calendar': 'calendar_basic',
      '/campaigns': 'email_marketing',
      '/email-marketing': 'email_marketing',
      '/sms-marketing': 'email_marketing',
      '/funnel-builder': 'marketing_campaigns',
      '/e-commerce-dashboard': 'custom_apps',
      '/inventory-management': 'custom_apps',
      '/workflows': 'sales_automation',
      '/advanced-analytics': 'advanced_reports',
      '/analytics': 'advanced_reports',
      '/reputation-management': 'reputation_basic',
      '/territory-management': 'territory_management',
      '/einstein-ai': 'ai_basic',
      '/ai-predictions': 'ai_basic',
      '/voice-emotion-analytics': 'ai_basic',
      '/integration-platform': 'api_access_advanced',
      '/custom-apps': 'custom_apps',
      '/white-label': 'white_label',
      '/white-label-settings': 'white_label',
      '/settings': null, // Settings should be accessible to all users
      '/feature-toggles': null, // Feature toggles should be accessible to all users
      // ARGILETTE SEO Platform - accessible to all users
      '/seo-audit': null,
      '/seo-management': null,
      '/keywords': null,
      '/backlinks': null,
      '/rank-tracking': null,
      '/competitors': null,
      '/technical-audit': null,
      '/local-seo': null
    };

    return featureMap[navigationPath] || null;
  }

  public canAccessFeature(navigationPath: string): boolean {
    // Platform owners can access all features
    const user = this.getCurrentUser();
    
    // Debug logging for marketing features
    if (navigationPath === '/campaigns' || navigationPath === '/funnel-builder' || navigationPath === '/e-commerce-dashboard') {
      console.log(`SAAS Feature Check - ${navigationPath}:`, {
        user,
        userEmail: user?.email,
        userRole: user?.role,
        isPlatformOwner: user?.email === 'admin@default.com' || user?.role === 'platform_owner'
      });
    }
    
    if (user?.email === 'admin@default.com' || user?.email === 'abel@argilette.org' || user?.role === 'platform_owner') {
      return true;
    }
    
    const requiredFeature = this.getFeatureRequirement(navigationPath);
    if (!requiredFeature) return true; // No restriction
    
    const hasFeatureResult = this.hasFeature(requiredFeature);
    
    // More debug logging for marketing features
    if (navigationPath === '/campaigns' || navigationPath === '/funnel-builder' || navigationPath === '/e-commerce-dashboard') {
      console.log(`SAAS Feature Check Result - ${navigationPath}:`, {
        requiredFeature,
        hasFeatureResult,
        tenantFeatures: this.currentTenant?.features
      });
    }
    
    return hasFeatureResult;
  }

  public async updateTenantConfig(updates: Partial<TenantConfig>): Promise<void> {
    if (this.currentTenant) {
      this.currentTenant = { ...this.currentTenant, ...updates };
      // In real implementation, this would make an API call
      console.log('Tenant config updated:', updates);
    }
  }

  public async changePlan(planId: string): Promise<void> {
    const newPlan = subscriptionPlans.find(plan => plan.id === planId);
    if (newPlan && this.currentTenant) {
      this.currentPlan = newPlan;
      this.currentTenant.subscriptionPlan = planId;
      // In real implementation, this would handle billing changes
      console.log('Plan changed to:', planId);
    }
  }
}

export const saasFeatures = SaaSFeatureService.getInstance();