/**
 * retry-with-backoff.ts
 * =====================
 * Demonstrates exponential backoff retry strategy.
 *
 * Run:  npx tsx retry-with-backoff.ts
 * No external dependencies — runs standalone.
 */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Generic retry function with exponential backoff + jitter
// ---------------------------------------------------------------------------
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelayMs?: number; label?: string } = {}
): Promise<T> {
  const { maxRetries = 5, baseDelayMs = 1000, label = "task" } = options;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await fn();
      console.log(`  ✅ ${label} succeeded on attempt ${attempt + 1}`);
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);

      if (attempt === maxRetries - 1) {
        console.log(`  ❌ ${label} failed after ${maxRetries} attempts: ${message}`);
        throw err; // final attempt — propagate
      }

      // Exponential backoff with jitter
      const delay = baseDelayMs * Math.pow(2, attempt);
      const jitter = Math.random() * delay * 0.1; // 10% jitter
      const totalDelay = delay + jitter;

      console.log(
        `  ⚠️  Attempt ${attempt + 1} failed: ${message} → retrying in ${(totalDelay / 1000).toFixed(2)}s ...`
      );
      await sleep(totalDelay);
    }
  }

  throw new Error("Unreachable");
}

// ---------------------------------------------------------------------------
// Simulated flaky API call (fails first 2 times, succeeds on 3rd)
// ---------------------------------------------------------------------------
let callCount = 0;

async function flakyAiApiCall(): Promise<string> {
  callCount++;
  if (callCount <= 2) {
    throw new Error(`429 Too Many Requests (call #${callCount})`);
  }
  return `AI response generated successfully (call #${callCount})`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("=".repeat(60));
  console.log("EXPONENTIAL BACKOFF RETRY DEMO");
  console.log("=".repeat(60));
  console.log("Simulating a flaky AI API that fails twice then succeeds:\n");

  try {
    const result = await retryWithBackoff(flakyAiApiCall, {
      maxRetries: 5,
      baseDelayMs: 500,   // start at 0.5s for a quick demo
      label: "AI API",
    });
    console.log(`\n  Final result: "${result}"`);
  } catch (err) {
    console.error("All retries exhausted:", err);
  }

  console.log("\n" + "=".repeat(60));
  console.log("BACKOFF SCHEDULE (baseDelay = 1000ms)");
  console.log("=".repeat(60));
  console.log("  Attempt 1 fails → wait ~1.0s");
  console.log("  Attempt 2 fails → wait ~2.0s");
  console.log("  Attempt 3 fails → wait ~4.0s");
  console.log("  Attempt 4 fails → wait ~8.0s");
  console.log("  Attempt 5 fails → give up");
}

main().catch(console.error);
