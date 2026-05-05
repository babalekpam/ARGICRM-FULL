/**
 * Debate mode — multi-specialist turn-taking, 2 rounds.
 *
 * v1 simulates specialists by varying the system prompt; later, this can
 * resolve real AGENT_DEFINITIONS personas + tool calls. Round 2 sees Round
 * 1's collective output and revises.
 */
import { complete } from "../ai-adapter.js";

export interface DebateParticipant {
  kind: "agent";
  name: string;
  systemPrompt?: string;
}

export interface DebateRound {
  round: number;
  statements: Array<{ participant: string; text: string }>;
}

function roleFor(name: string): string {
  switch (name.toLowerCase()) {
    case "closer":          return "Senior Account Executive focused on closing momentum, objections, and buyer signals.";
    case "riskanalyst":     return "Risk officer focused on legal, credit, executive-sponsor, and integration risk.";
    case "aria-moderator":  return "Chief of Staff moderating a deal-review committee. Synthesise positions and reach a recommendation with explicit dissent.";
    case "financeagent":    return "Finance partner focused on margin, cash conversion, currency exposure, and downstream invoicing risk.";
    case "leadscorer":      return "Lead-scoring specialist focused on ICP fit, intent signals, and conversion probability.";
    default:                return "Subject-matter expert. Be specific, brief, and cite the exact factor driving your vote.";
  }
}

export async function runDebate(
  topicPrompt: string,
  participants: DebateParticipant[],
  rounds: number = 2,
): Promise<{ rounds: DebateRound[]; finalStatements: Array<{ participant: string; text: string }> }> {
  const transcript: DebateRound[] = [];

  // Round 1: independent positions, no cross-talk.
  const round1 = await Promise.all(participants.map(async p => {
    const sys = p.systemPrompt || `You are "${p.name}". ${roleFor(p.name)} You are contributing to a committee. Be specific and brief.`;
    const text = await complete({
      system: sys,
      messages: [{ role: "user", content: topicPrompt }],
      maxTokens: 600,
      temperature: 0.4,
    }).catch(err => `[error from ${p.name}: ${String(err?.message || err).slice(0, 120)}]`);
    return { participant: p.name, text };
  }));
  transcript.push({ round: 1, statements: round1 });

  if (rounds < 2) return { rounds: transcript, finalStatements: round1 };

  // Round 2: each participant sees others' positions and revises.
  const round1Summary = round1.map(s => `[${s.participant}] ${s.text}`).join("\n\n---\n\n");
  const round2 = await Promise.all(participants.map(async p => {
    const own = round1.find(s => s.participant === p.name)?.text || "";
    const sys = p.systemPrompt || `You are "${p.name}". ${roleFor(p.name)} Refine your position after hearing the committee.`;
    const text = await complete({
      system: sys,
      messages: [
        { role: "user", content: topicPrompt },
        { role: "assistant", content: `My initial position:\n\n${own}` },
        { role: "user", content:
          `Other committee members said:\n\n${round1Summary}\n\n` +
          `Given these views, return your FINAL position as STRICT JSON only:\n` +
          `{"vote":"approve"|"reject"|"defer","confidence":0.0..1.0,"reasoning":"<one paragraph>"}`
        },
      ],
      maxTokens: 600,
      temperature: 0.3,
    }).catch(err => `[error from ${p.name}: ${String(err?.message || err).slice(0, 120)}]`);
    return { participant: p.name, text };
  }));
  transcript.push({ round: 2, statements: round2 });

  return { rounds: transcript, finalStatements: round2 };
}
