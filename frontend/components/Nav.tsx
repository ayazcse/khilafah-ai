"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/chat", label: "AI Research" },
  { href: "/research-studio", label: "Research Studio" },
  { href: "/knowledge-graph", label: "Knowledge Graph" },
  { href: "/history-explorer", label: "History" },
  { href: "/governance-lab", label: "Governance" },
  { href: "/economics-lab", label: "Economics" },
  { href: "/academy", label: "Academy" },
];

export default function Nav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-40 bg-[#111816]/95 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between min-h-[68px] gap-5">
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <span className="grid place-items-center w-9 h-9 rounded-full border border-[#d6b56f]/60 text-[#d6b56f] font-serif text-xl group-hover:bg-[#d6b56f]/10 transition-colors">خ</span>
            <span className="text-[#f1eadb] text-[13px] tracking-[.16em] font-semibold">KHILAFAH <span className="text-[#d6b56f]">AI</span></span>
          </Link>

          {user && (
            <div className="hidden xl:flex items-center gap-1 overflow-x-auto">
              {LINKS.map((link) => (
                <Link key={link.href} href={link.href} className={`px-2.5 py-2 text-[11px] rounded-md whitespace-nowrap transition-colors ${pathname === link.href ? "bg-emerald-900/50 text-[#e1c27f]" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
                  {link.label}
                </Link>
              ))}
              {user.role === "admin" && <Link href="/admin" className={`px-2.5 py-2 text-[11px] rounded-md whitespace-nowrap ${pathname === "/admin" ? "bg-[#d6b56f]/15 text-[#e1c27f]" : "text-[#d6b56f]/80 hover:text-[#e1c27f]"}`}>Admin</Link>}
            </div>
          )}

          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <>
                <Link href="/profile" className="hidden sm:block text-xs text-white/65 hover:text-white">{user.full_name}</Link>
                <button onClick={logout} className="text-xs text-white/45 hover:text-[#e1c27f] transition-colors">Sign out</button>
              </>
            ) : (
              <>
                <Link href="/pricing" className="text-xs text-white/65 hover:text-white">Plans</Link>
                <Link href="/login" className="text-xs text-white/65 hover:text-white">Sign in</Link>
                <Link href="/register" className="rounded-sm bg-[#d6b56f] hover:bg-[#e5c987] text-[#172019] text-xs font-semibold px-4 py-2.5 transition-colors">Get started ↗</Link>
              </>
            )}
          </div>
        </div>
        {user && (
          <div className="xl:hidden flex gap-1 overflow-x-auto pb-2 -mx-1 px-1">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={`px-3 py-1.5 text-[11px] rounded-full whitespace-nowrap border ${pathname === link.href ? "border-[#d6b56f]/50 bg-[#d6b56f]/10 text-[#e1c27f]" : "border-white/10 text-white/55"}`}>{link.label}</Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
