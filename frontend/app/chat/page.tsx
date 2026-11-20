"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { api, ApiError, ChatResponse } from "@/lib/api";
import { Loading, ErrorBanner, EmptyState } from "@/components/StateViews";

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
  citations?: ChatResponse["citations"];
  agentTrace?: ChatResponse["agent_trace"];
  uncertaintyNote?: string | null;
}

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState<"en" | "hi" | "ar">("en");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = input.trim();
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
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.answer,
          citations: res.citations,
          agentTrace: res.agent_trace,
          uncertaintyNote: res.uncertainty_note,
        },
      ]);
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        setError(String(err.detail));
      } else {
        setError("Something went wrong processing your question. Please try again.");
      }
    } finally {
      setSending(false);
    }
  }

  if (authLoading) return <Loading />;
  if (!user) return <EmptyState title="Sign in required" description="Sign in to use the AI research assistant." />;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-serif font-semibold text-white mb-1">Islamic History AI</h1>
      <p className="text-white/50 text-sm mb-6">
        Ask a research question. Answers are routed through specialized agents and cite sources where available.
      </p>

      <div className="flex gap-2 mb-4">
        {(["en", "hi", "ar"] as const).map((lang) => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            className={`px-3 py-1.5 rounded-md text-sm ${
              language === lang ? "bg-emerald-deep text-white" : "bg-charcoal-light text-white/60"
            }`}
          >
            {lang === "en" ? "English" : lang === "hi" ? "हिन्दी" : "العربية"}
          </button>
        ))}
      </div>

      <div className="card min-h-[320px] mb-4 space-y-4">
        {messages.length === 0 && (
          <EmptyState
            title="No messages yet"
            description="Ask about Islamic history, governance, economics, or education topics to get started."
          />
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <div
              className={`inline-block max-w-[85%] rounded-lg px-4 py-2.5 text-sm ${
                m.role === "user" ? "bg-emerald-deep text-white" : "bg-charcoal-lighter text-white/90"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.citations && m.citations.length > 0 && (
                <div className="mt-2 pt-2 border-t border-white/10 text-xs text-white/50">
                  <p className="font-medium mb-1">Sources:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {m.citations.map((c, ci) => (
                      <li key={ci}>
                        {c.title}
                        {c.page ? `, p. ${c.page}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {m.uncertaintyNote && (
                <p className="mt-2 text-xs text-amber-300/80 italic">{m.uncertaintyNote}</p>
              )}
              {m.agentTrace && m.agentTrace.length > 0 && (
                <details className="mt-2 text-xs text-white/40">
                  <summary className="cursor-pointer">Agent trace</summary>
                  <ul className="mt-1 space-y-0.5">
                    {m.agentTrace.map((t, ti) => (
                      <li key={ti}>
                        <span className="text-gold/70">{t.agent}:</span> {t.summary}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>
        ))}
        {sending && <Loading label="Researching..." />}
      </div>

      {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about Islamic civilization, governance, or economics..."
          className="input-field"
          disabled={sending}
        />
        <button type="submit" disabled={sending || !input.trim()} className="btn-primary whitespace-nowrap">
          Send
        </button>
      </form>
    </div>
  );
}
