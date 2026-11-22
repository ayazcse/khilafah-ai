"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { EmptyState, Loading, ErrorBanner } from "@/components/StateViews";

type Topic = "All" | "General" | "History" | "Science" | "Quran & Learning" | "Research" | "Society & Economy";
type Author = { id: string; full_name: string; avatar_url?: string | null };
type Post = {
  id: string; body: string; topic: Exclude<Topic, "All">; created_at: string;
  author: Author; like_count: number; comment_count: number;
  liked_by_me: boolean; following_author: boolean; is_mine: boolean;
};
type Comment = { id: string; body: string; created_at: string; author: Author; is_mine: boolean };

const TOPICS: Topic[] = ["All", "General", "History", "Science", "Quran & Learning", "Research", "Society & Economy"];

function timeAgo(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return Math.floor(seconds / 60) + "m ago";
  if (seconds < 86400) return Math.floor(seconds / 3600) + "h ago";
  return Math.floor(seconds / 86400) + "d ago";
}

export default function CommunityPage() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [topic, setTopic] = useState<Topic>("All");
  const [draft, setDraft] = useState("");
  const [draftTopic, setDraftTopic] = useState<Exclude<Topic, "All">>("General");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [commentOpen, setCommentOpen] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get<{ posts: Post[] }>(`/community/feed?topic=${encodeURIComponent(topic)}`);
      setPosts(data.posts);
    } catch {
      setError("Community feed load nahi ho saka. Please refresh karke dobara try karein.");
    } finally {
      setLoading(false);
    }
  }, [topic]);

  useEffect(() => { if (user) loadFeed(); }, [user, loadFeed]);

  async function createPost(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim() || posting) return;
    setPosting(true); setError("");
    try {
      const created = await api.post<Post>("/community/posts", { body: draft.trim(), topic: draftTopic });
      setPosts(current => topic === "All" || topic === draftTopic ? [created, ...current] : current);
      setDraft("");
    } catch {
      setError("Post publish nahi hua. Please try again.");
    } finally { setPosting(false); }
  }

  async function toggleLike(post: Post) {
    setBusy(post.id);
    try {
      const result = await api.post<{ liked: boolean; like_count: number }>(`/community/posts/${post.id}/like`);
      setPosts(current => current.map(item => item.id === post.id ? { ...item, liked_by_me: result.liked, like_count: result.like_count } : item));
    } catch { setError("Like update nahi ho saka."); }
    finally { setBusy(null); }
  }

  async function toggleFollow(post: Post) {
    setBusy(post.author.id);
    try {
      const result = await api.post<{ following: boolean }>(`/community/users/${post.author.id}/follow`);
      setPosts(current => current.map(item => item.author.id === post.author.id ? { ...item, following_author: result.following } : item));
    } catch { setError("Follow status update nahi hua."); }
    finally { setBusy(null); }
  }

  async function showComments(postId: string) {
    if (commentOpen === postId) { setCommentOpen(null); return; }
    setCommentOpen(postId);
    if (comments[postId]) return;
    try {
      const result = await api.get<{ comments: Comment[] }>(`/community/posts/${postId}/comments`);
      setComments(current => ({ ...current, [postId]: result.comments }));
    } catch { setError("Comments load nahi ho sake."); }
  }

  async function addComment(event: FormEvent, postId: string) {
    event.preventDefault();
    const body = (commentDraft[postId] || "").trim();
    if (!body) return;
    try {
      const created = await api.post<Comment>(`/community/posts/${postId}/comments`, { body });
      setComments(current => ({ ...current, [postId]: [...(current[postId] || []), created] }));
      setCommentDraft(current => ({ ...current, [postId]: "" }));
      setPosts(current => current.map(item => item.id === postId ? { ...item, comment_count: item.comment_count + 1 } : item));
    } catch { setError("Comment publish nahi hua."); }
  }

  async function deletePost(postId: string) {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    try {
      await api.del(`/community/posts/${postId}`);
      setPosts(current => current.filter(item => item.id !== postId));
    } catch { setError("Post delete nahi hua."); }
  }

  async function reportPost(postId: string) {
    const reason = window.prompt("Please tell us why you are reporting this post (minimum 3 characters):");
    if (!reason || reason.trim().length < 3) return;
    try {
      await api.post(`/community/posts/${postId}/report`, { reason: reason.trim() });
      window.alert("Report submitted. Thank you for helping keep the community respectful.");
    } catch { setError("Report submit nahi ho saka."); }
  }

  if (authLoading) return <Loading />;
  if (!user) return <div className="max-w-3xl mx-auto px-5 py-16"><EmptyState title="Join KHALAF Connect" description="Sign in to share ideas, follow researchers and take part in topic-based discussions." /><div className="text-center mt-5"><Link className="btn-primary inline-flex" href="/login">Sign in to continue</Link></div></div>;

  return <div className="min-h-screen bg-[#0b1722] text-[#f2f8fc]">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <header className="mb-8 rounded-3xl border border-emerald-300/15 bg-gradient-to-br from-[#123d39] via-[#102d3c] to-[#102033] p-6 sm:p-9">
        <div className="text-xs tracking-[.22em] uppercase text-emerald-200 font-semibold mb-3">KHILAFAH AI · COMMUNITY</div>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div><h1 className="font-serif text-4xl sm:text-5xl font-semibold">KHILAFAH <span className="text-sky-300">Connect</span></h1>
          <p className="text-slate-200/80 mt-3 max-w-2xl">A thoughtful space to exchange knowledge, discuss ideas and learn from one another.</p></div>
          <div className="flex flex-wrap items-center gap-2"><Link href="/stories" className="rounded-full border border-emerald-300/30 px-4 py-2 text-sm text-emerald-100 hover:bg-emerald-300/10">Stories & Snaps</Link><div className="text-sm text-emerald-100/80 border border-emerald-100/20 rounded-xl px-4 py-3">Learn respectfully · Share responsibly</div></div>
        </div>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_280px] gap-7 items-start">
        <main className="min-w-0">
          {error && <div className="mb-4"><ErrorBanner message={error} /></div>}
          <form onSubmit={createPost} className="rounded-2xl border border-white/10 bg-[#112433] p-4 sm:p-5 mb-5 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-400/15 border border-emerald-300/20 grid place-items-center text-emerald-200 font-semibold">{user.full_name.slice(0,1).toUpperCase()}</div>
              <div><div className="font-semibold">{user.full_name}</div><div className="text-xs text-slate-400">Share something worth discussing</div></div>
            </div>
            <label htmlFor="community-post" className="sr-only">Write a community post</label>
            <textarea id="community-post" value={draft} onChange={event => setDraft(event.target.value)} maxLength={2000} rows={4} placeholder="What have you been learning or thinking about?" className="w-full resize-y rounded-xl bg-[#0b1b28] border border-white/10 p-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
              <select value={draftTopic} onChange={event => setDraftTopic(event.target.value as Exclude<Topic,"All">)} className="rounded-lg bg-[#0b1b28] border border-white/15 px-3 py-2 text-sm text-slate-200">
                {TOPICS.filter(item => item !== "All").map(item => <option key={item}>{item}</option>)}
              </select>
              <div className="flex items-center justify-between sm:justify-end gap-3"><span className="text-xs text-slate-500">{draft.length}/2000</span><button disabled={!draft.trim() || posting} className="btn-primary min-w-28">{posting ? "Publishing…" : "Publish post"}</button></div>
            </div>
          </form>

          <div className="flex gap-2 overflow-x-auto pb-3 mb-3" aria-label="Filter posts by topic">
            {TOPICS.map(item => <button key={item} onClick={() => setTopic(item)} className={`shrink-0 rounded-full px-4 py-2 text-sm border transition ${topic === item ? "bg-emerald-500/20 border-emerald-300/50 text-emerald-100" : "bg-[#112433] border-white/10 text-slate-300 hover:border-white/25"}`}>{item}</button>)}
          </div>

          {loading ? <Loading /> : posts.length === 0 ? <div className="rounded-2xl border border-dashed border-white/15 p-9 text-center bg-[#102130]"><div className="text-3xl mb-3">✧</div><h2 className="text-xl font-semibold">Start the conversation</h2><p className="text-slate-400 text-sm mt-2">No posts here yet. Share the first useful thought with the community.</p></div> :
            <div className="space-y-4">{posts.map(post => <article key={post.id} className="rounded-2xl border border-white/10 bg-[#112433] p-4 sm:p-5 shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Link href={`/members/${post.author.id}`} aria-label={`View ${post.author.full_name} profile`} className="w-10 h-10 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-emerald-400/25 to-sky-400/20 border border-white/10 grid place-items-center font-semibold text-emerald-100">{post.author.avatar_url ? <img src={post.author.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : post.author.full_name.slice(0,1).toUpperCase()}</Link>
                  <div className="min-w-0"><Link href={`/members/${post.author.id}`} className="font-semibold truncate hover:text-emerald-200">{post.author.full_name}</Link><div className="text-xs text-slate-500">{timeAgo(post.created_at)} · {post.topic}</div></div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!post.is_mine && <button disabled={busy === post.author.id} onClick={() => toggleFollow(post)} className="text-xs rounded-full border border-emerald-300/30 px-3 py-1.5 text-emerald-200 hover:bg-emerald-300/10">{post.following_author ? "Following" : "Follow"}</button>}
                  {post.is_mine ? <button onClick={() => deletePost(post.id)} className="text-xs text-slate-500 hover:text-red-300">Delete</button> : <button onClick={() => reportPost(post.id)} aria-label="Report post" className="text-slate-500 hover:text-amber-300 px-1">···</button>}
                </div>
              </div>
              <p className="whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-100 mt-4">{post.body}</p>
              <div className="flex items-center gap-5 border-t border-white/8 mt-4 pt-3">
                <button disabled={busy === post.id} onClick={() => toggleLike(post)} className={`text-sm ${post.liked_by_me ? "text-pink-300" : "text-slate-400 hover:text-pink-200"}`}>{post.liked_by_me ? "♥ Liked" : "♡ Like"} <span className="text-slate-500">· {post.like_count}</span></button>
                <button onClick={() => showComments(post.id)} className="text-sm text-slate-400 hover:text-sky-200">◌ Comment · {post.comment_count}</button>
              </div>
              {commentOpen === post.id && <div className="mt-4 border-t border-white/10 pt-4">
                <div className="space-y-3 mb-4">{(comments[post.id] || []).map(comment => <div key={comment.id} className="text-sm"><span className="font-semibold text-emerald-100">{comment.author.full_name}</span><span className="text-slate-500 text-xs ml-2">{timeAgo(comment.created_at)}</span><p className="text-slate-300 mt-1 whitespace-pre-wrap">{comment.body}</p></div>)}{comments[post.id]?.length === 0 && <p className="text-xs text-slate-500">No comments yet. Start a thoughtful discussion.</p>}</div>
                <form onSubmit={event => addComment(event, post.id)} className="flex gap-2"><input value={commentDraft[post.id] || ""} onChange={event => setCommentDraft(current => ({ ...current, [post.id]: event.target.value }))} maxLength={1000} placeholder="Write a respectful comment…" className="min-w-0 flex-1 rounded-lg bg-[#0b1b28] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500" /><button className="btn-primary text-sm">Reply</button></form>
              </div>}
            </article>)}</div>}
        </main>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-white/10 bg-[#112433] p-5">
            <h2 className="font-semibold text-lg">Community spaces</h2>
            <p className="text-sm text-slate-400 mt-1 mb-4">Find conversations around your interests.</p>
            {TOPICS.filter(item => item !== "All").map(item => <button key={item} onClick={() => setTopic(item)} className="w-full flex justify-between items-center py-2.5 border-t border-white/8 text-sm text-slate-300 hover:text-emerald-200 text-left"><span>{item}</span><span>→</span></button>)}
          </section>
          <section className="rounded-2xl border border-emerald-300/15 bg-emerald-500/5 p-5">
            <h2 className="font-semibold text-emerald-100">Community principles</h2>
            <ul className="text-sm text-slate-300 space-y-2 mt-3 list-disc pl-5"><li>Disagree with ideas, respect people.</li><li>Share sources for historical claims.</li><li>Protect personal information.</li><li>Report abuse and spam.</li></ul>
          </section>
          <p className="text-xs text-slate-500 leading-5">Posts are visible to signed-in community members. Keep posts respectful and avoid sharing sensitive personal information.</p>
        </aside>
      </div>
    </div>
  </div>;
}
