# Reranking

## What Is Reranking?

**Reranking** is a second-pass scoring step that re-orders retrieved chunks by relevance after the initial vector search. The initial retrieval is fast but approximate; reranking uses a more powerful model to produce a precise relevance ranking.

From Pinecone docs:

> *"Then we combine and de-duplicate the results and use a reranking model to rerank them based on a unified relevance score."*

---

## Why Reranking?

Initial retrieval (bi-encoder / vector search) is fast but has limitations:

```
Step 1: Vector Search (Bi-Encoder)         Step 2: Reranking (Cross-Encoder)
┌───────────────────────────────┐          ┌───────────────────────────────┐
│ Query and docs encoded        │          │ Query + doc scored TOGETHER   │
│ INDEPENDENTLY                 │          │ as a PAIR                     │
│                               │          │                               │
│ query  → [0.2, 0.8, ...]     │          │ (query, doc1) → score: 0.95  │
│ doc1   → [0.3, 0.7, ...]     │          │ (query, doc2) → score: 0.42  │
│ doc2   → [0.1, 0.9, ...]     │          │ (query, doc3) → score: 0.88  │
│                               │          │                               │
│ Fast (cosine similarity)      │          │ Slow but MUCH more accurate   │
│ Scales to millions of docs    │          │ Only runs on top-K results    │
└───────────────────────────────┘          └───────────────────────────────┘
```

| | Bi-Encoder (Retrieval) | Cross-Encoder (Reranking) |
|--|------------------------|---------------------------|
| **How** | Encode query & docs separately, compare | Encode query + doc together |
| **Speed** | Very fast (precomputed doc vectors) | Slow (runs at query time) |
| **Accuracy** | Good approximate ranking | Excellent precise ranking |
| **Scale** | Millions of documents | Top 20–100 candidates |
| **Role** | Cast a wide net (recall) | Pick the best (precision) |

---

## The Two-Stage Pipeline

```
User Query
    │
    ▼
┌──────────────────────┐
│  Stage 1: RETRIEVE   │     Fast, approximate
│  (Bi-Encoder)        │     → Returns top 50-100 candidates
│  Vector similarity   │
└──────────┬───────────┘
           │ top-K candidates
           ▼
┌──────────────────────┐
│  Stage 2: RERANK     │     Slow, precise
│  (Cross-Encoder)     │     → Re-orders by true relevance
│  Pairwise scoring    │
└──────────┬───────────┘
           │ top-N results
           ▼
    Final ranked results
    (passed to LLM)
```

---

## Reciprocal Rank Fusion (RRF)

When combining results from **multiple retrieval methods** (e.g. dense + sparse search), **Reciprocal Rank Fusion** merges the ranked lists into one.

### The Formula

```
RRF_score(doc) = Σ  1 / (k + rank_i(doc))
                 i

Where:
  k = smoothing constant (typically 60)
  rank_i(doc) = rank of the document in result list i
```

### Example

```
Dense search results:     Sparse search results:
  Rank 1: Doc A             Rank 1: Doc C
  Rank 2: Doc B             Rank 2: Doc A
  Rank 3: Doc C             Rank 3: Doc D

RRF scores (k=60):
  Doc A: 1/(60+1) + 1/(60+2) = 0.0164 + 0.0161 = 0.0325  ← Winner!
  Doc B: 1/(60+2) + 0         = 0.0161
  Doc C: 1/(60+3) + 1/(60+1) = 0.0159 + 0.0164 = 0.0323
  Doc D: 0        + 1/(60+3)  = 0.0159

Final order: Doc A > Doc C > Doc B > Doc D
```

| Pros | Cons |
|------|------|
| No training required | Doesn't consider actual relevance scores |
| Works across any number of rankers | The constant `k` is a hyperparameter |
| Simple and effective | Ignores the magnitude of score differences |

---

## Reranking Models

| Model | Provider | Notes |
|-------|----------|-------|
| `rerank-2` | Cohere | API-based, high quality |
| `bge-reranker-v2-m3` | BAAI | Open-source, multilingual |
| `cross-encoder/ms-marco-MiniLM-L-6-v2` | Sentence Transformers | Lightweight, popular |
| Pinecone Rerank | Pinecone | Built into Pinecone's API |

---

## When to Use Reranking

| Scenario | Use Reranking? |
|----------|----------------|
| Simple Q&A with small corpus | ❌ Overhead not worth it |
| Hybrid search (dense + sparse) | ✅ Must merge result lists |
| High-precision requirements | ✅ Cross-encoder catches what vector search misses |
| Latency-sensitive (< 100ms) | ⚠️ Adds 50–200ms; consider trade-off |
| Large candidate pool (> 20 results) | ✅ Most beneficial here |

---

## Code Example

See [`examples/reranker.ts`](./examples/reranker.ts) — simulates cross-encoder reranking and RRF fusion (**standalone, no API keys**).

```bash
npx tsx task-rag-systems/06-reranking/examples/reranker.ts
```

---

## Reference Links

- [Pinecone — Refine with Rerank](https://www.pinecone.io/learn/refine-with-rerank/)
- [Pinecone — Hybrid Search](https://docs.pinecone.io/guides/search/hybrid-search)
- [Cohere — Rerank API](https://docs.cohere.com/docs/rerank-2)
