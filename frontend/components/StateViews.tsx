export function Loading({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-white/50">
      <div className="animate-spin rounded-full h-5 w-5 border-2 border-gold border-t-transparent mr-3" />
      {label}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="card text-center py-12">
      <p className="text-white/80 font-medium mb-2">{title}</p>
      <p className="text-white/50 text-sm max-w-md mx-auto">{description}</p>
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-red-900/20 border border-red-700/40 text-red-200 rounded-lg px-4 py-3 text-sm">
      {message}
    </div>
  );
}

export function EvidenceBadge({ level }: { level: string }) {
  const classMap: Record<string, string> = {
    established: "badge-established",
    disputed: "badge-disputed",
    academic_interpretation: "badge-academic",
    hypothetical_simulation: "badge-hypothetical",
  };
  const labelMap: Record<string, string> = {
    established: "Established",
    disputed: "Disputed",
    academic_interpretation: "Academic Interpretation",
    hypothetical_simulation: "Hypothetical Simulation",
  };
  return <span className={`badge ${classMap[level] || "badge-academic"}`}>{labelMap[level] || level}</span>;
}
