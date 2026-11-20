"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { ErrorBanner } from "@/components/StateViews";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(email, password, fullName);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page min-h-[calc(100vh-76px)] flex items-center justify-center px-4 py-12 sm:py-16">
      <section className="w-full max-w-md">
        <div className="text-center mb-7">
          <div className="auth-mark mx-auto mb-4" aria-hidden="true">خ</div>
          <p className="auth-kicker mb-2">JOIN THE KNOWLEDGE COMMUNITY</p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-white mb-3">Create your account</h1>
          <p className="auth-subtitle">Start exploring Islamic civilization and research tools.</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-card space-y-5">
          {error && <ErrorBanner message={error} />}
          <div>
            <label htmlFor="register-name" className="label-text text-base mb-2">Full name</label>
            <input id="register-name" autoComplete="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field" placeholder="Your full name" />
          </div>
          <div>
            <label htmlFor="register-email" className="label-text text-base mb-2">Email address</label>
            <input id="register-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="you@example.com" />
          </div>
          <div>
            <label htmlFor="register-password" className="label-text text-base mb-2">Password (at least 8 characters)</label>
            <input id="register-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="Create a secure password" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full auth-submit">
            {loading ? "Creating account..." : "Create free account"}
          </button>
          <p className="auth-footnote text-center">Already have an account? <Link href="/login" className="auth-link font-semibold">Sign in</Link></p>
          <p className="auth-free-note text-center">Free to use. No paid plans or subscriptions.</p>
        </form>
      </section>
    </main>
  );
}
