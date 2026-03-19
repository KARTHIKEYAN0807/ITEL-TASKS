# Why Async Systems Are Needed in AI Apps

## The Problem with Synchronous Processing

AI applications involve computationally expensive operations:

- **Model inference** — Running an LLM can take seconds to minutes per request
- **Embedding generation** — Converting documents/images to vectors is CPU/GPU intensive
- **Data preprocessing** — Cleaning, chunking, and transforming data before AI processing
- **Report generation** — Compiling AI-driven analysis into reports is time-consuming

In a **synchronous** (blocking) system, the user sends a request and waits. If the AI task takes 30 seconds, the user and all server resources are blocked for 30 seconds.

```
❌ Synchronous Flow (Blocking)

┌──────┐         ┌──────────┐
│ User │──req──▶ │  Server  │──(30s AI work)──▶ response
│      │◀─wait─  │          │
└──────┘         └──────────┘

⚠️ User blocked for 30s
⚠️ Server thread occupied for 30s
⚠️ If 100 users hit at once → server overload
```

---

## The Async Solution

With an **asynchronous** (non-blocking) system, the server accepts the request, puts it on a **queue**, and immediately responds. A separate **worker** picks up the job in the background.

```
✅ Asynchronous Flow (Non-Blocking)

┌──────┐         ┌──────────┐       ┌───────┐       ┌────────┐
│ User │──req──▶ │  Server  │──▶    │ Queue │──▶    │ Worker │
│      │◀─ack──  │          │       │(SQS)  │       │        │
└──────┘         └──────────┘       └───────┘       └────────┘

✅ User gets immediate response ("Job accepted")
✅ Server is free to handle more requests
✅ Worker processes at its own pace
✅ Can scale workers independently
```

---

## Key Reasons for Async in AI

| Reason | Explanation |
|--------|-------------|
| **Long-running tasks** | AI inference, training, and data processing take significant time |
| **Scalability** | Decouple request acceptance from processing — scale workers independently |
| **Reliability** | If a worker crashes, the message stays in the queue for retry |
| **Cost efficiency** | Use GPU workers only when needed, not idle waiting for requests |
| **User experience** | Users get instant feedback instead of waiting for long operations |
| **Rate limit management** | Control how fast you call external AI APIs (OpenAI, etc.) |

---

## Real-World AI Use Cases

1. **Chatbot with document processing** — User uploads a PDF → async pipeline chunks it, generates embeddings, stores in vector DB
2. **AI report generation** — User requests analysis → job queued → worker generates report → user notified
3. **Batch inference** — Process thousands of images through an ML model without blocking the web server
4. **Fine-tuning pipelines** — Queue training jobs that run for hours on GPU instances

---

## Code Example

See [`examples/sync-vs-async.ts`](./examples/sync-vs-async.ts) — runnable demo comparing sync vs async processing.

Run it:
```bash
npx tsx 01-why-async-systems/examples/sync-vs-async.ts
```
