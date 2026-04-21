# Knowledge Graphs: Complete Beginner Guide

Updated: 2026-04-21

A knowledge graph is a structured way to store and connect information as entities and relationships. Instead of storing data in rows and columns, a knowledge graph stores facts as a network of connected nodes. This makes it easy to find hidden connections, answer complex questions, and give AI systems a richer understanding of the world.

Use this document as a learning guide, a checklist, and a practical reference when building AI systems, search engines, recommendation systems, or data-driven applications.

---

## Table of Contents

1. What a knowledge graph is
2. Why knowledge graphs matter
3. Core concepts
4. Types of knowledge graphs
5. Knowledge graph vs relational database
6. How knowledge graphs work
7. Building a knowledge graph
8. Ontologies and schemas
9. Knowledge graph query languages
10. Knowledge graph embeddings
11. Knowledge graphs and AI
12. Knowledge graphs and RAG
13. Knowledge graphs and LLMs
14. Graph databases
15. Real-world use cases
16. Common mistakes and fixes
17. Before and after examples
18. Step-by-step workflow
19. Easy learning path
20. Templates
21. Glossary
22. Quick cheat sheet
23. Further reading

---

## 1. What a Knowledge Graph Is

A knowledge graph represents real-world facts as a network of connected information.

Simple definition:

> A knowledge graph stores knowledge as entities (things) and relationships (connections between things), making it easy to discover, reason about, and traverse connected information.

A knowledge graph answers questions like:

- What is this thing?
- How is it related to other things?
- What properties does it have?
- What can we infer from its connections?
- What patterns exist across the data?

The basic unit of a knowledge graph is the **triple**:

```text
(Subject) --[Predicate]--> (Object)
```

Example:

```text
(Albert Einstein) --[born_in]--> (Ulm, Germany)
(Albert Einstein) --[developed]--> (Theory of Relativity)
(Theory of Relativity) --[field]--> (Physics)
```

These triples form a connected graph. Every triple is a fact. Together, they build a web of knowledge.

---

## 2. Why Knowledge Graphs Matter

Knowledge graphs are important because:

- They represent complex, real-world information naturally
- They reveal hidden connections between data
- They provide context that flat data structures cannot
- They enable intelligent search and discovery
- They power recommendation systems
- They improve AI grounding and reasoning
- They support multi-hop question answering
- They integrate data from multiple sources
- They scale to billions of facts

Without knowledge graphs:

- Data stays isolated in separate tables
- Complex queries require many joins
- Hidden patterns are invisible
- AI systems lack structured world knowledge
- Information retrieval misses context
- Cross-domain connections are lost

Examples of knowledge graphs in production:

| Organization | Knowledge Graph | Purpose |
| --- | --- | --- |
| Google | Google Knowledge Graph | Powers search cards, "People also ask", and entity disambiguation |
| Meta | Social Graph | Connects people, posts, pages, groups, and events |
| Amazon | Product Graph | Links products, brands, categories, reviews, and buying patterns |
| LinkedIn | Economic Graph | Maps professionals, companies, skills, and job markets |
| Wikipedia | Wikidata | Structured knowledge base for all of Wikipedia |
| Apple | Siri Knowledge Graph | Powers Siri's understanding of entities and facts |
| Microsoft | LinkedIn + Bing Graph | Enhances search and professional recommendations |

---

## 3. Core Concepts

### 3.1 Entities (Nodes)

An entity is a distinct thing in the knowledge graph.

Examples:

- A person: Albert Einstein
- A city: Bengaluru
- A company: Google
- A concept: Machine Learning
- A product: iPhone 15
- An event: World War II
- A disease: Diabetes

Each entity has:

- A unique identifier (URI or ID)
- A type (person, place, concept, etc.)
- Properties (name, age, description, etc.)

### 3.2 Relationships (Edges)

A relationship connects two entities.

Examples:

- Einstein *born_in* Ulm
- Google *headquartered_in* Mountain View
- Machine Learning *subfield_of* Artificial Intelligence
- Python *used_for* Machine Learning

Each relationship has:

- A type (born_in, works_at, parent_of, etc.)
- A direction (from subject to object)
- Optional properties (since, until, confidence, etc.)

### 3.3 Triples

A triple is the smallest statement of fact in a knowledge graph.

Format:

```text
(Subject, Predicate, Object)
```

Examples:

```text
(Marie Curie, won, Nobel Prize in Physics)
(Marie Curie, born_in, Warsaw)
(Nobel Prize in Physics, awarded_in, 1903)
(Marie Curie, field, Radioactivity)
```

Triples can be chained to form paths:

```text
(Marie Curie) --[born_in]--> (Warsaw) --[located_in]--> (Poland) --[continent]--> (Europe)
```

This path answers: "Which continent was Marie Curie born on?"

### 3.4 Properties (Attributes)

Properties store additional data about entities or relationships.

Entity properties:

```text
Entity: Marie Curie
  name: "Marie Skłodowska Curie"
  born: 1867
  died: 1934
  nationality: "Polish-French"
  occupation: "Physicist, Chemist"
```

Relationship properties:

```text
Relationship: Marie Curie --[won]--> Nobel Prize in Physics
  year: 1903
  shared_with: ["Pierre Curie", "Henri Becquerel"]
```

### 3.5 Labels and Types

Labels classify entities into categories.

Examples:

```text
Marie Curie -> label: Person, Scientist
Nobel Prize -> label: Award
Warsaw -> label: City, Capital
```

Types help with:

- Filtering queries ("find all Scientists")
- Enforcing schema rules
- Organizing the graph
- Improving search relevance

### 3.6 Subgraphs

A subgraph is a portion of the knowledge graph focused on a specific topic or domain.

Examples:

- Medical subgraph: diseases, symptoms, treatments, drugs
- Corporate subgraph: companies, employees, products, investors
- Academic subgraph: papers, authors, institutions, citations

Subgraphs can be combined to build richer, cross-domain knowledge.

---

## 4. Types of Knowledge Graphs

### 4.1 By Domain

| Type | Description | Example |
| --- | --- | --- |
| General-purpose | Covers broad world knowledge | Wikidata, DBpedia, Google Knowledge Graph |
| Domain-specific | Focused on one field | SNOMED CT (medical), Gene Ontology (biology) |
| Enterprise | Internal company knowledge | Customer data graph, product catalog graph |
| Personal | Individual knowledge | User preference graph, personal notes graph |

### 4.2 By Construction Method

| Method | Description |
| --- | --- |
| Manual/Curated | Human experts add and verify facts |
| Automated extraction | NLP pipelines extract facts from text |
| Crowdsourced | Community contributors add knowledge |
| Hybrid | Combination of automated extraction and human curation |

### 4.3 By Schema

| Type | Description |
| --- | --- |
| Schema-full | Strict ontology defines allowed types and relationships |
| Schema-less | Any entity or relationship type is allowed |
| Schema-flexible | Base schema with extensions allowed |

---

## 5. Knowledge Graph vs Relational Database

| Feature | Relational Database | Knowledge Graph |
| --- | --- | --- |
| Data model | Tables, rows, columns | Nodes, edges, properties |
| Relationships | Foreign keys and joins | First-class citizens, directly traversed |
| Schema | Fixed, defined upfront | Flexible, evolves naturally |
| Query pattern | Known queries, structured SQL | Exploratory, pattern-matching |
| Complex joins | Expensive with many tables | Natural traversal |
| New data types | Requires schema migration | Add new node/edge types freely |
| Best for | Transactional data, reports | Connected data, discovery, reasoning |
| Query language | SQL | SPARQL, Cypher, Gremlin |
| Example question | "How many orders did customer X place?" | "What connects customer X to product Y through shared interests and social connections?" |

When to use a relational database:

- Simple, well-known data structures
- Heavy transactional workloads
- ACID compliance is critical
- Flat querying with few relationships

When to use a knowledge graph:

- Data is highly connected
- Relationships are important
- You need to discover unknown connections
- Schema changes frequently
- Multi-hop reasoning is needed
- You are integrating data from many sources

Many production systems use both.

---

## 6. How Knowledge Graphs Work

### 6.1 Data Storage

Knowledge graphs are stored as either:

**Triple stores:**

Store data as subject-predicate-object triples. Used with RDF (Resource Description Framework).

```text
<http://example.org/marie_curie> <http://example.org/born_in> <http://example.org/warsaw> .
<http://example.org/marie_curie> <http://example.org/won> <http://example.org/nobel_physics> .
```

**Property graphs:**

Store data as nodes and edges, each with properties.

```text
Node: { id: 1, label: "Person", name: "Marie Curie", born: 1867 }
Node: { id: 2, label: "City", name: "Warsaw" }
Edge: { from: 1, to: 2, type: "born_in" }
```

### 6.2 Querying

Knowledge graphs are queried by pattern matching.

Example query: "Who did Marie Curie share the Nobel Prize with?"

```text
(Marie Curie) --[shared_prize_with]--> (?) 
```

The graph traverses from the Marie Curie node, follows the shared_prize_with edge, and returns the connected nodes.

### 6.3 Inference and Reasoning

Knowledge graphs can infer new facts from existing ones.

Rule:

```text
IF (X born_in Y) AND (Y located_in Z) THEN (X nationality_related_to Z)
```

Known facts:

```text
(Marie Curie, born_in, Warsaw)
(Warsaw, located_in, Poland)
```

Inferred fact:

```text
(Marie Curie, nationality_related_to, Poland)
```

This is called **reasoning** or **logical inference**. It lets the graph answer questions that were never explicitly stored.

### 6.4 Graph Traversal

Traversal means following edges from one node to discover connected information.

Example: "Find all scientists who worked in the same field as Einstein."

```text
Step 1: Einstein --[field]--> Physics
Step 2: Physics <--[field]-- ? (find all scientists with field = Physics)
Step 3: Return: Marie Curie, Niels Bohr, Richard Feynman, ...
```

Multi-hop traversal:

```text
Einstein --[studied_at]--> ETH Zurich --[located_in]--> Zurich --[country]--> Switzerland
```

Answer: Einstein studied in Switzerland.

---

## 7. Building a Knowledge Graph

### 7.1 The Pipeline

```text
Data sources
  -> Extract entities
  -> Extract relationships
  -> Resolve duplicates
  -> Validate facts
  -> Store in graph database
  -> Build indexes
  -> Serve queries
```

Short version:

```text
Extract -> Resolve -> Validate -> Store -> Query
```

### 7.2 Step 1: Identify Data Sources

Common sources:

- Structured data: databases, spreadsheets, APIs
- Semi-structured data: JSON, XML, HTML tables
- Unstructured data: documents, articles, PDFs, emails
- Existing ontologies: Wikidata, Schema.org, SNOMED CT

### 7.3 Step 2: Entity Extraction

Entity extraction finds the things mentioned in data.

Methods:

| Method | Description | Example |
| --- | --- | --- |
| Named Entity Recognition (NER) | NLP model identifies entities in text | "Marie Curie won the Nobel Prize" → Person: Marie Curie, Award: Nobel Prize |
| Pattern matching | Regular expressions or rules | Dates, phone numbers, product codes |
| Dictionary lookup | Match against known entities | Company names, drug names |
| LLM-based extraction | Use a language model to extract structured facts | "Extract all people, places, and events from this text" |

### 7.4 Step 3: Relationship Extraction

Relationship extraction identifies how entities are connected.

Methods:

| Method | Description |
| --- | --- |
| Rule-based | "X won Y" → (X, won, Y) |
| Dependency parsing | Analyze sentence structure to find subject-verb-object |
| Supervised ML | Train a classifier on labeled relationship examples |
| LLM-based | Prompt a language model to extract triples |

Example prompt for LLM-based extraction:

```text
Extract all factual triples from the following text.
Return each triple as (subject, relationship, object).

Text:
"Marie Curie was born in Warsaw in 1867. She won the Nobel Prize in Physics in 1903."

Expected output:
(Marie Curie, born_in, Warsaw)
(Marie Curie, born_year, 1867)
(Marie Curie, won, Nobel Prize in Physics)
(Nobel Prize in Physics, awarded_year, 1903)
```

### 7.5 Step 4: Entity Resolution

Entity resolution merges different mentions of the same real-world entity.

Problem:

```text
"Marie Curie"
"M. Curie"
"Marie Skłodowska Curie"
"Madam Curie"
```

All refer to the same person. Entity resolution identifies and merges them into one node.

Techniques:

- String similarity (fuzzy matching)
- Coreference resolution (NLP)
- Linked data matching (match to Wikidata IDs)
- Embedding similarity
- Human review for ambiguous cases

### 7.6 Step 5: Validation

Validate the graph:

- Are triples factually correct?
- Are entity types consistent?
- Are relationships logically valid?
- Are there duplicate or conflicting facts?
- Is confidence scored for uncertain facts?

### 7.7 Step 6: Storage

Choose a storage backend:

| Database | Type | Query Language |
| --- | --- | --- |
| Neo4j | Property graph | Cypher |
| Amazon Neptune | Property graph + RDF | Gremlin, SPARQL |
| Apache Jena | RDF triple store | SPARQL |
| Stardog | RDF + reasoning | SPARQL |
| ArangoDB | Multi-model | AQL |
| TigerGraph | Property graph | GSQL |
| Dgraph | Property graph | DQL (GraphQL-based) |

---

## 8. Ontologies and Schemas

An ontology defines the types of entities, relationships, and rules that a knowledge graph uses.

### 8.1 Why Ontologies Matter

Without an ontology:

- Anyone can add any relationship type
- The graph becomes inconsistent
- Queries become unreliable
- Reasoning is impossible

With an ontology:

- Entity types are defined (Person, Organization, Location)
- Relationship types are constrained (born_in only connects Person to Location)
- Properties have expected types (born_year is an integer)
- Inheritance is possible (Scientist is a subclass of Person)

### 8.2 Common Ontology Languages

| Language | Description |
| --- | --- |
| RDFS | RDF Schema: basic classes and properties |
| OWL | Web Ontology Language: rich classes, restrictions, reasoning |
| SHACL | Shapes Constraint Language: validation rules for RDF |
| Schema.org | Widely used vocabulary for web structured data |

### 8.3 Example Ontology

```text
Classes:
  Person
    subclasses: Scientist, Artist, Politician
  Organization
    subclasses: University, Company, Government
  Location
    subclasses: City, Country, Continent
  Award
  Field

Relationships:
  born_in: Person -> Location
  works_at: Person -> Organization
  won: Person -> Award
  field: Person -> Field
  located_in: Location -> Location
  founded_in: Organization -> Location
  affiliated_with: Person -> Organization

Properties:
  Person: name (string), born (integer), died (integer)
  Organization: name (string), founded (integer)
  Location: name (string), population (integer)
  Award: name (string), year_established (integer)
```

### 8.4 Schema.org

Schema.org is a widely used vocabulary for structured data on the web. It is used by Google, Bing, and other search engines.

Example (JSON-LD):

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Marie Curie",
  "birthPlace": {
    "@type": "City",
    "name": "Warsaw"
  },
  "award": "Nobel Prize in Physics",
  "knowsAbout": "Radioactivity"
}
```

Search engines read this structured data to build rich search results (knowledge panels, cards, etc.).

---

## 9. Knowledge Graph Query Languages

### 9.1 SPARQL (for RDF Graphs)

SPARQL is the standard query language for RDF knowledge graphs.

Basic structure:

```sparql
SELECT ?variable
WHERE {
  ?subject ?predicate ?object .
}
```

Example: "Find all scientists born in Warsaw"

```sparql
SELECT ?scientist ?name
WHERE {
  ?scientist rdf:type ex:Scientist .
  ?scientist ex:born_in ex:Warsaw .
  ?scientist ex:name ?name .
}
```

Example: "Find all people who won a Nobel Prize and their fields" (multi-hop)

```sparql
SELECT ?person ?name ?field
WHERE {
  ?person ex:won ?award .
  ?award rdf:type ex:NobelPrize .
  ?person ex:field ?field .
  ?person ex:name ?name .
}
```

### 9.2 Cypher (for Neo4j)

Cypher is the query language for Neo4j, the most popular property graph database.

Basic structure:

```cypher
MATCH (pattern)
WHERE condition
RETURN result
```

Example: "Find all scientists born in Warsaw"

```cypher
MATCH (s:Scientist)-[:BORN_IN]->(c:City {name: "Warsaw"})
RETURN s.name
```

Example: "Find paths between Einstein and Marie Curie"

```cypher
MATCH path = shortestPath(
  (a:Person {name: "Albert Einstein"})-[*]-(b:Person {name: "Marie Curie"})
)
RETURN path
```

Example: "Find friends of friends who work in AI"

```cypher
MATCH (me:Person {name: "Alice"})-[:FRIEND]->(friend)-[:FRIEND]->(fof)-[:WORKS_IN]->(f:Field {name: "AI"})
WHERE fof <> me
RETURN DISTINCT fof.name
```

### 9.3 Gremlin (for Apache TinkerPop)

Gremlin is a graph traversal language used by many graph databases.

Example: "Find all scientists born in Warsaw"

```groovy
g.V().hasLabel('Scientist').out('born_in').has('name', 'Warsaw').in('born_in').values('name')
```

### 9.4 Choosing a Query Language

| Language | Best for | Used by |
| --- | --- | --- |
| SPARQL | RDF data, linked data, ontology-heavy graphs | Apache Jena, Stardog, Amazon Neptune |
| Cypher | Property graphs, intuitive pattern matching | Neo4j |
| Gremlin | Procedural graph traversal | Amazon Neptune, JanusGraph, CosmosDB |

---

## 10. Knowledge Graph Embeddings

Knowledge graph embeddings convert entities and relationships into numerical vectors that machine learning models can use.

### 10.1 Why Embeddings

Knowledge graphs are symbolic (names and labels). Machine learning models need numbers. Embeddings bridge this gap.

Uses:

- Link prediction: predict missing relationships
- Entity classification: predict entity types
- Recommendation: find similar entities
- Clustering: group related entities
- Search: find semantically similar nodes

### 10.2 How Embeddings Work

Each entity and relationship is mapped to a vector in a continuous space.

The goal: if `(h, r, t)` is a true triple, then the embedding should satisfy:

```text
embedding(h) + embedding(r) ≈ embedding(t)
```

Example:

```text
embedding(Marie Curie) + embedding(born_in) ≈ embedding(Warsaw)
```

### 10.3 Popular Embedding Models

| Model | Idea | Year |
| --- | --- | --- |
| TransE | Translational distance: h + r ≈ t | 2013 |
| TransR | Projects entities into relation-specific spaces | 2015 |
| DistMult | Bilinear diagonal model | 2015 |
| ComplEx | Complex-valued embeddings for asymmetric relations | 2016 |
| RotatE | Rotation in complex space | 2019 |
| ConvE | Convolutional neural network for scoring | 2018 |

### 10.4 Link Prediction

Link prediction uses embeddings to guess missing facts.

Known facts:

```text
(Einstein, field, Physics)
(Einstein, born_in, Ulm)
(Bohr, field, Physics)
(Bohr, born_in, ?)
```

The model predicts:

```text
(Bohr, born_in, Copenhagen)  → high score
(Bohr, born_in, Tokyo)       → low score
```

Link prediction is used for knowledge graph completion, recommendation engines, and drug discovery.

### 10.5 Tools for Knowledge Graph Embeddings

| Tool | Description |
| --- | --- |
| PyKEEN | Python library for knowledge graph embeddings |
| DGL-KE | Distributed knowledge graph embedding training |
| AmpliGraph | Python library for embedding models |
| OpenKE | Open-source embedding toolkit |
| LibKGE | Research-focused embedding library |

---

## 11. Knowledge Graphs and AI

Knowledge graphs enhance AI systems in several ways.

### 11.1 AI Applications of Knowledge Graphs

| Application | How the knowledge graph helps |
| --- | --- |
| Search engines | Understand entities, disambiguate queries, show knowledge panels |
| Chatbots | Provide structured facts for grounded answers |
| Recommendation | Find connections between users, products, and preferences |
| Question answering | Traverse the graph to answer multi-hop questions |
| Drug discovery | Connect diseases, genes, proteins, and drugs |
| Fraud detection | Reveal hidden connections between entities |
| Supply chain | Map suppliers, components, and dependencies |
| Compliance | Connect regulations, policies, and business processes |

### 11.2 Knowledge-Grounded AI

Traditional AI:

```text
User: "Who founded Google?"
Model: (relies on training data, may hallucinate)
```

Knowledge-grounded AI:

```text
User: "Who founded Google?"
System: Query knowledge graph → (Google, founded_by, [Larry Page, Sergey Brin])
Model: "Google was founded by Larry Page and Sergey Brin." (grounded, verifiable)
```

Benefits:

- Fewer hallucinations
- Verifiable answers
- Up-to-date information
- Traceable reasoning

### 11.3 Knowledge Graphs for Agents

AI agents can use knowledge graphs as:

- A structured memory store
- A reasoning backbone for multi-step planning
- A constraint system for safe actions
- A context source for grounded tool use

Example agent workflow:

```text
User: "Book me a meeting with the project lead for Project Alpha."
Agent:
  Step 1: Query KG → (Project Alpha, lead, Sarah Chen)
  Step 2: Query KG → (Sarah Chen, email, sarah@company.com)
  Step 3: Query KG → (Sarah Chen, calendar_system, Google Calendar)
  Step 4: Use calendar tool to find available slot
  Step 5: Send meeting invite
```

---

## 12. Knowledge Graphs and RAG

Knowledge graphs significantly improve Retrieval-Augmented Generation (RAG) systems.

### 12.1 Traditional RAG vs Graph-Enhanced RAG

Traditional RAG:

```text
User question → Vector search → Retrieve text chunks → Generate answer
```

Problem: Vector search finds semantically similar text but misses structured connections.

Graph-enhanced RAG (GraphRAG):

```text
User question → Extract entities → Query knowledge graph → Retrieve connected facts → Optionally also do vector search → Combine structured + unstructured context → Generate answer
```

### 12.2 Why GraphRAG is Better for Complex Questions

Simple question:

```text
"What is photosynthesis?"
→ Regular RAG works well. Just retrieve a relevant paragraph.
```

Complex, multi-hop question:

```text
"Which drugs treat diseases caused by the same gene that is associated with BRCA1?"
→ Regular RAG struggles. It needs to:
  1. Find diseases associated with BRCA1
  2. Find drugs that treat those diseases
  3. Return the combined answer
→ GraphRAG handles this naturally through traversal.
```

### 12.3 GraphRAG Workflow

```text
User question: "What other companies did the founders of OpenAI start?"

Step 1: Extract entities from question → [OpenAI]
Step 2: Query KG → (OpenAI, founded_by, [Sam Altman, Greg Brockman, Elon Musk, ...])
Step 3: Query KG → (Sam Altman, founded, [Loopt, Worldcoin])
                    (Elon Musk, founded, [SpaceX, Tesla, Neuralink, ...])
Step 4: Combine KG results with any retrieved text
Step 5: Generate grounded answer
```

### 12.4 Building a GraphRAG System

Components:

| Component | Purpose |
| --- | --- |
| Knowledge graph | Structured facts and relationships |
| Entity linker | Map question entities to graph nodes |
| Graph query engine | Traverse graph based on question |
| Vector store | Store unstructured text chunks |
| Hybrid retriever | Combine graph results and vector results |
| LLM | Generate final answer from combined context |

### 12.5 GraphRAG Prompt Template

```text
Answer the question using the structured facts and text sources provided.
Prefer structured facts for specific claims.
If the answer requires information not in the provided context, say you do not know.

Question:
{{question}}

Structured facts from knowledge graph:
{{kg_triples}}

Text sources:
{{retrieved_chunks}}

Output:
- Direct answer
- Key facts used
- Sources
- Uncertainty
```

---

## 13. Knowledge Graphs and LLMs

Large Language Models and knowledge graphs complement each other.

### 13.1 LLMs Strengths and Weaknesses

| Strength | Weakness |
| --- | --- |
| Excellent at language understanding | Can hallucinate facts |
| Good at reasoning over text | Knowledge is frozen at training time |
| Flexible, can handle any question | No source attribution |
| Good at summarization | Cannot be efficiently updated |

### 13.2 Knowledge Graph Strengths and Weaknesses

| Strength | Weakness |
| --- | --- |
| Structured, verifiable facts | Cannot understand natural language |
| Always up to date (when maintained) | Cannot reason over unstructured text |
| Full source attribution | Requires schema design |
| Efficient for connected queries | Cannot generate natural language |

### 13.3 How They Complement Each Other

```text
LLM + Knowledge Graph = Grounded, up-to-date, verifiable AI

LLM provides: language understanding, reasoning, generation
KG provides: structured facts, source attribution, freshness, verification
```

### 13.4 Integration Patterns

**Pattern 1: KG as context for LLM**

```text
User question → Query KG → Pass facts to LLM → Generate grounded answer
```

**Pattern 2: LLM builds the KG**

```text
Documents → LLM extracts entities and relationships → Store in KG
```

**Pattern 3: LLM queries the KG**

```text
User question → LLM generates graph query (Cypher/SPARQL) → Execute query → LLM formats result
```

**Pattern 4: KG validates LLM output**

```text
LLM generates answer → Check claims against KG → Flag unsupported statements
```

### 13.5 Using LLMs to Build Knowledge Graphs

Prompt for triple extraction:

```text
Extract all factual relationships from the following text.
Return each fact as a JSON triple: {"subject": "", "predicate": "", "object": ""}
Only extract facts that are explicitly stated. Do not infer.

Text:
{{input_text}}
```

Prompt for ontology design:

```text
Given the following domain description, suggest an ontology with:
1. Entity types (classes)
2. Relationship types with domain and range
3. Key properties for each entity type

Domain:
{{domain_description}}

Return as structured JSON.
```

### 13.6 Using LLMs to Query Knowledge Graphs

Natural language to Cypher:

```text
You are a Neo4j expert. Convert the user's question to a Cypher query.

Graph schema:
Nodes: Person (name, born), Company (name, founded), City (name, country)
Relationships: WORKS_AT (Person -> Company), BORN_IN (Person -> City), LOCATED_IN (Company -> City)

Question: "Which people work at companies located in Bengaluru?"

Return only the Cypher query.
```

Expected output:

```cypher
MATCH (p:Person)-[:WORKS_AT]->(c:Company)-[:LOCATED_IN]->(city:City {name: "Bengaluru"})
RETURN p.name, c.name
```

---

## 14. Graph Databases

### 14.1 What is a Graph Database

A graph database is a database designed to store, query, and traverse graph-structured data efficiently.

Unlike relational databases that use tables and joins, graph databases use index-free adjacency: each node directly references its neighbors, making traversal extremely fast regardless of total data size.

### 14.2 Popular Graph Databases

| Database | License | Query Language | Best For |
| --- | --- | --- | --- |
| Neo4j | Community (open) + Enterprise | Cypher | General purpose, most popular |
| Amazon Neptune | Managed (AWS) | Gremlin, SPARQL | Cloud-native, multi-model |
| ArangoDB | Open source | AQL | Multi-model (graph + document) |
| TigerGraph | Enterprise | GSQL | High-performance analytics |
| Dgraph | Open source | DQL | Distributed, horizontally scalable |
| JanusGraph | Open source | Gremlin | Big data, distributed |
| Stardog | Enterprise | SPARQL | Enterprise knowledge graphs, reasoning |
| Memgraph | Open source | Cypher | Real-time, streaming graph analytics |

### 14.3 Neo4j Quick Start

Install and run:

```bash
# Using Docker
docker run -d --name neo4j \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/password \
  neo4j:latest
```

Create data:

```cypher
// Create nodes
CREATE (einstein:Person {name: "Albert Einstein", born: 1879})
CREATE (curie:Person {name: "Marie Curie", born: 1867})
CREATE (physics:Field {name: "Physics"})
CREATE (nobel:Award {name: "Nobel Prize in Physics"})

// Create relationships
CREATE (einstein)-[:FIELD]->(physics)
CREATE (curie)-[:FIELD]->(physics)
CREATE (einstein)-[:WON]->(nobel)
CREATE (curie)-[:WON]->(nobel)
```

Query:

```cypher
// Find people who won the Nobel Prize in Physics
MATCH (p:Person)-[:WON]->(a:Award {name: "Nobel Prize in Physics"})
RETURN p.name, p.born
ORDER BY p.born
```

### 14.4 Python Integration

Using Neo4j with Python:

```python
from neo4j import GraphDatabase

driver = GraphDatabase.driver("bolt://localhost:7687", auth=("neo4j", "password"))

def find_scientists_in_field(field_name):
    with driver.session() as session:
        result = session.run(
            "MATCH (p:Person)-[:FIELD]->(f:Field {name: $field}) RETURN p.name",
            field=field_name
        )
        return [record["p.name"] for record in result]

scientists = find_scientists_in_field("Physics")
print(scientists)  # ["Albert Einstein", "Marie Curie"]
```

Using NetworkX for lightweight graphs:

```python
import networkx as nx

G = nx.DiGraph()

# Add nodes with properties
G.add_node("Einstein", type="Person", born=1879)
G.add_node("Physics", type="Field")
G.add_node("Nobel Prize", type="Award")

# Add edges
G.add_edge("Einstein", "Physics", relationship="field")
G.add_edge("Einstein", "Nobel Prize", relationship="won", year=1921)

# Query: find all things connected to Einstein
for neighbor in G.neighbors("Einstein"):
    edge_data = G.edges["Einstein", neighbor]
    print(f"Einstein --[{edge_data['relationship']}]--> {neighbor}")
```

---

## 15. Real-World Use Cases

### 15.1 Google Knowledge Graph

What it does:

- Powers the knowledge panels in Google Search
- Understands entities and their connections
- Disambiguates queries ("Apple" = company vs fruit)
- Contains billions of facts about people, places, and things

How it works:

```text
User searches "Marie Curie"
→ Google identifies entity: Marie Curie (Person)
→ Retrieves connected facts from knowledge graph
→ Displays knowledge panel: born, died, awards, field, spouse, etc.
```

### 15.2 Healthcare and Drug Discovery

Knowledge graphs connect:

- Diseases → Genes → Proteins → Drugs → Side effects

Example:

```text
Query: "Find drugs that target proteins associated with Alzheimer's disease"

Traversal:
  Alzheimer's --[associated_gene]--> APP, PSEN1, PSEN2
  APP --[encodes]--> Amyloid Precursor Protein
  Amyloid Precursor Protein <--[targets]-- Drug_X, Drug_Y
  
Result: Drug_X, Drug_Y target relevant proteins
```

Organizations using this approach: AstraZeneca, Pfizer, BenevolentAI.

### 15.3 Fraud Detection

Knowledge graphs detect fraud by revealing hidden connections:

```text
Account_A --[same_phone]--> Account_B
Account_B --[same_address]--> Account_C
Account_C --[transferred_to]--> Account_A

Pattern: Circular money transfer with shared identity signals → flag for review
```

Used by: PayPal, HSBC, Citibank.

### 15.4 Recommendation Systems

```text
User_Alice --[purchased]--> Product_A
Product_A --[category]--> Electronics
Product_A --[similar_to]--> Product_B
User_Bob --[purchased]--> Product_B
User_Bob --[also_purchased]--> Product_C

Recommendation for Alice: Product_C (connected through shared category and similar purchase patterns)
```

### 15.5 Enterprise Knowledge Management

```text
Employee_John --[works_on]--> Project_Alpha
Project_Alpha --[uses]--> Technology_Kubernetes
Technology_Kubernetes --[documented_in]--> Internal_Wiki_Page_42
Employee_Jane --[expert_in]--> Technology_Kubernetes

Query: "Who can help with Kubernetes issues on Project Alpha?"
Answer: Jane (expert) + Wiki Page 42 (documentation)
```

---

## 16. Common Mistakes and Fixes

| Mistake | Why It Hurts | Fix |
| --- | --- | --- |
| No ontology or schema | Graph becomes messy and inconsistent | Define entity types and relationship types before building |
| No entity resolution | Same entity appears as many duplicate nodes | Use name normalization, ID matching, and deduplication |
| Too many relationship types | Queries become complex, graph is hard to maintain | Use a curated set of canonical relationship types |
| Storing everything as properties | Loses connected structure, no traversal benefit | Model important attributes as separate nodes with edges |
| No validation pipeline | Incorrect or conflicting facts enter the graph | Add automated checks and human review for critical facts |
| Ignoring provenance | Cannot trace where a fact came from | Store source, timestamp, and confidence for every triple |
| Monolithic graph | Too large to query efficiently | Use subgraphs, partitioning, and focused domain graphs |
| No embeddings | Miss opportunities for ML-based discovery | Compute embeddings for link prediction and similarity |
| Building KG manually only | Does not scale beyond small datasets | Use NLP pipelines and LLMs for automated extraction |
| Not connecting to downstream apps | KG sits unused | Integrate KG with search, chatbots, RAG, and analytics |

---

## 17. Before and After Examples

### 17.1 Customer Support

Without knowledge graph:

```text
Customer: "I'm having issues with my Pro plan subscription."
Agent: (searches FAQ docs, finds generic plan info)
Answer: Generic FAQ response, customer has to repeat information.
```

With knowledge graph:

```text
Customer: "I'm having issues with my Pro plan subscription."
Agent:
  Step 1: Identify customer → Customer_ID_456
  Step 2: Query KG → (Customer_456, plan, Pro), (Customer_456, billing_status, overdue), 
                      (Pro, feature, 50GB_storage), (Customer_456, open_ticket, TICKET-789)
  Step 3: Generate grounded response with specific context
Answer: "I see your Pro plan billing is overdue since March 15. You also have an open ticket 
         TICKET-789 about storage. Let me help resolve both."
```

### 17.2 Search

Without knowledge graph:

```text
User: "Apple"
Search: Returns mix of fruit articles and company articles. No disambiguation.
```

With knowledge graph:

```text
User: "Apple"
Search: 
  → Entity identification: Apple Inc. (Company) vs Apple (Fruit)
  → Check user context (tech browsing history)
  → Show Apple Inc. knowledge panel + top results
  → Offer "Did you mean Apple (fruit)?" link
```

### 17.3 RAG System

Without knowledge graph:

```text
Question: "Which team members have experience with both Kubernetes and AWS?"
RAG: Searches text chunks, might find scattered mentions, 
     misses people not mentioned in same paragraph.
```

With knowledge graph:

```text
Question: "Which team members have experience with both Kubernetes and AWS?"
GraphRAG:
  MATCH (p:Person)-[:SKILLED_IN]->(s1:Skill {name: "Kubernetes"}),
        (p)-[:SKILLED_IN]->(s2:Skill {name: "AWS"})
  RETURN p.name
  
Result: ["Sarah Chen", "Raj Patel"] — complete, precise answer.
```

---

## 18. Step-by-Step Workflow

Use this workflow when building a knowledge graph from scratch.

### Step 1: Define the Domain

Write:

- What domain does this knowledge graph cover?
- What questions should it answer?
- Who will use it?
- What data sources are available?

Example:

```text
Domain: Company employee and project knowledge
Questions: Who works on what? Who has which skills? Where is documentation?
Users: Internal chatbot, HR system, project managers
Sources: HR database, project management tool, internal wiki, Slack
```

### Step 2: Design the Ontology

Define:

- Entity types (classes)
- Relationship types
- Properties for each type
- Constraints and rules

### Step 3: Identify and Prepare Data Sources

For each source:

- What format is it in?
- How do we extract entities?
- How do we extract relationships?
- How often does it update?
- How trustworthy is it?

### Step 4: Build the Extraction Pipeline

Create:

- Entity extraction (NER, LLM, or rule-based)
- Relationship extraction
- Entity resolution and deduplication
- Validation and quality checks
- Provenance tracking

### Step 5: Load into Graph Database

Choose:

- Graph database (Neo4j, Neptune, etc.)
- Import method (batch or streaming)
- Indexing strategy
- Backup plan

### Step 6: Build Query Interface

Create:

- API for graph queries
- Natural language to graph query translation (optional)
- Integration with downstream apps (chatbot, search, RAG)

### Step 7: Maintain and Evolve

Plan for:

- Regular data refresh
- New data source integration
- Ontology evolution
- Quality monitoring
- Performance optimization

---

## 19. Easy Learning Path

Follow this 7-day path if you are new.

### Day 1: Understand Graph Thinking

Goal:

- Understand nodes, edges, and triples.
- Think about information as connections, not tables.

Practice:

- Draw a knowledge graph of your family on paper. Include people, places, relationships.
- Draw a knowledge graph of your favorite movie. Include characters, locations, events.

### Day 2: Learn Triples and Ontologies

Goal:

- Write triples for a small domain.
- Create a simple ontology.

Practice:

- Write 20 triples about a topic you know (your university, your company, a sport).
- Define 3 entity types and 5 relationship types.

### Day 3: Try a Graph Database

Goal:

- Install and use Neo4j.
- Write basic Cypher queries.

Practice:

- Install Neo4j (Docker or Desktop).
- Create 10 nodes and 15 relationships.
- Write 5 queries: find, filter, traverse, count, shortest path.

### Day 4: Build a Small Knowledge Graph

Goal:

- Extract entities and relationships from text.

Practice:

- Take a Wikipedia article.
- Extract all people, places, and events mentioned.
- Convert them to triples.
- Load into Neo4j.
- Query the result.

### Day 5: Learn Knowledge Graph + AI

Goal:

- Understand how KGs improve AI systems.

Practice:

- Use an LLM to extract triples from text.
- Use the extracted triples as context for a Q&A prompt.
- Compare the answer quality with and without KG context.

### Day 6: Build a Simple GraphRAG

Goal:

- Combine knowledge graph retrieval with LLM generation.

Practice:

- Create a small knowledge graph about a topic.
- Write a function that extracts entities from a user question.
- Query the graph for connected facts.
- Pass the facts to an LLM with a grounded Q&A prompt.
- Test with 10 questions.

### Day 7: Evaluate and Improve

Goal:

- Test the accuracy of your knowledge graph system.

Practice:

- Create 15 test questions with expected answers.
- Run them through your system.
- Identify failures: missing facts, wrong traversals, hallucinations.
- Improve the graph, the retrieval, or the prompt.

### Beginner Project Ideas

1. Personal knowledge graph of your notes and bookmarks
2. Movie recommendation graph (movies, actors, genres, ratings)
3. Study topic graph (connect concepts across subjects)
4. Company org chart graph (people, teams, projects, skills)
5. Recipe knowledge graph (ingredients, cuisines, dietary tags, techniques)
6. Book knowledge graph (authors, genres, themes, characters)
7. GraphRAG chatbot for a small documentation set

---

## 20. Templates

### 20.1 Triple Extraction Template

```text
Extract all factual relationships from the text below.
Return each fact as a triple: (subject, predicate, object).
Only extract facts explicitly stated in the text.
Do not infer or guess.

Text:
{{input_text}}

Output format:
- (subject, predicate, object)
- (subject, predicate, object)
```

### 20.2 Ontology Design Template

```text
Domain:
{{domain_name}}

Entity types:
- {{type_1}}: {{description}}
- {{type_2}}: {{description}}
- {{type_3}}: {{description}}

Relationship types:
- {{relationship_1}}: {{from_type}} → {{to_type}} ({{description}})
- {{relationship_2}}: {{from_type}} → {{to_type}} ({{description}})

Properties:
- {{type_1}}: {{property_1}} ({{data_type}}), {{property_2}} ({{data_type}})
- {{type_2}}: {{property_1}} ({{data_type}})

Constraints:
- {{constraint_1}}
- {{constraint_2}}
```

### 20.3 Graph Query Template (Cypher)

```cypher
// Find entities of a specific type
MATCH (n:{{Label}})
WHERE n.{{property}} = "{{value}}"
RETURN n

// Find connected entities
MATCH (a:{{Label1}})-[:{{RELATIONSHIP}}]->(b:{{Label2}})
RETURN a, b

// Multi-hop traversal
MATCH path = (start:{{Label}} {name: "{{name}}"})-[*1..3]->(end)
RETURN path

// Aggregation
MATCH (p:Person)-[:WORKS_AT]->(c:Company)
RETURN c.name, count(p) AS employee_count
ORDER BY employee_count DESC
```

### 20.4 GraphRAG Prompt Template

```text
You are answering questions using structured facts from a knowledge graph and optional text sources.

Rules:
- Prefer knowledge graph facts for specific claims.
- Use text sources for additional context.
- If the answer is not in the provided context, say you do not know.
- Cite your sources (KG or text).

Question:
{{question}}

Knowledge graph facts:
{{kg_facts}}

Text sources:
{{text_chunks}}

Answer:
- Direct answer:
- Facts used:
- Sources:
- Confidence:
```

### 20.5 KG Evaluation Template

```text
Test name:
{{name}}

Question:
{{question}}

Expected graph traversal:
{{expected_path}}

Expected answer:
{{expected_answer}}

Pass criteria:
- {{criterion_1}}
- {{criterion_2}}

Fail criteria:
- {{failure_1}}
- {{failure_2}}
```

---

## 21. Glossary

Adjacency:
Two nodes are adjacent if they are directly connected by an edge.

Cypher:
A declarative query language for property graph databases, primarily used with Neo4j.

Directed graph:
A graph where edges have a direction (from source to target).

Edge:
A connection between two nodes in a graph. Also called a relationship.

Embedding:
A numerical vector representation of an entity or relationship, used for machine learning.

Entity:
A distinct thing represented as a node in a knowledge graph (person, place, concept, etc.).

Entity resolution:
The process of identifying that multiple references point to the same real-world entity.

Graph database:
A database designed to store, query, and traverse graph-structured data.

GraphRAG:
Retrieval-Augmented Generation enhanced with knowledge graph queries for structured retrieval.

Gremlin:
A graph traversal language used with Apache TinkerPop compatible databases.

Index-free adjacency:
A property of graph databases where each node directly references its neighbors, enabling fast traversal.

Inference:
Deriving new facts from existing facts using rules or reasoning.

Knowledge graph:
A structured representation of facts as entities and relationships forming a graph.

Link prediction:
Using machine learning to predict missing relationships in a knowledge graph.

Multi-hop:
A query that requires traversing multiple edges to reach the answer.

Node:
A point in a graph representing an entity. Also called a vertex.

Ontology:
A formal definition of entity types, relationship types, and rules for a knowledge graph.

OWL:
Web Ontology Language, used for defining rich ontologies with reasoning capabilities.

Property:
An attribute or data value attached to a node or edge.

Property graph:
A graph model where nodes and edges can have properties (key-value pairs).

Provenance:
Information about where a fact in the knowledge graph came from.

RDF:
Resource Description Framework, a standard for representing knowledge as subject-predicate-object triples.

Relationship:
A connection between two entities in a knowledge graph. Also called an edge or predicate.

Schema:
The structure that defines what types of entities and relationships are allowed in a knowledge graph.

SHACL:
Shapes Constraint Language, used for validating RDF data.

SPARQL:
A query language for RDF knowledge graphs.

Subgraph:
A portion of a larger graph, often focused on a specific domain or topic.

Traversal:
The process of following edges from node to node in a graph.

Triple:
The basic unit of a knowledge graph: (subject, predicate, object).

Triple store:
A database specifically designed to store and query RDF triples.

---

## 22. Quick Cheat Sheet

A knowledge graph answers:

- What things exist? (entities)
- How are they connected? (relationships)
- What properties do they have? (attributes)
- What can we infer? (reasoning)
- What is missing? (link prediction)

Building blocks:

```text
Node → Entity (Person, Company, Concept)
Edge → Relationship (works_at, born_in, related_to)
Triple → (Subject, Predicate, Object)
Ontology → Schema defining types and rules
```

Key technologies:

```text
Storage: Neo4j, Amazon Neptune, Stardog, ArangoDB
Query: Cypher, SPARQL, Gremlin
Standards: RDF, OWL, RDFS, SHACL, Schema.org
Embeddings: TransE, RotatE, ComplEx
Python: neo4j-driver, NetworkX, rdflib, PyKEEN
```

Integration with AI:

```text
KG → LLM context: ground answers in structured facts
LLM → KG builder: extract triples from text
LLM → KG query: generate Cypher/SPARQL from natural language
KG → RAG: GraphRAG for multi-hop question answering
```

Best practices:

- Define an ontology before building
- Always track provenance (source, confidence, timestamp)
- Use entity resolution to prevent duplicates
- Start small, iterate, and expand
- Validate extracted facts
- Compute embeddings for ML tasks
- Integrate with downstream applications
- Test with real questions

One-line summary:

> A knowledge graph turns disconnected data into connected, queryable, machine-understandable knowledge.

---

## 23. Further Reading

- Neo4j Documentation: https://neo4j.com/docs/
- Neo4j Cypher Manual: https://neo4j.com/docs/cypher-manual/
- W3C RDF Primer: https://www.w3.org/TR/rdf11-primer/
- W3C SPARQL Overview: https://www.w3.org/TR/sparql11-overview/
- W3C OWL Overview: https://www.w3.org/TR/owl2-overview/
- Schema.org: https://schema.org/
- Wikidata: https://www.wikidata.org/
- DBpedia: https://www.dbpedia.org/
- Google Knowledge Graph Search API: https://developers.google.com/knowledge-graph
- PyKEEN (Knowledge Graph Embeddings): https://pykeen.readthedocs.io/
- NetworkX Documentation: https://networkx.org/documentation/
- LangChain GraphRAG: https://python.langchain.com/docs/how_to/#graphs
- Knowledge Graphs Book (Hogan et al.): https://kgbook.org/
- Amazon Neptune: https://docs.aws.amazon.com/neptune/
- Stanford CS520 Knowledge Graphs Course: https://web.stanford.edu/class/cs520/
- TransE Paper (Bordes et al., 2013): https://papers.nips.cc/paper/2013/hash/1cecc7a77928ca8133fa24680a88d2f9-Abstract.html
