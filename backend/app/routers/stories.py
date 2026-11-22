"""Ephemeral community stories and view-once snaps with server-enforced visibility."""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from urllib.parse import urlsplit

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import and_, or_, func
from sqlalchemy.orm import Session, joinedload

from backend.app.deps import get_current_user, get_db
from backend.app.models import CommunityFollow, CommunityStory, CommunityStoryView, User

router = APIRouter(prefix="/stories", tags=["community stories"])


class StoryCreate(BaseModel):
    media_type: str = Field(pattern="^(text|image|video)$")
    media_url: str | None = Field(default=None, max_length=1000)
    caption: str = Field(default="", max_length=500)
    audience: str = Field(default="all", pattern="^(all|followers)$")
    view_once: bool = False


def _safe_media_url(value: str | None) -> str | None:
    if value is None:
        return None
    parsed = urlsplit(value.strip())
    if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
        raise HTTPException(422, "Media URL must be a valid HTTPS URL")
    if parsed.port not in (None, 443):
        raise HTTPException(422, "Media URL must use the standard HTTPS port")
    return value.strip()


def _can_view(db: Session, story: CommunityStory, viewer_id: uuid.UUID) -> bool:
    if story.author_id == viewer_id:
        return True
    if story.audience == "all":
        return True
    return db.query(CommunityFollow.id).filter(
        CommunityFollow.follower_id == viewer_id,
        CommunityFollow.followed_id == story.author_id,
    ).first() is not None


def _out(db: Session, story: CommunityStory, viewer_id: uuid.UUID) -> dict:
    author = story.author or db.get(User, story.author_id)
    viewed = db.query(CommunityStoryView.id).filter_by(
        story_id=story.id, viewer_id=viewer_id
    ).first() is not None
    views = db.query(func.count(CommunityStoryView.id)).filter_by(story_id=story.id).scalar() or 0
    return {
        "id": str(story.id), "media_type": story.media_type, "media_url": story.media_url,
        "caption": story.caption, "audience": story.audience, "view_once": story.view_once,
        "created_at": story.created_at.isoformat(), "expires_at": story.expires_at.isoformat(),
        "viewed_by_me": viewed, "view_count": views if story.author_id == viewer_id else None,
        "is_mine": story.author_id == viewer_id,
        "author": {"id": str(author.id), "full_name": author.full_name, "avatar_url": author.avatar_url},
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_story(payload: StoryCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    caption = payload.caption.strip()
    media_url = _safe_media_url(payload.media_url)
    if payload.media_type in ("image", "video") and not media_url:
        raise HTTPException(422, "Image and video stories require an HTTPS media URL")
    if payload.media_type == "text" and not caption:
        raise HTTPException(422, "Text stories need a caption")
    story = CommunityStory(
        author_id=user.id, media_type=payload.media_type, media_url=media_url,
        caption=caption, audience=payload.audience, view_once=payload.view_once,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
    )
    db.add(story)
    db.commit()
    db.refresh(story)
    story.author = user
    return _out(db, story, user.id)


@router.get("")
def list_stories(
    db: Session = Depends(get_db), user: User = Depends(get_current_user),
    limit: int = Query(default=100, ge=1, le=200),
):
    now = datetime.now(timezone.utc)
    rows = db.query(CommunityStory).options(joinedload(CommunityStory.author)).filter(
        CommunityStory.expires_at > now
    ).order_by(CommunityStory.created_at.desc()).limit(limit * 3).all()
    visible = []
    for story in rows:
        if not _can_view(db, story, user.id):
            continue
        viewed = db.query(CommunityStoryView.id).filter_by(story_id=story.id, viewer_id=user.id).first()
        if story.view_once and viewed and story.author_id != user.id:
            continue
        visible.append(_out(db, story, user.id))
        if len(visible) >= limit:
            break
    return {"stories": visible}


@router.post("/{story_id}/view")
def view_story(story_id: uuid.UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    story = db.query(CommunityStory).options(joinedload(CommunityStory.author)).filter_by(id=story_id).first()
    if not story or story.expires_at <= datetime.now(timezone.utc):
        raise HTTPException(404, "Story not found or expired")
    if not _can_view(db, story, user.id):
        raise HTTPException(404, "Story not found")
    if story.author_id == user.id:
        return {"story": _out(db, story, user.id), "owner_preview": True}
    previous = db.query(CommunityStoryView).filter_by(story_id=story.id, viewer_id=user.id).first()
    if story.view_once and previous:
        raise HTTPException(410, "This snap has already been viewed")
    if not previous:
        db.add(CommunityStoryView(story_id=story.id, viewer_id=user.id))
        db.commit()
    return {"story": _out(db, story, user.id), "owner_preview": False}


@router.get("/{story_id}/views")
def story_views(story_id: uuid.UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    story = db.get(CommunityStory, story_id)
    if not story or story.author_id != user.id:
        raise HTTPException(404, "Story not found")
    rows = db.query(CommunityStoryView, User).join(User, User.id == CommunityStoryView.viewer_id).filter(
        CommunityStoryView.story_id == story.id
    ).order_by(CommunityStoryView.viewed_at.desc()).limit(200).all()
    return {"views": [{"user_id": str(viewer.id), "full_name": viewer.full_name,
                       "viewed_at": view.viewed_at.isoformat()} for view, viewer in rows]}


@router.delete("/{story_id}", status_code=204)
def delete_story(story_id: uuid.UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    story = db.get(CommunityStory, story_id)
    if not story:
        raise HTTPException(404, "Story not found")
    if story.author_id != user.id and user.role != "admin":
        raise HTTPException(403, "You can only delete your own story")
    db.delete(story)
    db.commit()
    return None
