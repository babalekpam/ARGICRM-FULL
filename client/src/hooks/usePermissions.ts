import { useAuth } from "./useAuth";

export function usePermissions() {
  const { user } = useAuth();
  
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Platform owner has all permissions
    if (user.email === 'abel@argilette.com' || user.role === 'platform_owner') {
      return true;
    }
    
    // Admin and demo_admin have most permissions
    if (user.role === 'admin' || user.role === 'demo_admin') {
      // Exclude platform-specific permissions for regular admins
      const platformOnlyPermissions = [
        'platform.read',
        'platform.write',
        'subscribers.read',
        'subscribers.write',
        'revenue.read'
      ];
      
      if (platformOnlyPermissions.includes(permission)) {
        return false;
      }
      
      return true;
    }
    
    // Default deny for other roles
    return false;
  };
  
  const getAccessiblePermissions = (): string[] => {
    if (!user) return [];
    
    const allPermissions = [
      'dashboard.read',
      'ai.read',
      'contacts.read',
      'contacts.write',
      'accounts.read', 
      'accounts.write',
      'leads.read',
      'leads.write',
      'deals.read',
      'deals.write',
      'tasks.read',
      'tasks.write',
      'marketing.read',
      'marketing.write',
      'analytics.read',
      'analytics.write',
      'reports.read',
      'reports.write',
      'scheduling.read',
      'scheduling.write',
      'tickets.read',
      'tickets.write',
      'projects.read',
      'projects.write',
      'team.read',
      'team.write',
      'financial.read',
      'financial.write',
      'enterprise.read',
      'enterprise.write',
      'settings.read',
      'settings.write',
      'admin.read',
      'admin.write',
      'workflows.read',
      'workflows.write',
      'platform.read',
      'platform.write',
      'subscribers.read',
      'subscribers.write',
      'revenue.read'
    ];
    
    return allPermissions.filter(permission => hasPermission(permission));
  };
  
  return {
    hasPermission,
    getAccessiblePermissions,
    userRole: user?.role,
    isAuthenticated: !!user
  };
}