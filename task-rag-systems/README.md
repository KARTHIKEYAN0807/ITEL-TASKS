# RAG Systems

**Reference:** [DeepLearning.AI — RAG Course](https://www.deeplearning.ai/courses/retrieval-augmented-generation-rag/) | [Pinecone — RAG](https://www.pinecone.io/learn/retrieval-augmented-generation/)

---

## 📁 Folder Structure

```
task-rag-systems/
├── README.md                                   ← You are here
├── 01-retrieval-augmented-generation/
│   ├── notes.md
│   └── examples/
│       └── rag-basics.ts
├── 02-document-chunking/
│   ├── notes.md
│   └── examples/
│       └── chunking-strategies.ts
├── 03-ingestion-pipelines/
│   ├── notes.md
│   └── examples/
│       └── ingestion-pipeline.ts
├── 04-context-injection/
│   ├── notes.md
│   └── examples/
│       └── context-injection.ts
├── 05-hallucination-mitigation/
│   ├── notes.md
│   └── examples/
│       └── hallucination-guard.ts
└── 06-reranking/
    ├── notes.md
    └── examples/
        └── reranker.ts
```

## 📚 Topics

| # | Topic | Notes | Code Example |
|---|-------|-------|--------------| 
| 1 | Retrieval-Augmented Generation | [notes.md](./01-retrieval-augmented-generation/notes.md) | [rag-basics.ts](./01-retrieval-augmented-generation/examples/rag-basics.ts) |
| 2 | Document Chunking | [notes.md](./02-document-chunking/notes.md) | [chunking-strategies.ts](./02-document-chunking/examples/chunking-strategies.ts) |
| 3 | Ingestion Pipelines | [notes.md](./03-ingestion-pipelines/notes.md) | [ingestion-pipeline.ts](./03-ingestion-pipelines/examples/ingestion-pipeline.ts) |
| 4 | Context Injection | [notes.md](./04-context-injection/notes.md) | [context-injection.ts](./04-context-injection/examples/context-injection.ts) |
| 5 | Hallucination Mitigation | [notes.md](./05-hallucination-mitigation/notes.md) | [hallucination-guard.ts](./05-hallucination-mitigation/examples/hallucination-guard.ts) |
| 6 | Reranking | [notes.md](./06-reranking/notes.md) | [reranker.ts](./06-reranking/examples/reranker.ts) |

## 🔧 Running the Code Examples

```bash
# Install dependencies (from root)
npm install

# Standalone demos (no API keys / Ollama needed):
npx tsx task-rag-systems/02-document-chunking/examples/chunking-strategies.ts
npx tsx task-rag-systems/05-hallucination-mitigation/examples/hallucination-guard.ts
npx tsx task-rag-systems/06-reranking/examples/reranker.ts

# Ollama-powered demos (requires Ollama with models):
ollama pull nomic-embed-text
ollama pull llama3.2:1b
npx tsx task-rag-systems/01-retrieval-augmented-generation/examples/rag-basics.ts
npx tsx task-rag-systems/03-ingestion-pipelines/examples/ingestion-pipeline.ts
npx tsx task-rag-systems/04-context-injection/examples/context-injection.ts
```

> **Note:** `chunking-strategies.ts`, `hallucination-guard.ts`, and `reranker.ts` run standalone. Others require Ollama running locally.
