/**
 * API Route: /api/context-graph/manage
 *
 * CRUD operations for the Knowledge Graph.
 * - GET:    Returns all entities and relationships
 * - POST:   Add an entity or relationship
 * - DELETE: Remove an entity or relationship
 * - PUT:    Reset graph to default sample data
 */

import { NextResponse } from "next/server";
import { loadGraph, saveGraph, resetGraph } from "@/lib/kg-persistence";

export async function GET() {
  const kg = loadGraph();
  return NextResponse.json({
    entities: kg.getAllEntities(),
    relationships: kg.getAllRelationships(),
    stats: kg.stats(),
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const kg = loadGraph();

  if (body.action === "add_entity") {
    const { id, type, labels, properties } = body;
    if (!id || !type) {
      return NextResponse.json({ error: "id and type are required" }, { status: 400 });
    }
    kg.addEntity({
      id: id.toLowerCase().replace(/\s+/g, "_"),
      type,
      labels: labels || [],
      properties: properties || {},
    });
    saveGraph(kg);
    return NextResponse.json({ ok: true, entity: kg.getEntity(id.toLowerCase().replace(/\s+/g, "_")) });
  }

  if (body.action === "add_relationship") {
    const { from, to, type, properties } = body;
    if (!from || !to || !type) {
      return NextResponse.json({ error: "from, to, and type are required" }, { status: 400 });
    }
    if (!kg.getEntity(from)) {
      return NextResponse.json({ error: `Entity '${from}' not found` }, { status: 400 });
    }
    if (!kg.getEntity(to)) {
      return NextResponse.json({ error: `Entity '${to}' not found` }, { status: 400 });
    }
    kg.addRelationship({ from, to, type: type.toUpperCase().replace(/\s+/g, "_"), properties: properties || {} });
    saveGraph(kg);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action. Use add_entity or add_relationship." }, { status: 400 });
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const kg = loadGraph();

  if (body.action === "remove_entity") {
    const removed = kg.removeEntity(body.id);
    if (!removed) return NextResponse.json({ error: "Entity not found" }, { status: 404 });
    saveGraph(kg);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "remove_relationship") {
    const removed = kg.removeRelationship(body.from, body.to, body.type);
    if (!removed) return NextResponse.json({ error: "Relationship not found" }, { status: 404 });
    saveGraph(kg);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function PUT() {
  resetGraph();
  return NextResponse.json({ ok: true, message: "Graph reset to default sample data" });
}
