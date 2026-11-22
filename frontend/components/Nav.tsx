"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" }, { href: "/chat", label: "AI Research Assistant" }, { href: "/quran", label: "Quran Explorer" },
  { href: "/research-studio", label: "Research Studio" }, { href: "/evidence-review", label: "Evidence Review Lab" }, { href: "/scientific-heritage", label: "Scientific Heritage" },
  { href: "/academy", label: "Learning Academy" }, { href: "/history-explorer", label: "History Explorer" },
  { href: "/knowledge-graph", label: "Knowledge Graph" }, { href: "/governance-lab", label: "Governance Lab" },
  { href: "/economics-lab", label: "Economics Lab" }, { href: "/prayer-calendar", label: "Prayer Times & Calendar" },
];
export default function Nav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const activeExplore = LINKS.some(link => link.href !== "/dashboard" && link.href !== "/chat" && pathname === link.href);
  useEffect(() => { setMobileOpen(false); setExploreOpen(false); }, [pathname]);
  useEffect(() => {
    if (!mobileOpen && !exploreOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") { setMobileOpen(false); setExploreOpen(false); } };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileOpen, exploreOpen]);
  const closeMenus = () => { setMobileOpen(false); setExploreOpen(false); };
  return <nav className="site-nav sticky top-0 z-40 backdrop-blur-xl border-b" aria-label="Main navigation">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
      <div className="ux-nav-row">
        <Link href="/" onClick={closeMenus} className="flex items-center gap-3 shrink-0 group" aria-label="KHILAFAH AI home">
          <span className="brand-symbol grid place-items-center w-10 h-10 rounded-full font-serif text-xl">خ</span>
          <span className="brand-wordmark text-sm tracking-[.12em] font-bold">KHILAFAH <span>AI</span></span>
        </Link>
        {user && <div className="ux-desktop-nav">
          <Link href="/dashboard" onClick={closeMenus} className={"nav-link " + (pathname === "/dashboard" ? "active" : "")}>Dashboard</Link>
          <Link href="/chat" onClick={closeMenus} className={"nav-link " + (pathname === "/chat" ? "active" : "")}>AI Research</Link>
          <div className="ux-nav-menu">
            <button type="button" className={"nav-link ux-nav-toggle " + (activeExplore ? "active" : "")} aria-expanded={exploreOpen} aria-controls="ux-explore-menu" onClick={() => setExploreOpen(open => !open)}>
              Explore <span aria-hidden="true" className={exploreOpen ? "ux-chevron is-open" : "ux-chevron"}>⌄</span>
            </button>
            {exploreOpen && <div id="ux-explore-menu" className="ux-nav-popover">{LINKS.filter(link => link.href !== "/dashboard" && link.href !== "/chat").map(link => <Link key={link.href} href={link.href} onClick={closeMenus} aria-current={pathname === link.href ? "page" : undefined}>{link.label}</Link>)}</div>}
          </div>
        </div>}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {user ? <>
            {user.role === "admin" && <Link href="/admin" onClick={closeMenus} className="nav-utility hidden sm:inline-flex">Admin</Link>}
            <Link href="/profile" onClick={closeMenus} className="nav-utility hidden md:inline-flex text-sm">{user.full_name}</Link>
            <button onClick={() => { closeMenus(); logout(); }} className="nav-utility text-sm px-3 rounded-lg border border-white/20 min-h-11">Sign out</button>
          </> : <>
            <Link href="/login" onClick={closeMenus} aria-label="Sign in to your account" className="nav-signin inline-flex items-center justify-center min-h-11 px-3 sm:px-4 rounded-lg text-sm font-semibold">Sign in</Link>
            <Link href="/register" onClick={closeMenus} aria-label="Create a free account" className="nav-cta inline-flex items-center justify-center min-h-11 px-3 sm:px-5 rounded-lg text-sm font-bold">Create account <span className="hidden sm:inline ml-1" aria-hidden="true">↗</span></Link>
          </>}
        </div>
      </div>
      {user && <div className="ux-mobile-menu">
        <button type="button" className="ux-mobile-menu-toggle" aria-expanded={mobileOpen} aria-controls="ux-mobile-links" onClick={() => setMobileOpen(open => !open)}>
          <span aria-hidden="true">{mobileOpen ? "✕" : "☰"}</span> {mobileOpen ? "Close menu" : "Menu"} <span className="ux-mobile-menu-hint">All sections</span>
        </button>
        {mobileOpen && <div id="ux-mobile-links" className="ux-mobile-links">{LINKS.map(link => <Link key={link.href} href={link.href} onClick={closeMenus} aria-current={pathname === link.href ? "page" : undefined} className={pathname === link.href ? "active" : ""}>{link.label}</Link>)}{user.role === "admin" && <Link href="/admin" onClick={closeMenus}>Admin</Link>}</div>}
      </div>}
    </div>
  </nav>;
}
