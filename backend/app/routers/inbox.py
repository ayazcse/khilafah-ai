"""Private one-to-one messaging. Every read/write is scoped to conversation participants."""
from __future__ import annotations
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session
from backend.app.deps import get_current_user, get_db
from backend.app.models import InboxBlock, InboxConversation, InboxMessage, User
router = APIRouter(prefix="/inbox", tags=["private inbox"])
class StartConversation(BaseModel):
    recipient_id: uuid.UUID
    body: str = Field(min_length=1, max_length=2000)
class SendMessage(BaseModel):
    body: str = Field(min_length=1, max_length=2000)
def blocked(db, a, b):
    return db.query(InboxBlock.id).filter(or_(and_(InboxBlock.blocker_id==a,InboxBlock.blocked_id==b),and_(InboxBlock.blocker_id==b,InboxBlock.blocked_id==a))).first() is not None
def get_conversation(db, cid, uid):
    row=db.get(InboxConversation,cid)
    if not row or uid not in (row.participant_a_id,row.participant_b_id):
        raise HTTPException(404,"Conversation not found")
    return row
def other(row, uid):
    return row.participant_b_id if row.participant_a_id==uid else row.participant_a_id
def msg_out(m):
    return {"id":str(m.id),"sender_id":str(m.sender_id),"body":m.body,"created_at":m.created_at.isoformat()}
def conv_out(db,row,uid):
    member=db.get(User,other(row,uid))
    latest=db.query(InboxMessage).filter_by(conversation_id=row.id).order_by(InboxMessage.created_at.desc()).first()
    return {"id":str(row.id),"status":row.status,"other_member":{"id":str(member.id),"full_name":member.full_name,"avatar_url":member.avatar_url},"last_message":msg_out(latest) if latest else None,"is_request":row.status=="pending" and row.initiated_by_id!=uid}
@router.get("/conversations")
def conversations(db:Session=Depends(get_db), user:User=Depends(get_current_user)):
    rows=db.query(InboxConversation).filter(or_(InboxConversation.participant_a_id==user.id,InboxConversation.participant_b_id==user.id)).order_by(InboxConversation.updated_at.desc()).limit(100).all()
    return {"conversations":[conv_out(db,r,user.id) for r in rows if not blocked(db,user.id,other(r,user.id))]}
@router.post("/conversations",status_code=201)
def start(p:StartConversation,db:Session=Depends(get_db),user:User=Depends(get_current_user)):
    body=p.body.strip()
    if not body: raise HTTPException(422,"Message cannot be empty")
    if p.recipient_id==user.id: raise HTTPException(400,"You cannot message yourself")
    recipient=db.get(User,p.recipient_id)
    if not recipient: raise HTTPException(404,"Member not found")
    if blocked(db,user.id,recipient.id): raise HTTPException(403,"Messaging is unavailable")
    row=db.query(InboxConversation).filter(or_(and_(InboxConversation.participant_a_id==user.id,InboxConversation.participant_b_id==recipient.id),and_(InboxConversation.participant_a_id==recipient.id,InboxConversation.participant_b_id==user.id))).first()
    if row and row.status=="blocked": raise HTTPException(403,"Messaging is unavailable")
    if row and row.status=="pending" and row.initiated_by_id!=user.id: raise HTTPException(409,"Accept or decline the incoming request first")
    if not row:
        row=InboxConversation(participant_a_id=user.id,participant_b_id=recipient.id,initiated_by_id=user.id,status="pending")
        db.add(row); db.flush()
    row.updated_at=datetime.now(timezone.utc)
    db.add(InboxMessage(conversation_id=row.id,sender_id=user.id,body=body))
    db.commit(); db.refresh(row)
    return conv_out(db,row,user.id)
@router.post("/conversations/{cid}/accept")
def accept(cid:uuid.UUID,db:Session=Depends(get_db),user:User=Depends(get_current_user)):
    row=get_conversation(db,cid,user.id)
    if row.status!="pending" or row.initiated_by_id==user.id: raise HTTPException(409,"No incoming request")
    if blocked(db,user.id,other(row,user.id)): raise HTTPException(403,"Messaging unavailable")
    row.status="accepted"; row.updated_at=datetime.now(timezone.utc); db.commit()
    return {"accepted":True}
@router.post("/conversations/{cid}/decline")
def decline(cid:uuid.UUID,db:Session=Depends(get_db),user:User=Depends(get_current_user)):
    row=get_conversation(db,cid,user.id)
    if row.status!="pending" or row.initiated_by_id==user.id: raise HTTPException(409,"No incoming request")
    db.delete(row); db.commit(); return {"declined":True}
@router.get("/conversations/{cid}/messages")
def messages(cid:uuid.UUID,offset:int=Query(0,ge=0),db:Session=Depends(get_db),user:User=Depends(get_current_user)):
    row=get_conversation(db,cid,user.id)
    if row.status!="accepted" or blocked(db,user.id,other(row,user.id)): raise HTTPException(403,"Conversation is not available")
    rows=db.query(InboxMessage).filter_by(conversation_id=row.id).order_by(InboxMessage.created_at.asc()).offset(offset).limit(100).all()
    return {"messages":[msg_out(m) for m in rows]}
@router.post("/conversations/{cid}/messages",status_code=201)
def send(cid:uuid.UUID,p:SendMessage,db:Session=Depends(get_db),user:User=Depends(get_current_user)):
    row=get_conversation(db,cid,user.id)
    if row.status!="accepted" or blocked(db,user.id,other(row,user.id)): raise HTTPException(403,"Conversation is not available")
    body=p.body.strip()
    if not body: raise HTTPException(422,"Message cannot be empty")
    m=InboxMessage(conversation_id=row.id,sender_id=user.id,body=body); row.updated_at=datetime.now(timezone.utc)
    db.add(m); db.commit(); db.refresh(m); return msg_out(m)
@router.post("/members/{member_id}/block")
def block(member_id:uuid.UUID,db:Session=Depends(get_db),user:User=Depends(get_current_user)):
    if member_id==user.id or not db.get(User,member_id): raise HTTPException(404,"Member not found")
    if not db.query(InboxBlock.id).filter_by(blocker_id=user.id,blocked_id=member_id).first():
        db.add(InboxBlock(blocker_id=user.id,blocked_id=member_id))
    rows=db.query(InboxConversation).filter(or_(and_(InboxConversation.participant_a_id==user.id,InboxConversation.participant_b_id==member_id),and_(InboxConversation.participant_a_id==member_id,InboxConversation.participant_b_id==user.id))).all()
    for row in rows: row.status="blocked"
    db.commit(); return {"blocked":True}
