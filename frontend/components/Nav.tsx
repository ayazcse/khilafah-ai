"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const initial = window.localStorage.getItem("khilafah-theme") === "light" ? "light" : "dark";
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("khilafah-theme", next);
  }

  return (
    <nav className="site-nav sticky top-0 z-40 backdrop-blur-xl border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between min-h-[72px] gap-4">
          <Link href="/" className="flex items-center gap-3 shrink-0 group" aria-label="KHILAFAH AI home">
            <span className="brand-symbol grid place-items-center w-10 h-10 rounded-full font-serif text-xl">خ</span>
            <span className="brand-wordmark text-sm tracking-[.12em] font-bold">KHILAFAH <span>AI</span></span>
          </Link>
          {user && <div className="hidden xl:flex items-center gap-1 overflow-x-auto">
            {LINKS.map(link => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined} className={`nav-link px-3 py-2 text-[13px] rounded-lg whitespace-nowrap transition-colors ${pathname === link.href ? "active" : ""}`}>{link.label}</Link>)}
            {user.role === "admin" && <Link href="/admin" className={`nav-link px-3 py-2 text-[13px] rounded-lg whitespace-nowrap ${pathname === "/admin" ? "active" : ""}`}>Admin</Link>}
          </div>}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button type="button" onClick={toggleTheme} className="theme-toggle" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
              <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span><span className="hidden sm:inline">{theme === "dark" ? "Light" : "Dark"}</span>
            </button>
            {user ? <>
              <Link href="/profile" className="nav-utility hidden sm:block text-[13px]">{user.full_name}</Link>
              <button onClick={logout} className="nav-utility text-[13px]">Sign out</button>
            </> : <>
              <Link href="/pricing" className="nav-utility hidden sm:block text-[13px]">Plans</Link>
              <Link href="/login" className="nav-utility text-[13px]">Sign in</Link>
              <Link href="/register" className="nav-cta text-[13px] font-semibold px-4 py-2.5">Get started ↗</Link>
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
