# Async Systems in AI Applications

**Reference:** [AWS SQS Developer Guide](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html)

---

## 📁 Folder Structure

```
task-async-systems-ai/
├── README.md                          ← You are here
├── 01-why-async-systems/
│   ├── notes.md
│   └── examples/
│       └── sync-vs-async.ts
├── 02-producer-consumer/
│   ├── notes.md
│   └── examples/
│       ├── producer.ts
│       └── consumer.ts
├── 03-worker-services/
│   ├── notes.md
│   └── examples/
│       └── worker.ts
├── 04-retry-strategies/
│   ├── notes.md
│   └── examples/
│       └── retry-with-backoff.ts
├── 05-dead-letter-queues/
│   ├── notes.md
│   └── examples/
│       └── dlq-setup.ts
├── 06-job-orchestration/
│   ├── notes.md
│   └── examples/
│       └── pipeline.ts
├── 07-rate-limiting/
│   ├── notes.md
│   └── examples/
│       └── token-bucket.ts
└── 08-aws-sqs-overview/
    └── notes.md
```

## 📚 Topics

| # | Topic | Notes | Code Example |
|---|-------|-------|--------------|
| 1 | Why Async Systems in AI | [notes.md](./01-why-async-systems/notes.md) | [sync-vs-async.ts](./01-why-async-systems/examples/sync-vs-async.ts) |
| 2 | Producer–Consumer Architecture | [notes.md](./02-producer-consumer/notes.md) | [producer.ts](./02-producer-consumer/examples/producer.ts), [consumer.ts](./02-producer-consumer/examples/consumer.ts) |
| 3 | Worker Services | [notes.md](./03-worker-services/notes.md) | [worker.ts](./03-worker-services/examples/worker.ts) |
| 4 | Retry Strategies | [notes.md](./04-retry-strategies/notes.md) | [retry-with-backoff.ts](./04-retry-strategies/examples/retry-with-backoff.ts) |
| 5 | Dead Letter Queues | [notes.md](./05-dead-letter-queues/notes.md) | [dlq-setup.ts](./05-dead-letter-queues/examples/dlq-setup.ts) |
| 6 | Job Orchestration | [notes.md](./06-job-orchestration/notes.md) | [pipeline.ts](./06-job-orchestration/examples/pipeline.ts) |
| 7 | Rate Limiting | [notes.md](./07-rate-limiting/notes.md) | [token-bucket.ts](./07-rate-limiting/examples/token-bucket.ts) |
| 8 | AWS SQS Overview | [notes.md](./08-aws-sqs-overview/notes.md) | — |

## 🔧 Running the Code Examples

```bash
# Install dependencies
npm install @aws-sdk/client-sqs tsx typescript

# Run any example with tsx (TypeScript runner)
npx tsx 01-why-async-systems/examples/sync-vs-async.ts
```

> **Note:** Examples that connect to AWS SQS need valid AWS credentials (`aws configure`). The `sync-vs-async.ts`, `retry-with-backoff.ts`, and `token-bucket.ts` examples run standalone without AWS.
