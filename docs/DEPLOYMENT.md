# Production Deployment Guide

This is a practical guide, not a promise that any of these services remain
free. Hosting, managed database, and OpenAI API usage all cost real money
once you exceed free tiers — budget accordingly.

## Recommended stack for a first real deployment

| Component | Suggested service | Why |
|---|---|---|
| Frontend (Next.js) | Vercel or Netlify | Free tier covers low-traffic MVPs; zero-config Next.js builds |
| Backend (FastAPI) | Render, Railway, or Fly.io | Free/low-cost tiers, easy Docker deploys |
| PostgreSQL + pgvector | Render Postgres, Neon, or Supabase (all support pgvector) | Managed backups, no server to patch |
| Neo4j | Neo4j AuraDB Free tier, or self-hosted on the same host as the backend | AuraDB free tier is small but fine for the sample dataset scale |
| Domain + HTTPS | Your registrar + the host's built-in HTTPS (Vercel/Render/Railway all auto-provision Let's Encrypt certs) | No manual cert management needed |

## Step by step

### 1. Provision the database first
Create a managed Postgres instance (Render/Neon/Supabase). Enable the
`vector` extension — most managed providers let you do this via SQL console:
`CREATE EXTENSION IF NOT EXISTS vector;`. Note the connection string.

### 2. Provision Neo4j
Create a free AuraDB instance at https://console.neo4j.io, or run Neo4j on a
small VM/container alongside your backend. Note the `bolt+s://` URI, user,
and password. If you'd rather launch without a knowledge graph at first, set
`NEO4J_ENABLED=false` — the platform degrades gracefully (empty-state graph
pages) rather than breaking.

### 3. Deploy the backend
Using Render/Railway/Fly.io, point it at `backend/Dockerfile` with build
context set to the **repo root** (not `backend/`) — this matters because the
backend imports `ai_engine`, `knowledge_graph`, and `simulations` as sibling
top-level packages. Set environment variables matching `.env.example`,
pointing `DATABASE_URL` at your managed Postgres and `NEO4J_URI`/
`NEO4J_USER`/`NEO4J_PASSWORD` at your Neo4j instance. Set `CORS_ORIGINS` to
your frontend's real deployed URL (not `localhost`).

After the first deploy, run migrations against the production database:
```bash
alembic upgrade head
python scripts/seed_db.py
```
(via your host's shell/console feature, or a one-off job/release command —
most of these platforms support a "release command" that runs before the
app starts).

### 4. Deploy the frontend
On Vercel/Netlify, point it at the `frontend/` directory. Set
`NEXT_PUBLIC_API_URL` to your deployed backend's public URL + `/api` (e.g.
`https://khilafah-api.onrender.com/api`). Next.js's `NEXT_PUBLIC_*`
variables are baked in at build time, so set this **before** the first
build, and rebuild if you ever change the backend's URL.

### 5. Domain + HTTPS
Point your domain's DNS at your frontend host (CNAME, per their docs).
Vercel/Netlify/Render/Railway all provision HTTPS certificates automatically
once DNS resolves — no manual certificate work needed for this stack.

### 6. Environment variables checklist (production)
- `SECRET_KEY` — a long, random, unique value (never reuse the example)
- `OPENAI_API_KEY` — your real key, with billing/quota alerts set up on the
  OpenAI dashboard
- `CORS_ORIGINS` — your real frontend domain(s), not `*`
- `DATABASE_URL`, `NEO4J_*` — your managed instances' real credentials
- Never commit `.env` to git — `.gitignore` already excludes it

### 7. Logs
- Backend: your host's log viewer (Render/Railway/Fly.io all have one built
  in) shows the app's Python `logging` output, including the generic
  "internal error" messages logged with full tracebacks server-side (never
  shown to users — see `docs/SECURITY.md`).
- Frontend: Vercel/Netlify both have a build + runtime log viewer.

### 8. Backups
- Managed Postgres providers (Render, Neon, Supabase) include automated
  daily backups on paid tiers — confirm this is enabled.
- AuraDB includes automated backups; self-hosted Neo4j needs a manual
  `neo4j-admin database dump` cron job.
- Uploaded document files (`UPLOAD_DIR`) are **not** backed up by a database
  backup — if you deploy to a platform with ephemeral disk (common on
  Render/Railway free tiers), move `UPLOAD_DIR` to object storage (S3-
  compatible) for anything beyond a demo. This isn't implemented in this MVP.

### 9. Redeployment
All three suggested backend hosts support git-push-to-deploy or a CLI deploy
command. After any schema change, remember to run `alembic upgrade head`
against production before traffic hits the new code.

## Security reminder

Read `docs/SECURITY.md` before exposing this publicly — in particular, the
in-memory rate limiter and `localStorage`-based JWT storage are fine for an
MVP demo but have known limitations at real scale, and the frontend has
some outstanding `npm audit` findings tied to the Next.js 14.x line.
