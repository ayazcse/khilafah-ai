"""Idempotent ingestion of seed_data.py into Neo4j, applying schema.cypher first."""
from __future__ import annotations

from pathlib import Path

from knowledge_graph.neo4j_client import get_driver
from knowledge_graph.seed_data import ENTITIES, RELATIONSHIPS

SCHEMA_FILE = Path(__file__).parent / "schema.cypher"


def _apply_schema(session) -> None:
    statements = [s.strip() for s in SCHEMA_FILE.read_text().split(";") if s.strip() and not s.strip().startswith("//")]
    for statement in statements:
        session.run(statement)


def run_seed() -> dict:
    driver = get_driver()
    if driver is None:
        return {"nodes_created": 0, "relationships_created": 0, "status": "skipped", "reason": "Neo4j unavailable"}

    nodes_created = 0
    relationships_created = 0

    with driver.session() as session:
        _apply_schema(session)

        for entity in ENTITIES:
            result = session.run(
                """
                MERGE (e:Entity {id: $id})
                ON CREATE SET e.type = $type, e.name = $name, e.period = $period, e.created = true
                ON MATCH SET e.type = $type, e.name = $name, e.period = $period
                RETURN e.created AS created
                """,
                id=entity["id"],
                type=entity["type"],
                name=entity["name"],
                period=entity.get("period"),
            )
            record = result.single()
            if record and record.get("created"):
                nodes_created += 1

        for rel in RELATIONSHIPS:
            result = session.run(
                f"""
                MATCH (a:Entity {{id: $source}}), (b:Entity {{id: $target}})
                MERGE (a)-[r:{rel['type']}]->(b)
                ON CREATE SET r.created = true
                RETURN r.created AS created
                """,
                source=rel["source"],
                target=rel["target"],
            )
            record = result.single()
            if record and record.get("created"):
                relationships_created += 1

    return {"nodes_created": nodes_created, "relationships_created": relationships_created, "status": "ok"}


if __name__ == "__main__":
    print(run_seed())
