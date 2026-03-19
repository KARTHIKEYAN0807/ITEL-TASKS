export {};

/**
 * pipeline.ts
 * ===========
 * Demonstrates a sequential AI document processing pipeline.
 * Each step passes its output to the next step.
 *
 * Run:  npx tsx pipeline.ts
 * No external dependencies — runs standalone.
 */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Pipeline step definitions
// ---------------------------------------------------------------------------
interface PipelineContext {
  documentId: string;
  documentUrl: string;
  text?: string;
  chunks?: string[];
  embeddings?: number[][];
  storedCount?: number;
}

async function step1_extractText(ctx: PipelineContext): Promise<PipelineContext> {
  console.log("  📄 Step 1: Extracting text from document ...");
  await sleep(1000);
  ctx.text = "This is the extracted text from the uploaded document. It contains important information about AI systems and their applications in modern software.";
  console.log(`     → Extracted ${ctx.text.length} characters`);
  return ctx;
}

async function step2_chunkText(ctx: PipelineContext): Promise<PipelineContext> {
  console.log("  ✂️  Step 2: Chunking text ...");
  await sleep(800);
  // Split into chunks of ~50 characters
  const words = ctx.text!.split(" ");
  ctx.chunks = [];
  let currentChunk = "";
  for (const word of words) {
    if (currentChunk.length + word.length > 50) {
      ctx.chunks.push(currentChunk.trim());
      currentChunk = "";
    }
    currentChunk += word + " ";
  }
  if (currentChunk.trim()) ctx.chunks.push(currentChunk.trim());
  console.log(`     → Created ${ctx.chunks.length} chunks`);
  return ctx;
}

async function step3_generateEmbeddings(ctx: PipelineContext): Promise<PipelineContext> {
  console.log("  🔢 Step 3: Generating embeddings ...");
  await sleep(1500);
  // Simulate embedding generation (fake 4-dim vectors)
  ctx.embeddings = ctx.chunks!.map(() =>
    Array.from({ length: 4 }, () => parseFloat((Math.random() * 2 - 1).toFixed(4)))
  );
  console.log(`     → Generated ${ctx.embeddings.length} embeddings (${ctx.embeddings[0].length}D each)`);
  return ctx;
}

async function step4_storeInVectorDb(ctx: PipelineContext): Promise<PipelineContext> {
  console.log("  💾 Step 4: Storing in vector database ...");
  await sleep(1000);
  ctx.storedCount = ctx.embeddings!.length;
  console.log(`     → Stored ${ctx.storedCount} vectors`);
  return ctx;
}

async function step5_notifyUser(ctx: PipelineContext): Promise<PipelineContext> {
  console.log("  🔔 Step 5: Notifying user ...");
  await sleep(500);
  console.log(`     → User notified: "Document '${ctx.documentId}' is ready for search!"`);
  return ctx;
}

// ---------------------------------------------------------------------------
// Pipeline runner — executes steps sequentially
// ---------------------------------------------------------------------------
type PipelineStep = (ctx: PipelineContext) => Promise<PipelineContext>;

async function runPipeline(steps: PipelineStep[], initialCtx: PipelineContext) {
  let ctx = initialCtx;
  const start = Date.now();

  console.log(`\n  Starting pipeline for document '${ctx.documentId}' ...\n`);

  for (let i = 0; i < steps.length; i++) {
    try {
      ctx = await steps[i](ctx);
    } catch (err) {
      console.error(`  ❌ Pipeline failed at step ${i + 1}:`, err);
      throw err;
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`\n  ✅ Pipeline completed in ${elapsed}s`);
  return ctx;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("=".repeat(60));
  console.log("JOB ORCHESTRATION — Sequential Pipeline Demo");
  console.log("=".repeat(60));

  const pipeline: PipelineStep[] = [
    step1_extractText,
    step2_chunkText,
    step3_generateEmbeddings,
    step4_storeInVectorDb,
    step5_notifyUser,
  ];

  const result = await runPipeline(pipeline, {
    documentId: "doc-001",
    documentUrl: "https://example.com/whitepaper.pdf",
  });

  console.log("\n  Final context:", JSON.stringify(result, null, 2));
}

main().catch(console.error);
