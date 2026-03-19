/**
 * dlq-setup.ts
 * ============
 * Creates an SQS main queue + Dead Letter Queue with a redrive policy,
 * then checks the DLQ for failed messages.
 *
 * Install:  npm install @aws-sdk/client-sqs tsx
 * Run:      npx tsx dlq-setup.ts
 */

import {
  SQSClient,
  CreateQueueCommand,
  GetQueueAttributesCommand,
  ReceiveMessageCommand,
} from "@aws-sdk/client-sqs";

const sqs = new SQSClient({ region: "us-east-1" });

async function setupQueues() {
  console.log("=".repeat(60));
  console.log("DLQ SETUP — creating main queue + dead letter queue");
  console.log("=".repeat(60));

  // Step 1: Create the Dead Letter Queue
  const dlqResult = await sqs.send(
    new CreateQueueCommand({
      QueueName: "ai-tasks-dlq",
      Attributes: {
        MessageRetentionPeriod: "1209600", // 14 days (maximum)
      },
    })
  );
  const dlqUrl = dlqResult.QueueUrl!;
  console.log(`\n  ✅ DLQ created: ${dlqUrl}`);

  // Get the DLQ ARN (needed for the redrive policy)
  const dlqAttrs = await sqs.send(
    new GetQueueAttributesCommand({
      QueueUrl: dlqUrl,
      AttributeNames: ["QueueArn"],
    })
  );
  const dlqArn = dlqAttrs.Attributes!["QueueArn"];

  // Step 2: Create the Main Queue with a Redrive Policy
  const mainResult = await sqs.send(
    new CreateQueueCommand({
      QueueName: "ai-tasks-queue",
      Attributes: {
        VisibilityTimeout: "300",         // 5 minutes
        MessageRetentionPeriod: "345600", // 4 days
        RedrivePolicy: JSON.stringify({
          deadLetterTargetArn: dlqArn,
          maxReceiveCount: 3, // Move to DLQ after 3 failures
        }),
      },
    })
  );
  console.log(`  ✅ Main Queue created: ${mainResult.QueueUrl}`);
  console.log(`  📋 Redrive Policy: after 3 failures → DLQ (${dlqArn})`);

  return dlqUrl;
}

// Monitor the DLQ for failed messages
async function checkDlq(dlqUrl: string) {
  console.log("\n" + "=".repeat(60));
  console.log("CHECKING DLQ FOR FAILED MESSAGES");
  console.log("=".repeat(60));

  const response = await sqs.send(
    new ReceiveMessageCommand({
      QueueUrl: dlqUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 5,
    })
  );

  const messages = response.Messages ?? [];

  if (messages.length > 0) {
    console.log(`\n  ⚠️  ${messages.length} failed message(s) in DLQ:`);
    for (const msg of messages) {
      const body = JSON.parse(msg.Body ?? "{}");
      console.log(`    Task: ${body.task ?? "?"} | ID: ${body.interviewId ?? body.documentId ?? "?"}`);
    }
  } else {
    console.log("\n  ✅ DLQ is empty — all messages processed successfully");
  }
}

async function main() {
  const dlqUrl = await setupQueues();
  await checkDlq(dlqUrl);
}

main().catch(console.error);
