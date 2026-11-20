# API Reference

Base URL: `http://localhost:8000/api` (local). Interactive docs are always
available at `/docs` (Swagger UI) and `/redoc` while the backend is running.

Authentication: Bearer JWT in the `Authorization` header, obtained from
`POST /auth/login`. Tokens expire after `ACCESS_TOKEN_EXPIRE_MINUTES`
(default 60).

---

## Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | none | `{email, password, full_name}` → `201` user object |
| POST | `/auth/login` | none | `{email, password}` → `{access_token, token_type}` |
| GET | `/auth/me` | required | Current user's profile |

## Chat (Islamic History AI + Agents)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/chat` | required | `{message, conversation_id?, language}` → answer + citations + agent trace |
| GET | `/chat/history` | required | All of the user's past conversations |

`POST /chat` returns `503` with an actionable message if no OpenAI API key
is configured. Rate limited to 30 requests/minute per IP.

## Documents (Research Studio)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/documents/upload` | required | multipart: `file`, `title`, `author?`, `source_type?`, `language?`, `historical_period?` |
| GET | `/documents` | required | List own documents (admins see all) |
| GET | `/documents/{id}` | required | Document metadata |
| DELETE | `/documents/{id}` | required | Delete (owner or admin) |
| POST | `/documents/search` | required | `{query, document_id?, top_k?}` → ranked chunks |

Upload is rate limited to 10/minute per IP. `.pdf` and `.txt` only, up to
`MAX_UPLOAD_MB` (default 20MB).

## Knowledge Graph

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/graph/graph?entity_type=&limit=` | none | Nodes + edges for visualization |
| GET | `/graph/entity/{id}` | none | Entity detail + relationships |
| GET | `/graph/search?q=` | none | Search entities by name |

All three return `{"degraded": true, "message": "..."}` with empty data if
Neo4j is unavailable, instead of an error.

## Governance Research Lab

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/governance/topics` | none | All topics with evidence levels + sources |
| GET | `/governance/topics/{id}` | none | Single topic |
| GET | `/governance/compare?a=&b=` | none | Side-by-side comparison |

## Islamic Economics Lab

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/economics/zakat` | none | Zakat calculation (see request/response below) |
| GET | `/economics/waqf-info` | none | Static educational content |
| POST | `/economics/budget-simulation` | none | Illustrative budget math |

**Zakat request:**
```json
{
  "cash": 2000, "gold_grams": 0, "silver_grams": 0,
  "trade_goods_value": 0, "liabilities": 0,
  "nisab_standard": "silver", "gold_price_per_gram": 1, "silver_price_per_gram": 1
}
```
**Response:** `zakatable_wealth`, `nisab_threshold`, `meets_nisab`, `zakat_due`,
`rate`, `assumptions[]`, `disclaimer`.

## Learning Academy

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/academy/paths` | none | All learning paths |
| GET | `/academy/paths/{id}` | none | Lessons in a path |
| GET | `/academy/lessons/{id}` | none | Lesson content + quiz (or `null` quiz if none verified) |
| POST | `/academy/quiz/{lesson_id}/submit` | required | `{answers: {question_id: option_index}}` → score |
| GET | `/academy/progress` | required | Per-path completion percentage |

## Admin (role=admin only)

| Method | Path | Description |
|---|---|---|
| GET | `/admin/users` | All users |
| GET | `/admin/documents` | All documents across all users |
| PATCH | `/admin/documents/{id}/status` | `{status: "approved"\|"rejected"\|...}` |
| GET | `/admin/stats` | Platform usage counts |
| GET | `/admin/logs?limit=` | Recent AI request logs |
| GET | `/admin/feedback` | All submitted feedback |

Non-admin requests to any `/admin/*` route return `403`.

## Feedback

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/feedback` | required | `{message}` → stored, visible to admins |

## Health

| Method | Path | Description |
|---|---|---|
| GET | `/health` | `{status, database: "ok"\|"error", neo4j: "ok"\|"disabled"\|"error"}` |
