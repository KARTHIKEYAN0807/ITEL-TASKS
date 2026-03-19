export {};

/**
 * rag-query.ts
 * ============
 * Full RAG pipeline: Embed → Search → Augment → Generate.
 * Uses Ollama locally for embeddings (nomic-embed-text) and chat (llama3.2).
 * Uses an in-memory vector store — no Pinecone or API keys needed!
 *
 * Requires:  Ollama running locally with `nomic-embed-text` and `llama3.2` models
 * Run:       npx tsx rag-query.ts
 */

import ollama from "ollama";

const EMBED_MODEL = "nomic-embed-text";
const CHAT_MODEL = "llama3.2:1b"; // Use 1B version for lower memory usage (fits in 4GB RAM)

// --- In-memory vector store ---
interface VectorEntry {
  id: string;
  title: string;
  text: string;
  vector: number[];
}

const vectorStore: VectorEntry[] = [];

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

// --- Step 0: Index knowledge base documents ---
async function indexKnowledgeBase(docs: { id: string; title: string; text: string }[]) {
  console.log(`\n  📥 Indexing ${docs.length} knowledge base documents ...\n`);
  for (const doc of docs) {
    const res = await ollama.embed({ model: EMBED_MODEL, input: doc.text });
    vectorStore.push({ ...doc, vector: res.embeddings[0] });
    console.log(`    ✅ "${doc.title}"`);
  }
  console.log();
}

// --- Step 1: Embed the user query ---
async function embedQuery(text: string): Promise<number[]> {
  const res = await ollama.embed({
    model: EMBED_MODEL,
    input: text,
  });
  return res.embeddings[0];
}

// --- Step 2: Search the vector store ---
function retrieveContext(queryVector: number[], topK: number = 3) {
  const scored = vectorStore.map((entry) => ({
    ...entry,
    score: cosineSimilarity(queryVector, entry.vector),
  }));

  scored.sort((a, b) => b.score - a.score);
  const results = scored.slice(0, topK);

  const chunks = results.map((r) => r.text);
  const sources = results.map((r) => ({ title: r.title, score: r.score }));

  return { chunks, sources };
}

// --- Step 3 & 4: Augment + Generate ---
async function generateAnswer(
  question: string,
  contextChunks: string[]
): Promise<string> {
  const context = contextChunks.join("\n\n---\n\n");

  const augmentedPrompt = `QUESTION: ${question}

CONTEXT:
${context}

Using the CONTEXT provided, answer the QUESTION.
Keep your answer grounded in the facts of the CONTEXT.
If the CONTEXT doesn't contain the answer to the QUESTION, say you don't know.
Cite the sources used in your answer.`;

  const response = await ollama.chat({
    model: CHAT_MODEL,
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant that answers questions based on provided context.",
      },
      { role: "user", content: augmentedPrompt },
    ],
    options: {
      temperature: 0.2,
    },
  });

  return response.message.content ?? "No response generated.";
}

// --- Full RAG pipeline ---
async function ragQuery(question: string) {
  console.log(`\n  ❓ Question: "${question}"\n`);

  // Step 1: Embed
  console.log("  Step 1: Embedding query ...");
  const queryVector = await embedQuery(question);

  // Step 2: Retrieve
  console.log("  Step 2: Searching vector store ...");
  const { chunks, sources } = retrieveContext(queryVector);
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
  console.log("RAG PIPELINE DEMO (Ollama — fully local)");
  console.log("=".repeat(60));

  // Index a small knowledge base
  await indexKnowledgeBase([
    { id: "doc-1", title: "Refund Policy",          text: "Our company offers a full refund within 30 days of purchase. After 30 days, a 50% store credit is issued. Digital products are non-refundable once downloaded." },
    { id: "doc-2", title: "Shipping Information",    text: "We ship to all 50 US states. Standard shipping takes 5-7 business days. Express shipping is available for an additional $15 and delivers in 1-2 business days." },
    { id: "doc-3", title: "Product Warranty",        text: "All hardware products come with a 2-year limited warranty. Software products include 1 year of free updates. Extended warranty plans are available for purchase." },
    { id: "doc-4", title: "Contact Support",         text: "Our support team is available Monday-Friday, 9 AM to 6 PM EST. You can reach us via email at support@example.com or call 1-800-555-0199." },
    { id: "doc-5", title: "Return Process",          text: "To initiate a return, log into your account and go to Order History. Select the item and click 'Request Return'. A prepaid shipping label will be emailed within 24 hours." },
  ]);

  console.log("=".repeat(60));
  console.log("RAG QUERIES");
  console.log("=".repeat(60));

  await ragQuery("What is the company's refund policy?");
}

main().catch(console.error);
