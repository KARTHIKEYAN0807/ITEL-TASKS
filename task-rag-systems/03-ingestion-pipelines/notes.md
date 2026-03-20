# Ingestion Pipelines

## What Is an Ingestion Pipeline?

An **ingestion pipeline** is the offline process that transforms raw documents into searchable vectors stored in a vector database. It runs before any user query — preparing the knowledge base that RAG will retrieve from.

---

## The Pipeline Stages

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  LOAD    │───▶│  CLEAN   │───▶│  CHUNK   │───▶│  EMBED   │───▶│  STORE   │
│          │    │          │    │          │    │          │    │          │
│ Read raw │    │ Strip    │    │ Split    │    │ Generate │    │ Upsert   │
│ files    │    │ noise,   │    │ into     │    │ dense    │    │ into     │
│ (PDF,    │    │ normalize│    │ pieces   │    │ vectors  │    │ vector   │
│  HTML,   │    │ text     │    │          │    │          │    │ DB       │
│  MD)     │    │          │    │          │    │          │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### Stage 1: Load

Read raw documents from their source:

| Source | Format | Approach |
|--------|--------|----------|
| Local files | PDF, DOCX, TXT, MD | File system read + parser (e.g. `pdf-parse`) |
| Web pages | HTML | Fetch + strip tags |
| Databases | SQL rows | Query → text extraction |
| APIs | JSON | Fetch + field mapping |

### Stage 2: Clean & Normalise

Raw text is noisy. Cleaning steps include:

| Step | Example |
|------|---------|
| Strip HTML tags | `<p>Hello</p>` → `Hello` |
| Remove boilerplate | Headers, footers, navigation |
| Normalise whitespace | Multiple spaces/newlines → single |
| Fix encoding | Convert to UTF-8 |
| Remove special chars | Control characters, zero-width spaces |

### Stage 3: Chunk

Split cleaned text into retrieval-friendly pieces (see [02-document-chunking](../02-document-chunking/notes.md)).

### Stage 4: Embed

Generate a dense vector for each chunk:

```typescript
// Pseudocode
for (const chunk of chunks) {
  const vector = await embedModel.embed(chunk.text);
  chunk.vector = vector;
}
```

### Stage 5: Store

Upsert chunk vectors + metadata into the vector database:

```typescript
await vectorDB.upsert([
  {
    id: "doc-1-chunk-3",
    values: [0.021, -0.034, ...],      // the embedding
    metadata: {
      source: "policy.pdf",
      page: 3,
      title: "Refund Policy",
      created_at: "2025-01-15",
    },
  },
]);
```

---

## Metadata — The Secret Weapon

Attaching metadata to each chunk enables **filtered retrieval**:

```
Query: "What is the return policy?"
Filter: { source: "policies", year: 2025 }

→ Only search chunks from the "policies" source created in 2025
→ Faster, more relevant results
```

| Useful Metadata Fields | Purpose |
|------------------------|---------|
| `source` / `filename` | Track document origin |
| `page` / `section` | Enable precise citations |
| `created_at` / `updated_at` | Freshness filtering |
| `category` / `type` | Domain-based filtering |
| `author` | Attribution |
| `chunk_index` | Ordering within a document |

---

## Batch vs Streaming Ingestion

| Approach | When to Use | Trade-offs |
|----------|-------------|------------|
| **Batch** | Initial bulk load, nightly re-index | Simple, but data can be stale between runs |
| **Streaming** | Real-time updates (new docs, edits) | Always fresh, but more complex infrastructure |
| **Hybrid** | Batch for full re-index + streaming for incremental | Best of both, most operational overhead |

```
Batch:      Collect all docs → Process → Upload (hourly/daily cron)

Streaming:  Doc created/updated → Event trigger → Process → Upload (real-time)
```

---

## Deduplication & Versioning

| Problem | Solution |
|---------|----------|
| Same document re-ingested | Hash-based dedup (content hash → skip if exists) |
| Document updated | Version tracking (overwrite vectors for same doc ID) |
| Orphaned chunks | Delete old chunks when source document is removed |

---

## Code Example

See [`examples/ingestion-pipeline.ts`](./examples/ingestion-pipeline.ts) — multi-document ingestion with metadata extraction, cleaning, chunking, embedding, and in-memory storage.

```bash
# Requires Ollama with nomic-embed-text
ollama pull nomic-embed-text
npx tsx task-rag-systems/03-ingestion-pipelines/examples/ingestion-pipeline.ts
```
