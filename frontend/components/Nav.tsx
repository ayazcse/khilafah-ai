"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";

const GROUPS = [
  { title: "Workspace", items: [
    { href: "/dashboard", label: "Dashboard", icon: "⌂" },
    { href: "/chat", label: "AI Research", icon: "✧" },
    { href: "/research-studio", label: "Research Studio", icon: "⌕" },
    { href: "/evidence-review", label: "Evidence Review", icon: "◈" },
  ]},
  { title: "Community", items: [
    { href: "/community", label: "KHALAF Connect", icon: "◎" },
    { href: "/inbox", label: "Private Inbox", icon: "✉" },
  ]},
  { title: "Knowledge", items: [
    { href: "/quran", label: "Quran Explorer", icon: "۞" },
    { href: "/academy", label: "Learning Academy", icon: "▤" },
    { href: "/scientific-heritage", label: "Scientific Heritage", icon: "✥" },
    { href: "/history-explorer", label: "History Explorer", icon: "◷" },
    { href: "/knowledge-graph", label: "Knowledge Graph", icon: "⌘" },
  ]},
  { title: "Research Labs", items: [
    { href: "/governance-lab", label: "Governance Lab", icon: "⚖" },
    { href: "/economics-lab", label: "Economics Lab", icon: "◇" },
    { href: "/prayer-calendar", label: "Prayer & Calendar", icon: "☾" },
  ]},
];

const PUBLIC_EXPLORE = [
  { href: "/chat", label: "AI Research Assistant" },
  { href: "/community", label: "KHALAF Connect" },
  { href: "/quran", label: "Quran Explorer" },
  { href: "/research-studio", label: "Research Studio" },
  { href: "/academy", label: "Learning Academy" },
  { href: "/knowledge-graph", label: "Knowledge Graph" },
];

export default function Nav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [publicMobileOpen, setPublicMobileOpen] = useState(false);
  const [publicExploreOpen, setPublicExploreOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const publicNavRef = useRef<HTMLElement>(null);
  const activeExplore = GROUPS.slice(1).some(group => group.items.some(item => item.href === pathname));

  useEffect(() => {
    setMobileOpen(false);
    setExploreOpen(false);
    setPublicMobileOpen(false);
    setPublicExploreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!exploreOpen && !mobileOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setExploreOpen(false);
        if (window.matchMedia("(max-width: 900px)").matches) setMobileOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setExploreOpen(false); setMobileOpen(false); }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [exploreOpen, mobileOpen]);

  useEffect(() => {
    if (!publicMobileOpen && !publicExploreOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (publicNavRef.current && !publicNavRef.current.contains(event.target as Node)) {
        setPublicMobileOpen(false);
        setPublicExploreOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPublicMobileOpen(false);
        setPublicExploreOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [publicMobileOpen, publicExploreOpen]);

  const closeMenus = () => { setMobileOpen(false); setExploreOpen(false); };
  const closePublicMenus = () => { setPublicMobileOpen(false); setPublicExploreOpen(false); };
  const brand = <Link href={user ? "/dashboard" : "/"} onClick={user ? closeMenus : closePublicMenus} className="k-brand" aria-label="KHALAF home">
    <span className="k-brand-mark">خَلَف</span><span className="k-brand-name">KHALAF</span>
  </Link>;

  if (!user) return <header ref={publicNavRef} className="site-nav k-public-header">
    <div className="k-public-inner">
      {brand}
      <nav className="k-public-links" aria-label="Main navigation">
        <Link href="/" onClick={closePublicMenus} className={pathname === "/" ? "is-current" : ""}>Home</Link>
        <a href="/#platform" onClick={closePublicMenus}>Platform</a>
        <div className="k-public-explore">
          <button type="button" onClick={() => setPublicExploreOpen(value => !value)} aria-expanded={publicExploreOpen} aria-controls="k-public-explore-menu">Explore <span className={publicExploreOpen ? "is-rotated" : ""}>⌄</span></button>
          {publicExploreOpen && <div id="k-public-explore-menu" className="k-public-explore-menu">
            <p>DISCOVER KHALAF</p>
            {PUBLIC_EXPLORE.map(item => <Link key={item.href} href={item.href} onClick={closePublicMenus}>{item.label}<span>↗</span></Link>)}
          </div>}
        </div>
        <a href="/#principles" onClick={closePublicMenus}>Our principles</a>
      </nav>
      <div className="k-public-actions"><Link href="/login" onClick={closePublicMenus} className="nav-signin">Sign in</Link><Link href="/register" onClick={closePublicMenus} className="nav-cta">Get started <span aria-hidden="true">↗</span></Link></div>
      <button type="button" className="k-public-menu-button" onClick={() => setPublicMobileOpen(value => !value)} aria-label={publicMobileOpen ? "Close navigation" : "Open navigation"} aria-expanded={publicMobileOpen}>{publicMobileOpen ? "×" : "☰"}</button>
    </div>
    {publicMobileOpen && <div className="k-public-mobile-menu">
      <Link href="/" onClick={closePublicMenus}>Home</Link>
      <a href="/#platform" onClick={closePublicMenus}>Platform</a>
      <button type="button" onClick={() => setPublicExploreOpen(value => !value)} aria-expanded={publicExploreOpen}>Explore <span>{publicExploreOpen ? "−" : "+"}</span></button>
      {publicExploreOpen && <div className="k-public-mobile-submenu">{PUBLIC_EXPLORE.map(item => <Link key={item.href} href={item.href} onClick={closePublicMenus}>{item.label}</Link>)}</div>}
      <a href="/#principles" onClick={closePublicMenus}>Our principles</a>
      <div className="k-public-mobile-actions"><Link href="/login" onClick={closePublicMenus}>Sign in</Link><Link href="/register" onClick={closePublicMenus} className="nav-cta">Create account ↗</Link></div>
    </div>}
  </header>;

  return <>
    <div className={mobileOpen ? "k-sidebar-backdrop is-visible" : "k-sidebar-backdrop"} onClick={closeMenus} aria-hidden="true" />
    <aside ref={sidebarRef} className={mobileOpen ? "k-sidebar is-open" : "k-sidebar"} aria-label="Main sidebar">
      <div className="k-sidebar-brand">{brand}<button type="button" className="k-sidebar-close" onClick={closeMenus} aria-label="Close sidebar">×</button></div>
      <div className="k-sidebar-scroll">
        {GROUPS.map((group, index) => <section className="k-nav-group" key={group.title}>
          <p className="k-nav-heading">{group.title}</p>
          {group.items.map(item => <Link key={item.href} href={item.href} onClick={closeMenus} className={pathname === item.href ? "k-side-link is-active" : "k-side-link"} aria-current={pathname === item.href ? "page" : undefined}>
            <span className="k-side-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span>
          </Link>)}
          {index === 0 && <div className="k-explore-wrap">
            <button type="button" className={activeExplore ? "k-side-link k-explore-trigger is-active" : "k-side-link k-explore-trigger"} aria-expanded={exploreOpen} aria-controls="k-explore-submenu" onClick={() => setExploreOpen(value => !value)}>
              <span className="k-side-icon" aria-hidden="true">✧</span><span>Explore all</span><span className={exploreOpen ? "k-side-chevron is-open" : "k-side-chevron"}>⌄</span>
            </button>
            {exploreOpen && <div id="k-explore-submenu" className="k-explore-submenu">
              {GROUPS.slice(1).flatMap(g => g.items).map(item => <Link key={item.href} href={item.href} onClick={closeMenus} className={pathname === item.href ? "k-sub-link is-active" : "k-sub-link"}>{item.label}</Link>)}
            </div>}
          </div>}
        </section>)}
      </div>
      <div className="k-sidebar-bottom">
        {user.role === "admin" && <Link href="/admin" onClick={closeMenus} className="k-side-link"><span className="k-side-icon">⚙</span>Admin panel</Link>}
        <Link href="/profile" onClick={closeMenus} className="k-profile-link"><span className="k-avatar">{user.full_name?.charAt(0)?.toUpperCase() || "U"}</span><span className="k-profile-copy"><strong>{user.full_name}</strong><small>{user.role === "admin" ? "Administrator" : "Member"}</small></span></Link>
      </div>
    </aside>
    <header className="k-topbar">
      <button type="button" className="k-menu-button" onClick={() => setMobileOpen(true)} aria-label="Open navigation" aria-expanded={mobileOpen}>☰</button>
      <div className="k-breadcrumb"><span>Workspace</span><b>/</b><strong>{[...GROUPS.flatMap(g => g.items)].find(item => item.href === pathname)?.label || (pathname === "/admin" ? "Admin" : "KHALAF")}</strong></div>
      <div className="k-topbar-actions"><span className="k-topbar-greeting">Peace, {user.full_name?.split(" ")[0]}</span><button type="button" onClick={() => { closeMenus(); logout(); }} className="k-signout">Sign out <span aria-hidden="true">↗</span></button></div>
    </header>
  </>;
}
