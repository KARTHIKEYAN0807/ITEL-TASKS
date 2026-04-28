/**
 * In-Memory Knowledge Graph
 *
 * Demonstrates core Knowledge Graph concepts:
 *  - Entities (Nodes) with types, labels, and properties
 *  - Relationships (Edges) with types and properties
 *  - Triples: (Subject) --[Predicate]--> (Object)
 *  - Graph traversal & multi-hop reasoning
 *  - Entity resolution & subgraph extraction
 *
 * This graph models a small tech-company domain with people,
 * companies, products, technologies, and locations.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Entity {
  id: string;
  type: string;          // Person, Company, Product, Technology, Location, Award
  labels: string[];      // e.g. ["Scientist", "CEO"]
  properties: Record<string, string | number | boolean>;
}

export interface Relationship {
  from: string;          // entity id
  to: string;            // entity id
  type: string;          // WORKS_AT, FOUNDED, USES_TECH, etc.
  properties: Record<string, string | number | boolean>;
}

export interface Triple {
  subject: string;
  predicate: string;
  object: string;
}

export interface TraversalResult {
  path: string[];
  relationships: string[];
  depth: number;
}

// ─── Knowledge Graph Class ──────────────────────────────────────────────────

export class KnowledgeGraph {
  private entities: Map<string, Entity> = new Map();
  private relationships: Relationship[] = [];

  // ── Entity CRUD ──────────────────────────────────────────────────────────

  addEntity(entity: Entity): void {
    this.entities.set(entity.id, entity);
  }

  getEntity(id: string): Entity | undefined {
    return this.entities.get(id);
  }

  getEntitiesByType(type: string): Entity[] {
    return [...this.entities.values()].filter(
      (e) => e.type.toLowerCase() === type.toLowerCase()
    );
  }

  searchEntities(query: string): Entity[] {
    const q = query.toLowerCase();
    return [...this.entities.values()].filter(
      (e) =>
        e.id.toLowerCase().includes(q) ||
        e.type.toLowerCase().includes(q) ||
        e.labels.some((l) => l.toLowerCase().includes(q)) ||
        Object.values(e.properties).some((v) =>
          String(v).toLowerCase().includes(q)
        )
    );
  }

  // ── Relationship CRUD ────────────────────────────────────────────────────

  addRelationship(rel: Relationship): void {
    this.relationships.push(rel);
  }

  getRelationshipsFrom(entityId: string): Relationship[] {
    return this.relationships.filter((r) => r.from === entityId);
  }

  getRelationshipsTo(entityId: string): Relationship[] {
    return this.relationships.filter((r) => r.to === entityId);
  }

  getRelationshipsByType(type: string): Relationship[] {
    return this.relationships.filter(
      (r) => r.type.toLowerCase() === type.toLowerCase()
    );
  }

  // ── Triple extraction ────────────────────────────────────────────────────

  toTriples(): Triple[] {
    return this.relationships.map((r) => ({
      subject: r.from,
      predicate: r.type,
      object: r.to,
    }));
  }

  // ── Graph Traversal (BFS, multi-hop) ─────────────────────────────────────

  traverse(
    startId: string,
    maxDepth: number = 2
  ): TraversalResult[] {
    const results: TraversalResult[] = [];
    const visited = new Set<string>();

    interface QueueItem {
      entityId: string;
      path: string[];
      relationships: string[];
      depth: number;
    }

    const queue: QueueItem[] = [
      { entityId: startId, path: [startId], relationships: [], depth: 0 },
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.depth >= maxDepth) continue;
      if (visited.has(current.entityId)) continue;
      visited.add(current.entityId);

      const outgoing = this.getRelationshipsFrom(current.entityId);
      for (const rel of outgoing) {
        const newPath = [...current.path, rel.to];
        const newRels = [...current.relationships, rel.type];
        results.push({
          path: newPath,
          relationships: newRels,
          depth: current.depth + 1,
        });
        queue.push({
          entityId: rel.to,
          path: newPath,
          relationships: newRels,
          depth: current.depth + 1,
        });
      }
    }

    return results;
  }

  // ── Subgraph extraction ──────────────────────────────────────────────────

  getSubgraph(entityIds: string[]): {
    entities: Entity[];
    relationships: Relationship[];
  } {
    const idSet = new Set(entityIds);
    const entities = entityIds
      .map((id) => this.entities.get(id))
      .filter(Boolean) as Entity[];
    const relationships = this.relationships.filter(
      (r) => idSet.has(r.from) && idSet.has(r.to)
    );
    return { entities, relationships };
  }

  // ── Inference (simple rule-based) ────────────────────────────────────────

  inferRelationships(): Triple[] {
    const inferred: Triple[] = [];

    // Rule: If A works_at B, and B headquartered_in C, then A based_in C
    for (const worksAt of this.getRelationshipsByType("WORKS_AT")) {
      for (const hq of this.getRelationshipsByType("HEADQUARTERED_IN")) {
        if (worksAt.to === hq.from) {
          inferred.push({
            subject: worksAt.from,
            predicate: "INFERRED_BASED_IN",
            object: hq.to,
          });
        }
      }
    }

    // Rule: If A founded B, then A is associated_with B
    for (const founded of this.getRelationshipsByType("FOUNDED")) {
      inferred.push({
        subject: founded.from,
        predicate: "INFERRED_ASSOCIATED_WITH",
        object: founded.to,
      });
    }

    return inferred;
  }

  // ── Full data access (for persistence) ───────────────────────────────────

  getAllEntities(): Entity[] {
    return [...this.entities.values()];
  }

  getAllRelationships(): Relationship[] {
    return [...this.relationships];
  }

  // ── Delete operations ────────────────────────────────────────────────────

  removeEntity(id: string): boolean {
    const existed = this.entities.delete(id);
    if (existed) {
      // Also remove any relationships involving this entity
      this.relationships = this.relationships.filter(
        (r) => r.from !== id && r.to !== id
      );
    }
    return existed;
  }

  removeRelationship(from: string, to: string, type: string): boolean {
    const before = this.relationships.length;
    this.relationships = this.relationships.filter(
      (r) => !(r.from === from && r.to === to && r.type === type)
    );
    return this.relationships.length < before;
  }

  // ── Stats ────────────────────────────────────────────────────────────────

  stats() {
    return {
      entityCount: this.entities.size,
      relationshipCount: this.relationships.length,
      entityTypes: [...new Set([...this.entities.values()].map((e) => e.type))],
      relationshipTypes: [...new Set(this.relationships.map((r) => r.type))],
    };
  }
}

// ─── Seed Data ──────────────────────────────────────────────────────────────

export function createSampleGraph(): KnowledgeGraph {
  const kg = new KnowledgeGraph();

  // ── Entities ─────────────────────────────────────────────────────────────

  // People
  kg.addEntity({ id: "satya_nadella",   type: "Person",     labels: ["CEO", "Engineer"],    properties: { name: "Satya Nadella",   born: 1967, nationality: "Indian-American" } });
  kg.addEntity({ id: "sundar_pichai",   type: "Person",     labels: ["CEO", "Engineer"],    properties: { name: "Sundar Pichai",   born: 1972, nationality: "Indian-American" } });
  kg.addEntity({ id: "sam_altman",      type: "Person",     labels: ["CEO", "Entrepreneur"],properties: { name: "Sam Altman",      born: 1985, nationality: "American" } });
  kg.addEntity({ id: "jensen_huang",    type: "Person",     labels: ["CEO", "Engineer"],    properties: { name: "Jensen Huang",    born: 1963, nationality: "Taiwanese-American" } });
  kg.addEntity({ id: "demis_hassabis",  type: "Person",     labels: ["CEO", "Researcher"],  properties: { name: "Demis Hassabis",  born: 1976, nationality: "British" } });
  kg.addEntity({ id: "ilya_sutskever",  type: "Person",     labels: ["Researcher", "Co-founder"], properties: { name: "Ilya Sutskever", born: 1986, nationality: "Israeli-Canadian" } });

  // Companies
  kg.addEntity({ id: "microsoft",       type: "Company",    labels: ["Tech", "Cloud"],      properties: { name: "Microsoft",  founded: 1975, employees: 221000 } });
  kg.addEntity({ id: "google",          type: "Company",    labels: ["Tech", "AI"],         properties: { name: "Google",     founded: 1998, employees: 182502 } });
  kg.addEntity({ id: "openai",          type: "Company",    labels: ["AI", "Research"],     properties: { name: "OpenAI",     founded: 2015, employees: 1500 } });
  kg.addEntity({ id: "nvidia",          type: "Company",    labels: ["Tech", "Hardware"],   properties: { name: "NVIDIA",     founded: 1993, employees: 29600 } });
  kg.addEntity({ id: "deepmind",        type: "Company",    labels: ["AI", "Research"],     properties: { name: "DeepMind",   founded: 2010, employees: 2500 } });
  kg.addEntity({ id: "ssi",             type: "Company",    labels: ["AI", "Safety"],       properties: { name: "Safe Superintelligence Inc.", founded: 2024, employees: 30 } });

  // Products / Models
  kg.addEntity({ id: "gpt4",            type: "Product",    labels: ["LLM", "AI Model"],    properties: { name: "GPT-4",       released: 2023, type: "Large Language Model" } });
  kg.addEntity({ id: "gemini",          type: "Product",    labels: ["LLM", "AI Model"],    properties: { name: "Gemini",      released: 2023, type: "Multimodal AI Model" } });
  kg.addEntity({ id: "copilot",         type: "Product",    labels: ["AI Tool", "IDE"],     properties: { name: "GitHub Copilot", released: 2021, type: "AI Coding Assistant" } });
  kg.addEntity({ id: "cuda",            type: "Product",    labels: ["Platform", "GPU"],    properties: { name: "CUDA",        released: 2007, type: "GPU Computing Platform" } });
  kg.addEntity({ id: "alphafold",       type: "Product",    labels: ["AI Model", "Science"],properties: { name: "AlphaFold",   released: 2020, type: "Protein Structure Prediction" } });
  kg.addEntity({ id: "azure",           type: "Product",    labels: ["Cloud", "Platform"],  properties: { name: "Azure",       released: 2010, type: "Cloud Computing Platform" } });

  // Technologies
  kg.addEntity({ id: "transformer",     type: "Technology", labels: ["Architecture"],        properties: { name: "Transformer",    year: 2017, paper: "Attention Is All You Need" } });
  kg.addEntity({ id: "rlhf",            type: "Technology", labels: ["Training"],            properties: { name: "RLHF",           year: 2017, paper: "Deep RL from Human Preferences" } });
  kg.addEntity({ id: "rag",             type: "Technology", labels: ["Architecture"],        properties: { name: "RAG",            year: 2020, paper: "Retrieval-Augmented Generation" } });
  kg.addEntity({ id: "context_eng",     type: "Technology", labels: ["Methodology"],         properties: { name: "Context Engineering", year: 2024, description: "Designing the full information environment for AI models" } });

  // Locations
  kg.addEntity({ id: "redmond",         type: "Location",   labels: ["City", "HQ"],         properties: { name: "Redmond, WA",     country: "USA" } });
  kg.addEntity({ id: "mountain_view",   type: "Location",   labels: ["City", "HQ"],         properties: { name: "Mountain View, CA", country: "USA" } });
  kg.addEntity({ id: "san_francisco",   type: "Location",   labels: ["City", "HQ"],         properties: { name: "San Francisco, CA", country: "USA" } });
  kg.addEntity({ id: "santa_clara",     type: "Location",   labels: ["City", "HQ"],         properties: { name: "Santa Clara, CA",  country: "USA" } });
  kg.addEntity({ id: "london",          type: "Location",   labels: ["City", "HQ"],         properties: { name: "London",           country: "UK" } });

  // ── Relationships ────────────────────────────────────────────────────────

  // Person → Company (WORKS_AT / CEO_OF)
  kg.addRelationship({ from: "satya_nadella",  to: "microsoft", type: "CEO_OF",    properties: { since: 2014 } });
  kg.addRelationship({ from: "sundar_pichai",  to: "google",    type: "CEO_OF",    properties: { since: 2015 } });
  kg.addRelationship({ from: "sam_altman",     to: "openai",    type: "CEO_OF",    properties: { since: 2019 } });
  kg.addRelationship({ from: "jensen_huang",   to: "nvidia",    type: "CEO_OF",    properties: { since: 1993 } });
  kg.addRelationship({ from: "demis_hassabis", to: "deepmind",  type: "CEO_OF",    properties: { since: 2010 } });
  kg.addRelationship({ from: "ilya_sutskever", to: "ssi",       type: "CEO_OF",    properties: { since: 2024 } });

  // Person → Company (FOUNDED)
  kg.addRelationship({ from: "jensen_huang",   to: "nvidia",    type: "FOUNDED",   properties: { year: 1993 } });
  kg.addRelationship({ from: "demis_hassabis", to: "deepmind",  type: "FOUNDED",   properties: { year: 2010 } });
  kg.addRelationship({ from: "ilya_sutskever", to: "ssi",       type: "FOUNDED",   properties: { year: 2024 } });

  // Person → Company (WORKS_AT — past roles)
  kg.addRelationship({ from: "satya_nadella",  to: "microsoft", type: "WORKS_AT",  properties: { since: 1992 } });
  kg.addRelationship({ from: "sundar_pichai",  to: "google",    type: "WORKS_AT",  properties: { since: 2004 } });
  kg.addRelationship({ from: "ilya_sutskever", to: "openai",    type: "PREVIOUSLY_AT", properties: { from: 2015, until: 2024, role: "Chief Scientist" } });

  // Company → Location (HEADQUARTERED_IN)
  kg.addRelationship({ from: "microsoft", to: "redmond",       type: "HEADQUARTERED_IN", properties: {} });
  kg.addRelationship({ from: "google",    to: "mountain_view", type: "HEADQUARTERED_IN", properties: {} });
  kg.addRelationship({ from: "openai",    to: "san_francisco", type: "HEADQUARTERED_IN", properties: {} });
  kg.addRelationship({ from: "nvidia",    to: "santa_clara",   type: "HEADQUARTERED_IN", properties: {} });
  kg.addRelationship({ from: "deepmind",  to: "london",        type: "HEADQUARTERED_IN", properties: {} });

  // Company → Product (CREATED)
  kg.addRelationship({ from: "openai",    to: "gpt4",      type: "CREATED", properties: { year: 2023 } });
  kg.addRelationship({ from: "google",    to: "gemini",    type: "CREATED", properties: { year: 2023 } });
  kg.addRelationship({ from: "microsoft", to: "copilot",   type: "CREATED", properties: { year: 2021 } });
  kg.addRelationship({ from: "nvidia",    to: "cuda",      type: "CREATED", properties: { year: 2007 } });
  kg.addRelationship({ from: "deepmind",  to: "alphafold", type: "CREATED", properties: { year: 2020 } });
  kg.addRelationship({ from: "microsoft", to: "azure",     type: "CREATED", properties: { year: 2010 } });

  // Product → Technology (USES)
  kg.addRelationship({ from: "gpt4",      to: "transformer", type: "USES_TECH", properties: {} });
  kg.addRelationship({ from: "gpt4",      to: "rlhf",        type: "USES_TECH", properties: {} });
  kg.addRelationship({ from: "gemini",    to: "transformer", type: "USES_TECH", properties: {} });
  kg.addRelationship({ from: "copilot",   to: "gpt4",        type: "POWERED_BY", properties: {} });
  kg.addRelationship({ from: "alphafold", to: "transformer", type: "USES_TECH", properties: {} });

  // Company → Company (INVESTED_IN / ACQUIRED)
  kg.addRelationship({ from: "microsoft", to: "openai",    type: "INVESTED_IN", properties: { amount: "$13B", year: 2023 } });
  kg.addRelationship({ from: "google",    to: "deepmind",  type: "ACQUIRED",    properties: { amount: "$500M", year: 2014 } });

  // Technology → Technology (ENABLES)
  kg.addRelationship({ from: "transformer", to: "rag",         type: "ENABLES", properties: {} });
  kg.addRelationship({ from: "rag",         to: "context_eng", type: "PART_OF", properties: {} });

  return kg;
}
