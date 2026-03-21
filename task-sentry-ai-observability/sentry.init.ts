/**
 * Shared Sentry initialization — imported by all examples.
 *
 * Requirements:
 *  - Create a .env file in this folder with: SENTRY_DSN=https://...
 *  - Run: npm install @sentry/node dotenv
 */

import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const Sentry = require("@sentry/nextjs");
const metrics = Sentry.metrics;

// Load .env from this folder (task-sentry-ai-observability/.env)
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, ".env") });

if (!process.env.SENTRY_DSN) {
  console.error("❌  SENTRY_DSN not found!");
  console.error(
    "    Create task-sentry-ai-observability/.env with: SENTRY_DSN=https://...\n"
  );
  process.exit(1);
}

Sentry.init({
  // Use the DSN from env if available, otherwise the one provided
  dsn: process.env.SENTRY_DSN || "https://206f14b6f91de0a266a12a92c7537c7a@o4511076491853824.ingest.de.sentry.io/4511076494803024",

  // Capture 100% of transactions so every example run shows in Sentry
  tracesSampleRate: 1.0,

  // Print Sentry SDK debug info to console (helpful for learning)
  debug: false,
});

// Use metrics in both server and client code
metrics.count('user_action', 1);
metrics.distribution('api_response_time', 150);

console.log("✅  Sentry initialized — data will appear in your dashboard\n");

export { Sentry };
