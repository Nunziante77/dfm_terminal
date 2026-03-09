"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { listStrategicDocuments } from "@/lib/api";
import type { ViewRow } from "@/lib/types";
import DataTable from "@/components/DataTable";
import StatusBar from "@/components/StatusBar";

const PAGE_SIZE = 50;

export default function StrategicPage() {
  const router = useRouter();
  const [offset, setOffset] = useState(0);
  const [issuer, setIssuer] = useState("");
  const [strategicLevel, setStrategicLevel] = useState("");
  const [layerClass, setLayerClass] = useState("");
  const [submitted, setSubmitted] = useState({ issuer: "", strategic_level: "", layer_class: "" });

  const { data, isFetching, error } = useQuery({
    queryKey: ["strategic-docs", offset, submitted],
    queryFn: () =>
      listStrategicDocuments({
        limit: PAGE_SIZE,
        offset,
        issuer: submitted.issuer || undefined,
        strategic_level: submitted.strategic_level || undefined,
        layer_class: submitted.layer_class || undefined,
      }),
  });

  const apply = () => {
    setSubmitted({ issuer, strategic_level: strategicLevel, layer_class: layerClass });
    setOffset(0);
  };

  const total = data?.total ?? 0;
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pages = Math.ceil(total / PAGE_SIZE) || 1;

  const handleRow = (row: ViewRow) => {
    if (row.doc_id) router.push(`/strategic/${row.doc_id}`);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <Shield size={16} className="text-terminal-cyan" />
        <h1 className="text-terminal-cyan text-sm font-bold tracking-widest">STRATEGIC DOCUMENTS</h1>
        <span className="text-terminal-dim text-xs">dfm_strategic_documents · dfm_strategic_atoms</span>
      </div>

      <div className="panel p-3 flex flex-wrap gap-3 items-center">
        <input value={issuer} onChange={(e) => setIssuer(e.target.value)} onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="Issuer…"
          className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-36 placeholder:text-terminal-dim" />
        <input value={strategicLevel} onChange={(e) => setStrategicLevel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="Strategic level…"
          className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-36 placeholder:text-terminal-dim" />
        <input value={layerClass} onChange={(e) => setLayerClass(e.target.value)} onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="Layer class…"
          className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-28 placeholder:text-terminal-dim" />
        <button onClick={apply} className="text-terminal-cyan text-xs hover:text-white">APPLY</button>
        <div className="flex-1" />
        <span className="text-terminal-secondary text-xs">{total.toLocaleString()} documents</span>
      </div>

      {error && <div className="text-terminal-red text-xs panel px-4 py-3">ERROR: {String(error)}</div>}

      <div className="panel flex-1 overflow-hidden">
        <DataTable
          data={data?.data ?? []}
          columns={["doc_id", "issuer", "doc_type", "strategic_level", "geographic_scope", "published_date", "layer_class"]}
          onRowClick={handleRow}
          maxHeight="calc(100vh - 250px)"
        />
      </div>

      <div className="flex items-center justify-between">
        <StatusBar loading={isFetching} message={`${total} documents · STRATEGIC`} />
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
