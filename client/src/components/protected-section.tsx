import { usePermissions } from "@/hooks/usePermissions";

interface ProtectedSectionProps {
  permission: string | string[];
  requireAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedSection({ 
  permission, 
  requireAll = false,
  children,
  fallback = null 
}: ProtectedSectionProps) {
  const { hasPermission, hasAllPermissions, hasAnyPermission } = usePermissions();
  
  const hasAccess = Array.isArray(permission)
    ? (requireAll ? hasAllPermissions(permission) : hasAnyPermission(permission))
    : hasPermission(permission);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
