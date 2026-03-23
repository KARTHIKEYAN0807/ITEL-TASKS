/**
 * Topic 04 — Debugging Prompts with Sentry + Ollama
 *
 * Makes 3 real Ollama conversation turns. Turn 3 uses a bad model name
 * to trigger a real error that Sentry captures with full breadcrumb trail.
 * View in:
 *  - Sentry → AI → Conversations
 *  - Sentry → Issues (the captured error)
 *  - Sentry → Performance → Traces → debug-prompts-session
 *
 * Run: npx tsx task-sentry-ai-observability/04-debugging-prompts/examples/debug-prompts.ts
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

type ChatMessage = OpenAI.Chat.ChatCompletionMessageParam;

// ── Main demo ─────────────────────────────────────────────────────────────────

async function runDebugPromptsDemo() {
  console.log("=".repeat(60));
  console.log("DEBUGGING PROMPTS DEMO (Real Ollama LLM)");
  console.log("=".repeat(60));
  console.log(`Model: ${MODEL}\n`);

  const conversationId = "conv_debug_demo_001";
  const conversationHistory: ChatMessage[] = [];
  console.log(`  Conversation ID: ${conversationId}`);
  console.log("  (all turns linked by this ID in Sentry → AI → Conversations)\n");

  await Sentry.startSpan(
    {
      name: "debug-prompts-session",
      op: "ai.pipeline",
      attributes: { "user.id": "user-99", "session.id": conversationId, "llm.provider": "ollama" },
    },
    async () => {
      // ── Turn 1: Successful real call ──────────────────────────────────────
      await Sentry.startSpan(
        {
          name: "ai.chat",
          op: "ai.chat",
          attributes: {
            "gen_ai.system": "ollama",
            "gen_ai.request.model": MODEL,
            "gen_ai.operation.name": "multi-turn-chat",
            "gen_ai.conversation.id": conversationId,
          },
        },
        async (span: Span | undefined) => {
          const messages: ChatMessage[] = [
            { role: "system", content: "You are a helpful assistant. Answer in 1 sentence." },
            { role: "user",   content: "What is the capital of France?" },
          ];

          console.log("  [Turn 1] Prompt:", (messages[1].content as string));
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

          console.log(`  [Turn 1] Response: "${response.slice(0, 60)}"`);
          console.log("  [Turn 1] ✅ prompt+response stored on span\n");
        }
      );

      // ── Turn 2: Follow-up with full conversation history ──────────────────
      await Sentry.startSpan(
        {
          name: "ai.chat",
          op: "ai.chat",
          attributes: {
            "gen_ai.system": "ollama",
            "gen_ai.request.model": MODEL,
            "gen_ai.operation.name": "multi-turn-chat",
            "gen_ai.conversation.id": conversationId,
          },
        },
        async (span: Span | undefined) => {
          const messages: ChatMessage[] = [
            { role: "system", content: "You are a helpful assistant. Answer in 1 sentence." },
            ...conversationHistory,
            { role: "user", content: "What is its approximate population?" },
          ];

          console.log("  [Turn 2] Prompt: What is its approximate population?");
          span?.setAttributes({ "gen_ai.input_messages": JSON.stringify(messages) });

          const completion = await ollama.chat.completions.create({ model: MODEL, messages });
          const response   = completion.choices[0]?.message?.content ?? "";

          span?.setAttributes({
            "gen_ai.output_messages":     JSON.stringify([{ role: "assistant", content: response }]),
            "gen_ai.usage.input_tokens":  completion.usage?.prompt_tokens ?? 0,
            "gen_ai.usage.output_tokens": completion.usage?.completion_tokens ?? 0,
          });

          conversationHistory.push({ role: "user", content: "What is its approximate population?" });
          conversationHistory.push({ role: "assistant", content: response });

          console.log(`  [Turn 2] Response: "${response.slice(0, 60)}"`);
          console.log("  [Turn 2] ✅ full conversation history stored\n");
        }
      );

      // ── Turn 3: Intentional error — bad model name ────────────────────────
      await Sentry.startSpan(
        {
          name: "ai.chat",
          op: "ai.chat",
          attributes: {
            "gen_ai.system": "ollama",
            "gen_ai.request.model": "nonexistent-model-xyz",
            "gen_ai.operation.name": "multi-turn-chat",
            "gen_ai.conversation.id": conversationId,
          },
        },
        async (span: Span | undefined) => {
          const messages: ChatMessage[] = [
            { role: "system", content: "You are a helpful assistant." },
            ...conversationHistory,
            { role: "user", content: "Compare Paris to London's population." },
          ];

          // Store prompt BEFORE the call so we have it even if it fails
          span?.setAttributes({ "gen_ai.input_messages": JSON.stringify(messages) });

          console.log("  [Turn 3] Prompt: Compare Paris to London's population.");
          console.log("  [Turn 3] ⚠️  Using bad model name to trigger real Ollama error...");

          try {
            // Deliberately using a nonexistent model → Ollama returns error
            await ollama.chat.completions.create({ model: "nonexistent-model-xyz", messages });
          } catch (error) {
            span?.setAttributes({ "ai.error": String(error) });

            Sentry.captureException(error, {
              extra: {
                conversationId,
                turnNumber: 3,
                promptPreview: "Compare Paris to London's population.",
                model: "nonexistent-model-xyz",
              },
            });

            console.log("  [Turn 3] ❌ Real error captured — linked to trace in Sentry Issues\n");
          }
        }
      );
    }
  );

  console.log("=".repeat(60));
  console.log("WHERE TO SEE THIS IN SENTRY:");
  console.log(`  → AI → Conversations → search '${conversationId}'`);
  console.log("  → Issues → click the Ollama error → 'View Trace'");
  console.log("  → Performance → Traces → 'debug-prompts-session'");
  console.log("=".repeat(60));

  await Sentry.flush(3000);
  console.log("\n✅  Data flushed to Sentry. Check your dashboard!");
}

runDebugPromptsDemo().catch(console.error);
