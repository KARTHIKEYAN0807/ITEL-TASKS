/**
 * Topic 01 — Prompt Tracing with Sentry + Ollama
 *
 * Makes real LLM calls via Ollama, wrapped in Sentry spans.
 * Spans appear in: Sentry → Performance → Traces → Waterfall view
 *
 * Run: npx tsx task-sentry-ai-observability/01-prompt-tracing/examples/prompt-tracing.ts
 * Requires: ollama serve + ollama pull llama3.2:1b
 */

import * as Sentry from "@sentry/node";
import type { Span } from "@sentry/core";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import OpenAI from "openai";

// ── Init ──────────────────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../.env") });

if (!process.env.SENTRY_DSN) {
  console.error("❌  SENTRY_DSN missing. Create task-sentry-ai-observability/.env");
  process.exit(1);
}

Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 1.0 });
console.log("✅  Sentry initialized\n");

const ollama = new OpenAI({
  baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
  apiKey: "ollama",
});
const MODEL = process.env.OLLAMA_MODEL ?? "llama3.2:1b";

// ── Main demo ─────────────────────────────────────────────────────────────────

async function runPromptTracingDemo() {
  console.log("=".repeat(60));
  console.log("PROMPT TRACING DEMO (Real Ollama LLM)");
  console.log("=".repeat(60));
  console.log(`Model: ${MODEL}\n`);

  await Sentry.startSpan(
    {
      name: "ai-chat-request",
      op: "ai.pipeline",
      attributes: {
        "user.id": "user-42",
        "feature": "customer-support-chat",
        "llm.provider": "ollama",
      },
    },
    async () => {
      console.log("📋  Starting AI chat pipeline...\n");

      // ── Span 1: Classify intent ──────────────────────────────────────────
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
            { role: "system", content: "Classify user intent as one word: billing, technical, or general." },
            { role: "user",   content: "I can't log in to my account" },
          ];

          console.log(`  [Span 1] Classifying intent...`);
          const t0 = Date.now();
          const completion = await ollama.chat.completions.create({ model: MODEL, messages });
          const ms = Date.now() - t0;

          const response = completion.choices[0]?.message?.content?.trim() ?? "technical";
          const inputTokens  = completion.usage?.prompt_tokens ?? 0;
          const outputTokens = completion.usage?.completion_tokens ?? 0;

          span?.setAttributes({
            "gen_ai.input_messages":      JSON.stringify(messages),
            "gen_ai.output_messages":     JSON.stringify([{ role: "assistant", content: response }]),
            "gen_ai.usage.input_tokens":  inputTokens,
            "gen_ai.usage.output_tokens": outputTokens,
          });

          console.log(`  Response: "${response}" (${ms}ms, ${inputTokens}→${outputTokens} tokens)\n`);
          return response.toLowerCase().includes("billing") ? "billing"
               : response.toLowerCase().includes("general") ? "general"
               : "technical";
        }
      );

      // ── Span 2: Generate response ────────────────────────────────────────
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
            { role: "user",   content: `User has a '${intent}' issue: can't log in. Give a short helpful response.` },
          ];

          console.log(`  [Span 2] Generating response for intent: "${intent}"...`);
          const t0 = Date.now();
          const completion = await ollama.chat.completions.create({ model: MODEL, messages });
          const ms = Date.now() - t0;

          const response = completion.choices[0]?.message?.content ?? "";
          const inputTokens  = completion.usage?.prompt_tokens ?? 0;
          const outputTokens = completion.usage?.completion_tokens ?? 0;

          span?.setAttributes({
            "gen_ai.input_messages":      JSON.stringify(messages),
            "gen_ai.output_messages":     JSON.stringify([{ role: "assistant", content: response }]),
            "gen_ai.usage.input_tokens":  inputTokens,
            "gen_ai.usage.output_tokens": outputTokens,
          });

          console.log(`  Response: "${response.slice(0, 80)}…" (${ms}ms, ${inputTokens}→${outputTokens} tokens)\n`);
        }
      );

      console.log("✅  Pipeline complete — 2 real LLM spans sent to Sentry\n");
    }
  );

  console.log("=".repeat(60));
  console.log("WHERE TO SEE THIS IN SENTRY:");
  console.log("  Performance → Traces → 'ai-chat-request'");
  console.log("  → Waterfall with 2 'ai.chat' spans");
  console.log("  → Click a span → see prompt & response in attributes");
  console.log("=".repeat(60));

  await Sentry.flush(3000);
  console.log("\n✅  Data flushed to Sentry. Check your dashboard!");
}

runPromptTracingDemo().catch(console.error);
