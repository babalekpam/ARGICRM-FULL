/**
 * AI Council — built-in topic templates.
 *
 * Tenant-specific overrides may exist in council_topics; the orchestrator
 * checks the DB first, then falls back to these defaults.
 *
 * Money-touching topics (discount.approve, refund.issue, invoice.send,
 * campaign.send.bulk) are *always* manual-approval. The autopilot flag
 * is a topic property, not a per-tenant override (server-enforced).
 */

export interface TopicTemplate {
  description: string;
  defaultMode: "ensemble" | "debate";
  defaultParticipants: Array<{ kind: "provider" | "agent"; name: string; weight?: number }>;
  requiresManualApproval: boolean;
  minPlan: "trial" | "starter" | "professional" | "business" | "enterprise";
  systemPromptTemplate: string;
  guardrails: { maxLatencyMs: number; maxCredits: number };
}

export const BUILTIN_TOPICS: Record<string, TopicTemplate> = {
  "discount.approve": {
    description: "Approve or reject a discount on a deal. Considers margin, precedent, and competitive context.",
    defaultMode: "ensemble",
    defaultParticipants: [
      { kind: "provider", name: "anthropic" },
      { kind: "provider", name: "openai" },
      { kind: "provider", name: "google" },
    ],
    requiresManualApproval: true, // Money-touching — always manual
    minPlan: "professional",
    systemPromptTemplate:
`You are a senior sales-operations analyst evaluating a discount request.

Context (deal + customer + discount details):
{{inputs}}

Decide whether to approve, reject, or defer (need more info).
Weigh: deal size, customer fit, margin impact, precedent risk, competitive
positioning, time-to-close pressure.

Return STRICT JSON only — no prose, no markdown:
{"vote":"approve"|"reject"|"defer","confidence":0.0..1.0,"reasoning":"<one paragraph>"}`,
    guardrails: { maxLatencyMs: 30_000, maxCredits: 10 },
  },

  "lead.score": {
    description: "Score a lead's likelihood to convert in the next 90 days.",
    defaultMode: "ensemble",
    defaultParticipants: [
      { kind: "provider", name: "anthropic" },
      { kind: "provider", name: "openai" },
    ],
    requiresManualApproval: false, // Allowed in autopilot
    minPlan: "starter",
    systemPromptTemplate:
`You are a lead-scoring analyst. Score this lead 0-100 for likelihood to
convert in the next 90 days.

Lead:
{{inputs}}

Weigh: ICP fit, intent signals, seniority, company size, urgency, recent
engagement signals, channel quality.

Return STRICT JSON only:
{"vote":"approve","confidence":0.0..1.0,"score":0..100,"reasoning":"<one paragraph>"}

Use vote="approve" if score >= 60, "defer" if 30-59, "reject" if < 30.`,
    guardrails: { maxLatencyMs: 20_000, maxCredits: 5 },
  },

  "deal.advance": {
    description: "Should this deal advance to the next pipeline stage? Multi-specialist debate.",
    defaultMode: "debate",
    defaultParticipants: [
      { kind: "agent", name: "Closer" },
      { kind: "agent", name: "RiskAnalyst" },
      { kind: "agent", name: "ARIA-Moderator" },
    ],
    requiresManualApproval: true,
    minPlan: "professional",
    systemPromptTemplate:
`A sales deal review committee evaluates whether this deal should advance
to the next pipeline stage.

Deal:
{{inputs}}

Each committee member contributes from their domain:
 - Closer: momentum, objections handled, buyer signals.
 - RiskAnalyst: legal, credit, executive sponsor risk.
 - ARIA-Moderator: synthesis + final recommendation.

Return STRICT JSON only:
{"vote":"approve"|"reject"|"defer","confidence":0.0..1.0,"reasoning":"<one paragraph>"}`,
    guardrails: { maxLatencyMs: 60_000, maxCredits: 15 },
  },
};

export function getTopic(name: string): TopicTemplate | null {
  return BUILTIN_TOPICS[name] ?? null;
}

export function listTopicNames(): string[] {
  return Object.keys(BUILTIN_TOPICS);
}
