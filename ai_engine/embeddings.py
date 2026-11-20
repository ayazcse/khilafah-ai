
"""Gemini embedding helpers for document and query retrieval."""
from __future__ import annotations

from ai_engine.llm_client import embed


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Create embeddings for document chunks."""
    return embed(texts, task_type="RETRIEVAL_DOCUMENT")


def embed_query(query: str) -> list[float]:
    """Create an embedding for a user's search query."""
    vectors = embed([query], task_type="RETRIEVAL_QUERY")
    return vectors[0]
