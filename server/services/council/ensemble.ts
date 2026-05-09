/**
 * Ensemble mode — fan out the same prompt across N providers in parallel,
 * then return their raw responses (parsing happens in consensus.ts).
 */
import { complete, type AIProvider } from "../ai-adapter.js";

export interface EnsembleResult {
  provider: AIProvider;
  text: string;
  ok: boolean;
  errorMessage?: string;
}

export async function runEnsemble(prompt: string, providers: AIProvider[]): Promise<EnsembleResult[]> {
  const settled = await Promise.allSettled(
    providers.map(p =>
      complete({
        messages: [{ role: "user", content: prompt }],
        provider: p,
        maxTokens: 800,
        temperature: 0.3, // Low temperature for structured-decision tasks
      }).then(text => ({ provider: p, text, ok: true } as EnsembleResult))
       .catch(err => ({
         provider: p, text: "", ok: false,
         errorMessage: String(err?.message || err).slice(0, 200),
       } as EnsembleResult))
    )
  );
  return settled.map((s, i) =>
    s.status === "fulfilled" ? s.value :
    { provider: providers[i], text: "", ok: false, errorMessage: String((s as any).reason).slice(0, 200) }
  );
}
