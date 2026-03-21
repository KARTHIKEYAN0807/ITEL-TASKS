/**
 * Sentry server-side initialization for Next.js.
 * This file is auto-loaded by the Next.js instrumentation hook (Node.js runtime).
 *
 * Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Capture 100% of transactions — ideal for learning/demos
  tracesSampleRate: 1.0,

  // Print Sentry SDK debug info to console (disable in production)
  debug: false,
});
