# Worker Services

## What Is a Worker Service?

A **worker service** is a standalone process that runs in the background, separate from the main web application. It **consumes messages from a queue** and executes the tasks they describe.

```
                    ┌────────────────────────────────────────────┐
                    │           WORKER SERVICE                   │
                    │                                            │
  ┌───────┐         │  ┌──────────┐   ┌──────────┐   ┌────────┐ │
  │ Queue │────────▶│  │  Poll    │──▶│ Process  │──▶│ Report │ │
  │ (SQS) │         │  │  Message │   │ Task     │   │ Result │ │
  └───────┘         │  └──────────┘   └──────────┘   └────────┘ │
                    │                                            │
                    │  Runs independently of the web server      │
                    └────────────────────────────────────────────┘
```

---

## Worker Architecture for AI Apps

```
┌──────────────────────────────────────────────────────────────┐
│                    AI WORKER SERVICE                          │
│                                                              │
│  ┌──────────────┐                                           │
│  │ Queue Poller │  ← Pulls messages from SQS                │
│  └──────┬───────┘                                           │
│         ▼                                                    │
│  ┌──────────────┐                                           │
│  │ Task Router  │  ← Routes to correct handler              │
│  └──────┬───────┘                                           │
│    ┌────┴────┬──────────┐                                   │
│    ▼         ▼          ▼                                    │
│ ┌──────┐ ┌────────┐ ┌──────────┐                           │
│ │Report│ │Embedding│ │Transcript│  ← Task-specific handlers │
│ │Gen   │ │Gen      │ │Analysis  │                           │
│ └──────┘ └────────┘ └──────────┘                           │
└──────────────────────────────────────────────────────────────┘
```

---

## Scaling Workers

```
Low Load:
  Queue ──▶ [Worker 1]

High Load (scale horizontally):
  Queue ──▶ [Worker 1]
        ──▶ [Worker 2]
        ──▶ [Worker 3]
        ──▶ [Worker 4]

Each worker independently polls the queue.
SQS ensures each message goes to only one worker (visibility timeout).
```

---

## Code Example

See [`examples/worker.ts`](./examples/worker.ts) — a multi-task worker service.

```bash
npx tsx 03-worker-services/examples/worker.ts
```
