# ITEL Tasks

> A hands-on study repository covering **Async Systems in AI**, **Embeddings & Vector Search**, **RAG Systems**, and **Sentry AI Observability** — complete with concept notes, TypeScript code examples, and runnable demos.

---

## 📁 Repository Structure

```
ITEL TASKS/
├── README.md                              ← You are here
├── package.json
├── tsconfig.json
├── task-async-systems-ai/                 ← Task 1: Async Systems
│   ├── README.md
│   ├── 01-why-async-systems/
│   ├── 02-producer-consumer/
│   ├── 03-worker-services/
│   ├── 04-retry-strategies/
│   ├── 05-dead-letter-queues/
│   ├── 06-job-orchestration/
│   ├── 07-rate-limiting/
│   └── 08-aws-sqs-overview/
├── task-embeddings-vector-search/         ← Task 2: Embeddings & Vector Search
│   ├── README.md
│   ├── 01-embeddings/
│   ├── 02-vector-similarity-search/
│   ├── 03-cosine-similarity/
│   ├── 04-vector-indexing/
│   ├── 05-metadata-filtering/
│   ├── 06-hybrid-search/
│   └── 07-rag-pipeline/
├── task-rag-systems/                      ← Task 3: RAG Systems
│   ├── README.md
│   ├── 01-retrieval-augmented-generation/
│   ├── 02-document-chunking/
│   ├── 03-ingestion-pipelines/
│   ├── 04-context-injection/
│   ├── 05-hallucination-mitigation/
│   └── 06-reranking/
└── task-sentry-ai-observability/          ← Task 4: Sentry AI Observability
    ├── README.md
    ├── 01-prompt-tracing/
    ├── 02-token-usage-tracking/
    ├── 03-latency-monitoring/
    ├── 04-debugging-prompts/
    └── 05-cost-monitoring/
```

Each sub-folder contains a `notes.md` (concept explanation) and an `examples/` directory with runnable TypeScript demos.

---

## 📚 Tasks Overview

### Task 1 — Async Systems in AI Applications

Covers messaging patterns, worker architectures, and AWS SQS for building resilient AI pipelines.

| # | Topic | Description |
|---|-------|-------------|
| 1 | Why Async Systems | Sync vs async processing trade-offs |
| 2 | Producer–Consumer | Queue-based decoupled architecture |
| 3 | Worker Services | Long-running background workers |
| 4 | Retry Strategies | Exponential back-off & jitter |
| 5 | Dead Letter Queues | Handling permanently failed messages |
| 6 | Job Orchestration | Multi-step pipeline coordination |
| 7 | Rate Limiting | Token-bucket algorithm |
| 8 | AWS SQS Overview | Managed queue service on AWS |

👉 [Full details → task-async-systems-ai/README.md](./task-async-systems-ai/README.md)

---

### Task 2 — Embeddings & Vector Search

Covers text embeddings, similarity search, and building RAG pipelines with Pinecone and OpenAI.

| # | Topic | Description |
|---|-------|-------------|
| 1 | Embeddings | Generating vector representations of text |
| 2 | Vector Similarity Search | Finding nearest neighbours in vector space |
| 3 | Cosine Similarity | Measuring angular distance between vectors |
| 4 | Vector Indexing | Index structures (IVF, HNSW) for fast lookup |
| 5 | Metadata Filtering | Combining vector search with attribute filters |
| 6 | Hybrid Search | Merging dense & sparse retrieval |
| 7 | RAG Pipeline | End-to-end Retrieval-Augmented Generation |

👉 [Full details → task-embeddings-vector-search/README.md](./task-embeddings-vector-search/README.md)

---

### Task 3 — RAG Systems

Covers retrieval-augmented generation end-to-end: chunking, ingestion, context injection, hallucination mitigation, and reranking.

| # | Topic | Description |
|---|-------|-------------|
| 1 | Retrieval-Augmented Generation | Full RAG architecture and pipeline |
| 2 | Document Chunking | Strategies for splitting documents into retrieval-friendly pieces |
| 3 | Ingestion Pipelines | Load → clean → chunk → embed → store workflow |
| 4 | Context Injection | Prompt augmentation patterns (stuffing, map-reduce, refine) |
| 5 | Hallucination Mitigation | Grounding, citation enforcement, confidence scoring |
| 6 | Reranking | Cross-encoder reranking and reciprocal rank fusion |

👉 [Full details → task-rag-systems/README.md](./task-rag-systems/README.md)

---

### Task 4 — Sentry AI Observability

Covers production-grade monitoring of LLM applications using Sentry's AI observability tooling — tracing prompts, tracking token usage, measuring latency, debugging conversations, and estimating costs.

| # | Topic | Description |
|---|-------|-------------|
| 1 | Prompt Tracing | Instrument LLM calls as Sentry spans (waterfall view) |
| 2 | Token Usage Tracking | Track input/output token counts per request |
| 3 | Latency Monitoring | Measure & compare response times across AI operations |
| 4 | Debugging Prompts | Link multi-turn conversations via `ai.pipeline.name` |
| 5 | Cost Monitoring | Estimate equivalent OpenAI cost from token usage |

👉 [Full details → task-sentry-ai-observability/README.md](./task-sentry-ai-observability/README.md)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18
- **npm** (comes with Node)

### Install Dependencies

```bash
npm install
```

### Run Demo Scripts

The project ships with pre-configured npm scripts for the key demos:

```bash
# Task 1 — Async Systems
npm run sync-demo            # Sync vs Async comparison
npm run retry-demo           # Retry with exponential back-off
npm run pipeline-demo        # Job orchestration pipeline
npm run rate-limit-demo      # Token-bucket rate limiter

# Task 2 — Embeddings & Vector Search
npm run cosine-demo          # Cosine similarity calculation
npm run hybrid-demo          # Hybrid search (dense + sparse)

# Task 3 — RAG Systems
npm run rag-demo             # Full RAG pipeline (Ollama)
npm run chunking-demo        # Document chunking strategies
npm run ingestion-demo       # Multi-document ingestion pipeline
npm run injection-demo       # Context injection strategies
npm run hallucination-demo   # Grounding and hallucination checks
npm run reranker-demo        # Reranking & RRF fusion

# Task 4 — Sentry AI Observability
npm run prompt-tracing-demo  # Prompt tracing with Sentry spans
npm run token-usage-demo     # Token usage tracking
npm run latency-demo         # Latency monitoring across AI calls
npm run debug-prompts-demo   # Multi-turn conversation debugging
npm run cost-monitor-demo    # Cost estimation from token usage
```

Or run any example directly:

```bash
npx tsx <path-to-example>.ts
```

> **Note:** Some demos (`producer.ts`, `consumer.ts`, `dlq-setup.ts`, `create-embeddings.ts`, etc.) require external services. See the prerequisites below.

---

## 🔑 External Service Requirements

| Service | Required For | Setup |
|---------|-------------|-------|
| **AWS SQS** | Producer/Consumer, DLQ, SQS overview demos | Run `aws configure` with valid credentials |
| **OpenAI API** | Embedding generation, RAG pipeline | Set `OPENAI_API_KEY` env var |
| **Pinecone** | Vector search, metadata filtering, RAG | Set `PINECONE_API_KEY` env var |
| **Ollama** | RAG demos, ingestion, context injection, Sentry demos | Install Ollama + pull `nomic-embed-text`, `llama3.2:1b` |
| **Sentry** | All Task 4 observability demos | Create a project at [sentry.io](https://sentry.io) and set `SENTRY_DSN` env var |

Standalone demos that need **no external services**: `sync-vs-async.ts`, `retry-with-backoff.ts`, `token-bucket.ts`, `cosine-similarity.ts`, `hybrid-search.ts`, `chunking-strategies.ts`, `hallucination-guard.ts`, `reranker.ts`.

---

## 🛠️ Tech Stack

| Tool | Purpose |
|------|---------|
| **TypeScript** | Type-safe code examples |
| **tsx** | Zero-config TS runner |
| **@aws-sdk/client-sqs** | AWS SQS integration |
| **openai** | OpenAI Embeddings API & Ollama-compatible client |
| **@pinecone-database/pinecone** | Pinecone vector database SDK |
| **ollama** | Local LLM inference |
| **@sentry/node** | Sentry Node.js SDK for AI observability |

---

## 📖 Reference Links

### Async Systems & AWS SQS

- [AWS SQS Developer Guide](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html)
- [SQS Dead Letter Queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html)
- [SQS Visibility Timeout](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html)
- [SQS Delay Queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-delay-queues.html)
- [AWS SDK for JS v3 — SQS](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/sqs/)

### Embeddings & Vector Search

- [Pinecone — Retrieval-Augmented Generation (RAG)](https://www.pinecone.io/learn/retrieval-augmented-generation/)
- [Pinecone — What is a Vector Database?](https://www.pinecone.io/learn/vector-database/)
- [Pinecone — Chunking Strategies](https://www.pinecone.io/learn/chunking-strategies/)
- [Pinecone — Hybrid Search](https://docs.pinecone.io/guides/search/hybrid-search)
- [Pinecone — Sparse Retrieval](https://www.pinecone.io/learn/sparse-retrieval/)
- [Pinecone — Reranking](https://www.pinecone.io/learn/refine-with-rerank/)
- [Pinecone TypeScript SDK](https://docs.pinecone.io/reference/typescript-sdk)

### RAG Systems

- [DeepLearning.AI — RAG Course](https://www.deeplearning.ai/courses/retrieval-augmented-generation-rag/)
- [Pinecone — Retrieval-Augmented Generation](https://www.pinecone.io/learn/retrieval-augmented-generation/)
- [Pinecone — Chunking Strategies](https://www.pinecone.io/learn/chunking-strategies/)
- [Cohere — Rerank API](https://docs.cohere.com/docs/rerank-2)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)

### Sentry AI Observability

- [Sentry — AI Monitoring Docs](https://docs.sentry.io/product/insights/ai/)
- [Sentry — OpenTelemetry & Tracing](https://docs.sentry.io/platforms/javascript/tracing/)
- [Sentry — Node.js SDK Setup](https://docs.sentry.io/platforms/javascript/guides/node/)
- [Sentry — Performance Monitoring](https://docs.sentry.io/product/performance/)
- [OpenAI — Token Usage Reference](https://platform.openai.com/docs/guides/production-best-practices)

---

## 📄 License

This project is for educational / study purposes.