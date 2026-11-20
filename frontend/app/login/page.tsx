"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { ErrorBanner } from "@/components/StateViews";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page min-h-[calc(100vh-76px)] flex items-center justify-center px-4 py-12 sm:py-16">
      <section className="w-full max-w-md">
        <div className="text-center mb-7">
          <div className="auth-mark mx-auto mb-4" aria-hidden="true">خ</div>
          <p className="auth-kicker mb-2">WELCOME BACK</p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-white mb-3">Sign in</h1>
          <p className="auth-subtitle">Continue your research and learning journey.</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-card space-y-5">
          {error && <ErrorBanner message={error} />}
          <div>
            <label htmlFor="login-email" className="label-text text-base mb-2">Email address</label>
            <input id="login-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="you@example.com" />
          </div>
          <div>
            <label htmlFor="login-password" className="label-text text-base mb-2">Password</label>
            <input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="Enter your password" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full auth-submit">
            {loading ? "Signing in..." : "Sign in to your account"}
          </button>
          <p className="auth-footnote text-center">New to KHILAFAH AI? <Link href="/register" className="auth-link font-semibold">Create a free account</Link></p>
          <p className="auth-free-note text-center">Free to use. No paid plans or subscriptions.</p>
        </form>
      </section>
    </main>
  );
}
