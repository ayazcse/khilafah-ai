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
  { href: "/prayer-calendar", label: "Prayer & Calendar" },
];

export default function Nav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  return (
    <nav className="site-nav sticky top-0 z-40 backdrop-blur-xl border-b" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between min-h-[76px] gap-3">
          <Link href="/" className="flex items-center gap-3 shrink-0 group" aria-label="KHILAFAH AI home">
            <span className="brand-symbol grid place-items-center w-10 h-10 rounded-full font-serif text-xl">خ</span>
            <span className="brand-wordmark text-sm tracking-[.12em] font-bold">KHILAFAH <span>AI</span></span>
          </Link>
          {user && <div className="hidden xl:flex items-center gap-1 overflow-x-auto">
            {LINKS.map(link => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined} className={`nav-link px-3 py-2 text-[13px] rounded-lg whitespace-nowrap transition-colors ${pathname === link.href ? "active" : ""}`}>{link.label}</Link>)}
            {user.role === "admin" && <Link href="/admin" className={`nav-link px-3 py-2 text-[13px] rounded-lg whitespace-nowrap ${pathname === "/admin" ? "active" : ""}`}>Admin</Link>}
          </div>}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {user ? <>
              <Link href="/profile" className="nav-utility hidden sm:flex text-sm">{user.full_name}</Link>
              <button onClick={logout} className="nav-utility text-sm px-3 rounded-lg border border-white/20">Sign out</button>
            </> : <>
              <Link href="/login" aria-label="Sign in to your account" className="nav-signin inline-flex items-center justify-center min-h-11 px-3 sm:px-4 rounded-lg text-sm font-semibold">Sign in</Link>
              <Link href="/register" aria-label="Create a free account" className="nav-cta inline-flex items-center justify-center min-h-11 px-3 sm:px-5 rounded-lg text-sm font-bold">Create free account <span className="hidden sm:inline ml-1" aria-hidden="true">↗</span></Link>
            </>}
          </div>
        </div>
        {user && <div className="xl:hidden flex gap-1.5 overflow-x-auto pb-3 -mx-1 px-1 mobile-nav-links">
          {LINKS.map(link => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined} className={`nav-link px-3 py-2 text-[13px] rounded-full whitespace-nowrap border ${pathname === link.href ? "active" : ""}`}>{link.label}</Link>)}
          {user.role === "admin" && <Link href="/admin" className="nav-link px-3 py-2 text-[13px] rounded-full whitespace-nowrap border">Admin</Link>}
        </div>}
      </div>
    </nav>
  );
}
