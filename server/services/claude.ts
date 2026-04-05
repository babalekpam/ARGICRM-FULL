/**
 * ARGILETTE — CLAUDE AI SERVICE
 *
 * The single file that powers all Claude AI in the platform:
 *   ARIA, Skills Library, Store Builder, Data Enrichment, Campaign Writer, etc.
 *
 * Usage:
 *   import { askClaude } from "../services/claude.js";
 *   const reply = await askClaude(systemPrompt, userMessage, history);
 */

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type ClaudeMessage = {
  role: "user" | "assistant";
  content: string;
};

/**
 * Core Claude completion — one function that powers everything.
 *
 * @param systemPrompt  The AI persona / task instructions
 * @param userMessage   The current user message
 * @param history       Previous turns [{ role, content }, ...]
 * @param opts          Optional overrides (model, maxTokens)
 */
export async function askClaude(
  systemPrompt: string,
  userMessage: string,
  history: ClaudeMessage[] = [],
  opts: {
    model?: string;
    maxTokens?: number;
    fast?: boolean;
  } = {}
): Promise<string> {
  const model = opts.model
    ?? (opts.fast ? "claude-haiku-4-5" : "claude-sonnet-4-5");

  const response = await client.messages.create({
    model,
    max_tokens: opts.maxTokens ?? 4096,
    system: systemPrompt,
    messages: [
      ...history,
      { role: "user", content: userMessage },
    ],
  });

  return (response.content[0] as any).text ?? "";
}

/**
 * JSON-only variant — strips markdown fences and parses the response.
 * Use wherever you need structured output (action parsing, enrichment, etc.)
 */
export async function askClaudeJSON<T = any>(
  systemPrompt: string,
  userMessage: string,
  history: ClaudeMessage[] = [],
): Promise<T> {
  const sys = systemPrompt + "\n\nReturn ONLY valid JSON — no markdown, no explanation, just the JSON object or array.";
  const raw = await askClaude(sys, userMessage, history, { maxTokens: 2048 });
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean) as T;
}

/**
 * Stream variant — yields text chunks as they arrive from Claude.
 * Use for real-time chat UIs.
 */
export async function* streamClaude(
  systemPrompt: string,
  userMessage: string,
  history: ClaudeMessage[] = [],
  model = "claude-sonnet-4-5",
): AsyncGenerator<string> {
  const stream = await client.messages.stream({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      ...history,
      { role: "user", content: userMessage },
    ],
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      (event.delta as any).type === "text_delta"
    ) {
      yield (event.delta as any).text ?? "";
    }
  }
}

/**
 * Quick one-shot helper with no system prompt or history.
 * Good for internal summarisation, enrichment, and classification tasks.
 */
export async function quickAsk(prompt: string, fast = false): Promise<string> {
  return askClaude("You are a helpful AI assistant.", prompt, [], { fast });
}

export default { askClaude, askClaudeJSON, streamClaude, quickAsk };
