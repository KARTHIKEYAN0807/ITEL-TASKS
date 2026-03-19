/**
 * create-embeddings.ts
 * ====================
 * Creates vector embeddings using the OpenAI API and compares their similarity.
 *
 * Install:  npm install openai tsx
 * Run:      OPENAI_API_KEY="sk-..." npx tsx create-embeddings.ts
 */

import OpenAI from "openai";

const openai = new OpenAI(); // reads OPENAI_API_KEY from env

// --- Create an embedding for a piece of text ---
async function createEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  const embedding = response.data[0].embedding;
  console.log(`  Text:       "${text}"`);
  console.log(`  Dimensions: ${embedding.length}`);
  console.log(`  First 5:    [${embedding.slice(0, 5).map((v) => v.toFixed(4)).join(", ")}]`);
  console.log();
  return embedding;
}

// --- Simple cosine similarity ---
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// --- Main ---
async function main() {
  console.log("=".repeat(60));
  console.log("EMBEDDING CREATION DEMO");
  console.log("=".repeat(60));
  console.log();

  const texts = [
    "Machine learning is a subset of artificial intelligence",
    "Deep learning uses neural networks with many layers",
    "I went to the grocery store to buy milk",
  ];

  const embeddings: number[][] = [];
  for (const text of texts) {
    embeddings.push(await createEmbedding(text));
  }

  console.log("=".repeat(60));
  console.log("SIMILARITY COMPARISON");
  console.log("=".repeat(60));

  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const sim = cosineSimilarity(embeddings[i], embeddings[j]);
      console.log(`  "${texts[i].slice(0, 35)}..." vs`);
      console.log(`  "${texts[j].slice(0, 35)}..."`);
      console.log(`  → Similarity: ${sim.toFixed(4)}\n`);
    }
  }
}

main().catch(console.error);
