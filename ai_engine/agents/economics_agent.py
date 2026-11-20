"""Economics Research Agent — grounds answers in the Economics Lab's cited reference data."""
from __future__ import annotations

from ai_engine.llm_client import chat
from ai_engine.prompts import ECONOMICS_AGENT_PROMPT
from ai_engine.safety import fence_context, sanitize_user_message
from simulations.economics_models import WAQF_INFO, ZAKAT_DISCLAIMER


def run(message: str, language: str, db=None) -> dict:
    context = fence_context(
        "REFERENCE_DATA",
        f"Zakat: standard rate 2.5%, nisab commonly cited at 85g gold or 595g silver. {ZAKAT_DISCLAIMER}\n\n"
        f"Waqf: {WAQF_INFO['description']}",
    )

    result = chat(
        messages=[
            {"role": "system", "content": ECONOMICS_AGENT_PROMPT},
            {
                "role": "user",
                "content": f"{context}\n\nUse the reference data above where relevant. Question: {sanitize_user_message(message)}",
            },
        ]
    )

    citations = [
        {
            "source_id": "economics-lab-zakat",
            "title": "KHILAFAH AI Economics Lab — Zakat calculation module",
            "source_type": "platform_reference",
        },
        {
            "source_id": "economics-lab-waqf",
            "title": "Encyclopaedia of Islam, entry: 'Waqf'",
            "source_type": "academic_reference",
        },
    ]

    return {
        "answer": result["content"],
        "citations": citations,
        "uncertainty_note": "Religious rulings on economic matters (zakat, waqf) vary between schools of fiqh and individual scholars.",
        "token_usage": result.get("usage"),
    }
