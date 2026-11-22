"""Authenticated community feed, follows, comments, likes and reports."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from backend.app.deps import get_current_user, get_db
from backend.app.models import (
    CommunityComment, CommunityFollow, CommunityLike, CommunityPost,
    CommunityReport, User,
)

router = APIRouter(prefix="/community", tags=["community"])
TOPICS = {"General", "History", "Science", "Quran & Learning", "Research", "Society & Economy"}


class PostCreate(BaseModel):
    body: str = Field(min_length=1, max_length=2000)
    topic: str = "General"


class CommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=1000)


class ReportCreate(BaseModel):
    reason: str = Field(min_length=3, max_length=500)


def _post_out(post: CommunityPost, user_id: uuid.UUID, db: Session) -> dict:
    likes = db.query(func.count(CommunityLike.id)).filter(CommunityLike.post_id == post.id).scalar() or 0
    comments = db.query(func.count(CommunityComment.id)).filter(CommunityComment.post_id == post.id).scalar() or 0
    liked = db.query(CommunityLike.id).filter(
        CommunityLike.post_id == post.id, CommunityLike.user_id == user_id
    ).first() is not None
    following = db.query(CommunityFollow.id).filter(
        CommunityFollow.follower_id == user_id, CommunityFollow.followed_id == post.author_id
    ).first() is not None
    return {
        "id": str(post.id), "body": post.body, "topic": post.topic,
        "created_at": post.created_at.isoformat(),
        "author": {"id": str(post.author.id), "full_name": post.author.full_name},
        "like_count": likes, "comment_count": comments, "liked_by_me": liked,
        "following_author": following, "is_mine": post.author_id == user_id,
    }


@router.get("/feed")
def feed(
    topic: str | None = Query(default=None, max_length=40),
    offset: int = Query(default=0, ge=0, le=10000),
    limit: int = Query(default=20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    query = db.query(CommunityPost).options(joinedload(CommunityPost.author))
    if topic and topic != "All":
        query = query.filter(CommunityPost.topic == topic)
    posts = query.order_by(CommunityPost.created_at.desc()).offset(offset).limit(limit).all()
    return {"posts": [_post_out(post, current_user.id, db) for post in posts], "offset": offset, "limit": limit}


@router.post("/posts", status_code=status.HTTP_201_CREATED)
def create_post(
    payload: PostCreate, db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    body = payload.body.strip()
    if not body:
        raise HTTPException(status_code=422, detail="Post cannot be empty")
    if payload.topic not in TOPICS:
        raise HTTPException(status_code=422, detail="Choose a valid community topic")
    post = CommunityPost(author_id=current_user.id, body=body, topic=payload.topic)
    db.add(post)
    db.commit()
    post = db.query(CommunityPost).options(joinedload(CommunityPost.author)).filter(
        CommunityPost.id == post.id
    ).one()
    return _post_out(post, current_user.id, db)


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_post(
    post_id: uuid.UUID, db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    post = db.get(CommunityPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.author_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You can only remove your own post")
    db.delete(post)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/posts/{post_id}/like")
def toggle_like(
    post_id: uuid.UUID, db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    if not db.get(CommunityPost, post_id):
        raise HTTPException(status_code=404, detail="Post not found")
    existing = db.query(CommunityLike).filter(
        CommunityLike.post_id == post_id, CommunityLike.user_id == current_user.id
    ).first()
    if existing:
        db.delete(existing)
        liked = False
    else:
        db.add(CommunityLike(post_id=post_id, user_id=current_user.id))
        liked = True
    db.commit()
    count = db.query(func.count(CommunityLike.id)).filter(CommunityLike.post_id == post_id).scalar() or 0
    return {"liked": liked, "like_count": count}


@router.get("/posts/{post_id}/comments")
def list_comments(
    post_id: uuid.UUID, db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    if not db.get(CommunityPost, post_id):
        raise HTTPException(status_code=404, detail="Post not found")
    rows = db.query(CommunityComment).options(joinedload(CommunityComment.author)).filter(
        CommunityComment.post_id == post_id
    ).order_by(CommunityComment.created_at.asc()).limit(100).all()
    return {"comments": [{
        "id": str(row.id), "body": row.body, "created_at": row.created_at.isoformat(),
        "author": {"id": str(row.author.id), "full_name": row.author.full_name},
        "is_mine": row.author_id == current_user.id,
    } for row in rows]}


@router.post("/posts/{post_id}/comments", status_code=status.HTTP_201_CREATED)
def add_comment(
    post_id: uuid.UUID, payload: CommentCreate, db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    if not db.get(CommunityPost, post_id):
        raise HTTPException(status_code=404, detail="Post not found")
    body = payload.body.strip()
    if not body:
        raise HTTPException(status_code=422, detail="Comment cannot be empty")
    row = CommunityComment(post_id=post_id, author_id=current_user.id, body=body)
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": str(row.id), "body": row.body, "created_at": row.created_at.isoformat(),
            "author": {"id": str(current_user.id), "full_name": current_user.full_name}, "is_mine": True}


@router.post("/users/{user_id}/follow")
def toggle_follow(
    user_id: uuid.UUID, db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot follow yourself")
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    existing = db.query(CommunityFollow).filter(
        CommunityFollow.follower_id == current_user.id,
        CommunityFollow.followed_id == user_id,
    ).first()
    if existing:
        db.delete(existing)
        following = False
    else:
        db.add(CommunityFollow(follower_id=current_user.id, followed_id=user_id))
        following = True
    db.commit()
    followers = db.query(func.count(CommunityFollow.id)).filter(CommunityFollow.followed_id == user_id).scalar() or 0
    return {"following": following, "follower_count": followers}


@router.post("/posts/{post_id}/report", status_code=status.HTTP_201_CREATED)
def report_post(
    post_id: uuid.UUID, payload: ReportCreate, db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    if not db.get(CommunityPost, post_id):
        raise HTTPException(status_code=404, detail="Post not found")
    db.add(CommunityReport(reporter_id=current_user.id, post_id=post_id, reason=payload.reason.strip()))
    db.commit()
    return {"submitted": True, "message": "Report sent to the moderation queue."}
