"""Read queries against the Neo4j knowledge graph, used by backend/app/routers/graph.py."""
from __future__ import annotations

from knowledge_graph.neo4j_client import get_driver


def fetch_graph(entity_type: str | None = None, limit: int = 100) -> dict:
    driver = get_driver()
    if driver is None:
        return {"nodes": [], "edges": []}

    with driver.session() as session:
        if entity_type:
            node_result = session.run(
                "MATCH (e:Entity {type: $type}) RETURN e.id AS id, e.name AS name, e.type AS type LIMIT $limit",
                type=entity_type,
                limit=limit,
            )
        else:
            node_result = session.run(
                "MATCH (e:Entity) RETURN e.id AS id, e.name AS name, e.type AS type LIMIT $limit",
                limit=limit,
            )
        nodes = [{"id": r["id"], "label": r["name"], "type": r["type"]} for r in node_result]
        node_ids = {n["id"] for n in nodes}

        edge_result = session.run(
            """
            MATCH (a:Entity)-[r]->(b:Entity)
            WHERE a.id IN $ids AND b.id IN $ids
            RETURN a.id AS source, b.id AS target, type(r) AS type
            LIMIT $limit
            """,
            ids=list(node_ids),
            limit=limit * 4,
        )
        edges = [{"source": r["source"], "target": r["target"], "type": r["type"]} for r in edge_result]

    return {"nodes": nodes, "edges": edges}


def fetch_entity(entity_id: str) -> dict | None:
    driver = get_driver()
    if driver is None:
        return None

    with driver.session() as session:
        node_result = session.run(
            "MATCH (e:Entity {id: $id}) RETURN e.id AS id, e.name AS name, e.type AS type, e.period AS period",
            id=entity_id,
        )
        record = node_result.single()
        if record is None:
            return None

        rel_result = session.run(
            """
            MATCH (e:Entity {id: $id})-[r]-(other:Entity)
            RETURN type(r) AS relationship, other.id AS other_id, other.name AS other_name,
                   other.type AS other_type, startNode(r).id = $id AS outgoing
            """,
            id=entity_id,
        )
        relationships = [
            {
                "relationship": r["relationship"],
                "related_entity_id": r["other_id"],
                "related_entity_name": r["other_name"],
                "related_entity_type": r["other_type"],
                "direction": "outgoing" if r["outgoing"] else "incoming",
            }
            for r in rel_result
        ]

    return {
        "id": record["id"],
        "name": record["name"],
        "type": record["type"],
        "period": record["period"],
        "relationships": relationships,
    }


def search_entities(query: str, limit: int = 20) -> list[dict]:
    driver = get_driver()
    if driver is None or not query.strip():
        return []

    with driver.session() as session:
        result = session.run(
            """
            MATCH (e:Entity)
            WHERE toLower(e.name) CONTAINS toLower($search_term)
            RETURN e.id AS id, e.name AS name, e.type AS type
            LIMIT $limit
            """,
            search_term=query,
            limit=limit,
        )
        return [{"id": r["id"], "name": r["name"], "type": r["type"]} for r in result]


def graph_stats() -> dict:
    """Return live node and relationship counts without exposing graph content."""
    driver = get_driver()
    if driver is None:
        return {"available": False, "nodes": 0, "relationships": 0}

    with driver.session() as session:
        record = session.run(
            """
            MATCH (e:Entity)
            WITH count(e) AS nodes
            OPTIONAL MATCH ()-[r]->()
            RETURN nodes, count(r) AS relationships
            """
        ).single()
    return {
        "available": True,
        "nodes": int(record["nodes"]) if record else 0,
        "relationships": int(record["relationships"]) if record else 0,
    }
