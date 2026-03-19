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


Output:


PS D:\ITEL TASKS> cd task-async-systems-ai
PS D:\ITEL TASKS\task-async-systems-ai> npx tsx 06-job-orchestration/examples/pipeline.ts
============================================================
JOB ORCHESTRATION — Sequential Pipeline Demo
============================================================

  Starting pipeline for document 'doc-001' ...

  📄 Step 1: Extracting text from document ...
     → Extracted 148 characters
  ✂️  Step 2: Chunking text ...
     → Created 4 chunks
  🔢 Step 3: Generating embeddings ...
     → Generated 4 embeddings (4D each)
  💾 Step 4: Storing in vector database ...
     → Stored 4 vectors
  🔔 Step 5: Notifying user ...
     → User notified: "Document 'doc-001' is ready for search!"

  ✅ Pipeline completed in 4.83s

  Final context: {
  "documentId": "doc-001",
  "documentUrl": "https://example.com/whitepaper.pdf",
  "text": "This is the extracted text from the uploaded document. It contains important information about AI systems and their applications in modern software.",
  "chunks": [
    "This is the extracted text from the uploaded",
    "document. It contains important information about",
    "AI systems and their applications in modern",
    "software."
  ],
  "embeddings": [
    [
      0.8214,
      -0.1238,
      0.4141,
      -0.1007
    ],
    [
      0.1227,
      -0.4083,
      -0.0655,
      -0.0817
    ],
    [
      0.4333,
      -0.8269,
      0.0536,
      -0.868
    ],
    [
      -0.4113,
      0.4939,
      -0.0321,
      -0.9998
    ]
  ],
  "storedCount": 4
}
PS D:\ITEL TASKS\task-async-systems-ai>
```
