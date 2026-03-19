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

Output:

PS D:\ITEL TASKS> cd task-async-systems-ai
PS D:\ITEL TASKS\task-async-systems-ai> ^C
PS D:\ITEL TASKS\task-async-systems-ai> npx tsx 07-rate-limiting/examples/token-bucket.ts
============================================================
TOKEN BUCKET RATE LIMITER DEMO
============================================================
Config: rate = 2 tokens/sec, capacity = 3 tokens

  [0.21s] Request 1/10 | waited 0ms for token | Response #1 (took 206ms)
  [0.41s] Request 2/10 | waited 0ms for token | Response #2 (took 203ms)
  [0.61s] Request 3/10 | waited 0ms for token | Response #3 (took 200ms)
  [0.81s] Request 4/10 | waited 0ms for token | Response #4 (took 202ms)
  [1.23s] Request 5/10 | waited 218ms for token | Response #5 (took 202ms)
  [1.76s] Request 6/10 | waited 328ms for token | Response #6 (took 201ms)
  [2.29s] Request 7/10 | waited 327ms for token | Response #7 (took 201ms)
  [2.71s] Request 8/10 | waited 216ms for token | Response #8 (took 201ms)
  [3.23s] Request 9/10 | waited 325ms for token | Response #9 (took 202ms)
  [3.77s] Request 10/10 | waited 328ms for token | Response #10 (took 203ms)

  ✅ All 10 requests completed in 3.77s
  Without rate limiting, all 10 would fire at once → 429 errors!
PS D:\ITEL TASKS\task-async-systems-ai> 
```
