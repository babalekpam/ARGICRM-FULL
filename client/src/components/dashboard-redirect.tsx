import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Redirect } from 'wouter';
import Dashboard from '@/pages/dashboard';

export default function DashboardRedirect() {
  const { user } = useAuth();
  
  // Check if user is platform owner
  const isPlatformOwner = Boolean(
    user?.isPlatformOwner === true ||
    user?.email === 'abel@argilette.com' || 
    user?.email === 'admin@default.com' ||
    user?.role === 'platform_owner'
  );
  
  // Platform owners should be redirected to super-admin-dashboard
  if (isPlatformOwner) {
    return <Redirect to="/super-admin-dashboard" />;
  }
  
  // Regular users get the normal dashboard
  return <Dashboard />;
}