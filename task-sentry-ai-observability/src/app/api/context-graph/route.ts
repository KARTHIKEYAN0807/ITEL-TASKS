/**
 * API Route: /api/context-graph
 * Topic 06 — Context Engineering + Knowledge Graph
 *
 * Demonstrates the full Context Engineering pipeline backed by a Knowledge Graph:
 *
 *  1. Builds an in-memory Knowledge Graph (entities, relationships, triples)
 *  2. Applies Context Engineering to assemble the optimal context for the LLM
 *  3. Sends the engineered context to Ollama with tool definitions
 *  4. Executes tool calls (graph searches, traversals, inference)
 *  5. Returns grounded, source-attributed answers
 *
 * All steps are instrumented with Sentry spans so you can observe:
 *  - The context engineering pipeline in Performance → Traces
 *  - Tool call details in AI → Conversations
 *  - Any errors in Issues
 *
 * Sentry paths:
 *  - Performance → Traces → "context-engineering-pipeline"
 *  - AI → Conversations → search by conversation ID
 *  - Issues → any errors from tool execution or LLM calls
 */

import * as Sentry from "@sentry/nextjs";
import type { Span } from "@sentry/core";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createSampleGraph } from "@/lib/knowledge-graph";
import { loadGraph } from "@/lib/kg-persistence";
import { loadMemories } from "@/lib/memory-persistence";
import { ContextEngineer } from "@/lib/context-engineer";

const ollama = new OpenAI({
  baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
  apiKey: "ollama",
});

const MODEL = process.env.OLLAMA_MODEL ?? "llama3.2:1b";

type ChatMessage = OpenAI.Chat.ChatCompletionMessageParam;

export async function GET() {
  const conversationId = `conv-ctx-eng-${Date.now()}`;
  const userQuestion =
    "What technologies are used by products that Google created? Also, who is the CEO of Google and where is Google headquartered?";

  // ── Step 1: Load Knowledge Graph from persistent storage ──────────────
  const kg = loadGraph();

  // ── Step 2: Initialize Context Engineer ───────────────────────────────
  const engineer = new ContextEngineer(kg);

  // Add some memory entries (simulating past interactions)
  engineer.addMemory({
    key: "preferred_detail_level",
    value: "detailed with examples",
    source: "user",
    createdAt: Date.now() - 86400000,
  });
  engineer.addMemory({
    key: "known_background",
    value: "User is an AI engineering student",
    source: "inferred",
    createdAt: Date.now() - 3600000,
  });

  const pipelineResult: Record<string, unknown> = {};
  const toolCallLog: object[] = [];

  await Sentry.startSpan(
    {
      name: "context-engineering-pipeline",
      op: "ai.pipeline",
      attributes: {
        "session.id": conversationId,
        "user.id": "user-42",
        "feature": "context-engineering-demo",
        "llm.provider": "ollama",
        "llm.model": MODEL,
      },
    },
    async () => {
      // ── Phase 1: Build Context (Collect → Select → Structure) ───────
      let engineeredContext: ReturnType<typeof engineer.buildContext>;

      await Sentry.startSpan(
        {
          name: "context.build",
          op: "ai.context.build",
          attributes: {
            "context.phase": "build",
            "gen_ai.conversation.id": conversationId,
          },
        },
        async (span: Span | undefined) => {
          engineeredContext = engineer.buildContext(userQuestion);

          span?.setAttributes({
            "context.system_prompt_chars": engineeredContext.systemPrompt.length,
            "context.tools_count": engineeredContext.tools.length,
            "context.memory_entries": engineer.getMemory().length,
            "context.budget": JSON.stringify(engineeredContext.budget),
          });

          pipelineResult["contextBuild"] = {
            systemPromptChars: engineeredContext.systemPrompt.length,
            toolsAvailable: engineeredContext.tools.map((t) => t.name),
            memoryEntries: engineer.getMemory(),
            budget: engineeredContext.budget,
          };
        }
      );

      // ── Phase 2: Knowledge Graph Queries (Retrieved Context) ────────
      Sentry.addBreadcrumb({
        category: "ai.context",
        message: "Executing knowledge graph queries for retrieved context",
        level: "info",
      });

      const retrievedFacts: string[] = [];

      // Tool Call 1: Search for Google
      await Sentry.startSpan(
        {
          name: "tool.search_knowledge_graph",
          op: "ai.tool.call",
          attributes: {
            "tool.name": "search_knowledge_graph",
            "tool.query": "Google",
            "gen_ai.conversation.id": conversationId,
          },
        },
        async (span: Span | undefined) => {
          const result = engineer.executeTool("search_knowledge_graph", {
            query: "Google",
          });
          retrievedFacts.push(`Search results for "Google": ${result}`);
          span?.setAttributes({ "tool.result_chars": result.length });
          toolCallLog.push({
            tool: "search_knowledge_graph",
            args: { query: "Google" },
            resultPreview: result.slice(0, 200),
          });
        }
      );

      // Tool Call 2: Get Google's relationships
      await Sentry.startSpan(
        {
          name: "tool.get_entity_relationships",
          op: "ai.tool.call",
          attributes: {
            "tool.name": "get_entity_relationships",
            "tool.entity_id": "google",
            "gen_ai.conversation.id": conversationId,
          },
        },
        async (span: Span | undefined) => {
          const result = engineer.executeTool("get_entity_relationships", {
            entity_id: "google",
          });
          retrievedFacts.push(`Google's relationships: ${result}`);
          span?.setAttributes({ "tool.result_chars": result.length });
          toolCallLog.push({
            tool: "get_entity_relationships",
            args: { entity_id: "google" },
            resultPreview: result.slice(0, 200),
          });
        }
      );

      // Tool Call 3: Multi-hop traversal from Google
      await Sentry.startSpan(
        {
          name: "tool.traverse_graph",
          op: "ai.tool.call",
          attributes: {
            "tool.name": "traverse_graph",
            "tool.start_entity": "google",
            "tool.max_depth": 2,
            "gen_ai.conversation.id": conversationId,
          },
        },
        async (span: Span | undefined) => {
          const result = engineer.executeTool("traverse_graph", {
            start_entity_id: "google",
            max_depth: 2,
          });
          retrievedFacts.push(`Multi-hop traversal from Google: ${result}`);
          span?.setAttributes({ "tool.result_chars": result.length });
          toolCallLog.push({
            tool: "traverse_graph",
            args: { start_entity_id: "google", max_depth: 2 },
            resultPreview: result.slice(0, 200),
          });
        }
      );

      // Tool Call 4: Infer facts
      await Sentry.startSpan(
        {
          name: "tool.infer_facts",
          op: "ai.tool.call",
          attributes: {
            "tool.name": "infer_facts",
            "gen_ai.conversation.id": conversationId,
          },
        },
        async (span: Span | undefined) => {
          const result = engineer.executeTool("infer_facts", {});
          retrievedFacts.push(`Inferred facts: ${result}`);
          span?.setAttributes({ "tool.result_chars": result.length });
          toolCallLog.push({
            tool: "infer_facts",
            args: {},
            resultPreview: result.slice(0, 200),
          });
        }
      );

      pipelineResult["toolCalls"] = toolCallLog;

      // ── Phase 3: Generate (LLM call with full engineered context) ───
      Sentry.addBreadcrumb({
        category: "ai.turn",
        message: "Sending engineered context to LLM",
        level: "info",
      });

      await Sentry.startSpan(
        {
          name: "ai.chat",
          op: "ai.chat",
          attributes: {
            "gen_ai.system": "ollama",
            "gen_ai.request.model": MODEL,
            "gen_ai.operation.name": "context-engineered-generation",
            "gen_ai.conversation.id": conversationId,
          },
        },
        async (span: Span | undefined) => {
          // Build the final prompt with all context layers
          const messages: ChatMessage[] = [
            // Instruction context
            {
              role: "system",
              content: engineeredContext!.systemPrompt,
            },
            // Memory context
            {
              role: "system",
              content: engineeredContext!.memoryContext,
            },
            // Safety context
            {
              role: "system",
              content: engineeredContext!.safetyRules,
            },
            // Output format context
            {
              role: "system",
              content: engineeredContext!.outputFormat,
            },
            // Retrieved context (from knowledge graph tools)
            {
              role: "system",
              content: `Retrieved Context from Knowledge Graph:\n\n${retrievedFacts.join("\n\n")}`,
            },
            // Task context (user question)
            {
              role: "user",
              content: userQuestion,
            },
          ];

          span?.setAttributes({
            "gen_ai.input_messages": JSON.stringify(messages),
          });

          try {
            const completion = await ollama.chat.completions.create({
              model: MODEL,
              messages,
            });

            const response =
              completion.choices[0]?.message?.content ?? "";

            span?.setAttributes({
              "gen_ai.output_messages": JSON.stringify([
                { role: "assistant", content: response },
              ]),
              "gen_ai.usage.input_tokens":
                completion.usage?.prompt_tokens ?? 0,
              "gen_ai.usage.output_tokens":
                completion.usage?.completion_tokens ?? 0,
            });

            pipelineResult["generation"] = {
              model: MODEL,
              status: "OK",
              response: response,
              inputTokens: completion.usage?.prompt_tokens ?? 0,
              outputTokens: completion.usage?.completion_tokens ?? 0,
            };
          } catch (err) {
            span?.setAttributes({ "ai.error": String(err) });

            Sentry.captureException(err, {
              tags: {
                ai_operation: "context-engineered-generation",
                model: MODEL,
              },
              extra: {
                conversationId,
                retrievedFactsCount: retrievedFacts.length,
                toolCallCount: toolCallLog.length,
              },
            });

            pipelineResult["generation"] = {
              model: MODEL,
              status: "ERROR",
              error: String(err),
            };
          }
        }
      );

      // ── Phase 4: Graph Stats (for the response) ────────────────────
      const graphStats = JSON.parse(
        engineer.executeTool("get_graph_stats", {})
      );
      pipelineResult["knowledgeGraph"] = graphStats;
    }
  );

  return NextResponse.json({
    topic: "06 — Context Engineering + Knowledge Graph",
    description:
      "Demonstrates the full Context Engineering pipeline: Instruction, Task, Retrieved, Tool, Memory, Output, and Safety context — all backed by an in-memory Knowledge Graph with entities, relationships, triples, traversal, and inference. Fully traced with Sentry.",
    sentryPaths: {
      pipeline:
        "Performance → Traces → context-engineering-pipeline",
      toolCalls: "Performance → Traces → tool.* spans",
      conversations: "AI → Conversations → search by conversation ID",
      errors: "Issues → any captured errors",
    },
    model: MODEL,
    conversationId,
    userQuestion,
    contextEngineeringConcepts: {
      "1_instruction_context":
        "System prompt with role, rules, and constraints",
      "2_task_context": "The user's question",
      "3_retrieved_context":
        "Facts retrieved from the Knowledge Graph via tools",
      "4_tool_context":
        "5 tool definitions (search, relationships, traverse, infer, stats)",
      "5_memory_context": "Simulated user preferences from past sessions",
      "6_output_context": "Structured output format requirements",
      "7_safety_context":
        "Read-only access, no hallucination, prompt injection defense",
    },
    knowledgeGraphConcepts: {
      "1_entities": "People, Companies, Products, Technologies, Locations",
      "2_relationships":
        "CEO_OF, FOUNDED, WORKS_AT, CREATED, USES_TECH, INVESTED_IN, etc.",
      "3_triples": "(Subject) --[Predicate]--> (Object)",
      "4_traversal": "Multi-hop BFS to discover indirect connections",
      "5_inference":
        "Rule-based reasoning (e.g. works_at + headquartered_in = based_in)",
      "6_subgraphs": "Extractable focused views of the graph",
    },
    pipeline: pipelineResult,
  });
}

// ─── POST: Interactive query from the Visual UI ─────────────────────────────

export async function POST(request: Request) {
  const body = await request.json();
  const userQuestion: string =
    body.question ??
    "What technologies are used by products that Google created?";
  // Short-term memory: conversation history from the frontend
  const conversationHistory: Array<{ role: string; content: string }> =
    body.conversationHistory ?? [];

  const conversationId = `conv-ctx-eng-${Date.now()}`;

  const kg = loadGraph();
  const engineer = new ContextEngineer(kg);

  // Load REAL long-term memory from disk
  const longTermMemories = loadMemories();
  for (const mem of longTermMemories) {
    engineer.addMemory({
      key: mem.key,
      value: mem.value,
      source: mem.source,
      createdAt: mem.createdAt,
    });
  }

  const pipelineResult: Record<string, unknown> = {};
  const toolCallLog: Array<{
    tool: string;
    args: Record<string, unknown>;
    result: unknown;
    durationMs: number;
  }> = [];

  // ── Extract entity keywords from the question for smart search ────────
  const entityKeywords = extractEntities(userQuestion, kg);

  await Sentry.startSpan(
    {
      name: "context-engineering-pipeline",
      op: "ai.pipeline",
      attributes: {
        "session.id": conversationId,
        "user.id": "user-42",
        "feature": "context-engineering-ui",
        "llm.provider": "ollama",
        "llm.model": MODEL,
      },
    },
    async () => {
      // ── Phase 1: Build Context ──────────────────────────────────────
      let engineeredContext: ReturnType<typeof engineer.buildContext>;

      await Sentry.startSpan(
        {
          name: "context.build",
          op: "ai.context.build",
          attributes: {
            "context.phase": "build",
            "gen_ai.conversation.id": conversationId,
          },
        },
        async (span: Span | undefined) => {
          engineeredContext = engineer.buildContext(userQuestion);
          span?.setAttributes({
            "context.system_prompt_chars":
              engineeredContext.systemPrompt.length,
            "context.tools_count": engineeredContext.tools.length,
            "context.memory_entries": engineer.getMemory().length,
          });
          pipelineResult["contextBuild"] = {
            systemPromptChars: engineeredContext.systemPrompt.length,
            toolsAvailable: engineeredContext.tools.map((t) => t.name),
            memoryEntries: engineer.getMemory(),
            budget: engineeredContext.budget,
          };
        }
      );

      // ── Phase 2: Knowledge Graph Tool Calls ─────────────────────────
      const retrievedFacts: string[] = [];

      // Search for each detected entity
      for (const keyword of entityKeywords) {
        const t0 = Date.now();
        await Sentry.startSpan(
          {
            name: `tool.search_knowledge_graph`,
            op: "ai.tool.call",
            attributes: {
              "tool.name": "search_knowledge_graph",
              "tool.query": keyword,
              "gen_ai.conversation.id": conversationId,
            },
          },
          async (span: Span | undefined) => {
            const result = engineer.executeTool(
              "search_knowledge_graph",
              { query: keyword }
            );
            const parsed = JSON.parse(result);
            retrievedFacts.push(
              `Search results for "${keyword}": ${result}`
            );
            span?.setAttributes({ "tool.result_chars": result.length });
            toolCallLog.push({
              tool: "search_knowledge_graph",
              args: { query: keyword },
              result: parsed,
              durationMs: Date.now() - t0,
            });
          }
        );

        // If search found entities, get their relationships
        const searchResult = JSON.parse(
          engineer.executeTool("search_knowledge_graph", {
            query: keyword,
          })
        );
        if (searchResult.results?.length > 0) {
          const entityId = searchResult.results[0].id;
          const t1 = Date.now();
          await Sentry.startSpan(
            {
              name: `tool.get_entity_relationships`,
              op: "ai.tool.call",
              attributes: {
                "tool.name": "get_entity_relationships",
                "tool.entity_id": entityId,
                "gen_ai.conversation.id": conversationId,
              },
            },
            async (span: Span | undefined) => {
              const result = engineer.executeTool(
                "get_entity_relationships",
                { entity_id: entityId }
              );
              const parsed = JSON.parse(result);
              retrievedFacts.push(
                `Relationships for ${keyword}: ${result}`
              );
              span?.setAttributes({
                "tool.result_chars": result.length,
              });
              toolCallLog.push({
                tool: "get_entity_relationships",
                args: { entity_id: entityId },
                result: parsed,
                durationMs: Date.now() - t1,
              });
            }
          );

          // Multi-hop traversal
          const t2 = Date.now();
          await Sentry.startSpan(
            {
              name: `tool.traverse_graph`,
              op: "ai.tool.call",
              attributes: {
                "tool.name": "traverse_graph",
                "tool.start_entity": entityId,
                "gen_ai.conversation.id": conversationId,
              },
            },
            async (span: Span | undefined) => {
              const result = engineer.executeTool("traverse_graph", {
                start_entity_id: entityId,
                max_depth: 2,
              });
              const parsed = JSON.parse(result);
              retrievedFacts.push(
                `Traversal from ${keyword}: ${result}`
              );
              span?.setAttributes({
                "tool.result_chars": result.length,
              });
              toolCallLog.push({
                tool: "traverse_graph",
                args: { start_entity_id: entityId, max_depth: 2 },
                result: parsed,
                durationMs: Date.now() - t2,
              });
            }
          );
        }
      }

      // Infer facts
      const t3 = Date.now();
      await Sentry.startSpan(
        {
          name: "tool.infer_facts",
          op: "ai.tool.call",
          attributes: {
            "tool.name": "infer_facts",
            "gen_ai.conversation.id": conversationId,
          },
        },
        async (span: Span | undefined) => {
          const result = engineer.executeTool("infer_facts", {});
          const parsed = JSON.parse(result);
          retrievedFacts.push(`Inferred facts: ${result}`);
          span?.setAttributes({ "tool.result_chars": result.length });
          toolCallLog.push({
            tool: "infer_facts",
            args: {},
            result: parsed,
            durationMs: Date.now() - t3,
          });
        }
      );

      pipelineResult["toolCalls"] = toolCallLog;

      // ── Phase 3: LLM Generation ─────────────────────────────────────
      await Sentry.startSpan(
        {
          name: "ai.chat",
          op: "ai.chat",
          attributes: {
            "gen_ai.system": "ollama",
            "gen_ai.request.model": MODEL,
            "gen_ai.operation.name": "context-engineered-generation",
            "gen_ai.conversation.id": conversationId,
          },
        },
        async (span: Span | undefined) => {
          const messages: ChatMessage[] = [
            { role: "system", content: engineeredContext!.systemPrompt },
            { role: "system", content: engineeredContext!.memoryContext },
            { role: "system", content: engineeredContext!.safetyRules },
            {
              role: "system",
              content: engineeredContext!.outputFormat,
            },
            {
              role: "system",
              content: `Retrieved Context from Knowledge Graph:\n\n${retrievedFacts.join("\n\n")}`,
            },
            // Short-term memory: build a numbered conversation summary
            // so the model can clearly track message order
            ...(conversationHistory.length > 0
              ? [
                  {
                    role: "system" as const,
                    content: `Conversation History (${conversationHistory.length} messages, numbered in order):\n${conversationHistory.map((msg, i) => `[${i + 1}] ${msg.role.toUpperCase()}: ${msg.content.slice(0, 300)}`).join("\n")}\n\nThe MOST RECENT user question was message #${conversationHistory.filter(m => m.role === "user").length} from the user.`,
                  },
                ]
              : []),
            // Current question
            { role: "user", content: userQuestion },
          ];

          span?.setAttributes({
            "gen_ai.input_messages": JSON.stringify(messages),
          });

          try {
            const completion = await ollama.chat.completions.create({
              model: MODEL,
              messages,
            });
            const response =
              completion.choices[0]?.message?.content ?? "";

            span?.setAttributes({
              "gen_ai.output_messages": JSON.stringify([
                { role: "assistant", content: response },
              ]),
              "gen_ai.usage.input_tokens":
                completion.usage?.prompt_tokens ?? 0,
              "gen_ai.usage.output_tokens":
                completion.usage?.completion_tokens ?? 0,
            });

            pipelineResult["generation"] = {
              model: MODEL,
              status: "OK",
              response,
              inputTokens: completion.usage?.prompt_tokens ?? 0,
              outputTokens: completion.usage?.completion_tokens ?? 0,
            };
          } catch (err) {
            span?.setAttributes({ "ai.error": String(err) });
            Sentry.captureException(err, {
              tags: {
                ai_operation: "context-engineered-generation",
                model: MODEL,
              },
            });
            pipelineResult["generation"] = {
              model: MODEL,
              status: "ERROR",
              error: String(err),
            };
          }
        }
      );

      // Graph stats
      pipelineResult["knowledgeGraph"] = JSON.parse(
        engineer.executeTool("get_graph_stats", {})
      );
    }
  );

  return NextResponse.json({
    conversationId,
    userQuestion,
    model: MODEL,
    pipeline: pipelineResult,
  });
}

// ─── Helper: Extract entity keywords from a natural language question ────────

function extractEntities(
  question: string,
  kg: ReturnType<typeof createSampleGraph>
): string[] {
  // Simple keyword extraction: check which known entity names appear in the question
  const q = question.toLowerCase();
  const knownNames: string[] = [];

  // Check all entity types for matches
  for (const type of ["Person", "Company", "Product", "Technology", "Location"]) {
    for (const entity of kg.getEntitiesByType(type)) {
      const name = String(entity.properties.name ?? "").toLowerCase();
      if (name && q.includes(name.toLowerCase())) {
        knownNames.push(String(entity.properties.name));
      }
    }
  }

  // If no known entities found, try splitting the question into meaningful words
  if (knownNames.length === 0) {
    const stopWords = new Set([
      "what", "who", "where", "when", "how", "is", "are", "the", "a", "an",
      "of", "in", "and", "or", "by", "for", "to", "from", "with", "that",
      "this", "does", "did", "do", "was", "were", "has", "have", "had",
      "be", "been", "being", "also", "which", "their", "its", "can",
      "could", "would", "should", "will", "used", "using", "uses",
      "created", "founded", "headquartered", "technologies", "products",
      "companies", "people", "tell", "me", "about", "list", "find",
      "show", "get", "all", "any", "between", "connections", "connected",
    ]);
    const words = question
      .replace(/[?.,!;:'"]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w.toLowerCase()));
    // Take up to 3 candidate keywords
    return words.slice(0, 3);
  }

  return knownNames;
}
