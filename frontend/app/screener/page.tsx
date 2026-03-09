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

const SORT_OPTIONS = [
  { value: "official_name",            label: "Name" },
  { value: "tech_count",               label: "Tech Count" },
  { value: "hhi_structural",           label: "HHI Structural" },
  { value: "sanction_link_count",      label: "Sanctions" },
  { value: "buyer_contract_count",     label: "Contracts" },
  { value: "pr_remaining_entities",    label: "PR Coverage" },
  { value: "reg_pass_count",           label: "Reg Pass" },
  { value: "reg_fail_count",           label: "Reg Fail" },
];

export default function ScreenerPage() {
  const router = useRouter();
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [prCode, setPrCode] = useState("");
  const [ownershipStatus, setOwnershipStatus] = useState("");
  const [sortBy, setSortBy] = useState("official_name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [submitted, setSubmitted] = useState({
    search: "", country: "", prCode: "", ownershipStatus: "",
  });

  const apply = () => {
    setSubmitted({ search, country, prCode, ownershipStatus });
    setOffset(0);
  };

  const clear = () => {
    setSearch(""); setCountry(""); setPrCode(""); setOwnershipStatus("");
    setSubmitted({ search: "", country: "", prCode: "", ownershipStatus: "" });
    setOffset(0);
  };

  const { data, isFetching, error } = useQuery({
    queryKey: ["screener", offset, sortBy, sortDir, submitted],
    queryFn: () =>
      getScreener({
        limit: PAGE_SIZE,
        offset,
        sort_by: sortBy,
        sort_dir: sortDir,
        search:           submitted.search || undefined,
        hq_country:       submitted.country || undefined,
        pr_code:          submitted.prCode || undefined,
        ownership_status: submitted.ownershipStatus || undefined,
      }),
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
        <SlidersHorizontal size={16} className="text-terminal-cyan" />
        <h1 className="text-terminal-cyan text-sm font-bold tracking-widest">BLOOMBERG SCREENER</h1>
        <span className="text-terminal-dim text-xs">v_dfm_bloomberg_screener_v3</span>
      </div>

      <div className="panel p-3 flex flex-wrap gap-3 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="Name search…"
          className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-40 placeholder:text-terminal-dim"
        />
        <input
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="Country ISO2…"
          className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-28 placeholder:text-terminal-dim"
        />
        <input
          value={prCode}
          onChange={(e) => setPrCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="Priority code…"
          className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-32 placeholder:text-terminal-dim"
        />
        <input
          value={ownershipStatus}
          onChange={(e) => setOwnershipStatus(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="Ownership status…"
          className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-36 placeholder:text-terminal-dim"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-2 py-1.5 outline-none"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button
          onClick={() => setSortDir((d) => d === "asc" ? "desc" : "asc")}
          className="text-terminal-secondary text-xs hover:text-terminal-text font-mono"
        >
          {sortDir === "asc" ? "↑ ASC" : "↓ DESC"}
        </button>
        <button onClick={apply} className="text-terminal-cyan text-xs hover:text-white">APPLY</button>
        <button onClick={clear} className="text-terminal-dim text-xs hover:text-terminal-text">CLEAR</button>
        <div className="flex-1" />
        <span className="text-terminal-secondary text-xs">{total.toLocaleString()} entities</span>
      </div>

      {error && (
        <div className="text-terminal-red text-xs panel px-4 py-3">ERROR: {String(error)}</div>
      )}

      <div className="panel flex-1 overflow-hidden">
        <DataTable
          data={data?.data ?? []}
          onRowClick={handleRow}
          maxHeight="calc(100vh - 280px)"
        />
      </div>

      <div className="flex items-center justify-between">
        <StatusBar loading={isFetching} message={`${total} entities · SCREENER`} />
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
