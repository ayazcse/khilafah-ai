import Link from "next/link";

const FEATURES = [
  { number: "01", icon: "✧", title: "Islamic History AI", desc: "Explore centuries of scholarship, dynasties, people, and pivotal events with careful, source-aware answers.", href: "/chat", tag: "AI RESEARCH" },
  { number: "02", icon: "⌕", title: "Research Studio", desc: "Bring your own PDFs and documents. Ask questions grounded in your personal research library.", href: "/research-studio", tag: "YOUR SOURCES" },
  { number: "03", icon: "◈", title: "Civilization Knowledge Graph", desc: "Trace connections between scholars, institutions, dynasties, places, and ideas.", href: "/knowledge-graph", tag: "DISCOVER" },
  { number: "04", icon: "⌘", title: "Governance Research Lab", desc: "Study historical institutions and administrative systems with transparent assumptions.", href: "/governance-lab", tag: "ANALYSE" },
  { number: "05", icon: "◎", title: "Islamic Economics Lab", desc: "Explore zakat, waqf, and public-finance concepts through clear, illustrative tools.", href: "/economics-lab", tag: "ECONOMICS" },
  { number: "06", icon: "✦", title: "Learning Academy", desc: "Build knowledge through structured learning paths, lessons, and source-grounded quizzes.", href: "/academy", tag: "LEARN" },
  { number: "07", icon: "☾", title: "Prayer & Hijri Calendar", desc: "Check daily prayer times, next-prayer countdown, Hijri dates, and important Islamic occasions.", href: "/prayer-calendar", tag: "DAILY COMPANION" },
  { number: "08", icon: "✧", title: "Muslim Scientific Heritage", desc: "Explore scholars, discoveries, instruments, institutions, and the scientific traditions of Muslim societies.", href: "/scientific-heritage", tag: "SCIENCE & DISCOVERY" },
];

const PILLARS = [
  { value: "01", title: "Evidence first", desc: "Sources and citations matter." },
  { value: "02", title: "Intellectual honesty", desc: "Fact, debate, and interpretation stay distinct." },
  { value: "03", title: "Knowledge for all", desc: "A thoughtful space to learn and explore." },
];

export default function LandingPage() {
  return (
    <div className="landing-shell">
      <section className="hero relative overflow-hidden">
        <div className="hero-image" />
        <div className="hero-shade" />
        <div className="hero-ornament hero-ornament-one" />
        <div className="hero-ornament hero-ornament-two" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 pt-24 pb-24 md:pt-32 md:pb-32">
          <div className="max-w-3xl">
            <div className="eyebrow mb-7"><span className="eyebrow-line" /> A NEW WAY TO EXPLORE CIVILIZATION</div>
            <h1 className="hero-title font-serif">
              Knowledge is a <span>civilizational</span> legacy.
            </h1>
            <p className="hero-copy mt-7 max-w-2xl">
              Discover the people, ideas, institutions, and intellectual traditions that shaped Islamic civilization — with AI built for thoughtful research.
            </p>
            <div className="flex flex-wrap gap-3 mt-10">
              <Link href="/register" className="hero-cta">Begin exploring <span aria-hidden="true">↗</span></Link>
              <Link href="/chat" className="hero-cta-secondary">Explore AI research <span aria-hidden="true">→</span></Link>
            </div>
            <div className="hero-note mt-12"><span className="hero-note-dot" /> RESEARCH WITH SOURCES · CONTEXT · CLARITY</div>
          </div>
        </div>
        <div className="hero-bottom-rule" />
        <div className="hero-caption"><span>01 / 06</span><span>THE PURSUIT OF KNOWLEDGE</span></div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20 md:py-28">
        <div className="section-kicker">THE PLATFORM</div>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-12">
          <h2 className="section-title font-serif">Explore a world of <em>knowledge.</em></h2>
          <p className="section-intro max-w-md">A connected research environment for history, governance, economics, and lifelong learning.</p>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {FEATURES.map((feature) => (
            <Link href={feature.href} key={feature.title} className="feature-card group">
              <div className="flex items-start justify-between">
                <span className="feature-icon">{feature.icon}</span>
                <span className="feature-number">{feature.number}</span>
              </div>
              <div className="feature-tag mt-8">{feature.tag}</div>
              <h3 className="feature-title font-serif mt-2">{feature.title}</h3>
              <p className="feature-desc mt-3">{feature.desc}</p>
              <div className="feature-link mt-7">Explore module <span className="group-hover:translate-x-1 transition-transform">→</span></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="principles-section">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 md:py-24">
          <div className="section-kicker">OUR APPROACH</div>
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-20">
            <div>
              <h2 className="section-title font-serif">Curiosity deserves <em>integrity.</em></h2>
              <p className="section-intro mt-5">The past is complex. Our tools are designed to help you investigate it carefully, distinguish evidence from interpretation, and keep asking better questions.</p>
            </div>
            <div className="space-y-0">
              {PILLARS.map((p) => (
                <div key={p.value} className="principle-row">
                  <span className="principle-number">{p.value}</span>
                  <div><h3 className="principle-title font-serif">{p.title}</h3><p className="principle-desc">{p.desc}</p></div>
                  <span className="principle-arrow">↗</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20 md:py-28">
        <div className="closing-panel">
          <div className="closing-pattern" />
          <div className="relative z-10 max-w-2xl">
            <div className="section-kicker">START YOUR JOURNEY</div>
            <h2 className="closing-title font-serif mt-4">Every question opens a door.</h2>
            <p className="closing-copy mt-4">Enter a space built for discovery, reflection, and a deeper understanding of our shared intellectual heritage.</p>
            <Link href="/register" className="hero-cta mt-8 inline-flex">Create your account <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
        <footer className="site-footer">
          <div className="footer-brand"><span className="brand-mark">خ</span><span>KHILAFAH <b>AI</b></span></div>
          <p>Preserving knowledge. Understanding civilization. Engineering the future.</p>
          <span className="footer-copy">© {new Date().getFullYear()} KHILAFAH AI</span>
        </footer>
      </section>
    </div>
  );
}
