"""Query Router Agent: classifies the user's question into a domain."""
from __future__ import annotations

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
    """Route common topics locally to avoid an extra model round-trip."""
    category = _keyword_classify(message)
    return {
        "category": category,
        "trace_summary": f"Used low-latency keyword routing -> '{category}'.",
    }
