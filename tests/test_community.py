from __future__ import annotations

import uuid


def _register(client, label: str):
    email = f"{label}-{uuid.uuid4().hex[:8]}@example.com"
    payload = {"email": email, "password": "StrongPass123", "full_name": label}
    registered = client.post("/api/auth/register", json=payload)
    assert registered.status_code in (200, 201)
    login = client.post("/api/auth/login", json={"email": email, "password": payload["password"]})
    assert login.status_code == 200
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_community_requires_authentication(client):
    assert client.get("/api/community/feed").status_code == 401
    assert client.post("/api/community/posts", json={"body": "Hello"}).status_code == 401


def test_community_post_like_comment_follow_report_and_delete(client):
    first = _register(client, "Community Author")
    second = _register(client, "Community Reader")

    created = client.post(
        "/api/community/posts",
        json={"body": "A source-led discussion about scientific history.", "topic": "Science"},
        headers=first,
    )
    assert created.status_code == 201
    post = created.json()
    assert post["body"].startswith("A source-led")
    assert post["topic"] == "Science"
    post_id = post["id"]
    author_id = post["author"]["id"]

    feed = client.get("/api/community/feed?topic=Science", headers=second)
    assert feed.status_code == 200
    assert len(feed.json()["posts"]) == 1
    assert feed.json()["posts"][0]["author"]["id"] == author_id

    like = client.post(f"/api/community/posts/{post_id}/like", headers=second)
    assert like.status_code == 200
    assert like.json() == {"liked": True, "like_count": 1}
    unlike = client.post(f"/api/community/posts/{post_id}/like", headers=second)
    assert unlike.status_code == 200
    assert unlike.json() == {"liked": False, "like_count": 0}

    comment = client.post(
        f"/api/community/posts/{post_id}/comments",
        json={"body": "Could you share the primary source?"},
        headers=second,
    )
    assert comment.status_code == 201
    comments = client.get(f"/api/community/posts/{post_id}/comments", headers=first)
    assert comments.status_code == 200
    assert comments.json()["comments"][0]["body"] == "Could you share the primary source?"

    follow = client.post(f"/api/community/users/{author_id}/follow", headers=second)
    assert follow.status_code == 200
    assert follow.json()["following"] is True
    self_follow = client.post(f"/api/community/users/{author_id}/follow", headers=first)
    assert self_follow.status_code == 400

    report = client.post(
        f"/api/community/posts/{post_id}/report",
        json={"reason": "This appears to contain spam."},
        headers=second,
    )
    assert report.status_code == 201
    assert report.json()["submitted"] is True

    forbidden_delete = client.delete(f"/api/community/posts/{post_id}", headers=second)
    assert forbidden_delete.status_code == 403
    deleted = client.delete(f"/api/community/posts/{post_id}", headers=first)
    assert deleted.status_code == 204
    missing = client.get(f"/api/community/posts/{post_id}/comments", headers=first)
    assert missing.status_code == 404


def test_community_rejects_invalid_topic_and_blank_post(client):
    headers = _register(client, "Community Validator")
    invalid_topic = client.post(
        "/api/community/posts",
        json={"body": "Not a valid topic", "topic": "Unlisted"},
        headers=headers,
    )
    assert invalid_topic.status_code == 422
    blank = client.post(
        "/api/community/posts",
        json={"body": "   ", "topic": "General"},
        headers=headers,
    )
    assert blank.status_code == 422
