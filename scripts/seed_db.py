"""Seed script: creates tables, promotes the first user to admin, seeds the
Neo4j knowledge graph, and loads the source registry.

Run from the repo root: `python scripts/seed_db.py`
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

from backend.app.database import Base, SessionLocal, engine  # noqa: E402
from backend.app.models import SourceRegistryEntry, User  # noqa: E402
from backend.app.security import hash_password  # noqa: E402


def create_tables() -> None:
    print("Creating database tables (if they don't already exist)...")
    Base.metadata.create_all(bind=engine)
    print("Tables ready.")


def promote_first_user_to_admin() -> None:
    db = SessionLocal()
    try:
        first_user = db.query(User).order_by(User.created_at.asc()).first()
        if first_user is None:
            print("No users exist yet. Register a user via /api/auth/register, "
                  "then re-run this script to promote them to admin.")
            return
        if first_user.role == "admin":
            print(f"'{first_user.email}' is already an admin.")
            return
        first_user.role = "admin"
        db.add(first_user)
        db.commit()
        print(f"Promoted '{first_user.email}' to admin.")
    finally:
        db.close()


def seed_source_registry() -> None:
    registry_path = REPO_ROOT / "data" / "source_registry.json"
    if not registry_path.exists():
        print("No data/source_registry.json found; skipping.")
        return

    data = json.loads(registry_path.read_text())
    db = SessionLocal()
    try:
        existing_count = db.query(SourceRegistryEntry).count()
        if existing_count > 0:
            print(f"Source registry already has {existing_count} entries; skipping seed.")
            return
        for entry in data.get("sources", []):
            db.add(
                SourceRegistryEntry(
                    title=entry.get("title", "Untitled"),
                    author=entry.get("author"),
                    publication_details=entry.get("publication_details"),
                    language=entry.get("language"),
                    historical_period=entry.get("historical_period"),
                    source_type=entry.get("source_type"),
                    edition=entry.get("edition"),
                    page_references=entry.get("page_references"),
                    copyright_status=entry.get("copyright_status"),
                    verification_status=entry.get("verification_status"),
                )
            )
        db.commit()
        print(f"Seeded {len(data.get('sources', []))} source registry entries.")
    finally:
        db.close()


def seed_knowledge_graph() -> None:
    try:
        from knowledge_graph.ingest import run_seed
    except ImportError as exc:
        print(f"Could not import knowledge_graph.ingest: {exc}")
        return

    result = run_seed()
    if result.get("status") == "skipped":
        print(f"Knowledge graph seeding skipped: {result.get('reason')}")
    else:
        print(
            f"Knowledge graph seeded: {result['nodes_created']} nodes created, "
            f"{result['relationships_created']} relationships created."
        )


if __name__ == "__main__":
    create_tables()
    promote_first_user_to_admin()
    seed_source_registry()
    seed_knowledge_graph()
    print("\nSeeding complete.")
