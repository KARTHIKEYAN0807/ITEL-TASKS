# Prompt Tracing with Sentry

## What Is Prompt Tracing?

Every time your app calls an LLM (OpenAI, Anthropic, etc.), Sentry can create a **span** that records exactly:

- The model used (`gpt-4o`, `claude-3-5-sonnet`, etc.)
- The operation name (`chat`, `summarize`, `classify`)
- The prompt sent (input)
- The response received (output)
- How long it took (duration)

These spans are chained together into a **Trace** — a full timeline of everything that happened during a user request.

---

## How It Works

```
User Request
    │
    ▼
┌──────────────────────────────────────────┐
│  Sentry Transaction (the whole request)  │
│  duration: 3.2s                          │
│                                          │
│  ┌───────────────────────────────────┐   │
│  │ Span: "ai.chat" (LLM call)        │   │
│  │  gen_ai.request.model = "gpt-4o"  │   │
│  │  gen_ai.operation.name = "chat"   │   │
│  │  gen_ai.prompt = "Summarize..."   │   │
│  │  duration: 2.1s                   │   │
│  └───────────────────────────────────┘   │
│                                          │
│  ┌───────────────────────────────────┐   │
│  │ Span: "ai.chat" (2nd LLM call)    │   │
│  │  gen_ai.request.model = "gpt-4o"  │   │
│  │  duration: 1.1s                   │   │
│  └───────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

---

## Key Sentry Concepts

| Concept | Meaning |
|---------|---------|
| **Transaction** | The top-level container for a full request/operation |
| **Span** | A unit of work inside a transaction (one LLM call = one span) |
| **`gen_ai.*` attributes** | Standard OpenTelemetry attributes for AI operations |
| **Trace Waterfall** | Visual timeline in Sentry showing all spans |

---

## OpenTelemetry `gen_ai.*` Attributes for Prompt Tracing

| Attribute | Example Value | Description |
|-----------|--------------|-------------|
| `gen_ai.system` | `"openai"` | The AI provider |
| `gen_ai.request.model` | `"gpt-4o"` | Model name requested |
| `gen_ai.operation.name` | `"chat"` | Operation type |
| `gen_ai.agent.name` | `"SummaryAgent"` | Name of agent (if applicable) |
| `gen_ai.input_messages` | `[{role:"user", content:"..."}]` | Full prompt messages |
| `gen_ai.output_messages` | `[{role:"assistant", content:"..."}]` | Model response |

---

## What Automatic Instrumentation Does

When you add `openAIIntegration()` to Sentry, it **patches** the OpenAI client and automatically creates spans with all the above attributes — without you writing any span code manually.

For manual instrumentation (any library), you use `Sentry.startSpan()`.

---

## Where to See It in Sentry

1. Run the example → go to **sentry.io → your project**
2. Click **Performance** in the left sidebar
3. Click any **Transaction** name
4. You'll see the **Trace Waterfall** with all your AI spans

---

## Code Example

See [`examples/prompt-tracing.ts`](./examples/prompt-tracing.ts) — manually creates real Sentry spans that show up in the Trace Waterfall.

Run it:
```bash
npx tsx task-sentry-ai-observability/01-prompt-tracing/examples/prompt-tracing.ts
```
