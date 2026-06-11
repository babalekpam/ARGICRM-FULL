import { QueryClient, MutationCache } from "@tanstack/react-query";
import { toast } from "../components/Toast";

const API_BASE = "";

// Thrown when the server returns 402 — plan upgrade required
export class UpgradeRequiredError extends Error {
  code = "UPGRADE_REQUIRED";
  currentPlan: string;
  requiredPlan: string;
  upgradeTo: string;
  upgradePrice: string;

  constructor(message: string, data: any = {}) {
    super(message);
    this.name = "UpgradeRequiredError";
    this.currentPlan  = data.currentPlan  || "trial";
    this.requiredPlan = data.requiredPlan || "professional";
    this.upgradeTo    = data.upgradeTo    || "Professional";
    this.upgradePrice = data.upgradePrice || "";
  }
}

function getToken(): string | null {
  return localStorage.getItem("token");
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("tenant");
}

export async function apiRequest<T = any>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  if (res.status === 401) {
    clearToken();
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  if (res.status === 402) {
    const data = await res.json().catch(() => ({}));
    const err = new UpgradeRequiredError(data.error || "Upgrade required", data);
    throw err;
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

export const queryClient = new QueryClient({
  // Global safety net: any mutation without its own onError handler surfaces
  // failures to the user instead of failing silently. Upgrade-required errors
  // are excluded — pages render those as inline upgrade banners.
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) => {
      if (mutation.options.onError) return;
      if (error instanceof UpgradeRequiredError) return;
      toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    },
  }),
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const [path] = queryKey as string[];
        return apiRequest("GET", path);
      },
      staleTime: 2 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: (count, error: any) => {
        if (error?.message?.includes("401") || error?.message?.includes("403")) return false;
        return count < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});
