export {};

/**
 * similarity-search.ts
 * ====================
 * Performs vector similarity search using an in-memory vector store + Ollama.
 * Fully standalone — no Pinecone or API keys needed!
 *
 * Requires:  Ollama running locally with `nomic-embed-text` model
 * Run:       npx tsx similarity-search.ts
 */

import ollama from "ollama";

const EMBED_MODEL = "nomic-embed-text";

// --- In-memory vector store ---
interface VectorEntry {
  id: string;
  title: string;
  text: string;
  vector: number[];
}

const vectorStore: VectorEntry[] = [];

// --- Create embedding for a text ---
async function embed(text: string): Promise<number[]> {
  const response = await ollama.embed({
    model: EMBED_MODEL,
    input: text,
  });
  return response.embeddings[0];
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

// --- Index documents (embed + store) ---
async function indexDocuments(docs: { id: string; title: string; text: string }[]) {
  console.log(`  📥 Indexing ${docs.length} documents ...\n`);
  for (const doc of docs) {
    const vector = await embed(doc.text);
    vectorStore.push({ ...doc, vector });
    console.log(`    ✅ Indexed: "${doc.title}"`);
  }
  console.log();
}

// --- Search the vector store ---
async function search(query: string, topK: number = 3) {
  console.log(`  🔍 Query: "${query}"\n`);

  // Step 1: Embed the query
  const queryVector = await embed(query);

  // Step 2: Compute similarity against all stored vectors
  const scored = vectorStore.map((entry) => ({
    ...entry,
    score: cosineSimilarity(queryVector, entry.vector),
  }));

  // Step 3: Sort by score, take top K
  scored.sort((a, b) => b.score - a.score);
  const results = scored.slice(0, topK);

  // Step 4: Display results
  console.log(`  Found ${results.length} matches:\n`);
  for (const match of results) {
    console.log(`  Score: ${match.score.toFixed(4)} | ${match.title}`);
    console.log(`    "${match.text.slice(0, 80)}..."`);
    console.log();
  }

  return results;
}

// --- Main ---
async function main() {
  console.log("=".repeat(60));
  console.log("VECTOR SIMILARITY SEARCH DEMO (Ollama — local)");
  console.log("=".repeat(60));
  console.log();

  // Step 1: Index sample documents
  await indexDocuments([
    { id: "doc-1", title: "Electric Vehicles Overview",     text: "Electric vehicles use batteries and electric motors instead of gasoline engines. They produce zero direct emissions and are more energy efficient than traditional cars." },
    { id: "doc-2", title: "Machine Learning Basics",        text: "Machine learning is a branch of artificial intelligence where computers learn patterns from data without being explicitly programmed. It includes supervised and unsupervised learning." },
    { id: "doc-3", title: "Solar Panel Technology",          text: "Solar panels convert sunlight into electricity using photovoltaic cells. They are a key renewable energy source and are becoming increasingly affordable." },
    { id: "doc-4", title: "Deep Learning and Neural Nets",   text: "Deep learning uses multi-layered neural networks to learn complex patterns. It powers applications like image recognition, natural language processing, and self-driving cars." },
    { id: "doc-5", title: "History of Cooking",              text: "Cooking has evolved from open fires to modern kitchen appliances. Techniques like roasting, boiling, and baking have been refined over thousands of years." },
  ]);

  console.log("=".repeat(60));
  console.log("SEARCH RESULTS");
  console.log("=".repeat(60));

  // Step 2: Search
  await search("How do electric vehicles work?");
  await search("What is machine learning?");
  await search("Tell me about food and cooking");
}

main().catch(console.error);
