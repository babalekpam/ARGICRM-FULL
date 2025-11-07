import { Request, Response, NextFunction } from 'express';
import { AuthUser } from './auth.js';

interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

// RBAC middleware - checks user permissions
export function requirePermissions(permissions: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userPermissions = req.user.permissions || [];
    const hasAllPermissions = permissions.every(permission => 
      userPermissions.includes(permission) || 
      userPermissions.includes('*') || // Wildcard permission
      req.user?.role === 'platform_owner'
    );

    if (!hasAllPermissions) {
      return res.status(403).json({ 
        error: 'Insufficient permissions', 
        required: permissions,
        current: userPermissions
      });
    }

    next();
  };
}

// Platform owner middleware (stricter than email check)
export function requirePlatformOwner(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Platform owner must be explicitly set in the system
  const isPlatformOwner = req.user.role === 'platform_owner' || 
                         req.user.permissions?.includes('platform.admin');

  if (!isPlatformOwner) {
    return res.status(403).json({ error: 'Platform owner access required' });
  }

  next();
}

// Admin role middleware
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const isAdmin = ['platform_owner', 'admin'].includes(req.user.role);

  if (!isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}

// Feature-based access control
export function requireFeature(featureName: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user has access to this feature based on subscription/role
    const hasFeatureAccess = req.user.permissions?.includes(`${featureName}.access`) ||
                            req.user.permissions?.includes('*') ||
                            req.user.role === 'platform_owner';

    if (!hasFeatureAccess) {
      return res.status(403).json({ 
        error: `Feature access required: ${featureName}`,
        feature: featureName
      });
    }

    next();
  };
}

// Tenant-based access control
export function requireTenantAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Extract tenant ID from request (params, query, or body)
  const requestedTenantId = req.params.tenantId || req.query.tenantId || req.body.tenantId;

  if (requestedTenantId && req.user.tenantId !== requestedTenantId && req.user.role !== 'platform_owner') {
    return res.status(403).json({ error: 'Access denied - tenant mismatch' });
  }

  next();
}