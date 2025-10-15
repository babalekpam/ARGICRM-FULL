import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredPermission, 
  requiredRole 
}: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();

  // Minimal debug logging to reduce console noise
  if (!isAuthenticated) {
    console.log('ProtectedRoute: User not authenticated, redirecting to login');
  }

  // If user is not authenticated, redirect to landing page with login form
  if (!isAuthenticated || !user) {
    console.log('User not authenticated, redirecting to landing page');
    return <Navigate to="/" replace />;
  }

  // Enhanced platform owner check with multiple validation methods
  const isPlatformOwner = user?.email === 'abel@argilette.com' || 
                         user?.email === 'admin@default.com' || 
                         user?.role === 'platform_owner' ||
                         user?.isPlatformOwner === true;
  
  // If permission requires platform access and user is not platform owner
  if (requiredPermission && (
    requiredPermission === 'platform.read' || 
    requiredPermission === 'platform.*' ||
    requiredPermission === 'admin.read' ||
    requiredPermission === 'admin.*'
  )) {
    if (!isPlatformOwner) {
      // Log the access denial
      console.log('ACCESS DENIED: Platform owner required but user is:', user?.email);
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Access Denied
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                This feature is restricted to platform administrators only.
              </p>
              <div className="text-sm text-gray-500 bg-gray-100 p-3 rounded">
                <p><strong>Current user:</strong> {user?.email || 'Unknown'}</p>
                <p><strong>Role:</strong> {user?.role || 'Unknown'}</p>
                <p><strong>Platform Owner:</strong> {isPlatformOwner ? 'Yes' : 'No'}</p>
                <p><strong>Required:</strong> Platform Owner Access Only</p>
                <p><strong>Required Permission:</strong> {requiredPermission}</p>
              </div>
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Return to Dashboard
              </button>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  // If a specific role is required and user doesn't have it
  if (requiredRole && user.role !== requiredRole && !isPlatformOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Insufficient Permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              You don't have the required permissions to access this page.
            </p>
            <div className="text-sm text-gray-500">
              <p>Current role: {user.role}</p>
              <p>Required role: {requiredRole}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Platform owners have access to all features
  if (isPlatformOwner) {
    return <>{children}</>;
  }

  // For marketing features, allow any authenticated user for now
  if (requiredPermission && (
    requiredPermission.includes('marketing') || 
    requiredPermission.includes('campaigns') ||
    requiredPermission.includes('funnel')
  )) {
    return <>{children}</>;
  }

  // User has permission, render the protected content
  return <>{children}</>;
}