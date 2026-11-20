from __future__ import annotations


def test_list_paths(client):
    resp = client.get("/api/academy/paths")
    assert resp.status_code == 200
    assert len(resp.json()) >= 2


def test_path_lessons(client):
    resp = client.get("/api/academy/paths/p-governance-basics")
    assert resp.status_code == 200
    lessons = resp.json()
    assert len(lessons) >= 1


def test_path_not_found(client):
    resp = client.get("/api/academy/paths/nope")
    assert resp.status_code == 404


def test_lesson_detail(client):
    resp = client.get("/api/academy/lessons/l-zakat-basics")
    assert resp.status_code == 200
    body = resp.json()
    assert body["quiz"] is not None
    assert len(body["quiz"]) >= 1


def test_lesson_with_no_quiz_returns_null_not_fabricated(client):
    resp = client.get("/api/academy/lessons/l-bayt-al-mal-intro")
    assert resp.status_code == 200
    assert resp.json()["quiz"] is None


def test_submit_quiz_requires_auth(client):
    resp = client.post("/api/academy/quiz/l-zakat-basics/submit", json={"answers": {}})
    assert resp.status_code == 401


def test_submit_quiz_scores_correctly(registered_user, client):
    resp = client.post(
        "/api/academy/quiz/l-zakat-basics/submit",
        json={"answers": {"q-zakat-1": 1, "q-zakat-2": 1}},
        headers=registered_user["headers"],
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["correct"] == 2
    assert body["total"] == 2
    assert body["score"] == 100.0


def test_progress_tracked_after_quiz(registered_user, client):
    client.post(
        "/api/academy/quiz/l-zakat-basics/submit",
        json={"answers": {"q-zakat-1": 1, "q-zakat-2": 1}},
        headers=registered_user["headers"],
    )
    resp = client.get("/api/academy/progress", headers=registered_user["headers"])
    assert resp.status_code == 200
    economics_progress = next(p for p in resp.json() if p["path_id"] == "p-economics-basics")
    assert economics_progress["completed_lessons"] == 1
