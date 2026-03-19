export {};

/**
 * hybrid-search.ts
 * ================
 * Simulates hybrid search (dense + sparse) locally.
 *
 * Run:  npx tsx hybrid-search.ts
 * No external dependencies — runs standalone!
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface DocEntry {
  id: string;
  title: string;
  text: string;
  denseVector: number[];   // simulated semantic embedding
  keywords: string[];       // for keyword matching
}

interface SearchResult {
  id: string;
  title: string;
  denseScore: number;
  sparseScore: number;
  hybridScore: number;
}

// ---------------------------------------------------------------------------
// Cosine similarity
// ---------------------------------------------------------------------------
function cosineSim(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const mag = Math.sqrt(magA) * Math.sqrt(magB);
  return mag === 0 ? 0 : dot / mag;
}

// ---------------------------------------------------------------------------
// Sparse (keyword) scoring — simple keyword overlap
// ---------------------------------------------------------------------------
function sparseScore(queryKeywords: string[], docKeywords: string[]): number {
  const querySet = new Set(queryKeywords.map((k) => k.toLowerCase()));
  const matches = docKeywords.filter((k) => querySet.has(k.toLowerCase()));
  return queryKeywords.length === 0 ? 0 : matches.length / queryKeywords.length;
}

// ---------------------------------------------------------------------------
// Sample document corpus
// ---------------------------------------------------------------------------
const documents: DocEntry[] = [
  {
    id: "doc-1",
    title: "BERT Model Evaluation on SQuAD",
    text: "BERT-base achieves 88.5% F1 on SQuAD 2.0 benchmark.",
    denseVector: [0.8, 0.3, 0.1, 0.6],
    keywords: ["bert", "squad", "evaluation", "benchmark", "f1"],
  },
  {
    id: "doc-2",
    title: "Transformer Architecture for NLP",
    text: "Transformer models use self-attention for language understanding.",
    denseVector: [0.75, 0.35, 0.15, 0.55],
    keywords: ["transformer", "attention", "nlp", "language", "model"],
  },
  {
    id: "doc-3",
    title: "Best Pizza in New York",
    text: "Joe's Pizza in Greenwich Village serves iconic NY slices.",
    denseVector: [0.1, 0.9, 0.8, 0.05],
    keywords: ["pizza", "new york", "restaurant", "food"],
  },
  {
    id: "doc-4",
    title: "GPT Performance Benchmarks",
    text: "GPT-4 shows significant improvements in reasoning tasks.",
    denseVector: [0.7, 0.25, 0.2, 0.65],
    keywords: ["gpt", "performance", "benchmark", "reasoning"],
  },
  {
    id: "doc-5",
    title: "BERT Fine-tuning Guide",
    text: "Fine-tuning BERT for custom NLP tasks requires task-specific data.",
    denseVector: [0.78, 0.32, 0.12, 0.58],
    keywords: ["bert", "fine-tuning", "nlp", "custom", "training"],
  },
];

// ---------------------------------------------------------------------------
// Hybrid search
// ---------------------------------------------------------------------------
function hybridSearch(
  query: string,
  queryVector: number[],
  alpha: number = 0.5,  // 0 = all keyword, 1 = all semantic
  topK: number = 3
): SearchResult[] {
  const queryKeywords = query.toLowerCase().split(/\s+/);

  const results: SearchResult[] = documents.map((doc) => {
    const dense = cosineSim(queryVector, doc.denseVector);
    const sparse = sparseScore(queryKeywords, doc.keywords);
    const hybrid = alpha * dense + (1 - alpha) * sparse;

    return {
      id: doc.id,
      title: doc.title,
      denseScore: dense,
      sparseScore: sparse,
      hybridScore: hybrid,
    };
  });

  return results.sort((a, b) => b.hybridScore - a.hybridScore).slice(0, topK);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  console.log("=".repeat(60));
  console.log("HYBRID SEARCH DEMO (Dense + Sparse)");
  console.log("=".repeat(60));

  const query = "BERT model performance";
  const queryVector = [0.77, 0.3, 0.13, 0.6]; // simulated query embedding

  // Dense-only search (alpha = 1.0)
  console.log("\n--- DENSE (Semantic) ONLY ---");
  const denseResults = hybridSearch(query, queryVector, 1.0);
  for (const r of denseResults) {
    console.log(`  ${r.denseScore.toFixed(4)} | ${r.title}`);
  }

  // Sparse-only search (alpha = 0.0)
  console.log("\n--- SPARSE (Keyword) ONLY ---");
  const sparseResults = hybridSearch(query, queryVector, 0.0);
  for (const r of sparseResults) {
    console.log(`  ${r.sparseScore.toFixed(4)} | ${r.title}`);
  }

  // Hybrid search (alpha = 0.5)
  console.log("\n--- HYBRID (50% Dense + 50% Sparse) ---");
  const hybridResults = hybridSearch(query, queryVector, 0.5);
  for (const r of hybridResults) {
    console.log(
      `  ${r.hybridScore.toFixed(4)} (dense: ${r.denseScore.toFixed(2)}, sparse: ${r.sparseScore.toFixed(2)}) | ${r.title}`
    );
  }

  console.log("\n✅ Hybrid search finds results that BOTH methods contribute to!");
}

main();
