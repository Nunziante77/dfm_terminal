"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  getSupplyChainNetwork,
  getSupplyChainDependencies,
  getSupplyChainCentrality,
  getSupplyChainFragility,
} from "@/lib/api";
import type { ViewRow } from "@/lib/types";
import DataTable from "@/components/DataTable";
import StatusBar from "@/components/StatusBar";

type Tab = "network" | "dependencies" | "centrality" | "fragility";

// ── Narrative pills ─────────────────────────────────────────────────────────

function FragilityPill({ value }: { value: unknown }) {
  const v = String(value ?? "").toUpperCase().trim();
  if (!v || v === "NULL" || v === "UNDEFINED" || v === "—") {
    return <span className="text-terminal-dim text-[10px]">—</span>;
  }
  const styles =
    v === "HIGH"   ? "bg-red-950 text-terminal-red border-terminal-red" :
    v === "MEDIUM" ? "bg-amber-950 text-terminal-orange border-terminal-orange" :
    v === "LOW"    ? "bg-green-950 text-terminal-green border-terminal-green" :
    "bg-terminal-muted text-terminal-secondary border-terminal-border";
  return (
    <span className={`inline-block text-[10px] font-mono font-bold px-1.5 py-0.5 border rounded-sm tracking-wider ${styles}`}>
      {v}
    </span>
  );
}

function RemainingBar({ pct }: { pct: unknown }) {
  const n = Number(pct ?? null);
  if (isNaN(n)) return <span className="text-terminal-dim text-[10px]">—</span>;
  const color = n < 25 ? "bg-terminal-red" : n < 50 ? "bg-terminal-orange" : "bg-terminal-green";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-16 h-1.5 bg-terminal-muted rounded-sm overflow-hidden inline-block">
        <span className={`h-full block rounded-sm ${color}`} style={{ width: `${Math.min(100, n)}%` }} />
      </span>
      <span className="text-[10px] font-mono text-terminal-secondary">{n.toFixed(1)}%</span>
    </span>
  );
}

export default function SupplyChainPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("network");
  const [roleFilter, setRoleFilter] = useState("");
  const [techFilter, setTechFilter] = useState("");
  const [search, setSearch] = useState("");
  const [prCode, setPrCode] = useState("");
  const [fragilityFilter, setFragilityFilter] = useState("");
  const [applied, setApplied] = useState<{ role: string; tech: string; search: string; prCode: string; fragility: string }>({
    role: "", tech: "", search: "", prCode: "", fragility: "",
  });

  const apply = () => setApplied({ role: roleFilter, tech: techFilter, search, prCode, fragility: fragilityFilter });
  const clear = () => {
    setRoleFilter(""); setTechFilter(""); setSearch(""); setPrCode(""); setFragilityFilter("");
    setApplied({ role: "", tech: "", search: "", prCode: "", fragility: "" });
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

  const { data: fragility, isFetching: fragLoading } = useQuery({
    queryKey: ["supply-chain-fragility", applied.prCode, applied.fragility],
    queryFn: () => getSupplyChainFragility({
      pr_code: applied.prCode || undefined,
      pr_fragility: applied.fragility || undefined,
    }),
    enabled: tab === "fragility",
    staleTime: 60_000,
  });

  const loading = netLoading || depsLoading || centLoading || fragLoading;

  const TABS: { key: Tab; label: string }[] = [
    { key: "network",      label: "NETWORK" },
    { key: "dependencies", label: "DEPENDENCIES" },
    { key: "centrality",   label: "CENTRALITY" },
    { key: "fragility",    label: "FRAGILITY" },
  ];

  const rowCount =
    tab === "network"      ? (network?.total ?? 0) :
    tab === "dependencies" ? (deps?.total ?? 0) :
    tab === "centrality"   ? (centrality?.total ?? 0) :
    (fragility?.total ?? 0);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <Link2 size={16} className="text-terminal-cyan" />
        <h1 className="text-terminal-cyan text-sm font-bold tracking-widest">SUPPLY CHAIN INTELLIGENCE</h1>
        <span className="text-terminal-dim text-xs">
          v_dfm_defence_supply_chain_v3 · v_dfm_pr_full_supply_chain_enriched_v2
        </span>
      </div>

      {/* Filters */}
      <div className="panel p-3 flex flex-wrap items-center gap-3">
        {(tab === "network" || tab === "dependencies" || tab === "centrality") && (
          <>
            <input
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && apply()}
              placeholder="Supply chain role…"
              className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-44 placeholder:text-terminal-dim"
            />
            {tab !== "centrality" && (
              <input
                value={techFilter}
                onChange={(e) => setTechFilter(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && apply()}
                placeholder="Tech code…"
                className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-36 placeholder:text-terminal-dim"
              />
            )}
            {tab !== "network" && (
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && apply()}
                placeholder="Entity search…"
                className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-40 placeholder:text-terminal-dim"
              />
            )}
          </>
        )}
        {tab === "fragility" && (
          <>
            <input
              value={prCode}
              onChange={(e) => setPrCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && apply()}
              placeholder="Priority code…"
              className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-36 placeholder:text-terminal-dim"
            />
            <select
              value={fragilityFilter}
              onChange={(e) => setFragilityFilter(e.target.value)}
              className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-2 py-1.5 outline-none"
            >
              <option value="">All fragility</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </>
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
        {tab === "fragility" && (
          fragLoading && (fragility?.data ?? []).length === 0 ? (
            <div className="flex items-center justify-center h-32 text-terminal-orange text-xs animate-pulse tracking-widest">
              LOADING…
            </div>
          ) : (fragility?.data ?? []).length === 0 ? (
            <div className="flex items-center justify-center h-32 text-terminal-dim text-xs tracking-widest">
              NO DATA
            </div>
          ) : (
            <table className="dfm-table w-full">
              <thead>
                <tr>
                  <th>PR Code</th>
                  <th>Entity ID</th>
                  <th>Tech Code</th>
                  <th>Scenario</th>
                  <th>PR Fragility</th>
                  <th>Tech Fragility</th>
                  <th>Tech Remaining</th>
                </tr>
              </thead>
              <tbody>
                {(fragility?.data ?? []).map((row: ViewRow, i: number) => {
                  const isHighRisk =
                    String(row.pr_fragility ?? "").toUpperCase() === "HIGH" ||
                    String(row.tech_fragility ?? "").toUpperCase() === "HIGH";
                  return (
                    <tr
                      key={i}
                      onClick={() => { if (row.entity_id) router.push(`/entities/${String(row.entity_id)}`); }}
                      className={[
                        "transition-colors",
                        row.entity_id ? "cursor-pointer" : "",
                        isHighRisk ? "border-l-2 border-terminal-red bg-red-950/10" : "border-l-2 border-transparent",
                      ].join(" ")}
                    >
                      <td className="font-mono text-terminal-cyan">{String(row.pr_code ?? "—")}</td>
                      <td className="font-mono text-terminal-dim text-[10px]">{String(row.entity_id ?? "—")}</td>
                      <td className="font-mono text-terminal-secondary">{String(row.tech_code ?? "—")}</td>
                      <td className="text-terminal-dim text-[10px]">{String(row.scenario_code ?? "—")}</td>
                      <td><FragilityPill value={row.pr_fragility} /></td>
                      <td><FragilityPill value={row.tech_fragility} /></td>
                      <td><RemainingBar pct={row.tech_remaining_percent} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        )}
      </div>

      <StatusBar
        loading={loading}
        message={`SUPPLY CHAIN · ${tab.toUpperCase()} · ${rowCount.toLocaleString()} rows`}
      />
    </div>
  );
}
