/**
 * Vote tally + dissent extraction for council deliberations.
 *
 * Treats votes as nominal (approve/reject/defer/unknown), no weights for v1.
 * Confidence = (majority count) / (non-unknown count). Dissenters = anyone
 * who voted against the majority with a non-unknown vote.
 */

export type Vote = "approve" | "reject" | "defer" | "unknown";

export interface ParticipantResult {
  participant: string;
  vote: Vote;
  confidence: number;
  reasoning: string;
  raw: string;
  ok?: boolean;
  score?: number; // optional, used by lead.score topic
}

export function tally(results: ParticipantResult[]) {
  const nonUnknown = results.filter(r => r.vote !== "unknown");
  const counts: Record<Vote, number> = { approve: 0, reject: 0, defer: 0, unknown: 0 };
  for (const r of results) counts[r.vote]++;

  const order: Vote[] = ["approve", "reject", "defer"];
  let majority: Vote = "defer";
  let max = 0;
  for (const v of order) {
    if (counts[v] > max) { max = counts[v]; majority = v; }
  }

  const total = Math.max(1, nonUnknown.length);
  const confidence = max / total;

  const dissent = nonUnknown
    .filter(r => r.vote !== majority)
    .map(r => ({
      participant: r.participant,
      position: r.vote,
      why: r.reasoning?.slice(0, 500) || "",
    }));

  return { majority, confidence, dissent };
}

/**
 * Tolerant JSON extractor. Models often wrap their JSON in ```json ... ``` or
 * preamble it with a sentence; we strip those, find the first {...} block,
 * and parse. Failure returns vote="unknown" so the deliberation can still
 * complete (just with reduced confidence).
 */
export function parseStructured(text: string): {
  vote: Vote; confidence: number; reasoning: string; score?: number;
} {
  if (!text) return { vote: "unknown", confidence: 0, reasoning: "" };
  const cleaned = text.replace(/```json|```/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return { vote: "unknown", confidence: 0, reasoning: text.slice(0, 200) };
  try {
    const obj = JSON.parse(match[0]);
    const voteRaw = String(obj.vote || "").toLowerCase();
    const vote: Vote = (voteRaw === "approve" || voteRaw === "reject" || voteRaw === "defer")
      ? voteRaw : "unknown";
    const confRaw = typeof obj.confidence === "number" ? obj.confidence : 0.5;
    return {
      vote,
      confidence: Math.max(0, Math.min(1, confRaw)),
      reasoning: typeof obj.reasoning === "string" ? obj.reasoning : "",
      score: typeof obj.score === "number" ? obj.score : undefined,
    };
  } catch {
    return { vote: "unknown", confidence: 0, reasoning: text.slice(0, 200) };
  }
}
