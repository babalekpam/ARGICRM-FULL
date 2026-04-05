/**
 * ARGILETTE — CLAUDE AI SERVICE
 *
 * The single file that powers all Claude AI in the platform:
 *   ARIA, Skills Library, Store Builder, Data Enrichment, Campaign Writer, etc.
 *
 * Every call is automatically logged via ai-credits.ts (token count + cost).
 *
 * Usage:
 *   import { askClaude } from "../services/claude.js";
 *   const reply = await askClaude(systemPrompt, userMessage, history, {}, { tenantId, userId, feature });
 */

import Anthropic from "@anthropic-ai/sdk";
import { logUsage } from "./ai-credits.js";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type ClaudeMessage = {
  role: "user" | "assistant";
  content: string;
};

/** Optional usage-tracking context. Pass whenever you have a tenantId. */
export interface ClaudeCallContext {
  tenantId?: string | null;
  userId?: string | null;
  feature?: string;      // 'aria' | 'skill' | 'campaign' | 'enrichment' | ...
}

// ═══════════════════════════════════════════════════════════════
// CORE COMPLETION
// ═══════════════════════════════════════════════════════════════

/**
 * Core Claude completion — one function that powers everything.
 *
 * @param systemPrompt  The AI persona / task instructions
 * @param userMessage   The current user message
 * @param history       Previous turns [{ role, content }, ...]
 * @param opts          Optional overrides (model, maxTokens, fast)
 * @param ctx           Usage tracking context (tenantId, userId, feature)
 */
export async function askClaude(
  systemPrompt: string,
  userMessage: string,
  history: ClaudeMessage[] = [],
  opts: {
    model?: string;
    maxTokens?: number;
    fast?: boolean;
  } = {},
  ctx: ClaudeCallContext = {}
): Promise<string> {
  const model = opts.model ?? (opts.fast ? "claude-haiku-4-5" : "claude-sonnet-4-5");

  const response = await client.messages.create({
    model,
    max_tokens: opts.maxTokens ?? 4096,
    system: systemPrompt,
    messages: [
      ...history,
      { role: "user", content: userMessage },
    ],
  });

  // ── Log every token, every call ──────────────────────────────
  if (ctx.tenantId) {
    logUsage({
      tenantId: ctx.tenantId,
      userId:   ctx.userId ?? null,
      feature:  ctx.feature ?? "general",
      model,
      inputTokens:  response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    }).catch(() => {}); // fire-and-forget, never fail the response
  }

  return (response.content[0] as any).text ?? "";
}

// ═══════════════════════════════════════════════════════════════
// JSON VARIANT
// ═══════════════════════════════════════════════════════════════

/**
 * JSON-only variant — strips markdown fences and parses the response.
 * Use wherever you need structured output (action parsing, enrichment, etc.)
 */
export async function askClaudeJSON<T = any>(
  systemPrompt: string,
  userMessage: string,
  history: ClaudeMessage[] = [],
  ctx: ClaudeCallContext = {}
): Promise<T> {
  const sys = systemPrompt + "\n\nReturn ONLY valid JSON — no markdown, no explanation, just the JSON object or array.";
  const raw = await askClaude(sys, userMessage, history, { maxTokens: 2048 }, ctx);
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean) as T;
}

// ═══════════════════════════════════════════════════════════════
// STREAMING VARIANT
// ═══════════════════════════════════════════════════════════════

/**
 * Stream variant — yields text chunks as they arrive from Claude.
 * Usage is logged when the stream finishes.
 */
export async function* streamClaude(
  systemPrompt: string,
  userMessage: string,
  history: ClaudeMessage[] = [],
  model = "claude-sonnet-4-5",
  ctx: ClaudeCallContext = {}
): AsyncGenerator<string> {
  const stream = client.messages.stream({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      ...history,
      { role: "user", content: userMessage },
    ],
  });

  let inputTokens  = 0;
  let outputTokens = 0;

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      (event.delta as any).type === "text_delta"
    ) {
      yield (event.delta as any).text ?? "";
    }
    if (event.type === "message_delta" && (event as any).usage) {
      outputTokens = (event as any).usage.output_tokens ?? 0;
    }
    if (event.type === "message_start" && (event as any).message?.usage) {
      inputTokens = (event as any).message.usage.input_tokens ?? 0;
    }
  }

  // Log after stream finishes
  if (ctx.tenantId && (inputTokens || outputTokens)) {
    logUsage({
      tenantId: ctx.tenantId,
      userId:   ctx.userId ?? null,
      feature:  ctx.feature ?? "general",
      model,
      inputTokens,
      outputTokens,
    }).catch(() => {});
  }
}

// ═══════════════════════════════════════════════════════════════
// QUICK HELPER
// ═══════════════════════════════════════════════════════════════

/**
 * Quick one-shot helper with no system prompt or history.
 * Good for internal summarisation, enrichment, and classification tasks.
 */
export async function quickAsk(
  prompt: string,
  fast = false,
  ctx: ClaudeCallContext = {}
): Promise<string> {
  return askClaude("You are a helpful AI assistant.", prompt, [], { fast }, ctx);
}

export default { askClaude, askClaudeJSON, streamClaude, quickAsk };
