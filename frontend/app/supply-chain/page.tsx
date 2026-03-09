"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link2 } from "lucide-react";
import {
  getSupplyChainNetwork,
  getSupplyChainDependencies,
  getSupplyChainCentrality,
} from "@/lib/api";
import DataTable from "@/components/DataTable";
import StatusBar from "@/components/StatusBar";

type Tab = "network" | "dependencies" | "centrality";

export default function SupplyChainPage() {
  const [tab, setTab] = useState<Tab>("network");
  const [roleFilter, setRoleFilter] = useState("");
  const [techFilter, setTechFilter] = useState("");
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState<{ role: string; tech: string; search: string }>({
    role: "", tech: "", search: "",
  });

  const apply = () => setApplied({ role: roleFilter, tech: techFilter, search });
  const clear = () => {
    setRoleFilter(""); setTechFilter(""); setSearch("");
    setApplied({ role: "", tech: "", search: "" });
  };

  const { data: network, isFetching: netLoading } = useQuery({
    queryKey: ["supply-chain-network", applied.role, applied.tech],
    queryFn: () => getSupplyChainNetwork({
      supply_chain_role: applied.role || undefined,
      dfm_tech_code: applied.tech || undefined,
    }),
    enabled: tab === "network",
    staleTime: 60_000,
  });

  const { data: deps, isFetching: depsLoading } = useQuery({
    queryKey: ["supply-chain-deps", applied.role, applied.tech, applied.search],
    queryFn: () => getSupplyChainDependencies({
      supply_chain_role: applied.role || undefined,
      dfm_tech_code: applied.tech || undefined,
      search: applied.search || undefined,
    }),
    enabled: tab === "dependencies",
    staleTime: 60_000,
  });

  const { data: centrality, isFetching: centLoading } = useQuery({
    queryKey: ["supply-chain-centrality", applied.role, applied.search],
    queryFn: () => getSupplyChainCentrality({
      supply_chain_role: applied.role || undefined,
      search: applied.search || undefined,
    }),
    enabled: tab === "centrality",
    staleTime: 60_000,
  });

  const loading = netLoading || depsLoading || centLoading;

  const TABS: { key: Tab; label: string }[] = [
    { key: "network",      label: "NETWORK" },
    { key: "dependencies", label: "DEPENDENCIES" },
    { key: "centrality",   label: "CENTRALITY" },
  ];

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <Link2 size={16} className="text-terminal-cyan" />
        <h1 className="text-terminal-cyan text-sm font-bold tracking-widest">SUPPLY CHAIN INTELLIGENCE</h1>
        <span className="text-terminal-dim text-xs">
          v_dfm_defence_supply_chain_v3 · v_dfm_defence_supply_chain_signal_v1 · v_dfm_supply_chain_classifier_v2
        </span>
      </div>

      {/* Filters */}
      <div className="panel p-3 flex flex-wrap items-center gap-3">
        <input
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="Supply chain role…"
          className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-44 placeholder:text-terminal-dim"
        />
        <input
          value={techFilter}
          onChange={(e) => setTechFilter(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="Tech code…"
          className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-36 placeholder:text-terminal-dim"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="Entity search…"
          className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-40 placeholder:text-terminal-dim"
        />
        <button onClick={apply} className="text-terminal-cyan text-xs hover:text-white">APPLY</button>
        <button onClick={clear} className="text-terminal-dim text-xs hover:text-terminal-text">CLEAR</button>
        <div className="flex-1" />
        <span className="text-terminal-secondary text-xs">
          {loading ? "LOADING…" : `${tab.toUpperCase()}`}
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
        {tab === "network" && (
          <DataTable
            data={network?.data ?? []}
            columns={["supply_chain_role", "dfm_tech_code", "contracts", "procurement_value"]}
            maxHeight="calc(100vh - 320px)"
          />
        )}
        {tab === "dependencies" && (
          <DataTable
            data={deps?.data ?? []}
            columns={["entity_id", "official_name", "supply_chain_role", "dfm_tech_code", "contracts", "procurement_value"]}
            maxHeight="calc(100vh - 320px)"
          />
        )}
        {tab === "centrality" && (
          <DataTable
            data={centrality?.data ?? []}
            columns={["entity_id", "official_name", "supply_chain_role"]}
            maxHeight="calc(100vh - 320px)"
          />
        )}
      </div>

      <StatusBar
        loading={loading}
        message={`SUPPLY CHAIN · ${tab.toUpperCase()} · ${
          tab === "network" ? (network?.total ?? 0) :
          tab === "dependencies" ? (deps?.total ?? 0) :
          (centrality?.total ?? 0)
        } rows`}
      />
    </div>
  );
}
