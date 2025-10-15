/**
 * Dashboard routing utility for role-based dashboard navigation
 * Ensures users are directed to the appropriate dashboard based on their privileges
 */

export function getDashboardPath(userEmail?: string): string {
  // Only admin@default.com gets platform owner dashboard
  const isPlatformOwner = userEmail === 'admin@default.com';
  
  return isPlatformOwner ? '/dashboard' : '/user-dashboard';
}

export function redirectToDashboard(userEmail?: string): void {
  const dashboardPath = getDashboardPath(userEmail);
  window.location.href = dashboardPath;
}