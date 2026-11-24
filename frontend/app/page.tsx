import Link from "next/link";

const CORE = [
  { icon: "✧", title: "AI Research Assistant", desc: "Ask questions and explore Islamic history with clear, source-aware answers.", href: "/chat", label: "Start asking" },
  { icon: "◎", title: "KHALAF Connect", desc: "Meet curious learners, share ideas and join respectful topic-based discussions.", href: "/community", label: "Join community" },
  { icon: "۞", title: "Quran Explorer", desc: "Read Quran ayah by ayah with Arabic text and Roman Urdu and Urdu translations.", href: "/quran", label: "Read Quran" },
  { icon: "⌕", title: "Research Studio", desc: "Work with your own PDFs and documents in one research space.", href: "/research-studio", label: "Open studio" },
  { icon: "✦", title: "Scientific Heritage", desc: "Discover scholars, ideas and scientific traditions across history.", href: "/scientific-heritage", label: "Discover science" },
  { icon: "▤", title: "Learning Academy", desc: "Learn through structured topics, lessons and quizzes.", href: "/academy", label: "Start learning" },
];
const GROUPS = [
  { title: "History & discovery", description: "Explore people, places, events and connections.", links: [{ label: "History Explorer", href: "/history-explorer" }, { label: "Civilization Knowledge Graph", href: "/knowledge-graph" }, { label: "Scientific Heritage", href: "/scientific-heritage" }] },
  { title: "Society & economy", description: "Study institutions, governance and economic ideas.", links: [{ label: "Governance Research Lab", href: "/governance-lab" }, { label: "Islamic Economics Lab", href: "/economics-lab" }] },
  { title: "Everyday tools", description: "Useful dates and daily prayer information.", links: [{ label: "Prayer Times & Hijri Calendar", href: "/prayer-calendar" }, { label: "Quran Explorer", href: "/quran" }] },
];
export default function LandingPage() {
  return <div className="landing-shell">
    <section className="hero ux-hero relative overflow-hidden">
      <div className="hero-image" /><div className="hero-shade" /><div className="hero-ornament hero-ornament-one" aria-hidden="true" /><div className="hero-ornament hero-ornament-two" aria-hidden="true" /><div className="hero-bottom-rule" aria-hidden="true" /><div className="hero-caption" aria-hidden="true"><span>ISLAMIC CIVILIZATION</span><span>KNOWLEDGE · DISCOVERY · LEGACY</span></div>
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-20 md:py-24">
        <div className="max-w-3xl">
          <div className="eyebrow mb-5"><span className="eyebrow-line" /> KNOWLEDGE · HISTORY · DISCOVERY</div>
          <h1 className="hero-title font-serif">Explore knowledge.<br /><span>Understand civilization.</span></h1>
          <p className="hero-copy mt-6 max-w-2xl">A welcoming place to learn about Islamic civilization, explore research and discover the people and ideas that shaped our world.</p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/chat" className="hero-cta">Ask the AI assistant <span aria-hidden="true">↗</span></Link>
            <Link href="/academy" className="hero-cta-secondary">Explore learning <span aria-hidden="true">→</span></Link>
          </div>
          <p className="hero-note mt-8"><span className="hero-note-dot" /> CLEAR ANSWERS · TRUSTED SOURCES · LEARNING FOR EVERY AGE</p>
        </div>
      </div>
    </section>
    <section id="platform" className="ux-section max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
      <div className="ux-section-heading">
        <div><div className="section-kicker">GET STARTED</div><h2 className="section-title font-serif">What would you like to <em>explore?</em></h2></div>
        <p className="section-intro">Start with one of the main spaces. You can find all other tools below.</p>
      </div>
      <div className="ux-core-grid">{CORE.map(item => <Link href={item.href} key={item.href} className="ux-core-card group">
        <span className="ux-core-icon" aria-hidden="true">{item.icon}</span><h3>{item.title}</h3><p>{item.desc}</p>
        <span className="ux-core-link">{item.label} <span aria-hidden="true">→</span></span>
      </Link>)}</div>
    </section>
    <section className="ux-directory max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
      <div className="section-kicker">MORE TO EXPLORE</div>
      <h2 className="ux-directory-title">Explore every part of the platform</h2>
      <p className="ux-directory-copy">Features are arranged by what you may want to do next. Every section is visible — no hidden menus or extra scrolling to discover a tool.</p>
      <div className="ux-topic-grid">
        <div className="ux-topic-panel">
          <div className="ux-topic-heading"><span className="ux-topic-index">01</span><div><h3>History & discovery</h3><p>Explore scholars, timelines and connections.</p></div></div>
          <div className="ux-topic-links">
            <Link href="/history-explorer"><span>History Explorer</span><span aria-hidden="true">↗</span></Link>
            <Link href="/evidence-review"><span>Evidence Review Lab</span><span aria-hidden="true">↗</span></Link>
            <Link href="/knowledge-graph"><span>Civilization Knowledge Graph</span><span aria-hidden="true">↗</span></Link>
          </div>
        </div>
        <div className="ux-topic-panel">
          <div className="ux-topic-heading"><span className="ux-topic-index">02</span><div><h3>Society & economy</h3><p>Study institutions, governance and ideas.</p></div></div>
          <div className="ux-topic-links">
            <Link href="/governance-lab"><span>Governance Research Lab</span><span aria-hidden="true">↗</span></Link>
            <Link href="/economics-lab"><span>Islamic Economics Lab</span><span aria-hidden="true">↗</span></Link>
          </div>
        </div>
        <div className="ux-topic-panel">
          <div className="ux-topic-heading"><span className="ux-topic-index">03</span><div><h3>Everyday tools</h3><p>Useful information for daily life.</p></div></div>
          <div className="ux-topic-links">
            <Link href="/prayer-calendar"><span>Prayer Times & Hijri Calendar</span><span aria-hidden="true">↗</span></Link>
            <Link href="/quran"><span>Quran Explorer</span><span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </div>
    </section>
    <section id="principles" className="ux-values"><div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
      <div className="section-kicker">OUR PROMISE</div><h2 className="section-title font-serif">Knowledge for <em>everyone.</em></h2>
      <div className="ux-value-grid">
        <div><strong>Easy to follow</strong><p>Clear language, helpful structure and readable text.</p></div>
        <div><strong>Respect for evidence</strong><p>Sources, historical context and uncertainty matter.</p></div>
        <div><strong>Made to explore</strong><p>For curious learners of every age and experience level.</p></div>
      </div>
    </div></section>
    <footer className="ux-footer" aria-label="Site footer">
      <div className="ux-footer-main">
        <div className="ux-footer-brand">
          <Link href="/" className="footer-brand"><span className="brand-mark">خ</span><span>KHALAF</span></Link>
          <p className="ux-footer-manifesto">Preserving knowledge. Understanding civilization. Engineering the future.</p>
          <p className="ux-footer-note">A welcoming space for thoughtful learning, careful research and meaningful connection.</p>
          <Link href="/register" className="ux-footer-cta">Join KHALAF <span aria-hidden="true">↗</span></Link>
        </div>
        <nav className="ux-footer-column" aria-label="Platform links">
          <h3>Platform</h3>
          <Link href="/chat">AI Research Assistant</Link>
          <Link href="/research-studio">Research Studio</Link>
          <Link href="/community">KHALAF Connect</Link>
          <Link href="/inbox">Private Inbox</Link>
        </nav>
        <nav className="ux-footer-column" aria-label="Knowledge links">
          <h3>Knowledge</h3>
          <Link href="/quran">Quran Explorer</Link>
          <Link href="/academy">Learning Academy</Link>
          <Link href="/history-explorer">History Explorer</Link>
          <Link href="/scientific-heritage">Scientific Heritage</Link>
        </nav>
        <nav className="ux-footer-column" aria-label="Research links">
          <h3>Research</h3>
          <Link href="/evidence-review">Evidence Review Lab</Link>
          <Link href="/knowledge-graph">Knowledge Graph</Link>
          <Link href="/governance-lab">Governance Lab</Link>
          <Link href="/economics-lab">Islamic Economics Lab</Link>
          <Link href="/prayer-calendar">Prayer & Calendar</Link>
        </nav>
      </div>
      <div className="ux-footer-bottom">
        <span>© {new Date().getFullYear()} KHALAF. Built for curious minds.</span>
        <span className="ux-footer-bottom-links"><Link href="/">Home</Link><Link href="/login">Sign in</Link><Link href="/register">Create account</Link></span>
        <span className="ux-footer-arabic" lang="ar" dir="rtl">خَلَف · معرفة · حضارة</span>
      </div>
    </footer>
  </div>;
}
