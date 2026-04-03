/**
 * TENANT-AWARE AI SERVICE
 *
 * Wraps ai-adapter.ts with:
 *   - Per-tenant own API key injection (unlimited usage)
 *   - Plan-based monthly quota when using ARGILETTE's platform keys
 *   - Usage tracking stored in tenant.settings.ai
 */

import * as storage from "../storage.js";
import { complete, ask, AIProvider, AICompletionOpts } from "./ai-adapter.js";

// ─── Monthly quota per plan ──────────────────────────────────────────────────
export const PLAN_LIMITS: Record<string, number> = {
  trial:        50,
  trialing:     50,
  free:         50,
  starter:      200,
  professional: 500,
  business:     1000,
  enterprise:   -1,   // -1 = unlimited
};

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ─── Read tenant AI config ───────────────────────────────────────────────────
export async function getTenantAIConfig(tenantId: string) {
  const tenant = await storage.getTenantById(tenantId);
  if (!tenant) throw new Error("Tenant not found");

  const aiSettings: any = (tenant.settings as any)?.ai || {};
  const plan: string = tenant.subscriptionPlan || "free";
  const limit = PLAN_LIMITS[plan] ?? 50;
  const month = currentMonth();
  const usageCount = aiSettings.usageMonth === month ? (aiSettings.usageCount || 0) : 0;

  return {
    plan,
    limit,
    usageCount,
    hasOwnKey: !!(aiSettings.apiKey),
    provider: aiSettings.provider as AIProvider | null ?? null,
    apiKey: aiSettings.apiKey as string | null ?? null,
  };
}

// ─── Check quota + increment (when using platform key) ──────────────────────
async function checkAndIncrementUsage(tenantId: string): Promise<void> {
  const tenant = await storage.getTenantById(tenantId);
  if (!tenant) throw new Error("Tenant not found");

  const aiSettings: any = (tenant.settings as any)?.ai || {};
  const plan: string = tenant.subscriptionPlan || "free";
  const limit = PLAN_LIMITS[plan] ?? 50;
  const month = currentMonth();
  const usageCount = aiSettings.usageMonth === month ? (aiSettings.usageCount || 0) : 0;

  // Enterprise plan (including platform owner) = unlimited
  if (limit === -1) {
    return; // no quota enforcement, no usage tracking needed
  }

  if (usageCount >= limit) {
    const err: any = new Error(
      `Monthly AI quota reached (${usageCount}/${limit} requests). Add your own API key in Settings → AI for unlimited access.`
    );
    err.code = "QUOTA_EXCEEDED";
    err.status = 429;
    throw err;
  }

  const currentSettings: any = tenant.settings || {};
  await storage.updateTenant(tenantId, {
    settings: {
      ...currentSettings,
      ai: { ...aiSettings, usageCount: usageCount + 1, usageMonth: month },
    },
  });
}

// ─── Main tenant-aware complete() ───────────────────────────────────────────
export async function completeForTenant(tenantId: string, opts: AICompletionOpts): Promise<string> {
  const tenant = await storage.getTenantById(tenantId);
  if (!tenant) throw new Error("Tenant not found");

  const aiSettings: any = (tenant.settings as any)?.ai || {};

  if (aiSettings.apiKey && aiSettings.provider) {
    return complete({
      ...opts,
      provider: aiSettings.provider as AIProvider,
      tenantApiKey: aiSettings.apiKey,
    });
  }

  await checkAndIncrementUsage(tenantId);
  return complete(opts);
}

// ─── Convenience wrappers ────────────────────────────────────────────────────
export async function askForTenant(
  tenantId: string,
  prompt: string,
  system?: string,
  fast = false,
): Promise<string> {
  return completeForTenant(tenantId, {
    messages: [{ role: "user", content: prompt }],
    system,
    fast,
    maxTokens: 1024,
  });
}

export async function askJSONForTenant<T = any>(
  tenantId: string,
  prompt: string,
  system?: string,
): Promise<T> {
  const sys =
    (system || "") +
    "\nReturn ONLY valid JSON. No markdown, no explanation, just the JSON object or array.";
  const text = await askForTenant(tenantId, prompt, sys);
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean) as T;
}
