"use client";
import { useState, useEffect, useCallback, useRef } from "react";

// Types
interface Entity { id: string; type: string; labels: string[]; properties: Record<string, string | number | boolean>; }
interface Rel { from: string; to: string; type: string; properties: Record<string, string | number | boolean>; }
interface GraphData { entities: Entity[]; relationships: Rel[]; stats: { entityCount: number; relationshipCount: number; entityTypes: string[]; relationshipTypes: string[] }; }
interface Memory { key: string; value: string; source: string; category: string; createdAt: number; accessCount: number; }
interface ToolCall { tool: string; args: Record<string, unknown>; result: unknown; durationMs: number; }
interface ChatMsg { role: "user" | "assistant"; content: string; toolCalls?: ToolCall[]; budget?: Record<string, unknown>; }

type Tab = "chat" | "graph" | "memory";
const ENTITY_TYPES = ["Person", "Company", "Product", "Technology", "Location"];
const SUGGESTIONS = ["Who is the CEO of Google?", "What technologies does GPT-4 use?", "Who founded NVIDIA?", "Tell me about DeepMind", "What companies has Microsoft invested in?"];

// Styles
const S = {
  card: { background: "#1e1e2e", borderRadius: 12, border: "1px solid #334155", padding: 20 } as React.CSSProperties,
  input: { padding: "10px 14px", fontSize: 13, borderRadius: 8, border: "1px solid #334155", background: "#0d0d12", color: "#e2e8f0", outline: "none", fontFamily: "inherit", width: "100%" } as React.CSSProperties,
  btn: { padding: "10px 20px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff", fontFamily: "inherit" } as React.CSSProperties,
  btnDel: { padding: "4px 10px", fontSize: 11, borderRadius: 6, border: "1px solid #7f1d1d", background: "#2d1215", color: "#fca5a5", cursor: "pointer", fontFamily: "inherit" } as React.CSSProperties,
  badge: (bg: string, fg: string) => ({ fontSize: 11, padding: "3px 10px", background: bg, color: fg, borderRadius: 20, fontWeight: 600, display: "inline-block" }) as React.CSSProperties,
};

export default function ContextGraphUI() {
  const [tab, setTab] = useState<Tab>("chat");
  const [graph, setGraph] = useState<GraphData | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Graph builder state
  const [eName, setEName] = useState(""); const [eType, setEType] = useState("Person"); const [eLabels, setELabels] = useState("");
  const [rFrom, setRFrom] = useState(""); const [rTo, setRTo] = useState(""); const [rType, setRType] = useState("");
  // Memory form
  const [mKey, setMKey] = useState(""); const [mVal, setMVal] = useState(""); const [mCat, setMCat] = useState("preference");

  const fetchGraph = useCallback(async () => { try { const r = await fetch("/api/context-graph/manage"); if (r.ok) setGraph(await r.json()); } catch {} }, []);
  const fetchMemories = useCallback(async () => { try { const r = await fetch("/api/context-graph/memory"); if (r.ok) { const d = await r.json(); setMemories(d.memories); } } catch {} }, []);

  useEffect(() => { fetchGraph(); fetchMemories(); }, [fetchGraph, fetchMemories]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);

  async function sendMessage(q?: string) {
    const msg = q ?? question;
    if (!msg.trim() || loading) return;
    setQuestion("");
    setError("");

    const userMsg: ChatMsg = { role: "user", content: msg };
    setChatHistory((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/context-graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: msg,
          conversationHistory: chatHistory.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const assistantMsg: ChatMsg = {
        role: "assistant",
        content: data.pipeline?.generation?.response ?? data.pipeline?.generation?.error ?? "No response",
        toolCalls: data.pipeline?.toolCalls,
        budget: data.pipeline?.contextBuild?.budget,
      };
      setChatHistory((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : String(err);
      setError(m);
    } finally {
      setLoading(false);
    }
  }

  async function addEntity() {
    if (!eName.trim()) return;
    const id = eName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    await fetch("/api/context-graph/manage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "add_entity", id, type: eType, labels: eLabels ? eLabels.split(",").map(s => s.trim()) : [], properties: { name: eName.trim() } }) });
    setEName(""); setELabels(""); fetchGraph();
  }
  async function addRel() {
    if (!rFrom || !rTo || !rType.trim()) return;
    await fetch("/api/context-graph/manage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "add_relationship", from: rFrom, to: rTo, type: rType.trim() }) });
    setRType(""); fetchGraph();
  }
  async function delEntity(id: string) { await fetch("/api/context-graph/manage", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "remove_entity", id }) }); fetchGraph(); }
  async function delRel(f: string, t: string, tp: string) { await fetch("/api/context-graph/manage", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "remove_relationship", from: f, to: t, type: tp }) }); fetchGraph(); }
  async function resetGraph() { await fetch("/api/context-graph/manage", { method: "PUT" }); fetchGraph(); }

  async function addMem() {
    if (!mKey.trim() || !mVal.trim()) return;
    await fetch("/api/context-graph/memory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: mKey.trim(), value: mVal.trim(), source: "user", category: mCat }) });
    setMKey(""); setMVal(""); fetchMemories();
  }
  async function delMem(key: string) { await fetch("/api/context-graph/memory", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key }) }); fetchMemories(); }
  async function clearMem() { await fetch("/api/context-graph/memory", { method: "PUT" }); fetchMemories(); }

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      <header style={{ marginBottom: 20 }}>
        <a href="/" style={{ color: "#64748b", fontSize: 13, textDecoration: "none" }}>← Back</a>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
          <span style={{ fontSize: 32 }}>🧠</span>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#f8fafc" }}>Context Engineering + Knowledge Graph</h1>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {([["chat", "💬 Chat"], ["graph", "🗂️ Knowledge Graph"], ["memory", "🧠 Memory"]] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{ ...S.btn, background: tab === t ? "linear-gradient(135deg,#3b82f6,#6366f1)" : "#1e1e2e", color: tab === t ? "#fff" : "#94a3b8" }}>{label}</button>
        ))}
        {graph && <span style={{ marginLeft: "auto", fontSize: 12, color: "#64748b" }}>{graph.stats.entityCount} entities · {graph.stats.relationshipCount} rels · {memories.length} memories</span>}
      </div>

      {/* ══ CHAT TAB ══ */}
      {tab === "chat" && (
        <div style={{ display: "grid", gap: 12 }}>
          {/* Chat Messages */}
          <div style={{ ...S.card, minHeight: 300, maxHeight: 500, overflow: "auto" }}>
            {chatHistory.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: "#475569" }}>
                <p style={{ fontSize: 16, margin: "0 0 12px" }}>Ask a question about the Knowledge Graph</p>
                <p style={{ fontSize: 12, margin: 0 }}>Short-term memory: conversation is remembered within this session.<br />Long-term memory: add persistent facts in the Memory tab.</p>
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
                <div style={{
                  maxWidth: "80%", padding: "10px 14px", borderRadius: 12, fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap",
                  background: msg.role === "user" ? "linear-gradient(135deg,#3b82f6,#6366f1)" : "#0d0d12",
                  color: msg.role === "user" ? "#fff" : "#cbd5e1",
                  border: msg.role === "user" ? "none" : "1px solid #1e293b",
                }}>
                  {msg.content}
                  {/* Tool calls badge */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {msg.toolCalls.map((tc, j) => (
                        <span key={j} style={S.badge("#1e3a5f", "#7dd3fc")}>{tc.tool} ({tc.durationMs}ms)</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10 }}>
                <div style={{ padding: "10px 14px", borderRadius: 12, background: "#0d0d12", border: "1px solid #1e293b", color: "#64748b", fontSize: 13 }}>
                  ⏳ Building context → Querying graph → Generating...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {error && <div style={{ padding: 12, background: "#2d1215", border: "1px solid #7f1d1d", borderRadius: 8, color: "#fca5a5", fontSize: 13 }}>❌ {error}</div>}

          {/* Input */}
          <div style={{ display: "flex", gap: 8 }}>
            <input value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask a question..." disabled={loading} style={{ ...S.input, flex: 1 }} />
            <button onClick={() => sendMessage()} disabled={loading} style={{ ...S.btn, opacity: loading ? 0.5 : 1 }}>Send</button>
            <button onClick={() => setChatHistory([])} style={{ ...S.btnDel, padding: "10px 14px" }}>Clear</button>
          </div>

          {/* Suggestions */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => sendMessage(s)} style={{ padding: "5px 10px", fontSize: 11, borderRadius: 16, border: "1px solid #334155", background: "#0d0d12", color: "#94a3b8", cursor: "pointer", fontFamily: "inherit" }}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {/* ══ GRAPH TAB ══ */}
      {tab === "graph" && (
        <div style={{ display: "grid", gap: 12 }}>
          <section style={S.card}>
            <h2 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>➕ Add Entity</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input value={eName} onChange={(e) => setEName(e.target.value)} placeholder="Name" style={{ ...S.input, flex: 2, minWidth: 150 }} />
              <select value={eType} onChange={(e) => setEType(e.target.value)} style={{ ...S.input, flex: 1, minWidth: 100, cursor: "pointer" }}>
                {ENTITY_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
              <input value={eLabels} onChange={(e) => setELabels(e.target.value)} placeholder="Labels (comma)" style={{ ...S.input, flex: 2, minWidth: 150 }} />
              <button onClick={addEntity} style={S.btn}>Add</button>
            </div>
          </section>

          <section style={S.card}>
            <h2 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>🔗 Add Relationship</h2>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <select value={rFrom} onChange={(e) => setRFrom(e.target.value)} style={{ ...S.input, flex: 1, minWidth: 120, cursor: "pointer" }}>
                <option value="">From...</option>
                {graph?.entities.map((e) => <option key={e.id} value={e.id}>{String(e.properties.name || e.id)}</option>)}
              </select>
              <span style={{ color: "#64748b" }}>→</span>
              <select value={rTo} onChange={(e) => setRTo(e.target.value)} style={{ ...S.input, flex: 1, minWidth: 120, cursor: "pointer" }}>
                <option value="">To...</option>
                {graph?.entities.map((e) => <option key={e.id} value={e.id}>{String(e.properties.name || e.id)}</option>)}
              </select>
              <input value={rType} onChange={(e) => setRType(e.target.value)} placeholder="Type (e.g. CEO_OF)" style={{ ...S.input, flex: 1, minWidth: 120 }} />
              <button onClick={addRel} style={S.btn}>Add</button>
            </div>
          </section>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={resetGraph} style={{ ...S.btnDel, padding: "8px 14px" }}>🔄 Reset to Default</button>
          </div>

          <section style={S.card}>
            <h2 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>📦 Entities ({graph?.entities.length ?? 0})</h2>
            <div style={{ display: "grid", gap: 4, maxHeight: 300, overflow: "auto" }}>
              {graph?.entities.map((e) => (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#0d0d12", borderRadius: 6, border: "1px solid #1e293b", fontSize: 12 }}>
                  <span style={S.badge("#1e3a5f", "#7dd3fc")}>{e.type}</span>
                  <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{String(e.properties.name || e.id)}</span>
                  {e.labels.map((l) => <span key={l} style={S.badge("#2d1b4e", "#c4b5fd")}>{l}</span>)}
                  <button onClick={() => delEntity(e.id)} style={{ ...S.btnDel, marginLeft: "auto" }}>✕</button>
                </div>
              ))}
            </div>
          </section>

          <section style={S.card}>
            <h2 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>🔗 Relationships ({graph?.relationships.length ?? 0})</h2>
            <div style={{ display: "grid", gap: 4, maxHeight: 300, overflow: "auto" }}>
              {graph?.relationships.map((r, i) => {
                const fn = graph.entities.find((e) => e.id === r.from)?.properties.name ?? r.from;
                const tn = graph.entities.find((e) => e.id === r.to)?.properties.name ?? r.to;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: "#0d0d12", borderRadius: 6, border: "1px solid #1e293b", fontSize: 12 }}>
                    <span style={{ color: "#e2e8f0" }}>{String(fn)}</span>
                    <span style={S.badge("#1e3a5f", "#7dd3fc")}>{r.type}</span>
                    <span style={{ color: "#e2e8f0" }}>{String(tn)}</span>
                    <button onClick={() => delRel(r.from, r.to, r.type)} style={{ ...S.btnDel, marginLeft: "auto" }}>✕</button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* ══ MEMORY TAB ══ */}
      {tab === "memory" && (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ ...S.card, background: "#0f2d21", border: "1px solid #22c55e44" }}>
            <p style={{ margin: 0, fontSize: 13, color: "#86efac", lineHeight: 1.6 }}>
              <strong>Long-term memory</strong> persists across sessions (saved to disk). Add facts, preferences, or corrections that the AI should always remember.<br />
              <strong>Short-term memory</strong> is the chat conversation — it is automatically maintained while you chat, and cleared when you click "Clear".
            </p>
          </div>

          <section style={S.card}>
            <h2 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>➕ Add Long-Term Memory</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input value={mKey} onChange={(e) => setMKey(e.target.value)} placeholder="Key (e.g. user_name)" style={{ ...S.input, flex: 1, minWidth: 120 }} />
              <input value={mVal} onChange={(e) => setMVal(e.target.value)} placeholder="Value (e.g. Karthik)" style={{ ...S.input, flex: 2, minWidth: 200 }} />
              <select value={mCat} onChange={(e) => setMCat(e.target.value)} style={{ ...S.input, flex: 1, minWidth: 100, cursor: "pointer" }}>
                <option value="preference">Preference</option>
                <option value="fact">Fact</option>
                <option value="correction">Correction</option>
                <option value="feedback">Feedback</option>
              </select>
              <button onClick={addMem} style={S.btn}>Save</button>
            </div>
          </section>

          <section style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>📋 Saved Memories ({memories.length})</h2>
              {memories.length > 0 && <button onClick={clearMem} style={{ ...S.btnDel, padding: "6px 12px" }}>Clear All</button>}
            </div>
            {memories.length === 0 && <p style={{ color: "#475569", fontSize: 13, margin: 0 }}>No memories saved yet. Add some above!</p>}
            <div style={{ display: "grid", gap: 6 }}>
              {memories.map((m) => (
                <div key={m.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#0d0d12", borderRadius: 8, border: "1px solid #1e293b" }}>
                  <span style={S.badge("#2d1b4e", "#c4b5fd")}>{m.category}</span>
                  <strong style={{ fontSize: 13, color: "#7dd3fc" }}>{m.key}:</strong>
                  <span style={{ fontSize: 13, color: "#cbd5e1" }}>{m.value}</span>
                  <span style={{ fontSize: 11, color: "#475569", marginLeft: "auto" }}>{m.source}</span>
                  <button onClick={() => delMem(m.key)} style={S.btnDel}>✕</button>
                </div>
              ))}
            </div>
          </section>

          {/* Short-term display */}
          <section style={S.card}>
            <h2 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>💬 Short-Term Memory (Current Chat: {chatHistory.length} messages)</h2>
            {chatHistory.length === 0 ? (
              <p style={{ color: "#475569", fontSize: 13, margin: 0 }}>No active conversation. Go to the Chat tab to start one.</p>
            ) : (
              <div style={{ display: "grid", gap: 4, maxHeight: 200, overflow: "auto" }}>
                {chatHistory.map((msg, i) => (
                  <div key={i} style={{ fontSize: 12, color: msg.role === "user" ? "#7dd3fc" : "#94a3b8", padding: "4px 8px", background: "#0d0d12", borderRadius: 4 }}>
                    <strong>{msg.role}:</strong> {msg.content.slice(0, 120)}{msg.content.length > 120 ? "..." : ""}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
