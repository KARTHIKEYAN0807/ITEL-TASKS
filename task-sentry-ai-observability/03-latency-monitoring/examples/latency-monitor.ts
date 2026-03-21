/**
 * Topic 03 — Latency Monitoring with Sentry + Ollama
 *
 * Makes real Ollama LLM calls and records actual wall-clock latency per span.
 * Visible as span durations in: Sentry → Performance → Traces → Waterfall
 *
 * Run: npx tsx task-sentry-ai-observability/03-latency-monitoring/examples/latency-monitor.ts
 * Requires: ollama serve + ollama pull llama3.2
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
const MODEL = process.env.OLLAMA_MODEL ?? "llama3.2";

// Different task complexity → different latency characteristics
const tasks = [
  {
    name: "fast-classification",
    systemPrompt: "Reply with one word only: yes or no.",
    userPrompt:   "Is 'I want to cancel my account' a churn risk?",
    p95ThresholdMs: 15000,
  },
  {
    name: "standard-chat",
    systemPrompt: "You are a helpful assistant. Answer in 2 sentences.",
    userPrompt:   "What is the benefit of using a CDN for a web application?",
    p95ThresholdMs: 20000,
  },
  {
    name: "long-document-summary",
    systemPrompt: "Summarize in 3 sentences.",
    userPrompt:   "Cloud computing is the on-demand availability of computer system resources, especially data storage and computing power, without direct active management by the user. Large clouds often have functions distributed over multiple locations, each location being a data center. Cloud computing relies on sharing of resources to achieve coherence and economies of scale. Advocates of public and hybrid clouds note that cloud computing allows companies to avoid or minimize up-front IT infrastructure costs.",
    p95ThresholdMs: 25000,
  },
  {
    name: "multi-step-reasoning",
    systemPrompt: "Think step by step and explain your reasoning briefly.",
    userPrompt:   "A train travels 120 km at 60 km/h, then 80 km at 40 km/h. What is the average speed for the whole trip?",
    p95ThresholdMs: 30000,
  },
];

// ── Main demo ─────────────────────────────────────────────────────────────────

async function runLatencyDemo() {
  console.log("=".repeat(60));
  console.log("LATENCY MONITORING DEMO (Real Ollama LLM)");
  console.log("=".repeat(60));
  console.log(`Model: ${MODEL}\n`);

  const durations: Record<string, number[]> = {};

  await Sentry.startSpan(
    { name: "latency-monitoring-demo", op: "ai.pipeline", attributes: { "llm.provider": "ollama" } },
    async () => {
      for (const task of tasks) {
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          { role: "system", content: task.systemPrompt },
          { role: "user",   content: task.userPrompt   },
        ];

        const start = Date.now();

        await Sentry.startSpan(
          {
            name: "ai.chat",
            op: "ai.chat",
            attributes: {
              "gen_ai.system": "ollama",
              "gen_ai.request.model": MODEL,
              "gen_ai.operation.name": task.name,
              "ai.latency.p95_threshold_ms": task.p95ThresholdMs,
            },
          },
          async (span: Span | undefined) => {

            const completion   = await ollama.chat.completions.create({ model: MODEL, messages });
            const elapsed      = Date.now() - start;
            const isSlow       = elapsed > task.p95ThresholdMs;
            const inputTokens  = completion.usage?.prompt_tokens ?? 0;
            const outputTokens = completion.usage?.completion_tokens ?? 0;

            span?.setAttributes({
              "gen_ai.usage.input_tokens":   inputTokens,
              "gen_ai.usage.output_tokens":  outputTokens,
              "ai.latency.actual_ms":        elapsed,
              "ai.latency.p95_threshold_ms": task.p95ThresholdMs,
              "ai.latency.exceeded_p95":     isSlow,
            });

            if (isSlow) {
              Sentry.captureMessage(`Slow AI call: ${task.name} took ${elapsed}ms`, {
                level: "warning",
                tags: { ai_operation: task.name, model: MODEL },
              });
            }

            if (!durations[task.name]) durations[task.name] = [];
            durations[task.name].push(elapsed);

            const bar = "█".repeat(Math.min(Math.ceil(elapsed / 1000), 30));
            console.log(
              `  ${task.name.padEnd(26)} ${String(elapsed).padStart(5)}ms  ${isSlow ? "⚠️ SLOW" : "✅"}  ${bar}`
            );
          }
        );
      }
    }
  );

  console.log();
  console.log("=".repeat(60));
  console.log("WHERE TO SEE THIS IN SENTRY:");
  console.log("  → Performance → Traces → 'latency-monitoring-demo'");
  console.log("  → Each span shows its real duration in the waterfall");
  console.log("=".repeat(60));

  await Sentry.flush(3000);
  console.log("\n✅  Data flushed to Sentry. Check your dashboard!");
}

runLatencyDemo().catch(console.error);
