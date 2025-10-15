import type { Request, Response } from 'express';

export interface SecuritySubdomainConfig {
  id: string;
  subdomain: string;
  customDomain?: string;
  organizationName: string;
  organizationId: string;
  tenantId: string;
  isActive: boolean;
  settings: {
    brandingColor: string;
    logoUrl?: string;
    allowedDomains: string[];
    securityLevel: 'basic' | 'standard' | 'premium' | 'enterprise';
    features: {
      behavioralAnalytics: boolean;
      threatIntelligence: boolean;
      complianceReporting: boolean;
      realTimeMonitoring: boolean;
      incidentResponse: boolean;
      userTraining: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export class SubdomainSecurityService {
  private static instance: SubdomainSecurityService;
  private subdomainConfigs: Map<string, SecuritySubdomainConfig> = new Map();

  static getInstance(): SubdomainSecurityService {
    if (!SubdomainSecurityService.instance) {
      SubdomainSecurityService.instance = new SubdomainSecurityService();
    }
    return SubdomainSecurityService.instance;
  }

  constructor() {
    this.initializeSampleConfigs();
  }

  private initializeSampleConfigs() {
    // ARGILETTE Security Platform configurations
    const sampleConfigs: SecuritySubdomainConfig[] = [
      {
        id: 'argilette-main-security',
        subdomain: 'security',
        customDomain: 'security.argilette.org',
        organizationName: 'ARGILETTE Security Platform',
        organizationId: 'argilette-security-main',
        tenantId: 'platform-tenant',
        isActive: true,
        settings: {
          brandingColor: '#3b82f6',
          logoUrl: '/assets/logo-transparent-png_1751051509554.png',
          allowedDomains: ['argilette.org', '*.argilette.org', 'argilette.com', '*.argilette.com'],
          securityLevel: 'enterprise',
          features: {
            behavioralAnalytics: true,
            threatIntelligence: true,
            complianceReporting: true,
            realTimeMonitoring: true,
            incidentResponse: true,
            userTraining: true
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'argilette-monitoring',
        subdomain: 'monitoring',
        customDomain: 'monitoring.argilette.org',
        organizationName: 'ARGILETTE Monitoring Center',
        organizationId: 'argilette-monitoring',
        tenantId: 'platform-tenant',
        isActive: true,
        settings: {
          brandingColor: '#059669',
          logoUrl: '/assets/logo-transparent-png_1751051509554.png',
          allowedDomains: ['argilette.org', '*.argilette.org'],
          securityLevel: 'enterprise',
          features: {
            behavioralAnalytics: true,
            threatIntelligence: true,
            complianceReporting: true,
            realTimeMonitoring: true,
            incidentResponse: true,
            userTraining: false
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'client-demo',
        subdomain: 'demo-client-security',
        customDomain: 'security.democlient.com',
        organizationName: 'Demo Client Security Dashboard',
        organizationId: 'demo-client-org',
        tenantId: 'tenant-demo-client',
        isActive: true,
        settings: {
          brandingColor: '#7c3aed',
          allowedDomains: ['democlient.com', '*.democlient.com'],
          securityLevel: 'premium',
          features: {
            behavioralAnalytics: true,
            threatIntelligence: true,
            complianceReporting: true,
            realTimeMonitoring: true,
            incidentResponse: false,
            userTraining: true
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    sampleConfigs.forEach(config => {
      this.subdomainConfigs.set(config.subdomain, config);
      if (config.customDomain) {
        this.subdomainConfigs.set(config.customDomain, config);
      }
    });
  }

  // Extract subdomain from request
  extractSubdomain(req: Request): string | null {
    const host = req.get('host') || req.get('x-forwarded-host') || '';
    
    // Handle custom domains
    if (this.subdomainConfigs.has(host)) {
      return host;
    }

    // Handle subdomains
    const parts = host.split('.');
    if (parts.length >= 3) {
      const subdomain = parts[0];
      if (subdomain !== 'www' && subdomain !== 'api') {
        return subdomain;
      }
    }

    return null;
  }

  // Get security configuration for subdomain
  getSecurityConfig(subdomain: string): SecuritySubdomainConfig | null {
    return this.subdomainConfigs.get(subdomain) || null;
  }

  // Create new security subdomain
  async createSecuritySubdomain(config: Omit<SecuritySubdomainConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<SecuritySubdomainConfig> {
    const newConfig: SecuritySubdomainConfig = {
      ...config,
      id: `security-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.subdomainConfigs.set(config.subdomain, newConfig);
    if (config.customDomain) {
      this.subdomainConfigs.set(config.customDomain, newConfig);
    }

    return newConfig;
  }

  // Update security subdomain configuration
  async updateSecuritySubdomain(subdomain: string, updates: Partial<SecuritySubdomainConfig>): Promise<SecuritySubdomainConfig | null> {
    const config = this.subdomainConfigs.get(subdomain);
    if (!config) return null;

    const updatedConfig = {
      ...config,
      ...updates,
      updatedAt: new Date()
    };

    this.subdomainConfigs.set(subdomain, updatedConfig);
    return updatedConfig;
  }

  // Delete security subdomain
  async deleteSecuritySubdomain(subdomain: string): Promise<boolean> {
    const config = this.subdomainConfigs.get(subdomain);
    if (!config) return false;

    this.subdomainConfigs.delete(subdomain);
    if (config.customDomain) {
      this.subdomainConfigs.delete(config.customDomain);
    }

    return true;
  }

  // List all security subdomains
  getAllSecuritySubdomains(): SecuritySubdomainConfig[] {
    const configs = Array.from(this.subdomainConfigs.values());
    // Remove duplicates (custom domains point to same config)
    return configs.filter((config, index, self) => 
      self.findIndex(c => c.id === config.id) === index
    );
  }

  // Check if subdomain is available
  isSubdomainAvailable(subdomain: string): boolean {
    return !this.subdomainConfigs.has(subdomain);
  }

  // Generate security dashboard data for specific subdomain
  async getSecurityDashboardData(subdomain: string): Promise<any> {
    const config = this.getSecurityConfig(subdomain);
    if (!config) return null;

    // Generate realistic security metrics based on organization
    return {
      organizationName: config.organizationName,
      overview: {
        totalUsers: Math.floor(Math.random() * 500) + 50,
        activeSessions: Math.floor(Math.random() * 100) + 10,
        securityAlerts: Math.floor(Math.random() * 20) + 1,
        riskScore: Math.floor(Math.random() * 30) + 15, // 15-45 range
        complianceScore: Math.floor(Math.random() * 20) + 80, // 80-100 range
        incidentsResolved: Math.floor(Math.random() * 50) + 20
      },
      recentAlerts: [
        {
          id: 1,
          type: 'behavioral_anomaly',
          severity: 'medium',
          user: `user@${config.organizationName.toLowerCase().replace(/\s+/g, '')}.com`,
          description: 'Unusual login pattern detected',
          timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString()
        },
        {
          id: 2,
          type: 'failed_authentication',
          severity: 'low',
          user: `guest@${config.organizationName.toLowerCase().replace(/\s+/g, '')}.com`,
          description: 'Multiple failed login attempts',
          timestamp: new Date(Date.now() - Math.random() * 7200000).toISOString()
        }
      ],
      userActivity: Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        user: `user${i + 1}@${config.organizationName.toLowerCase().replace(/\s+/g, '')}.com`,
        action: ['login', 'logout', 'file_access', 'settings_change'][Math.floor(Math.random() * 4)],
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        riskScore: Math.floor(Math.random() * 100),
        location: ['Office', 'Remote', 'Mobile'][Math.floor(Math.random() * 3)]
      })),
      features: config.settings.features,
      securityLevel: config.settings.securityLevel
    };
  }

  // Get security middleware for subdomain-specific access
  getSecurityMiddleware() {
    return (req: any, res: Response, next: any) => {
      // Simplified middleware to avoid CORS conflicts
      next();
    };
  }

  // Validate access to security subdomain
  validateSecurityAccess(req: any, userEmail: string): boolean {
    const config = req.securityConfig;
    if (!config) return false;

    // Check if user's domain is allowed
    const userDomain = userEmail.split('@')[1];
    return config.settings.allowedDomains.some(domain => {
      if (domain.startsWith('*.')) {
        const baseDomain = domain.substring(2);
        return userDomain.endsWith(baseDomain);
      }
      return userDomain === domain;
    });
  }
}

export const subdomainSecurityService = SubdomainSecurityService.getInstance();