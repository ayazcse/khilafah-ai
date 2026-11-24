"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Loading } from "@/components/StateViews";

const TILES = [
  { href: "/chat", title: "AI Research Assistant", desc: "Explore complex questions with cited, evidence-aware answers.", icon: "✧", group: "Research" },
  { href: "/research-studio", title: "Research Studio", desc: "Upload, organize and search your personal document library.", icon: "⌕", group: "Research" },
  { href: "/knowledge-graph", title: "Knowledge Graph", desc: "Discover connections between people, places and ideas.", icon: "⌘", group: "Discover" },
  { href: "/governance-lab", title: "Governance Lab", desc: "Study historical institutions and administrative systems.", icon: "⚖", group: "Explore" },
  { href: "/economics-lab", title: "Islamic Economics", desc: "Explore economic concepts, wealth and Zakat tools.", icon: "◇", group: "Explore" },
  { href: "/academy", title: "Learning Academy", desc: "Build knowledge through structured lessons and quizzes.", icon: "▤", group: "Learn" },
];

export default function DashboardPage() {
  const { user, loading } = useAuth();
  if (loading) return <Loading label="Preparing your workspace..." />;
  if (!user) return <div className="k-dashboard-empty"><p>Please sign in to view your dashboard.</p><Link href="/login" className="btn-primary">Sign in</Link></div>;

  return <div className="k-dashboard">
    <section className="k-welcome">
      <div><p className="k-eyebrow"><span /> YOUR KNOWLEDGE SPACE</p><h1>Welcome back, <em>{user.full_name?.split(" ")[0]}</em></h1><p className="k-welcome-copy">A thoughtful space to learn, research and connect. Where would you like to begin?</p></div>
      <div className="k-welcome-ornament" aria-hidden="true">۞</div>
    </section>
    <section className="k-quick-row" aria-label="Quick links">
      <Link href="/community" className="k-quick-link"><span>◎</span><span><strong>Community</strong><small>Connect with people</small></span><b>↗</b></Link>
      <Link href="/inbox" className="k-quick-link"><span>✉</span><span><strong>Private Inbox</strong><small>Your conversations</small></span><b>↗</b></Link>
      <Link href="/quran" className="k-quick-link"><span>۞</span><span><strong>Quran Explorer</strong><small>Read and reflect</small></span><b>↗</b></Link>
    </section>
    <section className="k-modules-section"><div className="k-section-heading"><div><p className="k-eyebrow">DISCOVER KHALAF</p><h2>Explore your workspace</h2></div><span>06 MODULES</span></div>
      <div className="k-module-grid">{TILES.map((tile, index) => <Link key={tile.href} href={tile.href} className="k-module-card" style={{ animationDelay: `${index * 65}ms` }}>
        <div className="k-module-top"><span className="k-module-icon">{tile.icon}</span><span className="k-module-group">{tile.group}</span></div>
        <h3>{tile.title}</h3><p>{tile.desc}</p><div className="k-module-footer"><span>Open module</span><b>↗</b></div>
      </Link>)}</div>
    </section>
    <p className="k-dashboard-footnote">Built for curiosity, grounded in knowledge.</p>
  </div>;
}
