"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
const LINKS = [
  { href: "/dashboard", label: "Dashboard" }, { href: "/chat", label: "AI Research Assistant" },
  { href: "/research-studio", label: "Research Studio" }, { href: "/scientific-heritage", label: "Scientific Heritage" },
  { href: "/academy", label: "Learning Academy" }, { href: "/history-explorer", label: "History Explorer" },
  { href: "/knowledge-graph", label: "Knowledge Graph" }, { href: "/governance-lab", label: "Governance Lab" },
  { href: "/economics-lab", label: "Economics Lab" }, { href: "/prayer-calendar", label: "Prayer Times & Calendar" },
];
export default function Nav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const activeExplore = LINKS.some(link => link.href !== "/dashboard" && link.href !== "/chat" && pathname === link.href);
  return <nav className="site-nav sticky top-0 z-40 backdrop-blur-xl border-b" aria-label="Main navigation">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
      <div className="ux-nav-row">
        <Link href="/" className="flex items-center gap-3 shrink-0 group" aria-label="KHILAFAH AI home">
          <span className="brand-symbol grid place-items-center w-10 h-10 rounded-full font-serif text-xl">خ</span>
          <span className="brand-wordmark text-sm tracking-[.12em] font-bold">KHILAFAH <span>AI</span></span>
        </Link>
        {user && <div className="ux-desktop-nav">
          <Link href="/dashboard" className={"nav-link " + (pathname === "/dashboard" ? "active" : "")}>Dashboard</Link>
          <Link href="/chat" className={"nav-link " + (pathname === "/chat" ? "active" : "")}>AI Research</Link>
          <details className="ux-nav-menu">
            <summary className={"nav-link " + (activeExplore ? "active" : "")}>Explore <span aria-hidden="true">⌄</span></summary>
            <div className="ux-nav-popover">{LINKS.filter(link => link.href !== "/dashboard" && link.href !== "/chat").map(link => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined}>{link.label}</Link>)}</div>
          </details>
        </div>}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {user ? <>
            {user.role === "admin" && <Link href="/admin" className="nav-utility hidden sm:inline-flex">Admin</Link>}
            <Link href="/profile" className="nav-utility hidden md:inline-flex text-sm">{user.full_name}</Link>
            <button onClick={logout} className="nav-utility text-sm px-3 rounded-lg border border-white/20 min-h-11">Sign out</button>
          </> : <>
            <Link href="/login" aria-label="Sign in to your account" className="nav-signin inline-flex items-center justify-center min-h-11 px-3 sm:px-4 rounded-lg text-sm font-semibold">Sign in</Link>
            <Link href="/register" aria-label="Create a free account" className="nav-cta inline-flex items-center justify-center min-h-11 px-3 sm:px-5 rounded-lg text-sm font-bold">Create account <span className="hidden sm:inline ml-1" aria-hidden="true">↗</span></Link>
          </>}
        </div>
      </div>
      {user && <details className="ux-mobile-menu">
        <summary><span aria-hidden="true">☰</span> Menu <span className="ux-mobile-menu-hint">All sections</span></summary>
        <div className="ux-mobile-links">{LINKS.map(link => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined} className={pathname === link.href ? "active" : ""}>{link.label}</Link>)}{user.role === "admin" && <Link href="/admin">Admin</Link>}</div>
      </details>}
    </div>
  </nav>;
}
