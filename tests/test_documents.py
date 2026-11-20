"""Tests for the Research Studio document pipeline.

The test environment runs with a placeholder OPENAI_API_KEY (see
tests/conftest.py), so embedding calls raise LLMNotConfiguredError. This
exercises the real graceful-degradation path: uploads must still succeed
(status="error_processing") rather than crashing, and search must return a
clean 503 rather than a 500.
"""
from __future__ import annotations

import io


def test_upload_requires_auth(client):
    resp = client.post(
        "/api/documents/upload",
        files={"file": ("test.txt", io.BytesIO(b"hello world"), "text/plain")},
        data={"title": "Test Doc"},
    )
    assert resp.status_code == 401


def test_upload_rejects_bad_extension(registered_user, client):
    resp = client.post(
        "/api/documents/upload",
        files={"file": ("test.exe", io.BytesIO(b"binary"), "application/octet-stream")},
        data={"title": "Test Doc"},
        headers=registered_user["headers"],
    )
    assert resp.status_code == 400


def test_upload_txt_degrades_gracefully_without_api_key(registered_user, client):
    resp = client.post(
        "/api/documents/upload",
        files={"file": ("test.txt", io.BytesIO(b"Some historical content about the diwan system."), "text/plain")},
        data={"title": "Test Document", "author": "Tester", "source_type": "sample"},
        headers=registered_user["headers"],
    )
    assert resp.status_code == 201
    body = resp.json()
    # No real OPENAI_API_KEY in the test environment -> embedding fails ->
    # the upload must still succeed, just marked as not fully processed.
    assert body["status"] == "error_processing"
    assert "document_id" in body


def test_list_documents_scoped_to_owner(registered_user, client):
    client.post(
        "/api/documents/upload",
        files={"file": ("a.txt", io.BytesIO(b"content a"), "text/plain")},
        data={"title": "Doc A"},
        headers=registered_user["headers"],
    )
    resp = client.get("/api/documents", headers=registered_user["headers"])
    assert resp.status_code == 200
    assert all(doc["title"] for doc in resp.json())


def test_search_returns_503_without_api_key(registered_user, client):
    resp = client.post(
        "/api/documents/search",
        json={"query": "what is the diwan?", "top_k": 3},
        headers=registered_user["headers"],
    )
    assert resp.status_code == 503


def test_delete_document_not_found(registered_user, client):
    resp = client.delete(
        "/api/documents/00000000-0000-0000-0000-000000000000",
        headers=registered_user["headers"],
    )
    assert resp.status_code == 404
