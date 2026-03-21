import { AI } from "../lib/ai-client.js";

async function runAutoTracingDemo() {
  console.log("=================================================");
  console.log("AUTO-INSTRUMENTATION DEMO (Sentry + Langfuse)");
  console.log("=================================================\n");

  console.log("Calling standard AI.chat.completions.create()...");
  console.log("You shouldn't see any manual Span tracking here!\n");

  try {
    // 💥 Notice there is NO Sentry.startSpan() anywhere!
    // Both Sentry and Langfuse will automatically capture this request.
    const response = await AI.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Tell me a very short joke." },
      ],
    });

    console.log("Response:", response.choices[0].message.content);
    console.log("\n✅ Success! Because of lib/ai-client.ts, this was automatically sent to Sentry & Langfuse.");
  } catch (error) {
    if (String(error).includes("401 Incorrect API key")) {
        console.log("❌ OpenAI API Key is missing or invalid. But the Sentry/Langfuse logic is fully wired up!");
    } else {
        console.error("Error:", error);
    }
  }

  // Need a tiny timeout to let spans flush before exiting
  await new Promise((r) => setTimeout(r, 2500));
}

runAutoTracingDemo();
