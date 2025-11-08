/**
 * Role-Based Access Control (RBAC) Middleware
 * 
 * This module provides permission checking middleware for protecting backend routes.
 * 
 * Usage Examples:
 * 
 * 1. Require specific permission:
 *    router.post('/api/contacts', authenticate, requirePermission('contacts.create'), handler);
 * 
 * 2. Require any of several permissions:
 *    router.get('/api/data', authenticate, requireAnyPermission(['reports.read', 'analytics.read']), handler);
 * 
 * 3. Require all permissions:
 *    router.post('/api/admin', authenticate, requireAllPermissions(['users.admin', 'settings.admin']), handler);
 * 
 * 4. Require platform owner only:
 *    router.delete('/api/system', authenticate, requirePlatformOwner, handler);
 * 
 * 5. Require admin role (admin or platform owner):
 *    router.patch('/api/settings', authenticate, requireAdminRole, handler);
 */

import { Request, Response, NextFunction } from 'express';
import { AuthUser } from './auth.js';
import { 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions, 
  isPlatformOwner, 
  isAdmin 
} from '../../shared/permissions.js';

interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

/**
 * Middleware to check if user has a specific permission
 * 
 * @param permission - The required permission (e.g., 'contacts.create')
 * @returns Express middleware function
 * 
 * @example
 * router.post('/api/contacts', authenticate, requirePermission('contacts.create'), createContact);
 */
export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }

    const userPermissions = req.user.permissions || [];

    if (!hasPermission(userPermissions, permission)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `You need the '${permission}' permission to perform this action`,
        required: permission
      });
    }

    next();
  };
}

/**
 * Middleware to check if user has ANY of the specified permissions
 * 
 * @param permissions - Array of permissions (user needs at least one)
 * @returns Express middleware function
 * 
 * @example
 * router.get('/api/reports', authenticate, requireAnyPermission(['reports.read', 'analytics.read']), getReports);
 */
export function requireAnyPermission(permissions: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }

    const userPermissions = req.user.permissions || [];

    if (!hasAnyPermission(userPermissions, permissions)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `You need at least one of these permissions: ${permissions.join(', ')}`,
        required: permissions
      });
    }

    next();
  };
}

/**
 * Middleware to check if user has ALL of the specified permissions
 * 
 * @param permissions - Array of permissions (user needs all of them)
 * @returns Express middleware function
 * 
 * @example
 * router.delete('/api/critical', authenticate, requireAllPermissions(['data.delete', 'admin.access']), deleteData);
 */
export function requireAllPermissions(permissions: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }

    const userPermissions = req.user.permissions || [];

    if (!hasAllPermissions(userPermissions, permissions)) {
      const missing = permissions.filter(p => !hasPermission(userPermissions, p));
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `You are missing required permissions: ${missing.join(', ')}`,
        required: permissions,
        missing
      });
    }

    next();
  };
}

/**
 * Legacy alias for requireAllPermissions (backward compatibility)
 * @deprecated Use requireAllPermissions instead
 */
export const requirePermissions = requireAllPermissions;

/**
 * Middleware to restrict access to platform owner only (abel@argilette.com)
 * 
 * @returns Express middleware function
 * 
 * @example
 * router.delete('/api/system/reset', authenticate, requirePlatformOwner, resetSystem);
 */
export function requirePlatformOwner(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'You must be logged in to access this resource'
    });
  }

  if (!isPlatformOwner(req.user.email)) {
    return res.status(403).json({ 
      error: 'Platform owner access required',
      message: 'This action can only be performed by the platform owner'
    });
  }

  next();
}

/**
 * Middleware to restrict access to admin or platform owner
 * 
 * @returns Express middleware function
 * 
 * @example
 * router.patch('/api/tenant/settings', authenticate, requireAdminRole, updateSettings);
 */
export function requireAdminRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'You must be logged in to access this resource'
    });
  }

  if (!isPlatformOwner(req.user.email) && !isAdmin(req.user.role)) {
    return res.status(403).json({ 
      error: 'Admin access required',
      message: 'This action requires admin privileges',
      currentRole: req.user.role
    });
  }

  next();
}

/**
 * Legacy alias for requireAdminRole (backward compatibility)
 * @deprecated Use requireAdminRole instead
 */
export const requireAdmin = requireAdminRole;

/**
 * Helper middleware to check if user is a manager or higher
 * Useful for routes that need elevated access but not full admin
 * 
 * @returns Express middleware function
 * 
 * @example
 * router.get('/api/team/performance', authenticate, requireManagerOrHigher, getTeamPerformance);
 */
export function requireManagerOrHigher(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'You must be logged in to access this resource'
    });
  }

  const allowedRoles = ['platform_owner', 'admin', 'manager'];
  
  if (!isPlatformOwner(req.user.email) && !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ 
      error: 'Manager access required',
      message: 'This action requires manager or higher privileges',
      currentRole: req.user.role
    });
  }

  next();
}

/**
 * Feature-based access control
 * Checks if user has access to a specific feature
 * 
 * @param featureName - The feature to check access for
 * @returns Express middleware function
 */
export function requireFeature(featureName: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userPermissions = req.user.permissions || [];
    const hasFeatureAccess = hasPermission(userPermissions, `${featureName}.access`);

    if (!hasFeatureAccess) {
      return res.status(403).json({ 
        error: `Feature access required: ${featureName}`,
        feature: featureName
      });
    }

    next();
  };
}

/**
 * Tenant-based access control
 * Ensures user can only access resources from their own tenant
 * 
 * @returns Express middleware function
 */
export function requireTenantAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Extract tenant ID from request (params, query, or body)
  const requestedTenantId = req.params.tenantId || req.query.tenantId || req.body.tenantId;

  if (requestedTenantId && req.user.tenantId !== requestedTenantId && !isPlatformOwner(req.user.email)) {
    return res.status(403).json({ error: 'Access denied - tenant mismatch' });
  }

  next();
}