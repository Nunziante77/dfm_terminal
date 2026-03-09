"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";
import { unifiedSearch } from "@/lib/api";
import type { SearchResponse, ViewRow } from "@/lib/types";

const DOMAIN_LABELS: Record<string, string> = {
  entities:    "ENTITIES",
  patents:     "PATENTS",
  procurement: "PROCUREMENT",
  normative:   "NORMATIVE",
  strategic:   "STRATEGIC",
};

function ResultSection({
  label,
  rows,
  onRowClick,
}: {
  label: string;
  rows: ViewRow[];
  onRowClick?: (r: ViewRow) => void;
}) {
  if (!rows.length) return null;
  const keys = Object.keys(rows[0]).slice(0, 6);
  return (
    <div className="mb-4">
      <div className="px-4 py-1 border-b border-terminal-border bg-terminal-muted">
        <span className="text-terminal-cyan text-xs font-bold tracking-widest">{label}</span>
        <span className="text-terminal-dim text-xs ml-2">({rows.length})</span>
      </div>
      <table className="w-full text-xs font-mono">
        <thead>
          <tr>
            {keys.map((k) => (
              <th key={k} className="px-3 py-1 text-left text-terminal-secondary border-b border-terminal-muted font-normal">
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-terminal-muted transition-colors ${onRowClick ? "cursor-pointer hover:bg-terminal-muted" : ""}`}
            >
              {keys.map((k) => (
                <td key={k} className="px-3 py-1 text-terminal-text truncate max-w-xs">
                  {row[k] == null ? "—" : String(row[k])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const router = useRouter();

  const { data, isFetching, error } = useQuery<SearchResponse>({
    queryKey: ["unified-search", submitted],
    queryFn: () => unifiedSearch(submitted, 20),
    enabled: submitted.length > 0,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) setSubmitted(query.trim());
  };

  const handleEntityClick = (row: ViewRow) => {
    const id = row.entity_id ?? row.id;
    if (id) router.push(`/entities/${id}`);
  };

  const handleDocClick = (row: ViewRow, base: string) => {
    const id = row.doc_id ?? row.id;
    if (id) router.push(`/${base}/${id}`);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 mt-4">
        <h1 className="text-terminal-cyan text-2xl font-bold tracking-widest mb-1">
          DFM TERMINAL
        </h1>
        <p className="text-terminal-secondary text-xs tracking-wide">
          Strategic intelligence · NATO/EU defence industrial alignment · Knowledge graph exploration
        </p>
      </div>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex items-center gap-2 panel px-4 py-3">
          <Search size={16} className="text-terminal-cyan shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search entities, patents, procurement, normative documents…"
            autoFocus
            className="flex-1 bg-transparent text-terminal-text placeholder:text-terminal-dim outline-none text-sm"
          />
          <button
            type="submit"
            disabled={!query.trim()}
            className="flex items-center gap-1 text-xs text-terminal-cyan hover:text-white disabled:opacity-30 transition-colors"
          >
            SEARCH <ArrowRight size={13} />
          </button>
        </div>
      </form>

      {isFetching && (
        <div className="text-terminal-orange text-xs tracking-widest animate-pulse mb-4">
          QUERYING dfm_db_semantic…
        </div>
      )}
      {error && (
        <div className="text-terminal-red text-xs panel px-4 py-3 mb-4">
          ERROR: {String(error)}
        </div>
      )}

      {data && (
        <div className="panel mb-6">
          <div className="px-4 py-2 border-b border-terminal-border flex items-center justify-between">
            <span className="text-terminal-cyan text-xs tracking-widest">RESULTS</span>
            <span className="text-terminal-dim text-xs">
              {data.total} results · &quot;{data.query}&quot;
            </span>
          </div>
          <ResultSection
            label={DOMAIN_LABELS.entities}
            rows={data.results.entities ?? []}
            onRowClick={handleEntityClick}
          />
          <ResultSection
            label={DOMAIN_LABELS.patents}
            rows={data.results.patents ?? []}
          />
          <ResultSection
            label={DOMAIN_LABELS.procurement}
            rows={data.results.procurement ?? []}
            onRowClick={(r) => { if (r.entity_id) router.push(`/entities/${r.entity_id}`); }}
          />
          <ResultSection
            label={DOMAIN_LABELS.normative}
            rows={data.results.normative ?? []}
            onRowClick={(r) => handleDocClick(r, "normative")}
          />
          <ResultSection
            label={DOMAIN_LABELS.strategic}
            rows={data.results.strategic ?? []}
            onRowClick={(r) => handleDocClick(r, "strategic")}
          />
          {data.total === 0 && (
            <div className="px-4 py-6 text-terminal-dim text-xs text-center tracking-widest">
              NO RESULTS
            </div>
          )}
        </div>
      )}

      {!submitted && (
        <div className="mt-10 grid grid-cols-3 gap-3 text-xs">
          {[
            { label: "SCREENER",        desc: "Bloomberg-style entity screening",       href: "/screener" },
            { label: "RANKINGS",        desc: "Multi-layer strategic scoring",          href: "/rankings" },
            { label: "PRIORITIES",      desc: "Strategic priority tree & alignment",    href: "/priorities" },
            { label: "KNOWLEDGE GRAPH", desc: "Entity relationship network",            href: "/graph" },
            { label: "NORMATIVE",       desc: "Regulatory admissibility & atoms",       href: "/normative" },
            { label: "PROCUREMENT",     desc: "Contract & award intelligence",          href: "/procurement" },
            { label: "PATENTS",         desc: "Technology & patent signals",            href: "/patents" },
            { label: "OWNERSHIP",       desc: "FDI screening & regulatory workflow",    href: "/ownership" },
            { label: "COMPLIANCE",      desc: "Entity-level admissibility matrix",      href: "/compliance" },
          ].map(({ label, desc, href }) => (
            <a
              key={href}
              href={href}
              className="panel p-4 hover:border-terminal-cyan transition-colors group"
            >
              <div className="text-terminal-cyan font-semibold tracking-wider mb-1">
                {label}
              </div>
              <div className="text-terminal-secondary">{desc}</div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
