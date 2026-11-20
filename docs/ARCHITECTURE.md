# Architecture

## Overview

KHILAFAH AI runs as three deployable units:

1. **Backend** — a single FastAPI process (`backend/app/main.py`) that also
   imports `ai_engine`, `knowledge_graph`, and `simulations` as plain Python
   packages (not separate services). This keeps the MVP simple: one Python
   process, one `requirements.txt`, no internal network hop for AI/graph
   logic.
2. **Frontend** — a Next.js (App Router) + TypeScript + Tailwind app that
   talks to the backend exclusively over HTTP via `frontend/lib/api.ts`.
3. **Data stores** — PostgreSQL (with the `pgvector` extension) for
   relational data and vector search, and Neo4j for the knowledge graph.

```
┌─────────────┐      HTTP/JSON      ┌──────────────────────────────┐
│  Next.js     │ ───────────────────▶│  FastAPI (backend/app)       │
│  frontend    │◀─────────────────── │  ├─ routers/*  (9 route grps)│
└─────────────┘                      │  ├─ imports ai_engine        │
                                      │  ├─ imports knowledge_graph  │
                                      │  └─ imports simulations      │
                                      └───────┬──────────┬──────────┘
                                              │          │
                                   SQL+vector │          │ Bolt
                                              ▼          ▼
                                      ┌──────────┐  ┌──────────┐
                                      │ Postgres │  │  Neo4j   │
                                      │+pgvector │  │          │
                                      └──────────┘  └──────────┘
                                              │
                                              ▼ HTTPS
                                      ┌──────────────┐
                                      │  OpenAI API  │
                                      └──────────────┘
```

## Request flow: chat / AI research (Module 1 + 6)

1. Frontend POSTs to `/api/chat` with the user's message and language.
2. `backend/app/routers/chat.py` creates/loads a `Conversation`, stores the
   user `Message`, then calls `ai_engine.agents.graph.run_query(...)`.
3. Inside the LangGraph workflow (`ai_engine/agents/graph.py`):
   - **Query Router Agent** classifies the question (history / economics /
     governance / education / general) — via an LLM call with a keyword
     fallback if that call fails.
   - The matching **domain agent** runs. For history/general questions, it
     first tries RAG over the user's own uploaded documents
     (`ai_engine/rag.py` + pgvector similarity search); if nothing relevant
     is found, it falls back to a general-knowledge answer with an explicit
     uncertainty note. Economics/governance agents ground their answers in
     the platform's own cited reference data (`simulations/*.py`).
   - **Source Verification Agent** reviews the draft answer and tightens
     uncertainty language before it's returned.
4. Every step appends to an `agent_trace` list returned to the frontend, so
   users can see which agents ran (without exposing private chain-of-thought
   reasoning).
5. The assistant's `Message` and an `AIRequestLog` row are saved.

If `OPENAI_API_KEY` isn't configured, step 3 raises `LLMNotConfiguredError`
immediately (checked before any LLM call), and the router returns a clean
HTTP 503 with an actionable message — the request never reaches a half-done
state or a 500 error.

## Request flow: document upload (Module 2)

1. Frontend POSTs a multipart form to `/api/documents/upload`.
2. The file is validated (extension, size) and saved to `UPLOAD_DIR`.
3. `ai_engine.chunking.extract_and_chunk()` extracts text (PDF via `pypdf`,
   or plain text) and splits it into overlapping ~1200-character chunks,
   tracking page numbers for PDFs.
4. `ai_engine.embeddings.embed_texts()` calls OpenAI's embeddings API.
5. Chunks + embeddings are stored as `DocumentChunk` rows with a pgvector
   `Vector(1536)` column.
6. If either step 3 or 4 fails (bad PDF, no API key, etc.), the document is
   still saved with `status="error_processing"` — the upload never crashes.
7. `/api/documents/search` embeds the query and does a cosine-distance
   nearest-neighbor search against `DocumentChunk.embedding` directly in
   Postgres via `pgvector`'s SQLAlchemy integration.

## Knowledge graph (Module 3)

`knowledge_graph/neo4j_client.py` lazily connects to Neo4j and caches the
driver only on success — a failed connection is retried on the next call
rather than permanently cached, so the app self-heals once Neo4j comes up.
Every graph-reading endpoint in `backend/app/routers/graph.py` catches
`ImportError` and connection failures and returns `{"degraded": true,
"message": "..."}` with an empty graph, rather than a 500 error.

## Why governance/economics are not pure LLM calls

`simulations/governance_models.py` and `simulations/economics_models.py`
hold small, hand-curated, cited reference data and pure-math calculations
(zakat, budget simulation). The corresponding agents and API routes ground
their answers in this data specifically so the platform doesn't rely on an
LLM to get exact nisab thresholds, rates, or historical claims right from
memory — reducing the risk of a fabricated fact slipping through.

## Database schema

See `backend/app/models.py` for the full SQLAlchemy models, and
`alembic/versions/*_initial_schema.py` for the real, autogenerated migration
applied against a live Postgres+pgvector instance during development.

Key tables: `users`, `documents`, `document_chunks` (with the vector
column), `conversations`, `messages`, `source_registry_entries`,
`ai_request_logs`, `feedback`, `academy_progress`.

## Why ai_engine/knowledge_graph/simulations are packages, not microservices

For an MVP meant to run on an 8GB Windows laptop, running five separate
services (auth, chat, RAG, graph, economics) would add operational
complexity (service discovery, inter-service auth, more containers) without
a corresponding benefit at this scale. They're structured as clean,
independently-testable Python packages with clear function-level contracts
(see `CONTRACT.md`), which keeps the door open to splitting them into
services later if load requires it.
