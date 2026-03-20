export {};

/**
 * rag-basics.ts
 * =============
 * Full RAG pipeline: Ingest → Embed → Store → Query → Retrieve → Augment → Generate.
 * Uses Ollama locally for embeddings (nomic-embed-text) and chat (llama3.2).
 * In-memory vector store — no Pinecone or API keys needed!
 *
 * Requires:  Ollama running with `nomic-embed-text` and `tinyllama`
 * Run:       npx tsx task-rag-systems/01-retrieval-augmented-generation/examples/rag-basics.ts
 */

import ollama from "ollama";

const EMBED_MODEL = "nomic-embed-text";
const CHAT_MODEL = "tinyllama";

// ── In-memory Vector Store ────────────────────────────────────────────

interface VectorEntry {
  id: string;
  title: string;
  text: string;
  vector: number[];
  metadata: Record<string, string>;
}

const store: VectorEntry[] = [];

// ── Cosine Similarity ─────────────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0,
    magA = 0,
    magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const mag = Math.sqrt(magA) * Math.sqrt(magB);
  return mag === 0 ? 0 : dot / mag;
}

// ── Stage 1: INGEST — Chunk + Embed + Store ───────────────────────────

interface Document {
  id: string;
  title: string;
  text: string;
  category: string;
}

async function ingest(docs: Document[]): Promise<void> {
  console.log(`\n  📥 Ingesting ${docs.length} documents ...\n`);

  for (const doc of docs) {
    // In a real pipeline: load → clean → chunk → embed → store
    // Here we treat each document as a single chunk for simplicity
    const res = await ollama.embed({ model: EMBED_MODEL, input: doc.text });
    store.push({
      id: doc.id,
      title: doc.title,
      text: doc.text,
      vector: res.embeddings[0],
      metadata: { category: doc.category },
    });
    console.log(`    ✅ "${doc.title}" (${doc.category})`);
  }
}

// ── Stage 2: RETRIEVE — Embed query + Vector search ──────────────────

interface RetrievalResult {
  title: string;
  text: string;
  score: number;
  metadata: Record<string, string>;
}

async function retrieve(
  query: string,
  topK: number = 3
): Promise<RetrievalResult[]> {
  const res = await ollama.embed({ model: EMBED_MODEL, input: query });
  const queryVec = res.embeddings[0];

  const scored = store.map((entry) => ({
    title: entry.title,
    text: entry.text,
    score: cosineSimilarity(queryVec, entry.vector),
    metadata: entry.metadata,
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

// ── Stage 3: AUGMENT — Build enriched prompt ─────────────────────────

function buildAugmentedPrompt(
  question: string,
  results: RetrievalResult[]
): string {
  const contextBlocks = results
    .map(
      (r, i) =>
        `[Source ${i + 1}: ${r.title}]\n${r.text}`
    )
    .join("\n\n---\n\n");

  return `QUESTION: ${question}

CONTEXT:
${contextBlocks}

Using the CONTEXT provided, answer the QUESTION.
Keep your answer grounded in the facts of the CONTEXT.
If the CONTEXT doesn't contain the answer, say "I don't know."
Cite which Source(s) you used.`;
}

// ── Stage 4: GENERATE — LLM answer ──────────────────────────────────

async function generate(augmentedPrompt: string): Promise<string> {
  const response = await ollama.chat({
    model: CHAT_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant. Answer ONLY based on the provided context. " +
          "If the context doesn't contain the answer, say 'I don't know.'",
      },
      { role: "user", content: augmentedPrompt },
    ],
    options: { temperature: 0.2 },
  });
  return response.message.content ?? "No response generated.";
}

// ── Full RAG Query ──────────────────────────────────────────────────

async function ragQuery(question: string): Promise<void> {
  console.log(`\n  ❓ Question: "${question}"\n`);

  // Retrieve
  console.log("  Step 1 — Retrieving relevant documents ...");
  const results = await retrieve(question, 3);
  console.log(`  Found ${results.length} relevant chunks:\n`);
  for (const r of results) {
    console.log(`    • ${r.title} (score: ${r.score.toFixed(4)})`);
  }

  // Augment
  console.log("\n  Step 2 — Augmenting prompt with context ...");
  const prompt = buildAugmentedPrompt(question, results);

  // Generate
  console.log("  Step 3 — Generating answer ...\n");
  const answer = await generate(prompt);

  console.log("  " + "─".repeat(50));
  console.log(`  📝 Answer:\n`);
  console.log(`  ${answer}`);
  console.log("\n  " + "─".repeat(50));
  console.log("  Sources:");
  for (const r of results) {
    console.log(`    • ${r.title} (relevance: ${r.score.toFixed(4)})`);
  }
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(60));
  console.log("RAG BASICS — Full Pipeline Demo (Ollama, local)");
  console.log("=".repeat(60));

  // Ingest knowledge base
  await ingest([
    {
      id: "doc-1",
      title: "Company Overview",
      text: "Acme Corp was founded in 2019. We build developer tools for AI teams. Our headquarters is in Austin, Texas. We have 200 employees across 3 offices.",
      category: "company",
    },
    {
      id: "doc-2",
      title: "Pricing Plans",
      text: "We offer three plans: Free (up to 1,000 queries/month), Pro ($49/month, 50,000 queries), and Enterprise (custom pricing, unlimited queries with SLA guarantees).",
      category: "pricing",
    },
    {
      id: "doc-3",
      title: "API Rate Limits",
      text: "Free tier: 10 requests/second. Pro tier: 100 requests/second. Enterprise: 1,000 requests/second. Rate limit headers are included in every response.",
      category: "technical",
    },
    {
      id: "doc-4",
      title: "Security & Compliance",
      text: "All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We are SOC 2 Type II certified. GDPR compliance is built-in. Data residency options available for EU customers.",
      category: "security",
    },
    {
      id: "doc-5",
      title: "Support Channels",
      text: "Free tier: community forum only. Pro tier: email support with 24h response time. Enterprise: dedicated Slack channel, 1h response SLA, and a named account manager.",
      category: "support",
    },
  ]);

  console.log("\n" + "=".repeat(60));
  console.log("RAG QUERIES");
  console.log("=".repeat(60));

  await ragQuery("How much does the Pro plan cost?");
  await ragQuery("What security certifications does the company have?");
}

main().catch(console.error);
