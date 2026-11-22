"""KHALAF — FastAPI application entrypoint."""
from __future__ import annotations

import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text

from backend.app.config import settings
from backend.app.database import SessionLocal
from backend.app.rate_limit import limiter
from backend.app.routers import (
    academy, admin, auth, calls, chat, community, documents, economics, feedback, governance, graph, inbox, stories,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("khalaf")

app = FastAPI(
    title="KHALAF",
    description="The Next Generation of Knowledge & Connection.",
    version="0.1.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        content={"detail": "An internal error occurred. Please try again later."})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"detail": exc.errors()})


app.include_router(auth.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(graph.router, prefix="/api")
app.include_router(governance.router, prefix="/api")
app.include_router(economics.router, prefix="/api")
app.include_router(academy.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(feedback.router, prefix="/api")
app.include_router(community.router, prefix="/api")
app.include_router(inbox.router, prefix="/api")
app.include_router(calls.router, prefix="/api")
app.include_router(stories.router, prefix="/api")


@app.get("/api/health")
def health() -> dict:
    db_status = "ok"
    try:
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
        finally:
            db.close()
    except Exception:
        db_status = "error"
    neo4j_status = "disabled"
    if settings.NEO4J_ENABLED:
        try:
            from knowledge_graph.neo4j_client import is_available
            neo4j_status = "ok" if is_available() else "error"
        except ImportError:
            neo4j_status = "error"
        except Exception:
            neo4j_status = "error"
    return {"status": "ok" if db_status == "ok" else "degraded", "database": db_status, "neo4j": neo4j_status}


@app.get("/")
def root() -> dict:
    return {"name": "KHALAF",
            "tagline": "The Next Generation of Knowledge & Connection.",
            "docs": "/docs", "health": "/api/health"}
