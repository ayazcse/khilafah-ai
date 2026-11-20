"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api, AdminStats, UserOut, DocumentOut } from "@/lib/api";
import { Loading, EmptyState } from "@/components/StateViews";

interface LogEntry {
  id: string;
  endpoint: string;
  latency_ms: number | null;
  created_at: string;
  error: string | null;
}

interface FeedbackEntry {
  id: string;
  message: string;
  created_at: string;
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserOut[]>([]);
  const [documents, setDocuments] = useState<DocumentOut[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [tab, setTab] = useState<"stats" | "users" | "documents" | "logs" | "feedback">("stats");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "admin") return;
    Promise.all([
      api.get<AdminStats>("/admin/stats"),
      api.get<UserOut[]>("/admin/users"),
      api.get<DocumentOut[]>("/admin/documents"),
      api.get<LogEntry[]>("/admin/logs?limit=50"),
      api.get<FeedbackEntry[]>("/admin/feedback"),
    ]).then(([s, u, d, l, f]) => {
      setStats(s);
      setUsers(u);
      setDocuments(d);
      setLogs(l);
      setFeedback(f);
      setLoading(false);
    });
  }, [user]);

  async function approveDocument(id: string, status: string) {
    await api.patch(`/admin/documents/${id}/status`, { status });
    const updated = await api.get<DocumentOut[]>("/admin/documents");
    setDocuments(updated);
  }

  if (authLoading || loading) return <Loading />;
  if (user?.role !== "admin") {
    return <EmptyState title="Admin access required" description="You don't have permission to view this page." />;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-serif font-semibold text-white mb-6">Admin Dashboard</h1>

      <div className="flex gap-2 mb-8">
        {(["stats", "users", "documents", "logs", "feedback"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-sm capitalize ${
              tab === t ? "bg-emerald-deep text-white" : "bg-charcoal-light text-white/60"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "stats" && stats && (
        <div className="grid sm:grid-cols-3 gap-4">
          <StatCard label="Total users" value={stats.total_users} />
          <StatCard label="Total documents" value={stats.total_documents} />
          <StatCard label="Conversations" value={stats.total_conversations} />
          <StatCard label="Chat requests" value={stats.total_chat_requests} />
          <StatCard label="Avg chat latency (ms)" value={stats.avg_chat_latency_ms ?? "N/A"} />
          <StatCard label="Feedback items" value={stats.total_feedback} />
        </div>
      )}

      {tab === "users" && (
        <Table
          headers={["Email", "Name", "Role"]}
          rows={users.map((u) => [u.email, u.full_name, u.role])}
          empty="No users yet."
        />
      )}

      {tab === "documents" && (
        <div className="space-y-3">
          {documents.length === 0 ? (
            <EmptyState title="No documents" description="No documents have been uploaded yet." />
          ) : (
            documents.map((d) => (
              <div key={d.id} className="card flex items-center justify-between">
                <div>
                  <p className="text-white">{d.title}</p>
                  <p className="text-white/40 text-xs">{d.status}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => approveDocument(d.id, "approved")} className="text-emerald-400 text-sm hover:underline">
                    Approve
                  </button>
                  <button onClick={() => approveDocument(d.id, "rejected")} className="text-red-400 text-sm hover:underline">
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "logs" && (
        <Table
          headers={["Endpoint", "Latency (ms)", "Error", "Time"]}
          rows={logs.map((l) => [l.endpoint, l.latency_ms?.toFixed(0) ?? "N/A", l.error ?? "-", new Date(l.created_at).toLocaleString()])}
          empty="No AI request logs yet."
        />
      )}

      {tab === "feedback" && (
        <div className="space-y-3">
          {feedback.length === 0 ? (
            <EmptyState title="No feedback" description="No feedback has been submitted yet." />
          ) : (
            feedback.map((f) => (
              <div key={f.id} className="card">
                <p className="text-white/80 text-sm">{f.message}</p>
                <p className="text-white/40 text-xs mt-1">{new Date(f.created_at).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card">
      <p className="text-white/50 text-sm mb-1">{label}</p>
      <p className="text-2xl text-gold font-semibold">{value}</p>
    </div>
  );
}

function Table({ headers, rows, empty }: { headers: string[]; rows: string[][]; empty: string }) {
  if (rows.length === 0) return <EmptyState title="No data" description={empty} />;
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-white/50 border-b border-white/10">
            {headers.map((h) => (
              <th key={h} className="pb-2 pr-4">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-white/5 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="py-2 pr-4 text-white/80">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
