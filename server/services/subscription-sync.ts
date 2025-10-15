import { storage } from '../database-storage';
import { FEATURE_DEFINITIONS, PLAN_LIMITS, getAvailableFeatures } from '../middleware/feature-check';

export interface SubscriptionSyncResult {
  success: boolean;
  tenantId: string;
  planId: string;
  featuresUpdated: string[];
  limitsUpdated: boolean;
  errors: string[];
}

/**
 * Subscription synchronization service for real-time feature entitlement updates
 */
export class SubscriptionSyncService {
  private static instance: SubscriptionSyncService;
  private syncQueue: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): SubscriptionSyncService {
    if (!SubscriptionSyncService.instance) {
      SubscriptionSyncService.instance = new SubscriptionSyncService();
    }
    return SubscriptionSyncService.instance;
  }

  /**
   * Synchronize subscription features and limits for a tenant
   */
  async syncTenantSubscription(tenantId: string): Promise<SubscriptionSyncResult> {
    try {
      console.log(`🔄 Synchronizing subscription for tenant ${tenantId}...`);

      // Get current subscription
      const subscription = await this.getSubscriptionData(tenantId);
      if (!subscription) {
        return {
          success: false,
          tenantId,
          planId: 'unknown',
          featuresUpdated: [],
          limitsUpdated: false,
          errors: ['Subscription not found']
        };
      }

      // Calculate enabled features based on plan
      const availableFeatures = this.calculatePlanFeatures(subscription.planId);
      
      // Get custom enabled features (if any)
      const customFeatures = subscription.enabledFeatures || [];
      
      // Merge plan features with custom features
      const allFeatures = [...new Set([...availableFeatures, ...customFeatures])];

      // Get usage limits for the plan
      const usageLimits = PLAN_LIMITS[subscription.planId as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.starter;

      // Update subscription with synchronized data
      const updatedSubscription = await this.updateSubscriptionFeatures(tenantId, {
        enabledFeatures: allFeatures,
        usageLimits,
        lastSyncedAt: new Date()
      });

      console.log(`✅ Subscription sync completed for tenant ${tenantId}`);

      return {
        success: true,
        tenantId,
        planId: subscription.planId,
        featuresUpdated: allFeatures,
        limitsUpdated: true,
        errors: []
      };

    } catch (error) {
      console.error('Subscription sync error:', error);
      return {
        success: false,
        tenantId,
        planId: 'unknown',
        featuresUpdated: [],
        limitsUpdated: false,
        errors: [error instanceof Error ? error.message : 'Unknown sync error']
      };
    }
  }

  /**
   * Bulk synchronize all tenant subscriptions
   */
  async syncAllTenantSubscriptions(): Promise<SubscriptionSyncResult[]> {
    try {
      console.log('🔄 Starting bulk subscription synchronization...');

      // Get all tenants
      const tenants = await this.getAllTenants();
      const results: SubscriptionSyncResult[] = [];

      // Sync each tenant subscription
      for (const tenant of tenants) {
        const result = await this.syncTenantSubscription(tenant.id);
        results.push(result);
      }

      const successCount = results.filter(r => r.success).length;
      console.log(`✅ Bulk sync completed: ${successCount}/${results.length} successful`);

      return results;
    } catch (error) {
      console.error('Bulk sync error:', error);
      return [];
    }
  }

  /**
   * Schedule periodic synchronization for a tenant
   */
  scheduleTenantSync(tenantId: string, intervalMinutes: number = 60): void {
    // Clear existing schedule
    this.clearTenantSync(tenantId);

    // Schedule new sync
    const interval = setInterval(async () => {
      await this.syncTenantSubscription(tenantId);
    }, intervalMinutes * 60 * 1000);

    this.syncQueue.set(tenantId, interval);
    console.log(`📅 Scheduled sync for tenant ${tenantId} every ${intervalMinutes} minutes`);
  }

  /**
   * Clear scheduled synchronization for a tenant
   */
  clearTenantSync(tenantId: string): void {
    const existingInterval = this.syncQueue.get(tenantId);
    if (existingInterval) {
      clearInterval(existingInterval);
      this.syncQueue.delete(tenantId);
      console.log(`🗑️ Cleared sync schedule for tenant ${tenantId}`);
    }
  }

  /**
   * Handle subscription plan change
   */
  async handlePlanChange(tenantId: string, newPlanId: string, oldPlanId?: string): Promise<SubscriptionSyncResult> {
    try {
      console.log(`📈 Processing plan change for tenant ${tenantId}: ${oldPlanId} → ${newPlanId}`);

      // Update plan in subscription
      await this.updateSubscriptionPlan(tenantId, newPlanId);

      // Sync features and limits
      const syncResult = await this.syncTenantSubscription(tenantId);

      // Log feature changes
      if (oldPlanId) {
        const oldFeatures = this.calculatePlanFeatures(oldPlanId);
        const newFeatures = this.calculatePlanFeatures(newPlanId);
        const addedFeatures = newFeatures.filter(f => !oldFeatures.includes(f));
        const removedFeatures = oldFeatures.filter(f => !newFeatures.includes(f));

        if (addedFeatures.length > 0) {
          console.log(`✨ Features added: ${addedFeatures.join(', ')}`);
        }
        if (removedFeatures.length > 0) {
          console.log(`🚫 Features removed: ${removedFeatures.join(', ')}`);
        }
      }

      return syncResult;
    } catch (error) {
      console.error('Plan change error:', error);
      return {
        success: false,
        tenantId,
        planId: newPlanId,
        featuresUpdated: [],
        limitsUpdated: false,
        errors: [error instanceof Error ? error.message : 'Plan change failed']
      };
    }
  }

  /**
   * Handle custom feature toggle
   */
  async toggleCustomFeature(tenantId: string, feature: string, enabled: boolean): Promise<boolean> {
    try {
      console.log(`🔧 Toggling custom feature '${feature}' for tenant ${tenantId}: ${enabled}`);

      // Get current subscription
      const subscription = await this.getSubscriptionData(tenantId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Update custom features
      let customFeatures = subscription.enabledFeatures || [];
      
      if (enabled && !customFeatures.includes(feature)) {
        customFeatures.push(feature);
      } else if (!enabled) {
        customFeatures = customFeatures.filter(f => f !== feature);
      }

      // Update subscription
      await this.updateSubscriptionFeatures(tenantId, {
        enabledFeatures: customFeatures
      });

      // Trigger sync
      await this.syncTenantSubscription(tenantId);

      console.log(`✅ Custom feature '${feature}' ${enabled ? 'enabled' : 'disabled'} for tenant ${tenantId}`);
      return true;
    } catch (error) {
      console.error('Custom feature toggle error:', error);
      return false;
    }
  }

  /**
   * Calculate available features for a plan
   */
  private calculatePlanFeatures(planId: string): string[] {
    const features: string[] = [];
    
    Object.entries(FEATURE_DEFINITIONS).forEach(([feature, plans]) => {
      if (plans.includes(planId)) {
        features.push(feature);
      }
    });

    return features;
  }

  /**
   * Get subscription data for a tenant
   */
  private async getSubscriptionData(tenantId: string): Promise<any> {
    // Mock implementation - replace with actual database query
    const mockSubscriptions = {
      '1': {
        id: 'sub-1',
        tenantId: '1',
        planId: 'enterprise',
        status: 'active',
        enabledFeatures: [],
        usageLimits: PLAN_LIMITS.enterprise,
        currentUsage: {
          users: 12,
          contacts: 2500,
          storage: 15360,
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
        enabledFeatures: ['analytics.real_time'], // Custom feature
        usageLimits: PLAN_LIMITS.professional,
        currentUsage: {
          users: 5,
          contacts: 1200,
          storage: 3072,
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
        enabledFeatures: [],
        usageLimits: PLAN_LIMITS.starter,
        currentUsage: {
          users: 2,
          contacts: 150,
          storage: 256,
          emailsThisMonth: 100,
          smsThisMonth: 10,
          formsThisMonth: 2,
          apiCallsThisMonth: 500,
        }
      }
    };

    return mockSubscriptions[tenantId as keyof typeof mockSubscriptions] || null;
  }

  /**
   * Update subscription features and limits
   */
  private async updateSubscriptionFeatures(tenantId: string, updates: any): Promise<any> {
    // Mock implementation - replace with actual database update
    console.log(`💾 Updating subscription features for tenant ${tenantId}:`, updates);
    return { success: true };
  }

  /**
   * Update subscription plan
   */
  private async updateSubscriptionPlan(tenantId: string, planId: string): Promise<any> {
    // Mock implementation - replace with actual database update
    console.log(`💾 Updating subscription plan for tenant ${tenantId} to ${planId}`);
    return { success: true };
  }

  /**
   * Get all tenants
   */
  private async getAllTenants(): Promise<any[]> {
    // Mock implementation - replace with actual database query
    return [
      { id: '1', name: 'TechCorp Solutions' },
      { id: '2', name: 'Digital Dynamics' },
      { id: '3', name: 'Innovation Labs' }
    ];
  }

  /**
   * Get subscription health status
   */
  async getSubscriptionHealth(tenantId: string): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const subscription = await this.getSubscriptionData(tenantId);
      if (!subscription) {
        return {
          status: 'critical',
          issues: ['No subscription found'],
          recommendations: ['Set up subscription plan']
        };
      }

      const issues: string[] = [];
      const recommendations: string[] = [];

      // Check subscription status
      if (subscription.status === 'past_due') {
        issues.push('Payment is past due');
        recommendations.push('Update payment method');
      }

      if (subscription.status === 'trial') {
        issues.push('Trial subscription - limited time remaining');
        recommendations.push('Upgrade to paid plan');
      }

      // Check usage limits
      const usage = subscription.currentUsage || {};
      const limits = subscription.usageLimits || {};

      Object.entries(usage).forEach(([resource, current]) => {
        const limit = limits[resource];
        if (limit !== -1 && current >= limit * 0.9) {
          issues.push(`${resource} usage at ${Math.round((current / limit) * 100)}%`);
          recommendations.push(`Consider upgrading plan for more ${resource}`);
        }
      });

      const status = issues.length === 0 ? 'healthy' : 
                    issues.some(i => i.includes('critical') || i.includes('past_due')) ? 'critical' : 'warning';

      return { status, issues, recommendations };
    } catch (error) {
      return {
        status: 'critical',
        issues: ['Error checking subscription health'],
        recommendations: ['Contact support']
      };
    }
  }
}

// Export singleton instance
export const subscriptionSyncService = SubscriptionSyncService.getInstance();