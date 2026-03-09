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
  const [prCode, setPrCode] = useState("");
  const [country, setCountry] = useState("");
  const [submitted, setSubmitted] = useState({ prCode: "", country: "" });

  const apply = () => { setSubmitted({ prCode, country }); setOffset(0); };

  const { data, isFetching, error } = useQuery({
    queryKey: ["rankings", offset, submitted],
    queryFn: () =>
      getRankings({
        limit: PAGE_SIZE,
        offset,
        primary_strategic_code: submitted.prCode || undefined,
        country: submitted.country || undefined,
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
        <Layers size={16} className="text-terminal-cyan" />
        <h1 className="text-terminal-cyan text-sm font-bold tracking-widest">
          STRATEGIC RANKING
        </h1>
        <span className="text-terminal-dim text-xs">v_dfm_rank_with_scoring_layers_v3</span>
      </div>

      <div className="panel p-3 flex flex-wrap gap-3 items-center">
        <input
          value={prCode}
          onChange={(e) => setPrCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="Strategic code (PR-…)"
          className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-40 placeholder:text-terminal-dim"
        />
        <input
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="Country ISO2…"
          className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-28 placeholder:text-terminal-dim"
        />
        <button onClick={apply} className="text-terminal-cyan text-xs hover:text-white">APPLY</button>
        {(submitted.prCode || submitted.country) && (
          <button
            onClick={() => { setPrCode(""); setCountry(""); setSubmitted({ prCode: "", country: "" }); setOffset(0); }}
            className="text-terminal-dim text-xs hover:text-terminal-text"
          >
            CLEAR
          </button>
        )}
        <div className="flex-1" />
        <span className="text-terminal-secondary text-xs">{total.toLocaleString()} entities</span>
      </div>

      {error && (
        <div className="text-terminal-red text-xs panel px-4 py-3">
          ERROR: {String(error)}
        </div>
      )}

      <div className="panel flex-1 overflow-hidden">
        <DataTable
          data={data?.data ?? []}
          onRowClick={handleRow}
          maxHeight="calc(100vh - 270px)"
          columns={[
            "entity_id", "official_name", "headquarters_country_iso2",
            "primary_strategic_code", "final_score", "base_score",
            "strategic_weight_multiplier", "trl_modifier", "industrial_modifier",
            "regulatory_modifier", "capital_modifier", "depth_modifier",
            "highest_trl", "supported_op_count", "supported_tc_count",
          ]}
        />
      </div>

      <div className="flex items-center justify-between">
        <StatusBar loading={isFetching} message={`${total} entities · STRATEGIC RANKING`} />
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
