"""Fast local query routing — no separate LLM call is needed."""
from __future__ import annotations

VALID_CATEGORIES = {"history", "economics", "governance", "education", "general"}

_KEYWORD_FALLBACK = {
    "economics": ["zakat", "waqf", "trade", "tax", "budget", "revenue", "finance", "economy", "sadaqah", "sukuk", "تجارت", "زکو"],
    "governance": ["diwan", "shura", "governance", "administration", "caliph", "government", "qadi", "wali", "خلافت", "شوری"],
    "education": ["learn", "lesson", "quiz", "teach", "course", "academy", "explain", "تعلیم", "سبق"],
}

def classify(message: str) -> dict:
    """Classify locally to save one network round-trip per question."""
    lowered = message.casefold()
    for category, keywords in _KEYWORD_FALLBACK.items():
        if any(keyword in lowered for keyword in keywords):
            return {"category": category, "trace_summary": f"Fast local routing selected '{category}'."}
    return {"category": "history", "trace_summary": "Fast local routing selected the history/general research path."}
