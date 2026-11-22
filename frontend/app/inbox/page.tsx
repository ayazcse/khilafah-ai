"use client";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { EmptyState, Loading } from "@/components/StateViews";
type Member={id:string;full_name:string;avatar_url:string|null};
type Message={id:string;sender_id:string;body:string;created_at:string};
type Conversation={id:string;status:string;other_member:Member;last_message:Message|null;is_request:boolean};
export default function InboxPage(){
 const {user,loading}=useAuth(); const [items,setItems]=useState<Conversation[]>([]);
 const [active,setActive]=useState<Conversation|null>(null); const [messages,setMessages]=useState<Message[]>([]);
 const [recipient,setRecipient]=useState(""); const [first,setFirst]=useState(""); const [draft,setDraft]=useState("");
 const [busy,setBusy]=useState(false); const [error,setError]=useState("");
 async function load(){const d=await api.get<{conversations:Conversation[]}>("/inbox/conversations");setItems(d.conversations);}
 async function open(row:Conversation){setActive(row);setError("");if(row.status==="accepted"){try{const d=await api.get<{messages:Message[]}>("/inbox/conversations/"+row.id+"/messages");setMessages(d.messages);}catch{setError("Could not load messages.");}}else setMessages([]);}
 useEffect(()=>{if(user)load().catch(()=>setError("Inbox could not be loaded."));},[user]);
 async function start(e:FormEvent){e.preventDefault();setBusy(true);setError("");try{const row=await api.post<Conversation>("/inbox/conversations",{recipient_id:recipient.trim(),body:first});setRecipient("");setFirst("");await load();setActive(row);setMessages([]);}catch{setError("Request failed. Use a valid member ID and try again.");}finally{setBusy(false);}}
 async function send(e:FormEvent){e.preventDefault();if(!active||!draft.trim())return;setBusy(true);try{await api.post("/inbox/conversations/"+active.id+"/messages",{body:draft});setDraft("");const d=await api.get<{messages:Message[]}>("/inbox/conversations/"+active.id+"/messages");setMessages(d.messages);await load();}catch{setError("Message could not be sent.");}finally{setBusy(false);}}
 async function respond(action:"accept"|"decline"){if(!active)return;setBusy(true);try{await api.post("/inbox/conversations/"+active.id+"/"+action);await load();if(action==="accept"){const next={...active,status:"accepted",is_request:false};setActive(next);const d=await api.get<{messages:Message[]}>("/inbox/conversations/"+active.id+"/messages");setMessages(d.messages);}else{setActive(null);setMessages([]);}}catch{setError("Could not update request.");}finally{setBusy(false);}}
 if(loading)return <Loading/>;if(!user)return <EmptyState title="Sign in required" description="Sign in to use private messages."/>;
 return <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
 <header className="mb-6"><p className="text-xs uppercase tracking-[.2em] text-emerald-300">KHILAFAH Connect</p><h1 className="text-3xl font-serif text-white mt-1">Private Inbox</h1><p className="text-sm text-white/55 mt-2">One-to-one conversations. New chats start as message requests.</p></header>
 {error&&<p role="alert" className="mb-4 rounded-xl border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200">{error}</p>}
 <form onSubmit={start} className="card mb-5 grid sm:grid-cols-[1fr_2fr_auto] gap-3">
 <input required value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="Recipient member ID" className="input-field"/>
 <input required value={first} onChange={e=>setFirst(e.target.value)} maxLength={2000} placeholder="Write a respectful first message…" className="input-field"/>
 <button disabled={busy} className="btn-primary">Send request</button></form>
 <div className="grid md:grid-cols-[minmax(240px,.8fr)_minmax(0,1.7fr)] gap-5">
 <section className="card"><h2 className="font-semibold text-white mb-4">Conversations & requests</h2><div className="space-y-2">
 {items.length===0&&<p className="text-sm text-white/45">No conversations yet.</p>}
 {items.map(row=><button key={row.id} onClick={()=>open(row)} className={"w-full text-left rounded-xl border p-3 "+(active?.id===row.id?"border-emerald-300/50 bg-emerald-400/10":"border-white/10 hover:bg-white/5")}>
 <span className="block text-white font-medium">{row.other_member.full_name}</span><span className="block text-xs text-white/50 mt-1">{row.is_request?"Message request":row.status==="accepted"?"Private conversation":row.status}</span><span className="block text-xs text-white/45 mt-1 truncate">{row.last_message?.body||"No messages"}</span></button>)}</div></section>
 <section className="card min-h-[420px] flex flex-col">{!active?<div className="m-auto text-center text-white/45"><p className="text-lg">Your private conversations</p><p className="text-sm mt-2">Choose a conversation to view messages.</p></div>:<>
 <div className="border-b border-white/10 pb-3 mb-4"><h2 className="font-semibold text-white">{active.other_member.full_name}</h2><p className="text-xs text-white/45">{active.status==="pending"?"Awaiting request acceptance":"Private one-to-one chat"}</p></div>
 {active.is_request&&<div className="rounded-xl bg-amber-400/10 border border-amber-300/20 p-4 mb-4"><p className="text-sm text-amber-100">Accept this request to view and reply to the message, or decline it.</p><div className="flex gap-2 mt-3"><button type="button" disabled={busy} onClick={()=>respond("accept")} className="btn-primary">Accept</button><button type="button" disabled={busy} onClick={()=>respond("decline")} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white">Decline</button></div></div>}
 {active.status==="accepted"&&<div className="flex-1 space-y-3 overflow-y-auto max-h-[420px] pr-1">{messages.map(m=><div key={m.id} className={"max-w-[85%] rounded-2xl p-3 text-sm "+(m.sender_id===user.id?"ml-auto bg-emerald-700/50 text-white":"bg-white/10 text-white/90")}><p className="whitespace-pre-wrap break-words">{m.body}</p><time className="block text-[10px] opacity-50 mt-2">{new Date(m.created_at).toLocaleString()}</time></div>)}</div>}
 {active.status==="accepted"&&<form onSubmit={send} className="flex gap-2 mt-4"><input required value={draft} onChange={e=>setDraft(e.target.value)} maxLength={2000} placeholder="Write a private message…" className="input-field flex-1"/><button disabled={busy} className="btn-primary">Send</button></form>}
 {active.status==="pending"&&!active.is_request&&<p className="text-sm text-white/50">Request sent. You can chat after the recipient accepts.</p>}
 {active.status==="blocked"&&<p className="text-sm text-white/50">This conversation is unavailable.</p>}</>}</section></div>
 <p className="text-xs text-white/40 mt-5">Privacy: authenticated API checks restrict conversation access to its two participants. This version is not end-to-end encrypted. Avoid sending passwords or sensitive financial details.</p></main>;
}