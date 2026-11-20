"""User-facing feedback submission (viewed by admins via /api/admin/feedback)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.app.deps import get_current_user, get_db
from backend.app.models import Feedback, User
from backend.app.schemas import FeedbackIn, FeedbackOut

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.post("", response_model=FeedbackOut, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    payload: FeedbackIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Feedback:
    entry = Feedback(user_id=current_user.id, message=payload.message)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
