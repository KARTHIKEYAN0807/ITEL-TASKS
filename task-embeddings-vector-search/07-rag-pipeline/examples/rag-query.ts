/**
 * rag-query.ts
 * ============
 * Full RAG pipeline: Embed → Search → Augment → Generate.
 *
 * Install:  npm install openai @pinecone-database/pinecone tsx
 * Run:      PINECONE_API_KEY="..." OPENAI_API_KEY="sk-..." npx tsx rag-query.ts
 */

import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

const openai = new OpenAI();
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const index = pc.index("knowledge-base");

// --- Step 1: Embed the user query ---
async function embedQuery(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return res.data[0].embedding;
}

// --- Step 2: Search the vector database ---
async function retrieveContext(queryVector: number[], topK: number = 5) {
  const results = await index.query({
    vector: queryVector,
    topK,
    includeMetadata: true,
  });

  const chunks: string[] = [];
  const sources: { title: string; score: number }[] = [];

  for (const match of results.matches ?? []) {
    const meta = match.metadata as Record<string, string>;
    chunks.push(meta?.text ?? "");
    sources.push({
      title: meta?.title ?? match.id,
      score: match.score ?? 0,
    });
  }

  return { chunks, sources };
}

// --- Step 3 & 4: Augment + Generate ---
async function generateAnswer(
  question: string,
  contextChunks: string[]
): Promise<string> {
  const context = contextChunks.join("\n\n---\n\n");

  // Build the augmented prompt (from Pinecone docs)
  const augmentedPrompt = `QUESTION: ${question}

CONTEXT:
${context}

Using the CONTEXT provided, answer the QUESTION.
Keep your answer grounded in the facts of the CONTEXT.
If the CONTEXT doesn't contain the answer to the QUESTION, say you don't know.
Cite the sources used in your answer.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant that answers questions based on provided context.",
      },
      { role: "user", content: augmentedPrompt },
    ],
    temperature: 0.2, // low temperature for factual answers
  });

  return response.choices[0].message.content ?? "No response generated.";
}

// --- Full RAG pipeline ---
async function ragQuery(question: string) {
  console.log(`\n  ❓ Question: "${question}"\n`);

  // Step 1: Embed
  console.log("  Step 1: Embedding query ...");
  const queryVector = await embedQuery(question);

  // Step 2: Retrieve
  console.log("  Step 2: Searching vector database ...");
  const { chunks, sources } = await retrieveContext(queryVector);
  console.log(`  Found ${sources.length} relevant documents:\n`);
  for (const src of sources) {
    console.log(`    - ${src.title} (score: ${src.score.toFixed(4)})`);
  }

  // Step 3 & 4: Augment + Generate
  console.log("\n  Step 3-4: Augmenting prompt & generating answer ...\n");
  const answer = await generateAnswer(question, chunks);

  console.log("  " + "─".repeat(50));
  console.log(`  📝 Answer:\n`);
  console.log(`  ${answer}`);
  console.log("\n  " + "─".repeat(50));
  console.log("  Sources:");
  for (const src of sources) {
    console.log(`    • ${src.title} (relevance: ${src.score.toFixed(4)})`);
  }

  return { answer, sources };
}

// --- Main ---
async function main() {
  console.log("=".repeat(60));
  console.log("RAG PIPELINE DEMO");
  console.log("=".repeat(60));

  await ragQuery("What is our company's refund policy?");
}

main().catch(console.error);
