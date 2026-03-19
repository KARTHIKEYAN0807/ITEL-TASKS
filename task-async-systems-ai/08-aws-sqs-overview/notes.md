# AWS SQS Overview

## SQS Key Features (from AWS Docs)

| Feature | Description |
|---------|-------------|
| **Security** | Control who can send/receive messages; server-side encryption (SSE) with AWS KMS |
| **Durability** | Messages stored on multiple servers; standard queues = at-least-once delivery; FIFO = exactly-once |
| **Availability** | Redundant infrastructure for high availability |
| **Scalability** | Transparently scales to handle any load without provisioning |
| **Reliability** | Locks messages during processing; supports multiple producers and consumers |
| **Customization** | Delay queues, message retention (60s to 14 days), large message support via S3 |

---

## Queue Types

| | Standard Queue | FIFO Queue |
|--|---------------|------------|
| **Ordering** | Best-effort ordering | Strict first-in-first-out |
| **Delivery** | At-least-once (may deliver duplicates) | Exactly-once processing |
| **Throughput** | Nearly unlimited | 300 msg/sec (3,000 with batching) |
| **Use case** | High throughput tasks | Order-critical tasks |

---

## SQS vs SNS vs Amazon MQ (from AWS Docs)

> *"Amazon SQS decouples and scales distributed software systems as a queue service. It processes messages through a single subscriber typically."*

> *"Amazon SNS allows publishers to send messages to multiple subscribers through topics."*

> *"Amazon MQ fits best with enterprises migrating from traditional message brokers, supporting AMQP, MQTT, etc."*

| Service | Type | Best For |
|---------|------|----------|
| **Amazon SQS** | Queue (point-to-point) | Task processing, decoupling services |
| **Amazon SNS** | Pub/Sub (fan-out) | Notifications, broadcasting to multiple subscribers |
| **Amazon MQ** | Message Broker | Legacy system migration (AMQP, MQTT) |

---

## Important SQS Configuration Values

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| **VisibilityTimeout** | 30 seconds | 0s – 12 hours | How long a message is hidden after being received |
| **MessageRetentionPeriod** | 4 days | 60s – 14 days | How long messages are kept in the queue |
| **WaitTimeSeconds** | 0 (short poll) | 0 – 20s | Long polling wait time |
| **MaxReceiveCount** | N/A | Set in redrive policy | Attempts before sending to DLQ |
| **DelaySeconds** | 0 | 0 – 900s (15 min) | Delay before message becomes visible |

---

## Summary of All Topics

| Concept | Key Takeaway |
|---------|-------------|
| **Async systems** | Essential for AI apps due to long-running, resource-intensive operations |
| **Producer-consumer** | Decouples request handling from processing using a queue buffer |
| **Worker services** | Independent processes that consume and execute queued tasks |
| **Retry strategies** | Exponential backoff + jitter is the gold standard for AI APIs |
| **Dead letter queues** | Safety net for messages that repeatedly fail processing |
| **Job orchestration** | Coordinates multi-step AI pipelines (sequential, fan-out, saga) |
| **Rate limiting** | Controls the pace of AI API calls to stay within service limits |

---

## References

- [AWS SQS Developer Guide](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html)
- [AWS SQS Dead Letter Queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html)
- [AWS SQS Visibility Timeout](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html)
- [AWS SQS Delay Queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-delay-queues.html)
