# Job Orchestration

## What Is Job Orchestration?

**Job orchestration** is the coordination of multiple dependent tasks in a workflow. In AI apps, a single user action often triggers a **pipeline** of tasks that must run in a specific order.

---

## Example: AI Document Processing Pipeline

```
User uploads a document
         │
         ▼
  ┌──────────────┐
  │ Step 1:      │
  │ Extract text │    ← OCR / text extraction
  └──────┬───────┘
         ▼
  ┌──────────────┐
  │ Step 2:      │
  │ Chunk text   │    ← Split into smaller pieces
  └──────┬───────┘
         ▼
  ┌──────────────┐
  │ Step 3:      │
  │ Generate     │    ← Create vector embeddings
  │ embeddings   │
  └──────┬───────┘
         ▼
  ┌──────────────┐
  │ Step 4:      │
  │ Store in     │    ← Save to vector database
  │ vector DB    │
  └──────┬───────┘
         ▼
  ┌──────────────┐
  │ Step 5:      │
  │ Notify user  │    ← "Document ready for search!"
  └──────────────┘
```

---

## Orchestration Patterns

### Pattern 1: Sequential (Chained Messages)

Each step sends a message for the next step upon completion. See the code example.

### Pattern 2: Fan-Out / Fan-In

Process multiple chunks in parallel, then aggregate:

```
                    ┌──▶ [Embed Chunk 1] ──┐
                    │                       │
  [Chunk Text] ────┼──▶ [Embed Chunk 2] ──┼──▶ [Store All in DB]
                    │                       │
                    └──▶ [Embed Chunk 3] ──┘

  "Fan-Out"                                  "Fan-In"
  (split work)                               (aggregate results)
```

### Pattern 3: Saga Pattern (with Compensation)

For complex workflows where steps may need to be **undone** if a later step fails:

```
Step 1: Charge customer    → Success
Step 2: Generate AI report → Success
Step 3: Send email         → FAIL!
   ↓
Compensate: Refund customer (undo Step 1)
Compensate: Delete report  (undo Step 2)
```

---

## Code Example

See [`examples/pipeline.ts`](./examples/pipeline.ts) — a sequential pipeline orchestrator (runs standalone, no AWS).

```bash
npx tsx 06-job-orchestration/examples/pipeline.ts
```
