"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shield } from "lucide-react";
import {
  getAutonomyIndex,
  getAutonomyGaps,
  getAutonomyDependencies,
} from "@/lib/api";
import DataTable from "@/components/DataTable";
import StatusBar from "@/components/StatusBar";

type Tab = "index" | "gaps" | "dependencies";

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
    queryFn: () => getAutonomyIndex({
      scenario_code: applied.scenario || undefined,
      pr_code: applied.pr || undefined,
    }),
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
    queryFn: () => getAutonomyDependencies({
      scenario_code: applied.scenario || undefined,
      pr_code: applied.pr || undefined,
    }),
    enabled: tab === "dependencies",
    staleTime: 60_000,
  });

  const loading = indexLoading || gapsLoading || depsLoading;

  const TABS: { key: Tab; label: string }[] = [
    { key: "gaps",         label: "AUTONOMY GAPS" },
    { key: "dependencies", label: "EU vs NON-EU" },
    { key: "index",        label: "CONCENTRATION INDEX" },
  ];

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
        <input
          value={flagFilter}
          onChange={(e) => setFlagFilter(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="Autonomy flag…"
          className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-36 placeholder:text-terminal-dim"
        />
        <button onClick={apply} className="text-terminal-cyan text-xs hover:text-white">APPLY</button>
        <button onClick={clear} className="text-terminal-dim text-xs hover:text-terminal-text">CLEAR</button>
        <div className="flex-1" />
        <span className="text-terminal-secondary text-xs">
          {loading ? "LOADING…" : tab.toUpperCase()}
        </span>
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
          <DataTable
            data={gaps?.data ?? []}
            columns={["scenario_code", "pr_code", "eu_entities_remaining", "non_eu_entities_remaining", "autonomy_flag"]}
            maxHeight="calc(100vh - 320px)"
          />
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
        message={`AUTONOMY · ${tab.toUpperCase()} · ${
          tab === "gaps" ? (gaps?.total ?? 0) :
          tab === "dependencies" ? (deps?.total ?? 0) :
          (index?.total ?? 0)
        } rows`}
      />
    </div>
  );
}
