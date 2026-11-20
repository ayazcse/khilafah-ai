"""Shared state object passed between agent nodes in the LangGraph workflow."""
from __future__ import annotations

from typing import Annotated, TypedDict


class AgentTraceEntry(TypedDict):
    agent: str
    summary: str


class WorkflowState(TypedDict, total=False):
    message: str
    language: str
    user_id: str
    category: str
    draft_answer: str
    final_answer: str
    citations: list[dict]
    agent_trace: list[AgentTraceEntry]
    uncertainty_note: str | None
    error: str | None
