# Retry Strategies

## Why Retries Matter in AI Apps

AI operations can fail for many reasons:

- **API rate limits** — OpenAI, Claude, etc. have rate limits
- **Transient network errors** — Temporary connectivity issues
- **GPU out of memory** — Model inference fails on large inputs
- **Timeout** — Long-running inference exceeds time limits
- **Service unavailability** — External AI services temporarily down

---

## SQS Built-in Retry Mechanism

Amazon SQS has a built-in retry via **visibility timeout**:

1. Worker receives a message → message becomes **invisible** to other workers
2. Worker **succeeds** → **deletes** the message
3. Worker **fails** (crashes or doesn't delete) → after **visibility timeout** expires, message becomes **visible** again → another worker picks it up

```
  Attempt 1: Worker receives message → Fails (crashes)
     ↓ (visibility timeout expires)
  Attempt 2: Message visible again → Worker receives → Fails (API error)
     ↓ (visibility timeout expires)
  Attempt 3: Message visible again → Worker receives → Succeeds! → Deleted
```

---

## Retry Strategies Comparison

| Strategy | Pattern | Best For |
|----------|---------|----------|
| **Immediate retry** | Retry instantly | Very transient glitches |
| **Fixed delay** | Wait N seconds between retries | Simple cases |
| **Exponential backoff** | 1s → 2s → 4s → 8s... | API rate limits, network errors |
| **Exponential backoff + jitter** | Backoff + random delay | Avoiding thundering herd |
| **SQS visibility timeout** | Auto-retry after timeout | Worker crashes/failures |

---

## SQS `maxReceiveCount` (Redrive Policy)

Limits how many times a message can be retried. After exceeding this count, the message goes to a **Dead Letter Queue**:

```json
{
  "RedrivePolicy": {
    "deadLetterTargetArn": "arn:aws:sqs:us-east-1:123456789:ai-tasks-dlq",
    "maxReceiveCount": 3
  }
}
```

Means: "If a message fails 3 times, move it to the dead letter queue."

---

## Code Example

See [`examples/retry-with-backoff.ts`](./examples/retry-with-backoff.ts) — runnable exponential backoff implementation (no AWS needed).

```bash
npx tsx 04-retry-strategies/examples/retry-with-backoff.ts 

Output:


PS D:\ITEL TASKS> cd task-async-systems-ai
PS D:\ITEL TASKS\task-async-systems-ai> npx tsx 04-retry-strategies/examples/retry-with-backoff.ts
============================================================
EXPONENTIAL BACKOFF RETRY DEMO
============================================================
Simulating a flaky AI API that fails twice then succeeds:

  ⚠️  Attempt 1 failed: 429 Too Many Requests (call #1) → retrying in 0.52s ...
  ⚠️  Attempt 2 failed: 429 Too Many Requests (call #2) → retrying in 1.05s ...
  ✅ AI API succeeded on attempt 3

  Final result: "AI response generated successfully (call #3)"

============================================================
```
