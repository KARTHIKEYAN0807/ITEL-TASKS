export {};

/**
 * metadata-filter.ts
 * ==================
 * Queries an in-memory vector store with metadata filters using Ollama.
 * Fully standalone — no Pinecone or API keys needed!
 *
 * Requires:  Ollama running locally with `nomic-embed-text` model
 * Run:       npx tsx metadata-filter.ts
 */

import ollama from "ollama";

const EMBED_MODEL = "nomic-embed-text";

// --- In-memory vector store with metadata ---
interface VectorEntry {
  id: string;
  title: string;
  text: string;
  vector: number[];
  metadata: Record<string, string>;
}

const vectorStore: VectorEntry[] = [];

// --- Create embedding ---
async function embed(text: string): Promise<number[]> {
  const res = await ollama.embed({
    model: EMBED_MODEL,
    input: text,
  });
  return res.embeddings[0];
}

// --- Cosine similarity ---
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const mag = Math.sqrt(magA) * Math.sqrt(magB);
  return mag === 0 ? 0 : dot / mag;
}

// --- Simple metadata filter matcher ---
function matchesFilter(metadata: Record<string, string>, filter: Record<string, string>): boolean {
  for (const [key, value] of Object.entries(filter)) {
    if (metadata[key] !== value) return false;
  }
  return true;
}

// --- Index documents ---
async function indexDocuments(docs: { id: string; title: string; text: string; metadata: Record<string, string> }[]) {
  console.log(`  📥 Indexing ${docs.length} documents ...\n`);
  for (const doc of docs) {
    const vector = await embed(doc.text);
    vectorStore.push({ ...doc, vector });
    console.log(`    ✅ "${doc.title}" [${doc.metadata.category}, ${doc.metadata.date}]`);
  }
  console.log();
}

// --- Search with metadata filter ---
async function searchWithFilter(
  query: string,
  filter: Record<string, string>,
  topK: number = 3
) {
  console.log(`\n  🔍 Query: "${query}"`);
  console.log(`  📋 Filter: ${JSON.stringify(filter)}\n`);

  const queryVector = await embed(query);

  // Filter first, then rank by similarity
  const filtered = vectorStore.filter((entry) => matchesFilter(entry.metadata, filter));

  const scored = filtered.map((entry) => ({
    ...entry,
    score: cosineSimilarity(queryVector, entry.vector),
  }));

  scored.sort((a, b) => b.score - a.score);
  const results = scored.slice(0, topK);

  if (results.length === 0) {
    console.log("  ⚠️  No results matched the filter.\n");
  } else {
    for (const match of results) {
      console.log(`  Score: ${match.score.toFixed(4)} | ${match.title}`);
      console.log(`    Category: ${match.metadata.category}  |  Date: ${match.metadata.date}`);
      console.log();
    }
  }

  return results;
}

// --- Main ---
async function main() {
  console.log("=".repeat(60));
  console.log("METADATA FILTERING DEMO (Ollama — local)");
  console.log("=".repeat(60));
  console.log();

  // Index sample documents with metadata
  await indexDocuments([
    { id: "doc-1", title: "Transformer Architecture",        text: "Transformer models use self-attention for language understanding and generation.",            metadata: { category: "AI",      date: "2025-06-15", status: "active" } },
    { id: "doc-2", title: "BERT Fine-tuning Guide",          text: "Fine-tuning BERT for custom NLP tasks requires task-specific labeled data.",                 metadata: { category: "AI",      date: "2026-02-10", status: "active" } },
    { id: "doc-3", title: "Solar Energy Trends 2026",        text: "Solar panel adoption increased by 40% in 2026, driven by cost reductions.",                 metadata: { category: "Energy",  date: "2026-03-01", status: "active" } },
    { id: "doc-4", title: "Deprecated API Reference",        text: "This document covers the old REST API v1 which has been deprecated.",                       metadata: { category: "AI",      date: "2024-01-20", status: "deleted" } },
    { id: "doc-5", title: "Neural Network Optimization",     text: "Techniques for optimizing neural network training include learning rate scheduling and pruning.", metadata: { category: "AI",      date: "2026-01-05", status: "active" } },
  ]);

  console.log("=".repeat(60));
  console.log("FILTERED SEARCH RESULTS");
  console.log("=".repeat(60));

  // Example 1: Only AI category documents
  await searchWithFilter("neural network architectures", { category: "AI" });

  // Example 2: Only Energy category
  await searchWithFilter("renewable energy sources", { category: "Energy" });

  // Example 3: Only active documents
  await searchWithFilter("API documentation", { status: "active" });
}

main().catch(console.error);
