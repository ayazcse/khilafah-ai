"""Education Agent — explains concepts and points to Learning Academy content."""
from __future__ import annotations

from ai_engine.llm_client import chat
from ai_engine.prompts import EDUCATION_AGENT_PROMPT
from ai_engine.safety import sanitize_user_message


def run(message: str, language: str, db=None) -> dict:
    try:
        from backend.app.academy_content import LEARNING_PATHS

        paths_hint = "; ".join(f"{p['title']} ({p['id']})" for p in LEARNING_PATHS.values())
    except ImportError:
        paths_hint = ""

    extra = f" Relevant Learning Academy paths available on this platform: {paths_hint}." if paths_hint else ""

    result = chat(
        messages=[
            {"role": "system", "content": EDUCATION_AGENT_PROMPT + extra},
            {"role": "user", "content": sanitize_user_message(message)},
        ]
    )
    return {
        "answer": result["content"],
        "citations": [],
        "uncertainty_note": "For structured, source-grounded lessons and quizzes on this topic, visit the Learning Academy.",
        "token_usage": result.get("usage"),
    }
