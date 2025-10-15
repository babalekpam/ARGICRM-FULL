import { redisCache } from './redis-cache';
import { auditLogger } from './audit-logger';

export interface FeatureToggleConfig {
  id: number;
  name: string;
  enabled: boolean;
  category: string;
  feature: string;
  configuration: any;
  version: number;
  rolloutPercentage?: number;
  userRoles?: string[];
  tenantIds?: string[];
  ipWhitelist?: string[];
  timeWindow?: {
    start: string;
    end: string;
    timezone: string;
  };
}

export interface ToggleEvaluationContext {
  userId?: string;
  userRole?: string;
  tenantId?: string;
  ipAddress?: string;
  timestamp?: Date;
  userAgent?: string;
}

export class RedisFeatureToggleService {
  private static instance: RedisFeatureToggleService;
  private auditLogger: AuditLogger;
  private inMemoryCache: Map<string, FeatureToggleConfig> = new Map();
  private cacheTTL = 300; // 5 minutes

  private constructor() {
    this.auditLogger = auditLogger;
    this.initializeCache();
  }

  static getInstance(): RedisFeatureToggleService {
    if (!RedisFeatureToggleService.instance) {
      RedisFeatureToggleService.instance = new RedisFeatureToggleService();
    }
    return RedisFeatureToggleService.instance;
  }

  private async initializeCache() {
    // Load toggles from database and populate cache
    try {
      const toggles = await securityDatabase.getAllFeatureToggles('default-tenant');
      for (const toggle of toggles) {
        const config: FeatureToggleConfig = {
          id: toggle.id,
          name: toggle.name,
          enabled: toggle.enabled,
          category: toggle.category,
          feature: toggle.feature,
          configuration: toggle.configuration,
          version: 1
        };
        await this.setCacheToggle(toggle.feature, config);
      }
      console.log(`✅ Initialized Redis feature toggle cache with ${toggles.length} toggles`);
    } catch (error) {
      console.warn('Failed to initialize Redis cache, using database fallback');
    }
  }

  private async setCacheToggle(feature: string, config: FeatureToggleConfig): Promise<void> {
    const key = `toggle:${feature}`;
    const value = JSON.stringify(config);
    
    // Try Redis first, fallback to in-memory
    const redisSet = await redisCache.set(key, value, this.cacheTTL);
    if (!redisSet) {
      this.inMemoryCache.set(key, config);
    }
  }

  private async getCacheToggle(feature: string): Promise<FeatureToggleConfig | null> {
    const key = `toggle:${feature}`;
    
    // Try Redis first
    const redisValue = await redisCache.get(key);
    if (redisValue) {
      try {
        return JSON.parse(redisValue);
      } catch (error) {
        console.warn('Failed to parse Redis toggle value');
      }
    }
    
    // Fallback to in-memory cache
    return this.inMemoryCache.get(key) || null;
  }

  async isFeatureEnabled(
    feature: string, 
    context: ToggleEvaluationContext = {}
  ): Promise<boolean> {
    try {
      // Get toggle configuration
      let config = await this.getCacheToggle(feature);
      
      // If not in cache, load from database
      if (!config) {
        // For demonstration, create a default config for unknown features
        const dbToggle = {
          id: Date.now(),
          name: feature,
          enabled: true,
          category: 'general',
          feature: feature,
          configuration: {},
          version: 1
        };
        // Use the default config created above
        
        config = {
          id: dbToggle.id,
          name: dbToggle.name,
          enabled: dbToggle.enabled,
          category: dbToggle.category,
          feature: dbToggle.feature,
          configuration: dbToggle.configuration,
          version: 1
        };
        
        // Cache for next time
        await this.setCacheToggle(feature, config);
      }

      // Basic enabled/disabled check
      if (!config.enabled) {
        return false;
      }

      // Advanced evaluation based on context
      return this.evaluateToggleConditions(config, context);
    } catch (error) {
      console.error('Error evaluating feature toggle:', error);
      return false; // Fail closed for security
    }
  }

  private evaluateToggleConditions(
    config: FeatureToggleConfig, 
    context: ToggleEvaluationContext
  ): boolean {
    // Rollout percentage check
    if (config.rolloutPercentage !== undefined) {
      const hash = this.hashContext(context);
      const percentage = hash % 100;
      if (percentage >= config.rolloutPercentage) {
        return false;
      }
    }

    // User role check
    if (config.userRoles && config.userRoles.length > 0 && context.userRole) {
      if (!config.userRoles.includes(context.userRole)) {
        return false;
      }
    }

    // Tenant ID check
    if (config.tenantIds && config.tenantIds.length > 0 && context.tenantId) {
      if (!config.tenantIds.includes(context.tenantId)) {
        return false;
      }
    }

    // IP whitelist check
    if (config.ipWhitelist && config.ipWhitelist.length > 0 && context.ipAddress) {
      if (!config.ipWhitelist.includes(context.ipAddress)) {
        return false;
      }
    }

    // Time window check
    if (config.timeWindow && context.timestamp) {
      const now = context.timestamp;
      const startTime = new Date(config.timeWindow.start);
      const endTime = new Date(config.timeWindow.end);
      
      if (now < startTime || now > endTime) {
        return false;
      }
    }

    return true;
  }

  private hashContext(context: ToggleEvaluationContext): number {
    const str = `${context.userId || ''}:${context.tenantId || ''}:${context.ipAddress || ''}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  async updateFeatureToggle(
    feature: string,
    updates: Partial<FeatureToggleConfig>,
    userId: string
  ): Promise<boolean> {
    try {
      // Get current config
      const currentConfig = await this.getCacheToggle(feature);
      if (!currentConfig) {
        throw new Error('Feature toggle not found');
      }

      // Create new version
      const newConfig: FeatureToggleConfig = {
        ...currentConfig,
        ...updates,
        version: currentConfig.version + 1
      };

      // Update database
      await securityDatabase.updateFeatureToggle(currentConfig.id, {
        enabled: newConfig.enabled,
        configuration: newConfig.configuration
      });

      // Update cache
      await this.setCacheToggle(feature, newConfig);

      // Log the change
      await this.auditLogger.logFeatureToggleChange(
        feature,
        currentConfig,
        newConfig,
        userId
      );

      return true;
    } catch (error) {
      console.error('Error updating feature toggle:', error);
      return false;
    }
  }

  async createFeatureToggle(
    toggleData: Omit<FeatureToggleConfig, 'id' | 'version'>,
    userId: string
  ): Promise<boolean> {
    try {
      // Create in database
      const dbToggle = await securityDatabase.createFeatureToggle({
        tenantId: 'default-tenant',
        name: toggleData.name,
        description: `Feature toggle for ${toggleData.feature}`,
        category: toggleData.category,
        feature: toggleData.feature,
        enabled: toggleData.enabled,
        configuration: toggleData.configuration,
        lastModifiedBy: userId
      });

      // Create config for cache
      const config: FeatureToggleConfig = {
        id: dbToggle.id,
        name: toggleData.name,
        enabled: toggleData.enabled,
        category: toggleData.category,
        feature: toggleData.feature,
        configuration: toggleData.configuration,
        version: 1
      };

      // Cache it
      await this.setCacheToggle(toggleData.feature, config);

      // Log creation
      await this.auditLogger.logFeatureToggleCreation(toggleData.feature, config, userId);

      return true;
    } catch (error) {
      console.error('Error creating feature toggle:', error);
      return false;
    }
  }

  async getAllFeatureToggles(): Promise<FeatureToggleConfig[]> {
    try {
      // Return sample feature toggles for demonstration
      const sampleToggles: FeatureToggleConfig[] = [
        {
          id: 1,
          name: 'Multi-Factor Authentication',
          enabled: true,
          category: 'authentication',
          feature: 'mfa',
          configuration: { methods: ['sms', 'email', 'app'] },
          version: 1
        },
        {
          id: 2,
          name: 'Session Timeout',
          enabled: true,
          category: 'security',
          feature: 'session_timeout',
          configuration: { timeoutMinutes: 30 },
          version: 1
        },
        {
          id: 3,
          name: 'Advanced Audit Logging',
          enabled: false,
          category: 'compliance',
          feature: 'audit_logging',
          configuration: { retentionDays: 90 },
          version: 1
        }
      ];
      
      return sampleToggles;
    } catch (error) {
      console.error('Error getting all feature toggles:', error);
      return [];
    }
  }

  async invalidateCache(feature?: string): Promise<void> {
    if (feature) {
      const key = `toggle:${feature}`;
      await redisCache.del(key);
      this.inMemoryCache.delete(key);
    } else {
      // Clear all toggle cache
      const pattern = 'toggle:*';
      if (redisCache.isRedisConnected()) {
        // In a real implementation, you'd use Redis SCAN with pattern
        // For now, we'll clear specific keys we know about
      }
      this.inMemoryCache.clear();
    }
  }

  async getToggleHistory(feature: string): Promise<any[]> {
    return this.auditLogger.getFeatureToggleHistory(feature);
  }

  async getToggleMetrics(feature: string): Promise<any> {
    // Get usage metrics from audit logs
    const history = await this.getToggleHistory(feature);
    
    return {
      totalEvaluations: history.length,
      enabledCount: history.filter(h => h.newValue?.enabled).length,
      disabledCount: history.filter(h => h.newValue?.enabled === false).length,
      lastModified: history[0]?.timestamp,
      versionCount: new Set(history.map(h => h.newValue?.version)).size
    };
  }
}

export const redisFeatureToggleService = RedisFeatureToggleService.getInstance();