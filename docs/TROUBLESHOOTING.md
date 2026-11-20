# Troubleshooting Guide

### "AI features require an OpenAI API key. Add OPENAI_API_KEY to your .env file." (503)
You haven't set a real `OPENAI_API_KEY` in `.env` (it's still the placeholder
`sk-your-key-here`). Get a key at https://platform.openai.com/api-keys, set
it in `.env`, and restart the backend. This is a graceful, intentional
response — not a bug — so the rest of the app keeps working without a key.

### Document upload succeeds but status is "error_processing"
This means text extraction worked but embedding failed — almost always a
missing/invalid `OPENAI_API_KEY`, or an exhausted OpenAI quota. Check the
backend logs (`uvicorn` terminal output) for the specific error. The document
itself is safely stored; re-upload after fixing the key, or wait for a
future "reprocess" admin action (not yet implemented in this MVP).

### `pip install -r requirements.txt` fails on `psycopg[binary]` or `bcrypt`
On Windows, make sure you installed the **64-bit** version of Python. On
Linux, you may need build tools: `sudo apt install build-essential libpq-dev`.

### `alembic upgrade head` fails with a connection error
Postgres isn't reachable at the `DATABASE_URL` in your `.env`. If using
Docker, run `docker compose ps` to confirm the `postgres` service is healthy.
If running Postgres natively, confirm it's started and the user/password/db
name match your `.env`.

### `alembic upgrade head` fails with `relation "vector" does not exist` or similar pgvector errors
The `vector` extension isn't enabled in your database. Connect with `psql`
and run `CREATE EXTENSION IF NOT EXISTS vector;` in the `khilafah` database.
The `pgvector/pgvector:pg16` Docker image (used in `docker-compose.yml`) has
this extension available but you still need to `CREATE EXTENSION` it once
per database.

### Neo4j shows `"neo4j": "error"` on `/api/health`, or graph pages show "Neo4j is not configured or unreachable"
This is a graceful degradation, not a crash — the Knowledge Graph and History
Explorer pages will show an empty state instead of data. To fix: confirm
Neo4j is running (`docker compose ps`), confirm `NEO4J_URI`/`NEO4J_USER`/
`NEO4J_PASSWORD` in `.env` match what Neo4j is actually configured with, then
restart the backend and re-run `python scripts/seed_db.py`.

### Frontend shows network errors / can't reach the API
Confirm the backend is running on port 8000 (`http://localhost:8000/api/health`
should return JSON). Confirm `NEXT_PUBLIC_API_URL` in the frontend's
environment matches where the backend actually is. If you changed the
backend's port or host, you must rebuild the frontend (env vars are baked in
at build time for `NEXT_PUBLIC_*` variables) or set it for `npm run dev`.

### CORS errors in the browser console
The backend's `CORS_ORIGINS` environment variable must include the exact
origin the frontend is served from (e.g. `http://localhost:3000`). Multiple
origins can be comma-separated. Restart the backend after changing it.

### `docker compose up` fails immediately
Run `docker compose config` first to validate the compose file against your
local Docker Compose version. Make sure Docker Desktop is actually running
(not just installed). On Windows, ensure WSL2 is enabled if Docker Desktop
asks for it.

### Tests fail locally
Run `pytest tests/ -v` from the repo root with the virtual environment
activated. The test suite uses an isolated SQLite database and a placeholder
API key by design (see `tests/conftest.py`) — it does not need Postgres,
Neo4j, or a real OpenAI key to pass. If tests fail, read the specific
assertion error; it's almost always either a stale `.venv` (recreate it) or a
port conflict from a previous `uvicorn` process still running.

### "Admin access required" (403) even though I registered first
Registration never grants admin automatically (deliberately, for security).
Run `python scripts/seed_db.py` after registering your first user — it
promotes the earliest-registered user to admin.
