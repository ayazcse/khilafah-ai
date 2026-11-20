"""Governance Research Lab — static, cited historical administration topics."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from backend.app.schemas import GovernanceTopicOut
from simulations.governance_models import get_topic, list_topics

router = APIRouter(prefix="/governance", tags=["governance"])


@router.get("/topics", response_model=list[GovernanceTopicOut])
def topics() -> list[dict]:
    return list_topics()


@router.get("/topics/{topic_id}", response_model=GovernanceTopicOut)
def topic_detail(topic_id: str) -> dict:
    topic = get_topic(topic_id)
    if topic is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")
    return topic


@router.get("/compare")
def compare(a: str, b: str) -> dict:
    topic_a = get_topic(a)
    topic_b = get_topic(b)
    if topic_a is None or topic_b is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or both topics not found")
    return {"a": topic_a, "b": topic_b}
