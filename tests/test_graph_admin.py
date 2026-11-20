"""Authorization tests for operational Knowledge Graph endpoints."""

def test_graph_seed_requires_admin(registered_user, client):
    response = client.post("/api/graph/seed", headers=registered_user["headers"])
    assert response.status_code == 403
    assert response.json()["detail"] == "Admin access required"


def test_graph_status_does_not_expose_graph_records(client):
    response = client.get("/api/graph/status")
    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"available", "nodes", "relationships"}
    assert isinstance(body["available"], bool)
    assert isinstance(body["nodes"], int)
    assert isinstance(body["relationships"], int)
