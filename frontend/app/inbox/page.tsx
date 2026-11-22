"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { EmptyState, Loading } from "@/components/StateViews";
import CallControls from "@/components/CallControls";

type Member={id:string;full_name:string;avatar_url:string|null;bio?:string};
type Message={id:string;sender_id:string;body:string;created_at:string};
type Conversation={id:string;status:string;other_member:Member;last_message:Message|null;is_request:boolean};

function Avatar({member,size="md"}:{member:Member;size?:"sm"|"md"|"lg"}) {
 const dims=size==="lg"?"w-12 h-12":size==="sm"?"w-9 h-9":"w-10 h-10";
 return <div className={dims+" shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-emerald-300/25 to-sky-300/20 border border-white/10 grid place-items-center text-emerald-100 font-semibold"}>
  {member.avatar_url?<img src={member.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer"/>:member.full_name.slice(0,1).toUpperCase()}
 </div>;
}

export default function InboxPage(){
 const {user,loading}=useAuth();
 const [items,setItems]=useState<Conversation[]>([]);
 const [active,setActive]=useState<Conversation|null>(null);
 const [messages,setMessages]=useState<Message[]>([]);
 const [newChatMember,setNewChatMember]=useState<Member|null>(null);
 const [firstDraft,setFirstDraft]=useState("");
 const [draft,setDraft]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [mobileThread,setMobileThread]=useState(false);

 async function load(){const d=await api.get<{conversations:Conversation[]}>("/inbox/conversations");setItems(d.conversations);}
 async function open(row:Conversation){
  setActive(row);setNewChatMember(null);setMessages([]);setMobileThread(true);setError("");
  if(row.status==="accepted"){try{const d=await api.get<{messages:Message[]}>("/inbox/conversations/"+row.id+"/messages");setMessages(d.messages);}catch{setError("Could not load messages.");}}
 }
 useEffect(()=>{if(user)load().catch(()=>setError("Inbox could not be loaded."));},[user]);
 useEffect(()=>{
  if(!user)return;
  const memberId=new URLSearchParams(window.location.search).get("member");
  if(!memberId)return;
  api.get<Member>("/community/members/"+encodeURIComponent(memberId))
   .then(async member=>{
    if(member.id===user.id)return;
    const existing=items.find(row=>row.other_member.id===member.id);
    if(existing) await open(existing);
    else {setActive(null);setMessages([]);setNewChatMember(member);setMobileThread(true);}
   })
   .catch(()=>setError("Member profile could not be opened. Please try again from their profile."));
 },[user,items.length]);

 async function sendFirst(e:FormEvent){
  e.preventDefault();if(!newChatMember||!firstDraft.trim())return;
  setBusy(true);setError("");
  try{
   const row=await api.post<Conversation>("/inbox/conversations",{recipient_id:newChatMember.id,body:firstDraft.trim()});
   setFirstDraft("");setNewChatMember(null);await load();setActive(row);setMobileThread(true);setMessages([]);
  }catch{setError("Message request could not be sent. Please try again.");}
  finally{setBusy(false);}
 }
 async function send(e:FormEvent){
  e.preventDefault();if(!active||!draft.trim())return;
  setBusy(true);setError("");
  try{await api.post("/inbox/conversations/"+active.id+"/messages",{body:draft.trim()});setDraft("");const d=await api.get<{messages:Message[]}>("/inbox/conversations/"+active.id+"/messages");setMessages(d.messages);await load();}
  catch{setError("Message could not be sent.");}finally{setBusy(false);}
 }
 async function respond(action:"accept"|"decline"){
  if(!active)return;setBusy(true);
  try{await api.post("/inbox/conversations/"+active.id+"/"+action);await load();if(action==="accept"){const next={...active,status:"accepted",is_request:false};setActive(next);const d=await api.get<{messages:Message[]}>("/inbox/conversations/"+active.id+"/messages");setMessages(d.messages);}else{setActive(null);setMessages([]);setMobileThread(false);}}
  catch{setError("Could not update request.");}finally{setBusy(false);}
 }

 if(loading)return <Loading/>;
 if(!user)return <EmptyState title="Sign in required" description="Sign in to use private messages."/>;
 const selectedMember=active?.other_member||newChatMember;
 return <main className="min-h-[calc(100vh-72px)] bg-[#0b1722] text-[#f2f8fc] px-3 sm:px-6 py-5 sm:py-8">
  <div className="max-w-6xl mx-auto">
   <CallControls conversationId={active?.status === "accepted" ? active.id : undefined}/>
   <header className="flex items-center justify-between gap-3 mb-5">
    <div><p className="text-[11px] uppercase tracking-[.22em] text-emerald-300 font-semibold">KHILAFAH CONNECT</p><h1 className="text-2xl sm:text-3xl font-serif text-white mt-1">Messages</h1></div>
    <Link href="/community" className="text-sm rounded-full border border-white/15 px-4 py-2 text-slate-300 hover:text-emerald-200 hover:border-emerald-300/30">Explore people</Link>
   </header>
   {error&&<p role="alert" className="mb-3 rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200">{error}</p>}
   <div className="grid md:grid-cols-[320px_minmax(0,1fr)] min-h-[650px] max-h-[calc(100vh-190px)] rounded-2xl overflow-hidden border border-white/10 bg-[#102130] shadow-2xl">
    <aside className={(mobileThread?"hidden md:flex":"flex")+" flex-col border-r border-white/10 min-h-0"}>
     <div className="px-5 py-4 border-b border-white/10"><div className="flex items-center justify-between"><h2 className="font-semibold text-white">Your messages</h2><span className="text-xs text-slate-500">{items.length} chats</span></div><p className="text-xs text-slate-500 mt-1">Private conversations & requests</p></div>
     <div className="overflow-y-auto flex-1">
      {items.length===0&&!newChatMember&&<div className="p-6 text-center text-sm text-slate-500">No conversations yet. Visit a member profile and tap Message to start.</div>}
      {items.map(row=><button key={row.id} onClick={()=>open(row)} className={"w-full text-left flex items-center gap-3 px-4 py-3.5 border-b border-white/5 transition "+(active?.id===row.id?"bg-emerald-400/10":"hover:bg-white/[.04]")}>
       <Avatar member={row.other_member}/>
       <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="text-sm font-semibold text-white truncate">{row.other_member.full_name}</span>{row.is_request&&<span className="text-[10px] rounded-full bg-amber-300/10 text-amber-200 px-2 py-1">Request</span>}</span><span className="block text-xs text-slate-400 truncate mt-1">{row.last_message?.body||"Start a conversation"}</span></span>
      </button>)}
     </div>
     <div className="p-4 border-t border-white/10"><Link href="/community" className="block text-center text-sm text-emerald-200 hover:text-emerald-100">Find people to message →</Link></div>
    </aside>
    <section className={(mobileThread?"flex":"hidden md:flex")+" min-w-0 flex-col min-h-0"}>
     {!selectedMember?<div className="m-auto text-center px-6"><div className="w-16 h-16 rounded-full border border-emerald-200/20 bg-emerald-300/10 grid place-items-center text-3xl mx-auto text-emerald-200">✉</div><h2 className="text-xl font-semibold text-white mt-5">Your private space</h2><p className="text-sm text-slate-400 mt-2 max-w-sm">Choose a conversation or visit a member profile and tap Message to start a private chat.</p><Link href="/community" className="btn-primary inline-flex mt-5">Explore community</Link></div>:<>
      <div className="px-4 sm:px-5 py-3.5 border-b border-white/10 flex items-center gap-3 bg-[#112736]">
       <button type="button" onClick={()=>setMobileThread(false)} className="md:hidden text-slate-300 text-xl pr-1" aria-label="Back to conversations">←</button>
       <Link href={active?"/members/"+active.other_member.id:"/community"}><Avatar member={selectedMember} size="lg"/></Link>
       <div className="min-w-0 flex-1"><Link href={active?"/members/"+active.other_member.id:"/community"} className="font-semibold text-white hover:text-emerald-200">{selectedMember.full_name}</Link><p className="text-xs text-slate-400">{active?.status==="pending"?"Message request":active?.status==="blocked"?"Conversation unavailable":"KHILAFAH Connect member"}</p></div>
       {active?.status === "accepted" && <CallControls conversationId={active.id}/>}
       <span className="hidden sm:inline text-[10px] uppercase tracking-wider text-emerald-200/70">Private chat</span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4">
       {newChatMember&&<div className="max-w-md mx-auto text-center py-10"><Avatar member={newChatMember} size="lg"/><h3 className="text-lg font-semibold text-white mt-3">{newChatMember.full_name}</h3><p className="text-sm text-slate-400 mt-2">Send a message request to start a private conversation. They can accept or decline.</p></div>}
       {active?.is_request&&<div className="max-w-lg mx-auto rounded-2xl bg-amber-300/10 border border-amber-200/20 p-4"><p className="text-sm text-amber-100">This person wants to message you. Accept the request to continue the conversation.</p><div className="flex gap-2 mt-3"><button type="button" disabled={busy} onClick={()=>respond("accept")} className="btn-primary">Accept request</button><button type="button" disabled={busy} onClick={()=>respond("decline")} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white">Decline</button></div></div>}
       {active?.status==="accepted"&&messages.length===0&&<p className="text-center text-sm text-slate-500 py-10">This is the beginning of your conversation.</p>}
       {active?.status==="accepted"&&messages.map(m=><div key={m.id} className={"flex "+(m.sender_id===user.id?"justify-end":"justify-start")}><div className={"max-w-[82%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow "+(m.sender_id===user.id?"bg-emerald-700 text-white rounded-br-md":"bg-[#1b3445] text-slate-100 rounded-bl-md")}><p className="whitespace-pre-wrap break-words leading-6">{m.body}</p><time className="block text-[10px] opacity-55 mt-2 text-right">{new Date(m.created_at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</time></div></div>)}
       {active?.status==="pending"&&!active.is_request&&<p className="text-center text-sm text-slate-400 py-8">Message request sent. You can chat when they accept.</p>}
       {active?.status==="blocked"&&<p className="text-center text-sm text-slate-400 py-8">This conversation is unavailable.</p>}
      </div>
      {newChatMember&&<form onSubmit={sendFirst} className="p-3 sm:p-4 border-t border-white/10 bg-[#102433] flex gap-2 items-end"><textarea required rows={1} value={firstDraft} onChange={e=>setFirstDraft(e.target.value)} maxLength={2000} placeholder="Write a message…" className="min-w-0 flex-1 resize-none rounded-2xl bg-[#0a1a27] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"/><button disabled={busy||!firstDraft.trim()} className="btn-primary rounded-full px-5">{busy?"Sending…":"Send"}</button></form>}
      {active?.status==="accepted"&&<form onSubmit={send} className="p-3 sm:p-4 border-t border-white/10 bg-[#102433] flex gap-2 items-end"><textarea required rows={1} value={draft} onChange={e=>setDraft(e.target.value)} maxLength={2000} placeholder="Write a message…" className="min-w-0 flex-1 resize-none rounded-2xl bg-[#0a1a27] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"/><button disabled={busy||!draft.trim()} className="btn-primary rounded-full px-5">{busy?"Sending…":"Send"}</button></form>}
     </>}
    </section>
   </div>
   <p className="text-[11px] text-slate-500 mt-4">Messages are accessible to conversation participants through authenticated API checks. This version is not end-to-end encrypted; avoid sharing passwords or sensitive financial details.</p>
  </div>
 </main>;
}
