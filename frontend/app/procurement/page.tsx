"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { listProcurement, listLinkedAwards, getProcurementSummary, getProcurementSignals } from "@/lib/api";
import type { ViewRow } from "@/lib/types";
import DataTable from "@/components/DataTable";
import StatusBar from "@/components/StatusBar";

const PAGE_SIZE = 50;
type Tab = "notices" | "linked" | "summary" | "signals";

export default function ProcurementPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("linked");
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [cpv, setCpv] = useState("");
  const [submitted, setSubmitted] = useState({ search: "", country: "", cpv: "" });

  const apply = () => { setSubmitted({ search, country, cpv }); setOffset(0); };

  const { data: notices, isFetching: nFetching } = useQuery({
    queryKey: ["procurement-notices", offset, submitted],
    queryFn: () => listProcurement({ limit: PAGE_SIZE, offset, search: submitted.search || undefined, country_code: submitted.country || undefined, cpv_main: submitted.cpv || undefined }),
    enabled: tab === "notices",
  });

  const { data: linked, isFetching: lFetching } = useQuery({
    queryKey: ["procurement-linked", offset, submitted],
    queryFn: () => listLinkedAwards({ limit: PAGE_SIZE, offset, country_code: submitted.country || undefined }),
    enabled: tab === "linked",
  });

  const { data: summary, isFetching: sFetching } = useQuery({
    queryKey: ["procurement-summary", offset],
    queryFn: () => getProcurementSummary({ limit: PAGE_SIZE, offset }),
    enabled: tab === "summary",
  });

  const { data: signals, isFetching: sigFetching } = useQuery({
    queryKey: ["procurement-signals"],
    queryFn: getProcurementSignals,
    enabled: tab === "signals",
  });

  const loading = nFetching || lFetching || sFetching || sigFetching;

  const currentData = tab === "notices" ? notices?.data : tab === "linked" ? linked?.data : tab === "summary" ? summary?.data : signals?.data;
  const total = (tab === "notices" ? notices?.total : tab === "linked" ? linked?.total : tab === "summary" ? summary?.total : signals?.total) ?? 0;
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pages = Math.ceil(total / PAGE_SIZE) || 1;

  const handleRow = (row: ViewRow) => {
    if (row.entity_id) router.push(`/entities/${row.entity_id}`);
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: "linked",  label: "ENTITY AWARDS" },
    { key: "notices", label: "TED NOTICES" },
    { key: "summary", label: "SUMMARY" },
    { key: "signals", label: "TECH SIGNALS" },
  ];

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <ShoppingCart size={16} className="text-terminal-cyan" />
        <h1 className="text-terminal-cyan text-sm font-bold tracking-widest">PROCUREMENT INTELLIGENCE</h1>
        <span className="text-terminal-dim text-xs">v_dfm_ted_awards_linked_v3 · v_dfm_entity_procurement_ted_v1</span>
      </div>

      <div className="flex border-b border-terminal-border">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => { setTab(key); setOffset(0); }}
            className={`px-4 py-2 text-xs tracking-wider border-b-2 transition-colors ${
              tab === key ? "border-terminal-cyan text-terminal-cyan" : "border-transparent text-terminal-secondary hover:text-terminal-text"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {(tab === "notices" || tab === "linked") && (
        <div className="panel p-3 flex flex-wrap gap-3 items-center">
          {tab === "notices" && (
            <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && apply()}
              placeholder="Search title / authority…"
              className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-48 placeholder:text-terminal-dim" />
          )}
          <input value={country} onChange={(e) => setCountry(e.target.value)} onKeyDown={(e) => e.key === "Enter" && apply()}
            placeholder="Country code…"
            className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-28 placeholder:text-terminal-dim" />
          {tab === "notices" && (
            <input value={cpv} onChange={(e) => setCpv(e.target.value)} onKeyDown={(e) => e.key === "Enter" && apply()}
              placeholder="CPV code…"
              className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-28 placeholder:text-terminal-dim" />
          )}
          <button onClick={apply} className="text-terminal-cyan text-xs hover:text-white">APPLY</button>
          <div className="flex-1" />
          <span className="text-terminal-secondary text-xs">{total.toLocaleString()} records</span>
        </div>
      )}

      <div className="panel flex-1 overflow-hidden">
        <DataTable
          data={currentData ?? []}
          onRowClick={handleRow}
          maxHeight="calc(100vh - 260px)"
        />
      </div>

      <div className="flex items-center justify-between">
        <StatusBar loading={loading} message={`${total} records · PROCUREMENT`} />
        {(tab === "notices" || tab === "linked" || tab === "summary") && (
          <div className="flex items-center gap-2 pr-2">
            <button onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))} disabled={offset === 0}
              className="text-terminal-cyan disabled:opacity-30"><ChevronLeft size={16} /></button>
            <span className="text-xs text-terminal-secondary">{page}/{pages}</span>
            <button onClick={() => setOffset(offset + PAGE_SIZE)} disabled={offset + PAGE_SIZE >= total}
              className="text-terminal-cyan disabled:opacity-30"><ChevronRight size={16} /></button>
          </div>
        )}
      </div>
    </div>
  );
}
