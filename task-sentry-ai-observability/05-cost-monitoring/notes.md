# Cost Monitoring with Sentry

## Why Monitor LLM Costs?

LLM API costs can spiral quickly in production. Sentry computes the dollar cost of every AI call from the token counts on your spans and aggregates them in the **AI Insights → Costs** dashboard.

---

## How Sentry Calculates Cost

Sentry uses this formula per LLM span:

```
Cost = (input_tokens - cached_tokens) × input_rate
     + cached_tokens                  × cached_rate
     + (output_tokens - reasoning_tokens) × output_rate
     + reasoning_tokens               × reasoning_rate
```

### Example (GPT-4o pricing)

```
input_rate    = $0.0025 / 1K tokens  ($2.50 per million)
cached_rate   = $0.00125 / 1K tokens ($1.25 per million)
output_rate   = $0.010 / 1K tokens  ($10 per million)

LLM Call:
  input_tokens         = 1000
  input_tokens.cached  =  200   ← subset of input (not extra!)
  output_tokens        =  500

Cost:
  Input (non-cached) : (1000 - 200) × $0.0025/1K = $0.002
  Input (cached)     :  200          × $0.00125/1K = $0.00025
  Output             :  500          × $0.010/1K   = $0.005
  ─────────────────────────────────────────────────────────
  TOTAL              = $0.00725 per call
```

---

## ⚠️ The Cached Token Gotcha

`gen_ai.usage.input_tokens` = **TOTAL** input (INCLUDING cached).  
`gen_ai.usage.input_tokens.cached` = just the cached **subset**.

**WRONG** (will produce negative costs):
```
input_tokens        = 800  ← only the non-cached part ❌
input_tokens.cached = 200
```

**CORRECT**:
```
input_tokens        = 1000  ← total (non-cached + cached) ✅
input_tokens.cached = 200
```

---

## Cost Span Attributes

| Attribute | Example | Description |
|-----------|---------|-------------|
| `gen_ai.usage.input_tokens` | `1000` | Total input tokens (incl. cached) |
| `gen_ai.usage.input_tokens.cached` | `200` | Cached subset of input |
| `gen_ai.usage.output_tokens` | `500` | Total output tokens (incl. reasoning) |
| `gen_ai.usage.output_tokens.reasoning` | `50` | Reasoning token subset (o1, o3) |
| `gen_ai.request.model` | `"gpt-4o"` | Model name (Sentry knows its pricing) |

---

## Model Pricing Reference (as of early 2025)

| Model | Input (per 1M) | Cached (per 1M) | Output (per 1M) |
|-------|----------------|-----------------|-----------------|
| gpt-4o | $2.50 | $1.25 | $10.00 |
| gpt-4o-mini | $0.15 | $0.075 | $0.60 |
| claude-3-5-sonnet | $3.00 | $0.30 | $15.00 |
| o3-mini | $1.10 | $0.55 | $4.40 |

---

## Where to See It in Sentry

1. Run the example
2. Go to **Insights → AI → Costs**
3. You'll see cost breakdown by model, operation, and time period

---

## Code Example

See [`examples/cost-monitor.ts`](./examples/cost-monitor.ts) — implements the exact Sentry cost formula, sets proper token attributes on real spans, and prints a cost breakdown table locally.

Run it:
```bash
npx tsx task-sentry-ai-observability/05-cost-monitoring/examples/cost-monitor.ts
```
