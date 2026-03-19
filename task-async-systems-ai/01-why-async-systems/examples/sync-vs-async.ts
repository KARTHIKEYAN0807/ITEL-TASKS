export {};

/**
 * sync-vs-async.ts
 * ================
 * Demonstrates the difference between synchronous and asynchronous processing.
 *
 * Run:  npx tsx sync-vs-async.ts
 * No external dependencies required.
 */

// ---------------------------------------------------------------------------
// Simulate an AI task that takes time (e.g. LLM inference)
// ---------------------------------------------------------------------------
function simulateAiTask(taskId: string, durationMs: number = 2000): Promise<string> {
  return new Promise((resolve) => {
    console.log(`  [AI] Processing task '${taskId}' ...`);
    setTimeout(() => {
      console.log(`  [AI] Finished task '${taskId}'`);
      resolve(`Result for '${taskId}'`);
    }, durationMs);
  });
}

// ---------------------------------------------------------------------------
// 1) SYNCHRONOUS approach — process one at a time, await each before next
// ---------------------------------------------------------------------------
async function synchronousDemo(tasks: string[]): Promise<number> {
  console.log("\n" + "=".repeat(60));
  console.log("SYNCHRONOUS DEMO — blocking, one at a time");
  console.log("=".repeat(60));

  const start = Date.now();
  const results: string[] = [];

  for (const taskId of tasks) {
    const result = await simulateAiTask(taskId, 2000); // wait for each
    results.push(result);
  }

  const elapsed = (Date.now() - start) / 1000;
  console.log(`\n  Total time (sync): ${elapsed.toFixed(2)}s`);
  console.log(`  Results: ${JSON.stringify(results)}`);
  return elapsed;
}

// ---------------------------------------------------------------------------
// 2) ASYNCHRONOUS approach — use a queue + worker
// ---------------------------------------------------------------------------
async function asynchronousDemo(tasks: string[]): Promise<{ producerTime: number; totalTime: number }> {
  console.log("\n" + "=".repeat(60));
  console.log("ASYNCHRONOUS DEMO — non-blocking, queue + worker");
  console.log("=".repeat(60));

  // Simple in-memory queue
  const queue: string[] = [];
  const results: string[] = [];

  // --- PRODUCER: enqueue tasks (instant, non-blocking) ---
  const prodStart = Date.now();
  for (const taskId of tasks) {
    queue.push(taskId);
    console.log(`  [Producer] Task '${taskId}' queued ✅  (instant)`);
  }
  const producerTime = (Date.now() - prodStart) / 1000;
  console.log(`\n  Producer finished in ${producerTime.toFixed(4)}s ← user is FREE now!`);

  // --- WORKER: processes tasks from queue in background ---
  const totalStart = Date.now();
  const workerPromises = queue.map(async (taskId) => {
    const result = await simulateAiTask(taskId, 2000);
    results.push(result);
  });

  await Promise.all(workerPromises);

  const totalTime = (Date.now() - totalStart) / 1000;
  console.log(`\n  Total worker time (async): ${totalTime.toFixed(2)}s`);
  console.log(`  Results: ${JSON.stringify(results)}`);
  return { producerTime, totalTime };
}

// ---------------------------------------------------------------------------
// MAIN — run both demos and compare
// ---------------------------------------------------------------------------
async function main() {
  const tasks = ["task-A", "task-B", "task-C"];

  const syncTime = await synchronousDemo(tasks);
  const { producerTime, totalTime } = await asynchronousDemo(tasks);

  console.log("\n" + "=".repeat(60));
  console.log("COMPARISON");
  console.log("=".repeat(60));
  console.log(`  Sync  — user waited:  ${syncTime.toFixed(2)}s  (blocked the whole time)`);
  console.log(`  Async — user waited:  ${producerTime.toFixed(4)}s  (got ack instantly)`);
  console.log(`  Async — total work:   ${totalTime.toFixed(2)}s  (done in background)`);
  console.log(`\n  Key insight: In async, the user is freed almost instantly!`);
}

main();
