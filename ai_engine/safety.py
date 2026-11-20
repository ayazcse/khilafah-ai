"""Lightweight prompt-injection defenses for user-supplied text.

This is not a substitute for careful system-prompt design, but it catches the
most common injection patterns (instruction overrides embedded in documents
or user messages) before they reach the LLM, and it keeps retrieved document
text clearly fenced off from instructions in the prompt.
"""
from __future__ import annotations

import re

_SUSPICIOUS_PATTERNS = [
    re.compile(r"ignore (all|previous|above) instructions", re.IGNORECASE),
    re.compile(r"disregard (all|previous|above) (instructions|rules)", re.IGNORECASE),
    re.compile(r"you are now", re.IGNORECASE),
    re.compile(r"system prompt", re.IGNORECASE),
    re.compile(r"reveal (your|the) (prompt|instructions)", re.IGNORECASE),
]

MAX_MESSAGE_LENGTH = 4000
MAX_CONTEXT_CHUNK_LENGTH = 2000


def sanitize_user_message(message: str) -> str:
    """Truncate and lightly flag user input. Does not reject outright — just
    bounds length and never lets user text be treated as a system instruction."""
    return message.strip()[:MAX_MESSAGE_LENGTH]


def flag_injection_risk(text: str) -> bool:
    return any(p.search(text) for p in _SUSPICIOUS_PATTERNS)


def fence_context(label: str, text: str) -> str:
    """Wrap retrieved/external text in clear delimiters so the LLM treats it
    as data to analyze, not as instructions to follow."""
    bounded = text[:MAX_CONTEXT_CHUNK_LENGTH]
    return f"<<<{label}_START>>>\n{bounded}\n<<<{label}_END>>>"
