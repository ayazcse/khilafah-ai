"use client";

import { useMemo, useState } from "react";

type SourceKind = "Primary source" | "Academic book / article" | "Reference work" | "Other";
type Position = "Supports claim" | "Challenges claim" | "Context only";
type ReviewState = "Not checked" | "Metadata checked" | "Full text reviewed";

interface EvidenceItem {
  id: string;
  claim: string;
  sourceTitle: string;
  author: string;
  sourceKind: SourceKind;
  position: Position;
  reviewState: ReviewState;
  locator: string;
  notes: string;
}

const EMPTY_FORM = {
  claim: "",
  sourceTitle: "",
  author: "",
  sourceKind: "Primary source" as SourceKind,
  position: "Supports claim" as Position,
  reviewState: "Not checked" as ReviewState,
  locator: "",
  notes: "",
};

export default function EvidenceReviewPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [filter, setFilter] = useState("All evidence");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  const stats = useMemo(() => ({
    total: items.length,
    supporting: items.filter((item) => item.position === "Supports claim").length,
    challenging: items.filter((item) => item.position === "Challenges claim").length,
    primary: items.filter((item) => item.sourceKind === "Primary source").length,
    reviewed: items.filter((item) => item.reviewState === "Full text reviewed").length,
  }), [items]);

  const visibleItems = useMemo(() => items.filter((item) => {
    const matchesFilter = filter === "All evidence" || item.position === filter;
    const text = [item.claim, item.sourceTitle, item.author, item.notes].join(" ").toLowerCase();
    return matchesFilter && text.includes(query.toLowerCase());
  }), [items, filter, query]);

  function addEvidence(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.claim.trim() || !form.sourceTitle.trim()) return;
    setItems((current) => [{
      ...form,
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()),
      claim: form.claim.trim(),
      sourceTitle: form.sourceTitle.trim(),
      author: form.author.trim(),
      locator: form.locator.trim(),
      notes: form.notes.trim(),
    }, ...current]);
    setForm(EMPTY_FORM);
    setMessage("Evidence entry added to this workspace.");
  }

  function exportResearchLog() {
    const payload = {
      exported_at: new Date().toISOString(),
      platform: "KHILAFAH AI Evidence Review Workspace",
      note: "This is a researcher-maintained evidence log, not an automated fact-check or scholarly verdict.",
      summary: stats,
      evidence: items,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "khilafah-ai-evidence-log.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Research log exported as JSON.");
  }

  function update<K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-200">
          <span className="h-2 w-2 rounded-full bg-emerald-300" /> RESEARCH INTEGRITY WORKSPACE
        </div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-white sm:text-4xl">Evidence Review Lab</h1>
        <p className="max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
          Build a transparent evidence trail for historical and civilization-related claims. Record what supports a claim, what challenges it, and what still needs checking.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Evidence summary">
        {[
          ["Evidence entries", stats.total],
          ["Supporting", stats.supporting],
          ["Challenging", stats.challenging],
          ["Primary sources", stats.primary],
          ["Full text reviewed", stats.reviewed],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <p className="text-xs text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)]">
        <form onSubmit={addEvidence} className="space-y-4 rounded-2xl border border-emerald-300/15 bg-[#102333] p-4 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Add an evidence record</h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">One record = one source assessed against one clearly worded claim.</p>
          </div>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-300">Historical / research claim *</span>
            <textarea required rows={3} value={form.claim} onChange={(e) => update("claim", e.target.value)} placeholder="Write one specific, testable claim..." className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/60" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-300">Source title *</span>
              <input required value={form.sourceTitle} onChange={(e) => update("sourceTitle", e.target.value)} placeholder="Book, article, manuscript..." className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/60" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-300">Author / editor</span>
              <input value={form.author} onChange={(e) => update("author", e.target.value)} placeholder="Author or editor" className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/60" />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-300">Source category</span>
              <select value={form.sourceKind} onChange={(e) => update("sourceKind", e.target.value as SourceKind)} className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400/60">
                <option>Primary source</option><option>Academic book / article</option><option>Reference work</option><option>Other</option>
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-300">Relationship to claim</span>
              <select value={form.position} onChange={(e) => update("position", e.target.value as Position)} className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400/60">
                <option>Supports claim</option><option>Challenges claim</option><option>Context only</option>
              </select>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-300">Review status</span>
              <select value={form.reviewState} onChange={(e) => update("reviewState", e.target.value as ReviewState)} className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400/60">
                <option>Not checked</option><option>Metadata checked</option><option>Full text reviewed</option>
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-300">Page / chapter / URL</span>
              <input value={form.locator} onChange={(e) => update("locator", e.target.value)} placeholder="Page 42, chapter 3, DOI or URL" className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/60" />
            </label>
          </div>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-300">Research notes</span>
            <textarea rows={2} value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="What passage matters? Any translation, dating or authorship concerns?" className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/60" />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="min-h-11 rounded-xl bg-emerald-400 px-5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300">Add evidence</button>
            <span className="text-xs text-slate-500">Required fields are marked *</span>
          </div>
          {message && <p role="status" className="text-xs text-emerald-200">{message}</p>}
        </form>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-sky-300/15 bg-slate-900/60 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-white">A careful research workflow</h2>
            <ol className="mt-4 space-y-4">
              {[
                ["01", "Define the claim", "Keep it narrow, specific and possible to check."],
                ["02", "Identify the source", "Record author, date, edition, source type and exact location."],
                ["03", "Read in context", "Check the full passage, translation, authorship and surrounding argument."],
                ["04", "Seek counter-evidence", "Look for credible sources that disagree or complicate the claim."],
                ["05", "Write a qualified conclusion", "Separate established facts, disputed claims and your interpretation."],
              ].map(([number, title, description]) => (
                <li key={number} className="flex gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-emerald-300/20 bg-emerald-300/10 text-xs font-semibold text-emerald-200">{number}</span>
                  <div><p className="text-sm font-medium text-white">{title}</p><p className="mt-1 text-xs leading-5 text-slate-400">{description}</p></div>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-2xl border border-amber-300/20 bg-amber-300/5 p-5">
            <p className="text-sm font-semibold text-amber-100">Important: no automatic truth score</p>
            <p className="mt-2 text-xs leading-5 text-amber-100/75">A source being primary does not automatically make it accurate, and a count of sources does not prove a claim. This workspace organizes a human research process; it does not certify historical truth or replace specialist review.</p>
          </div>
          <button type="button" onClick={exportResearchLog} disabled={items.length === 0} className="min-h-11 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40">Export research log (JSON)</button>
        </aside>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><h2 className="text-xl font-semibold text-white">Your evidence board</h2><p className="mt-1 text-xs text-slate-400">Entries stay in this browser session. Export your log before leaving.</p></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search claims or sources..." className="min-h-10 rounded-lg border border-white/10 bg-slate-950/60 px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/60" />
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="min-h-10 rounded-lg border border-white/10 bg-slate-950/60 px-3 text-sm text-white outline-none">
              <option>All evidence</option><option>Supports claim</option><option>Challenges claim</option><option>Context only</option>
            </select>
          </div>
        </div>
        {visibleItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/30 px-5 py-10 text-center">
            <p className="text-sm font-medium text-slate-200">{items.length === 0 ? "Your evidence board is ready" : "No matching evidence"}</p>
            <p className="mt-2 text-xs text-slate-500">{items.length === 0 ? "Add a claim and its first source to start building a balanced research trail." : "Try a different search or filter."}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleItems.map((item) => (
              <article key={item.id} className="rounded-2xl border border-white/10 bg-slate-900/50 p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={"rounded-full px-2.5 py-1 text-[11px] font-semibold " + (item.position === "Supports claim" ? "bg-emerald-400/10 text-emerald-200" : item.position === "Challenges claim" ? "bg-rose-400/10 text-rose-200" : "bg-sky-400/10 text-sky-200")}>{item.position}</span>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-slate-400">{item.sourceKind}</span>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-slate-400">{item.reviewState}</span>
                  <button type="button" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} className="ml-auto text-xs text-slate-500 hover:text-rose-300">Remove</button>
                </div>
                <h3 className="mt-3 text-sm font-semibold leading-6 text-white">{item.claim}</h3>
                <p className="mt-2 text-sm text-emerald-100">{item.sourceTitle}{item.author ? " · " + item.author : ""}</p>
                {item.locator && <p className="mt-1 break-all text-xs text-slate-400">{item.locator}</p>}
                {item.notes && <p className="mt-3 whitespace-pre-wrap text-xs leading-5 text-slate-300">{item.notes}</p>}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
