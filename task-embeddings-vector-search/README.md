# Embeddings & Vector Search

**Reference:** [Pinecone — Retrieval-Augmented Generation (RAG)](https://www.pinecone.io/learn/retrieval-augmented-generation/)

---

## 📁 Folder Structure

```
task-embeddings-vector-search/
├── README.md                             ← You are here
├── 01-embeddings/
│   ├── notes.md
│   └── examples/
│       └── create-embeddings.ts
├── 02-vector-similarity-search/
│   ├── notes.md
│   └── examples/
│       └── similarity-search.ts
├── 03-cosine-similarity/
│   ├── notes.md
│   └── examples/
│       └── cosine-similarity.ts
├── 04-vector-indexing/
│   └── notes.md
├── 05-metadata-filtering/
│   ├── notes.md
│   └── examples/
│       └── metadata-filter.ts
├── 06-hybrid-search/
│   ├── notes.md
│   └── examples/
│       └── hybrid-search.ts
└── 07-rag-pipeline/
    ├── notes.md
    └── examples/
        └── rag-query.ts
```

## 📚 Topics

| # | Topic | Notes | Code Example |
|---|-------|-------|--------------|
| 1 | Embeddings | [notes.md](./01-embeddings/notes.md) | [create-embeddings.ts](./01-embeddings/examples/create-embeddings.ts) |
| 2 | Vector Similarity Search | [notes.md](./02-vector-similarity-search/notes.md) | [similarity-search.ts](./02-vector-similarity-search/examples/similarity-search.ts) |
| 3 | Cosine Similarity | [notes.md](./03-cosine-similarity/notes.md) | [cosine-similarity.ts](./03-cosine-similarity/examples/cosine-similarity.ts) |
| 4 | Vector Indexing | [notes.md](./04-vector-indexing/notes.md) | — (conceptual) |
| 5 | Metadata Filtering | [notes.md](./05-metadata-filtering/notes.md) | [metadata-filter.ts](./05-metadata-filtering/examples/metadata-filter.ts) |
| 6 | Hybrid Search | [notes.md](./06-hybrid-search/notes.md) | [hybrid-search.ts](./06-hybrid-search/examples/hybrid-search.ts) |
| 7 | RAG Pipeline | [notes.md](./07-rag-pipeline/notes.md) | [rag-query.ts](./07-rag-pipeline/examples/rag-query.ts) |

## 🔧 Running the Code Examples

```bash
# Install dependencies
npm install openai @pinecone-database/pinecone tsx typescript

# Run any example
npx tsx 03-cosine-similarity/examples/cosine-similarity.ts
```

> **Note:** `cosine-similarity.ts` and `hybrid-search.ts` run standalone. Others require OpenAI / Pinecone API keys set as env vars.
