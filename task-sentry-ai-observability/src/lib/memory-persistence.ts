/**
 * Memory Persistence Layer
 *
 * Implements two types of memory from the Context Engineering guide:
 *
 * 1. Long-Term Memory (persistent across sessions)
 *    - User preferences, facts, learned patterns
 *    - Stored in data/memory.json
 *
 * 2. Short-Term Memory (conversation history)
 *    - Managed in the frontend and passed to the API per request
 *    - The API receives it as part of the POST body
 */

import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const MEMORY_FILE = path.join(DATA_DIR, "memory.json");

export interface LongTermMemory {
  key: string;
  value: string;
  source: "user" | "system" | "inferred";
  category: "preference" | "fact" | "correction" | "feedback";
  createdAt: number;
  accessCount: number;
}

export interface MemoryStore {
  longTerm: LongTermMemory[];
  lastUpdated: string;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/** Load all long-term memories from disk */
export function loadMemories(): LongTermMemory[] {
  ensureDataDir();
  if (!fs.existsSync(MEMORY_FILE)) {
    // Seed with empty store
    const store: MemoryStore = { longTerm: [], lastUpdated: new Date().toISOString() };
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(store, null, 2), "utf-8");
    return [];
  }
  const raw = fs.readFileSync(MEMORY_FILE, "utf-8");
  const store: MemoryStore = JSON.parse(raw);
  return store.longTerm;
}

/** Save all long-term memories to disk */
export function saveMemories(memories: LongTermMemory[]): void {
  ensureDataDir();
  const store: MemoryStore = {
    longTerm: memories,
    lastUpdated: new Date().toISOString(),
  };
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(store, null, 2), "utf-8");
}

/** Add a single memory entry (upserts by key) */
export function addMemory(entry: Omit<LongTermMemory, "accessCount">): void {
  const memories = loadMemories();
  const existing = memories.findIndex((m) => m.key === entry.key);
  if (existing >= 0) {
    memories[existing] = { ...entry, accessCount: memories[existing].accessCount + 1 };
  } else {
    memories.push({ ...entry, accessCount: 0 });
  }
  saveMemories(memories);
}

/** Remove a memory by key */
export function removeMemory(key: string): boolean {
  const memories = loadMemories();
  const filtered = memories.filter((m) => m.key !== key);
  if (filtered.length === memories.length) return false;
  saveMemories(filtered);
  return true;
}

/** Clear all memories */
export function clearMemories(): void {
  saveMemories([]);
}
