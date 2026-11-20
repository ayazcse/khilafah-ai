"""Source Verification Agent — reviews a draft answer and tightens uncertainty language."""
from __future__ import annotations

from ai_engine.llm_client import chat
from ai_engine.prompts import VERIFICATION_AGENT_PROMPT


def run(draft_answer: str, category: str) -> dict:
    try:
        result = chat(
            messages=[
                {"role": "system", "content": VERIFICATION_AGENT_PROMPT},
                {
                    "role": "user",
                    "content": f"Domain: {category}\n\nDraft answer to review:\n{draft_answer}",
                },
            ],
            temperature=0.0,
        )
        return {
            "final_answer": result["content"].strip() or draft_answer,
            "trace_summary": "Reviewed draft answer for unsupported claims and tightened uncertainty language.",
            "token_usage": result.get("usage"),
        }
    except Exception:  # noqa: BLE001
        # If verification itself fails, fall back to the unverified draft rather
        # than losing the answer entirely, but say so in the trace.
        return {
            "final_answer": draft_answer,
            "trace_summary": "Verification step unavailable; returning unreviewed draft answer.",
            "token_usage": None,
        }
