"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api, ApiError, DocumentOut } from "@/lib/api";
import { Loading, ErrorBanner, EmptyState } from "@/components/StateViews";

export default function ResearchStudioPage() {
  const { user, loading: authLoading } = useAuth();
  const [documents, setDocuments] = useState<DocumentOut[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ chunk_text: string; page: number | null; document_title: string; score: number }[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  async function loadDocuments() {
    setLoadingDocs(true);
    try {
      const docs = await api.get<DocumentOut[]>("/documents");
      setDocuments(docs);
    } catch {
      setError("Could not load your documents.");
    } finally {
      setLoadingDocs(false);
    }
  }

  useEffect(() => {
    if (user) loadDocuments();
  }, [user]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title.trim()) return;
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    form.append("title", title);
    if (author) form.append("author", author);
    try {
      await api.post("/documents/upload", form);
      setTitle("");
      setAuthor("");
      setFile(null);
      await loadDocuments();
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    await api.del(`/documents/${id}`);
    await loadDocuments();
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    setSearchResults(null);
    try {
      const results = await api.post<typeof searchResults>("/documents/search", { query, top_k: 5 });
      setSearchResults(results);
    } catch (err) {
      setSearchError(err instanceof ApiError ? String(err.detail) : "Search failed.");
    } finally {
      setSearching(false);
    }
  }

  if (authLoading) return <Loading />;
  if (!user) return <EmptyState title="Sign in required" description="Sign in to use the Research Studio." />;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
      <div>
        <h1 className="text-2xl font-serif font-semibold text-white mb-1">Research Studio</h1>
        <p className="text-white/50 text-sm">Upload PDF or TXT documents, then search and ask questions grounded in them.</p>
      </div>

      <section className="card">
        <h2 className="text-gold font-medium mb-4">Upload a document</h2>
        {error && <div className="mb-4"><ErrorBanner message={error} /></div>}
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="label-text">Title</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label-text">Author (optional)</label>
            <input value={author} onChange={(e) => setAuthor(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label-text">File (.pdf or .txt)</label>
            <input
              type="file"
              accept=".pdf,.txt"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="input-field file:mr-3 file:border-0 file:bg-emerald-deep file:text-white file:px-3 file:py-1.5 file:rounded"
            />
          </div>
          <button type="submit" disabled={uploading} className="btn-primary">
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-gold font-medium mb-4">Your documents</h2>
        {loadingDocs ? (
          <Loading />
        ) : documents.length === 0 ? (
          <EmptyState title="No documents yet" description="Upload a PDF or TXT file above to start building your library." />
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="card flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{doc.title}</p>
                  <p className="text-white/50 text-sm">
                    {doc.author ? `${doc.author} · ` : ""}
                    <span
                      className={
                        doc.status === "ready"
                          ? "text-emerald-400"
                          : doc.status === "error_processing"
                          ? "text-amber-400"
                          : "text-white/50"
                      }
                    >
                      {doc.status}
                    </span>
                  </p>
                </div>
                <button onClick={() => handleDelete(doc.id)} className="text-red-400 hover:text-red-300 text-sm">
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-gold font-medium mb-4">Search your documents</h2>
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across your uploaded documents..."
            className="input-field"
          />
          <button type="submit" disabled={searching} className="btn-primary whitespace-nowrap">
            Search
          </button>
        </form>
        {searching && <Loading />}
        {searchError && <ErrorBanner message={searchError} />}
        {searchResults && searchResults.length === 0 && (
          <EmptyState title="No results" description="No relevant passages found. Try a different query or upload more sources." />
        )}
        {searchResults && searchResults.length > 0 && (
          <div className="space-y-3">
            {searchResults.map((r, i) => (
              <div key={i} className="card">
                <p className="text-white/80 text-sm mb-2">{r.chunk_text}</p>
                <p className="text-white/40 text-xs">
                  {r.document_title}
                  {r.page ? `, page ${r.page}` : ""} · relevance {Math.round(r.score * 100)}%
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
