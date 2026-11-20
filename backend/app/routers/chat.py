"""Chat endpoint — routes through the ai_engine LangGraph agent workflow."""
# NOTE: no postponed annotations here; slowapi's decorator can interfere
# with FastAPI body-model resolution when annotations are postponed.
import time

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from backend.app.deps import get_current_user, get_db
from backend.app.models import AIRequestLog, Conversation, Message, User
from backend.app.rate_limit import limiter
from backend.app.schemas import ChatRequest, ChatResponse

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
@limiter.limit("30/minute")
def chat(
    request: Request,
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChatResponse:
    if payload.conversation_id:
        conversation = db.get(Conversation, payload.conversation_id)
        if conversation is None or conversation.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    else:
        conversation = Conversation(user_id=current_user.id)
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    db.add(Message(conversation_id=conversation.id, role="user", content=payload.message))
    db.commit()

    start = time.monotonic()
    error_text: str | None = None
    try:
        from ai_engine.agents.graph import run_query

        result = run_query(
            message=payload.message,
            language=payload.language,
            user_id=str(current_user.id),
            db=db,
        )
    except ImportError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI engine is not available in this deployment.",
        ) from exc
    except Exception as exc:  # noqa: BLE001
        if exc.__class__.__name__ == "LLMNotConfiguredError":
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI features require Gemini. Add GEMINI_API_KEY to your environment.",
            ) from exc
        error_text = str(exc)
        result = {
            "answer": "I'm unable to produce a verified answer right now due to an internal error. Please try again shortly.",
            "citations": [],
            "agent_trace": [{"agent": "system", "summary": "Request failed; no fabricated answer was returned."}],
            "uncertainty_note": "This response reflects a system error, not a researched answer.",
        }

    latency_ms = (time.monotonic() - start) * 1000
    db.add(
        Message(
            conversation_id=conversation.id,
            role="assistant",
            content=result["answer"],
            citations_json={"citations": result.get("citations", [])},
            agent_trace_json={"trace": result.get("agent_trace", [])},
        )
    )
    db.add(
        AIRequestLog(
            user_id=current_user.id,
            endpoint="/api/chat",
            latency_ms=latency_ms,
            token_usage_json=result.get("token_usage"),
            error=error_text,
        )
    )
    db.commit()

    return ChatResponse(
        conversation_id=conversation.id,
        answer=result["answer"],
        citations=result.get("citations", []),
        agent_trace=result.get("agent_trace", []),
        uncertainty_note=result.get("uncertainty_note"),
    )


@router.get("/history")
def history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict]:
    conversations = (
        db.query(Conversation)
        .filter(Conversation.user_id == current_user.id)
        .order_by(Conversation.created_at.desc())
        .all()
    )
    out = []
    for conv in conversations:
        messages = (
            db.query(Message)
            .filter(Message.conversation_id == conv.id)
            .order_by(Message.created_at.asc())
            .all()
        )
        out.append(
            {
                "conversation_id": str(conv.id),
                "created_at": conv.created_at.isoformat(),
                "messages": [
                    {"role": message.role, "content": message.content, "created_at": message.created_at.isoformat()}
                    for message in messages
                ],
            }
        )
    return out
