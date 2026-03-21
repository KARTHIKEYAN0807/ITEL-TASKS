/**
 * API Route: /api/latency-monitoring
 * Topic 03 — Latency Monitoring with Sentry + Ollama
 *
 * Makes 4 real Ollama calls with different task types and measures
 * actual wall-clock time. Slow calls trigger Sentry warning events.
 * View in: Sentry → Performance → Traces → span durations
 */

import * as Sentry from "@sentry/nextjs";
import type { Span } from "@sentry/core";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const ollama = new OpenAI({
  baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
  apiKey: "ollama",
});

const MODEL = process.env.OLLAMA_MODEL ?? "llama3.2";

// Different tasks with different latency expectations
const aiCalls = [
  {
    name: "intent-classification",
    systemPrompt: "Classify the intent into one word: support, billing, or technical.",
    userPrompt: "My account is locked.",
    p95ThresholdMs: 15000, // local LLM latency is higher than cloud
  },
  {
    name: "context-retrieval-answer",
    systemPrompt: "Answer the question based on context. Be concise (1-2 sentences).",
    userPrompt: "Context: Product A costs $29/month, Product B costs $49/month. Q: How much does Product B cost?",
    p95ThresholdMs: 20000,
  },
  {
    name: "response-generation",
    systemPrompt: "You are a helpful customer support agent. Write a polite 2-sentence response.",
    userPrompt: "I need help resetting my password. I haven't received the reset email.",
    p95ThresholdMs: 25000,
  },
  {
    name: "safety-check",
    systemPrompt: "Answer yes or no: Is this message appropriate for a customer support context?",
    userPrompt: "How do I cancel my subscription?",
    p95ThresholdMs: 15000,
  },
];

export async function GET() {
  const results: object[] = [];
  let pipelineStartMs = 0;

  await Sentry.startSpan(
    {
      name: "ai-latency-pipeline",
      op: "ai.pipeline",
      attributes: { "pipeline.stage": "full-request", "llm.provider": "ollama", "llm.model": MODEL },
    },
    async () => {
      pipelineStartMs = Date.now();

      for (const call of aiCalls) {
        await Sentry.startSpan(
          {
            name: "ai.chat",
            op: "ai.chat",
            attributes: {
              "gen_ai.system": "ollama",
              "gen_ai.request.model": MODEL,
              "gen_ai.operation.name": call.name,
              "ai.latency.p95_threshold_ms": call.p95ThresholdMs,
            },
          },
          async (span: Span | undefined) => {
            const callStart = Date.now();

            const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
              { role: "system", content: call.systemPrompt },
              { role: "user",   content: call.userPrompt },
            ];

            const completion = await ollama.chat.completions.create({ model: MODEL, messages });

            const actualMs    = Date.now() - callStart;
            const isSlow      = actualMs > call.p95ThresholdMs;
            const response    = completion.choices[0]?.message?.content ?? "";
            const inputTokens  = completion.usage?.prompt_tokens ?? 0;
            const outputTokens = completion.usage?.completion_tokens ?? 0;

            // Attach measured latency — visible on each span in Sentry
            span?.setAttributes({
              "ai.latency.actual_ms":        actualMs,
              "ai.latency.p95_threshold_ms":  call.p95ThresholdMs,
              "ai.latency.exceeded_p95":      isSlow,
              "gen_ai.usage.input_tokens":   inputTokens,
              "gen_ai.usage.output_tokens":  outputTokens,
              "gen_ai.input_messages":  JSON.stringify(messages),
              "gen_ai.output_messages": JSON.stringify([{ role: "assistant", content: response }]),
            });

            // Capture a Sentry warning when a call exceeds the expected threshold
            if (isSlow) {
              Sentry.captureMessage(
                `Slow AI call: ${call.name} took ${actualMs}ms (P95=${call.p95ThresholdMs}ms)`,
                { level: "warning", tags: { ai_operation: call.name, model: MODEL } }
              );
            }

            results.push({
              operation:      call.name,
              model:          MODEL,
              actualMs,
              p95ThresholdMs: call.p95ThresholdMs,
              status:         isSlow ? "SLOW ⚠️" : "OK ✅",
              response:       response.slice(0, 80),
              tokens:         { input: inputTokens, output: outputTokens },
            });
          }
        );
      }
    }
  );

  const totalMs = Date.now() - pipelineStartMs;

  return NextResponse.json({
    topic: "03 — Latency Monitoring",
    description: "Real Ollama call durations attached to Sentry spans. Slow calls trigger Sentry warnings.",
    sentryPath: "Performance → Traces → ai-latency-pipeline → each span's duration",
    model: MODEL,
    totalPipelineMs: totalMs,
    calls: results,
  });
}
