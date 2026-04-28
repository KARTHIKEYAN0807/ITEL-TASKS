"use client";

import { useState, useEffect, useCallback } from "react";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface Entity {
  id: string;
  type: string;
  labels: string[];
  properties: Record<string, string | number | boolean>;
}

interface Relationship {
  from: string;
  to: string;
  type: string;
  properties: Record<string, string | number | boolean>;
}

interface GraphData {
  entities: Entity[];
  relationships: Relationship[];
  stats: { entityCount: number; relationshipCount: number; entityTypes: string[]; relationshipTypes: string[] };
}

interface ToolCall {
  tool: string;
  args: Record<string, unknown>;
  result: unknown;
  durationMs: number;
}

interface PipelineResult {
  conversationId: string;
  userQuestion: string;
  model: string;
  pipeline: {
    contextBuild?: {
      systemPromptChars: number;
      toolsAvailable: string[];
      memoryEntries: Array<{ key: string; value: string; source: string }>;
      budget: { used: Record<string, number>; limit: Record<string, number> };
    };
    toolCalls?: ToolCall[];
    generation?: { model: string; status: string; response?: string; error?: string; inputTokens?: number; outputTokens?: number };
    knowledgeGraph?: { entityCount: number; relationshipCount: number; entityTypes: string[]; relationshipTypes: string[] };
  };
}

type Tab = "query" | "graph";
type PipelinePhase = "idle" | "building" | "querying" | "generating" | "done" | "error";

const ENTITY_TYPES = ["Person", "Company", "Product", "Technology", "Location", "Other"];

const SUGGESTIONS = [
  "Who is the CEO of Google?",
  "What technologies does GPT-4 use?",
  "Who founded NVIDIA?",
  "What companies has Microsoft invested in?",
  "Tell me about DeepMind",
  "What is the connection between OpenAI and Microsoft?",
];

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const card = { background: "#1e1e2e", borderRadius: 12, border: "1px solid #334155", padding: 24 };
const inputStyle = { padding: "10px 14px", fontSize: 13, borderRadius: 8, border: "1px solid #334155", background: "#0d0d12", color: "#e2e8f0", outline: "none", fontFamily: "inherit", width: "100%" };
const btnPrimary = { padding: "10px 20px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #3b82f6, #6366f1)", color: "#fff", fontFamily: "inherit" };
const btnDanger = { padding: "4px 10px", fontSize: 11, borderRadius: 6, border: "1px solid #7f1d1d", background: "#2d1215", color: "#fca5a5", cursor: "pointer", fontFamily: "inherit" };
const badge = (bg: string, fg: string) => ({ fontSize: 11, padding: "3px 10px", background: bg, color: fg, borderRadius: 20, fontWeight: 600 as const, display: "inline-block" });

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function ContextGraphUI() {
  const [tab, setTab] = useState<Tab>("query");
  const [graph, setGraph] = useState<GraphData | null>(null);

  // Query state
  const [question, setQuestion] = useState("");
  const [phase, setPhase] = useState<PipelinePhase>("idle");
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [expandedTools, setExpandedTools] = useState<Set<number>>(new Set());
  const [errorMsg, setErrorMsg] = useState("");

  // Add entity form
  const [newEntityId, setNewEntityId] = useState("");
  const [newEntityType, setNewEntityType] = useState("Person");
  const [newEntityName, setNewEntityName] = useState("");
  const [newEntityLabels, setNewEntityLabels] = useState("");

  // Add relationship form
  const [relFrom, setRelFrom] = useState("");
  const [relTo, setRelTo] = useState("");
  const [relType, setRelType] = useState("");

  const fetchGraph = useCallback(async () => {
    try {
      const res = await fetch("/api/context-graph/manage");
      if (res.ok) setGraph(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchGraph(); }, [fetchGraph]);

  async function addEntity() {
    if (!newEntityId.trim() || !newEntityName.trim()) return;
    await fetch("/api/context-graph/manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add_entity",
        id: newEntityId.trim(),
        type: newEntityType,
        labels: newEntityLabels ? newEntityLabels.split(",").map((s) => s.trim()) : [],
        properties: { name: newEntityName.trim() },
      }),
    });
    setNewEntityId("");
    setNewEntityName("");
    setNewEntityLabels("");
    fetchGraph();
  }

  async function addRelationship() {
    if (!relFrom || !relTo || !relType.trim()) return;
    await fetch("/api/context-graph/manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_relationship", from: relFrom, to: relTo, type: relType.trim() }),
    });
    setRelType("");
    fetchGraph();
  }

  async function removeEntity(id: string) {
    await fetch("/api/context-graph/manage", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove_entity", id }),
    });
    fetchGraph();
  }

  async function removeRelationship(from: string, to: string, type: string) {
    await fetch("/api/context-graph/manage", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove_relationship", from, to, type }),
    });
    fetchGraph();
  }

  async function resetToDefault() {
    await fetch("/api/context-graph/manage", { method: "PUT" });
    fetchGraph();
  }

  async function runPipeline(q?: string) {
    const finalQ = q ?? question;
    if (!finalQ.trim()) return;
    setQuestion(finalQ);
    setResult(null);
    setExpandedTools(new Set());
    setErrorMsg("");

    try {
      setPhase("building");
      await delay(400);
      setPhase("querying");
      await delay(400);
      setPhase("generating");

      const res = await fetch("/api/context-graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: finalQ }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
      }
      const data: PipelineResult = await res.json();
      setResult(data);
      setPhase("done");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Pipeline error:", msg);
      setErrorMsg(msg);
      setPhase("error");
    }
  }

  function toggleTool(i: number) {
    setExpandedTools((prev) => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
  }

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{ marginBottom: 24 }}>
        <a href="/" style={{ color: "#64748b", fontSize: 13, textDecoration: "none" }}>← Back to Topics</a>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
          <span style={{ fontSize: 36 }}>🧠</span>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#f8fafc" }}>Context Engineering + Knowledge Graph</h1>
        </div>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: "#94a3b8", lineHeight: 1.6 }}>
          Build your own Knowledge Graph, then query it using Context Engineering. Data is persisted to disk.
        </p>
      </header>

      {/* Tab Buttons */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["query", "graph"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "10px 24px", fontSize: 14, fontWeight: 600, borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit",
            background: tab === t ? "linear-gradient(135deg, #3b82f6, #6366f1)" : "#1e1e2e",
            color: tab === t ? "#fff" : "#94a3b8",
          }}>
            {t === "query" ? "🔍 Query Pipeline" : "🗂️ Knowledge Graph Builder"}
          </button>
        ))}
        {graph && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "#64748b" }}>
            <span>{graph.stats.entityCount} entities</span>
            <span>{graph.stats.relationshipCount} relationships</span>
          </div>
        )}
      </div>

      {/* ═══════════════ QUERY TAB ═══════════════ */}
      {tab === "query" && (
        <>
          {/* Pipeline Status Bar */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {(["building", "querying", "generating", "done"] as PipelinePhase[]).map((p, i) => {
              const labels = ["Build Context", "Query KG", "LLM Generation", "Complete"];
              const icons = ["📋", "🔍", "⚡", "✅"];
              const isActive = phase === p;
              const phaseOrder = ["building", "querying", "generating", "done"];
              const isPast = (phaseOrder.indexOf(phase) > i) || (phase === "done");
              return (
                <div key={p} style={{
                  flex: 1, minWidth: 120, padding: "10px 14px", borderRadius: 10,
                  background: isActive ? "linear-gradient(135deg, #1e3a5f, #1e2d4a)" : isPast ? "#0f2d21" : "#1e1e2e",
                  border: `1px solid ${isActive ? "#3b82f6" : isPast ? "#22c55e44" : "#334155"}`,
                  transition: "all 0.3s ease",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14 }}>{isPast && !isActive ? "✅" : icons[i]}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: isActive ? "#7dd3fc" : isPast ? "#4ade80" : "#64748b" }}>
                      {labels[i]}
                    </span>
                  </div>
                  {isActive && <div style={{ width: "100%", height: 3, background: "#1e293b", borderRadius: 2, marginTop: 6, overflow: "hidden" }}>
                    <div style={{ width: "60%", height: "100%", background: "#3b82f6", borderRadius: 2, animation: "pulse 1.5s infinite" }} />
                  </div>}
                </div>
              );
            })}
          </div>

          {/* Input */}
          <div style={{ ...card, marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 10 }}>
              <input value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runPipeline()}
                placeholder="Ask a question about your Knowledge Graph..."
                disabled={phase !== "idle" && phase !== "done" && phase !== "error"}
                style={{ ...inputStyle, flex: 1 }} />
              <button onClick={() => runPipeline()}
                disabled={phase !== "idle" && phase !== "done" && phase !== "error"}
                style={{ ...btnPrimary, opacity: (phase !== "idle" && phase !== "done" && phase !== "error") ? 0.5 : 1 }}>
                {phase === "idle" || phase === "done" || phase === "error" ? "🚀 Run" : "⏳ ..."}
              </button>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => runPipeline(s)} style={{
                  padding: "5px 10px", fontSize: 11, borderRadius: 16, border: "1px solid #334155",
                  background: "#0d0d12", color: "#94a3b8", cursor: "pointer", fontFamily: "inherit",
                }}>{s}</button>
              ))}
            </div>
          </div>

          {phase === "error" && (
            <div style={{ padding: 16, background: "#2d1215", border: "1px solid #7f1d1d", borderRadius: 10, color: "#fca5a5", marginBottom: 20 }}>
              <strong>❌ Pipeline failed.</strong>
              <p style={{ margin: "8px 0 0", fontSize: 13 }}>{errorMsg || "Make sure Ollama is running."}</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div style={{ display: "grid", gap: 16 }}>
              {/* AI Response */}
              <section style={card}>
                <h2 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>💬 AI Response</h2>
                <div style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.8, whiteSpace: "pre-wrap", background: "#0d0d12", padding: 16, borderRadius: 8 }}>
                  {result.pipeline.generation?.response ?? result.pipeline.generation?.error ?? "No response"}
                </div>
                {result.pipeline.generation?.inputTokens != null && (
                  <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 12, color: "#64748b" }}>
                    <span>📥 {result.pipeline.generation.inputTokens} in</span>
                    <span>📤 {result.pipeline.generation.outputTokens} out</span>
                    <span>🤖 {result.model}</span>
                  </div>
                )}
              </section>

              {/* Tool Calls */}
              {result.pipeline.toolCalls && result.pipeline.toolCalls.length > 0 && (
                <section style={card}>
                  <h2 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>
                    🔧 Tool Calls ({result.pipeline.toolCalls.length})
                  </h2>
                  <div style={{ display: "grid", gap: 8 }}>
                    {result.pipeline.toolCalls.map((tc, i) => (
                      <div key={i} style={{ background: "#0d0d12", borderRadius: 8, border: "1px solid #1e293b", overflow: "hidden" }}>
                        <button onClick={() => toggleTool(i)} style={{
                          width: "100%", padding: "10px 14px", background: "transparent", border: "none",
                          cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#e2e8f0", fontFamily: "inherit", textAlign: "left",
                        }}>
                          <span style={{ fontSize: 12 }}>{expandedTools.has(i) ? "▼" : "▶"}</span>
                          <code style={{ fontSize: 12, color: "#34d399", fontWeight: 600 }}>{tc.tool}</code>
                          <code style={{ fontSize: 11, color: "#64748b" }}>{JSON.stringify(tc.args)}</code>
                          <span style={{ marginLeft: "auto", fontSize: 11, color: "#64748b" }}>{tc.durationMs}ms</span>
                        </button>
                        {expandedTools.has(i) && (
                          <pre style={{ margin: 0, padding: "0 14px 10px", fontSize: 11, color: "#94a3b8", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 250, overflow: "auto" }}>
                            {JSON.stringify(tc.result, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Context Budget */}
              {result.pipeline.contextBuild && (
                <section style={card}>
                  <h2 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>📊 Context Budget</h2>
                  <div style={{ display: "grid", gap: 8 }}>
                    {Object.keys(result.pipeline.contextBuild.budget.used).map((key) => {
                      const used = result.pipeline.contextBuild!.budget.used[key];
                      const limit = result.pipeline.contextBuild!.budget.limit[key];
                      const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
                      return (
                        <div key={key}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginBottom: 3 }}>
                            <span>{key.replace(/([A-Z])/g, " $1").trim()}</span>
                            <span>{used}/{limit}</span>
                          </div>
                          <div style={{ height: 5, background: "#1e293b", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#22c55e", transition: "width 0.5s" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          )}
        </>
      )}

      {/* ═══════════════ GRAPH BUILDER TAB ═══════════════ */}
      {tab === "graph" && (
        <div style={{ display: "grid", gap: 16 }}>
          {/* Add Entity Form */}
          <section style={card}>
            <h2 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>➕ Add Entity</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
              <div>
                <label style={{ fontSize: 11, color: "#94a3b8", display: "block", marginBottom: 4 }}>Name *</label>
                <input value={newEntityName} onChange={(e) => {
                  setNewEntityName(e.target.value);
                  setNewEntityId(e.target.value.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""));
                }} placeholder="e.g. Elon Musk" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#94a3b8", display: "block", marginBottom: 4 }}>Type *</label>
                <select value={newEntityType} onChange={(e) => setNewEntityType(e.target.value)}
                  style={{ ...inputStyle, cursor: "pointer" }}>
                  {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#94a3b8", display: "block", marginBottom: 4 }}>Labels (comma-separated)</label>
                <input value={newEntityLabels} onChange={(e) => setNewEntityLabels(e.target.value)} placeholder="e.g. CEO, Founder" style={inputStyle} />
              </div>
              <button onClick={addEntity} style={btnPrimary}>Add</button>
            </div>
            {newEntityId && <p style={{ margin: "8px 0 0", fontSize: 11, color: "#475569" }}>ID: {newEntityId}</p>}
          </section>

          {/* Add Relationship Form */}
          <section style={card}>
            <h2 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>🔗 Add Relationship</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto auto", gap: 10, alignItems: "end" }}>
              <div>
                <label style={{ fontSize: 11, color: "#94a3b8", display: "block", marginBottom: 4 }}>From Entity</label>
                <select value={relFrom} onChange={(e) => setRelFrom(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="">Select...</option>
                  {graph?.entities.map((e) => <option key={e.id} value={e.id}>{String(e.properties.name || e.id)}</option>)}
                </select>
              </div>
              <span style={{ color: "#64748b", fontSize: 18, paddingBottom: 8 }}>→</span>
              <div>
                <label style={{ fontSize: 11, color: "#94a3b8", display: "block", marginBottom: 4 }}>To Entity</label>
                <select value={relTo} onChange={(e) => setRelTo(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="">Select...</option>
                  {graph?.entities.map((e) => <option key={e.id} value={e.id}>{String(e.properties.name || e.id)}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#94a3b8", display: "block", marginBottom: 4 }}>Relationship Type</label>
                <input value={relType} onChange={(e) => setRelType(e.target.value)} placeholder="e.g. CEO_OF" style={inputStyle} />
              </div>
              <button onClick={addRelationship} style={btnPrimary}>Add</button>
            </div>
          </section>

          {/* Reset Button */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={resetToDefault} style={{ ...btnDanger, padding: "8px 16px", fontSize: 12 }}>
              🔄 Reset Graph to Default
            </button>
          </div>

          {/* Entities Table */}
          <section style={card}>
            <h2 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>
              📦 Entities ({graph?.entities.length ?? 0})
            </h2>
            <div style={{ display: "grid", gap: 6, maxHeight: 400, overflow: "auto" }}>
              {graph?.entities.map((e) => (
                <div key={e.id} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                  background: "#0d0d12", borderRadius: 8, border: "1px solid #1e293b",
                }}>
                  <span style={badge("#1e3a5f", "#7dd3fc")}>{e.type}</span>
                  <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>{String(e.properties.name || e.id)}</span>
                  <span style={{ fontSize: 11, color: "#475569" }}>({e.id})</span>
                  {e.labels.map((l) => <span key={l} style={badge("#2d1b4e", "#c4b5fd")}>{l}</span>)}
                  <button onClick={() => removeEntity(e.id)} style={{ ...btnDanger, marginLeft: "auto" }}>✕</button>
                </div>
              ))}
            </div>
          </section>

          {/* Relationships Table */}
          <section style={card}>
            <h2 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>
              🔗 Relationships ({graph?.relationships.length ?? 0})
            </h2>
            <div style={{ display: "grid", gap: 6, maxHeight: 400, overflow: "auto" }}>
              {graph?.relationships.map((r, i) => {
                const fromName = graph.entities.find((e) => e.id === r.from)?.properties.name ?? r.from;
                const toName = graph.entities.find((e) => e.id === r.to)?.properties.name ?? r.to;
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                    background: "#0d0d12", borderRadius: 8, border: "1px solid #1e293b", fontSize: 13,
                  }}>
                    <span style={{ color: "#e2e8f0" }}>{String(fromName)}</span>
                    <span style={badge("#1e3a5f", "#7dd3fc")}>{r.type}</span>
                    <span style={{ color: "#e2e8f0" }}>{String(toName)}</span>
                    <button onClick={() => removeRelationship(r.from, r.to, r.type)} style={{ ...btnDanger, marginLeft: "auto" }}>✕</button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </main>
  );
}

function delay(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
