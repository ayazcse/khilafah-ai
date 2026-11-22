"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Loading, EmptyState, ErrorBanner } from "@/components/StateViews";

type Member = { id:string; full_name:string; bio:string; avatar_url:string|null; interests:string[]; joined_at:string; follower_count:number; following_count:number; post_count:number; is_following:boolean; is_me:boolean };
type Post = { id:string; body:string; topic:string; created_at:string; like_count:number; comment_count:number };
type NetworkMember = { id:string; full_name:string; bio:string; avatar_url:string|null };

export default function MemberPage() {
  const params = useParams<{id:string}>();
  const memberId = params.id;
  const { user, loading:authLoading } = useAuth();
  const [member,setMember] = useState<Member|null>(null);
  const [posts,setPosts] = useState<Post[]>([]);
  const [network,setNetwork] = useState<NetworkMember[]>([]);
  const [networkKind,setNetworkKind] = useState<"followers"|"following"|null>(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");

  const load = useCallback(async()=>{
    setError("");
    try {
      const [person,feed] = await Promise.all([
        api.get<Member>(`/community/members/${memberId}`),
        api.get<{posts:Post[]}>(`/community/members/${memberId}/posts`)
      ]);
      setMember(person); setPosts(feed.posts);
    } catch { setError("Member profile could not be loaded."); }
  },[memberId]);

  useEffect(()=>{ if(user && memberId) load(); },[user,memberId,load]);

  async function toggleFollow(){
    if(!member) return;
    setBusy(true);
    try {
      await api.post(`/community/users/${member.id}/follow`);
      await load();
    } catch { setError("Follow status could not be updated."); }
    finally { setBusy(false); }
  }

  async function showNetwork(kind:"followers"|"following"){
    if(!member) return;
    if(networkKind===kind){setNetworkKind(null);return;}
    setNetworkKind(kind);
    try {
      const result=await api.get<{members:NetworkMember[]}>(`/community/members/${member.id}/network?kind=${kind}`);
      setNetwork(result.members);
    } catch { setError("Member list could not be loaded."); }
  }

  if(authLoading) return <Loading/>;
  if(!user) return <EmptyState title="Sign in required" description="Sign in to explore community member profiles."/>;
  return <div className="max-w-4xl mx-auto px-5 sm:px-6 py-10 space-y-6">
    <Link href="/community" className="text-sm text-emerald-300 hover:text-emerald-200">← Back to community</Link>
    {error && <ErrorBanner message={error}/>}
    {!member && !error ? <Loading/> : null}
    {member && <>
      <section className="rounded-3xl border border-emerald-300/15 bg-gradient-to-br from-[#123d39] via-[#102d3c] to-[#102033] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-20 h-20 shrink-0 rounded-full overflow-hidden bg-emerald-300/15 border border-emerald-200/30 grid place-items-center text-3xl text-emerald-100 font-semibold">
            {member.avatar_url ? <img src={member.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer"/> : member.full_name.slice(0,1).toUpperCase()}
          </div>
          <div className="flex-1"><p className="text-xs tracking-widest uppercase text-emerald-200">KHILAFAH Connect member</p><h1 className="text-3xl font-serif font-semibold text-white mt-1">{member.full_name}</h1><p className="text-sm text-slate-300 mt-2">{member.bio || "This member has not added a bio yet."}</p></div>
          {!member.is_me && <div className="flex flex-wrap gap-2"><button disabled={busy} onClick={toggleFollow} className="rounded-xl border border-emerald-200/30 px-5 py-2.5 text-sm font-semibold text-emerald-100 hover:bg-emerald-300/10">{busy?"Please wait…":member.is_following?"Following · Unfollow":"Follow"}</button><Link href={`/inbox?member=${encodeURIComponent(member.id)}`} className="btn-primary inline-flex items-center justify-center px-5 py-2.5">Message</Link></div>}
          {member.is_me && <Link href="/profile" className="btn-primary">Edit profile</Link>}
        </div>
        <div className="grid grid-cols-3 gap-3 mt-7">
          <div className="rounded-xl bg-black/15 border border-white/10 p-3 text-center"><div className="text-xl font-semibold text-white">{member.post_count}</div><div className="text-xs text-slate-300">Posts</div></div><div className="rounded-xl bg-black/15 border border-white/10 p-3 text-center"><div className="text-xl font-semibold text-white">{member.follower_count}</div><div className="text-xs text-slate-300">Followers</div></div><div className="rounded-xl bg-black/15 border border-white/10 p-3 text-center"><div className="text-xl font-semibold text-white">{member.following_count}</div><div className="text-xs text-slate-300">Following</div></div>
        </div>
        {member.interests.length>0 && <div className="flex flex-wrap gap-2 mt-5">{member.interests.map(item=><span key={item} className="rounded-full border border-emerald-200/20 bg-emerald-200/5 px-3 py-1 text-xs text-emerald-100">{item}</span>)}</div>}
        <p className="text-xs text-slate-400 mt-5">Member since {new Date(member.joined_at).toLocaleDateString()}</p>
      </section>
      <section className="flex gap-3">
        <button onClick={()=>showNetwork("followers")} className="text-sm text-emerald-200 hover:underline">View followers</button>
        <button onClick={()=>showNetwork("following")} className="text-sm text-emerald-200 hover:underline">View following</button>
      </section>
      {networkKind && <section className="card space-y-3"><h2 className="font-semibold text-white capitalize">{networkKind}</h2>{network.length===0?<p className="text-sm text-white/50">No members to show yet.</p>:network.map(person=><Link key={person.id} href={`/members/${person.id}`} className="flex items-center gap-3 py-2 border-b border-white/10 last:border-0"><div className="w-9 h-9 rounded-full overflow-hidden bg-emerald-300/15 grid place-items-center text-emerald-100">{person.avatar_url?<img src={person.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer"/>:person.full_name.slice(0,1)}</div><div><p className="text-sm text-white font-medium">{person.full_name}</p><p className="text-xs text-white/45">{person.bio}</p></div></Link>)}</section>}
      <section className="space-y-4"><h2 className="text-xl font-semibold text-white">Posts</h2>{posts.length===0?<div className="card text-sm text-white/50">No posts published yet.</div>:posts.map(post=><article key={post.id} className="card"><div className="flex justify-between text-xs text-slate-400"><span>{post.topic}</span><span>{new Date(post.created_at).toLocaleString()}</span></div><p className="whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-100 mt-3">{post.body}</p><div className="border-t border-white/10 mt-4 pt-3 text-xs text-slate-400">{post.like_count} likes · {post.comment_count} comments</div></article>)}</section>
    </>}
  </div>;
}
