# Embeddings & Vector Search

## Study Notes & Documentation

**Reference:** [Pinecone — Retrieval-Augmented Generation (RAG)](https://www.pinecone.io/learn/retrieval-augmented-generation/)

---

## Table of Contents

1. [Embeddings](#1-embeddings)
2. [Vector Similarity Search](#2-vector-similarity-search)
3. [Cosine Similarity](#3-cosine-similarity)
4. [Vector Indexing](#4-vector-indexing)
5. [Metadata Filtering](#5-metadata-filtering)
6. [Hybrid Search](#6-hybrid-search)
7. [RAG — Putting It All Together](#7-rag--putting-it-all-together)

---

## 1. Embeddings

### What Are Embeddings?

**Embeddings** are dense numerical representations (vectors) of data — text, images, audio, or any other content — that capture the **semantic meaning** of that data. They allow computers to understand and compare meanings, not just keywords.

From the [Pinecone RAG documentation](https://www.pinecone.io/learn/retrieval-augmented-generation/):

> *"The embedding model is a special type of LLM that converts the data chunk into a **vector embedding**, a numerical representation of the data's meaning. This allows computers to search for similar items based on the vector representation of the stored data."*

### How Embeddings Work

```
Input Text                    Embedding Model              Vector (Embedding)
─────────                    ───────────────              ─────────────────
"I love dogs"        ──▶     text-embedding-3   ──▶      [0.021, -0.034, 0.891, ..., 0.045]
                              (OpenAI)                    (1536 dimensions)

"I adore puppies"    ──▶     text-embedding-3   ──▶      [0.019, -0.031, 0.887, ..., 0.042]
                                                          ↑ Similar vector! (similar meaning)

"The stock market    ──▶     text-embedding-3   ──▶      [0.780, 0.234, -0.102, ..., 0.651]
 crashed today"                                           ↑ Very different vector (different topic)
```

### Key Properties of Embeddings

| Property | Description |
|----------|-------------|
| **Dense vectors** | Every dimension has a non-zero value (unlike sparse vectors) |
| **Fixed dimensionality** | Each model outputs vectors of a fixed size (e.g., 768, 1536, 3072) |
| **Semantic meaning** | Semantically similar content produces similar vectors |
| **Model-specific** | Different models produce different embedding spaces |
| **Lossy compression** | Some information is lost in the conversion |

### Example: Creating Embeddings with OpenAI

```python
from openai import OpenAI

client = OpenAI()

def create_embedding(text):
    """Convert text to a vector embedding using OpenAI."""
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    embedding = response.data[0].embedding
    print(f"Text: '{text}'")
    print(f"Vector dimensions: {len(embedding)}")
    print(f"First 5 values: {embedding[:5]}")
    return embedding

# Example usage
emb1 = create_embedding("How to train a machine learning model")
emb2 = create_embedding("Steps for building an ML pipeline")
emb3 = create_embedding("Best pizza restaurants in New York")

# emb1 and emb2 will be close together (similar topic)
# emb3 will be far from both (different topic)
```

### Popular Embedding Models

| Model | Provider | Dimensions | Best For |
|-------|----------|------------|----------|
| `text-embedding-3-small` | OpenAI | 1536 | General text, cost-effective |
| `text-embedding-3-large` | OpenAI | 3072 | Highest accuracy |
| `all-MiniLM-L6-v2` | Sentence Transformers | 384 | Fast, lightweight, open-source |
| `BAAI/bge-large-en-v1.5` | BAAI | 1024 | High-quality open-source |
| `Cohere embed-v3` | Cohere | 1024 | Multi-language support |

### Chunking Before Embedding

From the Pinecone docs:

> *"You may need to chunk it by dividing each piece of data, or document, into smaller chunks. Depending on the kind of data you have, the types of queries your users have, and how the results will be used in your application, you'll need to choose a **chunking strategy**."*

```
Original Document (5000 words)
        │
        ▼
   ┌────────────┐
   │  Chunking  │  ← Split into manageable pieces
   └────┬───────┘
        │
   ┌────┴─────────────────────────────┐
   │         │          │             │
   ▼         ▼          ▼             ▼
 Chunk 1   Chunk 2   Chunk 3   ... Chunk N
 (512 tok) (512 tok) (512 tok)     (512 tok)
   │         │          │             │
   ▼         ▼          ▼             ▼
 Vector 1  Vector 2  Vector 3  ... Vector N
   │         │          │             │
   └─────────┴──────────┴─────────────┘
                    │
                    ▼
            Vector Database
            (e.g., Pinecone)
```

### Chunking Strategies

| Strategy | Description | Best For |
|----------|-------------|----------|
| **Fixed-size** | Split every N tokens/characters | Simple, predictable |
| **Sentence-based** | Split at sentence boundaries | Preserving meaning |
| **Paragraph-based** | Split at paragraph breaks | Structured documents |
| **Semantic** | Split based on topic changes | Complex documents |
| **Overlapping** | Chunks overlap by M tokens | Preserving context at boundaries |

---

## 2. Vector Similarity Search

### What Is Vector Similarity Search?

**Vector similarity search** (also called semantic search) finds items whose vector embeddings are **closest** to a query vector. Instead of matching keywords, it matches **meaning**.

```
Traditional Keyword Search:
  Query: "automobile repair"
  Finds: documents containing the words "automobile" and "repair"
  Misses: documents about "car maintenance" or "vehicle servicing"

Vector Similarity Search:
  Query: "automobile repair" → [0.82, 0.14, ...]  (embedding)
  Finds: documents semantically SIMILAR to the query meaning
  Matches: "car maintenance", "vehicle servicing", "fixing engines"
         (even without the exact words!)
```

### How It Works

```
Step 1: Embed the query
  "How do I fix my car?" ──▶ Query Vector [0.82, 0.14, 0.67, ...]

Step 2: Compare against all stored vectors
  ┌─────────────────────────────────────────────────┐
  │  Vector Database                                │
  │                                                 │
  │  Doc 1: "Car repair guide"     [0.80, 0.16, …] │ ← Distance: 0.05 ✅ CLOSE
  │  Doc 2: "Vehicle maintenance"  [0.78, 0.12, …] │ ← Distance: 0.08 ✅ CLOSE
  │  Doc 3: "Pizza recipes"        [0.12, 0.91, …] │ ← Distance: 0.89 ❌ FAR
  │  Doc 4: "Engine troubleshoot"  [0.75, 0.18, …] │ ← Distance: 0.12 ✅ CLOSE
  │                                                 │
  └─────────────────────────────────────────────────┘

Step 3: Return top-K closest results
  → Doc 1 (score: 0.95)
  → Doc 2 (score: 0.92)
  → Doc 4 (score: 0.88)
```

### Example: Similarity Search with Pinecone

```python
from pinecone import Pinecone
from openai import OpenAI

# Initialize
pc = Pinecone(api_key="YOUR_API_KEY")
index = pc.Index("knowledge-base")
openai_client = OpenAI()

# Step 1: Create embedding for the search query
def search(query, top_k=5):
    # Embed the query
    query_embedding = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=query
    ).data[0].embedding
    
    # Step 2: Search the vector database
    results = index.query(
        vector=query_embedding,
        top_k=top_k,
        include_metadata=True
    )
    
    # Step 3: Return results
    for match in results['matches']:
        print(f"Score: {match['score']:.4f} | {match['metadata']['title']}")
        print(f"  Text: {match['metadata']['text'][:100]}...")
        print()
    
    return results

# Example search
search("How do electric vehicles work?")
# Output:
# Score: 0.9234 | EV Battery Technology
#   Text: Electric vehicles use lithium-ion batteries to store energy...
# Score: 0.8891 | How Electric Motors Work
#   Text: The electric motor converts electrical energy into mechanical...
# Score: 0.8456 | Charging Infrastructure
#   Text: EV charging stations provide power to recharge vehicle batteries...
```

### Distance Metrics

| Metric | Formula | Range | When to Use |
|--------|---------|-------|-------------|
| **Cosine Similarity** | cos(θ) = (A·B) / (‖A‖·‖B‖) | -1 to 1 | Most common for text embeddings |
| **Euclidean (L2)** | √Σ(aᵢ - bᵢ)² | 0 to ∞ | When magnitude matters |
| **Dot Product** | Σ(aᵢ · bᵢ) | -∞ to ∞ | Normalized vectors, fast computation |

---

## 3. Cosine Similarity

### What Is Cosine Similarity?

**Cosine similarity** measures the **angle** between two vectors, regardless of their magnitude. It is the most commonly used metric for comparing text embeddings.

- **Score = 1.0**: Vectors point in the exact same direction (identical meaning)
- **Score = 0.0**: Vectors are perpendicular (unrelated)
- **Score = -1.0**: Vectors point in opposite directions (opposite meaning)

### Visual Intuition

```
                    ▲ Dimension 2
                    │
          B •       │
           ╲        │
            ╲ θ     │
             ╲      │
              ╲     │
               • A  │
                    │
────────────────────┼───────────────▶ Dimension 1

Cosine Similarity = cos(θ)

When θ is small  → cos(θ) ≈ 1 → Vectors are SIMILAR
When θ is 90°    → cos(θ) = 0 → Vectors are UNRELATED
When θ is 180°   → cos(θ) = -1 → Vectors are OPPOSITE
```

### Mathematical Formula

```
                    A · B            Σ(aᵢ × bᵢ)
cos(θ)  =  ─────────────── = ─────────────────────────
               ‖A‖ × ‖B‖      √Σ(aᵢ²) × √Σ(bᵢ²)

Where:
  A · B  = dot product of vectors A and B
  ‖A‖    = magnitude (length) of vector A
  ‖B‖    = magnitude (length) of vector B
```

### Example: Computing Cosine Similarity

```python
import numpy as np

def cosine_similarity(vec_a, vec_b):
    """Compute cosine similarity between two vectors."""
    dot_product = np.dot(vec_a, vec_b)
    magnitude_a = np.linalg.norm(vec_a)
    magnitude_b = np.linalg.norm(vec_b)
    
    if magnitude_a == 0 or magnitude_b == 0:
        return 0.0
    
    return dot_product / (magnitude_a * magnitude_b)

# Example with simple 3D vectors
vec_dogs    = np.array([0.9, 0.1, 0.2])   # "Dogs are great pets"
vec_puppies = np.array([0.85, 0.15, 0.25]) # "Puppies are adorable"
vec_stocks  = np.array([0.1, 0.9, 0.3])   # "Stock market crashed"

print(f"Dogs vs Puppies:  {cosine_similarity(vec_dogs, vec_puppies):.4f}")
# Output: 0.9952 → Very similar! ✅

print(f"Dogs vs Stocks:   {cosine_similarity(vec_dogs, vec_stocks):.4f}")
# Output: 0.3754 → Not similar ❌

print(f"Dogs vs Dogs:     {cosine_similarity(vec_dogs, vec_dogs):.4f}")
# Output: 1.0000 → Identical! ✅
```

### Real-World Example with Embeddings

```python
from openai import OpenAI
import numpy as np

client = OpenAI()

def get_embedding(text):
    response = client.embeddings.create(
        model="text-embedding-3-small", input=text
    )
    return np.array(response.data[0].embedding)

# Create embeddings
texts = [
    "Machine learning is a subset of artificial intelligence",
    "Deep learning uses neural networks with many layers",
    "I went to the grocery store to buy milk",
]

embeddings = [get_embedding(t) for t in texts]

# Compare all pairs
for i in range(len(texts)):
    for j in range(i + 1, len(texts)):
        sim = cosine_similarity(embeddings[i], embeddings[j])
        print(f"Similarity ({texts[i][:30]}... vs {texts[j][:30]}...): {sim:.4f}")

# Expected output:
# ML vs DL: ~0.85 (related AI topics)
# ML vs Grocery: ~0.15 (unrelated)
# DL vs Grocery: ~0.12 (unrelated)
```

### Why Cosine Similarity for Embeddings?

| Advantage | Explanation |
|-----------|-------------|
| **Scale invariant** | Doesn't depend on vector length — only direction matters |
| **Bounded range** | Always between -1 and 1, easy to interpret |
| **Fast to compute** | Simple dot product and norm operations |
| **Works with normalized vectors** | Most embedding models output normalized vectors |

---

## 4. Vector Indexing

### What Is Vector Indexing?

A **vector index** is a data structure that organizes vectors to enable **fast similarity search**. Without an index, finding the most similar vector requires comparing against every single vector in the database (brute force) — which becomes impossibly slow at scale.

```
Brute Force (No Index):
  Query vector compared to ALL 10 million vectors → O(n) → SLOW ❌

With Index:
  Query vector compared to a smart subset → O(log n) → FAST ✅
```

### Common Indexing Algorithms

#### 1. IVF (Inverted File Index)

Clusters vectors into groups. At query time, only searches the nearest clusters.

```
                    ┌──────────┐
                    │  All     │
                    │  Vectors │
                    └────┬─────┘
                         │
            ┌────────────┼────────────┐
            ▼            ▼            ▼
       ┌─────────┐ ┌─────────┐ ┌─────────┐
       │Cluster 1│ │Cluster 2│ │Cluster 3│
       │ (1000)  │ │ (1200)  │ │ (800)   │
       └─────────┘ └─────────┘ └─────────┘
            ▲
            │
     Query falls in Cluster 1
     → Only compare against 1000 vectors instead of 3000!
```

#### 2. HNSW (Hierarchical Navigable Small World)

A graph-based index where vectors are connected in a multi-layer graph. Searches navigate through layers from coarse to fine.

```
Layer 3 (few nodes):     A ───────── B
                         │           │
Layer 2 (more nodes):    A ─── C ─── B ─── D
                         │    │      │    │
Layer 1 (most nodes):    A─E─C─F─G─B─H─D─I

Search: Start at top layer, navigate down to find nearest neighbors
```

#### 3. PQ (Product Quantization)

Compresses vectors by splitting them into sub-vectors and encoding each with a codebook. Reduces memory and speeds up search.

```
Original: [0.12, 0.45, 0.78, 0.91, 0.34, 0.67, 0.23, 0.56]
                    │
         Split into sub-vectors
                    │
         [0.12, 0.45] | [0.78, 0.91] | [0.34, 0.67] | [0.23, 0.56]
              │              │              │              │
         Code: 42       Code: 17       Code: 88       Code: 3
              │              │              │              │
         Compressed: [42, 17, 88, 3]  ← Much smaller!
```

### Index Comparison

| Algorithm | Speed | Accuracy | Memory | Best For |
|-----------|-------|----------|--------|----------|
| **Flat (Brute Force)** | Slow | 100% exact | High | Small datasets (<100K) |
| **IVF** | Fast | ~95-99% | Medium | Medium datasets (100K-10M) |
| **HNSW** | Very Fast | ~98-99% | High | Large datasets, real-time search |
| **PQ** | Very Fast | ~90-95% | Very Low | Huge datasets (100M+) |
| **IVF-PQ** | Fast | ~92-97% | Low | Large datasets with memory constraints |

### Example: Creating a Pinecone Index

```python
from pinecone import Pinecone, ServerlessSpec

pc = Pinecone(api_key="YOUR_API_KEY")

# Create a vector index
pc.create_index(
    name="knowledge-base",
    dimension=1536,                    # Must match your embedding model
    metric="cosine",                   # cosine, euclidean, or dotproduct
    spec=ServerlessSpec(
        cloud="aws",
        region="us-east-1"
    )
)

index = pc.Index("knowledge-base")

# Upsert vectors with metadata
index.upsert(
    vectors=[
        {
            "id": "doc-1",
            "values": [0.1, 0.2, ...],    # 1536-dimensional embedding
            "metadata": {
                "title": "Machine Learning Basics",
                "category": "AI",
                "date": "2026-01-15"
            }
        },
        {
            "id": "doc-2", 
            "values": [0.3, 0.4, ...],
            "metadata": {
                "title": "Neural Network Architecture",
                "category": "AI",
                "date": "2026-02-20"
            }
        }
    ]
)
```

---

## 5. Metadata Filtering

### What Is Metadata Filtering?

**Metadata filtering** combines vector similarity search with traditional attribute-based filtering. Each vector in the database can have associated **metadata** (key-value pairs), and you can filter results based on these attributes.

```
Without Metadata Filter:
  Query: "machine learning" → Returns ALL similar documents (any category, any date)

With Metadata Filter:
  Query: "machine learning" + filter: category="AI" AND date > "2026-01-01"
  → Returns only AI-category documents from 2026 that are similar to the query
```

### Why Metadata Filtering?

| Use Case | Filter |
|----------|--------|
| Multi-tenant app | `user_id = "user_123"` (only search that user's data) |
| Time-limited search | `date > "2026-01-01"` (only recent documents) |
| Category scoping | `category = "legal"` (only legal documents) |
| Access control | `access_level in ["public", "internal"]` |
| Language filtering | `language = "en"` |

### Example: Querying with Metadata Filters

```python
# Search for AI-related documents from 2026 only
results = index.query(
    vector=query_embedding,
    top_k=5,
    include_metadata=True,
    filter={
        "category": {"$eq": "AI"},
        "date": {"$gte": "2026-01-01"},
        "access_level": {"$in": ["public", "internal"]}
    }
)

for match in results['matches']:
    print(f"Score: {match['score']:.4f}")
    print(f"Title: {match['metadata']['title']}")
    print(f"Category: {match['metadata']['category']}")
    print()
```

### Supported Filter Operators (Pinecone)

| Operator | Description | Example |
|----------|-------------|---------|
| `$eq` | Equal to | `{"category": {"$eq": "AI"}}` |
| `$ne` | Not equal to | `{"status": {"$ne": "deleted"}}` |
| `$gt` | Greater than | `{"price": {"$gt": 100}}` |
| `$gte` | Greater than or equal | `{"date": {"$gte": "2026-01-01"}}` |
| `$lt` | Less than | `{"age": {"$lt": 30}}` |
| `$lte` | Less than or equal | `{"score": {"$lte": 0.5}}` |
| `$in` | In list | `{"tag": {"$in": ["ai", "ml"]}}` |
| `$nin` | Not in list | `{"tag": {"$nin": ["spam"]}}` |

### Combining Filters

```python
# AND: both conditions must be true
filter = {
    "$and": [
        {"category": {"$eq": "AI"}},
        {"date": {"$gte": "2026-01-01"}}
    ]
}

# OR: at least one condition must be true
filter = {
    "$or": [
        {"category": {"$eq": "AI"}},
        {"category": {"$eq": "Data Science"}}
    ]
}
```

---

## 6. Hybrid Search

### What Is Hybrid Search?

**Hybrid search** combines two types of search to get the best of both worlds:

1. **Semantic search** (dense vectors) — Understands **meaning** and **context**
2. **Keyword/lexical search** (sparse vectors) — Matches **exact terms** and **specific words**

From the [Pinecone RAG documentation](https://www.pinecone.io/learn/retrieval-augmented-generation/):

> *"By using hybrid search, combining both semantic search (with dense vectors) and lexical search (with sparse vectors), you can improve the retrieval results even more. This becomes relevant when your users don't always use the same language to talk about a topic (semantic search) and they refer to internal, domain-specific language (lexical or keyword search) like acronyms, product names, or team names."*

### Why Hybrid Search?

```
Scenario: User searches for "BERT model performance"

Semantic Search Only:
  ✅ Finds: "Transformer-based language model accuracy" (understands meaning)
  ❌ Misses: "BERT-base evaluation on SQuAD" (doesn't prioritize exact term "BERT")

Keyword Search Only:
  ✅ Finds: "BERT-base evaluation on SQuAD" (matches keyword "BERT")
  ❌ Misses: "Transformer-based language model accuracy" (no keyword match)

Hybrid Search:
  ✅ Finds BOTH! Best of both worlds
```

### How Hybrid Search Works

```
User Query: "BERT model performance"
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────┐
│Semantic│ │ Keyword  │
│Search  │ │ Search   │
│(Dense) │ │ (Sparse) │
└───┬────┘ └────┬─────┘
    │           │
    ▼           ▼
 Results A   Results B
    │           │
    └─────┬─────┘
          ▼
   ┌────────────┐
   │  Combine & │
   │  De-dup    │
   └──────┬─────┘
          ▼
   ┌────────────┐
   │  Rerank    │  ← Reranking model scores all results
   └──────┬─────┘
          ▼
   Final Results
   (best of both)
```

### Dense vs Sparse Vectors

| | Dense Vectors | Sparse Vectors |
|--|--------------|----------------|
| **Type** | All dimensions have values | Most dimensions are zero |
| **Example** | [0.12, 0.45, 0.78, 0.91, ...] | [0, 0, 0.8, 0, 0, 0, 0.3, 0, ...] |
| **Created by** | Embedding models (OpenAI, etc.) | BM25, SPLADE, TF-IDF |
| **Captures** | Semantic meaning | Keyword/term frequency |
| **Good at** | Understanding synonyms, context | Exact term matching |

### Example: Hybrid Search with Pinecone

```python
from pinecone import Pinecone
from pinecone_text.sparse import BM25Encoder

# Initialize
pc = Pinecone(api_key="YOUR_API_KEY")
index = pc.Index("hybrid-knowledge-base")

# BM25 for sparse vectors (keyword matching)
bm25 = BM25Encoder()
bm25.fit(corpus)  # Fit on your document corpus

def hybrid_search(query, top_k=5, alpha=0.5):
    """
    Perform hybrid search combining semantic and keyword search.
    
    alpha: weight for dense vs sparse (0 = all sparse, 1 = all dense)
    """
    # Dense embedding (semantic)
    dense_embedding = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=query
    ).data[0].embedding
    
    # Sparse embedding (keyword)
    sparse_embedding = bm25.encode_queries(query)
    
    # Hybrid query
    results = index.query(
        vector=dense_embedding,
        sparse_vector=sparse_embedding,
        top_k=top_k,
        include_metadata=True
    )
    
    return results

# Search with hybrid approach
results = hybrid_search("BERT model performance on NLP benchmarks")
```

### Reranking

After combining results from both search methods, a **reranking model** scores all results for final ordering:

From the Pinecone docs:

> *"Then we combine and de-duplicate the results and use a reranking model to rerank them based on a unified relevance score, and return the most relevant matches."*

```python
# Example: Reranking with Cohere
import cohere

co = cohere.Client("YOUR_COHERE_API_KEY")

def rerank_results(query, documents, top_n=5):
    """Rerank search results using a cross-encoder model."""
    response = co.rerank(
        model="rerank-english-v3.0",
        query=query,
        documents=documents,
        top_n=top_n
    )
    
    for result in response.results:
        print(f"Score: {result.relevance_score:.4f} | Doc: {documents[result.index][:80]}...")
    
    return response
```

---

## 7. RAG — Putting It All Together

### What Is RAG?

From the [Pinecone documentation](https://www.pinecone.io/learn/retrieval-augmented-generation/):

> *"Retrieval-augmented generation, or RAG, is a technique that uses authoritative, external data to improve the accuracy, relevancy, and usefulness of a model's output."*

### Why RAG Is Needed

Foundation models have critical limitations:

| Limitation | Description |
|------------|-------------|
| **Knowledge cutoffs** | *"After a model is trained, this data is frozen at a specific point in time... leading them to generate plausible but incorrect responses when asked about recent developments."* |
| **Lack domain depth** | *"Foundation models have broad knowledge, but can lack depth in specialized domains."* |
| **No private data** | *"General-purpose models don't know the specifics of your business."* |
| **Trust erosion** | *"Models typically cannot cite their sources... users will lose trust in the model."* |
| **Hallucinations** | *"Models assign probabilities to all possible continuations, even the wrong ones."* |

### The RAG Pipeline (from Pinecone docs)

RAG has **four core components**:

```
┌──────────────────────────────────────────────────────────────────────┐
│                        RAG PIPELINE                                  │
│                                                                      │
│  1. INGESTION           2. RETRIEVAL       3. AUGMENT    4. GENERATE │
│  ┌──────────┐           ┌──────────┐      ┌─────────┐   ┌─────────┐│
│  │ Load     │           │ Embed    │      │ Combine │   │ LLM     ││
│  │ data     │           │ query    │      │ results │   │ Output  ││
│  │   ↓      │           │   ↓      │      │ + query │   │         ││
│  │ Chunk    │           │ Search   │      │ into    │   │ Answer  ││
│  │   ↓      │           │ vector   │      │ prompt  │   │ with    ││
│  │ Embed    │           │ DB       │      │         │   │ context ││
│  │   ↓      │           │   ↓      │      │         │   │         ││
│  │ Store in │           │ Rerank   │      │         │   │         ││
│  │ vectorDB │           │ results  │      │         │   │         ││
│  └──────────┘           └──────────┘      └─────────┘   └─────────┘│
│       ↑                      ↑                 │             │      │
│  (offline, batch)      (online, per query)     └─────────────┘      │
│                                                  Augmented prompt    │
└──────────────────────────────────────────────────────────────────────┘
```

### The Augmented Prompt (from Pinecone docs)

> *"An augmented prompt might look like this:"*

```
QUESTION: <the user's question>
CONTEXT: <the search results to use as context>

Using the CONTEXT provided, answer the QUESTION.
Keep your answer grounded in the facts of the CONTEXT.
If the CONTEXT doesn't contain the answer to the QUESTION, say you don't know.
```

### Complete RAG Example

```python
from openai import OpenAI
from pinecone import Pinecone

# Initialize
openai_client = OpenAI()
pc = Pinecone(api_key="PINECONE_API_KEY")
index = pc.Index("company-knowledge-base")

def rag_query(user_question, top_k=5):
    """
    Full RAG pipeline:
    1. Embed the user's question
    2. Retrieve relevant documents from the vector DB
    3. Augment the prompt with retrieved context
    4. Generate a grounded answer using the LLM
    """
    
    # === Step 1: EMBED the query ===
    query_embedding = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=user_question
    ).data[0].embedding
    
    # === Step 2: RETRIEVE relevant documents ===
    search_results = index.query(
        vector=query_embedding,
        top_k=top_k,
        include_metadata=True
    )
    
    # Extract the text content from results
    context_chunks = []
    sources = []
    for match in search_results['matches']:
        context_chunks.append(match['metadata']['text'])
        sources.append({
            'title': match['metadata'].get('title', 'Unknown'),
            'score': match['score']
        })
    
    context = "\n\n---\n\n".join(context_chunks)
    
    # === Step 3: AUGMENT the prompt ===
    augmented_prompt = f"""QUESTION: {user_question}

CONTEXT:
{context}

Using the CONTEXT provided, answer the QUESTION.
Keep your answer grounded in the facts of the CONTEXT.
If the CONTEXT doesn't contain the answer to the QUESTION, say you don't know.
Cite the sources used in your answer."""
    
    # === Step 4: GENERATE a response ===
    response = openai_client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that answers questions based on provided context."},
            {"role": "user", "content": augmented_prompt}
        ],
        temperature=0.2  # Low temperature for factual answers
    )
    
    answer = response.choices[0].message.content
    
    return {
        "answer": answer,
        "sources": sources
    }

# Usage
result = rag_query("What is our company's refund policy?")
print(f"Answer: {result['answer']}")
print(f"\nSources used:")
for src in result['sources']:
    print(f"  - {src['title']} (relevance: {src['score']:.4f})")
```

### Agentic RAG

From the Pinecone docs:

> *"With the rise of AI agents, agents are now orchestrators of the core RAG components to: construct more effective queries, access additional retrieval tools, evaluate the accuracy and relevance of the retrieved context, and apply reasoning to validate retrieved information."*

> *"With agentic RAG, it's about deciding which questions to ask, which tools to use, when to use them, and then aggregating results to ground answers."*

```
Traditional RAG:
  User Query → Embed → Search → Augment → Generate → Answer

Agentic RAG:
  User Query → Agent decides:
      ├── "Need more info" → Reformulate query → Search again
      ├── "Check another source" → Query different tool/DB
      ├── "Validate this" → Cross-reference results
      └── "Good enough" → Augment → Generate → Answer
```

### RAG Benefits Summary

| Benefit | Description |
|---------|-------------|
| **Real-time data** | Access current information beyond training cutoff |
| **Trust** | Cite sources so users can verify |
| **Control** | Choose which sources, apply guardrails and compliance |
| **Cost-effective** | Cheaper than fine-tuning or retraining models |

---

## Summary

| Concept | Key Takeaway |
|---------|-------------|
| **Embeddings** | Numerical vectors that capture semantic meaning of text/data |
| **Vector Similarity Search** | Find items by meaning similarity, not keyword matching |
| **Cosine Similarity** | Measures angle between vectors; most common metric for text |
| **Vector Indexing** | Data structures (IVF, HNSW, PQ) for fast approximate search |
| **Metadata Filtering** | Combine vector search with attribute filters for precision |
| **Hybrid Search** | Fuse semantic (dense) + keyword (sparse) search for best results |
| **RAG** | Use retrieval to augment LLM prompts with authoritative data |

---

## References

- [Pinecone — Retrieval-Augmented Generation (RAG)](https://www.pinecone.io/learn/retrieval-augmented-generation/)
- [Pinecone — Chunking Strategies](https://www.pinecone.io/learn/chunking-strategies/)
- [Pinecone — Hybrid Search](https://docs.pinecone.io/guides/search/hybrid-search)
- [Pinecone — Sparse Retrieval](https://www.pinecone.io/learn/sparse-retrieval/)
- [Pinecone — Rerank](https://www.pinecone.io/learn/refine-with-rerank/)
- [Pinecone — What is a Vector Database?](https://www.pinecone.io/learn/vector-database/)
