export {};

/**
 * similarity-search.ts
 * ====================
 * Performs vector similarity search against a Pinecone index.
 *
 * Install:  npm install openai @pinecone-database/pinecone tsx
 * Run:      PINECONE_API_KEY="..." OPENAI_API_KEY="sk-..." npx tsx similarity-search.ts
 */

import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

const openai = new OpenAI();
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

const INDEX_NAME = "knowledge-base";

// --- Create embedding for a text ---
async function embed(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

// --- Search the vector database ---
async function search(query: string, topK: number = 5) {
  console.log(`\n  🔍 Query: "${query}"\n`);

  // Step 1: Embed the query
  const queryVector = await embed(query);

  // Step 2: Search Pinecone
  const index = pc.index(INDEX_NAME);
  const results = await index.query({
    vector: queryVector,
    topK,
    includeMetadata: true,
  });

  // Step 3: Display results
  console.log(`  Found ${results.matches?.length ?? 0} matches:\n`);
  for (const match of results.matches ?? []) {
    const meta = match.metadata as Record<string, string>;
    console.log(`  Score: ${match.score?.toFixed(4)} | ${meta?.title ?? match.id}`);
    if (meta?.text) {
      console.log(`    "${meta.text.slice(0, 100)}..."`);
    }
    console.log();
  }

  return results;
}

// --- Main ---
async function main() {
  console.log("=".repeat(60));
  console.log("VECTOR SIMILARITY SEARCH DEMO");
  console.log("=".repeat(60));

  await search("How do electric vehicles work?");
  await search("What is machine learning?");
}

main().catch(console.error);
