# Topic 06 — Context Engineering + Knowledge Graph

**Reference:** [Context Engineering Guide](../../Context%20Engineering/Context%20Engineering.md) | [Knowledge Graph Guide](../../Context%20Engineering/Knowledge%20Graph.md)

## What This Demonstrates

This topic brings together **Context Engineering** and **Knowledge Graphs** into a single, observable AI pipeline.

### Knowledge Graph Concepts Implemented

| Concept | Implementation |
|---|---|
| **Entities (Nodes)** | People, Companies, Products, Technologies, Locations — each with type, labels, properties |
| **Relationships (Edges)** | CEO_OF, FOUNDED, WORKS_AT, CREATED, USES_TECH, INVESTED_IN, ACQUIRED, etc. |
| **Triples** | Every relationship stored as `(Subject) --[Predicate]--> (Object)` |
| **Graph Traversal** | BFS multi-hop traversal to discover indirect connections |
| **Inference** | Rule-based reasoning: e.g. "works_at + headquartered_in = based_in" |
| **Subgraphs** | Extractable focused views for any set of entity IDs |
| **Entity Search** | Fuzzy search across IDs, types, labels, and properties |

### Context Engineering Concepts Implemented

| Context Type | Implementation |
|---|---|
| **Instruction Context** | System prompt with role, rules, constraints |
| **Task Context** | User's natural-language question |
| **Retrieved Context** | Facts fetched from the Knowledge Graph via tool calls |
| **Tool Context** | 5 tool definitions (search, relationships, traverse, infer, stats) |
| **Tool Result Context** | Structured JSON results from each tool execution |
| **Memory Context** | Simulated long-term user preferences |
| **Output Context** | Required structured response format |
| **Safety Context** | Read-only access, anti-hallucination rules, prompt injection defense |
| **Context Budgeting** | Character-level tracking per context layer |

### The Pipeline

```text
User Question
  → Build Context (Instruction + Memory + Safety + Output format)
  → Execute Tools (Search → Relationships → Traverse → Infer)
  → Assemble Retrieved Context
  → Send to LLM with full engineered context
  → Return grounded, source-attributed answer
```

### See in Sentry

| What | Where |
|---|---|
| Full pipeline trace | **Performance → Traces** → `context-engineering-pipeline` |
| Context build phase | Span: `context.build` |
| Each tool call | Spans: `tool.search_knowledge_graph`, `tool.get_entity_relationships`, `tool.traverse_graph`, `tool.infer_facts` |
| LLM generation | Span: `ai.chat` with full prompt & response |
| Errors | **Issues** → any captured exceptions |

## Files

| File | Purpose |
|---|---|
| `src/lib/knowledge-graph.ts` | In-memory Knowledge Graph: entities, relationships, traversal, inference |
| `src/lib/context-engineer.ts` | Context Engineering pipeline: builds prompt, defines tools, executes tools |
| `src/app/api/context-graph/route.ts` | API route: orchestrates the full pipeline with Sentry tracing |

## Run

```bash
# From the project root
npm run dev
# Then open: http://localhost:3000
# Click "Topic 06: Context Engineering + Knowledge Graph"
```
