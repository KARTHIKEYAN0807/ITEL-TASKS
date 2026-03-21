# Debugging Prompts with Sentry

## Why Debug Prompts?

When your AI feature returns a wrong answer or fails, you need to know:
- **Exactly what prompt was sent** to the model
- **Exactly what response came back**
- **What error occurred** (if any)
- **Which user triggered it** and when

Without this, debugging AI failures is guesswork.

---

## Sentry's Approach: Prompt Capture + Error Linking

Sentry stores the prompt and response **on the span** as attributes, then links any error to the same trace. So when debugging, you see everything in one place.

```
User request fails ──▶ Sentry Issue created
                              │
                              ▼
                       Linked Trace
                              │
                    ┌─────────┴──────────┐
                    │  Span: "ai.chat"    │
                    │  prompt: "You are…" │
                    │  response: "Error…" │
                    │  duration: 1.2s     │
                    └────────────────────┘
```

---

## Privacy Controls — `recordInputs` / `recordOutputs`

By default, Sentry captures prompt text and responses. You can disable this if your prompts contain PII:

```ts
// In sentry.init
openAIIntegration({
  recordInputs: false,   // Don't send prompts to Sentry
  recordOutputs: false,  // Don't send responses to Sentry
})
```

Use this for healthcare, finance, or any app with sensitive user data.

---

## The Conversations View

Sentry's **AI → Conversations** tab lets you replay an entire multi-turn conversation:

```
Conversation ID: conv_abc123
────────────────────────────────────────────
[User]       "What's the capital of France?"
[Assistant]  "The capital of France is Paris."
[User]       "What's its population?"
[Assistant]  ❌ ERROR: rate_limit_exceeded
────────────────────────────────────────────
All spans linked by: gen_ai.conversation.id = "conv_abc123"
```

---

## Key Attributes for Prompt Debugging

| Attribute | What It Captures |
|-----------|-----------------|
| `gen_ai.input_messages` | Full array of messages sent to the model |
| `gen_ai.output_messages` | Model's response messages |
| `gen_ai.conversation.id` | Groups all turns of a conversation |
| `gen_ai.request.model` | Which model was called |
| Sentry error | Attached to the same trace if the call failed |

---

## Where to See It in Sentry

1. Run the example
2. For prompts: **AI → Conversations** tab
3. For errors: **Issues** — click the issue, then click the linked trace
4. The trace shows the exact prompt that caused the error

---

## Code Example

See [`examples/debug-prompts.ts`](./examples/debug-prompts.ts) — captures prompt and response on spans, links a conversation ID, and intentionally captures an error on one call.

Run it:
```bash
npx tsx task-sentry-ai-observability/04-debugging-prompts/examples/debug-prompts.ts
```
