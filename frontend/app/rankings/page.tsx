"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Layers, ChevronLeft, ChevronRight, ChevronDown, ChevronRight as ChevRight } from "lucide-react";
import { getRankings } from "@/lib/api";
import type { ViewRow } from "@/lib/types";
import StatusBar from "@/components/StatusBar";

const PAGE_SIZE = 100;

const SORT_OPTIONS = [
  { value: "final_score",       label: "Final Score" },
  { value: "base_score",        label: "Base Score" },
  { value: "highest_trl",       label: "Highest TRL" },
  { value: "supported_op_count", label: "Ops Coverage" },
  { value: "official_name",     label: "Name" },
];

// ── Score modifier helpers ──────────────────────────────────────────────────

function ModifierBadge({ value, label }: { value: unknown; label: string }) {
  const n = Number(value ?? 0);
  if (n === 0 || value === null || value === undefined) return null;
  const isPositive = n > 0;
  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <span className="text-terminal-dim text-[10px]">{label}</span>
      <span className={`font-mono text-[10px] font-bold ${isPositive ? "text-terminal-green" : "text-terminal-red"}`}>
        {isPositive ? "+" : ""}{n.toFixed ? n.toFixed(3) : n}
      </span>
    </div>
  );
}

function SignalBadge({ code, label }: { code: unknown; label: string }) {
  const s = String(code ?? "").trim();
  if (!s || s === "null" || s === "undefined") return null;
  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <span className="text-terminal-dim text-[10px]">{label}</span>
      <span className="font-mono text-[10px] text-terminal-orange tracking-wider">{s}</span>
    </div>
  );
}

function ScoreBar({ base, final }: { base: unknown; final: unknown }) {
  const b = Number(base ?? 0);
  const f = Number(final ?? 0);
  const max = Math.max(b, f, 1);
  const bPct = Math.min(100, (b / max) * 100);
  const fPct = Math.min(100, (f / max) * 100);
  return (
    <div className="flex flex-col gap-1 mt-2">
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-terminal-dim w-16">BASE</span>
        <div className="flex-1 h-1.5 bg-terminal-muted rounded-sm overflow-hidden">
          <div className="h-full bg-terminal-secondary rounded-sm" style={{ width: `${bPct}%` }} />
        </div>
        <span className="font-mono text-[10px] text-terminal-secondary w-12 text-right">
          {b.toFixed ? b.toFixed(3) : b}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-terminal-dim w-16">FINAL</span>
        <div className="flex-1 h-1.5 bg-terminal-muted rounded-sm overflow-hidden">
          <div className={`h-full rounded-sm ${f >= b ? "bg-terminal-cyan" : "bg-terminal-orange"}`} style={{ width: `${fPct}%` }} />
        </div>
        <span className={`font-mono text-[10px] font-bold w-12 text-right ${f >= b ? "text-terminal-cyan" : "text-terminal-orange"}`}>
          {f.toFixed ? f.toFixed(3) : f}
        </span>
      </div>
    </div>
  );
}

function ScoreExpansionPanel({ row }: { row: ViewRow }) {
  return (
    <div className="bg-terminal-muted border-t border-terminal-border px-6 py-3 grid grid-cols-2 gap-x-8 gap-y-0">
      {/* Left: modifier breakdown */}
      <div>
        <div className="text-[9px] text-terminal-cyan tracking-widest mb-2">SCORE MODIFIERS</div>
        <ModifierBadge value={row.trl_modifier}          label={`TRL Modifier (TRL ${row.highest_trl ?? "?"})`} />
        <ModifierBadge value={row.industrial_modifier}   label="Industrial Modifier" />
        <SignalBadge   code={row.regulatory_signal_code} label="Regulatory Signal" />
        <ModifierBadge value={row.regulatory_modifier}   label="Regulatory Modifier" />
        <SignalBadge   code={row.capital_signal_code}    label="Capital Signal" />
        <ModifierBadge value={row.capital_modifier}      label="Capital Modifier" />
        <ModifierBadge value={row.depth_modifier}        label="Depth Modifier" />
        {row.strategic_weight_multiplier != null && (
          <div className="flex items-center justify-between gap-2 py-0.5 border-t border-terminal-border mt-1 pt-1">
            <span className="text-terminal-dim text-[10px]">Strategic Weight ×</span>
            <span className="font-mono text-[10px] text-terminal-secondary">
              {Number(row.strategic_weight_multiplier).toFixed(3)}
            </span>
          </div>
        )}
      </div>
      {/* Right: score bar + ops */}
      <div>
        <div className="text-[9px] text-terminal-cyan tracking-widest mb-2">SCORE COMPOSITION</div>
        <ScoreBar base={row.base_score} final={row.final_score} />
        <div className="mt-3 flex flex-col gap-0.5">
          {row.supported_op_count != null && (
            <div className="flex items-center justify-between gap-2 py-0.5">
              <span className="text-terminal-dim text-[10px]">Supported Operations</span>
              <span className="font-mono text-[10px] text-terminal-secondary">{String(row.supported_op_count)}</span>
            </div>
          )}
          {row.supported_tc_count != null && (
            <div className="flex items-center justify-between gap-2 py-0.5">
              <span className="text-terminal-dim text-[10px]">Supported Capabilities</span>
              <span className="font-mono text-[10px] text-terminal-secondary">{String(row.supported_tc_count)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function RankingsPage() {
  const router = useRouter();
  const [offset, setOffset] = useState(0);
  const [prCode, setPrCode] = useState("");
  const [country, setCountry] = useState("");
  const [sortBy, setSortBy] = useState("final_score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [submitted, setSubmitted] = useState({ prCode: "", country: "" });
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const apply = () => { setSubmitted({ prCode, country }); setOffset(0); };
  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const { data, isFetching, error } = useQuery({
    queryKey: ["rankings", offset, sortBy, sortDir, submitted],
    queryFn: () =>
      getRankings({
        limit: PAGE_SIZE,
        offset,
        sort_by: sortBy,
        sort_dir: sortDir,
        primary_strategic_code: submitted.prCode || undefined,
        country: submitted.country || undefined,
      }),
  });

  const total = data?.total ?? 0;
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pages = Math.ceil(total / PAGE_SIZE) || 1;
  const rows: ViewRow[] = data?.data ?? [];

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <Layers size={16} className="text-terminal-cyan" />
        <h1 className="text-terminal-cyan text-sm font-bold tracking-widest">STRATEGIC RANKING</h1>
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
        <div className="text-terminal-red text-xs panel px-4 py-3">ERROR: {String(error)}</div>
      )}

      <div className="panel flex-1 overflow-auto">
        {isFetching && rows.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-terminal-orange text-xs animate-pulse tracking-widest">
            LOADING…
          </div>
        ) : rows.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-terminal-dim text-xs tracking-widest">
            NO DATA
          </div>
        ) : (
          <table className="dfm-table w-full">
            <thead>
              <tr>
                <th className="w-6" />
                <th>Entity</th>
                <th>Country</th>
                <th>Priority</th>
                <th>TRL</th>
                <th>Base</th>
                <th>Final Score</th>
                <th>Ops</th>
                <th>Cap.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const id = String(row.entity_id ?? i);
                const isOpen = expanded.has(id);
                const delta = Number(row.final_score ?? 0) - Number(row.base_score ?? 0);
                return (
                  <>
                    <tr
                      key={id}
                      onClick={() => {
                        toggleExpand(id);
                      }}
                      className="cursor-pointer transition-colors border-l-2 border-transparent hover:border-terminal-cyan"
                    >
                      <td className="text-terminal-dim text-center">
                        {isOpen ? <ChevronDown size={10} /> : <ChevRight size={10} />}
                      </td>
                      <td
                        className="text-terminal-cyan font-semibold"
                        onClick={(e) => { e.stopPropagation(); router.push(`/entities/${id}`); }}
                      >
                        <span className="hover:underline cursor-pointer">
                          {String(row.official_name ?? row.entity_id ?? "—")}
                        </span>
                      </td>
                      <td className="text-terminal-secondary">{String(row.headquarters_country_iso2 ?? "—")}</td>
                      <td className="font-mono text-[10px]">{String(row.primary_strategic_code ?? "—")}</td>
                      <td className="text-center font-mono">
                        {row.highest_trl != null
                          ? <span className="inline-block bg-terminal-muted text-terminal-cyan px-1.5 py-0.5 text-[10px] font-bold rounded-sm">{String(row.highest_trl)}</span>
                          : <span className="text-terminal-dim">—</span>}
                      </td>
                      <td className="font-mono text-terminal-secondary text-[11px]">
                        {row.base_score != null ? Number(row.base_score).toFixed(3) : "—"}
                      </td>
                      <td className="font-mono font-bold">
                        <span className={Number(row.final_score ?? 0) > 0 ? "text-terminal-cyan" : "text-terminal-dim"}>
                          {row.final_score != null ? Number(row.final_score).toFixed(3) : "—"}
                        </span>
                        {row.base_score != null && row.final_score != null && (
                          <span className={`ml-1.5 text-[9px] ${delta > 0 ? "text-terminal-green" : delta < 0 ? "text-terminal-red" : "text-terminal-dim"}`}>
                            {delta > 0 ? `+${delta.toFixed(2)}` : delta < 0 ? delta.toFixed(2) : ""}
                          </span>
                        )}
                      </td>
                      <td className="text-terminal-secondary text-[11px]">{row.supported_op_count != null ? String(row.supported_op_count) : "—"}</td>
                      <td className="text-terminal-secondary text-[11px]">{row.supported_tc_count != null ? String(row.supported_tc_count) : "—"}</td>
                    </tr>
                    {isOpen && (
                      <tr key={`${id}-detail`}>
                        <td colSpan={9} className="p-0">
                          <ScoreExpansionPanel row={row} />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-center justify-between">
        <StatusBar loading={isFetching} message={`${total.toLocaleString()} entities · STRATEGIC RANKING`} />
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
