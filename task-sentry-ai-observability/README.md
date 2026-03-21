# Sentry AI Observability

**Reference:** [Sentry AI Agent Monitoring Docs](https://docs.sentry.io/platforms/javascript/guides/node/ai-agent-monitoring/)

Learn how to monitor AI systems in production using Sentry — track prompts, token usage, latency, and costs. All examples use the **real `@sentry/node` SDK** so you can see live data in your Sentry dashboard.

---

## ⚙️ Setup (Required Before Running)

### 1. Install dependencies
```bash
npm install @sentry/node dotenv
```

### 2. Create a Sentry project
1. Go to [sentry.io](https://sentry.io) → Sign up free
2. **Create Project** → choose **Node.js**
3. Copy your **DSN**

### 3. Create `.env` file inside this folder
```bash
# task-sentry-ai-observability/.env
SENTRY_DSN=https://your-key@oXXXXXX.ingest.sentry.io/XXXXXXX
```

> ⚠️ Never commit `.env` — it's already in `.gitignore`

---

## 📁 Folder Structure

```
task-sentry-ai-observability/
├── README.md                              ← You are here
├── .env.example                           ← Copy this to .env and fill in your DSN
├── sentry.init.ts                         ← Shared Sentry initialization
├── 01-prompt-tracing/
│   ├── notes.md
│   └── examples/
│       └── prompt-tracing.ts
├── 02-token-usage-tracking/
│   ├── notes.md
│   └── examples/
│       └── token-usage.ts
├── 03-latency-monitoring/
│   ├── notes.md
│   └── examples/
│       └── latency-monitor.ts
├── 04-debugging-prompts/
│   ├── notes.md
│   └── examples/
│       └── debug-prompts.ts
└── 05-cost-monitoring/
    ├── notes.md
    └── examples/
        └── cost-monitor.ts
```

---

## 📚 Topics

| # | Topic | Notes | Code Example | See in Sentry |
|---|-------|-------|--------------|--------------|
| 1 | Prompt Tracing | [notes.md](./01-prompt-tracing/notes.md) | [prompt-tracing.ts](./01-prompt-tracing/examples/prompt-tracing.ts) | Performance → Traces |
| 2 | Token Usage Tracking | [notes.md](./02-token-usage-tracking/notes.md) | [token-usage.ts](./02-token-usage-tracking/examples/token-usage.ts) | AI Insights → Token Usage |
| 3 | Latency Monitoring | [notes.md](./03-latency-monitoring/notes.md) | [latency-monitor.ts](./03-latency-monitoring/examples/latency-monitor.ts) | Performance → Spans |
| 4 | Debugging Prompts | [notes.md](./04-debugging-prompts/notes.md) | [debug-prompts.ts](./04-debugging-prompts/examples/debug-prompts.ts) | AI → Conversations + Errors |
| 5 | Cost Monitoring | [notes.md](./05-cost-monitoring/notes.md) | [cost-monitor.ts](./05-cost-monitoring/examples/cost-monitor.ts) | AI Insights → Costs |

---

## 🔧 Running the Examples

```bash
# From the d:\ITEL TASKS root

npm run prompt-tracing-demo
npm run token-usage-demo
npm run latency-demo
npm run debug-prompts-demo
npm run cost-monitor-demo
```

After running, open your **Sentry project → Performance** or **AI Insights** to see live data.

---

## 🔍 Where to Find Data in Sentry

| What you ran | Sentry path |
|---|---|
| Any example | **Issues** → any captured errors |
| Prompt tracing | **Performance** → **Traces** → click a trace → see span waterfall |
| Token usage | **Insights** → **AI** → Token Usage chart |
| Latency | **Performance** → span durations in trace detail |
| Debug prompts | **AI** → **Conversations** + **Issues** for errors |
| Cost monitoring | **Insights** → **AI** → Costs |
