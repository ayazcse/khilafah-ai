"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { api, ApiError, DocumentOut } from "@/lib/api";
import { Loading, EmptyState } from "@/components/StateViews";

type SearchResult = { chunk_text: string; page: number | null; document_title: string; score: number };

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
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadDocuments() {
    setLoadingDocs(true);
    try { setDocuments(await api.get<DocumentOut[]>("/documents")); }
    catch { setError("Could not load your source library."); }
    finally { setLoadingDocs(false); }
  }
  useEffect(() => { if (user) void loadDocuments(); }, [user]);

  function chooseFile(next: File | undefined) {
    if (!next) return;
    if (!/\.(pdf|txt)$/i.test(next.name)) {
      setError("The source library currently supports searchable PDF and TXT files. For image analysis, open AI Research and attach PNG, JPG or WEBP files.");
      return;
    }
    setFile(next);
    if (!title.trim()) setTitle(next.name.replace(/\.[^.]+$/, ""));
    setError(null);
  }
  async function handleUpload(event: React.FormEvent) {
    event.preventDefault();
    if (!file || !title.trim()) return;
    setUploading(true); setError(null);
    const form = new FormData();
    form.append("file", file); form.append("title", title);
    if (author) form.append("author", author);
    try {
      await api.post("/documents/upload", form);
      setTitle(""); setAuthor(""); setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      await loadDocuments();
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : "Upload failed.");
    } finally { setUploading(false); }
  }
  async function handleDelete(id: string) {
    if (!window.confirm("Delete this source from your library?")) return;
    try { await api.del("/documents/" + id); await loadDocuments(); }
    catch { setError("Could not delete this source. Please try again."); }
  }
  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setSearching(true); setSearchError(null); setSearchResults(null);
    try {
      const results = await api.post<SearchResult[]>("/documents/search", { query, top_k: 6 });
      setSearchResults(results);
    } catch (err) {
      setSearchError(err instanceof ApiError ? String(err.detail) : "Search failed.");
    } finally { setSearching(false); }
  }

  if (authLoading) return <Loading />;
  if (!user) return <EmptyState title="Sign in required" description="Sign in to use the Research Studio." />;

  return (
    <div className="source-studio">
      <div className="source-studio-inner">
        <header className="source-hero">
          <div><div className="source-eyebrow">KHILAFAH AI · KNOWLEDGE WORKSPACE</div><h1>Your sources.<br /><em>Your research edge.</em></h1><p>Build a private research library, find relevant passages, and bring source material into your AI conversations.</p><div className="source-hero-actions"><a href="#upload-source">＋ Add a source</a><Link href="/chat">Open AI Research ↗</Link></div></div>
          <div className="source-hero-art"><div className="source-art-ring ring-one" /><div className="source-art-ring ring-two" /><div className="source-art-book">▤</div><span>RESEARCH<br />LIBRARY</span></div>
        </header>

        <div className="source-stats">
          <div><span>LIBRARY ITEMS</span><strong>{documents.length}</strong><small>Private to your account</small></div>
          <div><span>SEARCHABLE SOURCES</span><strong>{documents.filter((doc) => doc.status === "ready").length}</strong><small>Processed and indexed</small></div>
          <div><span>SUPPORTED LIBRARY FILES</span><strong>PDF · TXT</strong><small>Image analysis is available in AI chat</small></div>
        </div>

        <section className="source-section-grid">
          <section className="source-panel source-upload-panel" id="upload-source">
            <div className="source-panel-heading"><div><span className="source-eyebrow">01 · EXPAND YOUR LIBRARY</span><h2>Add a research source</h2><p>Upload documents you want to search again in future sessions.</p></div><span className="source-panel-icon">＋</span></div>
            {error && <div className="source-error" role="alert">{error}</div>}
            <form onSubmit={handleUpload} className="source-upload-form">
              <label className="source-label">Document title<input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. The Muqaddimah — selected chapters" /></label>
              <label className="source-label">Author <span>(optional)</span><input value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="Author or editor" /></label>
              <input ref={fileRef} type="file" accept=".pdf,.txt,application/pdf,text/plain" className="sr-only" onChange={(event) => chooseFile(event.target.files?.[0])} />
              <button type="button" className={dragging ? "source-dropzone dragging" : "source-dropzone"} onClick={() => fileRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files?.[0]); }}>
                <span className="source-drop-icon">⇧</span><strong>{file ? file.name : "Drop your document here"}</strong><small>{file ? (file.size / 1024 / 1024).toFixed(1) + " MB · ready to upload" : "or click to browse · PDF or TXT · max 20 MB"}</small>
              </button>
              <button type="submit" disabled={!file || !title.trim() || uploading} className="source-submit">{uploading ? "Processing source…" : "Add to my library"} <span>↗</span></button>
            </form>
            <div className="source-private-note">⌑ Your uploaded library is scoped to your account.</div>
          </section>

          <section className="source-panel source-search-panel">
            <div className="source-panel-heading"><div><span className="source-eyebrow">02 · FIND THE EVIDENCE</span><h2>Search your sources</h2><p>Find relevant passages across your indexed documents.</p></div><span className="source-panel-icon">⌕</span></div>
            <form className="source-search-form" onSubmit={handleSearch}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ask about a person, place, event or idea…" /><button type="submit" disabled={searching || !query.trim()}>{searching ? "Searching…" : "Search"}</button></form>
            <div className="source-search-tip"><span>✧</span> Try specific questions for more useful passages and context.</div>
            {searchError && <div className="source-error">{searchError}</div>}
            {searching && <div className="source-search-loading"><span /> Searching your indexed sources…</div>}
            {searchResults && <div className="source-results">
              <div className="source-results-head">{searchResults.length} relevant passage{searchResults.length === 1 ? "" : "s"} found</div>
              {searchResults.length === 0 ? <p className="source-no-results">No relevant passages found. Try another phrase or add more sources.</p> : searchResults.map((result, index) => <article className="source-result" key={index}><div className="source-result-meta"><strong>{result.document_title}</strong><span>{result.page ? "PAGE " + result.page : "TEXT SOURCE"} · {Math.round(result.score * 100)}% MATCH</span></div><p>{result.chunk_text}</p></article>)}
            </div>}
            {!searchResults && !searching && <div className="source-search-empty"><span>⌕</span><strong>Evidence starts with a question</strong><small>Search results from your own documents will appear here.</small></div>}
          </section>
        </section>

        <section className="source-library-section">
          <div className="source-library-heading"><div><span className="source-eyebrow">03 · YOUR PRIVATE COLLECTION</span><h2>Source library</h2><p>Manage the material you've added to KHILAFAH AI.</p></div><span>{documents.length} ITEMS</span></div>
          {loadingDocs ? <Loading /> : documents.length === 0 ? <div className="source-empty-library"><span>▤</span><strong>Your library is ready for its first source.</strong><small>Add a PDF or TXT document above to start building your searchable collection.</small></div> : <div className="source-document-grid">
            {documents.map((doc) => <article className="source-document-card" key={doc.id}><div className="source-document-top"><span className="source-file-icon">▤</span><span className={doc.status === "ready" ? "source-status ready" : doc.status === "error_processing" ? "source-status error" : "source-status"}>{doc.status.replace("_", " ")}</span></div><h3>{doc.title}</h3><p>{doc.author || doc.filename}</p><div className="source-document-footer"><span>{new Date(doc.created_at).toLocaleDateString()}</span><button onClick={() => void handleDelete(doc.id)}>Remove</button></div></article>)}
          </div>}
        </section>
        <footer className="source-footer"><span>KHILAFAH AI · RESEARCH WORKSPACE</span><span>AI Research can analyse PDF, TXT and image attachments directly in chat. <Link href="/chat">Go to chat ↗</Link></span></footer>
      </div>
    </div>
  );
}
