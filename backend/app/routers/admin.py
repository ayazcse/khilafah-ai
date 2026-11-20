"""Admin dashboard: user/document management, stats, logs, feedback."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.app.deps import get_db, require_admin
from backend.app.models import (
    AIRequestLog,
    Conversation,
    Document,
    Feedback,
    User,
)
from backend.app.schemas import (
    AdminStats,
    AIRequestLogOut,
    DocumentOut,
    DocumentStatusUpdate,
    FeedbackOut,
    UserOut,
)

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db)) -> list[User]:
    return db.query(User).order_by(User.created_at.desc()).all()


@router.get("/documents", response_model=list[DocumentOut])
def list_all_documents(db: Session = Depends(get_db)) -> list[Document]:
    return db.query(Document).order_by(Document.created_at.desc()).all()


@router.patch("/documents/{document_id}/status", response_model=DocumentOut)
def update_document_status(
    document_id: uuid.UUID,
    payload: DocumentStatusUpdate,
    db: Session = Depends(get_db),
) -> Document:
    document = db.get(Document, document_id)
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    document.status = payload.status
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


@router.get("/stats", response_model=AdminStats)
def stats(db: Session = Depends(get_db)) -> dict:
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_documents = db.query(func.count(Document.id)).scalar() or 0
    total_conversations = db.query(func.count(Conversation.id)).scalar() or 0
    total_chat_requests = (
        db.query(func.count(AIRequestLog.id)).filter(AIRequestLog.endpoint == "/api/chat").scalar() or 0
    )
    avg_latency = (
        db.query(func.avg(AIRequestLog.latency_ms)).filter(AIRequestLog.endpoint == "/api/chat").scalar()
    )
    total_feedback = db.query(func.count(Feedback.id)).scalar() or 0

    return {
        "total_users": total_users,
        "total_documents": total_documents,
        "total_conversations": total_conversations,
        "total_chat_requests": total_chat_requests,
        "avg_chat_latency_ms": round(avg_latency, 2) if avg_latency is not None else None,
        "total_feedback": total_feedback,
    }


@router.get("/logs", response_model=list[AIRequestLogOut])
def logs(limit: int = 100, db: Session = Depends(get_db)) -> list[AIRequestLog]:
    return (
        db.query(AIRequestLog)
        .order_by(AIRequestLog.created_at.desc())
        .limit(min(limit, 500))
        .all()
    )


@router.get("/feedback", response_model=list[FeedbackOut])
def feedback(db: Session = Depends(get_db)) -> list[Feedback]:
    return db.query(Feedback).order_by(Feedback.created_at.desc()).all()
