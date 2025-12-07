import React, { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  tenantId: string;
  role: string;
  permissions: string[];
  isPlatformOwner?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreStoredAuth = async () => {
      const storedAuth = localStorage.getItem('auth_user');
      const storedToken = localStorage.getItem('auth_token') || localStorage.getItem('token');
      
      if (storedAuth) {
        try {
          const userData = JSON.parse(storedAuth);
          
          // Try to verify with server - send bearer token if available
          const headers: Record<string, string> = {};
          if (storedToken) {
            headers['Authorization'] = `Bearer ${storedToken}`;
          }
          
          const response = await fetch('/api/auth/me', {
            credentials: 'include',
            headers
          });
          
          if (response.ok) {
            const serverUserData = await response.json();
            
            // Merge server data with cached data to ensure isPlatformOwner is set
            const refreshedUser: User = {
              ...userData,
              ...serverUserData.user,
              isPlatformOwner: serverUserData.user?.isPlatformOwner || 
                               userData.email === 'abel@argilette.com' ||
                               userData.role === 'platform_owner'
            };
            
            // Update localStorage with refreshed data
            localStorage.setItem('auth_user', JSON.stringify(refreshedUser));
            setUser(refreshedUser);
          } else if (response.status === 401) {
            // Token is invalid - clear all auth data and force re-login
            console.log('Token invalid - clearing auth state');
            localStorage.removeItem('auth_user');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('token');
            localStorage.removeItem('user_email');
            localStorage.removeItem('userEmail');
            setUser(null);
          } else {
            // For other errors (network issues), trust cached data temporarily
            const cachedUser: User = {
              ...userData,
              isPlatformOwner: userData.isPlatformOwner || 
                              userData.email === 'abel@argilette.com' ||
                              userData.role === 'platform_owner'
            };
            setUser(cachedUser);
          }
        } catch (error) {
          // On error, still try to use cached data
          try {
            const userData = JSON.parse(storedAuth);
            const cachedUser: User = {
              ...userData,
              isPlatformOwner: userData.isPlatformOwner || 
                              userData.email === 'abel@argilette.com' ||
                              userData.role === 'platform_owner'
            };
            setUser(cachedUser);
          } catch {
            // If we can't even parse stored data, clear it
            localStorage.removeItem('auth_user');
            localStorage.removeItem('user_email');
            localStorage.removeItem('userEmail');
            setUser(null);
          }
        }
      }
      
      setLoading(false);
    };
    
    restoreStoredAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Basic validation
      if (!email || !password) {
        return { success: false, error: 'Email and password are required' };
      }

      // SECURE AUTHENTICATION: Call backend API for proper validation
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for httpOnly JWT
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      // Only proceed if server authentication succeeds (JWT token is in secure httpOnly cookie)
      if (response.ok && data.success && data.user) {
        // Use the user data returned from the secure backend
        const authenticatedUser: User = {
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          tenantId: data.tenant?.id || '00000000-0000-0000-0000-000000000001',
          role: data.user.role,
          permissions: data.user.permissions || [],
          isPlatformOwner: data.user.isPlatformOwner || false
        };
        
        setUser(authenticatedUser);
        localStorage.setItem('auth_user', JSON.stringify(authenticatedUser));
        // Store JWT token in localStorage for API requests (in addition to httpOnly cookie)
        if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('auth_token', data.token);
        }
        localStorage.setItem('user_email', email);
        localStorage.setItem('userEmail', email); // Store both for consistency
        
        return { success: true };
      } else {
        // Authentication failed - return server error
        const errorMessage = data.error || data.message || 'Invalid credentials';
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      return { success: false, error: 'Login failed. Please check your connection and try again.' };
    }
  };

  const logout = async () => {
    // IMMEDIATE: Clear user state first to prevent any data loading
    setUser(null);
    // Clear all auth-related localStorage items immediately
    localStorage.removeItem('auth_user');
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isPlatformOwner');
    
    try {
      // Call server logout to clear httpOnly cookie (async but non-blocking)
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      // Logout error handled silently
    }
    
    // No manual redirect needed - ProtectedRoute will automatically redirect to '/' 
    // when isAuthenticated becomes false, preventing application errors from hard refresh
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    loading
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}