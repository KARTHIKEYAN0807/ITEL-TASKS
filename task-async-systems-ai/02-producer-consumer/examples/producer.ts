export {};

/**
 * producer.ts
 * ===========
 * SQS Producer — sends AI task messages to an Amazon SQS queue.
 *
 * Install:  npm install @aws-sdk/client-sqs tsx
 * Run:      npx tsx producer.ts
 *
 * Requires AWS credentials via `aws configure` or env vars.
 * Update QUEUE_URL with your actual SQS queue URL.
 */

import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { randomUUID } from "crypto";

// --- Configuration ---
const QUEUE_URL = "https://sqs.us-east-1.amazonaws.com/123456789012/ai-tasks-queue";
const sqs = new SQSClient({ region: "us-east-1" });

// --- Send a single task to the queue ---
async function sendTask(taskType: string, payload: Record<string, unknown>) {
  const message = {
    task: taskType,
    jobId: randomUUID(),
    timestamp: new Date().toISOString(),
    ...payload,
  };

  const command = new SendMessageCommand({
    QueueUrl: QUEUE_URL,
    MessageBody: JSON.stringify(message),
    MessageAttributes: {
      TaskType: {
        DataType: "String",
        StringValue: taskType,
      },
    },
  });

  const response = await sqs.send(command);
  console.log(`✅ Sent '${taskType}' | MessageId: ${response.MessageId}`);
  return response;
}

// --- Main: produce several AI tasks ---
async function main() {
  console.log("=".repeat(60));
  console.log("SQS PRODUCER — sending AI tasks to the queue");
  console.log("=".repeat(60));

  // Task 1: generate a report
  await sendTask("generate_report", {
    interviewId: "int-001",
    candidateId: "cand-042",
  });

  // Task 2: generate embeddings
  await sendTask("generate_embeddings", {
    documentId: "doc-789",
    documentUrl: "https://example.com/docs/whitepaper.pdf",
  });

  // Task 3: analyze a transcript
  await sendTask("analyze_transcript", {
    transcriptId: "txn-555",
    language: "en",
  });

  console.log("\nAll tasks queued! Workers will pick them up.");
}

main().catch(console.error);
