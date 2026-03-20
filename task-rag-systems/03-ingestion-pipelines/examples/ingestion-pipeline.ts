export {};

/**
 * ingestion-pipeline.ts
 * =====================
 * Multi-document ingestion pipeline: Load → Clean → Chunk → Embed → Store.
 * Demonstrates metadata extraction, text normalisation, and batch embedding.
 * Uses Ollama locally (nomic-embed-text) with an in-memory vector store.
 *
 * Requires:  Ollama running with `nomic-embed-text`
 * Run:       npx tsx task-rag-systems/03-ingestion-pipelines/examples/ingestion-pipeline.ts
 */

import ollama from "ollama";

const EMBED_MODEL = "nomic-embed-text";

// ── Types ────────────────────────────────────────────────────────

interface RawDocument {
  filename: string;
  content: string;
  source: string;
  createdAt: string;
}

interface Chunk {
  id: string;
  text: string;
  metadata: {
    source: string;
    filename: string;
    chunkIndex: number;
    totalChunks: number;
    createdAt: string;
    charCount: number;
  };
}

interface VectorEntry extends Chunk {
  vector: number[];
}

// ── In-Memory Vector Store ───────────────────────────────────────

const vectorStore: VectorEntry[] = [];

// ── Stage 1: LOAD — Simulate loading documents from various sources ──

function loadDocuments(): RawDocument[] {
  return [
    {
      filename: "company-policy.md",
      source: "internal-wiki",
      createdAt: "2025-01-15",
      content: `# Company   Policy\n\nAll employees must   complete onboarding within 2 weeks.\n\nRemote work is allowed   up to 3 days per week.\n\nPTO accrues at 1.5 days per month for full-time employees.  Part-time employees accrue at 0.75 days per month.\n\nExpense reports must be submitted within  30 days of the expense date.  Late submissions may not be reimbursed.`,
    },
    {
      filename: "api-reference.md",
      source: "docs-site",
      createdAt: "2025-03-01",
      content: `# API  Reference\n\nThe /users endpoint supports GET, POST, PUT, and DELETE methods.\n\nAuthentication uses Bearer tokens in the Authorization header.  Tokens expire after 24 hours.\n\nRate limits:  Free tier gets  10 req/s.  Pro tier gets 100 req/s. Enterprise gets 1000 req/s.\n\nAll responses include X-RateLimit-Remaining and X-RateLimit-Reset headers.`,
    },
    {
      filename: "faq.md",
      source: "support-portal",
      createdAt: "2025-02-20",
      content: `# FAQ\n\nQ: How do I reset my password?\nA: Go to Settings > Security > Change Password.\n\nQ: Can I export my data?\nA: Yes, go to Settings > Data > Export. Exports are available in CSV and JSON formats.\n\nQ: What payment methods do you accept?\nA: We accept Visa, Mastercard, American Express, and PayPal. Wire transfers are available for Enterprise plans.`,
    },
  ];
}

// ── Stage 2: CLEAN — Normalise text ──────────────────────────────

function cleanText(text: string): string {
  return text
    .replace(/#+\s*/g, "")        // Remove markdown headers
    .replace(/\s{2,}/g, " ")       // Collapse multiple spaces
    .replace(/\n{3,}/g, "\n\n")    // Collapse multiple newlines
    .replace(/[^\S\n]+/g, " ")     // Normalise whitespace (preserve newlines)
    .trim();
}

// ── Stage 3: CHUNK — Paragraph-based with max size ──────────────

function chunkText(text: string, maxChunkSize: number = 300): string[] {
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    const candidate = current ? current + "\n\n" + para : para;
    if (candidate.length > maxChunkSize && current) {
      chunks.push(current);
      current = para;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);

  return chunks;
}

// ── Stage 4: EMBED — Generate vectors ────────────────────────────

async function embedChunks(chunks: Chunk[]): Promise<VectorEntry[]> {
  const entries: VectorEntry[] = [];

  for (const chunk of chunks) {
    const res = await ollama.embed({ model: EMBED_MODEL, input: chunk.text });
    entries.push({ ...chunk, vector: res.embeddings[0] });
  }

  return entries;
}

// ── Stage 5: STORE — Upsert into vector store ───────────────────

function storeVectors(entries: VectorEntry[]): void {
  for (const entry of entries) {
    // Dedup: overwrite if same ID exists
    const existingIdx = vectorStore.findIndex((e) => e.id === entry.id);
    if (existingIdx >= 0) {
      vectorStore[existingIdx] = entry;
    } else {
      vectorStore.push(entry);
    }
  }
}

// ── Full Pipeline ────────────────────────────────────────────────

async function runPipeline(): Promise<void> {
  console.log("=".repeat(60));
  console.log("INGESTION PIPELINE DEMO");
  console.log("=".repeat(60));

  // Stage 1: Load
  console.log("\n  📂 Stage 1: LOAD\n");
  const rawDocs = loadDocuments();
  for (const doc of rawDocs) {
    console.log(`    Loaded: ${doc.filename} (${doc.content.length} chars) from ${doc.source}`);
  }

  // Stage 2: Clean
  console.log("\n  🧹 Stage 2: CLEAN\n");
  const cleanedDocs = rawDocs.map((doc) => ({
    ...doc,
    content: cleanText(doc.content),
  }));
  for (const doc of cleanedDocs) {
    console.log(`    Cleaned: ${doc.filename} (${doc.content.length} chars)`);
  }

  // Stage 3: Chunk
  console.log("\n  ✂️  Stage 3: CHUNK\n");
  const allChunks: Chunk[] = [];
  for (const doc of cleanedDocs) {
    const textChunks = chunkText(doc.content, 250);
    const docChunks: Chunk[] = textChunks.map((text, i) => ({
      id: `${doc.filename}-chunk-${i}`,
      text,
      metadata: {
        source: doc.source,
        filename: doc.filename,
        chunkIndex: i,
        totalChunks: textChunks.length,
        createdAt: doc.createdAt,
        charCount: text.length,
      },
    }));
    allChunks.push(...docChunks);
    console.log(`    ${doc.filename} → ${textChunks.length} chunks`);
  }

  // Stage 4: Embed
  console.log(
    `\n  🧮 Stage 4: EMBED (${allChunks.length} chunks)\n`
  );
  const vectorEntries = await embedChunks(allChunks);
  for (const entry of vectorEntries) {
    console.log(
      `    ✅ ${entry.id} (${entry.vector.length} dims)`
    );
  }

  // Stage 5: Store
  console.log("\n  💾 Stage 5: STORE\n");
  storeVectors(vectorEntries);
  console.log(
    `    Stored ${vectorEntries.length} vectors in memory (total: ${vectorStore.length})`
  );

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("PIPELINE SUMMARY");
  console.log("=".repeat(60));
  console.log(`\n  Documents loaded:   ${rawDocs.length}`);
  console.log(`  Total chunks:       ${allChunks.length}`);
  console.log(`  Vectors stored:     ${vectorStore.length}`);
  console.log(`  Vector dimensions:  ${vectorStore[0]?.vector.length ?? 0}`);
  console.log();

  // Show metadata
  console.log("  Stored entries:");
  for (const entry of vectorStore) {
    console.log(
      `    • ${entry.id}  |  source: ${entry.metadata.source}  |  ${entry.metadata.charCount} chars`
    );
  }
  console.log();
}

runPipeline().catch(console.error);
