# KHILAFAH Connect

KHILAFAH Connect is the text-first community feature inside KHILAFAH AI.

## Included in this MVP

- Authenticated community feed with topic filters.
- Text posts (up to 2,000 characters).
- Comments (up to 1,000 characters).
- Like/unlike and follow/unfollow.
- Post deletion by its author or an administrator.
- Post reporting; reports are stored for moderator review.
- Topic allow-list and server-side validation.
- PostgreSQL persistence through Alembic migrations.

## API

All routes are under `/api/community` and require a valid bearer token.

- `GET /feed?topic=All&offset=0&limit=20`
- `POST /posts`
- `DELETE /posts/{post_id}`
- `POST /posts/{post_id}/like`
- `GET /posts/{post_id}/comments`
- `POST /posts/{post_id}/comments`
- `POST /users/{user_id}/follow`
- `POST /posts/{post_id}/report`

Allowed topics: General, History, Science, Quran & Learning, Research, Society & Economy.

## Database migration

**Run this before enabling the feature against the production backend database.**

From the repository root, with the backend environment and production `DATABASE_URL` configured:

```bash
alembic upgrade head
```

To check the applied revision:

```bash
alembic current
```

Do not run the migration against a local or staging database by mistake. Confirm the host's active database connection string before executing it.

## Current MVP boundaries

- Text-only posts. Photo/video uploads are intentionally excluded to avoid storage and moderation costs.
- Direct messages, push notifications, profile customization and recommendation ranking are not included.
- Reports are persisted for review, but a dedicated in-app moderation queue is a follow-up task. Administrators can already remove posts through the API.
- The feed is newest-first and paginated; this is not yet a personalized ranking system.
- The feature uses the existing auth, FastAPI and PostgreSQL stack; no paid third-party social API is required.

## Before opening registration to a large public audience

1. Add an administrator moderation queue and report resolution workflow.
2. Add rate limits and anti-spam controls for posts, comments, follows and reports.
3. Add user blocking, account-level moderation actions and an appeal process.
4. Add retention, deletion and privacy controls for community content.
5. Verify backups, database capacity and operational monitoring.
