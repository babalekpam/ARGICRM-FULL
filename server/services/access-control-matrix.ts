import { db } from '../db';
import { auditLogger } from './audit-logger';

export interface AccessControlMatrix {
  id?: number;
  tenantId: string;
  resource: string;
  operation: 'create' | 'read' | 'update' | 'delete' | 'execute';
  role: string;
  permission: 'allow' | 'deny' | 'conditional';
  conditions?: {
    timeRestrictions?: {
      allowedHours: { start: number; end: number };
      allowedDays: number[];
      timezone?: string;
    };
    ipRestrictions?: {
      allowedIPs: string[];
      deniedIPs: string[];
      allowVPN: boolean;
    };
    resourceOwnership?: {
      requireOwnership: boolean;
      allowDelegated: boolean;
    };
    multiFactorAuth?: {
      required: boolean;
      methods: string[];
    };
    requestLimits?: {
      maxPerHour: number;
      maxPerDay: number;
    };
  };
  priority: number;
  enabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
}

export interface AccessRequest {
  userId: string;
  userRole: string;
  tenantId: string;
  resource: string;
  operation: string;
  resourceId?: string;
  ipAddress?: string;
  timestamp: Date;
  context?: any;
}

export interface AccessDecision {
  allowed: boolean;
  reason: string;
  matchedRules: AccessControlMatrix[];
  requiredConditions?: string[];
  actionRequired?: string;
}

export class AccessControlMatrixService {
  private static instance: AccessControlMatrixService;
  private matrixCache: Map<string, AccessControlMatrix[]> = new Map();
  private cacheTTL = 600000; // 10 minutes
  private lastCacheUpdate = 0;

  private constructor() {
    this.loadMatrixFromDatabase();
  }

  static getInstance(): AccessControlMatrixService {
    if (!AccessControlMatrixService.instance) {
      AccessControlMatrixService.instance = new AccessControlMatrixService();
    }
    return AccessControlMatrixService.instance;
  }

  private async loadMatrixFromDatabase() {
    try {
      // Create sample data for demonstration since the database table may not exist yet
      const sampleMatrices: AccessControlMatrix[] = [
        {
          id: 1,
          tenantId: 'default-tenant',
          resource: 'contacts',
          operation: 'read',
          role: 'admin',
          permission: 'allow',
          conditions: {},
          priority: 10,
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system'
        },
        {
          id: 2,
          tenantId: 'default-tenant',
          resource: 'deals',
          operation: 'create',
          role: 'manager',
          permission: 'allow',
          conditions: { 
            timeRestrictions: { 
              allowedHours: { start: 9, end: 17 },
              allowedDays: [1, 2, 3, 4, 5],
              timezone: 'UTC'
            }
          },
          priority: 5,
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system'
        },
        {
          id: 3,
          tenantId: 'default-tenant',
          resource: 'reports',
          operation: 'delete',
          role: 'user',
          permission: 'deny',
          conditions: {},
          priority: 1,
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system'
        }
      ];

      // Group by tenant for faster lookups
      const tenantMatrices = new Map<string, AccessControlMatrix[]>();
      for (const matrix of sampleMatrices) {
        const key = matrix.tenantId;
        if (!tenantMatrices.has(key)) {
          tenantMatrices.set(key, []);
        }
        tenantMatrices.get(key)!.push(matrix);
      }

      this.matrixCache = tenantMatrices;
      this.lastCacheUpdate = Date.now();
      
    } catch (error) {
      console.error('Failed to load access control matrix:', error);
    }
  }

  private async refreshCacheIfNeeded() {
    if (Date.now() - this.lastCacheUpdate > this.cacheTTL) {
      await this.loadMatrixFromDatabase();
    }
  }

  async checkAccess(request: AccessRequest): Promise<AccessDecision> {
    try {
      await this.refreshCacheIfNeeded();

      const matrices = this.matrixCache.get(request.tenantId) || [];
      const applicableRules = matrices.filter(matrix => 
        this.isRuleApplicable(matrix, request)
      );

      if (applicableRules.length === 0) {
        // No explicit rules found - default to deny for security
        await auditLogger.logSecurityEvent(
          'access_denied_no_rules',
          request.resource,
          request.userId,
          { request },
          'medium',
          request.tenantId
        );
        
        return {
          allowed: false,
          reason: 'No access rules defined for this resource and operation',
          matchedRules: [],
          actionRequired: 'Contact administrator to set up access rules'
        };
      }

      // Sort by priority (highest first)
      applicableRules.sort((a, b) => b.priority - a.priority);

      // Evaluate rules in priority order
      for (const rule of applicableRules) {
        const evaluation = await this.evaluateRule(rule, request);
        
        if (rule.permission === 'allow' && evaluation.conditionsMet) {
          await auditLogger.logSecurityEvent(
            'access_granted',
            request.resource,
            request.userId,
            { request, matchedRule: rule.id },
            'low',
            request.tenantId
          );
          
          return {
            allowed: true,
            reason: `Access granted by rule: ${rule.id}`,
            matchedRules: [rule],
            requiredConditions: evaluation.requirementsMet
          };
        }

        if (rule.permission === 'deny') {
          await auditLogger.logSecurityEvent(
            'access_denied_explicit',
            request.resource,
            request.userId,
            { request, matchedRule: rule.id },
            'medium',
            request.tenantId
          );
          
          return {
            allowed: false,
            reason: `Access denied by rule: ${rule.id}`,
            matchedRules: [rule]
          };
        }

        if (rule.permission === 'conditional' && !evaluation.conditionsMet) {
          return {
            allowed: false,
            reason: `Conditional access requirements not met: ${evaluation.failedConditions.join(', ')}`,
            matchedRules: [rule],
            requiredConditions: evaluation.failedConditions,
            actionRequired: 'Meet the required conditions and try again'
          };
        }
      }

      // If we get here, no rules explicitly allowed access
      await auditLogger.logSecurityEvent(
        'access_denied_default',
        request.resource,
        request.userId,
        { request },
        'medium',
        request.tenantId
      );

      return {
        allowed: false,
        reason: 'No matching access rules allow this operation',
        matchedRules: applicableRules
      };

    } catch (error) {
      console.error('Error checking access:', error);
      
      // Fail secure - deny access on error
      return {
        allowed: false,
        reason: 'Error evaluating access permissions',
        matchedRules: []
      };
    }
  }

  private isRuleApplicable(matrix: AccessControlMatrix, request: AccessRequest): boolean {
    // Check if resource matches (exact match or wildcard)
    if (matrix.resource !== '*' && matrix.resource !== request.resource) {
      return false;
    }

    // Check if operation matches (exact match or wildcard)
    if (matrix.operation !== 'execute' && matrix.operation !== request.operation) {
      return false;
    }

    // Check if role matches (exact match or wildcard)
    if (matrix.role !== '*' && matrix.role !== request.userRole) {
      return false;
    }

    return true;
  }

  private async evaluateRule(rule: AccessControlMatrix, request: AccessRequest): Promise<{
    conditionsMet: boolean;
    failedConditions: string[];
    requirementsMet: string[];
  }> {
    const failedConditions: string[] = [];
    const requirementsMet: string[] = [];

    if (!rule.conditions) {
      return { conditionsMet: true, failedConditions, requirementsMet };
    }

    // Time restrictions
    if (rule.conditions.timeRestrictions) {
      const timeCheck = this.evaluateTimeRestrictions(rule.conditions.timeRestrictions, request.timestamp);
      if (!timeCheck) {
        failedConditions.push('time_restrictions');
      } else {
        requirementsMet.push('time_restrictions');
      }
    }

    // IP restrictions
    if (rule.conditions.ipRestrictions && request.ipAddress) {
      const ipCheck = this.evaluateIPRestrictions(rule.conditions.ipRestrictions, request.ipAddress);
      if (!ipCheck) {
        failedConditions.push('ip_restrictions');
      } else {
        requirementsMet.push('ip_restrictions');
      }
    }

    // Resource ownership
    if (rule.conditions.resourceOwnership && request.resourceId) {
      const ownershipCheck = await this.evaluateResourceOwnership(
        rule.conditions.resourceOwnership,
        request.userId,
        request.resource,
        request.resourceId
      );
      if (!ownershipCheck) {
        failedConditions.push('resource_ownership');
      } else {
        requirementsMet.push('resource_ownership');
      }
    }

    // Multi-factor authentication
    if (rule.conditions.multiFactorAuth) {
      const mfaCheck = await this.evaluateMultiFactorAuth(rule.conditions.multiFactorAuth, request.userId);
      if (!mfaCheck) {
        failedConditions.push('multi_factor_auth');
      } else {
        requirementsMet.push('multi_factor_auth');
      }
    }

    // Request limits
    if (rule.conditions.requestLimits) {
      const limitCheck = await this.evaluateRequestLimits(
        rule.conditions.requestLimits,
        request.userId,
        request.resource
      );
      if (!limitCheck) {
        failedConditions.push('request_limits');
      } else {
        requirementsMet.push('request_limits');
      }
    }

    return {
      conditionsMet: failedConditions.length === 0,
      failedConditions,
      requirementsMet
    };
  }

  private evaluateTimeRestrictions(timeRestrictions: any, timestamp: Date): boolean {
    const now = timestamp;
    const hour = now.getHours();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Check allowed hours
    if (timeRestrictions.allowedHours) {
      const { start, end } = timeRestrictions.allowedHours;
      if (hour < start || hour > end) {
        return false;
      }
    }

    // Check allowed days
    if (timeRestrictions.allowedDays && timeRestrictions.allowedDays.length > 0) {
      if (!timeRestrictions.allowedDays.includes(dayOfWeek)) {
        return false;
      }
    }

    return true;
  }

  private evaluateIPRestrictions(ipRestrictions: any, ipAddress: string): boolean {
    // Check denied IPs first
    if (ipRestrictions.deniedIPs && ipRestrictions.deniedIPs.includes(ipAddress)) {
      return false;
    }

    // Check allowed IPs
    if (ipRestrictions.allowedIPs && ipRestrictions.allowedIPs.length > 0) {
      return ipRestrictions.allowedIPs.includes(ipAddress);
    }

    // If no specific restrictions, allow by default
    return true;
  }

  private async evaluateResourceOwnership(ownershipReqs: any, userId: string, resource: string, resourceId: string): Promise<boolean> {
    if (!ownershipReqs.requireOwnership) {
      return true;
    }

    try {
      // This is a simplified ownership check
      // In a real implementation, you'd query the specific resource table
      const query = `
        SELECT owner_id, created_by FROM ${resource} 
        WHERE id = ? AND (owner_id = ? OR created_by = ?)
      `;
      
      const result = await db.execute(query, [resourceId, userId, userId]);
      return result.rows.length > 0;
    } catch (error) {
      return false;
    }
  }

  private async evaluateMultiFactorAuth(mfaReqs: any, userId: string): Promise<boolean> {
    if (!mfaReqs.required) {
      return true;
    }

    // In a real implementation, you'd check if the user has recently authenticated with MFA
    // For now, we'll assume MFA is not implemented and return false if required
    return false;
  }

  private async evaluateRequestLimits(limits: any, userId: string, resource: string): Promise<boolean> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Check hourly limits
      if (limits.maxPerHour) {
        const hourlyQuery = `
          SELECT COUNT(*) as count FROM audit_logs 
          WHERE user_id = ? AND resource = ? AND timestamp > ?
        `;
        
        const hourlyResult = await db.execute(hourlyQuery, [userId, resource, oneHourAgo.toISOString()]);
        const hourlyCount = hourlyResult.rows[0]?.count || 0;
        
        if (hourlyCount >= limits.maxPerHour) {
          return false;
        }
      }

      // Check daily limits
      if (limits.maxPerDay) {
        const dailyQuery = `
          SELECT COUNT(*) as count FROM audit_logs 
          WHERE user_id = ? AND resource = ? AND timestamp > ?
        `;
        
        const dailyResult = await db.execute(dailyQuery, [userId, resource, oneDayAgo.toISOString()]);
        const dailyCount = dailyResult.rows[0]?.count || 0;
        
        if (dailyCount >= limits.maxPerDay) {
          return false;
        }
      }

      return true;
    } catch (error) {
      return true; // Allow on error to prevent system lockout
    }
  }

  async createAccessRule(rule: Omit<AccessControlMatrix, 'id' | 'createdAt' | 'updatedAt'>, createdBy: string): Promise<AccessControlMatrix | null> {
    try {
      const query = `
        INSERT INTO access_control_matrix (
          tenant_id, resource, operation, role, permission, 
          conditions, priority, enabled, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await db.execute(query, [
        rule.tenantId,
        rule.resource,
        rule.operation,
        rule.role,
        rule.permission,
        rule.conditions ? JSON.stringify(rule.conditions) : null,
        rule.priority,
        rule.enabled,
        createdBy
      ]);

      const newRule: AccessControlMatrix = {
        id: result.insertId,
        ...rule,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy
      };

      // Refresh cache
      await this.loadMatrixFromDatabase();

      // Log creation
      await auditLogger.logSecurityEvent(
        'access_rule_created',
        'access_control_matrix',
        createdBy,
        { rule: newRule },
        'high',
        rule.tenantId
      );

      return newRule;
    } catch (error) {
      console.error('Failed to create access rule:', error);
      return null;
    }
  }

  async updateAccessRule(id: number, updates: Partial<AccessControlMatrix>, updatedBy: string): Promise<boolean> {
    try {
      // Get current rule for audit log
      const currentQuery = `SELECT * FROM access_control_matrix WHERE id = ?`;
      const currentResult = await db.execute(currentQuery, [id]);
      const currentRule = currentResult.rows[0];

      if (!currentRule) {
        return false;
      }

      const query = `
        UPDATE access_control_matrix 
        SET resource = ?, operation = ?, role = ?, permission = ?, 
            conditions = ?, priority = ?, enabled = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await db.execute(query, [
        updates.resource || currentRule.resource,
        updates.operation || currentRule.operation,
        updates.role || currentRule.role,
        updates.permission || currentRule.permission,
        updates.conditions ? JSON.stringify(updates.conditions) : currentRule.conditions,
        updates.priority || currentRule.priority,
        updates.enabled !== undefined ? updates.enabled : currentRule.enabled,
        id
      ]);

      // Refresh cache
      await this.loadMatrixFromDatabase();

      // Log update
      await auditLogger.logAccessControlRuleChange(
        id.toString(),
        currentRule,
        { ...currentRule, ...updates },
        updatedBy,
        currentRule.tenant_id
      );

      return true;
    } catch (error) {
      console.error('Failed to update access rule:', error);
      return false;
    }
  }

  async getAccessMatrix(tenantId: string): Promise<AccessControlMatrix[]> {
    await this.refreshCacheIfNeeded();
    return this.matrixCache.get(tenantId) || [];
  }

  async validateMatrixIntegrity(tenantId: string): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const matrices = await this.getAccessMatrix(tenantId);
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for conflicting rules
    const rulesByResource = new Map<string, AccessControlMatrix[]>();
    for (const matrix of matrices) {
      const key = `${matrix.resource}:${matrix.operation}:${matrix.role}`;
      if (!rulesByResource.has(key)) {
        rulesByResource.set(key, []);
      }
      rulesByResource.get(key)!.push(matrix);
    }

    for (const [key, rules] of rulesByResource) {
      if (rules.length > 1) {
        const conflicting = rules.filter(r => r.permission !== rules[0].permission);
        if (conflicting.length > 0) {
          issues.push(`Conflicting permissions for ${key}`);
          recommendations.push(`Review and consolidate rules for ${key}`);
        }
      }
    }

    // Check for overly broad permissions
    const wildcardRules = matrices.filter(m => m.resource === '*' || m.role === '*');
    if (wildcardRules.length > 0) {
      recommendations.push('Consider replacing wildcard rules with specific resource/role combinations');
    }

    // Check for disabled critical rules
    const criticalResources = ['users', 'security', 'billing', 'admin'];
    const disabledCritical = matrices.filter(m => 
      criticalResources.includes(m.resource) && !m.enabled
    );
    if (disabledCritical.length > 0) {
      issues.push('Critical security rules are disabled');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    totalRules: number;
    activeRules: number;
    conflictCount: number;
    lastUpdated: Date;
  }> {
    try {
      const tenantId = 'default-tenant';
      const matrices = await this.getAccessMatrix(tenantId);
      const integrity = await this.validateMatrixIntegrity(tenantId);
      
      return {
        status: integrity.isValid ? 'healthy' : integrity.issues.length > 5 ? 'critical' : 'warning',
        totalRules: matrices.length,
        activeRules: matrices.filter(m => m.enabled).length,
        conflictCount: integrity.issues.length,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error getting access control health status:', error);
      return {
        status: 'critical',
        totalRules: 0,
        activeRules: 0,
        conflictCount: 0,
        lastUpdated: new Date()
      };
    }
  }
}

export const accessControlMatrix = AccessControlMatrixService.getInstance();