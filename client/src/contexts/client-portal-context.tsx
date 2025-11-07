import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface ClientPortalUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

interface ClientAccount {
  id: string;
  accountName: string;
  accountEmail: string;
  whiteLabelSettings?: {
    companyName?: string;
    logoUrl?: string;
    primaryColor?: string;
    customDomain?: string;
  };
}

interface ClientContextType {
  clientUser: ClientPortalUser | null;
  clientAccount: ClientAccount | null;
  tenantId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  requestMagicLink: (email: string, tenantId: string) => Promise<void>;
  verifyMagicLink: (token: string, email: string, tenantId: string) => Promise<void>;
}

const ClientPortalContext = createContext<ClientContextType | undefined>(undefined);

export function ClientPortalProvider({ children }: { children: ReactNode }) {
  const [clientUser, setClientUser] = useState<ClientPortalUser | null>(null);
  const [clientAccount, setClientAccount] = useState<ClientAccount | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/client-portal/auth/me', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setClientUser(data.user);
        setClientAccount(data.account);
        setTenantId(data.tenantId);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await apiRequest('/api/client-portal/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    await checkAuth();
  };

  const logout = async () => {
    try {
      await apiRequest('/api/client-portal/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setClientUser(null);
      setClientAccount(null);
      setTenantId(null);
    }
  };

  const requestMagicLink = async (email: string, tenantId: string) => {
    const response = await apiRequest('/api/client-portal/auth/magic-link', {
      method: 'POST',
      body: JSON.stringify({ email, tenantId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send magic link');
    }
  };

  const verifyMagicLink = async (token: string, email: string, tenantId: string) => {
    const response = await apiRequest('/api/client-portal/auth/verify-magic-link', {
      method: 'POST',
      body: JSON.stringify({ token, email, tenantId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Magic link verification failed');
    }

    await checkAuth();
  };

  return (
    <ClientPortalContext.Provider
      value={{
        clientUser,
        clientAccount,
        tenantId,
        isAuthenticated: !!clientUser,
        isLoading,
        login,
        logout,
        requestMagicLink,
        verifyMagicLink,
      }}
    >
      {children}
    </ClientPortalContext.Provider>
  );
}

export function useClientPortal() {
  const context = useContext(ClientPortalContext);
  if (context === undefined) {
    throw new Error('useClientPortal must be used within a ClientPortalProvider');
  }
  return context;
}
