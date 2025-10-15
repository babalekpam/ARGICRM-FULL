import { db } from '../db';
import { redisCache } from './redis-cache';

export interface AuditEvent {
  id?: string;
  tenantId: string;
  userId: string;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  previousValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'authentication' | 'authorization' | 'data_access' | 'configuration' | 'security';
  reason?: string;
  metadata?: any;
}

export interface SecurityAuditLog {
  id: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  previousValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  severity: string;
  category: string;
  reason?: string;
  metadata?: any;
}

export class AuditLogger {
  private static instance: AuditLogger;
  private logBuffer: AuditEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly bufferSize = 100;
  private readonly flushIntervalMs = 30000; // 30 seconds

  private constructor() {
    this.startBufferFlush();
  }

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  private startBufferFlush() {
    this.flushInterval = setInterval(() => {
      this.flushBuffer();
    }, this.flushIntervalMs);
  }

  private async flushBuffer() {
    if (this.logBuffer.length === 0) return;

    try {
      const events = [...this.logBuffer];
      this.logBuffer = [];

      // Store in database
      await this.batchInsertLogs(events);

      // Store in Redis for quick access
      await this.cacheRecentLogs(events);
    } catch (error) {
      console.error('Failed to flush audit log buffer:', error);
      // Re-add events to buffer for retry
      this.logBuffer = [...this.logBuffer, ...this.logBuffer];
    }
  }

  private async batchInsertLogs(events: AuditEvent[]) {
    const logEntries = events.map(event => ({
      id: this.generateId(),
      tenantId: event.tenantId,
      userId: event.userId,
      userEmail: event.userEmail || '',
      action: event.action,
      resource: event.resource,
      resourceId: event.resourceId,
      previousValue: event.previousValue ? JSON.stringify(event.previousValue) : null,
      newValue: event.newValue ? JSON.stringify(event.newValue) : null,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      timestamp: event.timestamp.toISOString(),
      severity: event.severity,
      category: event.category,
      reason: event.reason,
      metadata: event.metadata ? JSON.stringify(event.metadata) : null
    }));

    // Store in a simple audit_logs table (we'll create this schema)
    for (const entry of logEntries) {
      try {
        await db.execute(`
          INSERT INTO audit_logs (
            id, tenant_id, user_id, user_email, action, resource, 
            resource_id, previous_value, new_value, ip_address, 
            user_agent, timestamp, severity, category, reason, metadata
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          entry.id, entry.tenantId, entry.userId, entry.userEmail,
          entry.action, entry.resource, entry.resourceId,
          entry.previousValue, entry.newValue, entry.ipAddress,
          entry.userAgent, entry.timestamp, entry.severity,
          entry.category, entry.reason, entry.metadata
        ]);
      } catch (error) {
        console.warn('Failed to insert audit log entry:', error);
      }
    }
  }

  private async cacheRecentLogs(events: AuditEvent[]) {
    for (const event of events) {
      const key = `audit:recent:${event.tenantId}`;
      const value = JSON.stringify({
        id: this.generateId(),
        action: event.action,
        resource: event.resource,
        timestamp: event.timestamp.toISOString(),
        severity: event.severity,
        userId: event.userId
      });
      
      // Add to Redis sorted set with timestamp as score
      await redisCache.zadd(key, event.timestamp.getTime(), value);
    }
  }

  async log(event: AuditEvent): Promise<void> {
    // Add to buffer
    this.logBuffer.push({
      ...event,
      timestamp: event.timestamp || new Date()
    });

    // Flush if buffer is full
    if (this.logBuffer.length >= this.bufferSize) {
      await this.flushBuffer();
    }
  }

  async logFeatureToggleChange(
    feature: string,
    previousConfig: any,
    newConfig: any,
    userId: string,
    tenantId: string = 'default-tenant'
  ): Promise<void> {
    await this.log({
      tenantId,
      userId,
      action: 'feature_toggle_updated',
      resource: 'feature_toggle',
      resourceId: feature,
      previousValue: previousConfig,
      newValue: newConfig,
      timestamp: new Date(),
      severity: 'medium',
      category: 'configuration',
      reason: 'Feature toggle configuration changed'
    });
  }

  async logFeatureToggleCreation(
    feature: string,
    config: any,
    userId: string,
    tenantId: string = 'default-tenant'
  ): Promise<void> {
    await this.log({
      tenantId,
      userId,
      action: 'feature_toggle_created',
      resource: 'feature_toggle',
      resourceId: feature,
      newValue: config,
      timestamp: new Date(),
      severity: 'medium',
      category: 'configuration',
      reason: 'New feature toggle created'
    });
  }

  async logAccessControlRuleChange(
    ruleId: string,
    previousRule: any,
    newRule: any,
    userId: string,
    tenantId: string = 'default-tenant'
  ): Promise<void> {
    await this.log({
      tenantId,
      userId,
      action: 'access_rule_updated',
      resource: 'access_control_rule',
      resourceId: ruleId,
      previousValue: previousRule,
      newValue: newRule,
      timestamp: new Date(),
      severity: 'high',
      category: 'authorization',
      reason: 'Access control rule modified'
    });
  }

  async logSecurityEvent(
    action: string,
    resource: string,
    userId: string,
    details: any,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    tenantId: string = 'default-tenant'
  ): Promise<void> {
    await this.log({
      tenantId,
      userId,
      action,
      resource,
      newValue: details,
      timestamp: new Date(),
      severity,
      category: 'security',
      reason: `Security event: ${action}`
    });
  }

  async getAuditLogs(
    tenantId: string,
    filters: {
      userId?: string;
      action?: string;
      resource?: string;
      severity?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {}
  ): Promise<SecurityAuditLog[]> {
    try {
      // First try to get from cache for recent logs
      const cacheKey = `audit:recent:${tenantId}`;
      const recentLogs = await redisCache.zrange(cacheKey, -50, -1); // Last 50 logs
      
      if (recentLogs.length > 0 && !filters.startDate && !filters.endDate) {
        const parsed = recentLogs.map(log => JSON.parse(log));
        return parsed.slice(0, filters.limit || 50);
      }

      // Fallback to database query
      let query = `
        SELECT * FROM audit_logs 
        WHERE tenant_id = ?
      `;
      const params: any[] = [tenantId];

      if (filters.userId) {
        query += ' AND user_id = ?';
        params.push(filters.userId);
      }

      if (filters.action) {
        query += ' AND action = ?';
        params.push(filters.action);
      }

      if (filters.resource) {
        query += ' AND resource = ?';
        params.push(filters.resource);
      }

      if (filters.severity) {
        query += ' AND severity = ?';
        params.push(filters.severity);
      }

      if (filters.startDate) {
        query += ' AND timestamp >= ?';
        params.push(filters.startDate.toISOString());
      }

      if (filters.endDate) {
        query += ' AND timestamp <= ?';
        params.push(filters.endDate.toISOString());
      }

      query += ' ORDER BY timestamp DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      const result = await db.execute(query, params);
      return result.rows.map(row => ({
        id: row.id,
        tenantId: row.tenant_id,
        userId: row.user_id,
        userEmail: row.user_email,
        action: row.action,
        resource: row.resource,
        resourceId: row.resource_id,
        previousValue: row.previous_value ? JSON.parse(row.previous_value) : null,
        newValue: row.new_value ? JSON.parse(row.new_value) : null,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        timestamp: row.timestamp,
        severity: row.severity,
        category: row.category,
        reason: row.reason,
        metadata: row.metadata ? JSON.parse(row.metadata) : null
      }));
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
  }

  async getFeatureToggleHistory(feature: string, tenantId: string = 'default-tenant'): Promise<SecurityAuditLog[]> {
    return this.getAuditLogs(tenantId, {
      resource: 'feature_toggle',
      resourceId: feature,
      limit: 100
    });
  }

  async getSecurityMetrics(tenantId: string): Promise<any> {
    try {
      const logs = await this.getAuditLogs(tenantId, { limit: 1000 });
      
      const metrics = {
        totalEvents: logs.length,
        criticalEvents: logs.filter(log => log.severity === 'critical').length,
        highSeverityEvents: logs.filter(log => log.severity === 'high').length,
        recentActivity: logs.filter(log => {
          const logTime = new Date(log.timestamp);
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return logTime > oneDayAgo;
        }).length,
        topActions: this.getTopActions(logs),
        topResources: this.getTopResources(logs),
        categoryBreakdown: this.getCategoryBreakdown(logs)
      };

      return metrics;
    } catch (error) {
      console.error('Error calculating security metrics:', error);
      return {
        totalEvents: 0,
        criticalEvents: 0,
        highSeverityEvents: 0,
        recentActivity: 0,
        topActions: [],
        topResources: [],
        categoryBreakdown: {}
      };
    }
  }

  private getTopActions(logs: SecurityAuditLog[]): Array<{action: string, count: number}> {
    const actionCounts = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getTopResources(logs: SecurityAuditLog[]): Array<{resource: string, count: number}> {
    const resourceCounts = logs.reduce((acc, log) => {
      acc[log.resource] = (acc[log.resource] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(resourceCounts)
      .map(([resource, count]) => ({ resource, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getCategoryBreakdown(logs: SecurityAuditLog[]): Record<string, number> {
    return logs.reduce((acc, log) => {
      acc[log.category] = (acc[log.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async cleanup(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    await this.flushBuffer();
  }
}

export const auditLogger = AuditLogger.getInstance();