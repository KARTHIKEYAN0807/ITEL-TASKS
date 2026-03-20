# Retrieval-Augmented Generation (RAG)

## What Is RAG?

**Retrieval-Augmented Generation (RAG)** is a technique that combines information retrieval with LLM generation. Instead of relying solely on what the model "memorised" during training, RAG fetches relevant external documents at query time and injects them into the prompt so the LLM can produce grounded, up-to-date answers.

> *"RAG uses authoritative, external data to improve the accuracy, relevancy, and usefulness of a model's output."*
> — Pinecone

---

## Why LLMs Need RAG

Foundation models are powerful but have critical gaps:

| Limitation | Problem |
|------------|---------|
| **Knowledge cutoff** | Training data is frozen at a point in time — the model doesn't know about anything that happened afterwards |
| **Shallow domain knowledge** | Broad but not deep — may lack specifics for your industry |
| **No private data** | General-purpose models know nothing about your internal docs, databases, or wikis |
| **Hallucinations** | Models assign probabilities to all continuations, including wrong ones, and present them confidently |
| **No citations** | Cannot point to where an answer came from, eroding user trust |

RAG addresses **all five** by grounding the LLM in retrieved evidence.

---

## The Full Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   OFFLINE — INGESTION                       │
│                                                             │
│   Documents ──▶ Chunking ──▶ Embeddings ──▶ Vector DB      │
│   (PDF, HTML,    (split      (dense          (Pinecone,     │
│    Markdown)      into        vectors)        Chroma,       │
│                   pieces)                     Weaviate)     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   ONLINE — QUERY TIME                       │
│                                                             │
│   User Query                                                │
│       │                                                     │
│       ▼                                                     │
│   Embed Query ──▶ Vector DB Search ──▶ Retrieve Top-K       │
│                                           │                 │
│                                           ▼                 │
│                                     Rerank (optional)       │
│                                           │                 │
│                                           ▼                 │
│                                     Augment Prompt          │
│                                     (inject context)        │
│                                           │                 │
│                                           ▼                 │
│                                       LLM Answer            │
└─────────────────────────────────────────────────────────────┘
```

### The 4 Stages

| Stage | Phase | What Happens |
|-------|-------|--------------|
| **1. Ingest** | Offline | Load documents, chunk them, generate embeddings, store in vector DB |
| **2. Retrieve** | Online | Embed the user query, search the vector DB for top-K similar chunks |
| **3. Augment** | Online | Combine retrieved chunks with the user question into an enriched prompt |
| **4. Generate** | Online | Send the augmented prompt to the LLM to produce a grounded answer |

---

## RAG vs Fine-Tuning

| Dimension | RAG | Fine-Tuning |
|-----------|-----|-------------|
| **Data freshness** | Always up-to-date (swap out the vector DB) | Frozen at training time |
| **Cost** | Cheap — just index new documents | Expensive — retraining required |
| **Transparency** | Can cite exact source documents | Black-box — no traceability |
| **Domain depth** | As deep as your document corpus | As deep as training data |
| **Hallucination risk** | Lower — answers are grounded | Higher — model may still fabricate |
| **Best for** | Knowledge-heavy Q&A, support bots, search | Tone/style adaptation, task-specific behaviour |

> **Rule of thumb:** If you need the model to *know new facts*, use RAG. If you need the model to *behave differently*, consider fine-tuning.

---

## The Augmented Prompt Pattern

```
SYSTEM: You are a helpful assistant. Answer based ONLY on the
        provided context. If the context doesn't contain the
        answer, say "I don't know."

USER:
  QUESTION: {user_question}

  CONTEXT:
  ---
  {chunk_1}
  ---
  {chunk_2}
  ---
  {chunk_3}

  Answer the QUESTION using only the CONTEXT above.
  Cite which document(s) you used.
```

This pattern:
- **Grounds** the LLM in retrieved facts
- **Limits** the answer scope to prevent hallucination
- **Enables citations** so users can verify

---

## Agentic RAG

Traditional RAG is a fixed pipeline. **Agentic RAG** adds a reasoning loop:

```
Traditional:  Query → Retrieve → Augment → Generate → Answer

Agentic:      Query → Agent decides:
                  ├── "Need more info"    → Reformulate query → Retrieve again
                  ├── "Check another DB"  → Query a different tool/source
                  ├── "Validate this"     → Cross-reference retrieved chunks
                  └── "Good enough"       → Augment → Generate → Answer
```

The agent can iteratively refine retrieval until it has enough evidence.

---

## Code Example

See [`examples/rag-basics.ts`](./examples/rag-basics.ts) — a full RAG pipeline using Ollama (local LLM + embeddings) with an in-memory vector store.

```bash
# Requires Ollama running with nomic-embed-text and llama3.2
ollama pull nomic-embed-text
ollama pull llama3.2:1b
npx tsx task-rag-systems/01-retrieval-augmented-generation/examples/rag-basics.ts
```

---

## Reference Links

- [DeepLearning.AI — RAG Course](https://www.deeplearning.ai/courses/retrieval-augmented-generation-rag/)
- [Pinecone — Retrieval-Augmented Generation](https://www.pinecone.io/learn/retrieval-augmented-generation/)
- [Pinecone — Chunking Strategies](https://www.pinecone.io/learn/chunking-strategies/)
