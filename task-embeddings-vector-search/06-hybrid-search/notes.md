# Hybrid Search

## What Is Hybrid Search?

**Hybrid search** combines two types of search:

1. **Semantic search** (dense vectors) — understands **meaning** and **context**
2. **Keyword/lexical search** (sparse vectors) — matches **exact terms**

From the [Pinecone docs](https://www.pinecone.io/learn/retrieval-augmented-generation/):

> *"By using hybrid search, combining both semantic search (with dense vectors) and lexical search (with sparse vectors), you can improve the retrieval results even more. This becomes relevant when your users don't always use the same language to talk about a topic (semantic search) and they refer to internal, domain-specific language (lexical or keyword search) like acronyms, product names, or team names."*

---

## Why Hybrid Search?

```
Example: User searches for "BERT model performance"

Semantic Search Only:
  ✅ Finds: "Transformer-based language model accuracy"
  ❌ Misses: "BERT-base evaluation on SQuAD" (exact term)

Keyword Search Only:
  ✅ Finds: "BERT-base evaluation on SQuAD"
  ❌ Misses: "Transformer-based language model accuracy"

Hybrid Search:
  ✅ Finds BOTH! Best of both worlds
```

---

## How It Works

```
User Query
    │
  ┌─┴──┐
  ▼    ▼
Dense  Sparse   ← Two types of embeddings
Search Search
  │    │
  └─┬──┘
    ▼
 Combine & De-dup
    ▼
  Rerank         ← Reranking model scores all results
    ▼
 Final Results
```

---

## Dense vs Sparse Vectors

| | Dense | Sparse |
|--|-------|--------|
| **Values** | All dimensions non-zero | Most dimensions zero |
| **Example** | `[0.12, 0.45, 0.78, ...]` | `[0, 0, 0.8, 0, 0, 0.3, ...]` |
| **Created by** | Embedding models (OpenAI) | BM25, SPLADE, TF-IDF |
| **Good at** | Synonyms, context | Exact term matching |

---

## Reranking

From Pinecone docs:

> *"Then we combine and de-duplicate the results and use a reranking model to rerank them based on a unified relevance score."*

---

## Code Example

See [`examples/hybrid-search.ts`](./examples/hybrid-search.ts) — simulates hybrid search locally (**runs standalone, no API keys**).

```bash
npx tsx 06-hybrid-search/examples/hybrid-search.ts
```
