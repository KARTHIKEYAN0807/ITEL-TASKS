/**
 * API Route: /api/cost-monitoring
 * Topic 05 — AI Cost Monitoring with Sentry + Ollama
 *
 * Makes real Ollama LLM calls, reads actual token counts from responses,
 * calculates equivalent OpenAI USD cost (for learning purposes — Ollama is free),
 * and attaches it to Sentry spans for cost aggregation.
 * View in: Sentry → Insights → AI → Costs
 */

import * as Sentry from "@sentry/nextjs";
import type { Span } from "@sentry/core";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const ollama = new OpenAI({
  baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
  apiKey: "ollama",
});

const MODEL = process.env.OLLAMA_MODEL ?? "llama3.2:1b";

// ── Equivalent OpenAI pricing (USD per 1 M tokens) for reference ────────────
// Ollama itself is free, but we show what these calls would cost on OpenAI
const EQUIVALENT_PRICING: Record<string, { inputPerM: number; outputPerM: number }> = {
  "gpt-4o":      { inputPerM: 2.50,  outputPerM: 10.00 },
  "gpt-4o-mini": { inputPerM: 0.15,  outputPerM: 0.60  },
};
// Ollama / llama3.2:1b equivalent — use gpt-4o-mini pricing as reference
const OLLAMA_EQUIV = "gpt-4o-mini";

function calcEquivalentCostUSD(inputTokens: number, outputTokens: number): number {
  const p = EQUIVALENT_PRICING[OLLAMA_EQUIV];
  return (inputTokens / 1_000_000) * p.inputPerM + (outputTokens / 1_000_000) * p.outputPerM;
}

// ── Tasks with varied complexity to demonstrate different token costs ─────────
const tasks = [
  {
    operation: "intent-classification",
    systemPrompt: "Classify the intent as one word: billing, technical, or general.",
    userPrompt:   "My account won't let me log in.",
  },
  {
    operation: "document-summary",
    systemPrompt: "Summarize the following in 2-3 sentences.",
    userPrompt:   "Artificial intelligence is transforming industries from healthcare to finance. Machine learning models can now diagnose diseases, predict stock movements, generate code, and translate languages. The technology relies on large datasets and significant compute power, raising questions about energy consumption and data privacy. Researchers are working on more efficient architectures to reduce these costs while maintaining accuracy.",
  },
  {
    operation: "answer-generation",
    systemPrompt: "You are a helpful assistant. Answer the question in 2 sentences.",
    userPrompt:   "What are the main benefits of using a microservices architecture?",
  },
  {
    operation: "response-translation",
    systemPrompt: "Translate this English text to French. Reply with only the translation.",
    userPrompt:   "Your subscription has been renewed. Thank you for being a valued customer.",
  },
  {
    operation: "safety-check",
    systemPrompt: "Reply yes or no only: Is this message safe and appropriate?",
    userPrompt:   "How do I reset my password?",
  },
];

export async function GET() {
  const callResults: object[] = [];
  let totalCostUSD    = 0;
  let totalInputTokens  = 0;
  let totalOutputTokens = 0;

  await Sentry.startSpan(
    {
      name: "ai-cost-pipeline",
      op:   "ai.pipeline",
      attributes: { "pipeline.feature": "rag-chat", "llm.provider": "ollama", "llm.model": MODEL },
    },
    async () => {
      for (const task of tasks) {
        await Sentry.startSpan(
          {
            name: "ai.chat",
            op:   "ai.chat",
            attributes: {
              "gen_ai.system":         "ollama",
              "gen_ai.request.model":  MODEL,
              "gen_ai.operation.name": task.operation,
            },
          },
          async (span: Span | undefined) => {
            const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
              { role: "system", content: task.systemPrompt },
              { role: "user",   content: task.userPrompt   },
            ];

            const completion   = await ollama.chat.completions.create({ model: MODEL, messages });
            const response     = completion.choices[0]?.message?.content ?? "";
            const inputTokens  = completion.usage?.prompt_tokens ?? 0;
            const outputTokens = completion.usage?.completion_tokens ?? 0;
            const costUSD      = calcEquivalentCostUSD(inputTokens, outputTokens);

            totalCostUSD      += costUSD;
            totalInputTokens  += inputTokens;
            totalOutputTokens += outputTokens;

            /**
             * Sentry reads gen_ai.usage.* to aggregate token counts.
             * We also attach the computed equivalent cost for cost dashboards.
             */
            span?.setAttributes({
              "gen_ai.usage.input_tokens":  inputTokens,
              "gen_ai.usage.output_tokens": outputTokens,
              "ai.cost.usd":                parseFloat(costUSD.toFixed(8)),
              "ai.cost.model":              MODEL,
              "ai.cost.pricing_reference":  OLLAMA_EQUIV,
              "gen_ai.input_messages":  JSON.stringify(messages),
              "gen_ai.output_messages": JSON.stringify([{ role: "assistant", content: response }]),
            });

            callResults.push({
              operation:    task.operation,
              model:        MODEL,
              inputTokens,
              outputTokens,
              equivalentCostUSD: parseFloat(costUSD.toFixed(6)),
              response:     response.slice(0, 80),
            });
          }
        );
      }
    }
  );

  return NextResponse.json({
    topic: "05 — Cost Monitoring",
    description: "Real Ollama token counts used to calculate equivalent OpenAI cost. Attached to Sentry spans for aggregation.",
    sentryPath: "Insights → AI → Costs (aggregated across all spans)",
    note: "Ollama is free. Costs shown are equivalent OpenAI gpt-4o-mini rates for learning.",
    model: MODEL,
    calls: callResults,
    summary: {
      totalInputTokens,
      totalOutputTokens,
      totalAllTokens: totalInputTokens + totalOutputTokens,
      totalEquivalentCostUSD: parseFloat(totalCostUSD.toFixed(6)),
      pricingReferencedModel: OLLAMA_EQUIV,
    },
  });
}
