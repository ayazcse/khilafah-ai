"use client";

import { useEffect, useMemo, useState } from "react";

type Verse = { number: number; text: string };
type EditionResponse = { quran?: Verse[]; data?: Verse[]; verses?: Verse[]; chapter?: Verse[] } | Verse[];
type Surah = { number: number; name: string; englishName: string; numberOfAyahs: number };

const API = "https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions";
const EDITIONS = {
  arabic: "ara-quranuthmanihaf",
  roman: "urd-abulaalamaududi-la",
  urdu: "urd-abulaalamaududi",
};
const FALLBACK_EDITIONS = {
  arabic: "ara-quranacademy",
  roman: "urd-muhammadjunagar-la",
  urdu: "urd-muhammadjunagar",
};

function extractVerses(payload: EditionResponse): Verse[] {
  const rows = Array.isArray(payload) ? payload : payload.quran || payload.data || payload.verses || payload.chapter || [];
  return rows.map((row: any, index) => ({
    number: Number(row.ayah || row.numberInSurah || row.verse || row.number || index + 1),
    text: String(row.text || row.translation || ""),
  })).filter((row) => row.text);
}

async function fetchEdition(edition: string, surah: number): Promise<Verse[]> {
  const urls = [
    `${API}/${edition}/${surah}.min.json`,
    `${API}/${edition}/${surah}.json`,
  ];
  let lastError: unknown;
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Source returned ${response.status}`);
      const data = await response.json();
      const verses = extractVerses(data);
      if (verses.length) return verses;
      throw new Error("Unexpected Quran data format");
    } catch (error) { lastError = error; }
  }
  throw lastError || new Error("Unable to load edition");
}

export default function QuranExplorerPage() {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [surah, setSurah] = useState(1);
  const [arabic, setArabic] = useState<Verse[]>([]);
  const [roman, setRoman] = useState<Verse[]>([]);
  const [urdu, setUrdu] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showArabic, setShowArabic] = useState(true);
  const [showRoman, setShowRoman] = useState(true);
  const [showUrdu, setShowUrdu] = useState(false);

  useEffect(() => {
    fetch("https://api.alquran.cloud/v1/surah")
      .then((response) => { if (!response.ok) throw new Error("Surah list unavailable"); return response.json(); })
      .then((data) => setSurahs(data.data || []))
      .catch(() => setError("Surah list load nahi ho saki. Please refresh and try again."));
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      fetchEdition(EDITIONS.arabic, surah).catch(() => fetchEdition(FALLBACK_EDITIONS.arabic, surah)),
      fetchEdition(EDITIONS.roman, surah).catch(() => fetchEdition(FALLBACK_EDITIONS.roman, surah)),
      fetchEdition(EDITIONS.urdu, surah).catch(() => fetchEdition(FALLBACK_EDITIONS.urdu, surah)),
    ]).then(([a, r, u]) => {
      if (!active) return;
      setArabic(a); setRoman(r); setUrdu(u);
    }).catch(() => { if (active) setError("Quran text load nahi ho saka. Source temporarily unavailable ho sakta hai."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [surah]);

  const currentSurah = surahs.find((item) => item.number === surah);
  const filteredSurahs = useMemo(() => surahs.filter((item) =>
    `${item.number} ${item.englishName} ${item.name}`.toLowerCase().includes(search.toLowerCase())
  ), [surahs, search]);
  const romanByAyah = useMemo(() => new Map(roman.map((v) => [v.number, v.text])), [roman]);
  const urduByAyah = useMemo(() => new Map(urdu.map((v) => [v.number, v.text])), [urdu]);

  return <main className="min-h-screen bg-[#071a19] text-slate-100">
    <section className="relative overflow-hidden border-b border-emerald-300/10 bg-gradient-to-br from-[#0c302b] via-[#09221f] to-[#071a19]">
      <div className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[.28em] text-emerald-300">KHILAFAH AI · QURAN STUDY</p>
        <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Quran Explorer</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">Quran ko Arabic, Roman Urdu aur Urdu tarjume ke saath ayat-by-ayat parhein.</p>
        <div className="mt-7 flex flex-wrap gap-2">
          <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-200">Arabic text</span>
          <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-200">Roman Urdu tarjuma</span>
          <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-200">Urdu tarjuma</span>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[.04] p-4 sm:grid-cols-[1fr_1.5fr] sm:p-5">
        <label className="text-xs font-medium text-slate-400">SEARCH SURAH
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Surah ka naam ya number..." className="mt-2 w-full rounded-xl border border-white/10 bg-[#071a19] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400" />
        </label>
        <label className="text-xs font-medium text-slate-400">SELECT SURAH
          <select value={surah} onChange={(e) => setSurah(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-white/10 bg-[#071a19] px-4 py-3 text-sm text-white outline-none focus:border-emerald-400">
            {filteredSurahs.map((item) => <option key={item.number} value={item.number}>{item.number}. {item.englishName} — {item.name}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[.03] p-3">
        <span className="mr-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Display</span>
        {[
          ["Arabic", showArabic, setShowArabic],
          ["Roman Urdu", showRoman, setShowRoman],
          ["Urdu", showUrdu, setShowUrdu],
        ].map(([label, checked, setter]: any) => <button key={label} onClick={() => setter(!checked)} className={`rounded-full border px-3 py-2 text-xs transition ${checked ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-200" : "border-white/10 text-slate-400 hover:border-white/30"}`}>{checked ? "✓ " : "+ "}{label}</button>)}
      </div>

      <div className="mt-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[.2em] text-emerald-300">Now reading</p>
          <h2 className="mt-2 font-serif text-2xl text-white">{currentSurah?.englishName || "Surah"} <span className="text-lg text-slate-400">· {currentSurah?.name || ""}</span></h2>
          <p className="mt-1 text-xs text-slate-500">{currentSurah?.numberOfAyahs || arabic.length} Ayat</p>
        </div>
        <a href="https://quran.com" target="_blank" rel="noreferrer" className="text-xs text-emerald-300 underline underline-offset-4">Open Quran.com ↗</a>
      </div>

      {loading && <div className="mt-6 rounded-2xl border border-white/10 bg-white/[.03] p-8 text-center text-sm text-slate-300">Quran text load ho raha hai…</div>}
      {error && !loading && <div role="alert" className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-5 text-sm text-amber-100">{error}</div>}
      {!loading && !error && <div className="mt-5 space-y-4">
        {arabic.map((verse) => <article key={verse.number} className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[.055] to-white/[.025] p-5 shadow-lg shadow-black/10 sm:p-7">
          <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-3">
            <span className="grid h-9 w-9 place-items-center rounded-full border border-emerald-300/20 bg-emerald-300/10 text-xs font-semibold text-emerald-200">{verse.number}</span>
            <span className="text-[11px] tracking-wider text-slate-500">{surah}:{verse.number}</span>
          </div>
          {showArabic && <p dir="rtl" lang="ar" className="mb-6 text-right font-serif text-3xl leading-[2.2] text-[#f5e9c9] sm:text-4xl">{verse.text}</p>}
          {showRoman && <div className="mb-4 rounded-xl border border-emerald-300/10 bg-emerald-300/[.045] p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-emerald-300">Roman Urdu tarjuma · Abul A'la Maududi</p>
            <p className="text-sm leading-7 text-slate-100">{romanByAyah.get(verse.number) || "Is ayat ka Roman Urdu tarjuma filhaal available nahi."}</p>
          </div>}
          {showUrdu && <div className="rounded-xl border border-white/10 bg-black/10 p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Urdu tarjuma · Abul A'la Maududi</p>
            <p dir="rtl" lang="ur" className="text-right text-lg leading-9 text-slate-200">{urduByAyah.get(verse.number) || "اس آیت کا ترجمہ فی الحال دستیاب نہیں۔"}</p>
          </div>}
        </article>)}
      </div>}

      <div className="mt-8 rounded-2xl border border-amber-200/15 bg-amber-100/[.04] p-5 text-xs leading-6 text-slate-400">
        <p className="font-semibold text-amber-200">Reading and source note</p>
        <p className="mt-2">Translations are interpretations of the meaning, not the Arabic Quran itself. Roman Urdu edition is attributed to Abul A'la Maududi; Urdu edition is shown separately. Please consult qualified scholarship for tafsir, fiqh or religious rulings. Text is loaded from the Quran API dataset; availability depends on its public CDN.</p>
        <p className="mt-2">Data provider: <a className="text-emerald-300 underline" href="https://github.com/fawazahmed0/quran-api" target="_blank" rel="noreferrer">fawazahmed0/quran-api</a> · Arabic and translations should be independently checked before treating this reader as a verified Mushaf edition.</p>
      </div>
    </section>
  </main>;
}
