# Context Injection

## What Is Context Injection?

**Context injection** is the process of inserting retrieved documents into the LLM prompt so the model can use them to generate a grounded answer. It is the "Augment" step of RAG — the bridge between retrieval and generation.

---

## Why It Matters

The LLM only "sees" what is in its prompt. Context injection determines:

| Decision | Impact |
|----------|--------|
| **What** context to include | Relevance of the answer |
| **How much** context to include | Whether you exceed the context window or waste tokens on noise |
| **Where** to place context | How well the model attends to it (primacy/recency effects) |
| **How** to format context | Whether the model can parse and use the information reliably |

---

## Context Injection Strategies

### 1. Stuffing (Direct Injection)

Concatenate all retrieved chunks and insert them into a single prompt.

```
SYSTEM: Answer based on the provided context.

USER:
  Context:
  {chunk_1}
  {chunk_2}
  {chunk_3}

  Question: {question}
```

| Pros | Cons |
|------|------|
| Simplest approach | Hits context window limit with many/large chunks |
| LLM sees everything at once | Irrelevant chunks add noise |
| Single LLM call | Cost scales with context size |

**Best for:** Small context (< 10 chunks), simple Q&A

### 2. Map-Reduce

Process each chunk independently ("map"), then combine the individual answers ("reduce").

```
MAP PHASE:
  Chunk 1 + Question → LLM → Answer 1
  Chunk 2 + Question → LLM → Answer 2
  Chunk 3 + Question → LLM → Answer 3

REDUCE PHASE:
  [Answer 1, Answer 2, Answer 3] → LLM → Final Answer
```

| Pros | Cons |
|------|------|
| Handles unlimited context | Multiple LLM calls (slower, more expensive) |
| Each chunk gets full attention | May lose cross-chunk connections |
| Parallelisable map phase | Reduce step can still hallucinate |

**Best for:** Large document sets, summarisation tasks

### 3. Refine (Iterative)

Process chunks sequentially, refining the answer with each new chunk.

```
Chunk 1 + Question           → LLM → Answer v1
Chunk 2 + Question + Answer v1 → LLM → Answer v2
Chunk 3 + Question + Answer v2 → LLM → Answer v3 (final)
```

| Pros | Cons |
|------|------|
| Each step builds on prior context | Sequential — can't parallelise |
| Never exceeds context window | Later chunks have outsized influence |
| Good for synthesis | More LLM calls than stuffing |

**Best for:** Synthesis across many related chunks, detailed answers

---

## Context Window & Token Budgeting

LLMs have a fixed context window. You must budget tokens:

```
┌─────────────────────────────────────────┐
│            CONTEXT WINDOW               │
│         (e.g. 8,192 tokens)             │
│                                         │
│  ┌───────────┐  ┌─────────────────────┐ │
│  │  System   │  │    Retrieved        │ │
│  │  Prompt   │  │    Context          │ │
│  │  (~200)   │  │    (~4,000)         │ │
│  └───────────┘  └─────────────────────┘ │
│  ┌───────────┐  ┌─────────────────────┐ │
│  │  User     │  │    Reserved for     │ │
│  │  Query    │  │    LLM Response     │ │
│  │  (~100)   │  │    (~3,892)         │ │
│  └───────────┘  └─────────────────────┘ │
└─────────────────────────────────────────┘

Budget = context_window - system_prompt - user_query - response_reserve
       = 8192 - 200 - 100 - 3892
       = 4,000 tokens for context
```

**Practical tips:**
- Reserve **30–50%** of the window for the model's response
- Track token counts with a tokenizer (e.g. `tiktoken`)
- If context overflows, **truncate the least-relevant chunks** rather than cutting mid-chunk

---

## Prompt Placement: Where to Put Context

Research shows LLMs attend differently based on where information appears:

| Placement | Attention Pattern |
|-----------|-------------------|
| **Start of prompt** (before question) | Strong — primacy effect |
| **End of prompt** (after question) | Strong — recency effect |
| **Middle of prompt** | Weakest — "lost in the middle" problem |

> **Best practice:** Place the most relevant chunk **first** and the question **last**, or place context **after** the question for a recency boost.

---

## Formatting Context for the LLM

How you format the injected context affects answer quality:

```
✅ GOOD — Numbered/labelled chunks with clear separators:

  [Source 1: Refund Policy]
  Our company offers a full refund within 30 days ...

  [Source 2: Return Process]
  To initiate a return, log into your account ...


❌ BAD — Raw text blob with no structure:

  Our company offers a full refund within 30 days
  To initiate a return log into your account ...
```

| Formatting Tip | Why |
|----------------|-----|
| Label each chunk with source info | Enables the LLM to cite sources |
| Use separators (`---`, `[Source N]`) | Helps the model distinguish chunks |
| Include metadata (page, date) | Helps the model assess relevance |

---

## Code Example

See [`examples/context-injection.ts`](./examples/context-injection.ts) — compares Stuffing, Map-Reduce, and Refine strategies side-by-side.

```bash
# Requires Ollama with llama3.2
ollama pull llama3.2:1b
npx tsx task-rag-systems/04-context-injection/examples/context-injection.ts
```
