import Link from "next/link";

const CORE = [
  { icon: "✧", title: "AI Research Assistant", desc: "Ask questions and explore Islamic history with clear, source-aware answers.", href: "/chat", label: "Start asking" },
  { icon: "⌕", title: "Research Studio", desc: "Work with your own PDFs and documents in one research space.", href: "/research-studio", label: "Open studio" },
  { icon: "✦", title: "Scientific Heritage", desc: "Discover scholars, ideas and scientific traditions across history.", href: "/scientific-heritage", label: "Discover science" },
  { icon: "▤", title: "Learning Academy", desc: "Learn through structured topics, lessons and quizzes.", href: "/academy", label: "Start learning" },
];
const GROUPS = [
  { title: "History & discovery", description: "Explore people, places, events and connections.", links: [{ label: "History Explorer", href: "/history-explorer" }, { label: "Civilization Knowledge Graph", href: "/knowledge-graph" }, { label: "Scientific Heritage", href: "/scientific-heritage" }] },
  { title: "Society & economy", description: "Study institutions, governance and economic ideas.", links: [{ label: "Governance Research Lab", href: "/governance-lab" }, { label: "Islamic Economics Lab", href: "/economics-lab" }] },
  { title: "Everyday tools", description: "Useful dates and daily prayer information.", links: [{ label: "Prayer Times & Hijri Calendar", href: "/prayer-calendar" }] },
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
    <section className="ux-section max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
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
      <div className="section-kicker">ALL FEATURES</div><h2 className="ux-directory-title">Explore by topic</h2>
      <p className="ux-directory-copy">The rest of the platform is organised into three simple groups.</p>
      <div className="ux-groups">{GROUPS.map(group => <details className="ux-group" key={group.title}>
        <summary><span><strong>{group.title}</strong><small>{group.description}</small></span><span className="ux-group-plus" aria-hidden="true">+</span></summary>
        <div className="ux-group-links">{group.links.map(link => <Link href={link.href} key={link.href}>{link.label}<span aria-hidden="true">↗</span></Link>)}</div>
      </details>)}</div>
    </section>
    <section className="ux-values"><div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
      <div className="section-kicker">OUR PROMISE</div><h2 className="section-title font-serif">Knowledge for <em>everyone.</em></h2>
      <div className="ux-value-grid">
        <div><strong>Easy to follow</strong><p>Clear language, helpful structure and readable text.</p></div>
        <div><strong>Respect for evidence</strong><p>Sources, historical context and uncertainty matter.</p></div>
        <div><strong>Made to explore</strong><p>For curious learners of every age and experience level.</p></div>
      </div>
    </div></section>
    <footer className="ux-footer max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
      <div className="footer-brand"><span className="brand-mark">خ</span><span>KHILAFAH <b>AI</b></span></div>
      <p>Preserving knowledge. Understanding civilization. Engineering the future.</p>
      <span className="footer-copy">© {new Date().getFullYear()} KHILAFAH AI</span>
    </footer>
  </div>;
}
