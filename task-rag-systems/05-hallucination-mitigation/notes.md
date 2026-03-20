# Hallucination Mitigation

## What Are Hallucinations?

**Hallucinations** are outputs where the LLM generates information that is incorrect, fabricated, or unsupported by the provided context. In RAG systems, this is especially dangerous because users expect answers to be grounded in retrieved documents.

---

## Types of Hallucinations

| Type | Description | Example |
|------|-------------|---------|
| **Intrinsic** | Contradicts the provided context | Context says "30-day refund" → LLM says "60-day refund" |
| **Extrinsic** | Adds information not in the context | Context has no shipping info → LLM invents "Free shipping on all orders" |
| **Fabricated citations** | Invents source references | Cites "Section 4.2" when no such section exists |
| **Confident nonsense** | States wrong info with certainty | "Our company was founded in 1847" (not in any document) |

---

## Why RAG Doesn't Automatically Prevent Hallucination

RAG **reduces** but does **not eliminate** hallucination:

```
Retrieved Context:                   LLM Output:
┌─────────────────────────┐         ┌──────────────────────────────┐
│ "Refund within 30 days" │    →    │ "You can get a full refund   │
│ "Email: support@co.com" │         │  within 30 days. You can     │
│                         │         │  also get a refund after     │
│                         │         │  30 days via phone support." │  ← Hallucinated!
└─────────────────────────┘         └──────────────────────────────┘
```

The LLM may still:
- Blend retrieved facts with its training data
- Over-generalise from a specific chunk
- Fill in gaps with plausible-sounding fabrications

---

## Mitigation Strategies

### 1. Grounding Instructions

Tell the LLM explicitly to only use provided context:

```
SYSTEM PROMPT:
  Answer ONLY based on the CONTEXT provided.
  If the context doesn't contain the answer, say "I don't know."
  Do NOT use any prior knowledge.
  Quote directly from the context when possible.
```

**Effectiveness:** ★★★☆☆ — Simple but LLMs can still ignore instructions.

### 2. Citation Enforcement

Require the LLM to cite which chunk each claim comes from:

```
SYSTEM PROMPT:
  For each statement in your answer, cite the source document
  in brackets, e.g. [Source 1]. If you cannot cite a source,
  do not include the statement.
```

**Effectiveness:** ★★★★☆ — Forces traceability; easy to audit.

### 3. Self-Consistency Checking

Generate multiple answers and check for consistency:

```
Answer 1: "Refund within 30 days"       ← All 3 agree
Answer 2: "Full refund, 30-day window"  ← Consistent
Answer 3: "30-day refund policy"        ← Consistent

→ High confidence: claim is likely grounded
```

```
Answer 1: "Refund within 30 days"       ← Disagree!
Answer 2: "Refund within 60 days"       ← Inconsistent
Answer 3: "No refund policy mentioned"  ← Inconsistent

→ Low confidence: flag for review
```

**Effectiveness:** ★★★★☆ — Catches many fabrications; costs N× LLM calls.

### 4. Confidence Scoring

Score each claim by checking overlap with retrieved context:

```
Claim: "Refund within 30 days"
Context contains: "full refund within 30 days of purchase"
Overlap: HIGH → Confidence: 0.95

Claim: "Free shipping on weekends"
Context contains: nothing about shipping
Overlap: NONE → Confidence: 0.05 → FLAG AS UNGROUNDED
```

**Effectiveness:** ★★★☆☆ — Quick to compute; catches obvious fabrications.

### 5. Faithfulness Verification (NLI)

Use a Natural Language Inference model to check if each claim is:
- **Entailed** by the context ✅
- **Contradicted** by the context ❌
- **Neutral** (not mentioned) ⚠️

**Effectiveness:** ★★★★★ — Most rigorous; requires an NLI model.

---

## Defence in Depth

Best practice is to **layer multiple strategies**:

```
┌────────────────────────────────────────┐
│          GROUNDING INSTRUCTIONS        │ ← Layer 1: Prompt engineering
├────────────────────────────────────────┤
│          CITATION ENFORCEMENT          │ ← Layer 2: Traceability
├────────────────────────────────────────┤
│          CONFIDENCE SCORING            │ ← Layer 3: Automated check
├────────────────────────────────────────┤
│      SELF-CONSISTENCY / NLI CHECK      │ ← Layer 4: Verification
├────────────────────────────────────────┤
│          HUMAN REVIEW (optional)       │ ← Layer 5: Final safety net
└────────────────────────────────────────┘
```

---

## Measuring Hallucination

| Metric | What It Measures |
|--------|------------------|
| **Faithfulness** | % of claims supported by context |
| **Answer relevance** | Does the answer address the question? |
| **Context relevance** | Were the right chunks retrieved? |
| **Hallucination rate** | % of claims NOT found in context |

Frameworks like **RAGAS** and **TruLens** automate these measurements.

---

## Code Example

See [`examples/hallucination-guard.ts`](./examples/hallucination-guard.ts) — a rule-based grounding checker that verifies whether LLM claims are supported by the context (**standalone, no API keys**).

```bash
npx tsx task-rag-systems/05-hallucination-mitigation/examples/hallucination-guard.ts
```
