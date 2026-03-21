# Token Usage Tracking with Sentry

## Why Track Tokens?

LLMs charge by **token** (roughly 1 token ≈ ¾ of a word). If you don't track token usage:
- You'll get surprise bills at the end of the month
- You won't know which features are expensive
- You can't optimize prompts to reduce cost

Sentry automatically captures token counts from every LLM span.

---

## Token Types

```
┌─────────────────────────────────────────────────────────────┐
│                      LLM API Call                           │
│                                                             │
│  INPUT TOKENS (what you send)                               │
│  ┌─────────────────────────────────────────┐                │
│  │  System prompt:   "You are a helpful…"  │  200 tokens    │
│  │  User message:    "Summarize this doc"  │  500 tokens    │
│  │  Cached context:  (from previous turn)  │  150 tokens ◄─ cached
│  └─────────────────────────────────────────┘                │
│  Total input tokens = 850                                   │
│                                                             │
│  OUTPUT TOKENS (what you receive)                           │
│  ┌─────────────────────────────────────────┐                │
│  │  "Here is the summary: …"               │  300 tokens    │
│  └─────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

---

## Sentry Span Attributes for Token Usage

| Attribute | Meaning |
|-----------|---------|
| `gen_ai.usage.input_tokens` | Total prompt tokens (includes cached) |
| `gen_ai.usage.output_tokens` | Total completion tokens (includes reasoning) |
| `gen_ai.usage.input_tokens.cached` | Subset of input that was served from cache |
| `gen_ai.usage.output_tokens.reasoning` | Subset of output used for chain-of-thought |

> ⚠️ **Important**: `input_tokens` is the **total** (including cached), NOT just the non-cached portion. Setting it wrong causes negative cost calculations.

---

## What Sentry Shows You

Across all your AI spans, Sentry aggregates:
- **Total tokens used** per time period
- **Tokens per model** (how much gpt-4o vs claude-3)
- **Top token-consuming operations** (which feature costs most)
- **Token trends** over time

---

## Where to See It in Sentry

1. Run the example
2. Go to **sentry.io → Insights → AI**
3. Look for the **Token Usage** section
4. You'll see a breakdown by model and time period

---

## Code Example

See [`examples/token-usage.ts`](./examples/token-usage.ts) — sends multiple LLM spans with real token count attributes to Sentry.

Run it:
```bash
npx tsx task-sentry-ai-observability/02-token-usage-tracking/examples/token-usage.ts
```
