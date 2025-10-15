import React, { useState, useEffect, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
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
      
      if (storedAuth) {
        try {
          const userData = JSON.parse(storedAuth);
          // Verify authentication with server using httpOnly cookie
          const response = await fetch('/api/auth/me', {
            credentials: 'include' // Include cookies in request
          });
          
          if (response.ok) {
            const serverUserData = await response.json();
            console.log('✅ Restoring authenticated session for:', userData.email);
            setUser(userData);
          } else {
            // Invalid session, clear stored data silently
            console.log('🧹 Clearing expired session data');
            localStorage.removeItem('auth_user');
            localStorage.removeItem('user_email');
            localStorage.removeItem('userEmail');
            setUser(null); // Ensure user state is cleared
          }
        } catch (error) {
          console.log('🧹 Clearing invalid session data');
          localStorage.removeItem('auth_user');
          localStorage.removeItem('user_email');
          localStorage.removeItem('userEmail');
          setUser(null); // Ensure user state is cleared
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
        // Note: JWT token is now stored as secure httpOnly cookie, not in localStorage
        localStorage.setItem('user_email', email);
        localStorage.setItem('userEmail', email); // Store both for consistency
        
        console.log('✅ Secure authentication successful for:', email);
        return { success: true };
      } else {
        // Authentication failed - return server error
        const errorMessage = data.error || data.message || 'Invalid credentials';
        console.log('❌ Authentication failed:', errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      return { success: false, error: 'Login failed. Please check your connection and try again.' };
    }
  };

  const logout = async () => {
    // IMMEDIATE: Clear user state first to prevent any data loading
    setUser(null);
    // Clear all auth-related localStorage items immediately
    localStorage.removeItem('auth_user');
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
      console.error('Error during server logout:', error);
    }
    
    console.log('✅ User logged out, all auth data cleared');
    
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