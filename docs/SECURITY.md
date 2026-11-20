# Security

## What's implemented

- **Password hashing**: bcrypt via `passlib` (`backend/app/security.py`).
  Plaintext passwords are never stored or logged.
- **Authentication**: JWT bearer tokens (`python-jose`), configurable
  expiry via `ACCESS_TOKEN_EXPIRE_MINUTES`.
- **Role-based authorization**: `user` / `admin` roles; all `/admin/*` routes
  require `admin` (`backend/app/deps.py::require_admin`), enforced server-side
  — never trust a frontend-only check.
- **API validation**: every request body is a Pydantic model
  (`backend/app/schemas.py`); FastAPI rejects malformed input with `422`
  before it reaches any handler.
- **Rate limiting**: `slowapi`, applied to `/auth/register`, `/auth/login`,
  `/chat`, and `/documents/upload` (the most abuse-prone / costly endpoints).
  In-memory, per-process — fine for a single-instance MVP; a multi-instance
  production deployment should move this to a shared store (e.g. Redis).
- **File upload restrictions**: extension allowlist (`.pdf`, `.txt` only)
  and a configurable size cap (`MAX_UPLOAD_MB`), enforced server-side.
- **CORS**: explicit origin allowlist via `CORS_ORIGINS` env var — never `*`
  in combination with credentials.
- **Environment variable protection**: all secrets (`SECRET_KEY`,
  `OPENAI_API_KEY`, `NEO4J_PASSWORD`, `DATABASE_URL`) are read from `.env`,
  which is gitignored. `.env.example` ships with placeholder values only.
- **SQL injection protection**: all database access goes through SQLAlchemy's
  ORM / parameterized queries — no raw string-interpolated SQL anywhere in
  the codebase.
- **Prompt injection defenses**: `ai_engine/safety.py` fences retrieved
  document text and reference data in clear delimiters before it's placed in
  an LLM prompt, so the model is instructed to treat it as data, not
  instructions, and flags common injection phrasing patterns. This reduces
  but does not eliminate prompt injection risk — it is not a formal
  guarantee.
- **User data isolation**: documents and conversations are scoped to
  `owner_id`/`user_id` and checked on every read/delete; a non-owner (and
  non-admin) gets `403`, not another user's data.
- **Secure error handling**: a global exception handler
  (`backend/app/main.py`) logs the full exception server-side but returns a
  generic `"An internal error occurred"` message to the client — no stack
  traces, file paths, or internal details are ever leaked in a response.
- **Logging**: Python's standard `logging` module, server-side only.
- **Health-check endpoint**: `GET /api/health`, reporting real DB and Neo4j
  connectivity (not just "the process is running").
- **Secrets never reach the frontend**: `OPENAI_API_KEY`, `SECRET_KEY`, and
  database credentials exist only in the backend's environment; the
  frontend only ever receives a short-lived JWT it stores in
  `localStorage`.

## Known risks / what a real production deployment must still add

- **`localStorage` for JWTs** is vulnerable to XSS-based token theft. A
  hardened deployment should move to an `httpOnly` secure cookie with CSRF
  protection instead. This MVP uses `localStorage` for simplicity.
- **Rate limiting is in-memory and per-process.** Behind a load balancer with
  multiple backend instances, each instance has its own independent limit —
  effectively multiplying the real limit. Use a shared backend (Redis) for
  production.
- **No email verification** on registration. Anyone can register with any
  email address; there's no proof of ownership. Add email verification
  before treating registered email addresses as verified identities.
- **No refresh tokens / revocation list.** A leaked JWT is valid until it
  expires; there's no server-side way to revoke it early. Consider a
  refresh-token + short-lived-access-token pattern for production.
- **Frontend dependency vulnerabilities**: `npm audit` currently reports
  vulnerabilities in Next.js 14.2.x's own advisories and in `glob`/
  `minimatch` pulled in transitively by `eslint-config-next`. These require
  a major-version upgrade (Next.js 15/16) to fully resolve, which was out of
  scope for this pass to avoid destabilizing the whole frontend under time
  constraints. **Run `npm audit` and plan a Next.js upgrade before any real
  production deployment.**
- **Prompt injection defenses are heuristic**, not a formal guarantee — a
  sufficiently creative adversarial document could still influence model
  output. Treat AI-generated content as requiring human review for anything
  high-stakes.
- **No WAF / DDoS protection** at the infrastructure level — add this at
  your hosting provider or CDN layer for a public deployment.
- **No automated dependency scanning in CI** — add a tool like `pip-audit`
  or Dependabot/Renovate for ongoing monitoring.

## Reporting a security issue

This is a demonstration/MVP project. If you extend it for real users, set up
a proper security contact and disclosure process before launch.
