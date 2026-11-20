"""Pydantic request/response schemas."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    role: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- Chat ----------
class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    conversation_id: uuid.UUID | None = None
    language: Literal["en", "hi", "ar"] = "en"


class Citation(BaseModel):
    source_id: str
    title: str
    author: str | None = None
    page: int | None = None
    source_type: str | None = None


class AgentTraceStep(BaseModel):
    agent: str
    summary: str


class ChatResponse(BaseModel):
    conversation_id: uuid.UUID
    answer: str
    citations: list[Citation] = []
    agent_trace: list[AgentTraceStep] = []
    uncertainty_note: str | None = None


# ---------- Documents ----------
class DocumentOut(BaseModel):
    id: uuid.UUID
    title: str
    author: str | None
    source_type: str | None
    language: str | None
    historical_period: str | None
    filename: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentUploadResponse(BaseModel):
    document_id: uuid.UUID
    status: str


class DocumentSearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    document_id: uuid.UUID | None = None
    top_k: int = Field(default=5, ge=1, le=20)


class DocumentSearchResult(BaseModel):
    chunk_text: str
    page: int | None
    document_title: str
    score: float


# ---------- Knowledge Graph ----------
class GraphNode(BaseModel):
    id: str
    label: str
    type: str


class GraphEdge(BaseModel):
    source: str
    target: str
    type: str


class GraphResponse(BaseModel):
    nodes: list[GraphNode] = []
    edges: list[GraphEdge] = []
    degraded: bool = False
    message: str | None = None


# ---------- Governance ----------
class GovernanceTopicOut(BaseModel):
    id: str
    title: str
    summary: str
    description: str
    evidence_level: Literal["established", "disputed", "academic_interpretation", "hypothetical_simulation"]
    sources: list[str]
    period: str | None = None


# ---------- Economics ----------
class ZakatRequest(BaseModel):
    cash: float = Field(ge=0, default=0)
    gold_grams: float = Field(ge=0, default=0)
    silver_grams: float = Field(ge=0, default=0)
    trade_goods_value: float = Field(ge=0, default=0)
    liabilities: float = Field(ge=0, default=0)
    nisab_standard: Literal["gold", "silver"] = "silver"
    gold_price_per_gram: float = Field(gt=0, default=1.0)
    silver_price_per_gram: float = Field(gt=0, default=1.0)


class ZakatResponse(BaseModel):
    zakatable_wealth: float
    nisab_threshold: float
    meets_nisab: bool
    zakat_due: float
    rate: float = 0.025
    assumptions: list[str]
    disclaimer: str


class BudgetSimulationRequest(BaseModel):
    revenue_sources: dict[str, float]
    allocations: dict[str, float]


class BudgetSimulationResponse(BaseModel):
    total_revenue: float
    total_allocated: float
    unallocated: float
    allocation_percentages: dict[str, float]
    revenue_percentages: dict[str, float]
    disclaimer: str


# ---------- Academy ----------
class LessonQuizQuestion(BaseModel):
    id: str
    question: str
    options: list[str]
    correct_index: int
    source: str


class LessonOut(BaseModel):
    id: str
    path_id: str
    title: str
    content: str
    quiz: list[LessonQuizQuestion] | None = None


class LearningPathOut(BaseModel):
    id: str
    title: str
    description: str
    lesson_ids: list[str]


class QuizSubmission(BaseModel):
    answers: dict[str, int]  # question_id -> selected option index


class QuizResult(BaseModel):
    score: float
    correct: int
    total: int


class ProgressOut(BaseModel):
    path_id: str
    completed_lessons: int
    total_lessons: int
    percent: float


# ---------- Admin ----------
class AdminStats(BaseModel):
    total_users: int
    total_documents: int
    total_conversations: int
    total_chat_requests: int
    avg_chat_latency_ms: float | None
    total_feedback: int


class DocumentStatusUpdate(BaseModel):
    status: Literal["approved", "rejected", "processing", "ready", "error_processing"]


class AIRequestLogOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID | None
    endpoint: str
    latency_ms: float | None
    token_usage_json: dict[str, Any] | None
    created_at: datetime
    error: str | None

    class Config:
        from_attributes = True


class FeedbackIn(BaseModel):
    message: str = Field(min_length=1, max_length=4000)


class FeedbackOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID | None
    message: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Health ----------
class HealthOut(BaseModel):
    status: str
    database: str
    neo4j: str
