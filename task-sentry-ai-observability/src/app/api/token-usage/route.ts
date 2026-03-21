/**
 * API Route: /api/token-usage
 * Topic 02 — Token Usage Tracking with Sentry + Ollama
 *
 * Makes 4 real Ollama LLM calls, reads actual token usage from response,
 * and sets gen_ai.usage.* on Sentry spans.
 * View in: Sentry → Insights → AI → Token Usage
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

// Different task prompts to demonstrate varied token usage
const tasks = [
  {
    operation: "summarize-document",
    systemPrompt: "Summarize the following text in 2 sentences.",
    userPrompt: "Artificial intelligence (AI) is intelligence demonstrated by machines, as opposed to natural intelligence displayed by animals including humans. AI research has been defined as the field of study of intelligent agents, which refers to any system that perceives its environment and takes actions that maximize its chance of achieving its goals.",
  },
  {
    operation: "classify-intent",
    systemPrompt: "Classify the user intent as exactly one word: billing, technical, or general.",
    userPrompt: "My invoice shows the wrong amount.",
  },
  {
    operation: "rag-answer",
    systemPrompt: "You are a helpful assistant. Answer the question using the provided context. Be concise.",
    userPrompt: "Context: Paris is the capital of France with a population of about 2.1 million. It is known for the Eiffel Tower.\nQuestion: What is the capital of France and what is it known for?",
  },
  {
    operation: "translate-response",
    systemPrompt: "Translate the following English text to French. Reply with only the translation.",
    userPrompt: "Thank you for contacting our support team. We will get back to you shortly.",
  },
];

export async function GET() {
  let totalInput = 0;
  let totalOutput = 0;
  const callResults: object[] = [];

  await Sentry.startSpan(
    { name: "token-usage-pipeline", op: "ai.pipeline", attributes: { "llm.provider": "ollama", "llm.model": MODEL } },
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

            const completion = await ollama.chat.completions.create({ model: MODEL, messages });

            const response   = completion.choices[0]?.message?.content ?? "";
            const inputTokens  = completion.usage?.prompt_tokens ?? 0;
            const outputTokens = completion.usage?.completion_tokens ?? 0;

            /**
             * KEY: Set token usage on the span.
             * Sentry reads these to display usage in AI Insights → Token Usage.
             * ⚠️ input_tokens = TOTAL (including cached) — never set to non-cached only!
             */
            span?.setAttributes({
              "gen_ai.usage.input_tokens":  inputTokens,
              "gen_ai.usage.output_tokens": outputTokens,
              "gen_ai.input_messages":  JSON.stringify(messages),
              "gen_ai.output_messages": JSON.stringify([{ role: "assistant", content: response }]),
            });

            totalInput  += inputTokens;
            totalOutput += outputTokens;

            callResults.push({
              operation:    task.operation,
              model:        MODEL,
              inputTokens,
              outputTokens,
              response:     response.slice(0, 120),
            });
          }
        );
      }
    }
  );

  return NextResponse.json({
    topic: "02 — Token Usage Tracking",
    description: "Real token counts from Ollama set on Sentry spans. View in Insights → AI → Token Usage.",
    sentryPath: "Insights → AI → Token Usage (may take a few minutes)",
    model: MODEL,
    calls: callResults,
    summary: {
      totalInputTokens:  totalInput,
      totalOutputTokens: totalOutput,
      totalAllTokens:    totalInput + totalOutput,
    },
  });
}
