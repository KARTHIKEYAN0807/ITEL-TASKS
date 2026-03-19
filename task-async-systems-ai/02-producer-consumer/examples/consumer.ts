/**
 * consumer.ts
 * ===========
 * SQS Consumer — polls an Amazon SQS queue and processes AI tasks.
 *
 * Install:  npm install @aws-sdk/client-sqs tsx
 * Run:      npx tsx consumer.ts
 *
 * Requires AWS credentials via `aws configure` or env vars.
 * Update QUEUE_URL with your actual SQS queue URL.
 */

import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";

// --- Configuration ---
const QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/123456789012/ai-tasks-queue";
const sqs = new SQSClient({ region: "us-east-1" });

// --- Task handlers ---
type TaskData = Record<string, unknown>;

async function handleReport(data: TaskData) {
  console.log(`    📝 Generating report for interview '${data.interviewId}' ...`);
  await sleep(2000); // simulate AI work
  console.log(`    📝 Report complete!`);
}

async function handleEmbeddings(data: TaskData) {
  console.log(`    🔢 Generating embeddings for doc '${data.documentId}' ...`);
  await sleep(3000);
  console.log(`    🔢 Embeddings generated!`);
}

async function handleTranscript(data: TaskData) {
  console.log(`    🎙️  Analyzing transcript '${data.transcriptId}' ...`);
  await sleep(2000);
  console.log(`    🎙️  Analysis done!`);
}

const TASK_HANDLERS: Record<string, (data: TaskData) => Promise<void>> = {
  generate_report: handleReport,
  generate_embeddings: handleEmbeddings,
  analyze_transcript: handleTranscript,
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Main consumer loop ---
async function runConsumer() {
  console.log("=".repeat(60));
  console.log("SQS CONSUMER — polling for messages ...");
  console.log("=".repeat(60));

  while (true) {
    const response = await sqs.send(
      new ReceiveMessageCommand({
        QueueUrl: QUEUE_URL,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 20,       // long polling
        VisibilityTimeout: 300,    // 5 min to process
      })
    );

    const messages = response.Messages ?? [];

    if (messages.length === 0) {
      console.log("  (no messages — waiting ...)");
      continue;
    }

    for (const message of messages) {
      const body = JSON.parse(message.Body ?? "{}");
      const taskType: string = body.task ?? "unknown";
      const handler = TASK_HANDLERS[taskType];

      console.log(`\n  Received task: ${taskType} (job ${body.jobId ?? "?"})`);

      if (!handler) {
        console.log(`  ⚠️  Unknown task type '${taskType}' — skipping`);
        continue;
      }

      try {
        await handler(body);

        // Success → delete message
        await sqs.send(
          new DeleteMessageCommand({
            QueueUrl: QUEUE_URL,
            ReceiptHandle: message.ReceiptHandle,
          })
        );
        console.log(`  ✅ Task '${taskType}' completed & deleted.`);
      } catch (err) {
        console.error(`  ❌ Task '${taskType}' FAILED:`, err);
        // Message becomes visible again after VisibilityTimeout
      }
    }

    await sleep(1000);
  }
}

runConsumer().catch(console.error);
