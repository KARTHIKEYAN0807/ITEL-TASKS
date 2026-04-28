/**
 * Homepage — Sentry AI Observability Demo
 *
 * Shows all 5 API routes you can call to send data to Sentry.
 */
export default function HomePage() {
  const routes = [
    {
      topic: "01",
      title: "Prompt Tracing",
      href: "/api/prompt-tracing",
      badge: "Performance → Traces",
      icon: "🔍",
      description:
        "Creates Sentry spans for each LLM call. View the waterfall of AI operations in Performance → Traces.",
    },
    {
      topic: "02",
      title: "Token Usage Tracking",
      href: "/api/token-usage",
      badge: "Insights → AI → Token Usage",
      icon: "🔢",
      description:
        "Sets gen_ai.usage.* attributes so Sentry aggregates input, cached, and output token counts.",
    },
    {
      topic: "03",
      title: "Latency Monitoring",
      href: "/api/latency-monitoring",
      badge: "Performance → Traces",
      icon: "⏱️",
      description:
        "Measures actual call latency and flags slow calls. Slow calls trigger Sentry warning events.",
    },
    {
      topic: "04",
      title: "Debugging Prompts",
      href: "/api/debugging-prompts",
      badge: "AI → Conversations + Issues",
      icon: "🐛",
      description:
        "Attaches full prompt & response text to spans. Errors are captured with a breadcrumb trail.",
    },
    {
      topic: "05",
      title: "Cost Monitoring",
      href: "/api/cost-monitoring",
      badge: "Insights → AI → Costs",
      icon: "💰",
      description:
        "Calculates per-call USD cost from token counts and attaches it to Sentry spans for cost aggregation.",
    },
    {
      topic: "06",
      title: "Context Engineering + Knowledge Graph",
      href: "/context-graph-ui",
      badge: "Performance → Traces + AI → Conversations",
      icon: "🧠",
      description:
        "Full Context Engineering pipeline: instruction, task, retrieved, tool, memory, output & safety context — backed by an in-memory Knowledge Graph with entities, relationships, multi-hop traversal, and inference. All traced with Sentry.",
    },
  ];

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
      {/* Header */}
      <header style={{ marginBottom: 48 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 36 }}>🛰️</span>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, color: "#f8fafc" }}>
            Sentry AI Observability
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: 16, color: "#94a3b8", lineHeight: 1.6 }}>
          A Next.js learning project demonstrating how to monitor AI systems with the Sentry SDK.
          Click any route below to send real data to your Sentry dashboard.
        </p>
        <div style={{ marginTop: 16, padding: "12px 16px", background: "#1e1e2e", borderRadius: 8, border: "1px solid #334155" }}>
          <code style={{ fontSize: 13, color: "#7dd3fc" }}>
            SENTRY_DSN must be set in <strong>.env.local</strong> for data to appear in Sentry.
          </code>
        </div>
      </header>

      {/* Route cards */}
      <div style={{ display: "grid", gap: 16 }}>
        {routes.map((r) => (
          <a
            key={r.href}
            href={r.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              textDecoration: "none",
              padding: "24px",
              background: "#1e1e2e",
              borderRadius: 12,
              border: "1px solid #334155",
              transition: "border-color 0.2s",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              <span style={{ fontSize: 28 }}>{r.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>
                    TOPIC {r.topic}
                  </span>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#f1f5f9" }}>
                    {r.title}
                  </h2>
                  <span
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      background: "#1e3a5f",
                      color: "#7dd3fc",
                      borderRadius: 99,
                      fontWeight: 600,
                    }}
                  >
                    {r.badge}
                  </span>
                </div>
                <p style={{ margin: "8px 0 12px", fontSize: 14, color: "#94a3b8", lineHeight: 1.6 }}>
                  {r.description}
                </p>
                <code style={{ fontSize: 12, color: "#34d399", background: "#0f2d21", padding: "3px 8px", borderRadius: 4 }}>
                  GET {r.href}
                </code>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Footer */}
      <footer style={{ marginTop: 48, textAlign: "center", color: "#475569", fontSize: 13 }}>
        <p>
          Reference:{" "}
          <a
            href="https://docs.sentry.io/platforms/javascript/guides/nextjs/ai-agent-monitoring/"
            style={{ color: "#7dd3fc" }}
            target="_blank"
            rel="noopener noreferrer"
          >
            Sentry AI Agent Monitoring Docs
          </a>
        </p>
      </footer>
    </main>
  );
}
