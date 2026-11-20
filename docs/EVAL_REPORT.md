# Evaluation Report

This report states real, measured results. No score below is invented.

## 1. Automated test suite

Run with: `pytest tests/ -v` (repo root, virtual environment activated).
Uses an isolated SQLite database and a placeholder OpenAI key by design —
no external services required to run it (see `tests/conftest.py`).

**Actual output, captured during this build:**

```
34 passed, 34 warnings in 5.36s
```

All 34 tests passed: `test_auth.py` (5), `test_chat.py` (5),
`test_documents.py` (6), `test_economics.py` (6), `test_governance.py` (4),
`test_academy.py` (8). The warnings are pre-existing library deprecation
notices (Pydantic v2 class-based `Config`, `datetime.utcnow()`, an `anyio`
alias) — none are functional failures, and none originate from this
project's own logic.

### What the test suite actually verifies
- Registration, login, duplicate-email rejection, wrong-password rejection,
  token-gated `/auth/me`.
- Chat returns a clean `503` when no OpenAI key is configured (not a crash),
  and the full response shape (citations, agent trace, conversation id) with
  the agent graph mocked.
- Document upload degrades gracefully to `status="error_processing"` when
  embeddings can't be generated (no fabricated "success"), ownership
  scoping on list/delete, and a `503` (not `500`) on search without a key.
- Zakat math (below/above nisab, liabilities reducing wealth), budget
  simulation percentages, and the live API endpoints wrapping them.
- Governance topics carry a valid `evidence_level` and at least one source
  each; 404 on an unknown topic id; comparison endpoint.
- Academy: path/lesson listing, a lesson with **no quiz returns `null`
  rather than a fabricated question** (`test_lesson_with_no_quiz_returns_null_not_fabricated`),
  quiz scoring correctness, and progress tracking after a submission.

## 2. Live smoke test (manual, during this build)

With real Postgres 16 + pgvector running locally, the following were
verified against a live `uvicorn` process (not mocked):
- `GET /api/health` → `{"status": "ok", "database": "ok", "neo4j": "disabled"}`
- `POST /api/auth/register` → `201` with a real user row created
- `POST /api/auth/login` → real JWT issued and verified
- `GET /api/governance/topics` → real cited topic data returned
- `POST /api/economics/zakat` → correct calculation returned
- `POST /api/chat` without an API key → clean `503`, not a crash

A real Alembic migration (`alembic revision --autogenerate`) was generated
and applied against this live database — not just `Base.metadata.create_all`
— confirming the SQLAlchemy models, including the pgvector `Vector(1536)`
column, produce valid DDL.

The full Next.js frontend (`npm run build`) compiled with **zero errors**
across all 14 pages (landing + 13 specified pages), and was smoke-tested in
a real headless browser (Playwright): registration → dashboard redirect,
and live data rendering on the Governance and Economics Lab pages against
the real backend.

## 3. AI evaluation harness (`scripts/run_eval.py`)

This harness measures (or honestly reports as unmeasured):
Retrieval Recall@5, retrieval relevance, answer faithfulness, citation
correctness, answer relevance, response latency, token usage, and estimated
cost per query, against a small 4-question reproducible test dataset tied to
the two sample documents in `data/sample_sources/`.

**Actual output from this build environment (no OpenAI key configured):**

```json
{
  "retrieval_eval": {
    "status": "skipped",
    "reason": "OPENAI_API_KEY not configured — embedding-based retrieval cannot run."
  },
  "agent_workflow_eval": {
    "status": "skipped",
    "reason": "OPENAI_API_KEY not configured — cannot run the live agent workflow."
  }
}
```

This is the correct, honest behavior: **the harness refuses to report a
retrieval or faithfulness score it cannot actually measure**, rather than
inventing a plausible-looking number. Once a real `OPENAI_API_KEY` is set
and the two sample documents are uploaded via the Research Studio, re-run
`python scripts/run_eval.py` to get real Recall@5, latency, and token-usage
numbers — the full JSON report is also written to
`docs/EVAL_RUN_OUTPUT.json`.

### Why faithfulness/relevance aren't scored numerically
Scoring these correctly requires either human annotation of each answer
against its source, or a second LLM call acting as a judge (itself an
approximation, and an added cost/complexity). Both were out of scope for
this MVP pass. The harness instead captures full raw answers, citation
counts, and agent traces so a human reviewer can score them, and says so
explicitly in its own output (`known_limitations`).

## 4. Known limitations (platform-wide)

- Sample/seed data is intentionally small (2 sample documents, ~17
  knowledge-graph entities, 6 governance topics, 2 learning paths) — enough
  to prove every pipeline end-to-end, not a comprehensive historical
  database.
- One knowledge-graph relationship (Bayt al-Hikma's founding) is
  deliberately labeled `ASSOCIATED_WITH_FOUNDING` rather than `FOUNDED`,
  because the precise founding circumstances are genuinely debated among
  historians — documented in `knowledge_graph/seed_data.py`.
- Docker image builds were not executable in the sandboxed environment this
  project was built in (no Docker daemon available there). `docker compose
  config` was used to validate the compose file's syntax/schema instead.
  **Run `docker compose up -d` as your first step after extracting this
  project to confirm the images build cleanly on your machine.**
- `npm audit` reports outstanding vulnerabilities tied to the Next.js 14.x
  line and transitive `eslint-config-next` dependencies; see
  `docs/SECURITY.md` for detail and the recommended upgrade path.
- No load testing was performed; rate limits and performance characteristics
  under concurrent load are unverified.
