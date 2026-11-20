"""Research Studio: document upload, listing, deletion, semantic search."""
# NOTE: no `from __future__ import annotations` here deliberately — FastAPI's
# dependency resolution for `UploadFile = File(...)` needs real (non-string)
# annotations to work reliably across FastAPI/Pydantic/Python 3.13 versions.
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.deps import get_current_user, get_db
from backend.app.models import Document, DocumentChunk, User
from backend.app.rate_limit import limiter
from backend.app.schemas import (
    DocumentOut,
    DocumentSearchRequest,
    DocumentSearchResult,
    DocumentUploadResponse,
)

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_EXTENSIONS = {".pdf", ".txt"}


@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def upload_document(
    request: Request,
    file: UploadFile = File(...),
    title: str = Form(...),
    author: str | None = Form(None),
    source_type: str | None = Form(None),
    language: str | None = Form(None),
    historical_period: str | None = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DocumentUploadResponse:
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    contents = file.file.read()
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds the {settings.MAX_UPLOAD_MB}MB upload limit.",
        )

    document = Document(
        owner_id=current_user.id,
        title=title,
        author=author,
        source_type=source_type,
        language=language,
        historical_period=historical_period,
        filename=file.filename or f"upload-{uuid.uuid4()}{ext}",
        status="processing",
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    stored_path = upload_dir / f"{document.id}{ext}"
    stored_path.write_bytes(contents)

    try:
        from ai_engine.chunking import extract_and_chunk
        from ai_engine.embeddings import embed_texts

        mime_type = "application/pdf" if ext == ".pdf" else "text/plain"
        chunks = extract_and_chunk(str(stored_path), mime_type)
        if not chunks:
            document.status = "error_processing"
        else:
            vectors = embed_texts([c["text"] for c in chunks])
            for chunk, vector in zip(chunks, vectors):
                db.add(
                    DocumentChunk(
                        document_id=document.id,
                        text=chunk["text"],
                        page=chunk.get("page"),
                        embedding=vector,
                    )
                )
            document.status = "ready"
    except ImportError:
        # ai_engine package not present in this deployment; keep the raw file but
        # mark processing as unavailable rather than crashing the upload.
        document.status = "error_processing"
    except Exception:  # noqa: BLE001
        # Missing/invalid API key, embedding failure, bad PDF, etc. Never crash the request.
        document.status = "error_processing"

    db.add(document)
    db.commit()

    return DocumentUploadResponse(document_id=document.id, status=document.status)


@router.get("", response_model=list[DocumentOut])
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Document]:
    query = db.query(Document)
    if current_user.role != "admin":
        query = query.filter(Document.owner_id == current_user.id)
    return query.order_by(Document.created_at.desc()).all()


@router.get("/{document_id}", response_model=DocumentOut)
def get_document(
    document_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Document:
    document = db.get(Document, document_id)
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if document.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return document


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    document = db.get(Document, document_id)
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if document.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    db.delete(document)
    db.commit()


@router.post("/search", response_model=list[DocumentSearchResult])
def search_documents(
    payload: DocumentSearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[DocumentSearchResult]:
    try:
        from ai_engine.llm_client import LLMNotConfiguredError
        from ai_engine.rag import search_chunks
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Document search requires the AI engine, which is not available in this deployment.",
        )

    try:
        results = search_chunks(
            db,
            query=payload.query,
            document_id=str(payload.document_id) if payload.document_id else None,
            top_k=payload.top_k,
        )
    except LLMNotConfiguredError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Document search requires a Gemini API key. Add GEMINI_API_KEY to your environment variables.",
        )
    return [DocumentSearchResult(**r) for r in results]
