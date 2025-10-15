import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // SECURITY FIX: Only get token from localStorage, remove dangerous headers
  const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
  
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  
  // SECURITY: Only send Authorization header, never trust client-side data for identity
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // SECURITY FIX: Removed dangerous headers that allowed privilege escalation:
  // - x-user-email (allowed user impersonation)
  // - x-auth-email (allowed user impersonation) 
  // - x-is-platform-owner (allowed privilege escalation)

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    // SECURITY FIX: Enable credentials to send httpOnly cookies for authentication
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // SECURITY FIX: Only get token, remove dangerous header data
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    
    const headers: Record<string, string> = {};
    
    // SECURITY: Only send Authorization header with JWT token
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // SECURITY FIX: Completely removed dangerous headers that enabled:
    // - User impersonation via x-auth-email/x-user-email
    // - Privilege escalation via x-is-platform-owner

    const res = await fetch(queryKey[0] as string, {
      headers,
      // SECURITY FIX: Enable credentials to send httpOnly cookies for authentication
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    const data = await res.json();
    return data;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      // Performance optimizations
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 404s or auth errors
        if (error?.message?.includes('401') || error?.message?.includes('404')) {
          return false;
        }
        return failureCount < 2; // Reduced retry attempts
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});
