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
  if (!topics.length) return <main className="governance-page"><div className="governance-shell"><header className="governance-hero"><p className="lab-kicker">KHALAF · RESEARCH DOMAIN 01</p><h1>Governance <span>& institutions</span></h1><p>Explore administrative systems, public institutions and historical governance models through source-aware research.</p></header>{error ? <ErrorBanner message={error} /> : <EmptyState title="No governance topics yet" description="Reference data has not been loaded into this research module." />}</div></main>;

  return (
    <main className="governance-page">
      <div className="governance-shell">
        <header className="governance-hero">
          <div className="lab-kicker"><span className="lab-kicker-dot" /> KHALAF · RESEARCH DOMAIN 01</div>
          <h1>Governance <span>& institutions</span></h1>
          <p>Study how historical societies organised leadership, public administration, justice and institutions—with evidence levels and source trails kept visible.</p>
          <div className="governance-metrics">
            <div><strong>{topics.length}</strong><span>Research topics</span></div>
            <div><strong>{evidenceTypes.length}</strong><span>Evidence categories</span></div>
            <div><strong>{topics.reduce((n, t) => n + t.sources.length, 0)}</strong><span>Source references</span></div>
          </div>
        </header>


        <section className="governance-pathways">
          <div className="lab-kicker">SOCIETY, JUSTICE & PUBLIC LIFE</div><h2>From principles to a just society</h2>
          <p className="governance-pathways-intro">A practical learning guide: what the principles mean, how institutions can apply them, what history records, and where modern comparisons need care.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
            <article className="rounded-2xl border border-emerald-900/20 bg-slate-950/50 p-5"><span className="text-emerald-300 text-sm font-semibold">01 · EQUALITY & SOCIAL HARMONY</span><h3 className="text-xl font-semibold mt-2">Build dignity, fairness and humility into everyday life</h3><p className="mt-3 text-slate-300">A just society recognises the equal human dignity of every person. Public decisions should not favour people because of wealth, ancestry, ethnicity or social status. Humility means leaders remain answerable; harmony means disagreement is handled without humiliation or violence.</p><h4 className="font-semibold mt-4">A practical framework</h4><ul className="list-disc pl-5 mt-2 space-y-1 text-slate-300"><li>Guarantee equal access to public services, education, healthcare and legal protection.</li><li>Protect religious freedom, neighbours, minorities and the safety of all communities.</li><li>Make public appointments transparent and based on competence and integrity.</li><li>Use mediation, community dialogue and non-violent dispute resolution.</li><li>Publish budgets and outcomes; create complaint channels and independent oversight.</li></ul><p className="mt-3 text-sm text-slate-400">Ethical anchors often discussed include Qur’an 4:135 (justice even against oneself), 5:8 (fairness), 16:90 (justice and excellence) and 49:13 (human diversity and dignity).</p></article>
            <article className="rounded-2xl border border-emerald-900/20 bg-slate-950/50 p-5"><span className="text-emerald-300 text-sm font-semibold">02 · JUSTICE SYSTEM</span><h3 className="text-xl font-semibold mt-2">Justice must be impartial, accessible and accountable</h3><p className="mt-3 text-slate-300">A justice system is not simply punishment. It must protect people from arbitrary power, hear both sides, examine reliable evidence and provide remedies. Judges need independence, fair procedures and protection from political or financial pressure.</p><h4 className="font-semibold mt-4">How to make it work</h4><ul className="list-disc pl-5 mt-2 space-y-1 text-slate-300"><li>Ensure equal treatment before the law, regardless of status or identity.</li><li>Require notice of allegations, a meaningful hearing and evidence-based decisions.</li><li>Provide legal assistance for people who cannot afford representation.</li><li>Separate investigation, prosecution and adjudication; allow review and appeal.</li><li>Prevent torture, coercion, collective punishment and conflicts of interest.</li><li>Publish reasoned judgments while protecting victims and private information.</li></ul><p className="mt-3 text-sm text-slate-400">Historical qadis, courts and legal schools varied by place and period. Their history should be studied alongside contemporary standards of due process and human rights.</p></article>
            <article className="rounded-2xl border border-emerald-900/20 bg-slate-950/50 p-5"><span className="text-emerald-300 text-sm font-semibold">03 · MOSQUE, EDUCATION & PUBLIC ASSEMBLY</span><h3 className="text-xl font-semibold mt-2">A community institution for worship, learning and consultation</h3><p className="mt-3 text-slate-300">The Prophet’s mosque in Madinah served as a place of worship and also a centre for teaching, community affairs, receiving delegations and consultation. Mosques remained important learning spaces in many Muslim societies. Over time, libraries, study circles, madrasas, colleges and other institutions developed alongside them.</p><h4 className="font-semibold mt-4">How this can inspire education today</h4><ul className="list-disc pl-5 mt-2 space-y-1 text-slate-300"><li>Make learning accessible: literacy, science, ethics, civic knowledge and lifelong education.</li><li>Support teachers, libraries, scholarships, research and open public lectures.</li><li>Use community spaces for listening sessions, local problem-solving and public service.</li><li>Keep consultation inclusive, transparent and respectful of women, minorities and differing views.</li></ul><p className="mt-3 text-sm text-slate-400">Important distinction: it is too simple to say the mosque universally changed from an education centre into a parliament. Functions differed across periods; a mosque’s consultation role was not identical to a modern elected legislature.</p></article>
            <article className="rounded-2xl border border-emerald-900/20 bg-slate-950/50 p-5"><span className="text-emerald-300 text-sm font-semibold">04 · LEADERSHIP, SHURA & PUBLIC CONSENT</span><h3 className="text-xl font-semibold mt-2">How early caliphs were selected — and what the record actually shows</h3><p className="mt-3 text-slate-300">There was no single, fixed electoral procedure used for every early caliph. After the Prophet’s death, Abu Bakr received allegiance following discussions at Saqifah and wider pledges; Umar was nominated by Abu Bakr and accepted through consultation and allegiance; Uthman was selected through a council appointed by Umar; Ali received pledges amid a period of severe political crisis. These events are historically distinct and their interpretation is debated.</p><h4 className="font-semibold mt-4">Principles for responsible leadership today</h4><ul className="list-disc pl-5 mt-2 space-y-1 text-slate-300"><li>Consultation (shura), public accountability and consent should be meaningful, not symbolic.</li><li>Set clear, known procedures for selection, succession, term limits or removal.</li><li>Protect peaceful opposition, freedom to question leaders and independent institutions.</li><li>Require leaders to serve the public, disclose conflicts and answer for misuse of power.</li></ul><p className="mt-3 text-sm text-slate-400">The early record should not be described as modern universal suffrage: participation, power and procedures differed. Historical study can inform debate without claiming that one modern constitutional model is directly prescribed by every precedent.</p></article>
            <article className="rounded-2xl border border-emerald-900/20 bg-slate-950/50 p-5"><span className="text-emerald-300 text-sm font-semibold">05 · PUBLIC INSTITUTIONS & RESPONSIBILITY</span><h3 className="text-xl font-semibold mt-2">Turn public authority into public service</h3><p className="mt-3 text-slate-300">Good governance needs more than an ethical ruler. It needs capable institutions, trained public servants, reliable records and checks on authority. Historical Muslim societies developed different arrangements for courts, markets, taxation, charitable endowments and local administration; none was identical everywhere.</p><h4 className="font-semibold mt-4">A modern institutional checklist</h4><ul className="list-disc pl-5 mt-2 space-y-1 text-slate-300"><li>Clear laws, published responsibilities and accessible public records.</li><li>Merit-based recruitment, professional training and anti-corruption safeguards.</li><li>Independent audits, ombuds services and protection for whistle-blowers.</li><li>Local participation in planning schools, water, health and infrastructure.</li></ul></article>
            <article className="rounded-2xl border border-emerald-900/20 bg-slate-950/50 p-5"><span className="text-emerald-300 text-sm font-semibold">06 · A PRACTICAL SOCIETY-BUILDING PLAN</span><h3 className="text-xl font-semibold mt-2">Start with measurable public benefit</h3><p className="mt-3 text-slate-300">Principles become meaningful when residents can see improvements in daily life. A community can begin with a public needs assessment, then agree on priorities and review progress openly.</p><h4 className="font-semibold mt-4">First steps</h4><ol className="list-decimal pl-5 mt-2 space-y-1 text-slate-300"><li>Listen to residents, especially groups whose voices are often missed.</li><li>Identify urgent gaps in education, safety, food security, health and justice.</li><li>Publish a realistic budget, responsible teams and a delivery timeline.</li><li>Track outcomes such as school attendance, service access and complaint resolution.</li><li>Invite independent review and correct policies that cause harm.</li></ol></article>
          </div><p className="text-sm text-slate-400 mt-5">Learning note: Qur’anic references are ethical starting points, not a complete legal code. Interpretations differ; consult qualified scholarship and primary historical research for detailed rulings.</p>
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
