import { useAuth } from "./useAuth";
import { useMemo } from "react";

export function usePermissions() {
  const { user } = useAuth();
  
  const isPlatformOwner = (): boolean => {
    if (!user) return false;
    return user.email === 'abel@argilette.com' || user.role === 'platform_owner' || user.isPlatformOwner === true;
  };
  
  const isAdmin = (): boolean => {
    if (!user) return false;
    return user.role === 'admin' || user.role === 'demo_admin';
  };
  
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Platform owner has all permissions (wildcard *)
    if (isPlatformOwner()) {
      return true;
    }
    
    // Admin and demo_admin have most permissions
    if (isAdmin()) {
      // Exclude platform-specific permissions for regular admins
      const platformOnlyPermissions = [
        'platform.read',
        'platform.write',
        'subscribers.read',
        'subscribers.write',
        'revenue.read',
        'white_label.read',
        'white_label.update'
      ];
      
      if (platformOnlyPermissions.includes(permission)) {
        return false;
      }
      
      return true;
    }
    
    // Default deny for other roles
    return false;
  };
  
  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!permissions || permissions.length === 0) return false;
    return permissions.some(permission => hasPermission(permission));
  };
  
  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!permissions || permissions.length === 0) return false;
    return permissions.every(permission => hasPermission(permission));
  };
  
  const canAccess = (permission: string | string[]): boolean => {
    if (Array.isArray(permission)) {
      return hasAnyPermission(permission);
    }
    return hasPermission(permission);
  };
  
  const userPermissions = useMemo(() => {
    if (!user) return [];
    
    const allPermissions = [
      'dashboard.read',
      'ai.read',
      'contacts.read',
      'contacts.create',
      'contacts.update',
      'contacts.delete',
      'contacts.export',
      'contacts.import',
      'accounts.read', 
      'accounts.create',
      'accounts.update',
      'accounts.delete',
      'leads.read',
      'leads.create',
      'leads.update',
      'leads.delete',
      'deals.read',
      'deals.create',
      'deals.update',
      'deals.delete',
      'tasks.read',
      'tasks.create',
      'tasks.update',
      'tasks.delete',
      'campaigns.read',
      'campaigns.create',
      'campaigns.update',
      'campaigns.delete',
      'campaigns.publish',
      'marketing.read',
      'marketing.create',
      'marketing.update',
      'analytics.read',
      'analytics.export',
      'reports.read',
      'reports.create',
      'reports.export',
      'scheduling.read',
      'scheduling.create',
      'scheduling.update',
      'tickets.read',
      'tickets.create',
      'tickets.update',
      'projects.read',
      'projects.create',
      'projects.update',
      'team.read',
      'team.create',
      'team.update',
      'financial.read',
      'financial.update',
      'enterprise.read',
      'settings.read',
      'settings.update',
      'billing.read',
      'billing.update',
      'users.read',
      'users.create',
      'users.update',
      'users.delete',
      'roles.read',
      'roles.create',
      'roles.update',
      'roles.delete',
      'workflows.read',
      'workflows.create',
      'workflows.update',
      'products.read',
      'products.create',
      'products.update',
      'products.delete',
      'inventory.read',
      'inventory.update',
      'orders.read',
      'orders.update',
      'seo.read',
      'seo.create',
      'seo.update',
      'platform.read',
      'platform.write',
      'subscribers.read',
      'subscribers.write',
      'revenue.read',
      'white_label.read',
      'white_label.update'
    ];
    
    return allPermissions.filter(permission => hasPermission(permission));
  }, [user]);
  
  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
    isPlatformOwner,
    isAdmin,
    userPermissions,
    userRole: user?.role,
    isAuthenticated: !!user,
    isLoading: false,
    error: null
  };
}