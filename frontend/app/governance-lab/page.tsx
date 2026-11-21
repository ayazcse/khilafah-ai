"use client";

import { useEffect, useMemo, useState } from "react";
import { api, GovernanceTopic } from "@/lib/api";
import { Loading, EmptyState, EvidenceBadge, ErrorBanner } from "@/components/StateViews";

export default function GovernanceLabPage() {
  const [topics, setTopics] = useState<GovernanceTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedA, setSelectedA] = useState("");
  const [selectedB, setSelectedB] = useState("");
  const [compareResult, setCompareResult] = useState<{ a: GovernanceTopic; b: GovernanceTopic } | null>(null);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    api.get<GovernanceTopic[]>("/governance/topics")
      .then(setTopics)
      .catch(() => setError("Governance topics could not be loaded. Please refresh and try again."))
      .finally(() => setLoading(false));
  }, []);

  const evidenceTypes = useMemo(() => Array.from(new Set(topics.map((t) => t.evidence_level))), [topics]);
  const filtered = useMemo(() => topics.filter((t) => {
    const matchesFilter = filter === "all" || t.evidence_level === filter;
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [t.title, t.summary, t.description, t.period, ...t.sources].join(" ").toLowerCase().includes(term);
    return matchesFilter && matchesSearch;
  }), [topics, filter, search]);

  async function handleCompare() {
    if (!selectedA || !selectedB || selectedA === selectedB) return;
    setComparing(true);
    setCompareResult(null);
    try {
      const result = await api.get<{ a: GovernanceTopic; b: GovernanceTopic }>(`/governance/compare?a=${encodeURIComponent(selectedA)}&b=${encodeURIComponent(selectedB)}`);
      setCompareResult(result);
    } catch {
      setError("Comparison could not be completed. Please try again.");
    } finally {
      setComparing(false);
    }
  }

  if (loading) return <Loading label="Preparing governance research workspace…" />;
  if (!topics.length) return <main className="governance-page"><div className="governance-shell"><header className="governance-hero"><p className="lab-kicker">KHILAFAH AI · RESEARCH DOMAIN 01</p><h1>Governance <span>& institutions</span></h1><p>Explore administrative systems, public institutions and historical governance models through source-aware research.</p></header>{error ? <ErrorBanner message={error} /> : <EmptyState title="No governance topics yet" description="Reference data has not been loaded into this research module." />}</div></main>;

  return (
    <main className="governance-page">
      <div className="governance-shell">
        <header className="governance-hero">
          <div className="lab-kicker"><span className="lab-kicker-dot" /> KHILAFAH AI · RESEARCH DOMAIN 01</div>
          <h1>Governance <span>& institutions</span></h1>
          <p>Study how historical societies organised leadership, public administration, justice and institutions—with evidence levels and source trails kept visible.</p>
          <div className="governance-metrics">
            <div><strong>{topics.length}</strong><span>Research topics</span></div>
            <div><strong>{evidenceTypes.length}</strong><span>Evidence categories</span></div>
            <div><strong>{topics.reduce((n, t) => n + t.sources.length, 0)}</strong><span>Source references</span></div>
          </div>
        </header>


        <section className="governance-pathways">
          <div className="lab-kicker">SOCIETY, JUSTICE & PUBLIC LIFE</div>
          <h2>Build a just and flourishing society</h2>
          <p className="governance-pathways-intro">Six research pathways requested for this project. Explore historical principles, institutions, differing interpretations and modern questions without assuming every period followed one identical model.</p>
          <div className="governance-pathway-grid">
            <article><span>01</span><h3>Equality, social justice & harmony</h3><p>Social responsibility, dignity, public welfare, mutual rights, humility and peaceful coexistence.</p></article>
            <article><span>02</span><h3>Justice system</h3><p>Courts, judges, legal reasoning, accountability, due process and access to justice.</p></article>
            <article><span>03</span><h3>Mosque, education & public assembly</h3><p>How mosques served as places of worship, learning and community consultation, alongside the development of other educational and governing institutions.</p></article>
            <article><span>04</span><h3>Leadership selection & Shura</h3><p>Consultation, allegiance, community participation and the historically varied ways Muslim rulers were selected. Compare evidence rather than labelling every process modern democracy.</p></article>
            <article><span>05</span><h3>Public responsibility & institutions</h3><p>How leadership, scholars, local communities and public officials shared responsibilities in different historical settings.</p></article>
            <article><span>06</span><h3>Harmony & civic conduct</h3><p>Neighbourly rights, protection of communities, conflict resolution, trust and ethical public conduct.</p></article>
          </div>
        </section>

        <section className="governance-toolbar">
          <div className="governance-toolbar-copy"><span className="lab-kicker">THE RESEARCH LIBRARY</span><h2>Explore governance topics</h2><p>Search the collection or filter by evidence classification.</p></div>
          <div className="governance-controls">
            <input aria-label="Search governance topics" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search institutions, periods, sources…" className="input-field" />
            <select aria-label="Filter evidence type" value={filter} onChange={(e) => setFilter(e.target.value)} className="input-field">
              <option value="all">All evidence levels</option>
              {evidenceTypes.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}
            </select>
          </div>
        </section>

        {error && <div className="mb-5"><ErrorBanner message={error} /></div>}
        <div className="governance-results-head"><span>SHOWING {filtered.length} OF {topics.length} TOPICS</span><span>Evidence-led · Source-aware · Comparative</span></div>
        {filtered.length ? <div className="governance-topic-grid">
          {filtered.map((topic, index) => (
            <article className="governance-topic-card" key={topic.id}>
              <div className="governance-card-top"><span className="governance-index">{String(index + 1).padStart(2, "0")}</span><EvidenceBadge level={topic.evidence_level} /></div>
              <h3>{topic.title}</h3>
              {topic.period && <p className="governance-period">{topic.period}</p>}
              {topic.summary && <p className="governance-summary">{topic.summary}</p>}
              <p className="governance-description">{topic.description}</p>
              <div className="governance-sources"><span>SOURCE TRAIL · {topic.sources.length}</span>{topic.sources.length > 0 ? <ul>{topic.sources.map((source, i) => <li key={i}>{source}</li>)}</ul> : <p>No source references supplied yet.</p>}</div>
            </article>
          ))}
        </div> : <EmptyState title="No matching topics" description="Try a broader search or choose a different evidence filter." />}

        <section className="governance-compare">
          <div><span className="lab-kicker">SIDE-BY-SIDE ANALYSIS</span><h2>Compare two governance topics</h2><p>Place two topics next to each other to examine their documented context and evidence labels.</p></div>
          <div className="governance-compare-controls">
            <select aria-label="First topic" className="input-field" value={selectedA} onChange={(e) => setSelectedA(e.target.value)}><option value="">Choose first topic</option>{topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select>
            <span className="governance-vs">VS</span>
            <select aria-label="Second topic" className="input-field" value={selectedB} onChange={(e) => setSelectedB(e.target.value)}><option value="">Choose second topic</option>{topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select>
            <button onClick={handleCompare} disabled={!selectedA || !selectedB || selectedA === selectedB || comparing} className="btn-primary">{comparing ? "Comparing…" : "Compare topics"}</button>
          </div>
          {compareResult && <div className="governance-compare-results">{[compareResult.a, compareResult.b].map((t) => <article key={t.id}><EvidenceBadge level={t.evidence_level} /><h3>{t.title}</h3>{t.period && <p className="governance-period">{t.period}</p>}<p>{t.summary || t.description}</p><small>{t.sources.length} source references</small></article>)}</div>}
        </section>
        <p className="governance-footnote">Historical evidence, scholarly interpretation and hypothetical modelling are distinct categories. A comparison does not imply that two systems were identical or directly connected.</p>
      </div>
    </main>
  );
}
