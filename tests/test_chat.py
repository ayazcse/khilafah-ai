"""Tests for the chat endpoint and its graceful no-key behavior."""
from __future__ import annotations


def test_chat_requires_auth(client):
    resp = client.post("/api/chat", json={"message": "Tell me about the diwan."})
    assert resp.status_code == 401


def test_chat_returns_503_without_api_key(registered_user, client):
    resp = client.post(
        "/api/chat",
        json={"message": "Tell me about the diwan system.", "language": "en"},
        headers=registered_user["headers"],
    )
    assert resp.status_code == 503
    assert "GEMINI_API_KEY" in resp.json()["detail"]


def test_chat_happy_path_with_mocked_agent_graph(registered_user, client, monkeypatch):
    def fake_run_query(message, language, user_id, db):
        return {
            "answer": "The diwan was an administrative register introduced under 'Umar ibn al-Khattab.",
            "citations": [{"source_id": "diwan", "title": "Encyclopaedia of Islam, entry: 'Diwan'", "source_type": "established"}],
            "agent_trace": [
                {"agent": "query_router", "summary": "Classified query as 'governance'."},
                {"agent": "governance_research_agent", "summary": "Produced a draft answer."},
                {"agent": "source_verification_agent", "summary": "Reviewed draft answer."},
            ],
            "uncertainty_note": None,
        }

    import sys
    import types

    fake_graph_module = types.ModuleType("ai_engine.agents.graph")
    fake_graph_module.run_query = fake_run_query

    class _FakeLLMNotConfiguredError(Exception):
        pass

    fake_graph_module.LLMNotConfiguredError = _FakeLLMNotConfiguredError
    monkeypatch.setitem(sys.modules, "ai_engine.agents.graph", fake_graph_module)

    resp = client.post(
        "/api/chat",
        json={"message": "Tell me about the diwan system.", "language": "en"},
        headers=registered_user["headers"],
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "diwan" in body["answer"].lower()
    assert len(body["citations"]) == 1
    assert len(body["agent_trace"]) == 3
    assert "conversation_id" in body


def test_chat_history_requires_auth(client):
    resp = client.get("/api/chat/history")
    assert resp.status_code == 401


def test_chat_history_empty_for_new_user(client):
    payload = {"email": "history-empty-user@example.com", "password": "StrongPass123", "full_name": "History Empty"}
    client.post("/api/auth/register", json=payload)
    login = client.post("/api/auth/login", json={"email": payload["email"], "password": payload["password"]})
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    resp = client.get("/api/chat/history", headers=headers)
    assert resp.status_code == 200
    assert resp.json() == []


def test_chat_schema_accepts_urdu_language():
    from backend.app.schemas import ChatRequest

    payload = ChatRequest(message="خلافت عباسیہ کے بارے میں بتائیں", language="ur")
    assert payload.language == "ur"
