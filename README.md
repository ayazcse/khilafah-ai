# KHALAF

**KHALAF — The Next Generation of Knowledge & Connection.**

A connected educational, research and community platform for exploring Islamic civilization
history, historical governance, and Islamic economics — with citations,
uncertainty labeling, and a clear separation between established historical
fact, disputed claims, academic interpretation, and illustrative simulation.

This is an **educational and historical research platform only**. It does not
promote violence, extremism, or unlawful political activity, and it never
fabricates Islamic references, Quranic verses, Hadith, historical quotations,
or academic citations — where a specific citation can't be confidently
verified, content is labeled as general academic consensus instead.

---

## Brand identity

**KHALAF (خَلَف)** is an Arabic-rooted name meaning a successor or one who comes after. The brand represents a new generation of knowledge, connection, learning and civilizational research. The existing repository slug and deployment identifiers are intentionally retained during this safe visual rebrand.

## What's actually implemented

This is a real, working codebase, not a mockup. Honestly, here's what's done
and what isn't:

**Fully working:**
- JWT authentication (register/login/me), bcrypt password hashing, role-based
  authorization (user/admin)
- FastAPI backend with 9 route groups, all documented in `docs/API.md`
- PostgreSQL + pgvector database with a real Alembic migration (not just
  `create_all`)
- Document upload → chunking → embedding → pgvector storage → semantic search
  (Research Studio), with Gemini-powered embeddings and graceful degradation when GEMINI_API_KEY is not configured
- A LangGraph multi-agent workflow (Query Router → domain agent →
  Source Verification agent) wired to the chat endpoint
- Governance Research Lab and Economics Lab (zakat calculator, waqf info,
  budget simulation) — pure, auditable calculations with explicit assumptions
- Learning Academy with source-cited quizzes and per-user progress tracking
- Admin dashboard (users, documents, stats, AI request logs, feedback)
- Neo4j-backed Civilization Knowledge Graph with a small real seed dataset,
  degrading gracefully (not crashing) when Neo4j is unavailable
- A Next.js + TypeScript + Tailwind frontend with all 13 specified pages,
  a real emerald/charcoal/gold design system, loading/empty/error states
- 34 passing automated backend tests (`pytest tests/` — see
  `docs/EVAL_REPORT.md` for the actual output)
- Docker Compose config for Postgres+pgvector, Neo4j, backend, and frontend

**Known limitations (see `docs/EVAL_REPORT.md` for full detail):**
- The sample/seed dataset (2 sample text documents, ~17 knowledge-graph
  entities, 6 governance topics) is intentionally small — enough to prove the
  pipeline works end-to-end, not a comprehensive historical database. Replace
  it with real, properly-licensed sources before relying on this for research.
- Answer faithfulness and relevance are not scored numerically by the
  evaluation harness — that requires human review or a separate LLM-judge
  pipeline, which is out of scope for this pass.
- Docker image builds could not be executed inside the environment this
  project was built in (no Docker daemon available there) — the Dockerfiles
  and `docker-compose.yml` were validated for syntax/config correctness
  (`docker compose config`), but a live multi-container build should be your
  first smoke test after extracting this project.
- The active LLM integration uses Google's Gemini API. Set GEMINI_API_KEY in the backend environment; no local LLM is required.

---

## Quick start (Windows 11)

See **`docs/WINDOWS_SETUP.md`** for exact, copy-pasteable PowerShell commands.
The short version:

1. Install Python 3.11+, Node.js 20+, Git, and Docker Desktop.
2. `docker compose up -d postgres neo4j` (or run Postgres/Neo4j yourself).
3. `python -m venv .venv && .venv\Scripts\Activate.ps1 && pip install -r requirements.txt`
4. Copy `.env.example` to `.env` and fill in your `GEMINI_API_KEY`.
5. `alembic upgrade head` then `python scripts\seed_db.py`
6. `uvicorn backend.app.main:app --reload` (backend on :8000)
7. `cd frontend && npm install && npm run dev` (frontend on :3000)
8. Open `http://localhost:3000`

## Deployment

See **`docs/DEPLOYMENT.md`** for a practical guide to deploying this for real
(managed Postgres, managed Neo4j or self-hosted, frontend/backend hosting,
environment variables, HTTPS, backups).

## Documentation index

- `docs/ARCHITECTURE.md` — system design and data flow
- `docs/API.md` — full endpoint reference
- `docs/WINDOWS_SETUP.md` — exact local setup steps for Windows 11 + PowerShell
- `docs/TROUBLESHOOTING.md` — common errors and fixes
- `docs/DEPLOYMENT.md` — production deployment guide
- `docs/SECURITY.md` — security measures and known risks
- `docs/EVAL_REPORT.md` — real test results and evaluation findings
- `CONTRACT.md` — the internal integration contract used to build this
  (useful if you're extending the codebase)

## Project structure

```
khilafah-ai/
  backend/        FastAPI app (routers, models, schemas, security)
  ai_engine/      LLM client, RAG pipeline, chunking/embeddings, LangGraph agents
  knowledge_graph/ Neo4j client, seed data, ingestion, queries
  simulations/    Pure-calculation governance/economics reference data
  frontend/       Next.js + TypeScript + Tailwind app (13 pages)
  data/           Sample source documents + source registry
  tests/          Pytest suite (34 tests)
  scripts/        seed_db.py, run_eval.py
  alembic/        Database migrations
  docs/           All documentation
  docker-compose.yml, backend/Dockerfile, frontend/Dockerfile
```

## License / content notice

Sample documents in `data/sample_sources/` are platform-authored summaries
for pipeline testing, not verified primary sources — see the notice at the
top of each file. Replace them with properly-licensed sources before using
this platform for real research or publishing it with real content.
