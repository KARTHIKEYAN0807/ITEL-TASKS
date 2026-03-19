# Vector Indexing

## What Is Vector Indexing?

A **vector index** organizes vectors for **fast similarity search**. Without an index, finding the most similar vector requires comparing against every single vector (brute force) — impossibly slow at scale.

```
Brute Force (No Index):
  Compare query to ALL 10 million vectors → O(n) → SLOW ❌

With Index:
  Compare query to a smart subset → O(log n) → FAST ✅
```

---

## Common Indexing Algorithms

### 1. IVF (Inverted File Index)

Clusters vectors into groups. At query time, only searches the nearest clusters.

```
       ┌─────────┐ ┌─────────┐ ┌─────────┐
       │Cluster 1│ │Cluster 2│ │Cluster 3│
       │ (1000)  │ │ (1200)  │ │ (800)   │
       └─────────┘ └─────────┘ └─────────┘
            ▲
       Query falls here
       → Only compare 1000 vectors instead of 3000!
```

### 2. HNSW (Hierarchical Navigable Small World)

Graph-based index. Vectors are connected in a multi-layer graph. Search navigates from coarse to fine.

```
Layer 3 (few nodes):     A ───────── B
Layer 2 (more nodes):    A ─── C ─── B ─── D
Layer 1 (most nodes):    A─E─C─F─G─B─H─D─I

Search: Start top layer, navigate down to find nearest neighbors
```

### 3. PQ (Product Quantization)

Compresses vectors by splitting into sub-vectors and encoding each with a codebook. Reduces memory.

```
Original: [0.12, 0.45, 0.78, 0.91, 0.34, 0.67, 0.23, 0.56]
         → Split: [0.12, 0.45] | [0.78, 0.91] | [0.34, 0.67] | [0.23, 0.56]
         → Codes: [42, 17, 88, 3]  ← Much smaller!
```

---

## Comparison

| Algorithm | Speed | Accuracy | Memory | Best For |
|-----------|-------|----------|--------|----------|
| **Flat (Brute Force)** | Slow | 100% exact | High | Small datasets (<100K) |
| **IVF** | Fast | ~95-99% | Medium | Medium datasets (100K-10M) |
| **HNSW** | Very Fast | ~98-99% | High | Large datasets, real-time search |
| **PQ** | Very Fast | ~90-95% | Very Low | Huge datasets (100M+) |
| **IVF-PQ** | Fast | ~92-97% | Low | Large datasets, memory-constrained |

---

## Creating an Index in Pinecone (TypeScript)

```typescript
import { Pinecone } from "@pinecone-database/pinecone";

const pc = new Pinecone({ apiKey: "YOUR_API_KEY" });

// Create a serverless vector index
await pc.createIndex({
  name: "knowledge-base",
  dimension: 1536,       // must match embedding model
  metric: "cosine",      // cosine, euclidean, or dotproduct
  spec: {
    serverless: {
      cloud: "aws",
      region: "us-east-1",
    },
  },
});

const index = pc.index("knowledge-base");

// Upsert vectors with metadata
await index.upsert([
  {
    id: "doc-1",
    values: [0.1, 0.2, /* ... 1536 dims */],
    metadata: { title: "ML Basics", category: "AI" },
  },
  {
    id: "doc-2",
    values: [0.3, 0.4, /* ... 1536 dims */],
    metadata: { title: "Neural Networks", category: "AI" },
  },
]);
```

> **Note:** This topic is conceptual — no standalone runnable example since index creation requires a Pinecone account.
