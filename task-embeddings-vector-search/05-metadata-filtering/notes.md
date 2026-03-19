# Metadata Filtering

## What Is Metadata Filtering?

**Metadata filtering** combines vector similarity search with traditional attribute-based filtering. Each vector can have **metadata** (key-value pairs), and you filter results based on those attributes.

```
Without Metadata Filter:
  Query: "machine learning" → Returns ALL similar documents

With Metadata Filter:
  Query: "machine learning" + filter: category="AI" AND date > "2026-01-01"
  → Returns only AI documents from 2026 that are similar
```

---

## Use Cases

| Use Case | Filter |
|----------|--------|
| Multi-tenant app | `userId = "user_123"` |
| Time-limited search | `date > "2026-01-01"` |
| Category scoping | `category = "legal"` |
| Access control | `accessLevel in ["public", "internal"]` |
| Language filtering | `language = "en"` |

---

## Filter Operators (Pinecone)

| Operator | Description | Example |
|----------|-------------|---------|
| `$eq` | Equal to | `{ category: { $eq: "AI" } }` |
| `$ne` | Not equal | `{ status: { $ne: "deleted" } }` |
| `$gt` | Greater than | `{ price: { $gt: 100 } }` |
| `$gte` | Greater or equal | `{ date: { $gte: "2026-01-01" } }` |
| `$lt` | Less than | `{ age: { $lt: 30 } }` |
| `$lte` | Less or equal | `{ score: { $lte: 0.5 } }` |
| `$in` | In list | `{ tag: { $in: ["ai", "ml"] } }` |
| `$nin` | Not in list | `{ tag: { $nin: ["spam"] } }` |

---

## Combining Filters

```typescript
// AND: both conditions must be true
const filter = {
  $and: [
    { category: { $eq: "AI" } },
    { date: { $gte: "2026-01-01" } },
  ],
};

// OR: at least one must be true
const filter = {
  $or: [
    { category: { $eq: "AI" } },
    { category: { $eq: "Data Science" } },
  ],
};
```

---

## Code Example

See [`examples/metadata-filter.ts`](./examples/metadata-filter.ts) — queries Pinecone with metadata filters.

```bash
PINECONE_API_KEY="..." OPENAI_API_KEY="sk-..." npx tsx metadata-filter.ts
```
