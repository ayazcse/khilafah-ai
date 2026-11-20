"use client";

import { useEffect, useState } from "react";
import { api, GovernanceTopic } from "@/lib/api";
import { Loading, EmptyState, EvidenceBadge } from "@/components/StateViews";

export default function GovernanceLabPage() {
  const [topics, setTopics] = useState<GovernanceTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedA, setSelectedA] = useState<string | null>(null);
  const [selectedB, setSelectedB] = useState<string | null>(null);
  const [compareResult, setCompareResult] = useState<{ a: GovernanceTopic; b: GovernanceTopic } | null>(null);

  useEffect(() => {
    api.get<GovernanceTopic[]>("/governance/topics").then((t) => {
      setTopics(t);
      setLoading(false);
    });
  }, []);

  async function handleCompare() {
    if (!selectedA || !selectedB) return;
    const result = await api.get<{ a: GovernanceTopic; b: GovernanceTopic }>(
      `/governance/compare?a=${selectedA}&b=${selectedB}`
    );
    setCompareResult(result);
  }

  if (loading) return <Loading />;
  if (topics.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-serif font-semibold text-white mb-6">Governance Research Lab</h1>
        <EmptyState title="No topics available" description="Governance reference data has not been loaded." />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-serif font-semibold text-white mb-1">Governance Research Lab</h1>
      <p className="text-white/50 text-sm mb-8">
        Historical administrative structures, each labeled by evidence level with source references. Hypothetical
        governance models, if shown, are never presented as proven historical fact.
      </p>

      <div className="grid gap-6 mb-10">
        {topics.map((t) => (
          <div key={t.id} className="card">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h3 className="text-white font-medium text-lg">{t.title}</h3>
              <EvidenceBadge level={t.evidence_level} />
            </div>
            <p className="text-white/70 text-sm mb-3">{t.description}</p>
            {t.period && <p className="text-white/40 text-xs mb-2">Period: {t.period}</p>}
            <div className="text-white/40 text-xs">
              <p className="font-medium mb-1">Sources:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {t.sources.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <section className="card">
        <h2 className="text-gold font-medium mb-4">Compare two topics</h2>
        <div className="flex gap-3 mb-4">
          <select value={selectedA || ""} onChange={(e) => setSelectedA(e.target.value)} className="input-field">
            <option value="">Select topic A</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
          <select value={selectedB || ""} onChange={(e) => setSelectedB(e.target.value)} className="input-field">
            <option value="">Select topic B</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
          <button onClick={handleCompare} disabled={!selectedA || !selectedB} className="btn-primary whitespace-nowrap">
            Compare
          </button>
        </div>
        {compareResult && (
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            {[compareResult.a, compareResult.b].map((t) => (
              <div key={t.id} className="bg-charcoal rounded-lg p-4">
                <h4 className="text-white font-medium mb-1">{t.title}</h4>
                <EvidenceBadge level={t.evidence_level} />
                <p className="text-white/60 text-sm mt-2">{t.description}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
