from __future__ import annotations

import uuid


def account(client, name):
    email = name.lower() + "-" + uuid.uuid4().hex[:8] + "@example.com"
    password = "StrongPass123"
    client.post("/api/auth/register", json={"email": email, "password": password, "full_name": name})
    token = client.post("/api/auth/login", json={"email": email, "password": password}).json()["access_token"]
    return {"Authorization": "Bearer " + token}


def accepted_conversation(client):
    caller = account(client, "Caller")
    callee = account(client, "Callee")
    callee_id = client.get("/api/auth/me", headers=callee).json()["id"]
    created = client.post("/api/inbox/conversations", headers=caller, json={
        "recipient_id": callee_id, "body": "Hello"
    })
    conversation_id = created.json()["id"]
    assert client.post(f"/api/inbox/conversations/{conversation_id}/accept", headers=callee).status_code == 200
    return caller, callee, conversation_id


def test_call_signaling_requires_accepted_conversation_and_participants(client):
    caller, callee, conversation_id = accepted_conversation(client)
    outsider = account(client, "Outsider")
    offer = {"conversation_id": conversation_id, "sdp": "v=0\r\n"}
    started = client.post("/api/calls", headers=caller, json={"call_type": "audio", "offer": offer})
    assert started.status_code == 201
    call_id = started.json()["id"]
    assert started.json()["status"] == "ringing"
    assert started.json()["offer"] is None
    assert client.get(f"/api/calls/{call_id}", headers=outsider).status_code == 404
    incoming = client.get("/api/calls/incoming", headers=callee).json()["calls"]
    assert len(incoming) == 1 and incoming[0]["id"] == call_id
    accepted = client.post(f"/api/calls/{call_id}/accept", headers=callee, json={"answer": {"sdp": "v=0\r\n"}})
    assert accepted.status_code == 200
    assert accepted.json()["status"] == "accepted"
    assert client.post(f"/api/calls/{call_id}/candidates", headers=caller, json={"candidate": {"candidate": "candidate:1"}}).status_code == 200
    caller_view = client.get(f"/api/calls/{call_id}", headers=caller).json()
    callee_view = client.get(f"/api/calls/{call_id}", headers=callee).json()
    assert caller_view["local_candidates"] == [{"candidate": "candidate:1"}]
    assert callee_view["remote_candidates"] == [{"candidate": "candidate:1"}]
    assert client.post(f"/api/calls/{call_id}/end", headers=callee).json()["status"] == "ended"


def test_calls_are_rejected_for_pending_message_requests(client):
    caller = account(client, "PendingCaller")
    callee = account(client, "PendingCallee")
    callee_id = client.get("/api/auth/me", headers=callee).json()["id"]
    created = client.post("/api/inbox/conversations", headers=caller, json={
        "recipient_id": callee_id, "body": "Request"
    })
    offer = {"conversation_id": created.json()["id"], "sdp": "v=0\r\n"}
    response = client.post("/api/calls", headers=caller, json={"call_type": "video", "offer": offer})
    assert response.status_code == 403
