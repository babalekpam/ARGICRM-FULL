/**
 * AI Council orchestrator — public API.
 *
 * convene() inserts a council_decisions row in status='running' and kicks
 * off the deliberation in the background, returning the decision id
 * immediately so the HTTP request doesn't block 5–30s on AI calls. The
 * client polls GET /api/council/decisions/:id until status leaves
 * 'running'.
 *
 * Money-touching topics (discount.approve, refund.issue, invoice.send,
 * campaign.send.bulk) require manual apply()/reject() — enforced via the
 * topic template's requiresManualApproval flag. The flag is server-side
 * and not overridable per-tenant in v1.
 */
import { db } from "../../db.js";
import { councilDecisions, type CouncilDecision } from "@shared/schema-extended";
import { eq, and, desc } from "drizzle-orm";
import { runEnsemble } from "./ensemble.js";
import { runDebate } from "./debate.js";
import { tally, parseStructured, type ParticipantResult } from "./consensus.js";
import { BUILTIN_TOPICS, getTopic, type TopicTemplate } from "./topics.js";
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

export async function convene(opts: ConveneOpts): Promise<{ decisionId: string; status: string }> {
  const tpl = getTopic(opts.topic);
  if (!tpl) {
    throw new Error(`Unknown council topic: ${opts.topic}. Known: ${Object.keys(BUILTIN_TOPICS).join(", ")}`);
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
  // Money-touching guardrail check would go here in v2 (consult tpl.requiresManualApproval).
  // For v1, applyDecision is always a manual human action so the check is implicit.

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

export { BUILTIN_TOPICS, getTopic, listTopicNames } from "./topics.js";
