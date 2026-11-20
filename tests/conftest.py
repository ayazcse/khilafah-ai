"""Shared pytest fixtures: isolated SQLite database and FastAPI TestClient."""
from __future__ import annotations

import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_khilafah.db")
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production")
os.environ.setdefault("NEO4J_ENABLED", "false")
os.environ.setdefault("GEMINI_API_KEY", "")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app import deps
from backend.app.main import app
from backend.app.models import Base

TEST_DB_PATH = REPO_ROOT / "test_khilafah.db"
test_engine = create_engine(
    "sqlite:///" + str(TEST_DB_PATH),
    connect_args={"check_same_thread": False},
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def _setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    if TEST_DB_PATH.exists():
        TEST_DB_PATH.unlink()


def _override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[deps.get_db] = _override_get_db


@pytest.fixture()
def client():
    # Rate limiting is exercised by the deployed app, not by these endpoint
    # behavior tests. Disable it here so shared TestClient IP state cannot make
    # otherwise independent tests order-dependent.
    app.state.limiter.enabled = False
    return TestClient(app)


@pytest.fixture()
def db_session():
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def registered_user(client):
    payload = {"email": "tester@example.com", "password": "StrongPass123", "full_name": "Test User"}
    client.post("/api/auth/register", json=payload)
    login_resp = client.post("/api/auth/login", json={"email": payload["email"], "password": payload["password"]})
    token = login_resp.json()["access_token"]
    return {"email": payload["email"], "token": token, "headers": {"Authorization": f"Bearer {token}"}}
