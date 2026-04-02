import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage.js';

export interface TenantRequest extends Request {
  tenant?: {
    id: string;
    name: string;
    domain: string;
    settings: any;
  };
  user?: {
    id: string;
    tenantId: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

// Extract tenant from subdomain or header
export async function resolveTenant(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    // PLATFORM OWNER BYPASS: Check if user is platform owner
    const userEmail = (req as any).user?.email;
    const isPlatformOwner = userEmail === 'abel@argilette.com';
    
    if (isPlatformOwner) {
      // Platform owners get a special tenant with full access
      req.tenant = {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Platform Owner',
        domain: 'platform',
        settings: { unlimited: true }
      };
      return next();
    }

    let tenantIdentifier: string | undefined;

    // Method 1: Extract from subdomain (company.argilette.org)
    const host = req.get('host') || '';
    const subdomain = host.split('.')[0];
    if (subdomain && subdomain !== 'www' && subdomain !== 'argilette') {
      tenantIdentifier = subdomain;
    }

    // Method 2: Extract from custom header (for development)
    if (!tenantIdentifier) {
      tenantIdentifier = req.get('x-tenant-id') || req.get('x-tenant-domain');
    }

    // Method 3: Extract from query parameter (fallback)
    if (!tenantIdentifier) {
      tenantIdentifier = req.query.tenant as string;
    }

    if (!tenantIdentifier) {
      // For development, use default tenant
      tenantIdentifier = 'default';
    }

    // Find tenant in database
    const tenant = await storage.getTenantByDomain(tenantIdentifier);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    if (!tenant.isActive) {
      return res.status(403).json({ error: 'Tenant account suspended' });
    }

    req.tenant = {
      id: tenant.id,
      name: tenant.name,
      domain: tenant.domain || 'default',
      settings: tenant.settings
    };
    next();
  } catch (error) {
    console.error('Tenant resolution error:', error);
    res.status(500).json({ error: 'Tenant resolution failed' });
  }
}

// Middleware to ensure user belongs to the current tenant
export async function validateUserTenant(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user || !req.tenant) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // PLATFORM OWNER BYPASS: Platform owners can access any tenant
    const isPlatformOwner = req.user.email === 'abel@argilette.com';
    if (isPlatformOwner) {
      return next();
    }

    if (req.user.tenantId !== req.tenant.id) {
      return res.status(403).json({ error: 'Access denied: Invalid tenant' });
    }

    next();
  } catch (error) {
    console.error('User tenant validation error:', error);
    res.status(500).json({ error: 'Tenant validation failed' });
  }
}

// Permission checking middleware
export function requirePermission(permission: string) {
  return (req: TenantRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // PLATFORM OWNER BYPASS: Platform owners have all permissions
    const isPlatformOwner = req.user.email === 'abel@argilette.com';
    if (isPlatformOwner) {
      return next();
    }

    // Platform owner has all permissions
    if (req.user.role === 'platform_owner') {
      return next();
    }

    // Check if user has the required permission
    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      return res.status(403).json({ 
        error: 'Access denied: Insufficient permissions',
        required: permission,
        userPermissions: req.user.permissions 
      });
    }

    next();
  };
}

// Role checking middleware
export function requireRole(roles: string | string[]) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req: TenantRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied: Insufficient role',
        required: allowedRoles,
        userRole: req.user.role 
      });
    }

    next();
  };
}

// Data isolation: Only return data for current tenant
export function filterByTenant<T extends { tenantId: string }>(data: T[], tenantId: string): T[] {
  return data.filter(item => item.tenantId === tenantId);
}