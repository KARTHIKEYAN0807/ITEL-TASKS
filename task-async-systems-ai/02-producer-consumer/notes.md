# Producer–Consumer Architecture

## What Is It?

The **Producer–Consumer** pattern separates the component that **creates** work (producer) from the component that **processes** work (consumer) using a **queue** as a buffer.

```
┌───────────┐     ┌─────────────────────┐     ┌───────────┐
│ PRODUCER  │     │        QUEUE        │     │ CONSUMER  │
│           │     │                     │     │           │
│ Creates   │────▶│  Message A          │────▶│ Processes │
│ messages  │     │  Message B          │     │ messages  │
│ (tasks)   │     │  Message C          │     │ (tasks)   │
│           │     │  Message D          │     │           │
└───────────┘     └─────────────────────┘     └───────────┘
    (Web App)          (Amazon SQS)            (Worker)
```

---

## How It Works (from AWS SQS docs)

From the [AWS SQS documentation](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html):

> *"There are three main parts in a distributed messaging system: the components of your distributed system, your queue (distributed on Amazon SQS servers), and the messages in the queue."*

> *"Your system has several producers (components that send messages to the queue) and consumers (components that receive messages from the queue). The queue redundantly stores the messages across multiple Amazon SQS servers."*

---

## Message Lifecycle (from AWS SQS Docs)

1. *"A producer sends message A to a queue, and the message is distributed across the Amazon SQS servers redundantly."*
2. *"When a consumer is ready, it receives messages from the queue. While being processed, the message remains in the queue but isn't returned during the **visibility timeout**."*
3. *"The consumer deletes the message to prevent it from being received again when the visibility timeout expires."*

```
Message Lifecycle:

  SEND ──▶ STORED ──▶ RECEIVED ──▶ PROCESSING ──▶ DELETED
                         │                           │
                         ▼                           │
                   Visibility Timeout          Success ──▶ Delete
                   (message hidden)            Failure ──▶ Visible again
```

> **Note:** *"SQS automatically deletes messages after the max retention period. Default is 4 days (configurable: 60 seconds to 14 days)."*

---

## Key Benefits

| Benefit | Description |
|---------|-------------|
| **Decoupling** | Producer and consumer don't need to know about each other |
| **Buffering** | Queue absorbs traffic spikes — workers process at their own pace |
| **Redundancy** | SQS stores messages across multiple servers for durability |
| **Scalability** | Add more producers or consumers independently |

---

## Code Examples

- [`examples/producer.ts`](./examples/producer.ts) — Sends AI task messages to an SQS queue
- [`examples/consumer.ts`](./examples/consumer.ts) — Polls the queue and processes messages

```bash
npx tsx 02-producer-consumer/examples/producer.ts
npx tsx 02-producer-consumer/examples/consumer.ts
```
