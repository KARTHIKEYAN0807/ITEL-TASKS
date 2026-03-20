export {};

/**
 * reranker.ts
 * ===========
 * Demonstrates cross-encoder reranking and Reciprocal Rank Fusion (RRF).
 * Simulates a two-stage retrieval pipeline: initial retrieval → reranking.
 *
 * STANDALONE — no API keys, no Ollama, no external services.
 *
 * Run:  npx tsx task-rag-systems/06-reranking/examples/reranker.ts
 */

// ── Types ────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  title: string;
  text: string;
  score: number;
}

// ── Sample Data ──────────────────────────────────────────────────

const QUERY = "How does transformer attention mechanism work?";

// Simulated dense search results (semantic / bi-encoder)
const DENSE_RESULTS: SearchResult[] = [
  { id: "d1", title: "Attention Is All You Need",           text: "The Transformer architecture relies entirely on attention mechanisms, dispensing with recurrence and convolutions. Multi-head attention allows the model to jointly attend to information from different representation subspaces.", score: 0.92 },
  { id: "d2", title: "BERT Pre-training",                   text: "BERT uses a masked language model objective and next sentence prediction. It is pre-trained on large corpora and fine-tuned for downstream tasks.", score: 0.85 },
  { id: "d3", title: "Self-Attention Explained",             text: "Self-attention computes a weighted sum of all positions in a sequence. Each position attends to every other position, with weights determined by the compatibility of query, key, and value projections.", score: 0.88 },
  { id: "d4", title: "CNN for Text Classification",         text: "Convolutional neural networks can be applied to text by using 1D convolutions over word embeddings. Max-pooling extracts the most important features.", score: 0.70 },
  { id: "d5", title: "Transformer Positional Encoding",     text: "Since transformers have no recurrence, positional encodings are added to input embeddings. Sinusoidal functions or learned embeddings encode the position of each token in the sequence.", score: 0.82 },
];

// Simulated sparse search results (keyword / BM25)
const SPARSE_RESULTS: SearchResult[] = [
  { id: "s1", title: "Self-Attention Explained",             text: "Self-attention computes a weighted sum of all positions in a sequence. Each position attends to every other position, with weights determined by the compatibility of query, key, and value projections.", score: 0.78 },
  { id: "s2", title: "Attention Mechanisms Survey",          text: "Attention mechanisms in neural networks allow models to focus on relevant parts of the input. Types include additive attention, dot-product attention, and multi-head attention as introduced in the Transformer.", score: 0.75 },
  { id: "s3", title: "Attention Is All You Need",           text: "The Transformer architecture relies entirely on attention mechanisms, dispensing with recurrence and convolutions. Multi-head attention allows the model to jointly attend to information from different representation subspaces.", score: 0.72 },
  { id: "s4", title: "RNN vs Transformer",                   text: "Recurrent neural networks process sequences step by step, while transformers process all positions in parallel using self-attention. This parallelism makes transformers much faster to train.", score: 0.65 },
  { id: "s5", title: "Transformer Positional Encoding",     text: "Since transformers have no recurrence, positional encodings are added to input embeddings. Sinusoidal functions or learned embeddings encode the position of each token in the sequence.", score: 0.60 },
];

// ── Simulated Cross-Encoder Reranking ────────────────────────────

/**
 * In production, a cross-encoder model scores each (query, document) pair.
 * Here we simulate this by computing keyword overlap + bonus for semantic relevance.
 */
function crossEncoderScore(query: string, document: string): number {
  const queryTerms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const docLower = document.toLowerCase();

  // Term presence score
  let termHits = 0;
  for (const term of queryTerms) {
    if (docLower.includes(term)) termHits++;
  }
  const termScore = queryTerms.length > 0 ? termHits / queryTerms.length : 0;

  // Bonus for key concept matches
  const keyConcepts = ["attention", "transformer", "mechanism", "self-attention", "multi-head"];
  let conceptHits = 0;
  for (const concept of keyConcepts) {
    if (docLower.includes(concept)) conceptHits++;
  }
  const conceptScore = conceptHits / keyConcepts.length;

  // Weighted combination
  return Math.min(1, termScore * 0.4 + conceptScore * 0.6);
}

function rerank(
  query: string,
  results: SearchResult[]
): SearchResult[] {
  const reranked = results.map((r) => ({
    ...r,
    score: crossEncoderScore(query, r.text),
  }));
  reranked.sort((a, b) => b.score - a.score);
  return reranked;
}

// ── Reciprocal Rank Fusion (RRF) ─────────────────────────────────

function reciprocalRankFusion(
  resultLists: SearchResult[][],
  k: number = 60
): SearchResult[] {
  const scores = new Map<string, { score: number; result: SearchResult }>();

  for (const list of resultLists) {
    for (let rank = 0; rank < list.length; rank++) {
      const result = list[rank];
      const rrfScore = 1 / (k + rank + 1); // rank is 0-indexed, formula uses 1-indexed

      if (scores.has(result.id)) {
        scores.get(result.id)!.score += rrfScore;
      } else {
        scores.set(result.id, {
          score: rrfScore,
          result: { ...result, score: rrfScore },
        });
      }
    }
  }

  const fused = Array.from(scores.values())
    .map((entry) => ({ ...entry.result, score: entry.score }))
    .sort((a, b) => b.score - a.score);

  return fused;
}

// ── Display Helper ──────────────────────────────────────────────

function displayResults(label: string, results: SearchResult[]): void {
  console.log(`\n--- ${label} ---\n`);
  results.forEach((r, i) => {
    console.log(
      `  ${i + 1}. [${r.score.toFixed(4)}] ${r.title}`
    );
  });
}

// ── Main ────────────────────────────────────────────────────────

function main() {
  console.log("=".repeat(60));
  console.log("RERANKING & RECIPROCAL RANK FUSION DEMO");
  console.log("=".repeat(60));

  console.log(`\n  Query: "${QUERY}"\n`);

  // Step 1: Show initial retrieval results
  displayResults("DENSE SEARCH (Bi-Encoder / Semantic)", DENSE_RESULTS);
  displayResults("SPARSE SEARCH (BM25 / Keyword)", SPARSE_RESULTS);

  // Step 2: Reciprocal Rank Fusion
  const rrfResults = reciprocalRankFusion([DENSE_RESULTS, SPARSE_RESULTS]);
  displayResults("RRF FUSION (Dense + Sparse combined)", rrfResults);

  // Step 3: Cross-Encoder Reranking on dense results
  const rerankedDense = rerank(QUERY, DENSE_RESULTS);
  displayResults("CROSS-ENCODER RERANKED (from dense results)", rerankedDense);

  // Step 4: Full pipeline: RRF → Rerank
  const rrfThenReranked = rerank(QUERY, rrfResults);
  displayResults(
    "FULL PIPELINE: RRF → Cross-Encoder Rerank",
    rrfThenReranked
  );

  // Comparison
  console.log("\n" + "=".repeat(60));
  console.log("PIPELINE COMPARISON — Top 3 Results");
  console.log("=".repeat(60));
  console.log();

  const pipelines = [
    { name: "Dense Only", results: DENSE_RESULTS },
    { name: "Sparse Only", results: SPARSE_RESULTS },
    { name: "RRF Fusion", results: rrfResults },
    { name: "Dense + Rerank", results: rerankedDense },
    { name: "RRF + Rerank", results: rrfThenReranked },
  ];

  for (const p of pipelines) {
    const top3 = p.results.slice(0, 3).map((r) => r.title);
    console.log(`  ${p.name.padEnd(18)} → ${top3.join(" | ")}`);
  }

  console.log(`
  ✅ Key Observations:
  • RRF boosts documents that appear in BOTH dense and sparse results
  • Cross-encoder reranking promotes documents most relevant to the QUERY
  • The full pipeline (RRF + Rerank) generally gives the best ordering
  `);
}

main();
