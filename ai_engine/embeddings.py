"""Thin wrapper around llm_client.embed for embedding text chunks."""
from __future__ import annotations

from ai_engine.llm_client import embed


def embed_texts(texts: list[str]) -> list[list[float]]:
    return embed(texts)
