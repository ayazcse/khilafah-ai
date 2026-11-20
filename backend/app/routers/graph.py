"""Civilization Knowledge Graph endpoints — degrade gracefully if Neo4j is unavailable."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from backend.app.deps import get_current_user
from backend.app.models import User
from backend.app.schemas import GraphResponse

router = APIRouter(prefix="/graph", tags=["graph"])


@router.get("/graph", response_model=GraphResponse)
def get_graph(entity_type: str | None = None, limit: int = 100) -> GraphResponse:
    try:
        from knowledge_graph.neo4j_client import is_available
        from knowledge_graph.queries import fetch_graph
    except ImportError:
        return GraphResponse(
            nodes=[], edges=[], degraded=True,
            message="Knowledge graph module is not available in this deployment.",
        )

    if not is_available():
        return GraphResponse(
            nodes=[], edges=[], degraded=True,
            message="Neo4j is not configured or unreachable. Set NEO4J_* variables in .env and ensure Neo4j is running.",
        )

    try:
        data = fetch_graph(entity_type=entity_type, limit=limit)
        return GraphResponse(nodes=data["nodes"], edges=data["edges"], degraded=False)
    except Exception as exc:  # noqa: BLE001
        return GraphResponse(nodes=[], edges=[], degraded=True, message=f"Graph query failed: {exc}")


@router.get("/entity/{entity_id}")
def get_entity(entity_id: str) -> dict:
    try:
        from knowledge_graph.neo4j_client import is_available
        from knowledge_graph.queries import fetch_entity
    except ImportError:
        return {"degraded": True, "message": "Knowledge graph module is not available in this deployment."}

    if not is_available():
        return {"degraded": True, "message": "Neo4j is not configured or unreachable."}

    try:
        entity = fetch_entity(entity_id)
        if entity is None:
            return {"degraded": False, "message": "Entity not found.", "entity": None}
        return {"degraded": False, "entity": entity}
    except Exception as exc:  # noqa: BLE001
        return {"degraded": True, "message": f"Graph query failed: {exc}"}


@router.get("/search")
def search_graph(q: str) -> dict:
    try:
        from knowledge_graph.neo4j_client import is_available
        from knowledge_graph.queries import search_entities
    except ImportError:
        return {"degraded": True, "message": "Knowledge graph module is not available in this deployment.", "results": []}

    if not is_available():
        return {"degraded": True, "message": "Neo4j is not configured or unreachable.", "results": []}

    try:
        return {"degraded": False, "results": search_entities(q)}
    except Exception as exc:  # noqa: BLE001
        return {"degraded": True, "message": f"Graph query failed: {exc}", "results": []}
