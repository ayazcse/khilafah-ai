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

export default function Nav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const activeExplore = GROUPS.slice(1).some(group => group.items.some(item => item.href === pathname));

  useEffect(() => {
    setMobileOpen(false);
    setExploreOpen(false);
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

  const closeMenus = () => { setMobileOpen(false); setExploreOpen(false); };
  const brand = <Link href={user ? "/dashboard" : "/"} onClick={closeMenus} className="k-brand" aria-label="KHALAF home">
    <span className="k-brand-mark">خَلَف</span><span className="k-brand-name">KHALAF</span>
  </Link>;

  if (!user) return <header className="site-nav k-public-header"><div className="k-public-inner">{brand}<div className="k-public-actions"><Link href="/login" className="nav-signin">Sign in</Link><Link href="/register" className="nav-cta">Create account</Link></div></div></header>;

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
