/**
 * API Route: /api/debugging-prompts
 * Topic 04 — Debugging Prompts with Sentry + Ollama
 *
 * Makes real Ollama LLM calls across 3 conversation turns.
 * Turn 3 uses a bad model name to trigger a real error → captured by Sentry.
 * View in:
 *  - Sentry → AI → Conversations (full prompt/response on each span)
 *  - Sentry → Issues (captured error with breadcrumb trail)
 *  - Sentry → Performance → Traces → ai-conversation-debug
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

type ChatMessage = OpenAI.Chat.ChatCompletionMessageParam;

export async function GET() {
  const conversationHistory: ChatMessage[] = [];
  const turnResults: object[] = [];
  let errorsCapture = 0;
  const conversationId = `conv-debug-${Date.now()}`;

  await Sentry.startSpan(
    {
      name: "ai-conversation-debug",
      op: "ai.pipeline",
      attributes: {
        "session.id": conversationId,
        "user.id": "user-42",
        "feature": "billing-support",
        "llm.provider": "ollama",
        "llm.model": MODEL,
      },
    },
    async () => {
      // ── Turn 1: Greeting ───────────────────────────────────────────────────
      Sentry.addBreadcrumb({ category: "ai.turn", message: "Turn 1: greeting", level: "info" });

      await Sentry.startSpan(
        {
          name: "ai.chat",
          op: "ai.chat",
          attributes: {
            "gen_ai.system": "ollama",
            "gen_ai.request.model": MODEL,
            "gen_ai.operation.name": "greeting",
            "gen_ai.conversation.id": conversationId,
          },
        },
        async (span: Span | undefined) => {
          const messages: ChatMessage[] = [
            { role: "system", content: "You are a helpful customer support assistant. Be concise (1-2 sentences)." },
            { role: "user",   content: "Hi! Can you help me understand my invoice?" },
          ];

          // Store prompt BEFORE calling (so it's captured even if call fails)
          span?.setAttributes({ "gen_ai.input_messages": JSON.stringify(messages) });

          const completion = await ollama.chat.completions.create({ model: MODEL, messages });
          const response   = completion.choices[0]?.message?.content ?? "";

          span?.setAttributes({
            "gen_ai.output_messages":     JSON.stringify([{ role: "assistant", content: response }]),
            "gen_ai.usage.input_tokens":  completion.usage?.prompt_tokens ?? 0,
            "gen_ai.usage.output_tokens": completion.usage?.completion_tokens ?? 0,
          });

          conversationHistory.push({ role: "user", content: messages[1].content as string });
          conversationHistory.push({ role: "assistant", content: response });

          turnResults.push({ turn: "greeting", model: MODEL, status: "OK", response: response.slice(0, 120) });
        }
      );

      // ── Turn 2: Follow-up with full history ────────────────────────────────
      Sentry.addBreadcrumb({ category: "ai.turn", message: "Turn 2: clarification", level: "info" });

      await Sentry.startSpan(
        {
          name: "ai.chat",
          op: "ai.chat",
          attributes: {
            "gen_ai.system": "ollama",
            "gen_ai.request.model": MODEL,
            "gen_ai.operation.name": "clarification",
            "gen_ai.conversation.id": conversationId,
          },
        },
        async (span: Span | undefined) => {
          const messages: ChatMessage[] = [
            { role: "system", content: "You are a helpful billing assistant. Be concise." },
            ...conversationHistory,
            { role: "user", content: "My invoice shows $49 but I'm on the $29 plan." },
          ];

          span?.setAttributes({ "gen_ai.input_messages": JSON.stringify(messages) });

          const completion = await ollama.chat.completions.create({ model: MODEL, messages });
          const response   = completion.choices[0]?.message?.content ?? "";

          span?.setAttributes({
            "gen_ai.output_messages":     JSON.stringify([{ role: "assistant", content: response }]),
            "gen_ai.usage.input_tokens":  completion.usage?.prompt_tokens ?? 0,
            "gen_ai.usage.output_tokens": completion.usage?.completion_tokens ?? 0,
          });

          conversationHistory.push({ role: "user", content: "My invoice shows $49 but I'm on the $29 plan." });
          conversationHistory.push({ role: "assistant", content: response });

          turnResults.push({ turn: "clarification", model: MODEL, status: "OK", response: response.slice(0, 120) });
        }
      );

      // ── Turn 3: Intentional error — bad model name triggers real Ollama error ─
      Sentry.addBreadcrumb({ category: "ai.turn", message: "Turn 3: intentional error (bad model)", level: "warning" });

      await Sentry.startSpan(
        {
          name: "ai.chat",
          op: "ai.chat",
          attributes: {
            "gen_ai.system": "ollama",
            "gen_ai.request.model": "nonexistent-model-xyz",
            "gen_ai.operation.name": "escalation-check",
            "gen_ai.conversation.id": conversationId,
          },
        },
        async (span: Span | undefined) => {
          const messages: ChatMessage[] = [
            { role: "system", content: "Decide if this issue needs human escalation." },
            ...conversationHistory,
            { role: "user", content: "I've been overcharged for three months. This is unacceptable." },
          ];

          // Store prompt before calling (so we have it if the call fails)
          span?.setAttributes({ "gen_ai.input_messages": JSON.stringify(messages) });

          try {
            // Deliberately using a nonexistent model → Ollama returns an error
            await ollama.chat.completions.create({ model: "nonexistent-model-xyz", messages });
          } catch (err) {
            span?.setAttributes({ "ai.error": String(err) });

            // Capture with full context — appears in Sentry Issues, linked to this trace
            Sentry.captureException(err, {
              tags: { ai_operation: "escalation-check", model: "nonexistent-model-xyz" },
              extra: {
                conversationId,
                turnNumber: 3,
                userMessage: "I've been overcharged for three months.",
                historyLength: conversationHistory.length,
              },
            });

            errorsCapture++;
            turnResults.push({ turn: "escalation-check", model: "nonexistent-model-xyz", status: "ERROR ❌", error: String(err) });
          }
        }
      );
    }
  );

  return NextResponse.json({
    topic: "04 — Debugging Prompts",
    description: "Real Ollama calls. Full prompt/response on spans. Turn 3 uses bad model → real error captured in Sentry.",
    sentryPaths: {
      conversations: "AI → Conversations → search by conversation ID",
      errors:        "Issues → Ollama error with breadcrumb trail + prompt context",
      traces:        "Performance → Traces → ai-conversation-debug",
    },
    model: MODEL,
    conversationId,
    turns: turnResults,
    errorsCaptures: errorsCapture,
  });
}
