"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shield } from "lucide-react";
import {
  getAutonomyIndex,
  getAutonomyGaps,
  getAutonomyDependencies,
} from "@/lib/api";
import { AUTONOMY_FLAG_LABELS, formatAutonomyFlag, autonomyFlagIsWarn } from "@/lib/autonomy";
import type { ViewRow } from "@/lib/types";
import DataTable from "@/components/DataTable";
import StatusBar from "@/components/StatusBar";

type Tab = "index" | "gaps" | "dependencies";

// ── Narrative rendering ──────────────────────────────────────────────────────

function AutonomyFlagPill({ value }: { value: unknown }) {
  const raw = String(value ?? "").toUpperCase().trim();
  if (!raw || raw === "NULL" || raw === "UNDEFINED" || raw === "—") {
    return <span className="text-terminal-dim text-[10px]">—</span>;
  }
  const label = AUTONOMY_FLAG_LABELS[raw] ?? raw;
  const styles =
    raw === "EU_COVERAGE_ZERO" ? "bg-red-950 text-terminal-red border-terminal-red" :
    raw === "EU_COVERAGE_LOW"  ? "bg-amber-950 text-terminal-orange border-terminal-orange" :
    raw === "EU_COVERAGE_OK"   ? "bg-green-950 text-terminal-green border-terminal-green" :
    "bg-terminal-muted text-terminal-secondary border-terminal-border";
  return (
    <span className={`inline-block text-[10px] font-mono font-bold px-1.5 py-0.5 border rounded-sm tracking-wider ${styles}`}
          title={raw}>
      {label}
    </span>
  );
}

function EuBalance({ eu, nonEu }: { eu: unknown; nonEu: unknown }) {
  const e = Number(eu ?? 0);
  const n = Number(nonEu ?? 0);
  if (!e && !n) return <span className="text-terminal-dim text-[10px]">—</span>;
  const total = e + n;
  const euPct = total > 0 ? (e / total) * 100 : 0;
  const nonEuPct = total > 0 ? (n / total) * 100 : 0;
  const nonEuDominates = n > e;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-terminal-green font-mono text-[10px]">{e} EU</span>
      <span className="text-terminal-dim text-[10px]">/</span>
      <span className={`font-mono text-[10px] ${nonEuDominates ? "text-terminal-orange font-bold" : "text-terminal-secondary"}`}>
        {n} Non-EU
      </span>
      <span className="w-14 h-1.5 bg-terminal-muted rounded-sm overflow-hidden inline-flex">
        <span className="h-full bg-terminal-green" style={{ width: `${euPct}%` }} />
        <span className={`h-full ${nonEuDominates ? "bg-terminal-orange" : "bg-terminal-secondary"}`} style={{ width: `${nonEuPct}%` }} />
      </span>
    </span>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function AutonomyPage() {
  const [tab, setTab] = useState<Tab>("gaps");
  const [prFilter, setPrFilter] = useState("");
  const [scenarioFilter, setScenarioFilter] = useState("");
  const [flagFilter, setFlagFilter] = useState("");
  const [applied, setApplied] = useState<{ pr: string; scenario: string; flag: string }>({
    pr: "", scenario: "", flag: "",
  });

  const apply = () => setApplied({ pr: prFilter, scenario: scenarioFilter, flag: flagFilter });
  const clear = () => {
    setPrFilter(""); setScenarioFilter(""); setFlagFilter("");
    setApplied({ pr: "", scenario: "", flag: "" });
  };

  const { data: index, isFetching: indexLoading } = useQuery({
    queryKey: ["autonomy-index", applied.scenario, applied.pr],
    queryFn: () => getAutonomyIndex({ scenario_code: applied.scenario || undefined, pr_code: applied.pr || undefined }),
    enabled: tab === "index",
    staleTime: 60_000,
  });

  const { data: gaps, isFetching: gapsLoading } = useQuery({
    queryKey: ["autonomy-gaps", applied.scenario, applied.pr, applied.flag],
    queryFn: () => getAutonomyGaps({
      scenario_code: applied.scenario || undefined,
      pr_code: applied.pr || undefined,
      autonomy_flag: applied.flag || undefined,
    }),
    enabled: tab === "gaps",
    staleTime: 60_000,
  });

  const { data: deps, isFetching: depsLoading } = useQuery({
    queryKey: ["autonomy-deps", applied.scenario, applied.pr],
    queryFn: () => getAutonomyDependencies({ scenario_code: applied.scenario || undefined, pr_code: applied.pr || undefined }),
    enabled: tab === "dependencies",
    staleTime: 60_000,
  });

  const loading = indexLoading || gapsLoading || depsLoading;

  const TABS: { key: Tab; label: string }[] = [
    { key: "gaps",         label: "AUTONOMY GAPS" },
    { key: "dependencies", label: "EU vs NON-EU" },
    { key: "index",        label: "CONCENTRATION INDEX" },
  ];

  const rowCount =
    tab === "gaps" ? (gaps?.total ?? 0) :
    tab === "dependencies" ? (deps?.total ?? 0) :
    (index?.total ?? 0);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <Shield size={16} className="text-terminal-cyan" />
        <h1 className="text-terminal-cyan text-sm font-bold tracking-widest">STRATEGIC AUTONOMY</h1>
        <span className="text-terminal-dim text-xs">
          v_dfm_pr_autonomy_gap_flags_v1 · v_dfm_pr_autonomy_gap_v1 · v_dfm_pr_concentration_index_v2
        </span>
      </div>

      {/* Filters */}
      <div className="panel p-3 flex flex-wrap items-center gap-3">
        <input
          value={scenarioFilter}
          onChange={(e) => setScenarioFilter(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="Scenario code…"
          className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-36 placeholder:text-terminal-dim"
        />
        <input
          value={prFilter}
          onChange={(e) => setPrFilter(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="Priority code…"
          className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-36 placeholder:text-terminal-dim"
        />
        {tab === "gaps" && (
          <select
            value={flagFilter}
            onChange={(e) => setFlagFilter(e.target.value)}
            className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-2 py-1.5 outline-none"
          >
            <option value="">All flags</option>
            <option value="EU_COVERAGE_ZERO">No EU Coverage</option>
            <option value="EU_COVERAGE_LOW">EU Partial</option>
            <option value="EU_COVERAGE_OK">EU Sufficient</option>
          </select>
        )}
        <button onClick={apply} className="text-terminal-cyan text-xs hover:text-white">APPLY</button>
        <button onClick={clear} className="text-terminal-dim text-xs hover:text-terminal-text">CLEAR</button>
        <div className="flex-1" />
        <span className="text-terminal-secondary text-xs">{rowCount.toLocaleString()} rows</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-terminal-border">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-xs tracking-wider border-b-2 transition-colors ${
              tab === key
                ? "border-terminal-cyan text-terminal-cyan"
                : "border-transparent text-terminal-secondary hover:text-terminal-text"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="panel flex-1 overflow-auto">
        {tab === "gaps" && (
          gapsLoading ? (
            <div className="flex items-center justify-center h-32 text-terminal-orange text-xs animate-pulse tracking-widest">LOADING…</div>
          ) : (gaps?.data ?? []).length === 0 ? (
            <div className="flex items-center justify-center h-32 text-terminal-dim text-xs tracking-widest">NO DATA</div>
          ) : (
            <table className="dfm-table w-full">
              <thead>
                <tr>
                  <th>Scenario</th>
                  <th>Priority Code</th>
                  <th>Autonomy Flag</th>
                  <th>EU vs Non-EU Balance</th>
                </tr>
              </thead>
              <tbody>
                {(gaps?.data ?? []).map((row: ViewRow, i: number) => {
                  const flag = String(row.autonomy_flag ?? "").toUpperCase();
                  const isCritical = autonomyFlagIsWarn(flag);
                  return (
                    <tr
                      key={i}
                      className={[
                        "transition-colors",
                        isCritical ? "border-l-2 border-terminal-orange" : "border-l-2 border-transparent",
                      ].join(" ")}
                    >
                      <td className="font-mono text-[10px] text-terminal-dim">{String(row.scenario_code ?? "—")}</td>
                      <td className="font-mono text-terminal-cyan">{String(row.pr_code ?? "—")}</td>
                      <td><AutonomyFlagPill value={row.autonomy_flag} /></td>
                      <td><EuBalance eu={row.eu_entities_remaining} nonEu={row.non_eu_entities_remaining} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        )}

        {tab === "dependencies" && (
          <DataTable
            data={deps?.data ?? []}
            columns={["scenario_code", "pr_code", "eu_entities_remaining", "non_eu_entities_remaining"]}
            maxHeight="calc(100vh - 320px)"
          />
        )}

        {tab === "index" && (
          <DataTable
            data={index?.data ?? []}
            columns={["scenario_code", "pr_code", "entity_count", "total_tech_counts", "hhi_structural"]}
            maxHeight="calc(100vh - 320px)"
          />
        )}
      </div>

      <StatusBar
        loading={loading}
        message={`AUTONOMY · ${tab.toUpperCase()} · ${rowCount.toLocaleString()} rows`}
      />
    </div>
  );
}
