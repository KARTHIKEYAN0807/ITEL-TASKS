export {};

/**
 * chunking-strategies.ts
 * ======================
 * Demonstrates 5 chunking strategies on a sample document.
 * Compares: fixed-size, sentence-based, paragraph-based, overlapping, and recursive.
 *
 * STANDALONE — no API keys or external services needed.
 *
 * Run:  npx tsx task-rag-systems/02-document-chunking/examples/chunking-strategies.ts
 */

// ── Sample Document ────────────────────────────────────────────────

const SAMPLE_DOC = `Machine Learning Fundamentals

Machine learning is a subset of artificial intelligence that enables systems to learn from data. Instead of being explicitly programmed, these systems identify patterns and make decisions with minimal human intervention.

Supervised Learning

In supervised learning, the model is trained on labelled data. Each training example consists of an input and a desired output. Common algorithms include linear regression, decision trees, and neural networks. The goal is to learn a mapping function from inputs to outputs that generalises to unseen data.

Unsupervised Learning

Unsupervised learning works with unlabelled data. The model tries to find hidden patterns or structures in the data. Clustering algorithms like K-means group similar data points together. Dimensionality reduction techniques like PCA reduce the number of features while preserving important information.

Reinforcement Learning

In reinforcement learning, an agent learns by interacting with an environment. The agent receives rewards or penalties based on its actions. Over time, it learns a policy that maximises cumulative reward. Applications include game playing, robotics, and autonomous navigation.`;

// ── Strategy 1: Fixed-Size ────────────────────────────────────────

function fixedSizeChunk(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize).trim());
  }
  return chunks.filter((c) => c.length > 0);
}

// ── Strategy 2: Sentence-Based ───────────────────────────────────

function sentenceChunk(text: string, sentencesPerChunk: number): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  for (let i = 0; i < sentences.length; i += sentencesPerChunk) {
    chunks.push(
      sentences
        .slice(i, i + sentencesPerChunk)
        .map((s) => s.trim())
        .join(" ")
    );
  }
  return chunks.filter((c) => c.length > 0);
}

// ── Strategy 3: Paragraph-Based ──────────────────────────────────

function paragraphChunk(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

// ── Strategy 4: Overlapping Fixed-Size ────────────────────────────

function overlappingChunk(
  text: string,
  chunkSize: number,
  overlap: number
): string[] {
  const step = chunkSize - overlap;
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += step) {
    chunks.push(text.slice(i, i + chunkSize).trim());
    if (i + chunkSize >= text.length) break;
  }
  return chunks.filter((c) => c.length > 0);
}

// ── Strategy 5: Recursive Character Splitting ────────────────────

function recursiveChunk(
  text: string,
  maxSize: number,
  separators: string[] = ["\n\n", "\n", ". ", " "]
): string[] {
  if (text.length <= maxSize) return [text.trim()].filter((t) => t.length > 0);

  const sep = separators[0];
  const remaining = separators.slice(1);
  const parts = text.split(sep);
  const chunks: string[] = [];
  let current = "";

  for (const part of parts) {
    const candidate = current ? current + sep + part : part;
    if (candidate.length > maxSize && current) {
      // current is already small enough or needs recursive splitting
      if (current.length > maxSize && remaining.length > 0) {
        chunks.push(...recursiveChunk(current, maxSize, remaining));
      } else {
        chunks.push(current.trim());
      }
      current = part;
    } else {
      current = candidate;
    }
  }

  if (current) {
    if (current.length > maxSize && remaining.length > 0) {
      chunks.push(...recursiveChunk(current, maxSize, remaining));
    } else {
      chunks.push(current.trim());
    }
  }

  return chunks.filter((c) => c.length > 0);
}

// ── Display Helper ───────────────────────────────────────────────

function displayChunks(name: string, chunks: string[]): void {
  console.log(`\n--- ${name} (${chunks.length} chunks) ---\n`);
  chunks.forEach((chunk, i) => {
    const preview =
      chunk.length > 80 ? chunk.slice(0, 80) + "..." : chunk;
    console.log(
      `  Chunk ${i + 1} (${chunk.length} chars):\n    "${preview}"\n`
    );
  });
}

// ── Main ────────────────────────────────────────────────────────

function main() {
  console.log("=".repeat(60));
  console.log("DOCUMENT CHUNKING STRATEGIES DEMO");
  console.log("=".repeat(60));
  console.log(
    `\nDocument length: ${SAMPLE_DOC.length} characters\n`
  );

  // Strategy 1: Fixed-size (200 chars)
  const fixed = fixedSizeChunk(SAMPLE_DOC, 200);
  displayChunks("FIXED-SIZE (200 chars)", fixed);

  // Strategy 2: Sentence-based (3 sentences per chunk)
  const sentence = sentenceChunk(SAMPLE_DOC, 3);
  displayChunks("SENTENCE-BASED (3 per chunk)", sentence);

  // Strategy 3: Paragraph-based
  const paragraph = paragraphChunk(SAMPLE_DOC);
  displayChunks("PARAGRAPH-BASED", paragraph);

  // Strategy 4: Overlapping (200 chars, 50 char overlap)
  const overlapping = overlappingChunk(SAMPLE_DOC, 200, 50);
  displayChunks("OVERLAPPING (200 chars, 50 overlap)", overlapping);

  // Strategy 5: Recursive (max 250 chars)
  const recursive = recursiveChunk(SAMPLE_DOC, 250);
  displayChunks("RECURSIVE (max 250 chars)", recursive);

  // Comparison summary
  console.log("=".repeat(60));
  console.log("COMPARISON SUMMARY");
  console.log("=".repeat(60));
  console.log();

  const strategies = [
    { name: "Fixed-Size (200)", chunks: fixed },
    { name: "Sentence (3/chunk)", chunks: sentence },
    { name: "Paragraph", chunks: paragraph },
    { name: "Overlapping (200, 50)", chunks: overlapping },
    { name: "Recursive (250)", chunks: recursive },
  ];

  console.log(
    "  " +
      "Strategy".padEnd(25) +
      "Chunks".padEnd(10) +
      "Avg Size".padEnd(12) +
      "Min".padEnd(8) +
      "Max"
  );
  console.log("  " + "─".repeat(63));

  for (const s of strategies) {
    const sizes = s.chunks.map((c) => c.length);
    const avg = Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length);
    const min = Math.min(...sizes);
    const max = Math.max(...sizes);
    console.log(
      "  " +
        s.name.padEnd(25) +
        String(s.chunks.length).padEnd(10) +
        String(avg).padEnd(12) +
        String(min).padEnd(8) +
        String(max)
    );
  }
  console.log();
}

main();
