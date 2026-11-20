"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from "react";
import { api, GraphResponse } from "@/lib/api";
import { Loading, EmptyState } from "@/components/StateViews";

const TYPE_COLORS: Record<string, string> = {
  Caliph: "#C9A24B",
  Dynasty: "#0B9B70",
  City: "#60A5FA",
  Scholar: "#C084FC",
  Institution: "#F472B6",
  ScientificDiscovery: "#FB923C",
  Book: "#2DD4BF",
};

type GraphNode = GraphResponse["nodes"][number];
type GraphEdge = GraphResponse["edges"][number];
type SearchResult = { id: string; name: string; type: string };

interface PositionedNode extends GraphNode {
  x: number;
  y: number;
}

const labelFor = (type: string) => type.replace(/([a-z])([A-Z])/g, "$1 $2");

export default function KnowledgeGraphPage() {
  const [data, setData] = useState<GraphResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [activeType, setActiveType] = useState("All");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    api.get<GraphResponse>("/graph/graph?limit=100")
      .then(setData)
      .catch(() => setLoadError("The knowledge graph could not be loaded. Please refresh and try again."))
      .finally(() => setLoading(false));
  }, []);

  const types = useMemo(
    () => ["All", ...Array.from(new Set(data?.nodes.map((node) => node.type) ?? [])).sort()],
    [data]
  );
  const visibleNodes = useMemo(
    () => (data?.nodes ?? []).filter((node) => activeType === "All" || node.type === activeType),
    [data, activeType]
  );
  const visibleIds = useMemo(() => new Set(visibleNodes.map((node) => node.id)), [visibleNodes]);
  const visibleEdges = useMemo(
    () => (data?.edges ?? []).filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target)),
    [data, visibleIds]
  );
  const positioned = useMemo<PositionedNode[]>(() => {
    const cx = 450;
    const cy = 310;
    const rx = 335;
    const ry = 235;
    return visibleNodes.map((node, index) => {
      const angle = (2 * Math.PI * index) / Math.max(visibleNodes.length, 1) - Math.PI / 2;
      return { ...node, x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) };
    });
  }, [visibleNodes]);
  const positionById = useMemo(() => new Map(positioned.map((node) => [node.id, node])), [positioned]);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = query.trim();
    if (!term) {
      setSearchResults([]);
      setSearchError("");
      return;
    }
    setSearching(true);
    setSearchError("");
    try {
      const response = await api.get<{ degraded: boolean; results: SearchResult[]; message?: string }>(
        `/graph/search?q=${encodeURIComponent(term)}`
      );
      if (response.degraded) throw new Error(response.message || "Search is temporarily unavailable.");
      setSearchResults(response.results ?? []);
      if (!response.results?.length) setSearchError("No matching entities found. Try another name.");
    } catch (error) {
      setSearchResults([]);
      setSearchError(error instanceof Error ? error.message : "Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  }

  function selectSearchResult(result: SearchResult) {
    setSelected(result.id);
    setActiveType("All");
    setSearchResults([]);
    setQuery(result.name);
  }

  function handleNodeKey(event: KeyboardEvent<SVGGElement>, id: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelected(id);
    }
  }

  if (loading) return <Loading label="Loading knowledge graph..." />;

  if (!data || data.degraded || data.nodes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-serif font-semibold text-white mb-2">Civilization Knowledge Graph</h1>
        <EmptyState
          title="Knowledge graph unavailable"
          description={loadError || data?.message || "No graph data is available right now. Please try again later."}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-7">
        <div>
          <p className="text-[10px] tracking-[.22em] text-gold uppercase mb-2">Explore connected history</p>
          <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-white mb-2">Civilization Knowledge Graph</h1>
          <p className="text-white/55 text-sm max-w-2xl">
            Explore people, dynasties, places, institutions, books and ideas — and follow the relationships between them.
          </p>
        </div>
        <div className="flex gap-3 text-xs text-white/55">
          <span className="rounded-lg border border-white/10 bg-white/[.03] px-3 py-2"><strong className="text-gold">{data.nodes.length}</strong> entities</span>
          <span className="rounded-lg border border-white/10 bg-white/[.03] px-3 py-2"><strong className="text-gold">{data.edges.length}</strong> connections</span>
        </div>
      </div>

      <form onSubmit={handleSearch} className="relative flex flex-col sm:flex-row gap-2 mb-4">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="input-field sm:max-w-xl"
          placeholder="Search scholars, dynasties, books, places..."
          aria-label="Search graph entities"
        />
        <button type="submit" disabled={searching || !query.trim()} className="btn-primary min-w-28">
          {searching ? "Searching..." : "Search"}
        </button>
        {query && (
          <button type="button" onClick={() => { setQuery(""); setSearchResults([]); setSearchError(""); }} className="btn-secondary">
            Clear
          </button>
        )}
      </form>

      {searchResults.length > 0 && (
        <div className="card mb-4 !p-3 max-w-2xl">
          <p className="text-[10px] uppercase tracking-widest text-gold mb-2">Search results</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {searchResults.map((result) => (
              <button key={result.id} type="button" onClick={() => selectSearchResult(result)}
                className="text-left rounded-lg border border-white/10 hover:border-gold/50 px-3 py-2 transition-colors">
                <span className="block text-sm text-white">{result.name}</span>
                <span className="block text-xs text-white/45 mt-1">{labelFor(result.type)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {searchError && <p role="status" className="text-amber-300/90 text-xs mb-4">{searchError}</p>}

      <div className="flex flex-wrap gap-2 mb-5">
        {types.map((type) => {
          const count = type === "All" ? data.nodes.length : data.nodes.filter((node) => node.type === type).length;
          return (
            <button key={type} type="button" onClick={() => setActiveType(type)}
              aria-pressed={activeType === type}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${activeType === type ? "border-gold/60 bg-gold/10 text-gold" : "border-white/10 text-white/55 hover:border-white/30 hover:text-white"}`}>
              {type === "All" ? "All entities" : labelFor(type)} <span className="opacity-60">· {count}</span>
            </button>
          );
        })}
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
        <section className="card !p-2 sm:!p-4 min-w-0" aria-label="Interactive civilization graph">
          <div className="flex items-center justify-between px-2 pt-1 pb-3">
            <p className="text-xs text-white/45">Select any node to inspect its connections</p>
            <button type="button" onClick={() => setSelected(null)} className="text-xs text-gold/80 hover:text-gold">Reset selection</button>
          </div>
          <div className="w-full overflow-x-auto">
            <svg viewBox="0 0 900 620" role="img" aria-label="Network of historical people, places, institutions, books and ideas"
              className="w-full min-w-[620px] h-auto rounded-lg bg-[#0d1512]/70">
              <defs>
                <pattern id="graph-grid" width="36" height="36" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="1" fill="rgba(255,255,255,.08)" />
                </pattern>
              </defs>
              <rect width="900" height="620" fill="url(#graph-grid)" />
              {visibleEdges.map((edge, index) => {
                const source = positionById.get(edge.source);
                const target = positionById.get(edge.target);
                if (!source || !target) return null;
                const isRelated = selected === edge.source || selected === edge.target;
                return <g key={`${edge.source}-${edge.target}-${index}`}>
                  <line x1={source.x} y1={source.y} x2={target.x} y2={target.y}
                    stroke={isRelated ? "#D6B56F" : "rgba(210,220,210,.2)"}
                    strokeWidth={isRelated ? 2.2 : 1.2} opacity={selected && !isRelated ? .25 : .9} />
                  {isRelated && <title>{edge.type.replace(/_/g, " ")}</title>}
                </g>;
              })}
              {positioned.map((node) => {
                const isSelected = selected === node.id;
                const isConnected = !!selected && visibleEdges.some((edge) =>
                  (edge.source === selected && edge.target === node.id) || (edge.target === selected && edge.source === node.id)
                );
                const angle = Math.atan2(node.y - 310, node.x - 450);
                const anchor = Math.cos(angle) > .25 ? "start" : Math.cos(angle) < -.25 ? "end" : "middle";
                const labelX = node.x + (anchor === "start" ? 12 : anchor === "end" ? -12 : 0);
                const labelY = node.y + (Math.sin(angle) > .65 ? 22 : Math.sin(angle) < -.65 ? -14 : 4);
                const label = node.label.length > 24 ? `${node.label.slice(0, 22)}…` : node.label;
                return (
                  <g key={node.id} role="button" tabIndex={0} aria-label={`Select ${node.label}, ${labelFor(node.type)}`}
                    aria-pressed={isSelected} onClick={() => setSelected(node.id)}
                    onKeyDown={(event) => handleNodeKey(event, node.id)} className="cursor-pointer outline-none">
                    <circle cx={node.x} cy={node.y} r={isSelected ? 16 : 12} fill={TYPE_COLORS[node.type] || "#999"}
                      opacity={selected && !isSelected && !isConnected ? .35 : 1}
                      stroke={isSelected ? "#fff" : "#15211b"} strokeWidth={isSelected ? 3 : 2} />
                    <circle cx={node.x} cy={node.y} r="20" fill="transparent" />
                    <text x={labelX} y={labelY} textAnchor={anchor} fontSize="12"
                      fill={selected && !isSelected && !isConnected ? "rgba(255,255,255,.3)" : "#e8e5dc"}
                      fontWeight={isSelected ? 700 : 500} pointerEvents="none">{label}</text>
                    <title>{node.label} · {labelFor(node.type)}</title>
                  </g>
                );
              })}
            </svg>
          </div>
          <p className="text-[11px] text-white/35 px-2 pt-3">Showing {visibleNodes.length} of {data.nodes.length} entities · {visibleEdges.length} visible connections</p>
        </section>

        <aside className="card !p-5 xl:sticky xl:top-24">
          <h2 className="text-gold font-medium mb-4">Entity details</h2>
          {selected ? <EntityDetail id={selected} onSelect={setSelected} /> : (
            <div className="py-8 text-center">
              <div className="text-3xl text-gold/50 mb-3">◈</div>
              <p className="text-white/75 text-sm mb-1">Explore an entity</p>
              <p className="text-white/40 text-xs leading-6">Select a node in the graph or search for a historical figure, place, institution or book.</p>
            </div>
          )}
          <div className="border-t border-white/10 mt-5 pt-4">
            <h3 className="text-xs text-white/65 mb-3">Entity types</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(TYPE_COLORS).map(([type, color]) => (
                <div key={type} className="flex items-center gap-2 text-[11px] text-white/55">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  {labelFor(type)}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function EntityDetail({ id, onSelect }: { id: string; onSelect: (id: string) => void }) {
  const [entity, setEntity] = useState<{
    id: string;
    name: string;
    type: string;
    period: string | null;
    relationships: { relationship: string; related_entity_id: string; related_entity_name: string; related_entity_type: string; direction: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api.get<{ degraded?: boolean; message?: string; entity: typeof entity }>(`/graph/entity/${encodeURIComponent(id)}`)
      .then((response) => {
        if (!active) return;
        if (response.degraded) setError(response.message || "Entity details are temporarily unavailable.");
        setEntity(response.entity);
      })
      .catch(() => { if (active) setError("Could not load this entity. Please select it again."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) return <Loading label="Loading entity..." />;
  if (error) return <p role="status" className="text-amber-300/80 text-sm">{error}</p>;
  if (!entity) return <p className="text-white/40 text-sm">Entity details unavailable.</p>;

  return (
    <div>
      <h3 className="text-white text-lg font-serif leading-snug">{entity.name}</h3>
      <p className="text-white/45 text-xs mt-1 mb-4">
        {labelFor(entity.type)}{entity.period ? ` · ${entity.period}` : ""}
      </p>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs text-white/65 uppercase tracking-wider">Known connections</h4>
        <span className="text-[10px] text-gold">{entity.relationships.length}</span>
      </div>
      {entity.relationships.length === 0 ? (
        <p className="text-white/40 text-sm">No recorded relationships yet.</p>
      ) : (
        <ul className="space-y-2">
          {entity.relationships.map((relationship, index) => (
            <li key={`${relationship.related_entity_id}-${index}`}>
              <button type="button" onClick={() => onSelect(relationship.related_entity_id)}
                className="w-full text-left rounded-lg border border-white/10 hover:border-gold/40 bg-white/[.02] px-3 py-2.5 transition-colors">
                <span className="block text-[10px] text-gold/80 uppercase tracking-wide mb-1">
                  {relationship.direction === "outgoing" ? "→ " : "← "}
                  {relationship.relationship.replace(/_/g, " ").toLowerCase()}
                </span>
                <span className="block text-sm text-white/85">{relationship.related_entity_name}</span>
                <span className="block text-[10px] text-white/35 mt-1">{labelFor(relationship.related_entity_type)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
