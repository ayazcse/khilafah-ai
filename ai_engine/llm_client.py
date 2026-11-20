"""Single chokepoint for all LLM calls: retries, timeouts, error handling.

Every agent and RAG call in this project goes through `chat()` or
`embed()` here, so there is exactly one place that knows how to talk to the
configured OpenAI-compatible API.
"""
from __future__ import annotations

import logging
import time
from functools import lru_cache

from openai import APIError, APITimeoutError, OpenAI

from backend.app.config import settings

logger = logging.getLogger("khilafah_ai.ai_engine")

DEFAULT_TIMEOUT_SECONDS = 30
MAX_RETRIES = 2
PLACEHOLDER_KEYS = {"", "sk-your-key-here", "sk-your-openai-api-key-here", "changeme"}


class LLMNotConfiguredError(RuntimeError):
    """Raised when OPENAI_API_KEY is missing or still the placeholder value."""


class LLMRequestError(RuntimeError):
    """Raised when the LLM API call fails after retries."""


def is_configured() -> bool:
    return settings.OPENAI_API_KEY.strip() not in PLACEHOLDER_KEYS


@lru_cache
def _get_client() -> OpenAI:
    return OpenAI(
        api_key=settings.OPENAI_API_KEY,
        base_url=settings.OPENAI_BASE_URL,
        timeout=DEFAULT_TIMEOUT_SECONDS,
    )


def chat(
    messages: list[dict],
    model: str | None = None,
    temperature: float = 0.2,
    max_tokens: int = 1200,
) -> dict:
    """Call the chat completion API with retries. Returns {"content", "usage"}."""
    if not is_configured():
        raise LLMNotConfiguredError(
            "OPENAI_API_KEY is not configured. Add a real key to your .env file."
        )

    client = _get_client()
    last_error: Exception | None = None

    for attempt in range(1, MAX_RETRIES + 2):
        try:
            response = client.chat.completions.create(
                model=model or settings.OPENAI_CHAT_MODEL,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            choice = response.choices[0]
            usage = response.usage
            return {
                "content": choice.message.content or "",
                "usage": {
                    "prompt_tokens": getattr(usage, "prompt_tokens", None),
                    "completion_tokens": getattr(usage, "completion_tokens", None),
                    "total_tokens": getattr(usage, "total_tokens", None),
                }
                if usage
                else None,
            }
        except (APITimeoutError, APIError) as exc:
            last_error = exc
            logger.warning("LLM call failed (attempt %s/%s): %s", attempt, MAX_RETRIES + 1, exc)
            if attempt <= MAX_RETRIES:
                time.sleep(min(2**attempt, 8))
                continue
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            break

    raise LLMRequestError(f"LLM request failed after retries: {last_error}")


def embed(texts: list[str], model: str | None = None) -> list[list[float]]:
    if not texts:
        return []
    if not is_configured():
        raise LLMNotConfiguredError(
            "OPENAI_API_KEY is not configured. Add a real key to your .env file."
        )

    client = _get_client()
    last_error: Exception | None = None

    for attempt in range(1, MAX_RETRIES + 2):
        try:
            response = client.embeddings.create(
                model=model or settings.OPENAI_EMBEDDING_MODEL,
                input=texts,
            )
            return [item.embedding for item in response.data]
        except (APITimeoutError, APIError) as exc:
            last_error = exc
            logger.warning("Embedding call failed (attempt %s/%s): %s", attempt, MAX_RETRIES + 1, exc)
            if attempt <= MAX_RETRIES:
                time.sleep(min(2**attempt, 8))
                continue
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            break

    raise LLMRequestError(f"Embedding request failed after retries: {last_error}")
