"use client";

import { useEffect, useState } from "react";
import { api, GraphResponse } from "@/lib/api";
import { Loading, EmptyState } from "@/components/StateViews";

const TYPE_COLORS: Record<string, string> = {
  Caliph: "#C9A24B",
  Dynasty: "#0B6E4F",
  City: "#3B82F6",
  Scholar: "#A855F7",
  Institution: "#EC4899",
  ScientificDiscovery: "#F97316",
  Book: "#14B8A6",
};

interface PositionedNode {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
}

export default function KnowledgeGraphPage() {
  const [data, setData] = useState<GraphResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<GraphResponse>("/graph/graph?limit=60")
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading label="Loading knowledge graph..." />;

  if (!data || data.degraded || data.nodes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-serif font-semibold text-white mb-6">Civilization Knowledge Graph</h1>
        <EmptyState
          title="Knowledge graph unavailable"
          description={
            data?.message ||
            "No graph data is available right now. Run `python scripts/seed_db.py` with Neo4j running to load the sample dataset."
          }
        />
      </div>
    );
  }

  const radius = 220;
  const cx = 300;
  const cy = 260;
  const positioned: PositionedNode[] = data.nodes.map((n, i) => {
    const angle = (2 * Math.PI * i) / data.nodes.length;
    return { ...n, x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });
  const posById = new Map(positioned.map((p) => [p.id, p]));

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-serif font-semibold text-white mb-1">Civilization Knowledge Graph</h1>
      <p className="text-white/50 text-sm mb-6">
        A small sample dataset of entities and relationships. Click a node for details.
      </p>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card overflow-auto">
          <svg width="600" height="520" viewBox="0 0 600 520">
            {data.edges.map((e, i) => {
              const a = posById.get(e.source);
              const b = posById.get(e.target);
              if (!a || !b) return null;
              return (
                <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
              );
            })}
            {positioned.map((n) => (
              <g key={n.id} onClick={() => setSelected(n.id)} className="cursor-pointer">
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={selected === n.id ? 10 : 7}
                  fill={TYPE_COLORS[n.type] || "#999"}
                  stroke="#1A1D1F"
                  strokeWidth={2}
                />
                <text x={n.x + 10} y={n.y + 4} fontSize={10} fill="rgba(255,255,255,0.7)">
                  {n.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <div className="card">
          <h3 className="text-gold font-medium mb-3">Legend</h3>
          <div className="space-y-1.5 mb-6">
            {Object.entries(TYPE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2 text-sm text-white/70">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                {type}
              </div>
            ))}
          </div>
          {selected && (
            <EntityDetail id={selected} />
          )}
          {!selected && <p className="text-white/40 text-sm">Select a node to view its details.</p>}
        </div>
      </div>
    </div>
  );
}

function EntityDetail({ id }: { id: string }) {
  const [entity, setEntity] = useState<{
    id: string;
    name: string;
    type: string;
    period: string | null;
    relationships: { relationship: string; related_entity_name: string; direction: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<{ degraded: boolean; entity: typeof entity }>(`/graph/entity/${id}`)
      .then((res) => setEntity(res.entity))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading label="Loading entity..." />;
  if (!entity) return <p className="text-white/40 text-sm">Entity details unavailable.</p>;

  return (
    <div>
      <h4 className="text-white font-medium">{entity.name}</h4>
      <p className="text-white/40 text-xs mb-3">
        {entity.type}
        {entity.period ? ` · ${entity.period}` : ""}
      </p>
      {entity.relationships.length === 0 ? (
        <p className="text-white/40 text-sm">No recorded relationships.</p>
      ) : (
        <ul className="space-y-1.5 text-sm text-white/70">
          {entity.relationships.map((r, i) => (
            <li key={i}>
              <span className="text-gold/70">{r.relationship.replace(/_/g, " ").toLowerCase()}</span>{" "}
              {r.direction === "outgoing" ? "→" : "←"} {r.related_entity_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
