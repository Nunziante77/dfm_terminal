"use client";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Search } from "lucide-react";
import { getScreener } from "@/lib/api";
import type { ViewRow } from "@/lib/types";

export interface SelectedEntity {
  id: string;
  name: string;
}

interface Props {
  selected: SelectedEntity[];
  onChange: (entities: SelectedEntity[]) => void;
  max?: number;
  placeholder?: string;
}

export default function EntityPicker({ selected, onChange, max = 10, placeholder = "Search entity by name…" }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, isFetching } = useQuery({
    queryKey: ["entity-picker-search", query],
    queryFn: () => getScreener({ search: query, limit: 8 }),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
  });

  const results = (data?.data ?? []).filter(
    (r) => !selected.some((s) => s.id === String(r.entity_id ?? ""))
  );

  const select = (row: ViewRow) => {
    const id = String(row.entity_id ?? "");
    const name = String(row.official_name ?? id);
    if (!id) return;
    onChange([...selected, { id, name }]);
    setQuery("");
    setOpen(false);
  };

  const remove = (id: string) => onChange(selected.filter((s) => s.id !== id));

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map(({ id, name }) => (
            <span
              key={id}
              className="inline-flex items-center gap-1 bg-terminal-muted border border-terminal-cyan text-terminal-cyan text-[10px] font-mono px-2 py-0.5 rounded-sm"
            >
              <span className="max-w-[180px] truncate" title={name}>{name}</span>
              <button
                onClick={() => remove(id)}
                className="text-terminal-dim hover:text-terminal-red ml-0.5 shrink-0"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input — hidden when at max */}
      {selected.length < max && (
        <div className="relative">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-terminal-dim pointer-events-none" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => query.trim().length >= 2 && setOpen(true)}
            placeholder={placeholder}
            className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs pl-7 pr-7 py-1.5 outline-none w-64 placeholder:text-terminal-dim focus:border-terminal-cyan transition-colors"
          />
          {isFetching && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-terminal-orange text-[9px] animate-pulse">…</span>
          )}
        </div>
      )}

      {/* Dropdown results */}
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-terminal-panel border border-terminal-border z-50 shadow-2xl">
          {results.map((row, i) => (
            <button
              key={i}
              onMouseDown={(e) => { e.preventDefault(); select(row); }}
              className="w-full flex items-start gap-3 px-3 py-2 text-left hover:bg-terminal-muted transition-colors border-b border-terminal-muted last:border-0"
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs text-terminal-text truncate">{String(row.official_name ?? "—")}</div>
                <div className="text-[10px] text-terminal-dim font-mono mt-0.5 flex gap-3">
                  <span className="text-terminal-secondary">{String(row.entity_id ?? "")}</span>
                  {row.hq_country && <span>{String(row.hq_country)}</span>}
                  {row.ownership_status && <span>{String(row.ownership_status)}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && query.trim().length >= 2 && !isFetching && results.length === 0 && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-terminal-panel border border-terminal-border z-50 px-3 py-2 text-xs text-terminal-dim">
          NO MATCH
        </div>
      )}
    </div>
  );
}
