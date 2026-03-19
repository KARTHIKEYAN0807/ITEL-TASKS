export {};

/**
 * worker.ts
 * =========
 * Multi-task AI Worker Service — polls SQS and routes to task handlers.
 *
 * Install:  npm install @aws-sdk/client-sqs tsx
 * Run:      npx tsx worker.ts
 */

import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";

// --- Configuration ---
const QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/123456789012/ai-tasks-queue";
const sqs = new SQSClient({ region: "us-east-1" });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// --- Task-specific handlers ---
type TaskData = Record<string, unknown>;

async function handleReportGeneration(data: TaskData): Promise<object> {
  console.log(`    📝 Generating report for interview '${data.interviewId}' ...`);
  await sleep(2000); // simulate AI work
  return { status: "completed", reportUrl: "https://example.com/report.pdf" };
}

async function handleEmbeddingGeneration(data: TaskData): Promise<object> {
  console.log(`    🔢 Generating embeddings for document '${data.documentId}' ...`);
  await sleep(3000);
  return { status: "completed", vectorsCount: 150 };
}

async function handleTranscriptAnalysis(data: TaskData): Promise<object> {
  console.log(`    🎙️  Analyzing transcript '${data.transcriptId}' ...`);
  await sleep(2000);
  return { status: "completed", insightsCount: 5 };
}

// --- Handler registry ---
const TASK_HANDLERS: Record<string, (data: TaskData) => Promise<object>> = {
  generate_report: handleReportGeneration,
  generate_embeddings: handleEmbeddingGeneration,
  analyze_transcript: handleTranscriptAnalysis,
};

// --- Main worker loop ---
async function runWorker() {
  console.log("=".repeat(60));
  console.log("AI WORKER SERVICE — polling for tasks ...");
  console.log("=".repeat(60));

  while (true) {
    try {
      const response = await sqs.send(
        new ReceiveMessageCommand({
          QueueUrl: QUEUE_URL,
          MaxNumberOfMessages: 10,  // batch up to 10
          WaitTimeSeconds: 20,      // long polling
          VisibilityTimeout: 300,   // 5 min to process
        })
      );

      const messages = response.Messages ?? [];

      for (const message of messages) {
        const body = JSON.parse(message.Body ?? "{}");
        const taskType: string = body.task ?? "unknown";
        const handler = TASK_HANDLERS[taskType];

        console.log(`\n  📥 Received: ${taskType} (job ${body.jobId ?? "?"})`);

        if (!handler) {
          console.warn(`  ⚠️  Unknown task '${taskType}' — skipping`);
          continue;
        }

        try {
          const result = await handler(body);
          console.log(`  ✅ ${taskType} completed:`, result);

          // Delete on success
          await sqs.send(
            new DeleteMessageCommand({
              QueueUrl: QUEUE_URL,
              ReceiptHandle: message.ReceiptHandle,
            })
          );
        } catch (err) {
          console.error(`  ❌ ${taskType} FAILED:`, err);
          // Message becomes visible again after VisibilityTimeout
        }
      }
    } catch (err) {
      console.error("Worker error:", err);
      await sleep(5000); // back off on errors
    }
  }
}

runWorker().catch(console.error);
