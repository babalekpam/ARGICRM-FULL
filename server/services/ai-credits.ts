/**
 * ARGILETTE — AI CREDIT & USAGE TRACKING SERVICE
 *
 * Layer 1: Log every token to ai_usage
 * Layer 2: Hard credit limits per tenant
 * Layer 3: Rate limiting constants (enforced by middleware)
 * Layer 4: Usage dashboard data for the frontend
 */

import { db } from "../db.js";
import { sql } from "drizzle-orm";

// ═══════════════════════════════════════════════════════════════
// COST CALCULATOR  (Claude Sonnet 4-5 pricing)
// ═══════════════════════════════════════════════════════════════

export function calculateCost(inputTokens: number, outputTokens: number): number {
  const inputCost  = (inputTokens  / 1_000_000) * 3.00;   // $3 / M input tokens
  const outputCost = (outputTokens / 1_000_000) * 15.00;  // $15 / M output tokens
  return Number((inputCost + outputCost).toFixed(6));
}

// ═══════════════════════════════════════════════════════════════
// CREDITS PER PLAN
// ═══════════════════════════════════════════════════════════════

export const PLAN_CREDITS: Record<string, number> = {
  trial:        50,
  trialing:     50,
  free:         50,
  starter:      200,
  professional: 500,
  business:     1000,  // legacy name
  growth:       1000,  // renamed from business
  enterprise:   -1,    // -1 = unlimited
};

// ═══════════════════════════════════════════════════════════════
// RATE LIMITS PER PLAN  (per-minute limit used by middleware)
// ═══════════════════════════════════════════════════════════════

export const RATE_LIMITS: Record<string, { perMinute: number; perHour: number; perDay: number }> = {
  trial:        { perMinute: 3,  perHour: 20,   perDay: 50   },
  trialing:     { perMinute: 3,  perHour: 20,   perDay: 50   },
  free:         { perMinute: 3,  perHour: 20,   perDay: 50   },
  starter:      { perMinute: 5,  perHour: 50,   perDay: 200  },
  professional: { perMinute: 15, perHour: 200,  perDay: 1000 },
  business:     { perMinute: 30, perHour: 500,  perDay: 5000  },  // legacy name
  growth:       { perMinute: 30, perHour: 500,  perDay: 5000  },  // renamed from business
  enterprise:   { perMinute: 60, perHour: 1000, perDay: 20000 },
};

// MAX TOKENS PER FEATURE (safety cap on individual calls)
export const MAX_TOKENS_PER_FEATURE: Record<string, number> = {
  aria:          2000,
  skill:         4096,
  store_builder: 2048,
  enrichment:    1000,
  campaign:      1500,
  contract:      4096,
  default:       1024,
};

// ═══════════════════════════════════════════════════════════════
// CREDIT CHECK — call BEFORE every Claude API call
// ═══════════════════════════════════════════════════════════════

export async function checkCredits(tenantId: string): Promise<void> {
  try {
    const r = await db.execute(sql`
      SELECT ai_credits_remaining, subscription_plan, plan
      FROM tenants
      WHERE id::text = ${tenantId}
      LIMIT 1
    `);
    if (!r.rows.length) return; // Unknown tenant — let it through

    const row = r.rows[0] as any;
    const plan = row.subscription_plan || row.plan || "starter";
    const limit = PLAN_CREDITS[plan] ?? 200;

    if (limit === -1) return; // Enterprise = unlimited

    const remaining = row.ai_credits_remaining ?? limit;
    if (remaining <= 0) {
      const err: any = new Error(
        `AI credits exhausted (0 remaining). Upgrade your plan or add your own API key in Settings → AI for unlimited access.`
      );
      err.code = "AI_CREDITS_EXHAUSTED";
      err.status = 429;
      throw err;
    }
  } catch (e: any) {
    if (e.code === "AI_CREDITS_EXHAUSTED") throw e;
    // DB errors — let the call through rather than block
    console.warn("[AI Credits] Credit check DB error (non-blocking):", e.message?.slice(0, 80));
  }
}

// ═══════════════════════════════════════════════════════════════
// LOG USAGE — call AFTER every Claude API call
// ═══════════════════════════════════════════════════════════════

export interface UsagePayload {
  tenantId: string;
  userId?: string | null;
  feature: string;                  // 'aria' | 'skill' | 'campaign' | 'enrichment' | ...
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export async function logUsage(payload: UsagePayload): Promise<void> {
  const { tenantId, userId, feature, model, inputTokens, outputTokens } = payload;
  const costUsd = calculateCost(inputTokens, outputTokens);
  // 5x markup — what we charge vs what Anthropic charges us
  const markupCharged = Number((costUsd * 5).toFixed(4));

  try {
    // 1. Insert usage log row
    await db.execute(sql`
      INSERT INTO ai_usage
        (tenant_id, user_id, model, tokens_input, tokens_output, cost_usd, feature, markup_charged)
      VALUES
        (${tenantId}::uuid, ${userId ?? null}::uuid, ${model},
         ${inputTokens}, ${outputTokens}, ${costUsd}, ${feature}, ${markupCharged})
    `);

    // 2. Deduct 1 credit + accrue spend on tenants row
    await db.execute(sql`
      UPDATE tenants
      SET
        ai_credits_remaining = GREATEST(0, COALESCE(ai_credits_remaining, 0) - 1),
        ai_spend_mtd = COALESCE(ai_spend_mtd, 0) + ${costUsd}
      WHERE id::text = ${tenantId}
    `);

    // 3. Upsert monthly summary
    const month = new Date().toISOString().slice(0, 7) + "-01";
    await db.execute(sql`
      INSERT INTO ai_usage_summary (tenant_id, month, total_calls, total_tokens, total_cost_usd, total_charged)
      VALUES (${tenantId}::uuid, ${month}::date, 1, ${inputTokens + outputTokens}, ${costUsd}, ${markupCharged})
      ON CONFLICT (tenant_id, month)
      DO UPDATE SET
        total_calls     = ai_usage_summary.total_calls + 1,
        total_tokens    = ai_usage_summary.total_tokens + EXCLUDED.total_tokens,
        total_cost_usd  = ai_usage_summary.total_cost_usd + EXCLUDED.total_cost_usd,
        total_charged   = ai_usage_summary.total_charged + EXCLUDED.total_charged
    `);
  } catch (e: any) {
    // Never fail a user-facing request due to logging errors
    console.warn("[AI Credits] Usage logging error (non-blocking):", e.message?.slice(0, 100));
  }
}

// ═══════════════════════════════════════════════════════════════
// USAGE DASHBOARD — data for the frontend /api/ai/usage
// ═══════════════════════════════════════════════════════════════

export async function getUsageDashboard(tenantId: string) {
  try {
    // Tenant credits & plan
    const tenantR = await db.execute(sql`
      SELECT ai_credits_remaining, ai_credits_monthly, ai_spend_mtd,
             subscription_plan, plan, settings
      FROM tenants WHERE id::text = ${tenantId} LIMIT 1
    `);
    const tenant = (tenantR.rows[0] as any) || {};
    const plan = tenant.subscription_plan || tenant.plan || "starter";
    const monthlyLimit = PLAN_CREDITS[plan] ?? 200;
    const aiSettings = tenant.settings?.ai || {};
    const hasOwnKey = !!aiSettings.apiKey;

    // Current-month breakdown by feature (from ai_usage)
    const month = new Date().toISOString().slice(0, 7);
    const byFeature = await db.execute(sql`
      SELECT
        COALESCE(feature, 'general') AS feature,
        COUNT(*)::int                AS calls,
        SUM(tokens_input)::int       AS input_tokens,
        SUM(tokens_output)::int      AS output_tokens,
        SUM(cost_usd)                AS cost_usd
      FROM ai_usage
      WHERE tenant_id::text = ${tenantId}
        AND to_char(created_at, 'YYYY-MM') = ${month}
      GROUP BY feature
      ORDER BY calls DESC
    `);

    // Last 30-day call history (daily buckets)
    const history = await db.execute(sql`
      SELECT
        to_char(created_at, 'YYYY-MM-DD') AS day,
        COUNT(*)::int                       AS calls
      FROM ai_usage
      WHERE tenant_id::text = ${tenantId}
        AND created_at >= now() - interval '30 days'
      GROUP BY day
      ORDER BY day
    `);

    const creditsUsed = (monthlyLimit === -1) ? 0 :
      (monthlyLimit - Math.max(0, tenant.ai_credits_remaining ?? monthlyLimit));

    return {
      plan,
      hasOwnKey,
      monthlyLimit,
      creditsRemaining: hasOwnKey ? -1 : (tenant.ai_credits_remaining ?? monthlyLimit),
      creditsUsed,
      spendMtd: Number(tenant.ai_spend_mtd || 0).toFixed(4),
      byFeature: byFeature.rows,
      history: history.rows,
    };
  } catch (e: any) {
    console.warn("[AI Credits] Dashboard query error:", e.message?.slice(0, 100));
    return { plan: "starter", hasOwnKey: false, monthlyLimit: 200, creditsRemaining: 200, creditsUsed: 0, spendMtd: "0.0000", byFeature: [], history: [] };
  }
}

// ═══════════════════════════════════════════════════════════════
// MONTHLY CREDIT RESET UTILITY
// ═══════════════════════════════════════════════════════════════

export async function resetMonthlyCredits(): Promise<void> {
  try {
    await db.execute(sql`
      UPDATE tenants t
      SET
        ai_credits_remaining = CASE
          WHEN COALESCE(t.subscription_plan, t.plan) = 'trial'        THEN 50
          WHEN COALESCE(t.subscription_plan, t.plan) = 'trialing'     THEN 50
          WHEN COALESCE(t.subscription_plan, t.plan) = 'free'         THEN 50
          WHEN COALESCE(t.subscription_plan, t.plan) = 'starter'      THEN 200
          WHEN COALESCE(t.subscription_plan, t.plan) = 'professional' THEN 500
          WHEN COALESCE(t.subscription_plan, t.plan) = 'business'     THEN 1000
          ELSE COALESCE(ai_credits_remaining, 200)
        END,
        ai_spend_mtd = 0
    `);
    console.log("[AI Credits] Monthly credits reset complete");
  } catch (e: any) {
    console.warn("[AI Credits] Monthly reset error:", e.message);
  }
}
