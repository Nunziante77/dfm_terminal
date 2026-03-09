"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Cpu } from "lucide-react";
import {
  getTechnologyClusters,
  getTechnologyConcentration,
  getTechnologyVulnerabilities,
} from "@/lib/api";
import DataTable from "@/components/DataTable";
import StatusBar from "@/components/StatusBar";

type Tab = "clusters" | "concentration" | "vulnerabilities";

export default function TechnologyPage() {
  const [tab, setTab] = useState<Tab>("clusters");
  const [techFilter, setTechFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [prFilter, setPrFilter] = useState("");
  const [applied, setApplied] = useState<{ tech: string; country: string; pr: string }>({
    tech: "", country: "", pr: "",
  });

  const apply = () => setApplied({ tech: techFilter, country: countryFilter, pr: prFilter });
  const clear = () => {
    setTechFilter(""); setCountryFilter(""); setPrFilter("");
    setApplied({ tech: "", country: "", pr: "" });
  };

  const { data: clusters, isFetching: clustersLoading } = useQuery({
    queryKey: ["tech-clusters", applied.tech],
    queryFn: () => getTechnologyClusters({ dfm_tech_code: applied.tech || undefined }),
    enabled: tab === "clusters",
    staleTime: 60_000,
  });

  const { data: concentration, isFetching: concLoading } = useQuery({
    queryKey: ["tech-concentration", applied.pr],
    queryFn: () => getTechnologyConcentration({ pr_code: applied.pr || undefined }),
    enabled: tab === "concentration",
    staleTime: 60_000,
  });

  const { data: vulnerabilities, isFetching: vulnLoading } = useQuery({
    queryKey: ["tech-vulnerabilities", applied.country, applied.tech],
    queryFn: () => getTechnologyVulnerabilities({
      country_code: applied.country || undefined,
      dfm_tech_code: applied.tech || undefined,
    }),
    enabled: tab === "vulnerabilities",
    staleTime: 60_000,
  });

  const loading = clustersLoading || concLoading || vulnLoading;

  const TABS: { key: Tab; label: string }[] = [
    { key: "clusters",        label: "TECH CLUSTERS" },
    { key: "concentration",   label: "CONCENTRATION" },
    { key: "vulnerabilities", label: "BY COUNTRY" },
  ];

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <Cpu size={16} className="text-terminal-cyan" />
        <h1 className="text-terminal-cyan text-sm font-bold tracking-widest">TECHNOLOGY LANDSCAPE</h1>
        <span className="text-terminal-dim text-xs">
          v_dfm_defence_technology_market_v3 · v_dfm_pr_concentration_index_v2 · v_dfm_defence_technology_demand_by_country_v2
        </span>
      </div>

      {/* Filters */}
      <div className="panel p-3 flex flex-wrap items-center gap-3">
        <input
          value={techFilter}
          onChange={(e) => setTechFilter(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="Tech code…"
          className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-36 placeholder:text-terminal-dim"
        />
        <input
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="Country code…"
          className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-32 placeholder:text-terminal-dim"
        />
        <input
          value={prFilter}
          onChange={(e) => setPrFilter(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="Priority code…"
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
        {tab === "clusters" && (
          <DataTable
            data={clusters?.data ?? []}
            columns={["dfm_tech_code", "contracts", "procurement_value", "suppliers"]}
            maxHeight="calc(100vh - 320px)"
          />
        )}
        {tab === "concentration" && (
          <DataTable
            data={concentration?.data ?? []}
            columns={["scenario_code", "pr_code", "entity_count", "total_tech_counts", "hhi_structural"]}
            maxHeight="calc(100vh - 320px)"
          />
        )}
        {tab === "vulnerabilities" && (
          <DataTable
            data={vulnerabilities?.data ?? []}
            columns={["country_code", "dfm_tech_code", "contracts", "procurement_value"]}
            maxHeight="calc(100vh - 320px)"
          />
        )}
      </div>

      <StatusBar
        loading={loading}
        message={`TECHNOLOGY · ${tab.toUpperCase()} · ${
          tab === "clusters" ? (clusters?.total ?? 0) :
          tab === "concentration" ? (concentration?.total ?? 0) :
          (vulnerabilities?.total ?? 0)
        } rows`}
      />
    </div>
  );
}
