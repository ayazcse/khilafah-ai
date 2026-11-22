"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Loading, EmptyState, ErrorBanner } from "@/components/StateViews";

type Profile = {
  id: string; full_name: string; bio: string; avatar_url: string | null;
  interests: string[]; joined_at: string; follower_count: number;
  following_count: number; post_count: number;
};

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [interests, setInterests] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function loadProfile() {
    const result = await api.get<Profile>("/community/me/profile");
    setProfile(result);
    setBio(result.bio);
    setAvatarUrl(result.avatar_url || "");
    setInterests(result.interests.join(", "));
  }

  useEffect(() => { if (user) loadProfile().catch(() => setError("Profile could not be loaded. Please refresh.")); }, [user]);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setError(""); setMessage("");
    try {
      const result = await api.patch<Profile>("/community/me/profile", {
        bio, avatar_url: avatarUrl.trim() || null,
        interests: interests.split(",").map(value => value.trim()).filter(Boolean).slice(0, 8),
      });
      setProfile(result);
      setMessage("Your community profile has been updated.");
    } catch {
      setError("Profile could not be saved. Use an HTTPS image URL and try again.");
    } finally { setSaving(false); }
  }

  async function submitFeedback(event: FormEvent) {
    event.preventDefault(); setError("");
    try { await api.post("/feedback", { message: feedback }); setFeedback(""); setSent(true); }
    catch { setError("Could not submit feedback. Please try again."); }
  }

  if (loading) return <Loading />;
  if (!user) return <EmptyState title="Sign in required" description="Sign in to view your profile." />;

  return <div className="max-w-3xl mx-auto px-5 sm:px-6 py-10 space-y-6">
    <header className="rounded-3xl border border-emerald-300/15 bg-gradient-to-br from-[#123d39] via-[#102d3c] to-[#102033] p-6 sm:p-8">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-emerald-400/15 border border-emerald-300/30 grid place-items-center text-2xl text-emerald-100 font-semibold">
          {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : user.full_name.slice(0,1).toUpperCase()}
        </div>
        <div><p className="text-xs tracking-widest uppercase text-emerald-200">Your member profile</p><h1 className="text-2xl sm:text-3xl font-serif font-semibold text-white">{user.full_name}</h1><p className="text-sm text-slate-300">KHILAFAH Connect</p></div>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-6 text-center">
        {[["Posts",profile?.post_count],["Followers",profile?.follower_count],["Following",profile?.following_count]].map(([label,value]) => <div key={String(label)} className="rounded-xl bg-black/15 border border-white/10 p-3"><div className="text-xl font-semibold text-white">{value ?? "—"}</div><div className="text-xs text-slate-300">{label}</div></div>)}
      </div>
    </header>
    {error && <ErrorBanner message={error} />}
    <section className="card">
      <h2 className="text-xl font-semibold text-white mb-1">Edit your profile</h2>
      <p className="text-sm text-white/55 mb-5">Tell the community what you are interested in. Your profile details are visible to signed-in members.</p>
      {message && <p className="text-emerald-300 text-sm mb-3">{message}</p>}
      <form onSubmit={saveProfile} className="space-y-4">
        <label className="block text-sm text-white/80">Profile image URL <span className="text-white/40">(HTTPS)</span><input value={avatarUrl} onChange={e=>setAvatarUrl(e.target.value)} maxLength={500} placeholder="https://example.com/your-photo.jpg" className="input-field mt-2" /></label>
        <label className="block text-sm text-white/80">Bio <span className="text-white/40">({bio.length}/240)</span><textarea value={bio} onChange={e=>setBio(e.target.value)} maxLength={240} rows={3} placeholder="A little about what you learn, build or research…" className="input-field mt-2 min-h-24" /></label>
        <label className="block text-sm text-white/80">Interests <span className="text-white/40">(comma-separated, up to 8)</span><input value={interests} onChange={e=>setInterests(e.target.value)} placeholder="History, AI, Science, Quran…" className="input-field mt-2" /></label>
        <button disabled={saving} className="btn-primary">{saving ? "Saving…" : "Save profile"}</button>
      </form>
    </section>
    <section className="card">
      <h2 className="text-gold font-medium mb-4">Send feedback</h2>
      {sent && <p className="text-emerald-400 text-sm mb-3">Thanks — your feedback was sent.</p>}
      <form onSubmit={submitFeedback} className="space-y-3"><textarea required value={feedback} onChange={e=>setFeedback(e.target.value)} className="input-field min-h-[100px]" placeholder="Tell us what's working or what could be better…" /><button type="submit" className="btn-primary">Send feedback</button></form>
    </section>
  </div>;
}
