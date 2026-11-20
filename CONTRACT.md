# Internal Integration Contract — KHILAFAH AI

This file is the single source of truth for how the pieces fit together. Every
agent working on this repo must follow it exactly so the parts integrate
without manual glue work afterward.

## Repo layout (top-level, from /root/khilafah-ai)

```
khilafah-ai/
  requirements.txt        <- ONE requirements file for the whole Python side
  .env.example
  .gitignore
  docker-compose.yml
  README.md
  backend/
    app/
      main.py              <- FastAPI app, mounts all routers under /api
      config.py            <- pydantic-settings Settings, reads .env
      database.py          <- SQLAlchemy engine/session (Postgres)
      models.py            <- SQLAlchemy ORM models
      schemas.py            <- Pydantic request/response schemas
      security.py           <- password hashing (passlib/bcrypt), JWT create/verify
      deps.py                <- get_db, get_current_user, require_role
      rate_limit.py          <- simple in-memory/slowapi rate limiter
      routers/
        auth.py
        chat.py
        documents.py
        graph.py
        governance.py
        economics.py
        academy.py
        admin.py
    Dockerfile              <- runs `uvicorn backend.app.main:app` from repo root (WORKDIR /app, COPY whole repo)
  ai_engine/                 <- plain importable Python package, NOT a service
    __init__.py
    llm_client.py            <- Gemini client wrapper, model/base_url from config
    embeddings.py
    chunking.py
    rag.py
    prompts.py
    safety.py                <- prompt-injection input sanitization/guardrails
    agents/
      __init__.py
      state.py
      graph.py                <- LangGraph StateGraph wiring all 6 agents
      router_agent.py
      history_agent.py
      economics_agent.py
      governance_agent.py
      education_agent.py
      verification_agent.py
  knowledge_graph/            <- plain importable Python package, NOT a service
    __init__.py
    neo4j_client.py           <- driver singleton, reads NEO4J_* from env
    schema.cypher             <- constraints/indexes
    seed_data.py               <- sample entities/relationships (real, cited, small)
    ingest.py                  <- loads seed_data into Neo4j
  simulations/                 <- governance/economics simulation helper modules imported by backend routers
    governance_models.py
    economics_models.py
  data/
    sample_sources/            <- small real public-domain text excerpts + metadata
    source_registry.json
  frontend/                    <- Next.js 14 (App Router) + TypeScript + Tailwind
    ...
  tests/
    conftest.py
    test_auth.py
    test_documents.py
    test_economics.py
    test_governance.py
    test_academy.py
    test_chat.py               <- mocks ai_engine.llm_client so no real API key needed in CI
  scripts/
    seed_db.py                  <- seeds Postgres with sample users/sources
    run_eval.py                  <- runs ai_engine eval harness, writes docs/EVAL_REPORT.md data section
  deployment/
    render.md / railway.md style notes (actual content lives in docs/DEPLOYMENT.md)
  docs/
    ARCHITECTURE.md
    WINDOWS_SETUP.md
    TROUBLESHOOTING.md
    API.md
    DEPLOYMENT.md
    SECURITY.md
    EVAL_REPORT.md
```

**Run model**: ONE Python virtualenv, ONE `requirements.txt` at repo root, ONE
process: `uvicorn backend.app.main:app --reload` run **from the repo root**
(`/root/khilafah-ai` locally, or wherever the user extracts the zip), so that
`ai_engine`, `knowledge_graph`, and `simulations` are importable as sibling
top-level packages alongside `backend`. Backend routers import them directly,
e.g. `from ai_engine.rag import answer_question` — no network hop, no second
service. Only Postgres and Neo4j are separate services (via Docker Compose).
Frontend is a separate Next.js process hitting the backend over HTTP.

## Environment variables (.env.example must define ALL of these)

```
# App
APP_ENV=development
SECRET_KEY=change-me-to-a-random-64-char-string
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:3000

# Postgres
DATABASE_URL=postgresql+psycopg://khilafah:khilafah@localhost:5432/khilafah

# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=change-me
NEO4J_ENABLED=true

# Gemini
GEMINI_API_KEY=sk-your-key-here
GEMINI_API_BASE_URL=https://api.openai.com/v1
GEMINI_CHAT_MODEL=gpt-4o-mini
GEMINI_EMBEDDING_MODEL=text-embedding-3-small

# Uploads
MAX_UPLOAD_MB=20
UPLOAD_DIR=./data/uploads

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

`backend/app/config.py` must load exactly these names via `pydantic-settings`
(`BaseSettings`, `env_file=".env"`, reading from repo root). `ai_engine` and
`knowledge_graph` must read config by importing `backend.app.config.settings`
(no duplicate env parsing).

## API contract (all routes prefixed `/api`, JSON unless noted)

### Auth — `backend/app/routers/auth.py`
- `POST /api/auth/register` `{email, password, full_name}` -> `201 {id, email, full_name, role}`
- `POST /api/auth/login` form or JSON `{email, password}` -> `{access_token, token_type: "bearer"}`
- `GET /api/auth/me` (Bearer auth) -> `{id, email, full_name, role}`
Roles: `"user"` | `"admin"`. First registered user may be promoted to admin by
a seed script, not by self-registration.

### Chat / Islamic History AI + Agents (Module 1 + 6) — `routers/chat.py`
- `POST /api/chat` (Bearer auth) body:
  `{"message": str, "conversation_id": str | null, "language": "en"|"hi"|"ar" }`
  -> `{"conversation_id": str, "answer": str, "citations": [{"source_id": str,
  "title": str, "author": str|null, "page": int|null, "source_type": str}],
  "agent_trace": [{"agent": str, "summary": str}], "uncertainty_note": str|null}`
  Calls `ai_engine.agents.graph.run_query(message, language, user_id)` which
  returns exactly this shape (see ai_engine section). Router does NOT call the
  LLM directly — always goes through the agent graph.
- `GET /api/chat/history` (Bearer auth) -> list of past conversations for the user.

### Research Studio (Module 2) — `routers/documents.py`
- `POST /api/documents/upload` multipart `file` + `title`,`author`,`source_type`,
  `language`,`historical_period` (Bearer auth) -> `{document_id, status: "processing"|"ready"}`
  Pipeline: save file -> `ai_engine.chunking.extract_and_chunk(path)` ->
  `ai_engine.embeddings.embed_chunks(chunks)` -> store rows in `document_chunks`
  table (pgvector column `embedding vector(1536)`).
- `GET /api/documents` (Bearer auth, own docs only unless admin) -> list
- `GET /api/documents/{id}` -> metadata + status
- `DELETE /api/documents/{id}` -> owner or admin only
- `POST /api/documents/search` `{query, document_id?: str, top_k?: int=5}` ->
  `[{chunk_text, page, document_title, score}]` via
  `ai_engine.rag.search_chunks(...)`

### Knowledge Graph (Module 3) — `routers/graph.py`
- `GET /api/graph/graph?entity_type=&limit=100` -> `{"nodes":[{"id","label","type"}],
  "edges":[{"source","target","type"}]}` for visualization.
- `GET /api/graph/entity/{id}` -> entity detail + its relationships + related sources.
- `GET /api/graph/search?q=` -> matching entities.
If `NEO4J_ENABLED=false` or Neo4j is unreachable, these endpoints must return
`200` with an empty-but-valid graph and a `"degraded": true, "message": "..."`
field — never a 500, never fabricated nodes.

### Governance Research Lab (Module 4) — `routers/governance.py`
- `GET /api/governance/topics` -> list of topics from `simulations/governance_models.py` static dataset (small, real, cited — e.g. Diwan system, Shura concept, provincial administration under early caliphates), each item tagged `evidence_level: "established"|"disputed"|"academic_interpretation"`.
- `GET /api/governance/topics/{id}` -> full detail with source references.
- `GET /api/governance/compare?a={id}&b={id}` -> side-by-side structured comparison.

### Islamic Economics Lab (Module 5) — `routers/economics.py`
- `POST /api/economics/zakat` `{cash, gold_grams, silver_grams, trade_goods_value,
  liabilities, nisab_standard: "gold"|"silver"}` -> `{zakatable_wealth, nisab_threshold,
  zakat_due, rate: 0.025, assumptions: [str,...], disclaimer: str}`. Pure
  calculation in `simulations/economics_models.py`, no AI call, clearly labeled
  assumptions and a disclaimer that fiqh rulings vary by school/scholar.
- `GET /api/economics/waqf-info` -> static educational content with sources.
- `POST /api/economics/budget-simulation` `{revenue_sources: {...}, allocations: {...}}`
  -> computed totals/percentages (pure math, educational labeling).

### Learning Academy (Module 7) — `routers/academy.py`
- `GET /api/academy/paths` -> learning paths (static seed content + DB-tracked progress)
- `GET /api/academy/paths/{id}` -> lessons in path
- `GET /api/academy/lessons/{id}` -> lesson content + quiz questions (quiz
  questions must be generated/validated against `source_registry.json` entries
  only — if none available for a lesson, ship it with `quiz: null` and an
  empty-state note, never a fabricated quiz).
- `POST /api/academy/quiz/{lesson_id}/submit` (Bearer auth) `{answers:[...]}`
  -> score + progress update
- `GET /api/academy/progress` (Bearer auth) -> per-path completion %

### Admin Dashboard (Module 8) — `routers/admin.py` (role=admin only, else 403)
- `GET /api/admin/users`
- `GET /api/admin/documents` (all users' documents, with approve/reject)
- `PATCH /api/admin/documents/{id}/status` `{status: "approved"|"rejected"}`
- `GET /api/admin/stats` -> counts: users, documents, chat requests, avg latency
- `GET /api/admin/logs?limit=100` -> recent AI request logs (from `ai_request_logs` table)
- `GET /api/admin/feedback`

### Health — `backend/app/main.py`
- `GET /api/health` -> `{"status": "ok", "database": "ok"|"error", "neo4j": "ok"|"disabled"|"error"}`

## ai_engine function signatures (what backend imports)

```python
# ai_engine/rag.py
def search_chunks(db, query: str, document_id: str | None, top_k: int = 5) -> list[dict]: ...
def answer_from_documents(db, query: str, document_id: str | None) -> dict: ...  # {"answer","citations"}

# ai_engine/chunking.py
def extract_and_chunk(file_path: str, mime_type: str) -> list[dict]: ...  # [{"text","page"}]

# ai_engine/embeddings.py
def embed_texts(texts: list[str]) -> list[list[float]]: ...

# ai_engine/agents/graph.py
def run_query(message: str, language: str, user_id: str, db) -> dict:
    # returns {"answer","citations","agent_trace","uncertainty_note"}
    # MUST catch all LLM/timeout errors and return a graceful
    # {"answer": "I don't have verified sources for this.", "citations": [], ...}
    # rather than raising, and must NEVER invent citations.
```

Every agent/LLM call must go through `ai_engine.llm_client.chat()` so there is
one place that implements retries, timeouts (default 30s), and error handling.
`ai_engine.llm_client` must work when `GEMINI_API_KEY` is a placeholder (raise
a clear, caught `LLMNotConfiguredError` that routers turn into a friendly
`503 {"detail": "AI features require an Gemini API key. Add GEMINI_API_KEY to your .env file."}`)
rather than crashing the whole app at import time.

## knowledge_graph function signatures

```python
# knowledge_graph/neo4j_client.py
def get_driver():  # returns None if NEO4J_ENABLED=false or connection fails, logs a warning
def is_available() -> bool: ...

# knowledge_graph/ingest.py
def run_seed() -> dict:  # idempotent, returns {"nodes_created", "relationships_created"}
```

## Frontend contract

- All API calls go through `frontend/lib/api.ts`, a single typed client reading
  `NEXT_PUBLIC_API_URL` from env, attaching the JWT from localStorage.
- Pages live in `frontend/app/<route>/page.tsx` (Next.js App Router):
  `/`, `/login`, `/register`, `/dashboard`, `/chat`, `/research-studio`,
  `/knowledge-graph`, `/history-explorer`, `/governance-lab`, `/economics-lab`,
  `/academy`, `/profile`, `/admin`, `/pricing`.
- Theme tokens (Tailwind config): emerald `#0B6E4F` primary, charcoal `#1A1D1F`
  background, gold `#C9A24B` accent. Every page needs loading/empty/error states
  — no hardcoded fake data standing in for a live API call.

## Non-negotiable integrity rules (apply to every piece)

1. Never fabricate Islamic references, Quranic verses, Hadith, historical
   quotations, academic citations, scholars, or books. Any seed/sample content
   must be a small set of real, verifiable, properly-attributed public-domain
   or clearly-labeled-illustrative items.
2. When no verified source/data exists for something, the API/UI must show an
   explicit empty state and explain how to add sources — never silently
   invent content.
3. Governance/economics "simulation" output must be clearly labeled as
   illustrative/educational, separate from established historical fact.
4. No TODOs in code paths that are supposed to be "done" — if something is
   genuinely out of scope for this pass, it must be a clearly labeled stub
   that returns a real, honest "not yet implemented" response, not a silent
   no-op or fake success.
