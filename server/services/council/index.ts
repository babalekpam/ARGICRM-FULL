/**
 * AI Council orchestrator — public API.
 *
 * convene() inserts a council_decisions row in status='running' and kicks
 * off the deliberation in the background, returning the decision id
 * immediately so the HTTP request doesn't block 5–30s on AI calls. The
 * client polls GET /api/council/decisions/:id until status leaves
 * 'running'.
 *
 * Plan-tier gating: each topic declares a minPlan; convene() resolves the
 * tenant's current plan from the tenants table and rejects with HTTP 402
 * (UpgradeRequiredError shape) if the plan is below the topic's floor.
 *
 * Money-touching topics (discount.approve, refund.issue, invoice.send,
 * campaign.send.bulk) require manual apply()/reject() — enforced via the
 * topic template's requiresManualApproval flag. The flag is server-side
 * and not overridable per-tenant in v1.
 */
import { db } from "../../db.js";
import { councilDecisions, type CouncilDecision } from "@shared/schema-extended";
import { tenants } from "@shared/schema";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { runEnsemble } from "./ensemble.js";
import { runDebate } from "./debate.js";
import { tally, parseStructured, type ParticipantResult } from "./consensus.js";
import { BUILTIN_TOPICS, getTopic, type TopicTemplate } from "./topics.js";
import { planAtLeast, PLAN_HIERARCHY, type PlanId } from "@shared/plans";
import type { AIProvider } from "../ai-adapter.js";

export interface ConveneOpts {
  tenantId: string;
  triggeredBy?: string | null;
  triggerSource?: "ui" | "workflow" | "api" | "agent";
  topic: string;
  mode?: "ensemble" | "debate";
  inputs: Record<string, any>;
  participants?: Array<{ kind: "provider" | "agent"; name: string; weight?: number }>;
}

export class CouncilPlanError extends Error {
  code = "PLAN_UPGRADE_REQUIRED";
  status = 402;
  currentPlan: string;
  requiredPlan: string;
  constructor(currentPlan: string, requiredPlan: string) {
    super(`This topic requires the '${requiredPlan}' plan or higher (current: '${currentPlan}').`);
    this.currentPlan = currentPlan;
    this.requiredPlan = requiredPlan;
  }
}

export class CouncilQuotaError extends Error {
  code = "COUNCIL_QUOTA_EXCEEDED";
  status = 429;
  used: number;
  limit: number;
  constructor(used: number, limit: number) {
    super(`Monthly council quota exceeded (${used}/${limit}). Upgrade your plan or wait until next month.`);
    this.used = used;
    this.limit = limit;
  }
}

// Per-plan monthly council-decision allowance. -1 = unlimited.
const COUNCIL_MONTHLY_QUOTA: Record<PlanId, number> = {
  trial:        5,
  starter:      50,
  professional: 500,
  business:     2000,
  enterprise:   -1,
};

async function resolveTenantPlan(tenantId: string): Promise<PlanId> {
  const rows = await db.select({
    plan: tenants.plan,
    subscriptionPlan: tenants.subscriptionPlan,
  }).from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  const r = rows[0] as any;
  const raw = (r?.subscriptionPlan || r?.plan || "trial").toLowerCase();
  // Coerce unknown plan values back to 'trial' rather than crashing.
  return (PLAN_HIERARCHY as readonly string[]).includes(raw) ? (raw as PlanId) : "trial";
}

async function countDecisionsThisMonth(tenantId: string): Promise<number> {
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const r = await db.execute(sql`
    SELECT count(*)::int AS n
    FROM council_decisions
    WHERE tenant_id = ${tenantId} AND created_at >= ${monthStart.toISOString()}::timestamp
  `);
  return Number((r.rows[0] as any)?.n || 0);
}

export async function convene(opts: ConveneOpts): Promise<{ decisionId: string; status: string }> {
  const tpl = getTopic(opts.topic);
  if (!tpl) {
    throw new Error(`Unknown council topic: ${opts.topic}. Known: ${Object.keys(BUILTIN_TOPICS).join(", ")}`);
  }

  // ─── Plan-tier gating ──────────────────────────────────────
  const tenantPlan = await resolveTenantPlan(opts.tenantId);
  if (!planAtLeast(tenantPlan, tpl.minPlan as PlanId)) {
    throw new CouncilPlanError(tenantPlan, tpl.minPlan);
  }

  // ─── Monthly quota gate ────────────────────────────────────
  const monthlyLimit = COUNCIL_MONTHLY_QUOTA[tenantPlan];
  if (monthlyLimit !== -1) {
    const used = await countDecisionsThisMonth(opts.tenantId);
    if (used >= monthlyLimit) {
      throw new CouncilQuotaError(used, monthlyLimit);
    }
  }

  const mode = opts.mode || tpl.defaultMode;
  const participants = opts.participants?.length ? opts.participants : tpl.defaultParticipants;

  const [row] = await db.insert(councilDecisions).values({
    tenantId: opts.tenantId,
    topic: opts.topic,
    mode,
    status: "running",
    inputs: opts.inputs,
    participants,
    triggeredBy: opts.triggeredBy ?? null,
    triggerSource: opts.triggerSource ?? "api",
  }).returning();

  // Run deliberation in background. Errors are caught and written to the row.
  setImmediate(() => {
    runDeliberation(row.id, tpl, opts, mode, participants).catch(async e => {
      console.error("[COUNCIL] deliberation crashed for", row.id, ":", String(e?.message || e).slice(0, 200));
      await db.update(councilDecisions)
        .set({
          status: "failed",
          outcome: { error: String(e?.message || e).slice(0, 500) },
          latencyMs: 0,
        })
        .where(eq(councilDecisions.id, row.id))
        .catch(() => {});
    });
  });

  return { decisionId: row.id, status: "running" };
}

async function runDeliberation(
  decisionId: string,
  tpl: TopicTemplate,
  opts: ConveneOpts,
  mode: "ensemble" | "debate",
  participants: Array<{ kind: "provider" | "agent"; name: string; weight?: number }>,
) {
  const startTime = Date.now();
  const prompt = tpl.systemPromptTemplate.replace("{{inputs}}", JSON.stringify(opts.inputs, null, 2));

  let outcome: any;
  let dissent: any[] = [];
  let rounds: any[] = [];
  let costCredits = 0;

  if (mode === "ensemble") {
    const providers = participants
      .filter(p => p.kind === "provider")
      .map(p => p.name as AIProvider);
    if (providers.length === 0) throw new Error("Ensemble mode requires at least one provider participant");

    const results = await runEnsemble(prompt, providers);
    const parsed: ParticipantResult[] = results.map(r => ({
      participant: r.provider,
      ...parseStructured(r.text),
      raw: r.text,
      ok: r.ok,
    }));
    const consensus = tally(parsed);
    outcome = {
      recommendation: consensus.majority,
      vote: consensus.majority,
      confidence: consensus.confidence,
      reasons: parsed
        .filter(p => p.vote !== "unknown")
        .map(p => `${p.participant} (${p.vote}): ${p.reasoning?.slice(0, 240) || ""}`)
        .slice(0, 5),
    };
    dissent = consensus.dissent;
    rounds = [{
      round: 1,
      statements: parsed.map(p => ({
        participant: p.participant,
        vote: p.vote,
        confidence: p.confidence,
        text: (p.reasoning || "").slice(0, 1000),
        ok: p.ok,
      })),
    }];
    costCredits = providers.length; // 1 credit per provider call in ensemble v1
  } else {
    // debate
    const agentParticipants = participants
      .filter(p => p.kind === "agent")
      .map(p => ({ kind: "agent" as const, name: p.name }));
    if (agentParticipants.length === 0) throw new Error("Debate mode requires at least one agent participant");

    const debate = await runDebate(prompt, agentParticipants, 2);
    const finalParsed: ParticipantResult[] = debate.finalStatements.map(s => ({
      participant: s.participant,
      ...parseStructured(s.text),
      raw: s.text,
    }));
    const consensus = tally(finalParsed);
    outcome = {
      recommendation: consensus.majority,
      vote: consensus.majority,
      confidence: consensus.confidence,
      reasons: finalParsed
        .filter(p => p.vote !== "unknown")
        .map(p => `${p.participant} (${p.vote}): ${p.reasoning?.slice(0, 240) || ""}`)
        .slice(0, 5),
    };
    dissent = consensus.dissent;
    rounds = debate.rounds;
    costCredits = agentParticipants.length * 2; // 2 rounds per agent
  }

  await db.update(councilDecisions).set({
    status: "succeeded",
    rounds,
    outcome,
    dissent,
    costCredits,
    latencyMs: Date.now() - startTime,
  }).where(eq(councilDecisions.id, decisionId));
}

export async function getDecision(decisionId: string, tenantId: string): Promise<CouncilDecision | null> {
  const rows = await db.select().from(councilDecisions)
    .where(and(eq(councilDecisions.id, decisionId), eq(councilDecisions.tenantId, tenantId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function listDecisions(tenantId: string, limit = 50): Promise<CouncilDecision[]> {
  return db.select().from(councilDecisions)
    .where(eq(councilDecisions.tenantId, tenantId))
    .orderBy(desc(councilDecisions.createdAt))
    .limit(limit);
}

export async function applyDecision(decisionId: string, tenantId: string, approvedBy: string) {
  const decision = await getDecision(decisionId, tenantId);
  if (!decision) throw new Error("Decision not found");
  if (decision.status !== "succeeded") {
    throw new Error(`Cannot apply decision in status '${decision.status}'. Status must be 'succeeded'.`);
  }

  await db.update(councilDecisions).set({
    status: "applied",
    approvedBy,
    appliedAt: new Date(),
  }).where(eq(councilDecisions.id, decisionId));

  return { applied: true, decisionId };
}

export async function rejectDecision(decisionId: string, tenantId: string, approvedBy: string) {
  const decision = await getDecision(decisionId, tenantId);
  if (!decision) throw new Error("Decision not found");

  await db.update(councilDecisions).set({
    status: "rejected_by_human",
    approvedBy,
    appliedAt: new Date(),
  }).where(eq(councilDecisions.id, decisionId));

  return { rejected: true, decisionId };
}

/**
 * Council usage summary for the cost-transparency dashboard.
 * Returns: monthly quota, used count this month, status breakdown,
 * topic breakdown, average confidence, total credits + USD cost,
 * and a 30-day daily history for charting.
 */
export async function getUsage(tenantId: string) {
  const plan = await resolveTenantPlan(tenantId);
  const monthlyLimit = COUNCIL_MONTHLY_QUOTA[plan];

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const month = await db.execute(sql`
    SELECT
      count(*)::int                                     AS total_calls,
      coalesce(sum(cost_credits), 0)::int               AS total_credits,
      coalesce(sum(cost_usd), 0)                         AS total_cost_usd,
      coalesce(avg((outcome->>'confidence')::numeric), 0) AS avg_confidence,
      sum(case when status = 'succeeded' then 1 else 0 end)::int AS succeeded,
      sum(case when status = 'failed'    then 1 else 0 end)::int AS failed,
      sum(case when status = 'applied'   then 1 else 0 end)::int AS applied,
      sum(case when status = 'rejected_by_human' then 1 else 0 end)::int AS rejected
    FROM council_decisions
    WHERE tenant_id = ${tenantId} AND created_at >= ${monthStart.toISOString()}::timestamp
  `);
  const summary = (month.rows[0] as any) || {};

  const byTopic = await db.execute(sql`
    SELECT topic,
           count(*)::int                                AS calls,
           coalesce(avg((outcome->>'confidence')::numeric), 0) AS avg_confidence,
           coalesce(avg(jsonb_array_length(coalesce(dissent, '[]'::jsonb))), 0) AS avg_dissent,
           coalesce(sum(cost_credits), 0)::int           AS credits,
           coalesce(sum(cost_usd), 0)                    AS cost_usd
    FROM council_decisions
    WHERE tenant_id = ${tenantId} AND created_at >= ${monthStart.toISOString()}::timestamp
    GROUP BY topic
    ORDER BY calls DESC
  `);

  const history = await db.execute(sql`
    SELECT to_char(created_at, 'YYYY-MM-DD') AS day,
           count(*)::int                       AS calls,
           coalesce(sum(cost_credits), 0)::int AS credits
    FROM council_decisions
    WHERE tenant_id = ${tenantId} AND created_at >= now() - interval '30 days'
    GROUP BY day
    ORDER BY day
  `);

  return {
    plan,
    monthlyLimit,
    used: Number(summary.total_calls || 0),
    remaining: monthlyLimit === -1 ? -1 : Math.max(0, monthlyLimit - Number(summary.total_calls || 0)),
    totalCredits: Number(summary.total_credits || 0),
    totalCostUsd: Number(summary.total_cost_usd || 0).toFixed(4),
    avgConfidence: Number(summary.avg_confidence || 0),
    statusBreakdown: {
      succeeded: Number(summary.succeeded || 0),
      failed:    Number(summary.failed || 0),
      applied:   Number(summary.applied || 0),
      rejected:  Number(summary.rejected || 0),
    },
    byTopic: byTopic.rows,
    history: history.rows,
  };
}

export { BUILTIN_TOPICS, getTopic, listTopicNames } from "./topics.js";
export { COUNCIL_MONTHLY_QUOTA };
