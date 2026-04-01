import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { apiRequest, setToken, clearToken } from "../lib/api";

interface User {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  avatar?: string | null;
}

interface Tenant {
  id: string;
  name: string;
  domain: string;
  slug: string;
  plan: string;
  logo?: string | null;
  primaryColor?: string;
  trialEndsAt?: string | null;
  settings?: Record<string, any>;
}

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  loading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  companyName: string;
  domain: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  plan?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    tenant: null,
    loading: true,
    isAuthenticated: false,
  });

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setState({ user: null, tenant: null, loading: false, isAuthenticated: false });
      return;
    }
    try {
      const data = await apiRequest<{ user: User; tenant: Tenant }>("GET", "/api/auth/me");
      setState({ user: data.user, tenant: data.tenant, loading: false, isAuthenticated: true });
    } catch {
      clearToken();
      setState({ user: null, tenant: null, loading: false, isAuthenticated: false });
    }
  }, []);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const data = await apiRequest<{ token: string; user: User; tenant: Tenant }>("POST", "/api/auth/login", { email, password });
    setToken(data.token);
    setState({ user: data.user, tenant: data.tenant, loading: false, isAuthenticated: true });
  };

  const register = async (formData: RegisterData) => {
    const data = await apiRequest<{ token: string; user: User; tenant: Tenant }>("POST", "/api/auth/register", formData);
    setToken(data.token);
    setState({ user: data.user, tenant: data.tenant, loading: false, isAuthenticated: true });
  };

  const logout = () => {
    clearToken();
    setState({ user: null, tenant: null, loading: false, isAuthenticated: false });
    apiRequest("POST", "/api/auth/logout").catch(() => {});
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function useRequireAuth() {
  const auth = useAuth();
  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) {
      window.location.href = "/login";
    }
  }, [auth.loading, auth.isAuthenticated]);
  return auth;
}
