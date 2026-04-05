/**
 * ARGILETTE UNIVERSAL AI ADAPTER
 *
 * Anthropic Claude is the PRIMARY and PREFERRED provider.
 * When ANTHROPIC_API_KEY is present it is ALWAYS used — no env var can
 * override this.  Other providers are only reached in two scenarios:
 *   a) A tenant supplies their own non-Anthropic key
 *   b) An explicit `provider` override is passed to complete()
 *
 * Fallback order (only used when Anthropic key is absent):
 *   2. OpenAI GPT-4        (OPENAI_API_KEY)
 *   3. Google Gemini       (GOOGLE_AI_KEY)
 *   4. Groq (Llama 3.3)   (GROQ_API_KEY)
 *   5. Mistral             (MISTRAL_API_KEY)
 *   6. Cohere              (COHERE_API_KEY)
 *   7. Together AI         (TOGETHER_API_KEY)
 *   8. Fireworks AI        (FIREWORKS_API_KEY)
 *   9. Perplexity          (PERPLEXITY_API_KEY)
 *  10. Ollama              (OLLAMA_BASE_URL)
 */

import axios from "axios";
import { askClaude, streamClaude } from "./claude.js";

// ═══════════════════════════════════════════════════════════════
// PROVIDER DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export type AIProvider =
  | "anthropic" | "openai" | "google" | "groq"
  | "mistral" | "cohere" | "together" | "fireworks"
  | "perplexity" | "ollama";

interface ProviderConfig {
  name: string;
  envKey: string;
  baseUrl: string;
  defaultModel: string;
  fastModel: string;
  maxTokensKey: string; // field name for max tokens
  format: "anthropic" | "openai"; // API format
  available: () => boolean;
}

const PROVIDERS: Record<AIProvider, ProviderConfig> = {
  anthropic: {
    name: "Anthropic Claude",
    envKey: "ANTHROPIC_API_KEY",
    baseUrl: "https://api.anthropic.com",
    defaultModel: "claude-sonnet-4-5",
    fastModel: "claude-haiku-4-5",
    maxTokensKey: "max_tokens",
    format: "anthropic",
    available: () => !!process.env.ANTHROPIC_API_KEY,
  },
  openai: {
    name: "OpenAI GPT-4",
    envKey: "OPENAI_API_KEY",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o",
    fastModel: "gpt-4o-mini",
    maxTokensKey: "max_tokens",
    format: "openai",
    available: () => !!process.env.OPENAI_API_KEY,
  },
  google: {
    name: "Google Gemini",
    envKey: "GOOGLE_AI_KEY",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-1.5-pro",
    fastModel: "gemini-1.5-flash",
    maxTokensKey: "max_tokens",
    format: "openai",
    available: () => !!process.env.GOOGLE_AI_KEY,
  },
  groq: {
    name: "Groq (Llama 3.3)",
    envKey: "GROQ_API_KEY",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
    fastModel: "llama-3.1-8b-instant",
    maxTokensKey: "max_tokens",
    format: "openai",
    available: () => !!process.env.GROQ_API_KEY,
  },
  mistral: {
    name: "Mistral",
    envKey: "MISTRAL_API_KEY",
    baseUrl: "https://api.mistral.ai/v1",
    defaultModel: "mistral-large-latest",
    fastModel: "mistral-small-latest",
    maxTokensKey: "max_tokens",
    format: "openai",
    available: () => !!process.env.MISTRAL_API_KEY,
  },
  cohere: {
    name: "Cohere Command",
    envKey: "COHERE_API_KEY",
    baseUrl: "https://api.cohere.ai/compatibility/v1",
    defaultModel: "command-r-plus",
    fastModel: "command-r",
    maxTokensKey: "max_tokens",
    format: "openai",
    available: () => !!process.env.COHERE_API_KEY,
  },
  together: {
    name: "Together AI",
    envKey: "TOGETHER_API_KEY",
    baseUrl: "https://api.together.xyz/v1",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    fastModel: "meta-llama/Llama-3.2-3B-Instruct-Turbo",
    maxTokensKey: "max_tokens",
    format: "openai",
    available: () => !!process.env.TOGETHER_API_KEY,
  },
  fireworks: {
    name: "Fireworks AI",
    envKey: "FIREWORKS_API_KEY",
    baseUrl: "https://api.fireworks.ai/inference/v1",
    defaultModel: "accounts/fireworks/models/llama-v3p3-70b-instruct",
    fastModel: "accounts/fireworks/models/llama-v3p1-8b-instruct",
    maxTokensKey: "max_tokens",
    format: "openai",
    available: () => !!process.env.FIREWORKS_API_KEY,
  },
  perplexity: {
    name: "Perplexity",
    envKey: "PERPLEXITY_API_KEY",
    baseUrl: "https://api.perplexity.ai",
    defaultModel: "llama-3.1-sonar-large-128k-online",
    fastModel: "llama-3.1-sonar-small-128k-online",
    maxTokensKey: "max_tokens",
    format: "openai",
    available: () => !!process.env.PERPLEXITY_API_KEY,
  },
  ollama: {
    name: "Ollama (Local)",
    envKey: "OLLAMA_BASE_URL",
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1",
    defaultModel: process.env.OLLAMA_MODEL || "llama3.2",
    fastModel: process.env.OLLAMA_MODEL || "llama3.2",
    maxTokensKey: "max_tokens",
    format: "openai",
    available: () => !!process.env.OLLAMA_BASE_URL,
  },
};

// ═══════════════════════════════════════════════════════════════
// PROVIDER DETECTION
// ═══════════════════════════════════════════════════════════════

export function getAvailableProviders(): AIProvider[] {
  // Anthropic is unconditionally first when the key is present.
  // No env var can push it out of position — it is always the preferred provider.
  if (PROVIDERS.anthropic.available()) {
    const rest: AIProvider[] = [
      "openai", "google", "groq", "mistral",
      "cohere", "together", "fireworks", "perplexity", "ollama",
    ];
    return ["anthropic", ...rest.filter(p => PROVIDERS[p].available())];
  }

  // Anthropic key absent — respect AI_PROVIDER override or full fallback chain.
  const override = process.env.AI_PROVIDER as AIProvider;
  if (override && PROVIDERS[override]?.available()) return [override];

  const fallback: AIProvider[] = [
    "openai", "google", "groq", "mistral",
    "cohere", "together", "fireworks", "perplexity", "ollama",
  ];
  return fallback.filter(p => PROVIDERS[p].available());
}

export function getActiveProvider(): AIProvider | null {
  const available = getAvailableProviders();
  return available[0] || null;
}

export function isAIAvailable(): boolean {
  return getAvailableProviders().length > 0;
}

export function getProviderInfo(): {
  provider: AIProvider | null;
  name: string;
  model: string;
  available: AIProvider[];
} {
  const provider = getActiveProvider();
  const available = getAvailableProviders();
  if (!provider) return { provider: null, name: "None", model: "None", available: [] };

  const config = PROVIDERS[provider];
  return {
    provider,
    name: config.name,
    model: config.defaultModel,
    available,
  };
}

// ═══════════════════════════════════════════════════════════════
// UNIVERSAL COMPLETION FUNCTION
// ═══════════════════════════════════════════════════════════════

export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AICompletionOpts {
  messages: AIMessage[];
  system?: string;
  maxTokens?: number;
  temperature?: number;
  fast?: boolean; // use faster/cheaper model variant
  provider?: AIProvider; // force a specific provider
  tenantApiKey?: string; // tenant's own API key (bypasses platform key)
}

export async function complete(opts: AICompletionOpts): Promise<string> {
  const providers = opts.provider ? [opts.provider] : getAvailableProviders();

  if (providers.length === 0) {
    throw new Error(
      "No AI provider configured. Add one of these to your environment:\n" +
      "ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_AI_KEY, GROQ_API_KEY,\n" +
      "MISTRAL_API_KEY, COHERE_API_KEY, TOGETHER_API_KEY, FIREWORKS_API_KEY,\n" +
      "PERPLEXITY_API_KEY, or OLLAMA_BASE_URL (for local Ollama)"
    );
  }

  // Try each provider in order until one works
  let lastError: Error | null = null;

  for (const providerName of providers) {
    const config = PROVIDERS[providerName];
    const model = opts.fast ? config.fastModel : config.defaultModel;

    try {
      if (config.format === "anthropic") {
        return await callAnthropic(config, model, opts);
      } else {
        return await callOpenAICompatible(config, providerName, model, opts);
      }
    } catch (err: any) {
      lastError = err;
      // Only try next provider if it's a credential/rate limit issue
      const msg = err.message?.toLowerCase() || "";
      const shouldFallback = msg.includes("401") || msg.includes("403") ||
        msg.includes("rate") || msg.includes("quota") ||
        msg.includes("exceeded") || msg.includes("unavailable");

      if (!shouldFallback) throw err; // Don't fallback for logic errors
      console.warn(`[AI] ${config.name} failed (${err.message?.slice(0, 60)}), trying next provider...`);
    }
  }

  throw lastError || new Error("All AI providers failed");
}

// ─── Anthropic Claude — delegates to claude.ts (single source of truth) ──────
async function callAnthropic(_config: ProviderConfig, model: string, opts: AICompletionOpts): Promise<string> {
  const system = opts.system || opts.messages.find(m => m.role === "system")?.content || "You are a helpful AI assistant.";
  const userMsg  = opts.messages.filter(m => m.role !== "system").at(-1)?.content || "";
  const history  = opts.messages
    .filter(m => m.role !== "system")
    .slice(0, -1)
    .map(m => ({ role: m.role as "user" | "assistant", content: m.content }));

  return askClaude(system, userMsg, history, { model, maxTokens: opts.maxTokens || 1024 });
}

// ─── OpenAI-compatible (works for OpenAI, Groq, Mistral, etc.) ──
async function callOpenAICompatible(
  config: ProviderConfig, providerName: AIProvider, model: string, opts: AICompletionOpts
): Promise<string> {
  const apiKey = opts.tenantApiKey || process.env[config.envKey];
  const messages = opts.messages.map(m => ({ role: m.role, content: m.content }));

  // Prepend system message if provided
  if (opts.system && !messages.find(m => m.role === "system")) {
    messages.unshift({ role: "system", content: opts.system });
  }

  const res = await axios.post(
    `${config.baseUrl}/chat/completions`,
    {
      model,
      max_tokens: opts.maxTokens || 1024,
      temperature: opts.temperature ?? 0.7,
      messages,
    },
    {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // Google Gemini needs this header
        ...(providerName === "google" ? { "x-goog-api-key": process.env.GOOGLE_AI_KEY } : {}),
      },
      timeout: 60000,
    }
  );

  return res.data.choices?.[0]?.message?.content || "";
}

// ═══════════════════════════════════════════════════════════════
// CONVENIENCE WRAPPERS
// ═══════════════════════════════════════════════════════════════

/** Quick single-turn prompt → string */
export async function ask(prompt: string, system?: string, fast = false): Promise<string> {
  return complete({
    messages: [{ role: "user", content: prompt }],
    system,
    fast,
    maxTokens: 1024,
  });
}

/** Returns parsed JSON or throws */
export async function askJSON<T = any>(prompt: string, system?: string): Promise<T> {
  const sys = (system || "") + "\nReturn ONLY valid JSON. No markdown, no explanation, just the JSON object or array.";
  const text = await ask(prompt, sys);
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean) as T;
}

/** Stream response as async generator (OpenAI-compatible providers only) */
export async function* stream(opts: AICompletionOpts): AsyncGenerator<string> {
  const providers = getAvailableProviders();
  if (providers.length === 0) throw new Error("No AI provider configured");

  const providerName = opts.provider || providers[0];
  const config = PROVIDERS[providerName];
  const model = opts.fast ? config.fastModel : config.defaultModel;

  if (config.format === "anthropic") {
    // Anthropic streaming — delegates to claude.ts (single source of truth)
    const system  = opts.system || opts.messages.find(m => m.role === "system")?.content || "You are a helpful AI assistant.";
    const userMsg = opts.messages.filter(m => m.role !== "system").at(-1)?.content || "";
    const history = opts.messages
      .filter(m => m.role !== "system")
      .slice(0, -1)
      .map(m => ({ role: m.role as "user" | "assistant", content: m.content }));

    yield* streamClaude(system, userMsg, history, model);
  } else {
    // OpenAI-compatible streaming
    const apiKey = process.env[config.envKey];
    const messages = opts.messages.map(m => ({ role: m.role, content: m.content }));
    if (opts.system) messages.unshift({ role: "system", content: opts.system });

    const res = await axios.post(
      `${config.baseUrl}/chat/completions`,
      { model, max_tokens: opts.maxTokens || 2048, messages, stream: true },
      {
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        responseType: "stream",
      }
    );

    for await (const chunk of res.data) {
      const lines = chunk.toString().split("\n").filter((l: string) => l.startsWith("data:") && l !== "data: [DONE]");
      for (const line of lines) {
        try {
          const data = JSON.parse(line.slice(5));
          yield data.choices?.[0]?.delta?.content || "";
        } catch {}
      }
    }
  }
}

export default { complete, ask, askJSON, stream, getActiveProvider, getAvailableProviders, isAIAvailable, getProviderInfo };
