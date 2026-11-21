"use client";

import { useMemo, useState } from "react";

type Scholar = {
  name: string; dates: string; place: string; field: string; era: string;
  summary: string; contributions: string[]; works: string; caution: string;
  source: { label: string; url: string }[];
};

const SCHOLARS: Scholar[] = [
  {
    name: "Muhammad ibn Musa al-Khwarizmi", dates: "c. 780–850 CE", place: "Baghdad, Abbasid Caliphate",
    field: "Mathematics & Astronomy", era: "9th century",
    summary: "A mathematician whose work helped establish algebra as a systematic subject. His writing brought together earlier mathematical traditions and practical problem-solving.",
    contributions: ["Systematic treatment of linear and quadratic equations in al-jabr", "Influential works on Hindu-Arabic numerals and calculation", "Astronomical tables and work involving instruments such as the astrolabe"],
    works: "Al-Kitab al-mukhtasar fi hisab al-jabr wa'l-muqabala",
    caution: "Al-Khwarizmi did not invent mathematics or the numeral system from nothing. His work developed within a wider exchange of Greek, Indian, Persian and other traditions. The word algorithm derives from the Latinised form of his name.",
    source: [{label:"Qatar Digital Library — Arabic Scientific Tradition",url:"https://www.qdl.qa/en/arabic-scientific-tradition"},{label:"Charette & Schmidl — al-Khwarizmi and Practical Astronomy (SCIAMVS)",url:"https://www.sciamvs.org/files/SCIAMVS_05_101-198_Charette_Schmidl.pdf"}]
  },
  {
    name: "Ibn al-Haytham (Alhazen)", dates: "c. 965–1040 CE", place: "Basra and Cairo",
    field: "Optics, Mathematics & Physics", era: "11th century",
    summary: "A major scholar of optics whose Book of Optics investigated vision, light, reflection and refraction through mathematical analysis and experiments.",
    contributions: ["Explained vision through light entering the eye, challenging earlier theories", "Studied reflection, refraction, lenses and camera-obscura-like effects", "Combined observation, experiment and mathematical reasoning in optical inquiry"],
    works: "Kitab al-Manazir (Book of Optics)",
    caution: "Calling him the sole inventor of the modern scientific method oversimplifies a long history. Describe his experimental and mathematical approach in the specific context of optics.",
    source: [{label:"Nader El-Bizri — Arabic Classical Traditions and Ibn al-Haytham (European Physical Journal Plus)",url:"https://doi.org/10.1140/epjp/i2018-12142-7"},{label:"Encyclopaedia / scholarly overview — Classification of sciences in Islamic cultures",url:"https://www.isko.org/cyclo/islamic"}]
  },
  {
    name: "Abu Rayhan al-Biruni", dates: "973–c. 1050 CE", place: "Khwarazm and wider Central/South Asia",
    field: "Astronomy, Mathematics & Geography", era: "10th–11th centuries",
    summary: "A polymath known for careful observation and wide-ranging studies of astronomy, geography, chronology, mathematics and the cultures of the regions he investigated.",
    contributions: ["Wrote comparative studies of Indian religions, sciences and customs", "Worked on geodesy, coordinates, astronomy and measurement", "Used observation and mathematical methods to investigate the natural world"],
    works: "Kitab al-Hind; major astronomical and geodetic writings",
    caution: "Dates and details of some individual measurements are debated. Present specific numerical claims only when a specialist source supports them.",
    source: [{label:"Cambridge — The sciences in Islamic societies (750–1800)",url:"https://www.cambridge.org/core/books/abs/new-cambridge-history-of-islam/sciences-in-islamic-societies-7501800/3BCAD0EDBD3EB2042B3CA32DD5E0E33E"}]
  },
  {
    name: "Ibn Sina (Avicenna)", dates: "c. 980–1037 CE", place: "Bukhara region, Persia and wider Islamic world",
    field: "Medicine & Philosophy", era: "10th–11th centuries",
    summary: "Physician and philosopher whose Canon of Medicine organised medical knowledge and became influential in later medical education in parts of Europe and the Middle East.",
    contributions: ["Compiled a broad medical reference in the Canon of Medicine", "Discussed clinical observation, diagnosis, medicines and treatment", "Wrote extensively across philosophy and natural sciences"],
    works: "Al-Qanun fi al-Tibb (The Canon of Medicine); Kitab al-Shifa",
    caution: "The Canon was influential, but it built on earlier Greek, Persian, Indian and Arabic medical traditions and was not the sole basis of medicine in every region.",
    source: [{label:"Cambridge — The sciences in Islamic societies (750–1800)",url:"https://www.cambridge.org/core/books/abs/new-cambridge-history-of-islam/sciences-in-islamic-societies-7501800/3BCAD0EDBD3EB2042B3CA32DD5E0E33E"}]
  },
  {
    name: "Al-Razi (Rhazes)", dates: "c. 854–925/935 CE", place: "Rayy and Baghdad",
    field: "Medicine & Chemistry", era: "9th–10th centuries",
    summary: "A prominent physician and writer whose medical works discussed clinical practice, diseases and the organisation of medical knowledge.",
    contributions: ["Authored the large medical compendium Kitab al-Hawi", "Wrote a treatise comparing smallpox and measles", "Contributed to medical practice and discussions of substances and pharmacy"],
    works: "Kitab al-Hawi; Treatise on Smallpox and Measles",
    caution: "His biography and chronology vary across sources. Avoid repeating popular claims about specific hospital experiments unless supported by a reliable historical study.",
    source: [{label:"Cambridge — The sciences in Islamic societies (750–1800)",url:"https://www.cambridge.org/core/books/abs/new-cambridge-history-of-islam/sciences-in-islamic-societies-7501800/3BCAD0EDBD3EB2042B3CA32DD5E0E33E"}]
  },
  {
    name: "Al-Jazari", dates: "fl. late 12th–early 13th century", place: "Diyarbakir, Artuqid court",
    field: "Mechanical Engineering", era: "12th–13th centuries",
    summary: "An engineer whose illustrated treatise describes water-powered devices, clocks, automata and ingenious mechanical arrangements.",
    contributions: ["Designed and documented water clocks and elaborate automata", "Described pumps and mechanisms using gears, floats and valves", "Preserved practical engineering knowledge through detailed illustrations"],
    works: "The Book of Knowledge of Ingenious Mechanical Devices (1206)",
    caution: "Do not claim he invented every mechanism shown in his book. Distinguish devices he documented, adapted or improved from claims of first invention.",
    source: [{label:"Cambridge — The sciences in Islamic societies (750–1800)",url:"https://www.cambridge.org/core/books/abs/new-cambridge-history-of-islam/sciences-in-islamic-societies-7501800/3BCAD0EDBD3EB2042B3CA32DD5E0E33E"}]
  },
  {
    name: "Thabit ibn Qurra", dates: "c. 826–901 CE", place: "Harran and Baghdad",
    field: "Mathematics & Astronomy", era: "9th century",
    summary: "A mathematician, astronomer and translator who contributed to the transmission, critique and development of mathematical and astronomical works.",
    contributions: ["Translated and revised Greek scientific texts into Arabic", "Worked on geometry, number theory and astronomy", "Participated in the scholarly networks of Abbasid Baghdad"],
    works: "Mathematical and astronomical treatises; translations and commentaries",
    caution: "The translation movement was collaborative and multilingual. Avoid attributing the entire preservation of Greek learning to one person or one community.",
    source: [{label:"Cambridge — The sciences in Islamic societies (750–1800)",url:"https://www.cambridge.org/core/books/abs/new-cambridge-history-of-islam/sciences-in-islamic-societies-7501800/3BCAD0EDBD3EB2042B3CA32DD5E0E33E"}]
  },
  {
    name: "Nasir al-Din al-Tusi", dates: "1201–1274 CE", place: "Tus, Maragha and Ilkhanid domains",
    field: "Astronomy & Mathematics", era: "13th century",
    summary: "A polymath associated with the Maragha observatory and important developments in mathematical astronomy, geometry and philosophy.",
    contributions: ["Helped establish and lead the Maragha observatory", "Developed mathematical models used in planetary astronomy", "Contributed to geometry, trigonometry and scholarly education"],
    works: "Tadhkira fi 'ilm al-hay'a; influential astronomical writings",
    caution: "Later influence and possible transmission routes to European astronomy require careful specialist treatment; avoid simple direct-invention narratives.",
    source: [{label:"Cambridge — The sciences in Islamic societies (750–1800)",url:"https://www.cambridge.org/core/books/abs/new-cambridge-history-of-islam/sciences-in-islamic-societies-7501800/3BCAD0EDBD3EB2042B3CA32DD5E0E33E"}]
  }
];

const CATEGORIES = ["All", "Mathematics & Astronomy", "Optics, Mathematics & Physics", "Medicine & Philosophy", "Medicine & Chemistry", "Mechanical Engineering", "Astronomy & Mathematics"];

export default function ScientificHeritagePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState<Scholar | null>(null);
  const filtered = useMemo(() => SCHOLARS.filter(s => {
    const text = [s.name, s.place, s.field, s.summary, ...s.contributions].join(" ").toLowerCase();
    return text.includes(query.toLowerCase()) && (category === "All" || s.field === category);
  }), [query, category]);

  return (
    <div className="min-h-screen bg-[#111816] text-[#f2eee5]">
      <section className="relative overflow-hidden border-b border-[#d3ad62]/20 bg-gradient-to-br from-[#18372b] via-[#14271f] to-[#111816]">
        <div className="pointer-events-none absolute -right-24 -top-28 h-96 w-96 rounded-full border border-[#d3ad62]/20" />
        <div className="pointer-events-none absolute right-8 top-10 h-72 w-72 rounded-full border border-[#d3ad62]/10" />
        <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
          <p className="mb-4 text-xs font-bold uppercase tracking-[.24em] text-[#d8b976]">Knowledge · Discovery · Inquiry</p>
          <h1 className="max-w-4xl font-serif text-4xl leading-tight sm:text-6xl">Muslim <em className="text-[#d8b976]">Scientific</em> Heritage</h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">Explore scholars, ideas, instruments and research traditions that developed across Muslim societies — through historical context and traceable sources.</p>
          <div className="mt-9 flex flex-wrap gap-3 text-xs">
            <span className="rounded-full border border-[#d8b976]/30 bg-black/10 px-4 py-2 text-[#ead29d]">8 scholar profiles</span>
            <span className="rounded-full border border-white/15 bg-black/10 px-4 py-2 text-white/75">Multiple scientific fields</span>
            <span className="rounded-full border border-white/15 bg-black/10 px-4 py-2 text-white/75">Sources & historical notes</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#d8b976]">Explore the scholars</p><h2 className="mt-2 font-serif text-3xl">People behind the ideas</h2><p className="mt-2 max-w-xl text-sm leading-6 text-white/55">Search by scholar, place or field. Open a profile to explore contributions, major works and references.</p></div>
          <div className="w-full lg:max-w-sm"><label htmlFor="heritage-search" className="mb-2 block text-xs text-white/60">Search the collection</label><input id="heritage-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Try algebra, Baghdad, Ibn Sina..." className="w-full rounded-lg border border-white/15 bg-[#1b2822] px-4 py-3 text-sm text-white outline-none transition focus:border-[#d8b976]" /></div>
        </div>
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map(c=><button key={c} onClick={()=>setCategory(c)} className={`shrink-0 rounded-full border px-4 py-2 text-xs transition ${category===c?"border-[#d8b976] bg-[#d8b976] text-[#17231e]":"border-white/15 bg-white/[.03] text-white/65 hover:border-[#d8b976]/60"}`}>{c}</button>)}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s,i)=><button key={s.name} onClick={()=>setSelected(s)} className="group flex h-full flex-col rounded-xl border border-[#d8b976]/15 bg-gradient-to-br from-[#20342a] to-[#18251f] p-6 text-left transition duration-300 hover:-translate-y-1 hover:border-[#d8b976]/55 focus:outline-none focus:ring-2 focus:ring-[#d8b976]">
            <div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-full border border-[#d8b976]/30 text-lg text-[#e0c17d]">✧</span><span className="text-[10px] tracking-widest text-white/35">{String(i+1).padStart(2,"0")}</span></div>
            <p className="mt-7 text-[10px] font-bold uppercase tracking-[.18em] text-[#d8b976]">{s.field}</p>
            <h3 className="mt-2 font-serif text-xl leading-snug text-[#f3eee3]">{s.name}</h3>
            <p className="mt-2 text-xs text-white/45">{s.dates} · {s.place}</p>
            <p className="mt-4 flex-1 text-sm leading-6 text-white/65">{s.summary}</p>
            <span className="mt-6 border-t border-white/10 pt-4 text-xs font-semibold text-[#dfbd78]">Explore profile <span aria-hidden="true">↗</span></span>
          </button>)}
        </div>
        {filtered.length===0 && <div className="rounded-xl border border-white/10 p-10 text-center text-sm text-white/55">No matching scholars found. Try a different search or field.</div>}
      </section>

      <section className="border-y border-[#d8b976]/10 bg-[#17251e]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-3">
          <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#d8b976]">Historical perspective</p><h2 className="mt-3 font-serif text-2xl">Science grew through exchange.</h2></div>
          <p className="text-sm leading-7 text-white/60 lg:col-span-2">Scientific work in Muslim societies drew on and transformed knowledge from Greek, Persian, Indian and other traditions. Scholars worked across languages, institutions and regions. This collection highlights their contributions without erasing earlier sources or collaborators.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#d8b976]">Research principles</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[["Evidence before legends","Separate well-supported findings from popular stories and claims that need more evidence."],["Context matters","Identify the scholar's time, place, language, patrons and intellectual influences."],["Sources stay visible","Use academic references and manuscript collections; do not invent quotations or citations."]].map(([title,desc])=><div key={title} className="rounded-xl border border-white/10 bg-white/[.025] p-5"><h3 className="font-serif text-lg text-[#ead29d]">{title}</h3><p className="mt-2 text-sm leading-6 text-white/55">{desc}</p></div>)}
        </div>
      </section>

      {selected && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="scholar-title" onClick={e=>{if(e.target===e.currentTarget)setSelected(null);}}>
        <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl border border-[#d8b976]/25 bg-[#17231e] p-6 shadow-2xl sm:rounded-2xl sm:p-8">
          <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#d8b976]">{selected.field} · {selected.era}</p><h2 id="scholar-title" className="mt-2 font-serif text-2xl sm:text-3xl">{selected.name}</h2><p className="mt-2 text-xs text-white/45">{selected.dates} · {selected.place}</p></div><button onClick={()=>setSelected(null)} aria-label="Close profile" className="rounded-lg border border-white/15 px-3 py-2 text-white/70 hover:border-[#d8b976]">✕</button></div>
          <p className="mt-6 text-sm leading-7 text-white/75">{selected.summary}</p>
          <h3 className="mt-7 font-serif text-xl text-[#ead29d]">Contributions</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-white/65">{selected.contributions.map(item=><li key={item}>{item}</li>)}</ul>
          <h3 className="mt-7 font-serif text-lg text-[#ead29d]">Major work / writings</h3><p className="mt-2 text-sm leading-6 text-white/65">{selected.works}</p>
          <div className="mt-6 rounded-lg border border-amber-300/20 bg-amber-300/[.06] p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-amber-200">Historical context & caution</p><p className="mt-2 text-sm leading-6 text-white/65">{selected.caution}</p></div>
          <h3 className="mt-7 font-serif text-lg text-[#ead29d]">Further reading & sources</h3><ul className="mt-3 space-y-3">{selected.source.map(src=><li key={src.url}><a href={src.url} target="_blank" rel="noreferrer" className="text-sm text-[#dfbd78] underline decoration-[#dfbd78]/40 underline-offset-4 hover:text-white">{src.label} ↗</a></li>)}</ul>
          <div className="mt-8 flex justify-end"><button onClick={()=>setSelected(null)} className="rounded-lg bg-[#d6b56f] px-5 py-2.5 text-sm font-bold text-[#17231e] hover:bg-[#ead29d]">Close profile</button></div>
        </div>
      </div>}
    </div>
  );
}
