export {};

/**
 * token-bucket.ts
 * ===============
 * Token Bucket rate limiter implementation + demo.
 *
 * Run:  npx tsx token-bucket.ts
 * No external dependencies — runs standalone.
 */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// TokenBucket class
// ---------------------------------------------------------------------------
class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private rate: number,      // tokens added per second
    private capacity: number   // max tokens in bucket
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  /**
   * Wait until a token is available, then consume it.
   */
  async acquire(): Promise<void> {
    while (true) {
      // Refill tokens based on elapsed time
      const now = Date.now();
      const elapsed = (now - this.lastRefill) / 1000;
      this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.rate);
      this.lastRefill = now;

      if (this.tokens >= 1) {
        this.tokens -= 1;
        return; // token acquired!
      }

      // Wait a bit before checking again
      await sleep(100);
    }
  }

  getTokenCount(): number {
    return Math.floor(this.tokens);
  }
}

// ---------------------------------------------------------------------------
// Simulated AI API call
// ---------------------------------------------------------------------------
async function callAiApi(requestId: number): Promise<string> {
  const start = Date.now();
  await sleep(200); // simulate network latency
  return `Response #${requestId} (took ${Date.now() - start}ms)`;
}

// ---------------------------------------------------------------------------
// Demo: send 10 requests through a rate limiter (2 per second)
// ---------------------------------------------------------------------------
async function main() {
  console.log("=".repeat(60));
  console.log("TOKEN BUCKET RATE LIMITER DEMO");
  console.log("=".repeat(60));
  console.log("Config: rate = 2 tokens/sec, capacity = 3 tokens\n");

  const limiter = new TokenBucket(2, 3); // 2 requests/sec, burst of 3
  const totalRequests = 10;
  const start = Date.now();

  for (let i = 1; i <= totalRequests; i++) {
    const waitStart = Date.now();
    await limiter.acquire(); // blocks until a token is available
    const waited = Date.now() - waitStart;

    const result = await callAiApi(i);
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);

    console.log(
      `  [${elapsed}s] Request ${i}/${totalRequests} | waited ${waited}ms for token | ${result}`
    );
  }

  const totalTime = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`\n  ✅ All ${totalRequests} requests completed in ${totalTime}s`);
  console.log(`  Without rate limiting, all 10 would fire at once → 429 errors!`);
}

main().catch(console.error);
