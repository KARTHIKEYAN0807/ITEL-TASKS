export {};

/**
 * hallucination-guard.ts
 * ======================
 * Rule-based grounding checker that verifies whether LLM-generated claims
 * are supported by the retrieved context. Demonstrates confidence scoring
 * and faithfulness checking WITHOUT an LLM.
 *
 * STANDALONE — no API keys, no Ollama, no external services.
 *
 * Run:  npx tsx task-rag-systems/05-hallucination-mitigation/examples/hallucination-guard.ts
 */

// ── Types ────────────────────────────────────────────────────────

interface Claim {
  text: string;
  supported: boolean;
  confidence: number;
  matchedContext: string | null;
  verdict: "GROUNDED" | "UNGROUNDED" | "PARTIAL";
}

interface GroundingReport {
  answer: string;
  claims: Claim[];
  faithfulnessScore: number;
  verdict: "PASS" | "WARN" | "FAIL";
}

// ── The Context (retrieved chunks) ──────────────────────────────

const CONTEXT_CHUNKS = [
  "Our company offers a full refund within 30 days of purchase.",
  "After 30 days, a 50% store credit is issued for eligible items.",
  "Digital products are non-refundable once downloaded.",
  "Support is available Monday to Friday, 9 AM to 6 PM EST.",
  "Contact us at support@example.com or call 1-800-555-0199.",
];

// ── Simulated LLM Answers (good and bad) ────────────────────────

const TEST_CASES = [
  {
    label: "✅ Faithful Answer (well-grounded)",
    answer:
      "The company offers a full refund within 30 days of purchase. " +
      "After 30 days, you can receive a 50% store credit. " +
      "Digital products are non-refundable once downloaded. " +
      "You can contact support at support@example.com.",
  },
  {
    label: "⚠️ Partially Hallucinated Answer",
    answer:
      "The company offers a full refund within 30 days of purchase. " +
      "You can also get a refund after 30 days by calling phone support. " +
      "Weekend support is available for premium customers. " +
      "Contact us at support@example.com.",
  },
  {
    label: "❌ Heavily Hallucinated Answer",
    answer:
      "The company offers a 90-day money-back guarantee on all products. " +
      "Free shipping is included with every order. " +
      "Our 24/7 live chat support ensures you always get help. " +
      "We accept Bitcoin and cryptocurrency payments.",
  },
];

// ── Claim Extraction ─────────────────────────────────────────────

function extractClaims(answer: string): string[] {
  // Split answer into individual sentences/claims
  return answer
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);
}

// ── Grounding Check ──────────────────────────────────────────────

function checkGrounding(
  claim: string,
  contextChunks: string[]
): Claim {
  const claimLower = claim.toLowerCase();
  const claimWords = claimLower
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3); // Only meaningful words

  let bestMatch = "";
  let bestOverlap = 0;

  for (const chunk of contextChunks) {
    const chunkLower = chunk.toLowerCase();
    const chunkWords = chunkLower
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3);

    // Count overlapping meaningful words
    const overlap = claimWords.filter((w) => chunkWords.includes(w)).length;
    const overlapRatio = claimWords.length > 0 ? overlap / claimWords.length : 0;

    if (overlapRatio > bestOverlap) {
      bestOverlap = overlapRatio;
      bestMatch = chunk;
    }
  }

  // Determine verdict based on overlap
  let verdict: "GROUNDED" | "UNGROUNDED" | "PARTIAL";
  if (bestOverlap >= 0.6) {
    verdict = "GROUNDED";
  } else if (bestOverlap >= 0.3) {
    verdict = "PARTIAL";
  } else {
    verdict = "UNGROUNDED";
  }

  return {
    text: claim,
    supported: verdict === "GROUNDED",
    confidence: Math.round(bestOverlap * 100) / 100,
    matchedContext: bestOverlap > 0.1 ? bestMatch : null,
    verdict,
  };
}

// ── Full Grounding Report ────────────────────────────────────────

function groundingCheck(
  answer: string,
  contextChunks: string[]
): GroundingReport {
  const claimTexts = extractClaims(answer);
  const claims = claimTexts.map((c) =>
    checkGrounding(c, contextChunks)
  );

  const groundedCount = claims.filter((c) => c.verdict === "GROUNDED").length;
  const faithfulnessScore =
    claims.length > 0
      ? Math.round((groundedCount / claims.length) * 100) / 100
      : 0;

  let verdict: "PASS" | "WARN" | "FAIL";
  if (faithfulnessScore >= 0.8) {
    verdict = "PASS";
  } else if (faithfulnessScore >= 0.5) {
    verdict = "WARN";
  } else {
    verdict = "FAIL";
  }

  return { answer, claims, faithfulnessScore, verdict };
}

// ── Display ──────────────────────────────────────────────────────

function displayReport(label: string, report: GroundingReport): void {
  const verdictEmoji = {
    PASS: "✅",
    WARN: "⚠️",
    FAIL: "❌",
  };

  console.log(`\n${"─".repeat(60)}`);
  console.log(`${label}`);
  console.log("─".repeat(60));

  console.log(`\n  Answer: "${report.answer.slice(0, 100)}..."\n`);

  console.log("  Claims Analysis:\n");
  for (const claim of report.claims) {
    const icon =
      claim.verdict === "GROUNDED"
        ? "✅"
        : claim.verdict === "PARTIAL"
        ? "⚠️"
        : "❌";
    console.log(`    ${icon} [${claim.verdict}] (confidence: ${claim.confidence})`);
    console.log(`       Claim: "${claim.text.slice(0, 70)}${claim.text.length > 70 ? "..." : ""}"`);
    if (claim.matchedContext) {
      console.log(
        `       Match: "${claim.matchedContext.slice(0, 60)}..."`
      );
    } else {
      console.log(`       Match: (none — not found in context)`);
    }
    console.log();
  }

  console.log(
    `  ${verdictEmoji[report.verdict]} Overall Verdict: ${report.verdict}`
  );
  console.log(
    `  Faithfulness Score: ${(report.faithfulnessScore * 100).toFixed(0)}% (${
      report.claims.filter((c) => c.verdict === "GROUNDED").length
    }/${report.claims.length} claims grounded)`
  );
}

// ── Main ────────────────────────────────────────────────────────

function main() {
  console.log("=".repeat(60));
  console.log("HALLUCINATION GUARD — Grounding Checker Demo");
  console.log("=".repeat(60));

  console.log("\n  Context chunks used for grounding:\n");
  for (const chunk of CONTEXT_CHUNKS) {
    console.log(`    • "${chunk}"`);
  }

  for (const testCase of TEST_CASES) {
    const report = groundingCheck(testCase.answer, CONTEXT_CHUNKS);
    displayReport(testCase.label, report);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("MITIGATION STRATEGIES DEMONSTRATED");
  console.log("=".repeat(60));
  console.log(`
  1. CLAIM EXTRACTION    — Split LLM output into individual claims
  2. GROUNDING CHECK     — Compare each claim against context chunks
  3. CONFIDENCE SCORING  — Measure word overlap as a proxy for support
  4. FAITHFULNESS SCORE  — % of claims that are grounded
  5. VERDICT RATING      — PASS (≥80%), WARN (≥50%), FAIL (<50%)
  `);
}

main();
