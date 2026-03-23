/**
 * API Route: /api/prompt-tracing
 * Topic 01 — Prompt Tracing with Sentry + Ollama
 *
 * Makes real LLM calls via Ollama (OpenAI-compatible API).
 * Both spans appear in: Sentry → Performance → Traces → Waterfall view
 */

import * as Sentry from "@sentry/nextjs";
import type { Span } from "@sentry/core";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const ollama = new OpenAI({
  baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
  apiKey: "ollama", // Ollama doesn't need a real key
});

const MODEL = process.env.OLLAMA_MODEL ?? "llama3.2:1b";

export async function GET() {
  const result = await Sentry.startSpan(
    {
      name: "ai-chat-request",
      op: "ai.pipeline",
      attributes: {
        "user.id": "user-42",
        "feature": "customer-support-chat",
        "llm.provider": "ollama",
        "llm.model": MODEL,
      },
    },
    async () => {
      const spans: { operation: string; durationMs: number; response: string; tokens: { input: number; output: number } }[] = [];

      // ── Span 1: Classify intent ─────────────────────────────────────────────
      const intent = await Sentry.startSpan(
        {
          name: "ai.chat",
          op: "ai.chat",
          attributes: {
            "gen_ai.system": "ollama",
            "gen_ai.request.model": MODEL,
            "gen_ai.operation.name": "classify-intent",
            "gen_ai.agent.name": "IntentClassifier",
          },
        },
        async (span: Span | undefined) => {
          const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: "system", content: "Classify user intent into exactly one word: billing, technical, or general. Reply with only that word." },
            { role: "user", content: "I can't log in to my account" },
          ];

          const t0 = Date.now();
          const completion = await ollama.chat.completions.create({ model: MODEL, messages });
          const durationMs = Date.now() - t0;

          const response = completion.choices[0]?.message?.content?.trim() ?? "technical";
          const inputTokens = completion.usage?.prompt_tokens ?? 0;
          const outputTokens = completion.usage?.completion_tokens ?? 0;

          span?.setAttributes({
            "gen_ai.input_messages": JSON.stringify(messages),
            "gen_ai.output_messages": JSON.stringify([{ role: "assistant", content: response }]),
            "gen_ai.usage.input_tokens": inputTokens,
            "gen_ai.usage.output_tokens": outputTokens,
          });

          spans.push({ operation: "classify-intent", durationMs, response, tokens: { input: inputTokens, output: outputTokens } });
          return response.toLowerCase().includes("billing") ? "billing"
               : response.toLowerCase().includes("general") ? "general"
               : "technical";
        }
      );

      // ── Span 2: Generate response based on intent ───────────────────────────
      await Sentry.startSpan(
        {
          name: "ai.chat",
          op: "ai.chat",
          attributes: {
            "gen_ai.system": "ollama",
            "gen_ai.request.model": MODEL,
            "gen_ai.operation.name": "generate-response",
            "gen_ai.agent.name": "ResponseGenerator",
          },
        },
        async (span: Span | undefined) => {
          const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: "system", content: "You are a helpful customer support agent. Be concise (2-3 sentences)." },
            { role: "user", content: `User has a '${intent}' issue: they can't log in. Give a short helpful response.` },
          ];

          const t0 = Date.now();
          const completion = await ollama.chat.completions.create({ model: MODEL, messages });
          const durationMs = Date.now() - t0;

          const response = completion.choices[0]?.message?.content ?? "";
          const inputTokens = completion.usage?.prompt_tokens ?? 0;
          const outputTokens = completion.usage?.completion_tokens ?? 0;

          span?.setAttributes({
            "gen_ai.input_messages": JSON.stringify(messages),
            "gen_ai.output_messages": JSON.stringify([{ role: "assistant", content: response }]),
            "gen_ai.usage.input_tokens": inputTokens,
            "gen_ai.usage.output_tokens": outputTokens,
          });

          spans.push({ operation: "generate-response", durationMs, response, tokens: { input: inputTokens, output: outputTokens } });
        }
      );

      return { spans, intent };
    }
  );

  return NextResponse.json({
    topic: "01 — Prompt Tracing",
    description: "Real LLM spans sent to Sentry via Ollama. View in Performance → Traces.",
    sentryPath: "Performance → Traces → ai-chat-request → Waterfall",
    model: MODEL,
    pipeline: result,
  });
}
