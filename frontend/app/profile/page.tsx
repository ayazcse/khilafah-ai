"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Loading, EmptyState, ErrorBanner } from "@/components/StateViews";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitFeedback(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/feedback", { message });
      setMessage("");
      setSent(true);
    } catch {
      setError("Could not submit feedback. Please try again.");
    }
  }

  if (loading) return <Loading />;
  if (!user) return <EmptyState title="Sign in required" description="Sign in to view your profile." />;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <div className="card">
        <h1 className="text-2xl font-serif font-semibold text-white mb-4">Profile</h1>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-white/50">Name</dt>
            <dd className="text-white">{user.full_name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-white/50">Email</dt>
            <dd className="text-white">{user.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-white/50">Role</dt>
            <dd className="text-white capitalize">{user.role}</dd>
          </div>
        </dl>
      </div>

      <div className="card">
        <h2 className="text-gold font-medium mb-4">Send feedback</h2>
        {error && <div className="mb-3"><ErrorBanner message={error} /></div>}
        {sent && <p className="text-emerald-400 text-sm mb-3">Thanks — your feedback was sent.</p>}
        <form onSubmit={submitFeedback} className="space-y-3">
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="input-field min-h-[100px]"
            placeholder="Tell us what's working or what could be better..."
          />
          <button type="submit" className="btn-primary">Send feedback</button>
        </form>
      </div>
    </div>
  );
}
