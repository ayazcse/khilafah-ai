"""Neo4j driver singleton. Degrades gracefully if Neo4j is disabled or unreachable."""
from __future__ import annotations

import logging

from neo4j import Driver, GraphDatabase

from backend.app.config import settings

logger = logging.getLogger("khilafah_ai.knowledge_graph")

_driver: Driver | None = None
_driver_attempted = False


def get_driver() -> Driver | None:
    """Returns a cached Neo4j driver once a connection succeeds. If Neo4j is
    disabled or unreachable, retries on each call (connections are cheap to
    attempt and we want the app to self-heal once Neo4j comes up) rather than
    permanently caching a failure."""
    global _driver, _driver_attempted

    if not settings.NEO4J_ENABLED:
        return None
    if _driver is not None:
        return _driver
    try:
        driver = GraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
        )
        driver.verify_connectivity()
        _driver = driver
        return _driver
    except Exception as exc:  # noqa: BLE001
        if not _driver_attempted:
            logger.warning("Neo4j connection unavailable: %s", exc)
            _driver_attempted = True
        return None


def is_available() -> bool:
    return get_driver() is not None
