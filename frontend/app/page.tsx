"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";
import { searchEntities } from "@/lib/api";
import type { ViewRow } from "@/lib/types";
import DataTable from "@/components/DataTable";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const router = useRouter();

  const { data, isFetching, error } = useQuery({
    queryKey: ["search", submitted],
    queryFn: () => searchEntities(submitted, 30),
    enabled: submitted.length > 0,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) setSubmitted(query.trim());
  };

  const handleRowClick = (row: ViewRow) => {
    const id = row.entity_id ?? row.id;
    if (id) router.push(`/entities/${id}`);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 mt-4">
        <h1 className="text-terminal-cyan text-2xl font-bold tracking-widest mb-1">
          DFM TERMINAL
        </h1>
        <p className="text-terminal-secondary text-xs tracking-wide">
          Bloomberg screening · Defense industrial intelligence · Knowledge graph exploration
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex items-center gap-2 panel px-4 py-3">
          <Search size={16} className="text-terminal-cyan shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search entities, sectors, programs…"
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

      {/* Results */}
      {isFetching && (
        <div className="text-terminal-orange text-xs tracking-widest animate-pulse">
          QUERYING dfm_db_semantic…
        </div>
      )}
      {error && (
        <div className="text-terminal-red text-xs panel px-4 py-3">
          ERROR: {String(error)}
        </div>
      )}
      {data && (
        <div className="panel">
          <div className="px-4 py-2 border-b border-terminal-border flex items-center justify-between">
            <span className="text-terminal-cyan text-xs tracking-widest">
              RESULTS
            </span>
            <span className="text-terminal-dim text-xs">
              {data.total} entities · query: &quot;{data.query}&quot;
            </span>
          </div>
          <DataTable
            data={data.data}
            onRowClick={handleRowClick}
            maxHeight="60vh"
          />
        </div>
      )}

      {!submitted && (
        <div className="mt-10 grid grid-cols-3 gap-3 text-xs">
          {[
            { label: "SCREENER", desc: "Bloomberg-style entity screening", href: "/screener" },
            { label: "KNOWLEDGE GRAPH", desc: "Explore entity relationships", href: "/graph" },
            { label: "RANKINGS", desc: "Multi-layer scoring & ranking", href: "/rankings" },
            { label: "PRIORITIES", desc: "Strategic priority tree", href: "/priorities" },
            { label: "PROCUREMENT", desc: "Contract & award intelligence", href: "/procurement" },
            { label: "COMPLIANCE", desc: "Regulatory compliance data", href: "/compliance" },
          ].map(({ label, desc, href }) => (
            <a
              key={href}
              href={href}
              className="panel p-4 hover:border-terminal-cyan transition-colors group"
            >
              <div className="text-terminal-cyan font-semibold tracking-wider mb-1 group-hover:glow-cyan">
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
