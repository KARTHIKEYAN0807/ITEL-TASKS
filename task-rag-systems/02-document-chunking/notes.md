# Document Chunking

## What Is Chunking?

**Chunking** is the process of splitting large documents into smaller pieces ("chunks") before generating embeddings. Each chunk becomes a separate vector in the vector database.

> *"You may need to chunk it by dividing each piece of data, or document, into smaller chunks."*
> — Pinecone

---

## Why Chunking Matters

```
Without Chunking:                    With Chunking:
┌─────────────────────┐              ┌──────────┐ ┌──────────┐ ┌──────────┐
│  Entire 50-page     │              │ Chunk 1  │ │ Chunk 2  │ │ Chunk N  │
│  document as ONE    │              │ (focused │ │ (focused │ │ (focused │
│  embedding          │              │  topic)  │ │  topic)  │ │  topic)  │
│                     │              └──────────┘ └──────────┘ └──────────┘
│  ❌ Diluted meaning │                 ✅ Each chunk has sharp semantic signal
│  ❌ Exceeds context │                 ✅ Fits in LLM context window
│  ❌ Irrelevant noise│                 ✅ Only relevant chunks retrieved
└─────────────────────┘
```

| Problem (no chunking) | Solution (chunking) |
|------------------------|---------------------|
| Single embedding averages meaning across 50 pages | Each chunk captures a focused concept |
| Full document exceeds LLM context window | Chunks are small enough to inject |
| Retrieval returns an entire irrelevant document | Retrieval returns only the relevant paragraph |

---

## Chunking Strategies

### 1. Fixed-Size Chunking

Split text every N characters (or tokens), regardless of content boundaries.

```
"The quick brown fox jumps over the lazy dog. It was a sunny day."

chunk_size = 30
→ ["The quick brown fox jumps ov", "er the lazy dog. It was a su", "nny day."]
```

| Pros | Cons |
|------|------|
| Simple, predictable | Cuts mid-sentence, mid-word |
| Uniform chunk sizes | Breaks semantic meaning |

### 2. Sentence-Based Chunking

Split at sentence boundaries, grouping N sentences per chunk.

```
Sentences: ["The quick brown fox jumps.", "Over the lazy dog.", "It was sunny.", "The end."]

sentences_per_chunk = 2
→ ["The quick brown fox jumps. Over the lazy dog.", "It was sunny. The end."]
```

| Pros | Cons |
|------|------|
| Preserves sentence meaning | Uneven chunk sizes |
| Natural reading units | Short sentences → small chunks |

### 3. Paragraph-Based Chunking

Split at paragraph boundaries (`\n\n`).

| Pros | Cons |
|------|------|
| Preserves topic coherence | Paragraphs vary wildly in length |
| Respects document structure | Very long paragraphs may still need splitting |

### 4. Overlapping Chunking

Chunks share some overlap (e.g. 50 tokens) so context isn't lost at boundaries.

```
Text: [A B C D E F G H I J K L]

chunk_size = 6, overlap = 2:
  Chunk 1: [A B C D E F]
  Chunk 2: [E F G H I J]       ← overlaps by 2
  Chunk 3: [I J K L]           ← overlaps by 2
```

| Pros | Cons |
|------|------|
| Preserves context at boundaries | More chunks → more embeddings → more storage |
| Reduces information loss | Duplicate content in multiple chunks |

### 5. Recursive Character Splitting

Try splitting by the most meaningful separator first; if chunks are still too big, recurse with the next separator.

```
Separator hierarchy:  \n\n → \n → . → " " → ""

1. Try splitting by paragraphs (\n\n)
2. If any chunk > max_size, split that chunk by lines (\n)
3. If still too big, split by sentences (.)
4. Last resort: split by character
```

| Pros | Cons |
|------|------|
| Best semantic preservation | More complex implementation |
| Adapts to document structure | Slower than fixed-size |

---

## Chunk Size Trade-Offs

```
         Too Small                    Sweet Spot                    Too Large
         (50 tokens)                  (256–512 tokens)              (2000+ tokens)
         ┌──────┐                     ┌──────────────┐              ┌────────────────────┐
         │ frag │                     │  complete    │              │ diluted meaning    │
         │ ment │                     │  thought     │              │ lots of noise      │
         │ ed   │                     │  with        │              │ wastes context     │
         └──────┘                     │  context     │              │ window             │
                                      └──────────────┘              └────────────────────┘
         ❌ Missing context           ✅ Balanced                   ❌ Too much noise
         ❌ Many tiny chunks          ✅ Good retrieval             ❌ Few, unfocused chunks
```

**General guidance:**
- **256–512 tokens** for most use cases
- **128 tokens** if documents are highly heterogeneous (e.g. FAQ lists)
- **1024 tokens** if documents are dense technical content that needs more context

---

## Code Example

See [`examples/chunking-strategies.ts`](./examples/chunking-strategies.ts) — compares all 5 chunking strategies on a sample document (**standalone, no API keys**).

```bash
npx tsx task-rag-systems/02-document-chunking/examples/chunking-strategies.ts
```

---

## Reference Links

- [Pinecone — Chunking Strategies](https://www.pinecone.io/learn/chunking-strategies/)
- [LangChain — Text Splitters](https://js.langchain.com/docs/modules/data_connection/document_transformers/)
