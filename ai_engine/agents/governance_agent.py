"""Governance Research Agent — grounds answers in the Governance Lab's cited topics."""
from __future__ import annotations

from ai_engine.llm_client import chat
from ai_engine.prompts import GOVERNANCE_AGENT_PROMPT, language_instruction
from ai_engine.safety import fence_context, sanitize_user_message
from simulations.governance_models import GOVERNANCE_TOPICS


def run(message: str, language: str, db=None) -> dict:
    context_text = "\n\n".join(
        f"{t['title']} ({t['evidence_level']}): {t['description']}" for t in GOVERNANCE_TOPICS
    )
    context = fence_context("REFERENCE_DATA", context_text)

    result = chat(
        messages=[
            {"role": "system", "content": GOVERNANCE_AGENT_PROMPT + " " + language_instruction(language)},
            {
                "role": "user",
                "content": f"{context}\n\nUse the reference data above where relevant, and otherwise answer with appropriate caution. Question: {sanitize_user_message(message)}",
            },
        ]
    )

    citations = [
        {
            "source_id": t["id"],
            "title": t["title"],
            "source_type": t["evidence_level"],
        }
        for t in GOVERNANCE_TOPICS
    ]

    return {
        "answer": result["content"],
        "citations": citations,
        "uncertainty_note": "See the Governance Research Lab for full source references and evidence-level labeling on each topic.",
        "token_usage": result.get("usage"),
    }
