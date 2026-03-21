/**
 * Topic 05 — Cost Monitoring with Sentry + Ollama
 *
 * Makes real Ollama LLM calls, reads actual token counts from responses,
 * and calculates equivalent OpenAI cost (Ollama itself is free).
 * View in: Sentry → Insights → AI → Costs
 *
 * Run: npx tsx task-sentry-ai-observability/05-cost-monitoring/examples/cost-monitor.ts
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

// ── Equivalent OpenAI pricing for reference (USD per 1M tokens) ───────────────
// Ollama is free, but we show what these calls would cost equivalent to gpt-4o-mini
const PRICING = { inputPerM: 0.15, outputPerM: 0.60 };

function calcEquivCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1_000_000) * PRICING.inputPerM
       + (outputTokens / 1_000_000) * PRICING.outputPerM;
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
const tasks = [
  {
    operation: "draft-email",
    systemPrompt: "Write a short professional email reply (2-3 sentences).",
    userPrompt: "Customer says: I'd like to upgrade my plan.",
  },
  {
    operation: "summarize-legal-doc",
    systemPrompt: "Summarize in 3 sentences.",
    userPrompt: "This Terms of Service agreement governs your use of our platform. By using our service, you agree to abide by these terms. We reserve the right to update these terms at any time with or without notice. Continued use of the service constitutes acceptance of any changes. Users are responsible for maintaining the confidentiality of their account credentials.",
  },
  {
    operation: "rag-with-context",
    systemPrompt: "Answer the question based on context. Be concise.",
    userPrompt: "Context: Our API has rate limits of 100 requests/min for Free tier, 1000/min for Pro, and unlimited for Enterprise.\nQuestion: How many requests per minute does the Pro tier allow?",
  },
  {
    operation: "translate-to-french",
    systemPrompt: "Translate to French. Reply with only the translation.",
    userPrompt: "Your payment has been processed successfully. Your receipt will be emailed shortly.",
  },
  {
    operation: "sentiment-analysis",
    systemPrompt: "Reply with one word: positive, negative, or neutral.",
    userPrompt: "The product is great but the customer support was very slow to respond.",
  },
];

// ── Main demo ─────────────────────────────────────────────────────────────────

async function runCostMonitorDemo() {
  console.log("=".repeat(70));
  console.log("COST MONITORING DEMO (Real Ollama LLM)");
  console.log("=".repeat(70));
  console.log(`Model: ${MODEL}`);
  console.log("Note: Ollama is free. Costs shown = equivalent gpt-4o-mini pricing.\n");

  const results: Array<{
    operation: string;
    inputTokens: number;
    outputTokens: number;
    equivCostUSD: number;
  }> = [];

  await Sentry.startSpan(
    { name: "cost-monitoring-demo", op: "ai.pipeline", attributes: { "llm.provider": "ollama" } },
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
              { role: "user",   content: task.userPrompt   },
            ];

            const completion   = await ollama.chat.completions.create({ model: MODEL, messages });
            const inputTokens  = completion.usage?.prompt_tokens ?? 0;
            const outputTokens = completion.usage?.completion_tokens ?? 0;
            const equivCostUSD = calcEquivCost(inputTokens, outputTokens);

            /**
             * Sentry reads gen_ai.usage.* for token aggregation.
             * ai.cost.usd is attached for cost dashboard visibility.
             */
            span?.setAttributes({
              "gen_ai.usage.input_tokens":  inputTokens,
              "gen_ai.usage.output_tokens": outputTokens,
              "ai.cost.usd":                parseFloat(equivCostUSD.toFixed(8)),
              "ai.cost.model":              MODEL,
            });

            results.push({ operation: task.operation, inputTokens, outputTokens, equivCostUSD });
            console.log(`  ✓ ${task.operation.padEnd(28)} in:${String(inputTokens).padStart(4)}  out:${String(outputTokens).padStart(4)}  ~$${equivCostUSD.toFixed(6)}`);
          }
        );
      }
    }
  );

  // ── Cost breakdown ───────────────────────────────────────────────────────────
  const totalCost    = results.reduce((s, r) => s + r.equivCostUSD, 0);
  const totalTokens  = results.reduce((s, r) => s + r.inputTokens + r.outputTokens, 0);

  console.log();
  console.log("─".repeat(70));
  console.log("COST BREAKDOWN (equivalent gpt-4o-mini pricing)");
  console.log("─".repeat(70));
  console.log(`  Total tokens used  : ${totalTokens}`);
  console.log(`  Total equiv. cost  : $${totalCost.toFixed(6)}`);
  console.log(`  At 1000 req/day    : ~$${(totalCost * 1000).toFixed(2)}/day (if on gpt-4o-mini)`);
  console.log();
  console.log("=".repeat(70));
  console.log("WHERE TO SEE THIS IN SENTRY:");
  console.log("  → Insights → AI → Costs");
  console.log("  → Performance → Traces → click any span → token attributes");
  console.log("=".repeat(70));

  await Sentry.flush(3000);
  console.log("\n✅  Data flushed to Sentry. Check your dashboard!");
}

runCostMonitorDemo().catch(console.error);
