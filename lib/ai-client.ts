import OpenAI from "openai";
import * as Sentry from "@sentry/node";
import { observeOpenAI } from "langfuse";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

// 1. Load the shared .env file
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

// 2. Initialize Sentry with the official auto-instrumentation
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    integrations: [Sentry.openaiIntegration()], // Automatically tracks prompts & tokens!
  });
  console.log("✅ Sentry Auto-Instrumentation Enabled");
} else {
  console.warn("⚠️ No SENTRY_DSN found in root .env");
}

// 3. Initialize the standard OpenAI Client
const baseOpenAI = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-now",
});

// 4. Wrap the Client with Langfuse Auto-Instrumentation
export const AI = observeOpenAI(baseOpenAI, {
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASEURL || "https://cloud.langfuse.com",
});

console.log("✅ Langfuse Auto-Instrumentation Ready\n");
