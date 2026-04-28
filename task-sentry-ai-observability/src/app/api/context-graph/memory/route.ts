/**
 * API Route: /api/context-graph/memory
 *
 * Manages Long-Term Memory (persisted to data/memory.json).
 * - GET:    Returns all long-term memories
 * - POST:   Add a new memory
 * - DELETE: Remove a memory by key
 * - PUT:    Clear all memories
 */

import { NextResponse } from "next/server";
import {
  loadMemories,
  addMemory,
  removeMemory,
  clearMemories,
} from "@/lib/memory-persistence";

export async function GET() {
  const memories = loadMemories();
  return NextResponse.json({ memories });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { key, value, source, category } = body;

  if (!key || !value) {
    return NextResponse.json(
      { error: "key and value are required" },
      { status: 400 }
    );
  }

  addMemory({
    key,
    value,
    source: source || "user",
    category: category || "preference",
    createdAt: Date.now(),
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const removed = removeMemory(body.key);
  if (!removed) {
    return NextResponse.json({ error: "Memory not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function PUT() {
  clearMemories();
  return NextResponse.json({ ok: true, message: "All memories cleared" });
}
