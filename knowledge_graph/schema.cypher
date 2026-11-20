// KHILAFAH AI — Knowledge Graph constraints and indexes.
// Run once against a fresh Neo4j database (knowledge_graph/ingest.py applies this automatically).

CREATE CONSTRAINT entity_id_unique IF NOT EXISTS
FOR (e:Entity) REQUIRE e.id IS UNIQUE;

CREATE INDEX entity_type_index IF NOT EXISTS
FOR (e:Entity) ON (e.type);

CREATE INDEX entity_name_index IF NOT EXISTS
FOR (e:Entity) ON (e.name);
