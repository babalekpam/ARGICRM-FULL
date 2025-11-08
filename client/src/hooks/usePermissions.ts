import { useAuth } from "./useAuth";
import { useQuery } from "@tanstack/react-query";

interface PermissionsResponse {
  permissions: string[];
  role: string;
  isAdmin: boolean;
  isPlatformOwner: boolean;
}

export function usePermissions() {
  const { user } = useAuth();
  
  // Fetch user permissions from API
  const { data: permissionsData, isLoading, error } = useQuery<PermissionsResponse>({
    queryKey: ['/api/rbac/my-permissions'],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2
  });
  
  const isPlatformOwner = (): boolean => {
    if (!user) return false;
    // Check email as primary identifier for platform owner (client-side safety)
    if (user.email === 'abel@argilette.com') return true;
    // Also check API response
    return permissionsData?.isPlatformOwner === true;
  };
  
  const isAdmin = (): boolean => {
    if (!user) return false;
    // Check API response first
    if (permissionsData?.isAdmin === true) return true;
    // Fallback to role check for backwards compatibility
    return user.role === 'admin' || user.role === 'demo_admin';
  };
  
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Platform owner has all permissions (wildcard *)
    if (isPlatformOwner()) {
      return true;
    }
    
    // Check if permissions have loaded
    if (!permissionsData?.permissions) {
      // While loading, deny access (conservative approach)
      return false;
    }
    
    // Check for wildcard permission
    if (permissionsData.permissions.includes('*')) {
      return true;
    }
    
    // Check for specific permission
    return permissionsData.permissions.includes(permission);
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
  
  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
    isPlatformOwner,
    isAdmin,
    userPermissions: permissionsData?.permissions || [],
    userRole: user?.role || permissionsData?.role,
    isAuthenticated: !!user,
    isLoading,
    error
  };
}