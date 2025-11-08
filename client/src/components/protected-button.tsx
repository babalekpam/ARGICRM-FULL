import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ButtonProps } from "@/components/ui/button";

interface ProtectedButtonProps extends Omit<ButtonProps, 'children'> {
  permission: string | string[];
  requireAll?: boolean;
  hideIfNoPermission?: boolean;
  children: React.ReactNode;
}

export function ProtectedButton({ 
  permission, 
  requireAll = false,
  hideIfNoPermission = false,
  disabled,
  children,
  ...props 
}: ProtectedButtonProps) {
  const { hasPermission, hasAllPermissions, hasAnyPermission } = usePermissions();
  
  const hasAccess = Array.isArray(permission)
    ? (requireAll ? hasAllPermissions(permission) : hasAnyPermission(permission))
    : hasPermission(permission);

  if (!hasAccess && hideIfNoPermission) {
    return null;
  }

  const isDisabled = !hasAccess || disabled;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <Button {...props} disabled={isDisabled}>
            {children}
          </Button>
        </span>
      </TooltipTrigger>
      {!hasAccess && (
        <TooltipContent>
          You don't have permission to perform this action
        </TooltipContent>
      )}
    </Tooltip>
  );
}
