"""Query Router Agent: classifies the user's question into a domain."""
from __future__ import annotations

from ai_engine.llm_client import chat
from ai_engine.prompts import ROUTER_PROMPT

VALID_CATEGORIES = {"history", "economics", "governance", "education", "general"}

_KEYWORD_FALLBACK = {
    "economics": ["zakat", "waqf", "trade", "tax", "budget", "revenue", "finance", "economy"],
    "governance": ["diwan", "shura", "governance", "administration", "caliph", "government", "qadi", "wali"],
    "education": ["learn", "lesson", "quiz", "teach", "course", "academy"],
}


def _keyword_classify(message: str) -> str:
    lowered = message.lower()
    for category, keywords in _KEYWORD_FALLBACK.items():
        if any(kw in lowered for kw in keywords):
            return category
    return "history"


def classify(message: str) -> dict:
    """Returns {"category": str, "trace_summary": str}."""
    try:
        result = chat(
            messages=[
                {"role": "system", "content": ROUTER_PROMPT},
                {"role": "user", "content": message},
            ],
            temperature=0.0,
            max_tokens=10,
        )
        category = result["content"].strip().lower()
        if category not in VALID_CATEGORIES:
            category = _keyword_classify(message)
        return {"category": category, "trace_summary": f"Classified query as '{category}'."}
    except Exception:  # noqa: BLE001 — let graph.py decide whether to re-raise LLMNotConfiguredError upstream
        category = _keyword_classify(message)
        return {"category": category, "trace_summary": f"LLM classification unavailable; used keyword fallback -> '{category}'."}
