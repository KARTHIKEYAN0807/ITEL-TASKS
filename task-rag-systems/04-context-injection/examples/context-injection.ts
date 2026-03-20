export {};

/**
 * context-injection.ts
 * ====================
 * Compares 3 context injection strategies: Stuffing, Map-Reduce, Refine.
 * Uses Ollama locally (tinyllama) for LLM generation.
 *
 * Requires:  Ollama running with `tinyllama`
 * Run:       npx tsx task-rag-systems/04-context-injection/examples/context-injection.ts
 */

import ollama from "ollama";

const CHAT_MODEL = "tinyllama";

// ── Simulated retrieved chunks ──────────────────────────────────

const QUESTION = "What are the key benefits of using TypeScript?";

const RETRIEVED_CHUNKS = [
  {
    source: "TypeScript Handbook",
    text: "TypeScript adds static type checking to JavaScript. This catches errors at compile time rather than runtime, significantly reducing bugs in production. The type system also serves as documentation, making code easier to understand and maintain.",
  },
  {
    source: "Developer Survey 2025",
    text: "In the 2025 developer survey, 78% of JavaScript developers reported that TypeScript improved their productivity. Teams using TypeScript reported 40% fewer production bugs compared to plain JavaScript projects.",
  },
  {
    source: "Migration Guide",
    text: "TypeScript offers gradual adoption — you can mix .ts and .js files in the same project. IDE support is excellent, with autocompletion, refactoring tools, and inline documentation powered by type information.",
  },
];

// ── Helper: Call LLM ────────────────────────────────────────────

async function askLLM(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const res = await ollama.chat({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    options: { temperature: 0.2 },
  });
  return res.message.content ?? "(no response)";
}

// ── Strategy 1: STUFFING ────────────────────────────────────────

async function stuffingStrategy(): Promise<string> {
  const context = RETRIEVED_CHUNKS.map(
    (c, i) => `[Source ${i + 1}: ${c.source}]\n${c.text}`
  ).join("\n\n---\n\n");

  const prompt = `QUESTION: ${QUESTION}

CONTEXT:
${context}

Answer the question using ONLY the context above. Cite your sources.`;

  return askLLM(
    "You are a helpful assistant. Answer based only on provided context.",
    prompt
  );
}

// ── Strategy 2: MAP-REDUCE ──────────────────────────────────────

async function mapReduceStrategy(): Promise<string> {
  // MAP phase: get an answer from each chunk independently
  const mapAnswers: string[] = [];
  for (let i = 0; i < RETRIEVED_CHUNKS.length; i++) {
    const chunk = RETRIEVED_CHUNKS[i];
    const prompt = `QUESTION: ${QUESTION}

CONTEXT:
[Source: ${chunk.source}]
${chunk.text}

Based ONLY on this context, what relevant information can you extract to answer the question? If the context doesn't help, say "No relevant information."`;

    const answer = await askLLM(
      "Extract relevant information from the context to answer the question.",
      prompt
    );
    mapAnswers.push(`[From ${chunk.source}]: ${answer}`);
  }

  // REDUCE phase: combine all partial answers
  const reducePrompt = `QUESTION: ${QUESTION}

PARTIAL ANSWERS:
${mapAnswers.join("\n\n")}

Combine the partial answers above into a single, comprehensive answer. Cite the sources.`;

  return askLLM(
    "Synthesise partial answers into a comprehensive final answer.",
    reducePrompt
  );
}

// ── Strategy 3: REFINE ──────────────────────────────────────────

async function refineStrategy(): Promise<string> {
  let currentAnswer = "";

  for (let i = 0; i < RETRIEVED_CHUNKS.length; i++) {
    const chunk = RETRIEVED_CHUNKS[i];

    if (i === 0) {
      // Initial answer from first chunk
      const prompt = `QUESTION: ${QUESTION}

CONTEXT:
[Source: ${chunk.source}]
${chunk.text}

Answer the question based on the context above.`;

      currentAnswer = await askLLM(
        "Answer based only on the provided context.",
        prompt
      );
    } else {
      // Refine with subsequent chunks
      const prompt = `QUESTION: ${QUESTION}

EXISTING ANSWER:
${currentAnswer}

NEW CONTEXT:
[Source: ${chunk.source}]
${chunk.text}

Refine the existing answer using the new context. Add any new information from the new context. Keep information from the existing answer that is still relevant. Cite sources.`;

      currentAnswer = await askLLM(
        "Refine the existing answer with new context. Only add information from the provided context.",
        prompt
      );
    }
  }

  return currentAnswer;
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(60));
  console.log("CONTEXT INJECTION STRATEGIES DEMO");
  console.log("=".repeat(60));

  console.log(`\n  Question: "${QUESTION}"`);
  console.log(`  Retrieved chunks: ${RETRIEVED_CHUNKS.length}\n`);

  for (const c of RETRIEVED_CHUNKS) {
    console.log(`    • ${c.source} (${c.text.length} chars)`);
  }

  // Strategy 1: Stuffing
  console.log("\n" + "─".repeat(60));
  console.log("STRATEGY 1: STUFFING (all chunks in one prompt)");
  console.log("─".repeat(60));
  console.log("  LLM calls: 1\n");
  const stuffResult = await stuffingStrategy();
  console.log(`  📝 Answer:\n\n  ${stuffResult}\n`);

  // Strategy 2: Map-Reduce
  console.log("─".repeat(60));
  console.log("STRATEGY 2: MAP-REDUCE (each chunk separately, then combine)");
  console.log("─".repeat(60));
  console.log(`  LLM calls: ${RETRIEVED_CHUNKS.length + 1} (${RETRIEVED_CHUNKS.length} map + 1 reduce)\n`);
  const mapReduceResult = await mapReduceStrategy();
  console.log(`  📝 Answer:\n\n  ${mapReduceResult}\n`);

  // Strategy 3: Refine
  console.log("─".repeat(60));
  console.log("STRATEGY 3: REFINE (iteratively build answer)");
  console.log("─".repeat(60));
  console.log(`  LLM calls: ${RETRIEVED_CHUNKS.length}\n`);
  const refineResult = await refineStrategy();
  console.log(`  📝 Answer:\n\n  ${refineResult}\n`);

  // Comparison
  console.log("=".repeat(60));
  console.log("STRATEGY COMPARISON");
  console.log("=".repeat(60));
  console.log();
  console.log("  Strategy       LLM Calls   Best For");
  console.log("  " + "─".repeat(55));
  console.log("  Stuffing       1           Simple Q&A, small context");
  console.log(`  Map-Reduce     ${RETRIEVED_CHUNKS.length + 1}           Large docs, summarisation`);
  console.log(`  Refine         ${RETRIEVED_CHUNKS.length}           Synthesis, detailed answers`);
  console.log();
}

main().catch(console.error);
