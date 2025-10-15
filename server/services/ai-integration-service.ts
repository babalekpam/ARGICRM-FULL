import { UserStorage } from '../storage';

export interface AIIntegrationConfig {
  provider: 'platform' | 'custom';
  apiKey?: string;
  monthlyLimit?: number;
  usageCount: number;
  lastResetDate: string;
}

export interface TierLimits {
  openai: number;
  google: number;
  anthropic: number;
  totalMonthly: number;
}

export class AIIntegrationService {
  private static instance: AIIntegrationService;
  private userConfigs: Map<string, Record<string, AIIntegrationConfig>> = new Map();

  static getInstance(): AIIntegrationService {
    if (!AIIntegrationService.instance) {
      AIIntegrationService.instance = new AIIntegrationService();
    }
    return AIIntegrationService.instance;
  }

  // Tier-based AI limits
  private getTierLimits(subscriptionTier: string): TierLimits {
    const limits: Record<string, TierLimits> = {
      'trial': {
        openai: 50,      // 50 OpenAI requests/month
        google: 100,     // 100 Google API calls/month
        anthropic: 25,   // 25 Claude requests/month
        totalMonthly: 175
      },
      'starter': {
        openai: 200,
        google: 500,
        anthropic: 100,
        totalMonthly: 800
      },
      'professional': {
        openai: 1000,
        google: 2000,
        anthropic: 500,
        totalMonthly: 3500
      },
      'enterprise': {
        openai: -1,      // Unlimited with custom keys
        google: -1,
        anthropic: -1,
        totalMonthly: -1
      },
      'ultimate': {
        openai: -1,
        google: -1,
        anthropic: -1,
        totalMonthly: -1
      }
    };

    return limits[subscriptionTier] || limits['trial'];
  }

  // Initialize AI integrations for new user based on their tier
  async initializeUserAI(userId: string, subscriptionTier: string): Promise<void> {
    const limits = this.getTierLimits(subscriptionTier);
    const currentDate = new Date().toISOString();

    const defaultConfig: Record<string, AIIntegrationConfig> = {
      openai: {
        provider: 'platform',
        monthlyLimit: limits.openai,
        usageCount: 0,
        lastResetDate: currentDate
      },
      google: {
        provider: 'platform',
        monthlyLimit: limits.google,
        usageCount: 0,
        lastResetDate: currentDate
      },
      anthropic: {
        provider: 'platform',
        monthlyLimit: limits.anthropic,
        usageCount: 0,
        lastResetDate: currentDate
      }
    };

    this.userConfigs.set(userId, defaultConfig);
  }

  // Check if user can make AI request
  async canMakeRequest(userId: string, provider: string, subscriptionTier: string): Promise<{
    allowed: boolean;
    reason?: string;
    upgradeRequired?: boolean;
  }> {
    let userConfig = this.userConfigs.get(userId);
    
    if (!userConfig) {
      await this.initializeUserAI(userId, subscriptionTier);
      userConfig = this.userConfigs.get(userId)!;
    }

    const config = userConfig[provider];
    if (!config) {
      return { allowed: false, reason: 'Invalid AI provider' };
    }

    // Reset monthly usage if needed
    this.resetMonthlyUsageIfNeeded(userId, provider);

    // Check if using custom keys (unlimited)
    if (config.provider === 'custom' && config.apiKey) {
      return { allowed: true };
    }

    // Check platform limits
    if (config.monthlyLimit === -1) {
      return { allowed: true }; // Unlimited
    }

    if (config.usageCount >= config.monthlyLimit) {
      return {
        allowed: false,
        reason: `Monthly ${provider} limit reached (${config.monthlyLimit} requests)`,
        upgradeRequired: true
      };
    }

    return { allowed: true };
  }

  // Track AI usage
  async trackUsage(userId: string, provider: string): Promise<void> {
    const userConfig = this.userConfigs.get(userId);
    if (!userConfig || !userConfig[provider]) return;

    userConfig[provider].usageCount += 1;
  }

  // Get usage statistics for user
  async getUsageStats(userId: string): Promise<Record<string, {
    used: number;
    limit: number;
    percentage: number;
    provider: 'platform' | 'custom';
  }>> {
    const userConfig = this.userConfigs.get(userId);
    if (!userConfig) return {};

    const stats: Record<string, any> = {};

    for (const [provider, config] of Object.entries(userConfig)) {
      stats[provider] = {
        used: config.usageCount,
        limit: config.monthlyLimit,
        percentage: config.monthlyLimit > 0 ? (config.usageCount / config.monthlyLimit) * 100 : 0,
        provider: config.provider
      };
    }

    return stats;
  }

  // Update user's AI configuration
  async updateUserConfig(userId: string, provider: string, updates: Partial<AIIntegrationConfig>): Promise<void> {
    let userConfig = this.userConfigs.get(userId);
    if (!userConfig) {
      userConfig = {};
      this.userConfigs.set(userId, userConfig);
    }

    if (!userConfig[provider]) {
      userConfig[provider] = {
        provider: 'platform',
        usageCount: 0,
        lastResetDate: new Date().toISOString()
      };
    }

    Object.assign(userConfig[provider], updates);
  }

  // Reset monthly usage if month has changed
  private resetMonthlyUsageIfNeeded(userId: string, provider: string): void {
    const userConfig = this.userConfigs.get(userId);
    if (!userConfig || !userConfig[provider]) return;

    const config = userConfig[provider];
    const lastReset = new Date(config.lastResetDate);
    const now = new Date();

    // Check if month has changed
    if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
      config.usageCount = 0;
      config.lastResetDate = now.toISOString();
    }
  }

  // Get AI integration recommendations based on usage
  async getIntegrationRecommendations(userId: string, subscriptionTier: string): Promise<{
    recommendations: Array<{
      provider: string;
      suggestion: string;
      priority: 'low' | 'medium' | 'high';
      action: string;
    }>;
  }> {
    const stats = await this.getUsageStats(userId);
    const recommendations: any[] = [];

    for (const [provider, stat] of Object.entries(stats)) {
      if (stat.percentage > 80 && stat.provider === 'platform') {
        recommendations.push({
          provider,
          suggestion: `You're using ${stat.percentage.toFixed(0)}% of your ${provider} quota`,
          priority: stat.percentage > 95 ? 'high' : 'medium',
          action: subscriptionTier === 'enterprise' || subscriptionTier === 'ultimate' 
            ? 'Consider adding your own API keys for unlimited usage'
            : 'Consider upgrading your plan for higher limits'
        });
      }
    }

    return { recommendations };
  }

  // Get available AI providers for user's tier
  getAvailableProviders(subscriptionTier: string): Array<{
    provider: string;
    name: string;
    description: string;
    platformSupported: boolean;
    customKeysSupported: boolean;
  }> {
    const providers = [
      {
        provider: 'openai',
        name: 'OpenAI GPT',
        description: 'Advanced language models for content generation and analysis',
        platformSupported: true,
        customKeysSupported: ['enterprise', 'ultimate'].includes(subscriptionTier)
      },
      {
        provider: 'google',
        name: 'Google AI',
        description: 'Translation, geocoding, and Gemini AI capabilities',
        platformSupported: true,
        customKeysSupported: ['enterprise', 'ultimate'].includes(subscriptionTier)
      },
      {
        provider: 'anthropic',
        name: 'Claude AI',
        description: 'Advanced reasoning and analysis capabilities',
        platformSupported: true,
        customKeysSupported: ['enterprise', 'ultimate'].includes(subscriptionTier)
      }
    ];

    return providers;
  }
}

export const aiIntegrationService = AIIntegrationService.getInstance();