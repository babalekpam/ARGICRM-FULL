/**
 * ARGILETTE UNIVERSAL AI ADAPTER
 * 
 * Auto-detects whichever AI API keys are configured and uses the best
 * available provider. Falls back through the chain automatically.
 * 
 * Priority order (set by default, overrideable via AI_PROVIDER env var):
 *   1. Anthropic Claude    (ANTHROPIC_API_KEY)
 *   2. OpenAI GPT-4        (OPENAI_API_KEY)
 *   3. Google Gemini       (GOOGLE_AI_KEY)
 *   4. Groq (Llama 3.3)   (GROQ_API_KEY)       — fastest + free tier
 *   5. Mistral             (MISTRAL_API_KEY)
 *   6. Cohere              (COHERE_API_KEY)
 *   7. Together AI         (TOGETHER_API_KEY)   — open source models
 *   8. Fireworks AI        (FIREWORKS_API_KEY)
 *   9. Perplexity          (PERPLEXITY_API_KEY) — good for research/web
 *  10. Ollama              (OLLAMA_BASE_URL)    — fully local, zero cost
 */

import axios from "axios";

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
    defaultModel: "claude-sonnet-4-20250514",
    fastModel: "claude-haiku-4-5-20251001",
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
  const override = process.env.AI_PROVIDER as AIProvider;
  if (override && PROVIDERS[override]?.available()) return [override];

  const priority: AIProvider[] = [
    "anthropic", "openai", "google", "groq",
    "mistral", "cohere", "together", "fireworks",
    "perplexity", "ollama"
  ];

  return priority.filter(p => PROVIDERS[p].available());
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

// ─── Anthropic Claude ────────────────────────────────────────────
async function callAnthropic(config: ProviderConfig, model: string, opts: AICompletionOpts): Promise<string> {
  const messages = opts.messages.filter(m => m.role !== "system");
  const system = opts.system || opts.messages.find(m => m.role === "system")?.content;

  const res = await axios.post(
    `${config.baseUrl}/v1/messages`,
    {
      model,
      max_tokens: opts.maxTokens || 1024,
      ...(system ? { system } : {}),
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    },
    {
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      timeout: 60000,
    }
  );

  return res.data.content?.[0]?.text || "";
}

// ─── OpenAI-compatible (works for OpenAI, Groq, Mistral, etc.) ──
async function callOpenAICompatible(
  config: ProviderConfig, providerName: AIProvider, model: string, opts: AICompletionOpts
): Promise<string> {
  const apiKey = process.env[config.envKey];
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
    // Anthropic streaming
    const res = await axios.post(
      `${config.baseUrl}/v1/messages`,
      {
        model,
        max_tokens: opts.maxTokens || 2048,
        stream: true,
        messages: opts.messages.filter(m => m.role !== "system").map(m => ({ role: m.role, content: m.content })),
        ...(opts.system ? { system: opts.system } : {}),
      },
      {
        headers: { "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
        responseType: "stream",
      }
    );

    for await (const chunk of res.data) {
      const lines = chunk.toString().split("\n").filter((l: string) => l.startsWith("data:"));
      for (const line of lines) {
        try {
          const data = JSON.parse(line.slice(5));
          if (data.type === "content_block_delta") yield data.delta?.text || "";
        } catch {}
      }
    }
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
