# Embeddings

## What Are Embeddings?

**Embeddings** are dense numerical vectors that capture the **semantic meaning** of data (text, images, audio). They allow computers to understand and compare meanings, not just keywords.

From the [Pinecone RAG documentation](https://www.pinecone.io/learn/retrieval-augmented-generation/):

> *"The embedding model is a special type of LLM that converts the data chunk into a **vector embedding**, a numerical representation of the data's meaning. This allows computers to search for similar items based on the vector representation of the stored data."*

---

## How Embeddings Work

```
Input Text                    Embedding Model              Vector (Embedding)
─────────                    ───────────────              ─────────────────
"I love dogs"        ──▶     text-embedding-3   ──▶      [0.021, -0.034, 0.891, ..., 0.045]
                              (OpenAI)                    (1536 dimensions)

"I adore puppies"    ──▶     text-embedding-3   ──▶      [0.019, -0.031, 0.887, ..., 0.042]
                                                          ↑ Similar vector! (similar meaning)

"Stock market        ──▶     text-embedding-3   ──▶      [0.780, 0.234, -0.102, ..., 0.651]
 crashed today"                                           ↑ Very different vector
```

---

## Key Properties

| Property | Description |
|----------|-------------|
| **Dense vectors** | Every dimension has a non-zero value (unlike sparse vectors) |
| **Fixed dimensionality** | Each model outputs a fixed size (e.g., 768, 1536, 3072) |
| **Semantic meaning** | Similar content → similar vectors |
| **Model-specific** | Different models produce different embedding spaces |

---

## Popular Embedding Models

| Model | Provider | Dimensions | Best For |
|-------|----------|------------|----------|
| `text-embedding-3-small` | OpenAI | 1536 | General text, cost-effective |
| `text-embedding-3-large` | OpenAI | 3072 | Highest accuracy |
| `all-MiniLM-L6-v2` | Sentence Transformers | 384 | Fast, lightweight, open-source |
| `BAAI/bge-large-en-v1.5` | BAAI | 1024 | High-quality open-source |

---

## Chunking Before Embedding

From the Pinecone docs:

> *"You may need to chunk it by dividing each piece of data, or document, into smaller chunks."*

```
Original Document (5000 words)
        │
   ┌────────────┐
   │  Chunking  │
   └────┬───────┘
   ┌────┴────────────────────────┐
   ▼         ▼          ▼        ▼
 Chunk 1   Chunk 2   Chunk 3   Chunk N
 (512 tok) (512 tok) (512 tok)
   ▼         ▼          ▼        ▼
 Vector 1  Vector 2  Vector 3  Vector N
   └─────────┴──────────┴────────┘
                  ▼
          Vector Database
```

| Chunking Strategy | Description | Best For |
|-------------------|-------------|----------|
| **Fixed-size** | Split every N tokens | Simple, predictable |
| **Sentence-based** | Split at sentence boundaries | Preserving meaning |
| **Paragraph-based** | Split at paragraph breaks | Structured docs |
| **Overlapping** | Chunks overlap by M tokens | Context at boundaries |

---

## Code Example

See [`examples/create-embeddings.ts`](./examples/create-embeddings.ts) — creates embeddings using the OpenAI API.

```bash
export OPENAI_API_KEY="sk-..."
npx tsx 01-embeddings/examples/create-embeddings.ts
```
