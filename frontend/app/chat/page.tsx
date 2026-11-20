"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api, ApiError, ChatResponse } from "@/lib/api";
import { Loading, ErrorBanner, EmptyState } from "@/components/StateViews";

type ChatLanguage = "en" | "hi" | "ur";
interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
  citations?: ChatResponse["citations"];
  agentTrace?: ChatResponse["agent_trace"];
  uncertaintyNote?: string | null;
}

const LANGUAGES: { id: ChatLanguage; label: string; native: string; note: string }[] = [
  { id: "en", label: "English", native: "English", note: "Clear English answers" },
  { id: "hi", label: "Hindi", native: "हिन्दी", note: "देवनागरी में जवाब" },
  { id: "ur", label: "Urdu", native: "اردو", note: "اردو رسم الخط میں جواب" },
];

const SUGGESTIONS = [
  "What was Bayt al-Hikma and why was it important?",
  "Explain the role of Shura in early Islamic governance.",
  "How did the waqf system support education?",
];

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState<ChatLanguage>("en");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  async function handleSend(e?: React.FormEvent, suggested?: string) {
    e?.preventDefault();
    const userMsg = (suggested ?? input).trim();
    if (!userMsg || sending) return;
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setSending(true);
    setError(null);
    try {
      const res = await api.post<ChatResponse>("/chat", {
        message: userMsg,
        conversation_id: conversationId,
        language,
      });
      setConversationId(res.conversation_id);
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: res.answer,
        citations: res.citations,
        agentTrace: res.agent_trace,
        uncertaintyNote: res.uncertainty_note,
      }]);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 503
        ? String(err.detail)
        : "Your answer could not be generated. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (authLoading) return <Loading />;
  if (!user) return <EmptyState title="Sign in required" description="Sign in to use the AI research assistant." />;

  const selected = LANGUAGES.find((item) => item.id === language)!;

  return (
    <main className="chat-page min-h-[calc(100vh-76px)] w-full min-w-0 overflow-x-hidden px-3 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto w-full min-w-0 max-w-5xl">
        <header className="mb-5 flex min-w-0 flex-col gap-3 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              KHILAFAH AI · RESEARCH ASSISTANT
            </div>
            <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-white sm:text-4xl">Ask. Explore. Understand.</h1>
            <p className="mt-2 max-w-2xl text-[13px] leading-5 text-slate-300 sm:text-base sm:leading-6">
              Explore Islamic history, civilization, governance and economics with clear, structured answers.
            </p>
          </div>
          <div className="w-fit max-w-full rounded-xl border border-sky-300/15 bg-sky-300/5 px-3 py-2 text-[11px] text-slate-300 sm:px-4 sm:py-3 sm:text-xs">
            <span className="block font-semibold text-sky-200">Research mode</span>
            <span>Sources shown when available</span>
          </div>
        </header>

        <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-600/50 bg-[#102333] shadow-xl shadow-black/20 sm:rounded-3xl">
          <div className="flex min-w-0 flex-col gap-3 border-b border-white/10 bg-gradient-to-r from-emerald-950/70 to-sky-950/50 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4 sm:px-6">
            <div>
              <p className="text-sm font-semibold text-white">Response language</p>
              <p className="mt-0.5 text-xs text-slate-300">{selected.note}</p>
            </div>
            <div className="grid w-full max-w-[260px] grid-cols-3 gap-1 rounded-xl border border-white/10 bg-slate-950/50 p-1">
              {LANGUAGES.map((item) => (
                <button key={item.id} type="button" onClick={() => setLanguage(item.id)}
                  aria-pressed={language === item.id}
                  className={"min-h-10 rounded-lg px-2 text-xs font-semibold transition-all sm:min-h-11 sm:px-3 sm:text-sm " + (language === item.id
                    ? "bg-emerald-500 text-slate-950 shadow-lg"
                    : "text-slate-300 hover:bg-white/10 hover:text-white")}>
                  {item.native}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-[340px] min-w-0 space-y-4 p-3 sm:min-h-[380px] sm:space-y-5 sm:p-7" aria-live="polite">
            {messages.length === 0 && (
              <div className="flex min-h-[300px] min-w-0 flex-col items-center justify-center text-center sm:min-h-[330px]">
                <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-3xl text-emerald-200">خ</div>
                <h2 className="text-base font-semibold text-white sm:text-xl">What would you like to research?</h2>
                <p className="mt-2 max-w-md text-[13px] leading-5 text-slate-400 sm:text-sm sm:leading-6">
                  Choose a language, ask a question, and get a clear answer in points.
                </p>
                <div className="mt-5 grid w-full min-w-0 max-w-2xl gap-2 sm:mt-6 sm:grid-cols-3">
                  {SUGGESTIONS.map((suggestion) => (
                    <button key={suggestion} type="button" onClick={() => handleSend(undefined, suggestion)}
                      className="min-w-0 rounded-xl border border-slate-500/30 bg-slate-900/40 p-3 text-left text-[11px] leading-[1.45rem] text-slate-300 transition hover:border-emerald-300/40 hover:bg-emerald-400/5 hover:text-white sm:text-xs">
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <article key={i} className={m.role === "user" ? "flex min-w-0 justify-end" : "flex min-w-0 justify-start"}>
                <div className={"w-full min-w-0 max-w-full rounded-xl p-3 sm:max-w-[88%] sm:rounded-2xl sm:p-5 " + (m.role === "user"
                  ? "border border-emerald-300/20 bg-emerald-900/45 text-white"
                  : "border border-sky-300/15 bg-slate-900/65 text-slate-100")}>
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">
                    {m.role === "user" ? "You" : "KHILAFAH AI"}
                  </div>
                  <p className="whitespace-pre-wrap break-all text-[13px] leading-6 sm:break-words sm:text-[15px] sm:leading-7">{m.content}</p>
                  {m.citations && m.citations.length > 0 && (
                    <div className="mt-5 border-t border-white/10 pt-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-200">Sources</p>
                      <ul className="space-y-2">
                        {m.citations.map((citation, ci) => (
                          <li key={ci} className="text-xs leading-5 text-slate-300">
                            <span className="mr-2 text-emerald-300">[{ci + 1}]</span>
                            {citation.title}{citation.page ? ", page " + citation.page : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {m.uncertaintyNote && <p className="mt-4 rounded-lg border border-amber-300/15 bg-amber-300/5 p-3 text-xs leading-5 text-amber-100/80">{m.uncertaintyNote}</p>}
                  {m.agentTrace && m.agentTrace.length > 0 && (
                    <details className="mt-4 text-xs text-slate-400">
                      <summary className="cursor-pointer select-none hover:text-slate-200">Research details</summary>
                      <ul className="mt-2 space-y-1">{m.agentTrace.map((step, si) => <li key={si}>{step.summary}</li>)}</ul>
                    </details>
                  )}
                </div>
              </article>
            ))}
            {sending && (
              <div className="flex items-center gap-3 text-sm text-sky-200" role="status">
                <span className="flex gap-1"><i className="h-2 w-2 animate-bounce rounded-full bg-emerald-300" /><i className="h-2 w-2 animate-bounce rounded-full bg-emerald-300 [animation-delay:120ms]" /><i className="h-2 w-2 animate-bounce rounded-full bg-emerald-300 [animation-delay:240ms]" /></span>
                Preparing your answer…
              </div>
            )}
            <div ref={endRef} />
          </div>

          {error && <div className="px-4 pb-3 sm:px-7"><ErrorBanner message={error} /></div>}
          <form onSubmit={handleSend} className="min-w-0 border-t border-white/10 bg-slate-950/35 p-2.5 sm:p-5">
            <div className="flex min-w-0 items-end gap-1.5 rounded-xl border border-slate-500/40 bg-[#0b1b28] p-1.5 focus-within:border-emerald-300/60 focus-within:ring-2 focus-within:ring-emerald-400/10 sm:gap-2 sm:rounded-2xl sm:p-2">
              <textarea value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Ask about Islamic civilization, scholars, governance…"
                className="max-h-32 min-h-11 w-0 min-w-0 flex-1 resize-y border-0 bg-transparent px-2 py-2.5 text-[13px] leading-5 text-white outline-none placeholder:text-slate-500 focus:ring-0 sm:max-h-36 sm:px-3 sm:py-3 sm:text-sm sm:leading-6"
                disabled={sending} rows={2} aria-label="Your research question" />
              <button type="submit" disabled={sending || !input.trim()}
                className="mb-1 inline-flex min-h-10 shrink-0 items-center gap-1 rounded-lg bg-emerald-500 px-3 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-11 sm:gap-2 sm:rounded-xl sm:px-4 sm:text-sm">
                <span>Send</span><span aria-hidden="true">↗</span>
              </button>
            </div>
            <div className="mt-2 flex flex-wrap justify-between gap-2 px-1 text-[11px] text-slate-500">
              <span>Enter to send · Shift + Enter for new line</span>
              <span>Selected: {selected.label}</span>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
