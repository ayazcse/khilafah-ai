from __future__ import annotations
import uuid


def account(client, name):
    email = name.lower() + "-" + uuid.uuid4().hex[:8] + "@example.com"
    password = "StrongPass123"
    client.post("/api/auth/register", json={"email": email, "password": password, "full_name": name})
    token = client.post("/api/auth/login", json={"email": email, "password": password}).json()["access_token"]
    return {"Authorization": "Bearer " + token}


def test_story_expiry_audience_and_view_once(client):
    author = account(client, "StoryAuthor")
    follower = account(client, "StoryFollower")
    stranger = account(client, "StoryStranger")
    author_id = client.get("/api/auth/me", headers=author).json()["id"]

    followers_only = client.post("/api/stories", headers=author, json={
        "media_type": "text", "caption": "Private followers update", "audience": "followers"
    })
    assert followers_only.status_code == 201
    private_id = followers_only.json()["id"]
    assert all(row["id"] != private_id for row in client.get("/api/stories", headers=stranger).json()["stories"])

    follow = client.post("/api/community/users/" + author_id + "/follow", headers=follower)
    assert follow.status_code == 200
    assert any(row["id"] == private_id for row in client.get("/api/stories", headers=follower).json()["stories"])

    snap = client.post("/api/stories", headers=author, json={
        "media_type": "text", "caption": "One view only", "view_once": True
    })
    assert snap.status_code == 201
    snap_id = snap.json()["id"]
    first = client.post("/api/stories/" + snap_id + "/view", headers=follower)
    assert first.status_code == 200
    second = client.post("/api/stories/" + snap_id + "/view", headers=follower)
    assert second.status_code == 410
    assert all(row["id"] != snap_id for row in client.get("/api/stories", headers=follower).json()["stories"])


def test_story_requires_https_media_and_owner_only_delete(client):
    author = account(client, "MediaAuthor")
    stranger = account(client, "MediaStranger")
    bad = client.post("/api/stories", headers=author, json={
        "media_type": "image", "media_url": "http://example.com/photo.jpg", "caption": "No insecure links"
    })
    assert bad.status_code == 422
    created = client.post("/api/stories", headers=author, json={
        "media_type": "image", "media_url": "https://cdn.example.com/photo.jpg", "caption": "A moment"
    })
    assert created.status_code == 201
    story_id = created.json()["id"]
    assert client.delete("/api/stories/" + story_id, headers=stranger).status_code == 403
    assert client.delete("/api/stories/" + story_id, headers=author).status_code == 204
