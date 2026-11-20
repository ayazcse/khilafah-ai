"""Historical Research Agent."""
from __future__ import annotations

from ai_engine.llm_client import chat
from ai_engine.prompts import HISTORY_AGENT_PROMPT
from ai_engine.safety import sanitize_user_message


def run(message: str, language: str, db=None) -> dict:
    """Answer a history question. If the user has uploaded documents relevant
    to the query, prefer grounding the answer in those (handled by rag.py via
    the router in graph.py before falling back here). This agent is the
    general-knowledge fallback path."""
    language_hint = {
        "en": "Respond in English.",
        "hi": "Respond in Hindi (Devanagari script).",
        "ar": "Respond in Arabic if the model supports it well; otherwise respond in English and note the limitation.",
    }.get(language, "Respond in English.")

    result = chat(
        messages=[
            {"role": "system", "content": HISTORY_AGENT_PROMPT + " " + language_hint},
            {"role": "user", "content": sanitize_user_message(message)},
        ]
    )
    return {
        "answer": result["content"],
        "citations": [],
        "uncertainty_note": (
            "This answer draws on the model's general historical knowledge, not a "
            "specific verified document in your library. Upload relevant sources in "
            "the Research Studio for citation-backed answers."
        ),
        "token_usage": result.get("usage"),
    }
