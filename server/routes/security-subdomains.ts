import type { Express, Request, Response } from 'express';
import { subdomainSecurityService, type SecuritySubdomainConfig } from '../services/subdomain-security.js';
import { authenticate } from '../middleware/auth.js';

export function registerSecuritySubdomainRoutes(app: Express) {
  // Apply security middleware globally for subdomain detection
  app.use(subdomainSecurityService.getSecurityMiddleware());

  // Get all security subdomains (platform owner only)
  app.get('/api/security/subdomains', authenticate, async (req: any, res: Response) => {
    try {
      // Only platform owners can list all subdomains
      if (!req.user?.isPlatformOwner) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const subdomains = subdomainSecurityService.getAllSecuritySubdomains();
      res.json({ success: true, subdomains });
    } catch (error) {
      console.error('Error fetching security subdomains:', error);
      res.status(500).json({ error: 'Failed to fetch security subdomains' });
    }
  });

  // Get specific security subdomain configuration
  app.get('/api/security/subdomains/:subdomain', authenticate, async (req: any, res: Response) => {
    try {
      const { subdomain } = req.params;
      const config = subdomainSecurityService.getSecurityConfig(subdomain);
      
      if (!config) {
        return res.status(404).json({ error: 'Security subdomain not found' });
      }

      // Check access permissions
      if (!req.user?.isPlatformOwner && config.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      res.json({ success: true, config });
    } catch (error) {
      console.error('Error fetching security subdomain:', error);
      res.status(500).json({ error: 'Failed to fetch security subdomain' });
    }
  });

  // Create new security subdomain
  app.post('/api/security/subdomains', authenticate, async (req: any, res: Response) => {
    try {
      const {
        subdomain,
        customDomain,
        organizationName,
        organizationId,
        tenantId,
        settings
      } = req.body;

      // Validate required fields
      if (!subdomain || !organizationName || !organizationId) {
        return res.status(400).json({ 
          error: 'Missing required fields: subdomain, organizationName, organizationId' 
        });
      }

      // Check if subdomain is available
      if (!subdomainSecurityService.isSubdomainAvailable(subdomain)) {
        return res.status(409).json({ error: 'Subdomain already exists' });
      }

      // Only platform owners can create subdomains for any tenant
      const targetTenantId = req.user?.isPlatformOwner ? (tenantId || req.user.tenantId) : req.user.tenantId;

      const newConfig = await subdomainSecurityService.createSecuritySubdomain({
        subdomain,
        customDomain,
        organizationName,
        organizationId,
        tenantId: targetTenantId,
        isActive: true,
        settings: {
          brandingColor: settings?.brandingColor || '#3b82f6',
          logoUrl: settings?.logoUrl,
          allowedDomains: settings?.allowedDomains || [],
          securityLevel: settings?.securityLevel || 'standard',
          features: {
            behavioralAnalytics: settings?.features?.behavioralAnalytics ?? true,
            threatIntelligence: settings?.features?.threatIntelligence ?? true,
            complianceReporting: settings?.features?.complianceReporting ?? false,
            realTimeMonitoring: settings?.features?.realTimeMonitoring ?? true,
            incidentResponse: settings?.features?.incidentResponse ?? false,
            userTraining: settings?.features?.userTraining ?? false,
            ...settings?.features
          }
        }
      });

      res.json({ success: true, config: newConfig });
    } catch (error) {
      console.error('Error creating security subdomain:', error);
      res.status(500).json({ error: 'Failed to create security subdomain' });
    }
  });

  // Update security subdomain
  app.patch('/api/security/subdomains/:subdomain', authenticate, async (req: any, res: Response) => {
    try {
      const { subdomain } = req.params;
      const updates = req.body;

      const config = subdomainSecurityService.getSecurityConfig(subdomain);
      if (!config) {
        return res.status(404).json({ error: 'Security subdomain not found' });
      }

      // Check access permissions
      if (!req.user?.isPlatformOwner && config.tenantId !== req.user?.tenantId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const updatedConfig = await subdomainSecurityService.updateSecuritySubdomain(subdomain, updates);
      res.json({ success: true, config: updatedConfig });
    } catch (error) {
      console.error('Error updating security subdomain:', error);
      res.status(500).json({ error: 'Failed to update security subdomain' });
    }
  });

  // Delete security subdomain
  app.delete('/api/security/subdomains/:subdomain', authenticate, async (req: any, res: Response) => {
    try {
      const { subdomain } = req.params;

      const config = subdomainSecurityService.getSecurityConfig(subdomain);
      if (!config) {
        return res.status(404).json({ error: 'Security subdomain not found' });
      }

      // Only platform owners can delete subdomains
      if (!req.user?.isPlatformOwner) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const deleted = await subdomainSecurityService.deleteSecuritySubdomain(subdomain);
      res.json({ success: true, deleted });
    } catch (error) {
      console.error('Error deleting security subdomain:', error);
      res.status(500).json({ error: 'Failed to delete security subdomain' });
    }
  });

  // Get security dashboard data for current subdomain
  app.get('/api/security/dashboard', authenticate, async (req: any, res: Response) => {
    try {
      const subdomain = subdomainSecurityService.extractSubdomain(req);
      
      if (!subdomain) {
        return res.status(400).json({ error: 'No security subdomain detected' });
      }

      const config = subdomainSecurityService.getSecurityConfig(subdomain);
      if (!config || !config.isActive) {
        return res.status(404).json({ error: 'Security configuration not found or inactive' });
      }

      // Validate user access
      const userEmail = req.headers['x-auth-email'] as string || req.user?.email;
      if (!subdomainSecurityService.validateSecurityAccess(req, userEmail)) {
        return res.status(403).json({ error: 'Access denied for this security domain' });
      }

      const dashboardData = await subdomainSecurityService.getSecurityDashboardData(subdomain);
      res.json({ success: true, data: dashboardData });
    } catch (error) {
      console.error('Error fetching security dashboard:', error);
      res.status(500).json({ error: 'Failed to fetch security dashboard data' });
    }
  });

  // Check subdomain availability
  app.get('/api/security/subdomains/check/:subdomain', authenticate, async (req: any, res: Response) => {
    try {
      const { subdomain } = req.params;
      const available = subdomainSecurityService.isSubdomainAvailable(subdomain);
      
      res.json({ 
        success: true, 
        subdomain, 
        available,
        suggestion: available ? null : `${subdomain}-${Math.floor(Math.random() * 1000)}`
      });
    } catch (error) {
      console.error('Error checking subdomain availability:', error);
      res.status(500).json({ error: 'Failed to check subdomain availability' });
    }
  });

  // Generate subdomain configuration preview
  app.post('/api/security/subdomains/preview', authenticate, async (req: any, res: Response) => {
    try {
      const { organizationName, subdomain } = req.body;
      
      if (!organizationName || !subdomain) {
        return res.status(400).json({ error: 'Organization name and subdomain required' });
      }

      const preview = {
        securityUrl: `https://${subdomain}.argilette-security.com`,
        organizationName,
        estimatedSetupTime: '5-10 minutes',
        features: [
          'Real-time Security Monitoring',
          'Behavioral Analytics',
          'Threat Intelligence',
          'Compliance Reporting',
          'Custom Branding',
          'User Training Modules'
        ],
        securityLevels: {
          basic: 'Essential security monitoring',
          standard: 'Advanced analytics and alerts',
          premium: 'Full threat intelligence and compliance',
          enterprise: 'Complete security suite with custom features'
        }
      };

      res.json({ success: true, preview });
    } catch (error) {
      console.error('Error generating subdomain preview:', error);
      res.status(500).json({ error: 'Failed to generate preview' });
    }
  });

  // Security subdomain health check
  app.get('/api/security/health/:subdomain?', async (req: Request, res: Response) => {
    try {
      const subdomain = req.params.subdomain || subdomainSecurityService.extractSubdomain(req);
      
      if (!subdomain) {
        return res.json({
          success: true,
          status: 'no_subdomain',
          message: 'No security subdomain detected',
          timestamp: new Date().toISOString()
        });
      }

      const config = subdomainSecurityService.getSecurityConfig(subdomain);
      
      res.json({
        success: true,
        status: config ? (config.isActive ? 'active' : 'inactive') : 'not_found',
        subdomain,
        organizationName: config?.organizationName,
        securityLevel: config?.settings.securityLevel,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error checking security health:', error);
      res.status(500).json({ error: 'Failed to check security health' });
    }
  });
}