"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Target } from "lucide-react";
import {
  getCapabilityDemand,
  getCapabilityGaps,
  getCapabilitiesByTechnology,
} from "@/lib/api";
import DataTable from "@/components/DataTable";
import StatusBar from "@/components/StatusBar";

type Tab = "demand" | "gaps" | "by-technology";

export default function CapabilitiesPage() {
  const [tab, setTab] = useState<Tab>("demand");
  const [techFilter, setTechFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [applied, setApplied] = useState<{ tech: string; country: string; role: string }>({
    tech: "", country: "", role: "",
  });

  const apply = () => setApplied({ tech: techFilter, country: countryFilter, role: roleFilter });
  const clear = () => {
    setTechFilter(""); setCountryFilter(""); setRoleFilter("");
    setApplied({ tech: "", country: "", role: "" });
  };

  const { data: demand, isFetching: demandLoading } = useQuery({
    queryKey: ["cap-demand", applied.tech],
    queryFn: () => getCapabilityDemand({ dfm_tech_code: applied.tech || undefined }),
    enabled: tab === "demand",
    staleTime: 60_000,
  });

  const { data: gaps, isFetching: gapsLoading } = useQuery({
    queryKey: ["cap-gaps", applied.role, applied.tech],
    queryFn: () => getCapabilityGaps({
      supply_chain_role: applied.role || undefined,
      dfm_tech_code: applied.tech || undefined,
    }),
    enabled: tab === "gaps",
    staleTime: 60_000,
  });

  const { data: byTech, isFetching: byTechLoading } = useQuery({
    queryKey: ["cap-by-tech", applied.country, applied.tech],
    queryFn: () => getCapabilitiesByTechnology({
      country_code: applied.country || undefined,
      dfm_tech_code: applied.tech || undefined,
    }),
    enabled: tab === "by-technology",
    staleTime: 60_000,
  });

  const loading = demandLoading || gapsLoading || byTechLoading;

  const rowCount =
    tab === "demand"        ? (demand?.total ?? 0) :
    tab === "gaps"          ? (gaps?.total ?? 0) :
    (byTech?.total ?? 0);

  const TABS: { key: Tab; label: string }[] = [
    { key: "demand",        label: "CAPABILITY DEMAND" },
    { key: "gaps",          label: "CAPABILITY GAPS" },
    { key: "by-technology", label: "BY COUNTRY·TECH" },
  ];

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <Target size={16} className="text-terminal-cyan" />
        <h1 className="text-terminal-cyan text-sm font-bold tracking-widest">CAPABILITY INTELLIGENCE</h1>
        <span className="text-terminal-dim text-xs">
          demand-gap analysis · procurement coverage
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
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="Supply chain role…"
          className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-44 placeholder:text-terminal-dim"
        />
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
        {tab === "demand" && (
          <DataTable
            data={demand?.data ?? []}
            columns={["dfm_tech_code", "contracts", "procurement_value", "suppliers"]}
            maxHeight="calc(100vh - 320px)"
          />
        )}
        {tab === "gaps" && (
          <DataTable
            data={gaps?.data ?? []}
            columns={["supply_chain_role", "dfm_tech_code", "contracts", "procurement_value"]}
            maxHeight="calc(100vh - 320px)"
          />
        )}
        {tab === "by-technology" && (
          <DataTable
            data={byTech?.data ?? []}
            columns={["country_code", "dfm_tech_code", "contracts", "procurement_value"]}
            maxHeight="calc(100vh - 320px)"
          />
        )}
      </div>

      <StatusBar
        loading={loading}
        message={`CAPABILITIES · ${tab.toUpperCase()} · ${
          tab === "demand" ? (demand?.total ?? 0) :
          tab === "gaps" ? (gaps?.total ?? 0) :
          (byTech?.total ?? 0)
        } rows`}
      />
    </div>
  );
}
