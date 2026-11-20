from __future__ import annotations


def test_register_and_login(client):
    resp = client.post(
        "/api/auth/register",
        json={"email": "alice@example.com", "password": "StrongPass123", "full_name": "Alice"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["email"] == "alice@example.com"
    assert body["role"] == "user"

    login = client.post("/api/auth/login", json={"email": "alice@example.com", "password": "StrongPass123"})
    assert login.status_code == 200
    assert "access_token" in login.json()


def test_duplicate_registration_rejected(client):
    payload = {"email": "bob@example.com", "password": "StrongPass123", "full_name": "Bob"}
    first = client.post("/api/auth/register", json=payload)
    assert first.status_code == 201
    second = client.post("/api/auth/register", json=payload)
    assert second.status_code == 400


def test_login_wrong_password(client):
    client.post(
        "/api/auth/register",
        json={"email": "carol@example.com", "password": "StrongPass123", "full_name": "Carol"},
    )
    resp = client.post("/api/auth/login", json={"email": "carol@example.com", "password": "WrongPassword"})
    assert resp.status_code == 401


def test_me_requires_auth(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401


def test_me_with_token(registered_user, client):
    resp = client.get("/api/auth/me", headers=registered_user["headers"])
    assert resp.status_code == 200
    assert resp.json()["email"] == registered_user["email"]
