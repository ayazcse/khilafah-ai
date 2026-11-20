"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, GraphResponse } from "@/lib/api";
import { Loading, EmptyState } from "@/components/StateViews";

export default function HistoryExplorerPage() {
  const [data, setData] = useState<GraphResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    api
      .get<GraphResponse>("/graph/graph?limit=100")
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading label="Loading history explorer..." />;

  if (!data || data.degraded || data.nodes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-serif font-semibold text-white mb-6">History Explorer</h1>
        <EmptyState
          title="No historical entities available"
          description={data?.message || "Seed the knowledge graph to populate the history explorer."}
        />
      </div>
    );
  }

  const types = Array.from(new Set(data.nodes.map((n) => n.type)));
  const filtered = filter === "all" ? data.nodes : data.nodes.filter((n) => n.type === filter);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-serif font-semibold text-white mb-1">History Explorer</h1>
      <p className="text-white/50 text-sm mb-6">
        Browse entities from the Civilization Knowledge Graph. For narrative research, use the AI Research Chat.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-md text-sm ${filter === "all" ? "bg-emerald-deep text-white" : "bg-charcoal-light text-white/60"}`}
        >
          All
        </button>
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-md text-sm ${filter === t ? "bg-emerald-deep text-white" : "bg-charcoal-light text-white/60"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((n) => (
          <div key={n.id} className="card">
            <p className="text-white font-medium">{n.label}</p>
            <p className="text-white/40 text-xs mt-1">{n.type}</p>
          </div>
        ))}
      </div>

      <p className="text-white/40 text-sm mt-8">
        Want full relationships and sources? See the{" "}
        <Link href="/knowledge-graph" className="text-gold hover:underline">
          Knowledge Graph
        </Link>{" "}
        page, or ask the{" "}
        <Link href="/chat" className="text-gold hover:underline">
          AI Research Chat
        </Link>
        .
      </p>
    </div>
  );
}
