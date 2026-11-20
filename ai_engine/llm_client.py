
"""Central Gemini client for all LLM and embedding calls."""
from __future__ import annotations

import logging
import time
from functools import lru_cache

from google import genai
from google.genai import types

from backend.app.config import settings

logger = logging.getLogger("khilafah_ai.ai_engine")

DEFAULT_TIMEOUT_SECONDS = 30
MAX_RETRIES = 2
PLACEHOLDER_KEYS = {"", "your-api-key", "changeme"}


class LLMNotConfiguredError(RuntimeError):
    """Raised when GEMINI_API_KEY is missing."""


class LLMRequestError(RuntimeError):
    """Raised when a Gemini API call fails after retries."""


def is_configured() -> bool:
    key = settings.GEMINI_API_KEY.strip()
    return key not in PLACEHOLDER_KEYS


@lru_cache
def _get_client():
    if not is_configured():
        raise LLMNotConfiguredError(
            "GEMINI_API_KEY is not configured. Add it to your environment."
        )

    return genai.Client(
        api_key=settings.GEMINI_API_KEY,
        http_options=types.HttpOptions(
            timeout=DEFAULT_TIMEOUT_SECONDS * 1000
        ),
    )


def chat(
    messages: list[dict],
    model: str | None = None,
    temperature: float = 0.2,
    max_tokens: int = 1200,
) -> dict:
    """Generate a Gemini response. Returns {'content', 'usage'}."""

    if not is_configured():
        raise LLMNotConfiguredError(
            "GEMINI_API_KEY is not configured. Add it to your environment."
        )

    system_parts = []
    contents = []

    for message in messages:
        role = message.get("role", "user")
        content = message.get("content", "")

        if not isinstance(content, str):
            content = str(content)

        if role == "system":
            system_parts.append(content)
        else:
            contents.append({
                "role": "model" if role == "assistant" else "user",
                "parts": [{"text": content}],
            })

    config = types.GenerateContentConfig(
        system_instruction="\n\n".join(system_parts) or None,
        temperature=temperature,
        max_output_tokens=max_tokens,
    )

    client = _get_client()
    last_error = None

    for attempt in range(1, MAX_RETRIES + 2):
        try:
            response = client.models.generate_content(
                model=model or settings.GEMINI_CHAT_MODEL,
                contents=contents,
                config=config,
            )

            usage = getattr(response, "usage_metadata", None)

            return {
                "content": response.text or "",
                "usage": {
                    "prompt_tokens": getattr(
                        usage, "prompt_token_count", None
                    ),
                    "completion_tokens": getattr(
                        usage, "candidates_token_count", None
                    ),
                    "total_tokens": getattr(
                        usage, "total_token_count", None
                    ),
                } if usage else None,
            }

        except Exception as exc:
            last_error = exc
            logger.warning(
                "Gemini chat failed (attempt %s/%s): %s",
                attempt,
                MAX_RETRIES + 1,
                exc,
            )

            if attempt <= MAX_RETRIES:
                time.sleep(min(2 ** attempt, 8))

    raise LLMRequestError(
        f"Gemini chat request failed after retries: {last_error}"
    )


def embed(
    texts: list[str],
    model: str | None = None,
    task_type: str = "RETRIEVAL_DOCUMENT",
) -> list[list[float]]:
    """Generate Gemini embeddings with a consistent vector dimension."""

    if not texts:
        return []

    if not is_configured():
        raise LLMNotConfiguredError(
            "GEMINI_API_KEY is not configured. Add it to your environment."
        )

    client = _get_client()
    last_error = None

    for attempt in range(1, MAX_RETRIES + 2):
        try:
            response = client.models.embed_content(
                model=model or settings.GEMINI_EMBEDDING_MODEL,
                contents=texts,
                config=types.EmbedContentConfig(
                    task_type=task_type,
                    output_dimensionality=settings.GEMINI_EMBEDDING_DIM,
                ),
            )

            return [
                embedding.values
                for embedding in response.embeddings
            ]

        except Exception as exc:
            last_error = exc
            logger.warning(
                "Gemini embedding failed (attempt %s/%s): %s",
                attempt,
                MAX_RETRIES + 1,
                exc,
            )

            if attempt <= MAX_RETRIES:
                time.sleep(min(2 ** attempt, 8))

    raise LLMRequestError(
        f"Gemini embedding request failed after retries: {last_error}"
    )
