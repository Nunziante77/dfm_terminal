"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Globe2, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { listOwnership, listFdiSignals, getFdiWorkflow } from "@/lib/api";
import type { ViewRow } from "@/lib/types";
import DataTable from "@/components/DataTable";
import StatusBar from "@/components/StatusBar";

const PAGE_SIZE = 100;
type Tab = "ownership" | "fdi" | "workflow";

export default function OwnershipPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("ownership");
  const [offset, setOffset] = useState(0);
  const [escalationOnly, setEscalationOnly] = useState(false);

  const { data: ownership, isFetching: owFetching, error: owError } = useQuery({
    queryKey: ["ownership", offset],
    queryFn: () => listOwnership({ limit: PAGE_SIZE, offset }),
    enabled: tab === "ownership",
  });

  const { data: fdi, isFetching: fdiFetching, error: fdiError } = useQuery({
    queryKey: ["fdi", offset, escalationOnly],
    queryFn: () => listFdiSignals({ limit: PAGE_SIZE, offset, fdi_escalation_flag_canonical: escalationOnly || undefined }),
    enabled: tab === "fdi",
  });

  const { data: workflow, isFetching: wfFetching, error: wfError } = useQuery({
    queryKey: ["fdi-workflow", offset, escalationOnly],
    queryFn: () => getFdiWorkflow({ fdi_escalation_flag: escalationOnly || undefined, limit: PAGE_SIZE }),
    enabled: tab === "workflow",
  });

  const loading = owFetching || fdiFetching || wfFetching;
  const error = owError || fdiError || wfError;

  const currentData = tab === "ownership" ? ownership?.data : tab === "fdi" ? fdi?.data : workflow?.data;
  const total = (tab === "ownership" ? ownership?.total : tab === "fdi" ? fdi?.total : workflow?.total) ?? 0;
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pages = Math.ceil(total / PAGE_SIZE) || 1;

  const handleRow = (row: ViewRow) => {
    if (row.entity_id) router.push(`/entities/${row.entity_id}`);
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: "ownership", label: "OWNERSHIP" },
    { key: "fdi", label: "FDI SIGNALS" },
    { key: "workflow", label: "REGULATORY WORKFLOW" },
  ];

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <Globe2 size={16} className="text-terminal-cyan" />
        <h1 className="text-terminal-cyan text-sm font-bold tracking-widest">OWNERSHIP & FDI</h1>
        <span className="text-terminal-dim text-xs">
          v_entity_ownership_aggregated_v2 · v_entity_fdi_signal_v1 · v_fdi_regulatory_workflow_final
        </span>
      </div>

      <div className="flex border-b border-terminal-border items-center gap-4">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => { setTab(key); setOffset(0); }}
            className={`px-4 py-2 text-xs tracking-wider border-b-2 transition-colors ${
              tab === key ? "border-terminal-cyan text-terminal-cyan" : "border-transparent text-terminal-secondary hover:text-terminal-text"
            }`}>
            {label}
          </button>
        ))}
        <div className="flex-1" />
        {(tab === "fdi" || tab === "workflow") && (
          <label className="flex items-center gap-2 text-xs text-terminal-secondary cursor-pointer mr-2">
            <input
              type="checkbox"
              checked={escalationOnly}
              onChange={(e) => { setEscalationOnly(e.target.checked); setOffset(0); }}
              className="accent-terminal-orange"
            />
            <AlertTriangle size={11} className="text-terminal-orange" />
            ESCALATION ONLY
          </label>
        )}
      </div>

      {error && <div className="text-terminal-red text-xs panel px-4 py-3">ERROR: {String(error)}</div>}

      <div className="panel flex-1 overflow-hidden">
        <DataTable
          data={currentData ?? []}
          onRowClick={handleRow}
          maxHeight="calc(100vh - 240px)"
        />
      </div>

      <div className="flex items-center justify-between">
        <StatusBar loading={loading} message={`${total} records · ${tab.toUpperCase()}`} />
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
