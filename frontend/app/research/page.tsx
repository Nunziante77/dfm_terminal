"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { listResearch } from "@/lib/api";
import type { ViewRow } from "@/lib/types";
import DataTable from "@/components/DataTable";
import StatusBar from "@/components/StatusBar";

const PAGE_SIZE = 100;

export default function ResearchPage() {
  const router = useRouter();
  const [offset, setOffset] = useState(0);
  const [hqCountry, setHqCountry] = useState("");
  const [role, setRole] = useState("");
  const [submitted, setSubmitted] = useState<{ hq_country: string; role: string }>({ hq_country: "", role: "" });

  const { data, isFetching, error } = useQuery({
    queryKey: ["research", offset, submitted],
    queryFn: () =>
      listResearch({
        limit: PAGE_SIZE,
        offset,
        hq_country: submitted.hq_country || undefined,
        role: submitted.role || undefined,
      }),
  });

  const total = data?.total ?? 0;
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pages = Math.ceil(total / PAGE_SIZE) || 1;

  const apply = () => { setSubmitted({ hq_country: hqCountry, role }); setOffset(0); };

  const handleRow = (row: ViewRow) => {
    const id = row.entity_id;
    if (id) router.push(`/entities/${id}`);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <BookOpen size={16} className="text-terminal-cyan" />
        <h1 className="text-terminal-cyan text-sm font-bold tracking-widest">RESEARCH & GRANTS</h1>
        <span className="text-terminal-dim text-xs">v_dfm_entity_research_context_v1</span>
      </div>

      <div className="panel p-3 flex flex-wrap gap-3 items-center">
        <input
          value={hqCountry}
          onChange={(e) => setHqCountry(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="HQ Country…"
          className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-36 placeholder:text-terminal-dim"
        />
        <input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="Role…"
          className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-36 placeholder:text-terminal-dim"
        />
        <button onClick={apply} className="text-terminal-cyan text-xs hover:text-white transition-colors">APPLY</button>
        <div className="flex-1" />
        <span className="text-terminal-secondary text-xs">{total.toLocaleString()} participations</span>
      </div>

      {error && (
        <div className="text-terminal-red text-xs panel px-4 py-3">ERROR: {String(error)}</div>
      )}

      <div className="panel flex-1 overflow-hidden">
        <DataTable
          data={data?.data ?? []}
          columns={["entity_id", "official_name", "hq_country", "project_id", "role", "ec_contribution", "participation_created_at"]}
          onRowClick={handleRow}
          maxHeight="calc(100vh - 250px)"
        />
      </div>

      <div className="flex items-center justify-between">
        <StatusBar loading={isFetching} message={`${total} participations · RESEARCH`} />
        <div className="flex items-center gap-2 pr-2">
          <button onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))} disabled={offset === 0}
            className="text-terminal-cyan disabled:opacity-30"><ChevronLeft size={16} /></button>
          <span className="text-xs text-terminal-secondary">{page}/{pages}</span>
          <button onClick={() => setOffset(offset + PAGE_SIZE)} disabled={offset + PAGE_SIZE >= total}
            className="text-terminal-cyan disabled:opacity-30"><ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}
