import { EventEmitter } from 'events';

export interface FeatureToggle {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  scope: 'global' | 'tenant' | 'user';
  conditions?: {
    tenantIds?: string[];
    userRoles?: string[];
    dateRange?: {
      start: Date;
      end: Date;
    };
    percentage?: number; // For gradual rollouts
  };
  metadata: {
    createdBy: string;
    createdAt: Date;
    updatedBy: string;
    updatedAt: Date;
    version: number;
  };
}

export interface FeatureToggleAuditLog {
  id: string;
  toggleId: string;
  action: 'create' | 'update' | 'delete' | 'enable' | 'disable';
  previousValue?: any;
  newValue?: any;
  userId: string;
  userEmail: string;
  timestamp: Date;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class FeatureToggleService extends EventEmitter {
  private static instance: FeatureToggleService;
  private toggles: Map<string, FeatureToggle> = new Map();
  private auditLogs: FeatureToggleAuditLog[] = [];
  private versions: Map<string, FeatureToggle[]> = new Map(); // For configuration versioning

  static getInstance(): FeatureToggleService {
    if (!FeatureToggleService.instance) {
      FeatureToggleService.instance = new FeatureToggleService();
    }
    return FeatureToggleService.instance;
  }

  constructor() {
    super();
    this.initializeDefaultToggles();
  }

  private initializeDefaultToggles() {
    const defaultToggles: Omit<FeatureToggle, 'metadata'>[] = [
      {
        id: 'advanced-analytics',
        name: 'Advanced Analytics',
        description: 'Enable advanced analytics and reporting features',
        enabled: true,
        scope: 'tenant',
        conditions: {
          userRoles: ['admin', 'platform_owner']
        }
      },
      {
        id: 'ai-recommendations',
        name: 'AI Recommendations',
        description: 'Enable AI-powered template and workflow recommendations',
        enabled: true,
        scope: 'global'
      },
      {
        id: 'bulk-operations',
        name: 'Bulk Operations',
        description: 'Enable bulk import/export and mass operations',
        enabled: true,
        scope: 'tenant',
        conditions: {
          userRoles: ['admin', 'platform_owner']
        }
      },
      {
        id: 'enterprise-security',
        name: 'Enterprise Security',
        description: 'Enable advanced security features like 2FA, SSO, audit logs',
        enabled: false,
        scope: 'tenant',
        conditions: {
          userRoles: ['platform_owner']
        }
      },
      {
        id: 'white-label-branding',
        name: 'White Label Branding',
        description: 'Allow tenants to customize branding and appearance',
        enabled: true,
        scope: 'tenant'
      },
      {
        id: 'api-access',
        name: 'API Access',
        description: 'Enable REST API access for integrations',
        enabled: true,
        scope: 'tenant',
        conditions: {
          userRoles: ['admin', 'platform_owner']
        }
      }
    ];

    defaultToggles.forEach(toggle => {
      const fullToggle: FeatureToggle = {
        ...toggle,
        metadata: {
          createdBy: 'system',
          createdAt: new Date(),
          updatedBy: 'system',
          updatedAt: new Date(),
          version: 1
        }
      };
      this.toggles.set(toggle.id, fullToggle);
      this.saveVersion(toggle.id, fullToggle);
    });
  }

  async createToggle(toggle: Omit<FeatureToggle, 'metadata'>, userId: string, userEmail: string): Promise<FeatureToggle> {
    const fullToggle: FeatureToggle = {
      ...toggle,
      metadata: {
        createdBy: userId,
        createdAt: new Date(),
        updatedBy: userId,
        updatedAt: new Date(),
        version: 1
      }
    };

    this.toggles.set(toggle.id, fullToggle);
    this.saveVersion(toggle.id, fullToggle);
    
    await this.logAudit({
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      toggleId: toggle.id,
      action: 'create',
      newValue: fullToggle,
      userId,
      userEmail,
      timestamp: new Date()
    });

    this.emit('toggleCreated', fullToggle);
    return fullToggle;
  }

  async updateToggle(toggleId: string, updates: Partial<FeatureToggle>, userId: string, userEmail: string, reason?: string): Promise<FeatureToggle> {
    const existingToggle = this.toggles.get(toggleId);
    if (!existingToggle) {
      throw new Error(`Feature toggle ${toggleId} not found`);
    }

    const updatedToggle: FeatureToggle = {
      ...existingToggle,
      ...updates,
      metadata: {
        ...existingToggle.metadata,
        updatedBy: userId,
        updatedAt: new Date(),
        version: existingToggle.metadata.version + 1
      }
    };

    this.toggles.set(toggleId, updatedToggle);
    this.saveVersion(toggleId, updatedToggle);

    await this.logAudit({
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      toggleId,
      action: 'update',
      previousValue: existingToggle,
      newValue: updatedToggle,
      userId,
      userEmail,
      timestamp: new Date(),
      reason
    });

    this.emit('toggleUpdated', updatedToggle);
    return updatedToggle;
  }

  async toggleFeature(toggleId: string, enabled: boolean, userId: string, userEmail: string, reason?: string): Promise<FeatureToggle> {
    const existingToggle = this.toggles.get(toggleId);
    if (!existingToggle) {
      throw new Error(`Feature toggle ${toggleId} not found`);
    }

    const updatedToggle: FeatureToggle = {
      ...existingToggle,
      enabled,
      metadata: {
        ...existingToggle.metadata,
        updatedBy: userId,
        updatedAt: new Date(),
        version: existingToggle.metadata.version + 1
      }
    };

    this.toggles.set(toggleId, updatedToggle);
    this.saveVersion(toggleId, updatedToggle);

    await this.logAudit({
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      toggleId,
      action: enabled ? 'enable' : 'disable',
      previousValue: { enabled: existingToggle.enabled },
      newValue: { enabled },
      userId,
      userEmail,
      timestamp: new Date(),
      reason
    });

    this.emit('toggleChanged', updatedToggle);
    return updatedToggle;
  }

  async deleteToggle(toggleId: string, userId: string, userEmail: string, reason?: string): Promise<void> {
    const existingToggle = this.toggles.get(toggleId);
    if (!existingToggle) {
      throw new Error(`Feature toggle ${toggleId} not found`);
    }

    this.toggles.delete(toggleId);

    await this.logAudit({
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      toggleId,
      action: 'delete',
      previousValue: existingToggle,
      userId,
      userEmail,
      timestamp: new Date(),
      reason
    });

    this.emit('toggleDeleted', { toggleId, toggle: existingToggle });
  }

  isFeatureEnabled(toggleId: string, context: {
    tenantId?: string;
    userId?: string;
    userRole?: string;
  } = {}): boolean {
    const toggle = this.toggles.get(toggleId);
    if (!toggle) {
      return false; // Default to disabled for unknown features
    }

    if (!toggle.enabled) {
      return false;
    }

    // Check conditions if they exist
    if (toggle.conditions) {
      // Check tenant restrictions
      if (toggle.conditions.tenantIds && context.tenantId) {
        if (!toggle.conditions.tenantIds.includes(context.tenantId)) {
          return false;
        }
      }

      // Check user role restrictions
      if (toggle.conditions.userRoles && context.userRole) {
        if (!toggle.conditions.userRoles.includes(context.userRole)) {
          return false;
        }
      }

      // Check date range
      if (toggle.conditions.dateRange) {
        const now = new Date();
        if (now < toggle.conditions.dateRange.start || now > toggle.conditions.dateRange.end) {
          return false;
        }
      }

      // Check percentage rollout
      if (toggle.conditions.percentage !== undefined) {
        const hash = this.hashContext(toggleId, context);
        const percentage = (hash % 100) + 1;
        if (percentage > toggle.conditions.percentage) {
          return false;
        }
      }
    }

    return true;
  }

  private hashContext(toggleId: string, context: any): number {
    const str = `${toggleId}:${JSON.stringify(context)}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  getAllToggles(): FeatureToggle[] {
    return Array.from(this.toggles.values());
  }

  getToggle(toggleId: string): FeatureToggle | undefined {
    return this.toggles.get(toggleId);
  }

  getTogglesByScope(scope: FeatureToggle['scope']): FeatureToggle[] {
    return Array.from(this.toggles.values()).filter(toggle => toggle.scope === scope);
  }

  private saveVersion(toggleId: string, toggle: FeatureToggle) {
    if (!this.versions.has(toggleId)) {
      this.versions.set(toggleId, []);
    }
    const versions = this.versions.get(toggleId)!;
    versions.push({ ...toggle });
    
    // Keep only last 10 versions
    if (versions.length > 10) {
      versions.splice(0, versions.length - 10);
    }
  }

  getToggleVersions(toggleId: string): FeatureToggle[] {
    return this.versions.get(toggleId) || [];
  }

  revertToVersion(toggleId: string, version: number, userId: string, userEmail: string): FeatureToggle {
    const versions = this.versions.get(toggleId);
    if (!versions) {
      throw new Error(`No versions found for toggle ${toggleId}`);
    }

    const targetVersion = versions.find(v => v.metadata.version === version);
    if (!targetVersion) {
      throw new Error(`Version ${version} not found for toggle ${toggleId}`);
    }

    const currentToggle = this.toggles.get(toggleId);
    const revertedToggle: FeatureToggle = {
      ...targetVersion,
      metadata: {
        ...targetVersion.metadata,
        updatedBy: userId,
        updatedAt: new Date(),
        version: currentToggle ? currentToggle.metadata.version + 1 : 1
      }
    };

    this.toggles.set(toggleId, revertedToggle);
    this.saveVersion(toggleId, revertedToggle);

    this.logAudit({
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      toggleId,
      action: 'update',
      previousValue: currentToggle,
      newValue: revertedToggle,
      userId,
      userEmail,
      timestamp: new Date(),
      reason: `Reverted to version ${version}`
    });

    this.emit('toggleReverted', revertedToggle);
    return revertedToggle;
  }

  private async logAudit(log: FeatureToggleAuditLog): Promise<void> {
    this.auditLogs.push(log);
    
    // Keep only last 1000 audit logs in memory
    if (this.auditLogs.length > 1000) {
      this.auditLogs.splice(0, this.auditLogs.length - 1000);
    }

  }

  getAuditLogs(toggleId?: string, limit: number = 100): FeatureToggleAuditLog[] {
    let logs = this.auditLogs;
    
    if (toggleId) {
      logs = logs.filter(log => log.toggleId === toggleId);
    }
    
    return logs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Bulk operations for performance
  async bulkToggle(toggleIds: string[], enabled: boolean, userId: string, userEmail: string, reason?: string): Promise<FeatureToggle[]> {
    const results: FeatureToggle[] = [];
    
    for (const toggleId of toggleIds) {
      try {
        const result = await this.toggleFeature(toggleId, enabled, userId, userEmail, reason);
        results.push(result);
      } catch (error) {
        console.error(`Failed to toggle ${toggleId}:`, error);
      }
    }
    
    return results;
  }

  // Health check for monitoring
  getHealthStatus() {
    return {
      totalToggles: this.toggles.size,
      enabledToggles: Array.from(this.toggles.values()).filter(t => t.enabled).length,
      auditLogCount: this.auditLogs.length,
      lastAuditLog: this.auditLogs[this.auditLogs.length - 1]?.timestamp,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };
  }
}

export const featureToggleService = FeatureToggleService.getInstance();