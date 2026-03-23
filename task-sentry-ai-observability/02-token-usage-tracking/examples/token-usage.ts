/**
 * Topic 02 — Token Usage Tracking with Sentry + Ollama
 *
 * Records real token counts from Ollama on Sentry spans.
 * View in: Sentry → Insights → AI → Token Usage
 *
 * Run: npx tsx task-sentry-ai-observability/02-token-usage-tracking/examples/token-usage.ts
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
  console.error("❌  SENTRY_DSN missing.");
  process.exit(1);
}

Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 1.0 });
console.log("✅  Sentry initialized\n");

const ollama = new OpenAI({
  baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
  apiKey: "ollama",
});
const MODEL = process.env.OLLAMA_MODEL ?? "llama3.2:1b";

// ── Different tasks to demonstrate varied token usage ─────────────────────────
const tasks = [
  {
    operation: "summarize-document",
    systemPrompt: "Summarize the following in 2 sentences.",
    userPrompt: "AI is transforming healthcare, finance, and education, enabling new capabilities that were previously impossible. However, it also brings challenges around bias, privacy, and accountability that must be carefully managed.",
  },
  {
    operation: "classify-intent",
    systemPrompt: "Classify as one word: billing, technical, or general.",
    userPrompt: "My invoice shows the wrong amount.",
  },
  {
    operation: "rag-answer",
    systemPrompt: "Answer based on context. Be concise.",
    userPrompt: "Context: Plan A costs $29/month, Plan B costs $49/month, Plan C costs $99/month.\nQuestion: What is the cost of Plan B and Plan C combined per month?",
  },
  {
    operation: "translate-response",
    systemPrompt: "Translate to French. Reply with only the translation.",
    userPrompt: "Thank you for contacting support. We will resolve your issue shortly.",
  },
];

// ── Main demo ─────────────────────────────────────────────────────────────────

async function runTokenUsageDemo() {
  console.log("=".repeat(60));
  console.log("TOKEN USAGE TRACKING DEMO (Real Ollama LLM)");
  console.log("=".repeat(60));
  console.log(`Model: ${MODEL}\n`);

  let totalInput  = 0;
  let totalOutput = 0;

  await Sentry.startSpan(
    { name: "token-usage-pipeline", op: "ai.pipeline", attributes: { "llm.provider": "ollama" } },
    async () => {
      for (const task of tasks) {
        await Sentry.startSpan(
          {
            name: "ai.chat",
            op: "ai.chat",
            attributes: {
              "gen_ai.system": "ollama",
              "gen_ai.request.model": MODEL,
              "gen_ai.operation.name": task.operation,
            },
          },
          async (span: Span | undefined) => {
            const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
              { role: "system", content: task.systemPrompt },
              { role: "user",   content: task.userPrompt },
            ];

            const completion   = await ollama.chat.completions.create({ model: MODEL, messages });
            const inputTokens  = completion.usage?.prompt_tokens ?? 0;
            const outputTokens = completion.usage?.completion_tokens ?? 0;

            /**
             * KEY: Set real token usage from the Ollama response.
             * Sentry reads these to display usage in AI Insights → Token Usage.
             */
            span?.setAttributes({
              "gen_ai.usage.input_tokens":  inputTokens,
              "gen_ai.usage.output_tokens": outputTokens,
            });

            totalInput  += inputTokens;
            totalOutput += outputTokens;

            console.log(
              `  ✓ ${task.operation.padEnd(24)}  in: ${String(inputTokens).padStart(4)}  out: ${String(outputTokens).padStart(3)}`
            );
          }
        );
      }
    }
  );

  console.log();
  console.log("─".repeat(60));
  console.log("TOKEN SUMMARY (visible in Sentry AI Insights)");
  console.log("─".repeat(60));
  console.log(`  Total input tokens  : ${totalInput}`);
  console.log(`  Total output tokens : ${totalOutput}`);
  console.log(`  Total all tokens    : ${totalInput + totalOutput}`);
  console.log();
  console.log("=".repeat(60));
  console.log("WHERE TO SEE THIS IN SENTRY:");
  console.log("  Insights → AI → Token Usage");
  console.log("  Also → Performance → Traces → each span's token attributes");
  console.log("=".repeat(60));

  await Sentry.flush(3000);
  console.log("\n✅  Data flushed to Sentry. Check your dashboard!");
}

runTokenUsageDemo().catch(console.error);
