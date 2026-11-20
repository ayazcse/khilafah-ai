/**
 * Single typed API client. Every page imports from here rather than calling
 * fetch() directly, per the project's integration contract.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export class ApiError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, detail: unknown) {
    super(typeof detail === "string" ? detail : JSON.stringify(detail));
    this.status = status;
    this.detail = detail;
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem("khilafah_token");
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem("khilafah_token", token);
    else window.localStorage.removeItem("khilafah_token");
  } catch {
    /* ignore storage errors (private browsing, etc.) */
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 204) return undefined as T;

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    const detail =
      body && typeof body === "object" && "detail" in (body as Record<string, unknown>)
        ? (body as Record<string, unknown>).detail
        : body;
    throw new ApiError(res.status, detail);
  }

  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: data instanceof FormData ? data : JSON.stringify(data ?? {}),
    }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(data ?? {}) }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

// ---------- Typed response shapes (mirrors backend/app/schemas.py) ----------

export interface UserOut {
  id: string;
  email: string;
  full_name: string;
  role: "user" | "admin";
}

export interface Citation {
  source_id: string;
  title: string;
  author?: string | null;
  page?: number | null;
  source_type?: string | null;
}

export interface AgentTraceStep {
  agent: string;
  summary: string;
}

export interface ChatResponse {
  conversation_id: string;
  answer: string;
  citations: Citation[];
  agent_trace: AgentTraceStep[];
  uncertainty_note?: string | null;
}

export interface DocumentOut {
  id: string;
  title: string;
  author?: string | null;
  source_type?: string | null;
  language?: string | null;
  historical_period?: string | null;
  filename: string;
  status: string;
  created_at: string;
}

export interface GovernanceTopic {
  id: string;
  title: string;
  summary: string;
  description: string;
  evidence_level: string;
  sources: string[];
  period?: string | null;
}

export interface ZakatResponse {
  zakatable_wealth: number;
  nisab_threshold: number;
  meets_nisab: boolean;
  zakat_due: number;
  rate: number;
  assumptions: string[];
  disclaimer: string;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  lesson_ids: string[];
}

export interface Lesson {
  id: string;
  path_id: string;
  title: string;
  content: string;
  quiz: { id: string; question: string; options: string[]; correct_index: number; source: string }[] | null;
}

export interface GraphResponse {
  nodes: { id: string; label: string; type: string }[];
  edges: { source: string; target: string; type: string }[];
  degraded: boolean;
  message?: string | null;
}

export interface AdminStats {
  total_users: number;
  total_documents: number;
  total_conversations: number;
  total_chat_requests: number;
  avg_chat_latency_ms: number | null;
  total_feedback: number;
}
