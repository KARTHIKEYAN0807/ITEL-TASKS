# Vector Similarity Search

## What Is It?

**Vector similarity search** (semantic search) finds items whose vector embeddings are **closest** to a query vector. Instead of matching keywords, it matches **meaning**.

```
Traditional Keyword Search:
  Query: "automobile repair"
  Finds:  documents containing "automobile" and "repair"
  Misses: "car maintenance", "vehicle servicing"

Vector Similarity Search:
  Query: "automobile repair" → [0.82, 0.14, ...]
  Finds:  "car maintenance", "vehicle servicing", "fixing engines"
          (even without the exact words!)
```

---

## How It Works

```
Step 1: Embed the query
  "How do I fix my car?" ──▶ Query Vector [0.82, 0.14, 0.67, ...]

Step 2: Compare against stored vectors
  ┌─────────────────────────────────────────────────────┐
  │  Vector Database                                    │
  │  Doc 1: "Car repair guide"     → Distance: 0.05 ✅  │
  │  Doc 2: "Vehicle maintenance"  → Distance: 0.08 ✅  │
  │  Doc 3: "Pizza recipes"        → Distance: 0.89 ❌  │
  │  Doc 4: "Engine troubleshoot"  → Distance: 0.12 ✅  │
  └─────────────────────────────────────────────────────┘

Step 3: Return top-K closest results
  → Doc 1 (score: 0.95)
  → Doc 2 (score: 0.92)
  → Doc 4 (score: 0.88)
```

---

## Distance Metrics

| Metric | Range | When to Use |
|--------|-------|-------------|
| **Cosine Similarity** | -1 to 1 | Most common for text embeddings |
| **Euclidean (L2)** | 0 to ∞ | When magnitude matters |
| **Dot Product** | -∞ to ∞ | Normalized vectors, fast computation |

---

## Code Example

See [`examples/similarity-search.ts`](./examples/similarity-search.ts) — searches a Pinecone index by semantic similarity.

```bash
PINECONE_API_KEY="..." OPENAI_API_KEY="sk-..." npx tsx similarity-search.ts
```
