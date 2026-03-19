# RAG — Retrieval-Augmented Generation

## What Is RAG?

From the [Pinecone documentation](https://www.pinecone.io/learn/retrieval-augmented-generation/):

> *"Retrieval-augmented generation, or RAG, is a technique that uses authoritative, external data to improve the accuracy, relevancy, and usefulness of a model's output."*

---

## Why RAG Is Needed

Foundation models have critical limitations:

| Limitation | Description (from Pinecone docs) |
|------------|----------------------------------|
| **Knowledge cutoffs** | *"After training, data is frozen at a specific point in time, leading to plausible but incorrect responses about recent developments."* |
| **Lack domain depth** | *"Broad knowledge, but can lack depth in specialized domains."* |
| **No private data** | *"General-purpose models don't know the specifics of your business."* |
| **Trust erosion** | *"Models typically cannot cite their sources."* |
| **Hallucinations** | *"Models assign probabilities to all possible continuations, even the wrong ones."* |

---

## The 4 RAG Components

```
1. INGESTION       2. RETRIEVAL       3. AUGMENT       4. GENERATE
┌──────────┐      ┌──────────┐      ┌─────────┐      ┌─────────┐
│ Load     │      │ Embed    │      │ Combine │      │ LLM     │
│ data     │      │ query    │      │ results │      │ Output  │
│   ↓      │      │   ↓      │      │ + query │      │         │
│ Chunk    │      │ Search   │      │ into    │      │ Answer  │
│   ↓      │      │ vector   │      │ prompt  │      │ with    │
│ Embed    │      │ DB       │      │         │      │ context │
│   ↓      │      │   ↓      │      │         │      │         │
│ Store    │      │ Rerank   │      │         │      │         │
└──────────┘      └──────────┘      └─────────┘      └─────────┘
  (offline)        (per query)        (per query)      (per query)
```

---

## The Augmented Prompt (from Pinecone docs)

> *"An augmented prompt might look like this:"*

```
QUESTION: <the user's question>
CONTEXT: <the search results to use as context>

Using the CONTEXT provided, answer the QUESTION.
Keep your answer grounded in the facts of the CONTEXT.
If the CONTEXT doesn't contain the answer, say you don't know.
```

---

## RAG Benefits

| Benefit | Description |
|---------|-------------|
| **Real-time data** | Access current info beyond training cutoff |
| **Trust** | Cite sources so users can verify |
| **Control** | Choose sources, apply guardrails |
| **Cost-effective** | Cheaper than fine-tuning or retraining |

---

## Agentic RAG

From Pinecone docs:

> *"With the rise of AI agents, agents are now orchestrators of the core RAG components to: construct more effective queries, access additional retrieval tools, evaluate the accuracy and relevance of the retrieved context, and apply reasoning to validate retrieved information."*

```
Traditional RAG:
  Query → Embed → Search → Augment → Generate → Answer

Agentic RAG:
  Query → Agent decides:
      ├── "Need more info" → Reformulate query → Search again
      ├── "Check another source" → Query different tool/DB
      ├── "Validate this" → Cross-reference results
      └── "Good enough" → Augment → Generate → Answer
```

---

## Code Example

See [`examples/rag-query.ts`](./examples/rag-query.ts) — full RAG pipeline (embed → search → augment → generate).

```bash
PINECONE_API_KEY="..." OPENAI_API_KEY="sk-..." npx tsx rag-query.ts
```
