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
  { href: "/governance-lab", label: "Governance Lab" },
  { href: "/economics-lab", label: "Economics Lab" },
  { href: "/academy", label: "Academy" },
];

export default function Nav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-40 bg-charcoal/95 backdrop-blur border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-gold text-xl font-serif font-bold">KHILAFAH AI</span>
          </Link>

          {user && (
            <div className="hidden lg:flex items-center gap-1 overflow-x-auto">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 text-sm rounded-md whitespace-nowrap transition-colors ${
                    pathname === link.href
                      ? "bg-emerald-deep/20 text-emerald-300"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className={`px-3 py-2 text-sm rounded-md whitespace-nowrap transition-colors ${
                    pathname === "/admin" ? "bg-gold/20 text-gold" : "text-gold/80 hover:text-gold hover:bg-white/5"
                  }`}
                >
                  Admin
                </Link>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <>
                <Link href="/profile" className="text-sm text-white/70 hover:text-white">
                  {user.full_name}
                </Link>
                <button onClick={logout} className="text-sm text-white/50 hover:text-white">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/pricing" className="text-sm text-white/70 hover:text-white">
                  Pricing
                </Link>
                <Link href="/login" className="text-sm text-white/70 hover:text-white">
                  Sign in
                </Link>
                <Link href="/register" className="btn-primary text-sm py-2">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
