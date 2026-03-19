/**
 * cosine-similarity.ts
 * ====================
 * Computes cosine similarity between vectors.
 *
 * Run:  npx tsx cosine-similarity.ts
 * No external dependencies — runs standalone!
 */

// ---------------------------------------------------------------------------
// Cosine Similarity function
// ---------------------------------------------------------------------------
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error("Vectors must have same length");

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

// ---------------------------------------------------------------------------
// Demo with simple 3D vectors
// ---------------------------------------------------------------------------
function main() {
  console.log("=".repeat(60));
  console.log("COSINE SIMILARITY DEMO");
  console.log("=".repeat(60));

  // Simulated embeddings (small vectors for clarity)
  const vectors: Record<string, number[]> = {
    "Dogs are great pets":       [0.9, 0.1, 0.2],
    "Puppies are adorable":      [0.85, 0.15, 0.25],
    "Stock market crashed":      [0.1, 0.9, 0.3],
    "I love my golden retriever":[0.88, 0.12, 0.18],
    "Bitcoin price dropped":     [0.15, 0.85, 0.35],
  };

  const labels = Object.keys(vectors);

  console.log("\nPairwise cosine similarities:\n");

  for (let i = 0; i < labels.length; i++) {
    for (let j = i + 1; j < labels.length; j++) {
      const sim = cosineSimilarity(vectors[labels[i]], vectors[labels[j]]);
      const emoji = sim > 0.8 ? "✅ Similar" : sim > 0.5 ? "🟡 Somewhat" : "❌ Different";

      console.log(`  "${labels[i]}"`);
      console.log(`  "${labels[j]}"`);
      console.log(`  → ${sim.toFixed(4)}  ${emoji}\n`);
    }
  }

  // Show the formula step-by-step
  console.log("=".repeat(60));
  console.log("STEP-BY-STEP CALCULATION");
  console.log("=".repeat(60));

  const a = [0.9, 0.1, 0.2];
  const b = [0.85, 0.15, 0.25];

  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));

  console.log(`\n  A = [${a.join(", ")}]`);
  console.log(`  B = [${b.join(", ")}]`);
  console.log(`\n  Dot product (A·B) = ${dot.toFixed(4)}`);
  console.log(`  Magnitude ‖A‖    = ${magA.toFixed(4)}`);
  console.log(`  Magnitude ‖B‖    = ${magB.toFixed(4)}`);
  console.log(`  cos(θ) = ${dot.toFixed(4)} / (${magA.toFixed(4)} × ${magB.toFixed(4)})`);
  console.log(`         = ${(dot / (magA * magB)).toFixed(4)}`);
}

main();
