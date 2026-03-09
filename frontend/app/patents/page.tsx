"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FlaskConical, ChevronLeft, ChevronRight } from "lucide-react";
import { listPatents, getTechSignals } from "@/lib/api";
import type { ViewRow } from "@/lib/types";
import DataTable from "@/components/DataTable";
import StatusBar from "@/components/StatusBar";

const PAGE_SIZE = 100;

export default function PatentsPage() {
  const router = useRouter();
  const [offset, setOffset] = useState(0);
  const [tab, setTab] = useState<"patents" | "tech">("patents");

  const { data: patents, isFetching: pFetching, error: pError } = useQuery({
    queryKey: ["patents", offset],
    queryFn: () => listPatents({ limit: PAGE_SIZE, offset }),
    enabled: tab === "patents",
  });

  const { data: tech, isFetching: tFetching, error: tError } = useQuery({
    queryKey: ["tech-signals"],
    queryFn: () => getTechSignals({ limit: 500 }),
    enabled: tab === "tech",
  });

  const loading = pFetching || tFetching;
  const error = pError || tError;
  const total = patents?.total ?? 0;
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pages = Math.ceil(total / PAGE_SIZE) || 1;

  const handleRow = (row: ViewRow) => {
    const id = row.entity_id;
    if (id) router.push(`/entities/${id}`);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <FlaskConical size={16} className="text-terminal-cyan" />
        <h1 className="text-terminal-cyan text-sm font-bold tracking-widest">PATENTS & TECHNOLOGY</h1>
        <span className="text-terminal-dim text-xs">
          v_dfm_patent_records_canonical_v1 · v_dfm_entity_tech_from_patents_mv_v1
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-terminal-border">
        {(["patents", "tech"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs tracking-wider border-b-2 transition-colors ${
              tab === t ? "border-terminal-cyan text-terminal-cyan" : "border-transparent text-terminal-secondary hover:text-terminal-text"
            }`}
          >
            {t === "patents" ? "PATENT RECORDS" : "TECH SIGNALS"}
          </button>
        ))}
      </div>

      {error && (
        <div className="text-terminal-red text-xs panel px-4 py-3">ERROR: {String(error)}</div>
      )}

      {tab === "patents" && (
        <>
          <div className="panel flex-1 overflow-hidden">
            <DataTable
              data={patents?.data ?? []}
              onRowClick={handleRow}
              maxHeight="calc(100vh - 260px)"
            />
          </div>
          <div className="flex items-center justify-between">
            <StatusBar loading={loading} message={`${total} patents · v_dfm_patent_records_canonical_v1`} />
            <div className="flex items-center gap-2 pr-2">
              <button onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))} disabled={offset === 0}
                className="text-terminal-cyan disabled:opacity-30"><ChevronLeft size={16} /></button>
              <span className="text-xs text-terminal-secondary">{page}/{pages}</span>
              <button onClick={() => setOffset(offset + PAGE_SIZE)} disabled={offset + PAGE_SIZE >= total}
                className="text-terminal-cyan disabled:opacity-30"><ChevronRight size={16} /></button>
            </div>
          </div>
        </>
      )}

      {tab === "tech" && (
        <>
          <div className="panel flex-1 overflow-hidden">
            <DataTable
              data={tech?.data ?? []}
              columns={["entity_id", "dfm_tech_code", "patent_count"]}
              onRowClick={handleRow}
              maxHeight="calc(100vh - 240px)"
            />
          </div>
          <StatusBar loading={loading} message={`${tech?.total ?? 0} tech signals`} />
        </>
      )}
    </div>
  );
}
