/**
 * Knowledge Graph Persistence Layer
 *
 * Saves and loads the Knowledge Graph to/from a JSON file.
 * This makes it "real" — data survives server restarts and
 * users can add their own entities and relationships.
 */

import fs from "fs";
import path from "path";
import { KnowledgeGraph, Entity, Relationship, createSampleGraph } from "./knowledge-graph";

const DATA_DIR = path.join(process.cwd(), "data");
const KG_FILE = path.join(DATA_DIR, "knowledge-graph.json");

interface KGData {
  entities: Entity[];
  relationships: Relationship[];
  lastUpdated: string;
}

/** Ensure the data directory exists */
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/** Save a KnowledgeGraph instance to JSON */
export function saveGraph(kg: KnowledgeGraph): void {
  ensureDataDir();
  const data: KGData = {
    entities: kg.getAllEntities(),
    relationships: kg.getAllRelationships(),
    lastUpdated: new Date().toISOString(),
  };
  fs.writeFileSync(KG_FILE, JSON.stringify(data, null, 2), "utf-8");
}

/** Load a KnowledgeGraph from JSON. If no file exists, seed with sample data. */
export function loadGraph(): KnowledgeGraph {
  ensureDataDir();

  if (!fs.existsSync(KG_FILE)) {
    // First run: seed with sample data and persist it
    const kg = createSampleGraph();
    saveGraph(kg);
    return kg;
  }

  const raw = fs.readFileSync(KG_FILE, "utf-8");
  const data: KGData = JSON.parse(raw);

  const kg = new KnowledgeGraph();
  for (const entity of data.entities) {
    kg.addEntity(entity);
  }
  for (const rel of data.relationships) {
    kg.addRelationship(rel);
  }
  return kg;
}

/** Reset the graph back to the default sample data */
export function resetGraph(): KnowledgeGraph {
  const kg = createSampleGraph();
  saveGraph(kg);
  return kg;
}
