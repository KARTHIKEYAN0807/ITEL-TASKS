import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sentry AI Observability",
  description: "Next.js demo: monitor AI systems with Sentry — prompt tracing, token usage, latency, debugging, and cost tracking.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: 0, background: "#0d0d12", color: "#e2e8f0" }}>
        {children}
      </body>
    </html>
  );
}
