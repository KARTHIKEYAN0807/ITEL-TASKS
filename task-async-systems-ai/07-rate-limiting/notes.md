# Rate Limiting

## Why Rate Limiting Matters in AI Apps

AI services like OpenAI, Anthropic, Google impose **rate limits**:

- **Requests per minute (RPM)**: e.g., 60 requests/minute
- **Tokens per minute (TPM)**: e.g., 90,000 tokens/minute
- **Requests per day (RPD)**: e.g., 10,000 requests/day

Without rate limiting, your workers overwhelm the AI API and get **429 Too Many Requests** errors.

---

## Rate Limiting Strategies

### Strategy 1: Token Bucket

Tokens are added at a fixed rate. Each request consumes one token. If no tokens available, the request waits. See the code example.

### Strategy 2: Queue-Based Throttling

Control processing rate by adjusting how fast workers consume messages — limit `MaxNumberOfMessages` to 1 and add a delay between polls.

### Strategy 3: Concurrency Control

Limit the number of parallel workers/threads to control API load.

---

## Comparison

| Strategy | Mechanism | Best For |
|----------|-----------|----------|
| **Token Bucket** | Tokens refill at fixed rate | Smooth rate control |
| **Queue throttling** | Control poll rate + delay | SQS-based workflows |
| **Concurrency limit** | Limit parallel workers | Controlling API load |
| **Exponential backoff** | Slow down on 429 errors | Reactive rate limiting |

---

## Code Example

See [`examples/token-bucket.ts`](./examples/token-bucket.ts) — runnable token bucket rate limiter (no AWS needed).

```bash
npx tsx 07-rate-limiting/examples/token-bucket.ts
```
