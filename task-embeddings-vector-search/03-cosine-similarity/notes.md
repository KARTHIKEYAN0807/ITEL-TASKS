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
```
