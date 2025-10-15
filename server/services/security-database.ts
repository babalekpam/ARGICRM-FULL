import { db } from '../db';
import { securityToggles, securityRules, auditLogs } from '@shared/schema';
import type { SecurityToggle, InsertSecurityToggle, SecurityRule, InsertSecurityRule, InsertAuditLog } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';

export class SecurityDatabaseService {
  // Security Toggles
  async getToggles(tenantId: string = 'default-tenant'): Promise<SecurityToggle[]> {
    return await db
      .select()
      .from(securityToggles)
      .where(eq(securityToggles.tenantId, tenantId))
      .orderBy(securityToggles.category, securityToggles.name);
  }

  async createToggle(toggle: InsertSecurityToggle): Promise<SecurityToggle> {
    const [newToggle] = await db
      .insert(securityToggles)
      .values({
        ...toggle,
        tenantId: toggle.tenantId || 'default-tenant',
      })
      .returning();
    
    await this.logAction('create', 'security_toggle', newToggle.id.toString(), {
      name: toggle.name,
      category: toggle.category,
      feature: toggle.feature,
    }, toggle.lastModifiedBy);
    
    return newToggle;
  }

  async updateToggle(id: number, updates: Partial<InsertSecurityToggle>): Promise<SecurityToggle | null> {
    const [updatedToggle] = await db
      .update(securityToggles)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(securityToggles.id, id))
      .returning();
    
    if (updatedToggle) {
      await this.logAction('update', 'security_toggle', id.toString(), {
        changes: updates,
      }, updates.lastModifiedBy || 'system');
    }
    
    return updatedToggle || null;
  }

  async deleteToggle(id: number, deletedBy: string): Promise<boolean> {
    const result = await db
      .delete(securityToggles)
      .where(eq(securityToggles.id, id))
      .returning();
    
    if (result.length > 0) {
      await this.logAction('delete', 'security_toggle', id.toString(), {
        name: result[0].name,
      }, deletedBy);
      return true;
    }
    
    return false;
  }

  // Security Rules
  async getRules(tenantId: string = 'default-tenant'): Promise<SecurityRule[]> {
    return await db
      .select()
      .from(securityRules)
      .where(eq(securityRules.tenantId, tenantId))
      .orderBy(desc(securityRules.priority), securityRules.name);
  }

  async createRule(rule: InsertSecurityRule): Promise<SecurityRule> {
    const [newRule] = await db
      .insert(securityRules)
      .values({
        ...rule,
        tenantId: rule.tenantId || 'default-tenant',
      })
      .returning();
    
    await this.logAction('create', 'security_rule', newRule.id.toString(), {
      name: rule.name,
      ruleType: rule.ruleType,
      priority: rule.priority,
    }, rule.createdBy);
    
    return newRule;
  }

  async updateRule(id: number, updates: Partial<InsertSecurityRule>): Promise<SecurityRule | null> {
    const [updatedRule] = await db
      .update(securityRules)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(securityRules.id, id))
      .returning();
    
    if (updatedRule) {
      await this.logAction('update', 'security_rule', id.toString(), {
        changes: updates,
      }, updates.createdBy || 'system');
    }
    
    return updatedRule || null;
  }

  async deleteRule(id: number, deletedBy: string): Promise<boolean> {
    const result = await db
      .delete(securityRules)
      .where(eq(securityRules.id, id))
      .returning();
    
    if (result.length > 0) {
      await this.logAction('delete', 'security_rule', id.toString(), {
        name: result[0].name,
      }, deletedBy);
      return true;
    }
    
    return false;
  }

  // Audit Logs
  async getAuditLogs(tenantId: string = 'default-tenant', limit: number = 100) {
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.tenantId, tenantId))
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit);
  }

  private async logAction(
    action: string,
    resource: string,
    resourceId: string,
    details: any,
    userId: string
  ): Promise<void> {
    try {
      await db.insert(auditLogs).values({
        tenantId: 'default-tenant',
        userId,
        action: action.toUpperCase(),
        resource,
        resourceId,
        details: {
          ...details,
          timestamp: new Date().toISOString(),
        },
        severity: 'info',
        outcome: 'success',
      });
    } catch (error) {
      console.error('Failed to log audit action:', error);
    }
  }

  // Initialize default security toggles
  async initializeDefaults(): Promise<void> {
    const existingToggles = await this.getToggles();
    
    if (existingToggles.length === 0) {
      const defaultToggles: InsertSecurityToggle[] = [
        {
          tenantId: 'default-tenant',
          name: 'Multi-Factor Authentication',
          description: 'Require users to provide additional authentication factors',
          category: 'authentication',
          feature: 'mfa',
          enabled: false,
          configuration: { methods: ['totp', 'sms'], gracePeriod: 7 },
          lastModifiedBy: 'system',
        },
        {
          tenantId: 'default-tenant',
          name: 'Session Timeout',
          description: 'Automatically log out inactive users',
          category: 'authentication',
          feature: 'session_timeout',
          enabled: true,
          configuration: { timeoutMinutes: 60, warningMinutes: 5 },
          lastModifiedBy: 'system',
        },
        {
          tenantId: 'default-tenant',
          name: 'Password Policy',
          description: 'Enforce strong password requirements',
          category: 'authentication',
          feature: 'password_policy',
          enabled: true,
          configuration: { minLength: 8, requireSpecialChars: true, requireNumbers: true },
          lastModifiedBy: 'system',
        },
        {
          tenantId: 'default-tenant',
          name: 'IP Whitelist',
          description: 'Restrict access to approved IP addresses',
          category: 'authorization',
          feature: 'ip_whitelist',
          enabled: false,
          configuration: { allowedIPs: [], strictMode: false },
          lastModifiedBy: 'system',
        },
        {
          tenantId: 'default-tenant',
          name: 'Audit Logging',
          description: 'Track all user actions and system events',
          category: 'audit',
          feature: 'audit_logging',
          enabled: true,
          configuration: { retentionDays: 365, logLevel: 'info' },
          lastModifiedBy: 'system',
        },
        {
          tenantId: 'default-tenant',
          name: 'Rate Limiting',
          description: 'Prevent API abuse with request rate limits',
          category: 'compliance',
          feature: 'rate_limiting',
          enabled: true,
          configuration: { requestsPerMinute: 100, burstAllowance: 10 },
          lastModifiedBy: 'system',
        },
        {
          tenantId: 'default-tenant',
          name: 'Data Encryption',
          description: 'Encrypt sensitive data at rest and in transit',
          category: 'compliance',
          feature: 'data_encryption',
          enabled: true,
          configuration: { algorithm: 'AES-256', keyRotationDays: 90 },
          lastModifiedBy: 'system',
        },
      ];

      for (const toggle of defaultToggles) {
        await this.createToggle(toggle);
      }
    }

    const existingRules = await this.getRules();
    
    if (existingRules.length === 0) {
      const defaultRules: InsertSecurityRule[] = [
        {
          tenantId: 'default-tenant',
          name: 'Admin Access Only',
          description: 'Restrict sensitive operations to admin users',
          ruleType: 'access_control',
          conditions: {
            userRoles: ['admin', 'super_admin'],
            resources: ['users', 'settings', 'security'],
          },
          actions: {
            allow: true,
            requireConfirmation: true,
            logAccess: true,
          },
          priority: 100,
          enabled: true,
          createdBy: 'system',
        },
        {
          tenantId: 'default-tenant',
          name: 'Failed Login Lockout',
          description: 'Lock accounts after multiple failed login attempts',
          ruleType: 'rate_limit',
          conditions: {
            action: 'login',
            failures: 5,
            timeWindowMinutes: 15,
          },
          actions: {
            lockAccount: true,
            lockDurationMinutes: 30,
            notifyAdmin: true,
          },
          priority: 90,
          enabled: true,
          createdBy: 'system',
        },
        {
          tenantId: 'default-tenant',
          name: 'Suspicious IP Detection',
          description: 'Flag unusual IP addresses for manual review',
          ruleType: 'ip_whitelist',
          conditions: {
            newLocation: true,
            vpnDetection: true,
            riskScore: 70,
          },
          actions: {
            requireAdditionalAuth: true,
            flagForReview: true,
            notifyUser: true,
          },
          priority: 80,
          enabled: false,
          createdBy: 'system',
        },
      ];

      for (const rule of defaultRules) {
        await this.createRule(rule);
      }
    }
  }
}

export const securityDb = new SecurityDatabaseService();