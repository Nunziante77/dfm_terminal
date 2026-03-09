"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { getProcurement } from "@/lib/api";
import DataTable from "@/components/DataTable";
import StatusBar from "@/components/StatusBar";

const PAGE_SIZE = 50;

export default function ProcurementPage() {
  const [offset, setOffset] = useState(0);
  const [entityId, setEntityId] = useState("");
  const [submitted, setSubmitted] = useState("");

  const { data, isFetching, error } = useQuery({
    queryKey: ["procurement", offset, submitted],
    queryFn: () => getProcurement({ entity_id: submitted || undefined, limit: PAGE_SIZE, offset }),
  });

  const total = data?.total ?? 0;
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pages = Math.ceil(total / PAGE_SIZE) || 1;

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <ShoppingCart size={16} className="text-terminal-cyan" />
        <h1 className="text-terminal-cyan text-sm font-bold tracking-widest">PROCUREMENT INTELLIGENCE</h1>
        <span className="text-terminal-dim text-xs">v_dfm_bloomberg_screener_v3</span>
      </div>

      <div className="panel p-3 flex items-center gap-3">
        <input
          value={entityId}
          onChange={(e) => setEntityId(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { setSubmitted(entityId); setOffset(0); } }}
          placeholder="Filter by Entity ID… (Enter)"
          className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-56 placeholder:text-terminal-dim"
        />
        <button onClick={() => { setSubmitted(entityId); setOffset(0); }}
          className="text-terminal-cyan text-xs hover:text-white transition-colors">
          APPLY
        </button>
        {submitted && (
          <button onClick={() => { setSubmitted(""); setEntityId(""); setOffset(0); }}
            className="text-terminal-dim text-xs hover:text-terminal-text">
            CLEAR
          </button>
        )}
        <div className="flex-1" />
        <span className="text-terminal-secondary text-xs">{total.toLocaleString()} records</span>
      </div>

      {error && (
        <div className="text-terminal-red text-xs panel px-4 py-3">ERROR: {String(error)}</div>
      )}

      <div className="panel flex-1 overflow-hidden">
        <DataTable data={data?.data ?? []} maxHeight="calc(100vh - 270px)" />
      </div>

      <div className="flex items-center justify-between">
        <StatusBar loading={isFetching} message={`${total} records · PROCUREMENT`} />
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
