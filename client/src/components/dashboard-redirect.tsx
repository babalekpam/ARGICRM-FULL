import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
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
    return <Navigate to="/super-admin-dashboard" replace />;
  }
  
  // Regular users get the normal dashboard
  return <Dashboard />;
}