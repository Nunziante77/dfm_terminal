"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { getScreener } from "@/lib/api";
import type { ViewRow } from "@/lib/types";
import DataTable from "@/components/DataTable";
import StatusBar from "@/components/StatusBar";

const PAGE_SIZE = 50;

export default function ScreenerPage() {
  const router = useRouter();
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [sector, setSector] = useState("");
  const [liveSearch, setLiveSearch] = useState("");

  const { data, isFetching, error } = useQuery({
    queryKey: ["screener", offset, sortBy, sortDir, sector, liveSearch],
    queryFn: () =>
      getScreener({ limit: PAGE_SIZE, offset, sort_by: sortBy, sort_dir: sortDir, sector, search: liveSearch }),
  });

  const handleRow = (row: ViewRow) => {
    const id = row.entity_id ?? row.id;
    if (id) router.push(`/entities/${id}`);
  };

  const total = data?.total ?? 0;
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <SlidersHorizontal size={16} className="text-terminal-cyan" />
        <h1 className="text-terminal-cyan text-sm font-bold tracking-widest">
          BLOOMBERG SCREENER
        </h1>
        <span className="text-terminal-dim text-xs">v_dfm_bloomberg_screener_v3</span>
      </div>

      {/* Filters */}
      <div className="panel p-3 flex flex-wrap gap-3 items-center">
        <input
          value={liveSearch}
          onChange={(e) => { setLiveSearch(e.target.value); setOffset(0); }}
          placeholder="Filter by name…"
          className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-48 placeholder:text-terminal-dim"
        />
        <input
          value={sector}
          onChange={(e) => { setSector(e.target.value); setOffset(0); }}
          placeholder="Sector…"
          className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-32 placeholder:text-terminal-dim"
        />
        <select
          value={sortDir}
          onChange={(e) => setSortDir(e.target.value as "asc" | "desc")}
          className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none"
        >
          <option value="asc">ASC</option>
          <option value="desc">DESC</option>
        </select>
        <div className="flex-1" />
        <span className="text-terminal-secondary text-xs">
          {total.toLocaleString()} entities · page {page}/{pages}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="text-terminal-red text-xs panel px-4 py-3">
          ERROR: {String(error)}
        </div>
      )}

      {/* Table */}
      <div className="panel flex-1 overflow-hidden">
        <DataTable
          data={data?.data ?? []}
          onRowClick={handleRow}
          maxHeight="calc(100vh - 280px)"
        />
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <StatusBar loading={isFetching} message={`${total} rows · SCREENER`} />
        <div className="flex items-center gap-2 pr-2">
          <button
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            disabled={offset === 0}
            className="text-terminal-cyan disabled:opacity-30 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-terminal-secondary">{page} / {pages}</span>
          <button
            onClick={() => setOffset(offset + PAGE_SIZE)}
            disabled={offset + PAGE_SIZE >= total}
            className="text-terminal-cyan disabled:opacity-30 hover:text-white transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
