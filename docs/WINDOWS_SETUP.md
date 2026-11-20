# Windows 11 Local Setup Guide

Target machine: Windows 11, 8GB RAM, PowerShell, Python and Git available.
These commands are written for **PowerShell**, not a Unix shell.

## 1. Prerequisites

Install these if you don't already have them:

- **Python 3.11+**: https://www.python.org/downloads/ (check "Add Python to PATH" during install)
- **Node.js 20 LTS**: https://nodejs.org/
- **Git**: https://git-scm.com/download/win
- **Docker Desktop** (for Postgres + Neo4j): https://www.docker.com/products/docker-desktop/
  - If you'd rather not run Docker on 8GB RAM, you can install PostgreSQL 16
    with the pgvector extension and Neo4j Desktop natively instead — see the
    "Without Docker" section below.

Verify installs:

```powershell
python --version
node --version
git --version
docker --version
```

## 2. Extract the project and open PowerShell there

```powershell
cd C:\Users\<you>\Documents
Expand-Archive -Path KHILAFAH-AI-Complete.zip -DestinationPath khilafah-ai
cd khilafah-ai
```

## 3. Start the databases

**With Docker (recommended):**

```powershell
docker compose up -d postgres neo4j
```

Wait about 15-20 seconds for both to report healthy. Check with:

```powershell
docker compose ps
```

**Without Docker:** install PostgreSQL 16 + the pgvector extension, and Neo4j
Desktop, matching the connection details in `.env.example`. Create a database
named `khilafah` owned by a user `khilafah` with password `khilafah` (or
update `.env` to match whatever you choose), and run `CREATE EXTENSION vector;`
in it.

## 4. Set up the Python backend

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
```

If `pip install` fails on `psycopg[binary]`, make sure you're using the
64-bit Python installer, not 32-bit.

## 5. Configure environment variables

```powershell
Copy-Item .env.example .env
notepad .env
```

In the opened file, set at minimum:

```
GEMINI_API_KEY=...your Gemini API key...
SECRET_KEY=<any long random string>
NEO4J_PASSWORD=<match what you set when starting Neo4j; Docker default below>
```

If you used `docker compose up -d neo4j` as above, the default password is
`change-me` (set in `docker-compose.yml`) — update it there and in `.env` if
you want something else before first start.

Get a Gemini API key from Google AI Studio. Without it, the app still runs, but AI chat and document embeddings are unavailable and return a clear setup error.

## 6. Run database migrations and seed data

```powershell
alembic upgrade head
python scripts\seed_db.py
```

This creates all tables, seeds the source registry, and seeds a small sample
knowledge graph into Neo4j (if reachable).

## 7. Register your first user and promote them to admin

```powershell
uvicorn backend.app.main:app --reload
```

Leave this running. In a **second** PowerShell window (activate the venv
again there too: `.venv\Scripts\Activate.ps1`), register a user at
`http://localhost:8000/docs` (use the `/api/auth/register` endpoint), then
run:

```powershell
python scripts\seed_db.py
```

again — this promotes the first registered user to admin.

## 8. Start the frontend

In a **third** PowerShell window:

```powershell
cd khilafah-ai\frontend
npm install
Copy-Item .env.local.example .env.local -ErrorAction SilentlyContinue
npm run dev
```

(If there's no `.env.local.example`, the frontend defaults to
`http://localhost:8000/api`, which matches the backend above — no extra
config needed for local development.)

## 9. Open the app

Go to **http://localhost:3000** in your browser. Register or sign in, and
explore the modules from the dashboard.

Backend API docs (interactive Swagger UI): **http://localhost:8000/docs**

## Common errors

See `docs/TROUBLESHOOTING.md` for specific error messages and fixes.
