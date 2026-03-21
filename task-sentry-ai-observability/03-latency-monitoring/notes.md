# Latency Monitoring with Sentry

## Why Monitor LLM Latency?

LLMs are **slow** compared to normal API calls. A typical LLM response takes 0.5–10 seconds. If your app has multiple model calls, latency compounds fast.

Sentry measures the **wall-clock duration** of every span — so you know exactly how long each LLM call takes in production.

---

## How Sentry Measures Latency

```
Request Timeline (Trace Waterfall in Sentry)

0ms         500ms       1000ms      2000ms      3000ms
│           │           │           │           │
├───────────────────────────────────────────────┤  Transaction (3.0s total)
│                                               │
├─────────────────────────┤                        Span: "classify-intent" (1.5s)
│                                               │
                ├───────────────────────────────┤  Span: "generate-response" (2.0s)

```

Sentry stores each span with:
- `timestamp` (start time)
- `duration` (in milliseconds)

From these, Sentry computes **P50, P75, P95, P99** latency percentiles across all your requests.

---

## Latency Percentiles Explained

| Percentile | Meaning |
|------------|---------|
| **P50** (median) | 50% of requests complete faster than this |
| **P75** | 75% of requests complete faster |
| **P95** | 95% of requests complete faster — "typical worst case" |
| **P99** | 99% of requests complete faster — "extreme worst case" |

> Example: P95 = 4.2s means only 5% of your users waited more than 4.2 seconds.

---

## Common Latency Problems and How Sentry Helps

| Problem | Sentry Signal |
|---------|--------------|
| One model is slower than others | Compare span durations by `gen_ai.request.model` |
| A specific feature is slow | Sort traces by duration, look at which spans are longest |
| Latency got worse after a deploy | Compare P95 before/after in Performance dashboard |
| Streaming vs non-streaming | Streaming reduces TTFB but Sentry captures full span duration |

---

## Where to See It in Sentry

1. Run the example
2. Go to **Performance** → **Traces**
3. Click any trace → see the Waterfall with per-span durations
4. In **Insights → AI**, you'll see average latency per model

---

## Code Example

See [`examples/latency-monitor.ts`](./examples/latency-monitor.ts) — runs 5 simulated LLM calls with different delays inside real Sentry spans.

Run it:
```bash
npx tsx task-sentry-ai-observability/03-latency-monitoring/examples/latency-monitor.ts
```
