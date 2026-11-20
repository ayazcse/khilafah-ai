from __future__ import annotations


def test_list_topics(client):
    resp = client.get("/api/governance/topics")
    assert resp.status_code == 200
    topics = resp.json()
    assert len(topics) >= 5
    for topic in topics:
        assert topic["evidence_level"] in {
            "established",
            "disputed",
            "academic_interpretation",
            "hypothetical_simulation",
        }
        assert len(topic["sources"]) > 0


def test_topic_detail(client):
    resp = client.get("/api/governance/topics/diwan")
    assert resp.status_code == 200
    assert resp.json()["id"] == "diwan"


def test_topic_not_found(client):
    resp = client.get("/api/governance/topics/does-not-exist")
    assert resp.status_code == 404


def test_compare_topics(client):
    resp = client.get("/api/governance/compare", params={"a": "diwan", "b": "shura"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["a"]["id"] == "diwan"
    assert body["b"]["id"] == "shura"
