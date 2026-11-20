import Link from "next/link";

const FEATURES = [
  { title: "Islamic History AI", desc: "Ask research questions in English, Hindi, or Arabic with cited, uncertainty-aware answers." },
  { title: "Research Studio", desc: "Upload PDFs and text sources; search and ask questions grounded in your own library." },
  { title: "Civilization Knowledge Graph", desc: "Explore caliphs, scholars, dynasties, and institutions as an interactive graph." },
  { title: "Governance Research Lab", desc: "Compare historical administrative structures with clear evidence labeling." },
  { title: "Islamic Economics Lab", desc: "Zakat calculator, waqf research, and illustrative public-finance simulations." },
  { title: "Learning Academy", desc: "Structured lessons and source-grounded quizzes on civilization and economics." },
];

export default function LandingPage() {
  return (
    <div>
      <section className="relative overflow-hidden bg-geo-pattern" style={{ backgroundSize: "24px 24px" }}>
        <div className="max-w-5xl mx-auto px-6 py-28 text-center">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-6">
            KHILAFAH <span className="text-gold">AI</span>
          </h1>
          <p className="text-xl text-emerald-300 mb-4">
            Preserving Knowledge. Understanding Civilization. Engineering the Future.
          </p>
          <p className="text-white/60 max-w-2xl mx-auto mb-10">
            An educational, research-focused AI platform for exploring Islamic civilization history,
            governance, and economics — with citations, uncertainty labeling, and a clear line between
            established fact and interpretation.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register" className="btn-primary">Get started</Link>
            <Link href="/pricing" className="btn-secondary">View plans</Link>
          </div>
          <p className="text-white/30 text-xs mt-8 max-w-xl mx-auto">
            Educational and historical research platform only. Does not promote violence, extremism, or
            unlawful political activity. Never fabricates references, verses, hadith, or citations.
          </p>
        </div>
        <div className="geo-divider" />
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-serif font-semibold text-white text-center mb-12">Platform Modules</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="card">
              <h3 className="text-gold font-medium mb-2">{f.title}</h3>
              <p className="text-white/60 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-serif font-semibold text-white mb-4">Who it&apos;s for</h2>
        <p className="text-white/60 mb-6">
          Students, researchers, and curious learners exploring Islamic civilization, historical
          governance, and economic concepts — with rigor about what is established fact, what is
          disputed, and what is interpretation or simulation.
        </p>
        <Link href="/register" className="btn-primary">Create your account</Link>
      </section>
    </div>
  );
}
