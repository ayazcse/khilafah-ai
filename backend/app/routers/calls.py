"""Authenticated, short-lived WebRTC signaling for accepted inbox conversations.

This API exchanges SDP and ICE metadata only. Audio/video media flows through WebRTC,
not through this application server.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from backend.app.deps import get_current_user, get_db
from backend.app.models import InboxBlock, InboxCall, InboxConversation, User

router = APIRouter(prefix="/calls", tags=["WebRTC calls"])
CALL_TTL_MINUTES = 3
MAX_CANDIDATES = 200


class StartCall(BaseModel):
    call_type: str = Field(pattern="^(audio|video)$")
    offer: dict


class AnswerCall(BaseModel):
    answer: dict


class IceCandidate(BaseModel):
    candidate: dict


def _blocked(db: Session, a: uuid.UUID, b: uuid.UUID) -> bool:
    return db.query(InboxBlock.id).filter(or_(
        and_(InboxBlock.blocker_id == a, InboxBlock.blocked_id == b),
        and_(InboxBlock.blocker_id == b, InboxBlock.blocked_id == a),
    )).first() is not None


def _participant_call(db: Session, call_id: uuid.UUID, user_id: uuid.UUID) -> InboxCall:
    call = db.get(InboxCall, call_id)
    if not call or user_id not in (call.caller_id, call.callee_id):
        raise HTTPException(404, "Call not found")
    conversation = db.get(InboxConversation, call.conversation_id)
    if not conversation or conversation.status != "accepted" or _blocked(db, call.caller_id, call.callee_id):
        raise HTTPException(403, "Call is no longer available")
    if call.status in ("ringing", "accepted") and call.expires_at <= datetime.now(timezone.utc):
        call.status = "expired"
        db.commit()
        raise HTTPException(410, "Call invitation expired")
    return call


def _out(call: InboxCall, viewer: uuid.UUID) -> dict:
    return {
        "id": str(call.id), "conversation_id": str(call.conversation_id),
        "call_type": call.call_type, "status": call.status,
        "caller_id": str(call.caller_id), "callee_id": str(call.callee_id),
        "offer": call.offer_json if viewer == call.callee_id else None,
        "answer": call.answer_json if viewer == call.caller_id else None,
        "local_candidates": call.caller_candidates if viewer == call.caller_id else call.callee_candidates,
        "remote_candidates": call.callee_candidates if viewer == call.caller_id else call.caller_candidates,
        "expires_at": call.expires_at.isoformat(),
    }


@router.post("", status_code=201)
def start_call(payload: StartCall, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    conversation_id = payload.offer.get("conversation_id")
    try:
        conversation_uuid = uuid.UUID(str(conversation_id))
    except (ValueError, TypeError):
        raise HTTPException(422, "A valid conversation_id is required in offer metadata")
    conversation = db.get(InboxConversation, conversation_uuid)
    if not conversation or user.id not in (conversation.participant_a_id, conversation.participant_b_id):
        raise HTTPException(404, "Conversation not found")
    other_id = conversation.participant_b_id if conversation.participant_a_id == user.id else conversation.participant_a_id
    if conversation.status != "accepted" or _blocked(db, user.id, other_id):
        raise HTTPException(403, "Calls require an accepted, available conversation")
    active = db.query(InboxCall).filter(
        InboxCall.conversation_id == conversation.id,
        InboxCall.status.in_([ "ringing", "accepted" ]),
        InboxCall.expires_at > datetime.now(timezone.utc),
    ).first()
    if active:
        raise HTTPException(409, "A call is already active for this conversation")
    offer = payload.offer.get("sdp")
    if not isinstance(offer, str) or len(offer) > 100000:
        raise HTTPException(422, "Invalid WebRTC offer")
    call = InboxCall(
        conversation_id=conversation.id, caller_id=user.id, callee_id=other_id,
        call_type=payload.call_type, offer_json={"type": "offer", "sdp": offer},
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=CALL_TTL_MINUTES),
    )
    db.add(call); db.commit(); db.refresh(call)
    return _out(call, user.id)


@router.get("/incoming")
def incoming_calls(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    db.query(InboxCall).filter(InboxCall.callee_id == user.id, InboxCall.status == "ringing", InboxCall.expires_at <= now).update({"status": "expired"})
    db.commit()
    rows = db.query(InboxCall).filter(InboxCall.callee_id == user.id, InboxCall.status == "ringing", InboxCall.expires_at > now).order_by(InboxCall.created_at.desc()).limit(10).all()
    return {"calls": [_out(row, user.id) for row in rows]}


@router.get("/{call_id}")
def get_call(call_id: uuid.UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return _out(_participant_call(db, call_id, user.id), user.id)


@router.post("/{call_id}/accept")
def accept_call(call_id: uuid.UUID, payload: AnswerCall, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    call = _participant_call(db, call_id, user.id)
    if call.callee_id != user.id or call.status != "ringing":
        raise HTTPException(409, "This call cannot be accepted")
    sdp = payload.answer.get("sdp")
    if not isinstance(sdp, str) or len(sdp) > 100000:
        raise HTTPException(422, "Invalid WebRTC answer")
    call.answer_json = {"type": "answer", "sdp": sdp}
    call.status = "accepted"
    call.expires_at = datetime.now(timezone.utc) + timedelta(minutes=CALL_TTL_MINUTES)
    db.commit()
    return _out(call, user.id)


@router.post("/{call_id}/candidates")
def add_candidate(call_id: uuid.UUID, payload: IceCandidate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    call = _participant_call(db, call_id, user.id)
    if call.status not in ("ringing", "accepted"):
        raise HTTPException(409, "Call is not active")
    candidate = payload.candidate
    if not isinstance(candidate, dict) or len(str(candidate)) > 4000:
        raise HTTPException(422, "Invalid ICE candidate")
    bucket = call.caller_candidates if user.id == call.caller_id else call.callee_candidates
    if len(bucket) >= MAX_CANDIDATES:
        raise HTTPException(429, "ICE candidate limit reached")
    bucket.append(candidate)
    if user.id == call.caller_id:
        call.caller_candidates = bucket
    else:
        call.callee_candidates = bucket
    db.commit()
    return {"stored": True}


@router.post("/{call_id}/decline")
@router.post("/{call_id}/end")
def end_call(call_id: uuid.UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    call = _participant_call(db, call_id, user.id)
    if call.status in ("ringing", "accepted"):
        call.status = "declined" if user.id == call.callee_id and call.status == "ringing" else "ended"
        db.commit()
    return {"status": call.status}
