"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Layers, ChevronLeft, ChevronRight } from "lucide-react";
import { getRankings } from "@/lib/api";
import type { ViewRow } from "@/lib/types";
import DataTable from "@/components/DataTable";
import StatusBar from "@/components/StatusBar";

const PAGE_SIZE = 100;

export default function RankingsPage() {
  const router = useRouter();
  const [offset, setOffset] = useState(0);

  const { data, isFetching, error } = useQuery({
    queryKey: ["rankings", offset],
    queryFn: () => getRankings(PAGE_SIZE, offset),
  });

  const handleRow = (row: ViewRow) => {
    const id = row.entity_id ?? row.id;
    if (id) router.push(`/entities/${id}`);
  };

  const total = data?.total ?? 0;
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pages = Math.ceil(total / PAGE_SIZE) || 1;

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <Layers size={16} className="text-terminal-cyan" />
        <h1 className="text-terminal-cyan text-sm font-bold tracking-widest">
          RANKINGS & SCORING LAYERS
        </h1>
        <span className="text-terminal-dim text-xs">v_dfm_rank_with_scoring_layers_v3</span>
      </div>

      {error && (
        <div className="text-terminal-red text-xs panel px-4 py-3">
          ERROR: {String(error)}
        </div>
      )}

      <div className="panel flex-1 overflow-hidden">
        <DataTable data={data?.data ?? []} onRowClick={handleRow} maxHeight="calc(100vh - 220px)" />
      </div>

      <div className="flex items-center justify-between">
        <StatusBar loading={isFetching} message={`${total} rows · RANKINGS`} />
        <div className="flex items-center gap-2 pr-2">
          <button onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))} disabled={offset === 0}
            className="text-terminal-cyan disabled:opacity-30">
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-terminal-secondary">{page}/{pages}</span>
          <button onClick={() => setOffset(offset + PAGE_SIZE)} disabled={offset + PAGE_SIZE >= total}
            className="text-terminal-cyan disabled:opacity-30">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
