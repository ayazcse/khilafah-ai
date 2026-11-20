"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Loading } from "@/components/StateViews";

const TILES = [
  { href: "/chat", title: "AI Research Chat", desc: "Ask questions and get cited, uncertainty-aware answers." },
  { href: "/research-studio", title: "Research Studio", desc: "Upload and search your own document library." },
  { href: "/knowledge-graph", title: "Knowledge Graph", desc: "Explore entities and relationships." },
  { href: "/governance-lab", title: "Governance Lab", desc: "Historical administrative structures." },
  { href: "/economics-lab", title: "Economics Lab", desc: "Zakat calculator and economic concepts." },
  { href: "/academy", title: "Learning Academy", desc: "Structured lessons and quizzes." },
];

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading) return <Loading label="Loading your dashboard..." />;
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <p className="text-white/70 mb-4">Please sign in to view your dashboard.</p>
        <Link href="/login" className="btn-primary">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-serif font-semibold text-white mb-2">Welcome, {user.full_name}</h1>
      <p className="text-white/50 mb-10">Pick up where you left off, or explore a module below.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {TILES.map((t) => (
          <Link key={t.href} href={t.href} className="card hover:border-gold/40 transition-colors">
            <h3 className="text-gold font-medium mb-2">{t.title}</h3>
            <p className="text-white/60 text-sm">{t.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
