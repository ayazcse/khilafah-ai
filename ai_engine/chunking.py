"""Document extraction and chunking for the Research Studio upload pipeline."""
from __future__ import annotations

import re

CHUNK_SIZE_CHARS = 1200
CHUNK_OVERLAP_CHARS = 150


def _clean_text(text: str) -> str:
    text = text.replace("\x00", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _chunk_text(text: str, page: int | None) -> list[dict]:
    text = _clean_text(text)
    if not text:
        return []

    chunks: list[dict] = []
    start = 0
    length = len(text)
    while start < length:
        end = min(start + CHUNK_SIZE_CHARS, length)
        # Try to break on a sentence/paragraph boundary near the end.
        if end < length:
            boundary = text.rfind(". ", start, end)
            if boundary != -1 and boundary > start + 200:
                end = boundary + 1
        chunk = text[start:end].strip()
        if chunk:
            chunks.append({"text": chunk, "page": page})
        if end >= length:
            break
        start = max(end - CHUNK_OVERLAP_CHARS, start + 1)
    return chunks


def extract_and_chunk(file_path: str, mime_type: str) -> list[dict]:
    """Extract text from a .txt or .pdf file and split it into overlapping
    chunks. Returns a list of {"text": str, "page": int | None}."""
    if mime_type == "text/plain":
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            raw_text = f.read()
        return _chunk_text(raw_text, page=None)

    if mime_type == "application/pdf":
        from pypdf import PdfReader

        reader = PdfReader(file_path)
        all_chunks: list[dict] = []
        for page_number, page in enumerate(reader.pages, start=1):
            page_text = page.extract_text() or ""
            all_chunks.extend(_chunk_text(page_text, page=page_number))
        return all_chunks

    raise ValueError(f"Unsupported mime type for chunking: {mime_type}")
