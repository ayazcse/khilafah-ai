"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { api, ApiError, ChatResponse } from "@/lib/api";
import { Loading, EmptyState } from "@/components/StateViews";

type Role = "user" | "assistant";
interface DisplayMessage {
  role: Role;
  content: string;
  citations?: ChatResponse["citations"];
  agentTrace?: ChatResponse["agent_trace"];
  uncertaintyNote?: string | null;
  attachments?: string[];
}
interface HistoryItem {
  conversation_id: string;
  created_at: string;
  messages: { role: Role; content: string; created_at: string }[];
}
const PROMPTS = [
  { icon: "⌘", title: "Explore a historical figure", prompt: "What were the most important contributions of Al-Khwarizmi, and which sources support them?" },
  { icon: "◈", title: "Compare two eras", prompt: "Compare the Umayyad and Abbasid approaches to administration, noting major differences." },
  { icon: "⌁", title: "Analyse a primary source", prompt: "Help me critically analyse a historical source: its context, author, bias and reliability." },
  { icon: "✧", title: "Understand a concept", prompt: "Explain the evolution of waqf institutions and their social role in Islamic history." },
];
function friendlyError(error: unknown) {
  if (error instanceof ApiError) return typeof error.detail === "string" ? error.detail : error.message;
  return "The request could not be completed. Please try again.";
}

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState<"en" | "hi" | "ar">("en");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    setHistoryLoading(true);
    api.get<HistoryItem[]>("/chat/history").then(setHistory).catch(() => setHistory([])).finally(() => setHistoryLoading(false));
  }, [user]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, sending]);

  function addFiles(incoming: FileList | File[]) {
    const accepted = Array.from(incoming).filter((file) => /\.(pdf|txt|png|jpe?g|webp)$/i.test(file.name));
    setAttachments((current) => [...current, ...accepted].slice(0, 5));
    setError(null);
  }
  async function handleSend(event?: React.FormEvent) {
    event?.preventDefault();
    if ((!input.trim() && attachments.length === 0) || sending) return;
    const userText = input.trim() || "Please analyse the attached file(s).";
    const files = [...attachments];
    setMessages((current) => [...current, { role: "user", content: userText, attachments: files.map((file) => file.name) }]);
    setInput(""); setAttachments([]); setSending(true); setError(null);
    try {
      let result: ChatResponse;
      if (files.length) {
        const form = new FormData();
        form.append("message", userText);
        form.append("language", language);
        if (conversationId) form.append("conversation_id", conversationId);
        files.forEach((file) => form.append("files", file));
        result = await api.post<ChatResponse>("/chat/attachments", form);
      } else {
        result = await api.post<ChatResponse>("/chat", { message: userText, conversation_id: conversationId, language });
      }
      setConversationId(result.conversation_id);
      setMessages((current) => [...current, {
        role: "assistant", content: result.answer, citations: result.citations,
        agentTrace: result.agent_trace, uncertaintyNote: result.uncertainty_note,
      }]);
      const refreshed = await api.get<HistoryItem[]>("/chat/history").catch(() => history);
      setHistory(refreshed);
    } catch (err) { setError(friendlyError(err)); }
    finally { setSending(false); }
  }
  function startNewChat() {
    setMessages([]); setConversationId(null); setInput(""); setAttachments([]); setError(null);
  }
  function openConversation(item: HistoryItem) {
    setConversationId(item.conversation_id);
    setMessages(item.messages.map((message) => ({ role: message.role, content: message.content })));
    setError(null);
  }

  if (authLoading) return <Loading />;
  if (!user) return <EmptyState title="Sign in required" description="Sign in to use the AI research assistant." />;

  return (
    <div className="research-workspace">
      <aside className="research-sidebar">
        <div className="workspace-brand"><div className="workspace-mark">خ</div><div><strong>KHILAFAH <span>AI</span></strong><small>RESEARCH WORKSPACE</small></div></div>
        <button className="workspace-new-chat" onClick={startNewChat}><span>＋</span> New research session</button>
        <div className="workspace-side-label">YOUR WORKSPACE</div>
        <Link className="workspace-side-link active" href="/chat"><span>◉</span> AI Research</Link>
        <Link className="workspace-side-link" href="/research-studio"><span>▤</span> Source library <span className="side-arrow">↗</span></Link>
        <Link className="workspace-side-link" href="/knowledge-graph"><span>⌘</span> Knowledge graph <span className="side-arrow">↗</span></Link>
        <div className="workspace-history-head"><span>RECENT SESSIONS</span><span>{history.length}</span></div>
        <div className="workspace-history-list">
          {historyLoading ? <span className="workspace-muted">Loading sessions…</span> : history.length === 0 ? <span className="workspace-muted">Your research sessions will appear here.</span> : history.map((item) => {
            const first = item.messages.find((message) => message.role === "user")?.content || "Untitled research";
            return <button key={item.conversation_id} onClick={() => openConversation(item)} className={conversationId === item.conversation_id ? "workspace-history-item selected" : "workspace-history-item"} title={first}>{first.replace(/\[Attachments:.*\]/, "").slice(0, 54)}</button>;
          })}
        </div>
        <div className="workspace-profile"><div className="workspace-avatar">{user.full_name.slice(0, 1).toUpperCase()}</div><div><strong>{user.full_name}</strong><small>Research account</small></div><span className="workspace-online" /></div>
      </aside>

      <main className="research-main">
        <header className="research-topbar">
          <div><span className="research-breadcrumb">WORKSPACE</span><span className="research-breadcrumb-sep">/</span><strong>AI Research</strong></div>
          <div className="research-topbar-right"><span className="research-status-dot" /> GEMINI ENGINE <span className="research-topbar-divider" /> <span>PRIVATE SESSION</span></div>
        </header>

        <div className="research-content">
          {messages.length === 0 ? (
            <section className="research-welcome">
              <div className="research-orbit"><span>خ</span><i /><b /></div>
              <div className="research-overline">THE KNOWLEDGE EXPLORER</div>
              <h1>Research with <em>depth.</em><br />Discover with clarity.</h1>
              <p className="research-intro">Explore Islamic civilisation through focused questions, your own source material, and careful AI-assisted analysis.</p>
              <div className="research-prompt-grid">
                {PROMPTS.map((item) => <button key={item.title} className="research-prompt-card" onClick={() => setInput(item.prompt)}><span>{item.icon}</span><strong>{item.title}</strong><small>{item.prompt}</small><b>↗</b></button>)}
              </div>
              <div className="research-capabilities"><span>✧ Source-aware research</span><span>▤ PDF & text analysis</span><span>◫ Image understanding</span><span>⌁ English · Hindi · Arabic</span></div>
            </section>
          ) : (
            <section className="research-thread" aria-live="polite">
              <div className="thread-heading"><div><span className="research-overline">RESEARCH SESSION</span><h1>Your research conversation</h1></div><button onClick={startNewChat}>＋ New session</button></div>
              {messages.map((message, index) => <article className={message.role === "user" ? "research-message user-message" : "research-message assistant-message"} key={index}>
                <div className="message-avatar">{message.role === "user" ? user.full_name.slice(0, 1).toUpperCase() : "خ"}</div>
                <div className="message-body">
                  <div className="message-meta"><strong>{message.role === "user" ? "You" : "KHILAFAH AI"}</strong><span>{message.role === "user" ? "YOUR QUESTION" : "RESEARCH RESPONSE"}</span></div>
                  <div className="message-content">{message.content}</div>
                  {message.attachments?.length ? <div className="message-attachments">{message.attachments.map((name) => <span key={name}>▤ {name}</span>)}</div> : null}
                  {message.citations?.length ? <div className="message-citations"><strong>REFERENCES & ATTACHMENTS</strong>{message.citations.map((citation, i) => <div key={i}><span>{String(i + 1).padStart(2, "0")}</span><p>{citation.title}{citation.page ? " · p. " + citation.page : ""}</p></div>)}</div> : null}
                  {message.uncertaintyNote ? <p className="message-caveat">ⓘ {message.uncertaintyNote}</p> : null}
                  {message.agentTrace?.length ? <details className="message-trace"><summary>Research process · {message.agentTrace.length} steps</summary>{message.agentTrace.map((step, i) => <p key={i}><b>{step.agent}</b> — {step.summary}</p>)}</details> : null}
                </div>
              </article>)}
              {sending && <div className="research-thinking"><span className="thinking-pulse" /><div><strong>Researching your question</strong><small>Reviewing the request and preparing a grounded response…</small></div></div>}
              <div ref={endRef} />
            </section>
          )}
          {error && <div className="research-error" role="alert"><span>!</span><p>{error}</p><button onClick={() => setError(null)}>Dismiss</button></div>}
        </div>

        <footer className="research-composer-wrap">
          <form className="research-composer" onSubmit={handleSend} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files); }}>
            {attachments.length > 0 && <div className="composer-attachments">{attachments.map((file, index) => <div className="composer-file" key={file.name + "-" + index}><span>{/\.(png|jpe?g|webp)$/i.test(file.name) ? "▧" : "▤"}</span><div><strong>{file.name}</strong><small>{(file.size / 1024 / 1024).toFixed(1)} MB</small></div><button type="button" aria-label={"Remove " + file.name} onClick={() => setAttachments((current) => current.filter((_, i) => i !== index))}>×</button></div>)}</div>}
            {dragging && <div className="composer-drop-overlay">Drop files to attach to your research</div>}
            <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void handleSend(); } }} placeholder="Ask a question, explore an idea, or analyse a source…" rows={2} disabled={sending} />
            <div className="composer-toolbar">
              <div className="composer-tools">
                <input ref={fileInput} type="file" multiple accept=".pdf,.txt,.png,.jpg,.jpeg,.webp" className="sr-only" onChange={(event) => { if (event.target.files) addFiles(event.target.files); event.currentTarget.value = ""; }} />
                <button type="button" onClick={() => fileInput.current?.click()} className="composer-attach" disabled={sending || attachments.length >= 5}>＋ <span>Attach files</span></button>
                <span className="composer-hint">PDF · TXT · PNG · JPG · WEBP · up to 5 files</span>
              </div>
              <div className="composer-actions">
                <select aria-label="Response language" value={language} onChange={(event) => setLanguage(event.target.value as "en" | "hi" | "ar")}><option value="en">English</option><option value="hi">हिन्दी</option><option value="ar">العربية</option></select>
                <button type="submit" className="composer-send" disabled={sending || (!input.trim() && attachments.length === 0)}>{sending ? "Working…" : "Send question"} <span>↗</span></button>
              </div>
            </div>
          </form>
          <p className="composer-disclaimer">AI-assisted research can make mistakes. Verify important claims against original and academic sources.</p>
        </footer>
      </main>
    </div>
  );
}
