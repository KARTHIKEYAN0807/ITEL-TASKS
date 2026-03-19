/**
 * metadata-filter.ts
 * ==================
 * Queries a Pinecone index with metadata filters.
 *
 * Install:  npm install openai @pinecone-database/pinecone tsx
 * Run:      PINECONE_API_KEY="..." OPENAI_API_KEY="sk-..." npx tsx metadata-filter.ts
 */

import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

const openai = new OpenAI();
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const index = pc.index("knowledge-base");

// --- Create embedding ---
async function embed(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return res.data[0].embedding;
}

// --- Search with metadata filter ---
async function searchWithFilter(
  query: string,
  filter: Record<string, unknown>,
  topK: number = 5
) {
  console.log(`\n  🔍 Query: "${query}"`);
  console.log(`  📋 Filter: ${JSON.stringify(filter)}\n`);

  const queryVector = await embed(query);

  const results = await index.query({
    vector: queryVector,
    topK,
    includeMetadata: true,
    filter,
  });

  for (const match of results.matches ?? []) {
    const meta = match.metadata as Record<string, string>;
    console.log(`  Score: ${match.score?.toFixed(4)} | ${meta?.title ?? match.id}`);
    console.log(`    Category: ${meta?.category}  |  Date: ${meta?.date}`);
    console.log();
  }

  return results;
}

// --- Main ---
async function main() {
  console.log("=".repeat(60));
  console.log("METADATA FILTERING DEMO");
  console.log("=".repeat(60));

  // Example 1: Only AI category documents
  await searchWithFilter("neural network architectures", {
    category: { $eq: "AI" },
  });

  // Example 2: AI docs from 2026 onwards
  await searchWithFilter("machine learning", {
    $and: [
      { category: { $eq: "AI" } },
      { date: { $gte: "2026-01-01" } },
    ],
  });

  // Example 3: Exclude deleted docs
  await searchWithFilter("data processing", {
    status: { $ne: "deleted" },
  });
}

main().catch(console.error);
