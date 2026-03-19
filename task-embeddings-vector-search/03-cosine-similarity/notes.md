# Cosine Similarity

## What Is Cosine Similarity?

**Cosine similarity** measures the **angle** between two vectors, regardless of their magnitude. It is the most commonly used metric for comparing text embeddings.

- **Score = 1.0** → Identical meaning
- **Score = 0.0** → Unrelated
- **Score = -1.0** → Opposite meaning

---

## Visual Intuition

```
                    ▲ Dimension 2
                    │
          B •       │
           ╲        │
            ╲ θ     │
             ╲      │
              • A   │
                    │
────────────────────┼───────────▶ Dimension 1

Cosine Similarity = cos(θ)

Small θ  → cos(θ) ≈ 1 → SIMILAR
θ = 90°  → cos(θ) = 0 → UNRELATED
θ = 180° → cos(θ) = -1 → OPPOSITE
```

---

## Formula

```
                    A · B            Σ(aᵢ × bᵢ)
cos(θ)  =  ─────────────── = ─────────────────────────
               ‖A‖ × ‖B‖      √Σ(aᵢ²) × √Σ(bᵢ²)
```

---

## Why Cosine for Embeddings?

| Advantage | Explanation |
|-----------|-------------|
| **Scale invariant** | Only direction matters, not vector length |
| **Bounded range** | Always between -1 and 1, easy to interpret |
| **Fast to compute** | Simple dot product + norm |
| **Works with normalized vectors** | Most embedding models output normalized vectors |

---

## Code Example

See [`examples/cosine-similarity.ts`](./examples/cosine-similarity.ts) — computes cosine similarity between vectors (**runs standalone, no API keys needed**).

```bash
npx tsx 03-cosine-similarity/examples/cosine-similarity.ts 

Output:

PS D:\ITEL TASKS> cd 'd:\ITEL TASKS\task-embeddings-vector-search'
PS D:\ITEL TASKS\task-embeddings-vector-search> npx tsx 03-cosine-similarity/examples/cosine-similarity.ts       
============================================================
COSINE SIMILARITY DEMO
============================================================

Pairwise cosine similarities:

  "Dogs are great pets"
  "Puppies are adorable"
  → 0.9960  ✅ Similar

  "Dogs are great pets"
  "Stock market crashed"
  → 0.2713  ❌ Different

  "Dogs are great pets"
  "I love my golden retriever"
  → 0.9996  ✅ Similar

  "Dogs are great pets"
  "Bitcoin price dropped"
  → 0.3357  ❌ Different

  "Puppies are adorable"
  "Stock market crashed"
  → 0.3441  ❌ Different

  "Puppies are adorable"
  "I love my golden retriever"
  → 0.9959  ✅ Similar

  "Puppies are adorable"
  "Bitcoin price dropped"
  → 0.4092  ❌ Different

  "Stock market crashed"
  "I love my golden retriever"
  → 0.2892  ❌ Different

  "Stock market crashed"
  "Bitcoin price dropped"
  → 0.9961  ✅ Similar

  "I love my golden retriever"
  "Bitcoin price dropped"
  → 0.3519  ❌ Different

============================================================
STEP-BY-STEP CALCULATION
============================================================

  A = [0.9, 0.1, 0.2]
  B = [0.85, 0.15, 0.25]

  Dot product (A·B) = 0.8300
  Magnitude ‖A‖    = 0.9274
  Magnitude ‖B‖    = 0.8986
  cos(θ) = 0.8300 / (0.9274 × 0.8986)
         = 0.9960
PS D:\ITEL TASKS\task-embeddings-vector-search> 
```
