# Dead Letter Queues (DLQ)

## What Is a Dead Letter Queue?

A **Dead Letter Queue** is a special queue that receives messages that could not be processed after a specified number of attempts. It's a safety net for "poison messages" — messages that consistently fail.

From the [AWS SQS docs](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html):

> Amazon SQS offers common constructs such as **dead-letter queues** and cost allocation tags.

```
Normal Flow:
  Main Queue ──▶ Worker ──▶ Success ──▶ Delete message ✅

Failure Flow:
  Main Queue ──▶ Worker ──▶ Fail (attempt 1)
  Main Queue ──▶ Worker ──▶ Fail (attempt 2)
  Main Queue ──▶ Worker ──▶ Fail (attempt 3)  ← maxReceiveCount reached!
       │
       ▼
  Dead Letter Queue ──▶ Message stored for investigation 🔍
```

---

## Why DLQs Are Critical in AI Apps

| Scenario | Without DLQ | With DLQ |
|----------|-------------|----------|
| Malformed input | Retries infinitely, wasting resources | After 3 fails, moved to DLQ for review |
| AI model bug | Poison message blocks queue | Quarantined, other messages proceed |
| Corrupt data | Worker crashes repeatedly | Isolated, logged, and alertable |

---

## Code Example

See [`examples/dlq-setup.ts`](./examples/dlq-setup.ts) — creates a main queue + DLQ with a redrive policy, then monitors the DLQ.

```bash
npx tsx 05-dead-letter-queues/examples/dlq-setup.ts
```
