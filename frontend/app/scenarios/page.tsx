"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { getEntityScenario } from "@/lib/api";
import type { ScenarioResponse } from "@/lib/types";
import EntityPicker, { type SelectedEntity } from "@/components/EntityPicker";
import StatusBar from "@/components/StatusBar";

// ── Metric rows ─────────────────────────────────────────────────────────────

type MetricRow = {
  group: string;
  label: string;
  extract: (s: ScenarioResponse) => string;
  highlight?: boolean;
};

function str(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") return Number.isInteger(v) ? v.toLocaleString() : v.toFixed(2);
  if (typeof v === "boolean") return v ? "YES" : "NO";
  return String(v);
}

const METRICS: MetricRow[] = [
  { group: "IDENTITY",     label: "Name",              highlight: true, extract: s => str(s.profile?.official_name) },
  { group: "IDENTITY",     label: "Type",                               extract: s => str((s.profile as any)?.entity_type_code) },
  { group: "IDENTITY",     label: "Country",                            extract: s => str((s.profile as any)?.hq_country) },
  { group: "IDENTITY",     label: "Ownership",                          extract: s => str((s.profile as any)?.ownership_status) },

  { group: "RANKING",      label: "Strategic Code",                     extract: s => str((s.ranking as any)?.primary_strategic_code) },
  { group: "RANKING",      label: "Final Score",       highlight: true, extract: s => str((s.ranking as any)?.final_score) },
  { group: "RANKING",      label: "Base Score",                         extract: s => str((s.ranking as any)?.base_score) },
  { group: "RANKING",      label: "Highest TRL",                        extract: s => str((s.ranking as any)?.highest_trl) },
  { group: "RANKING",      label: "Supported OPs",                      extract: s => str((s.ranking as any)?.supported_op_count) },
  { group: "RANKING",      label: "Supported TCs",                      extract: s => str((s.ranking as any)?.supported_tc_count) },

  { group: "RESEARCH",     label: "Projects",                           extract: s => str((s.research as any)?.project_count) },
  { group: "RESEARCH",     label: "EC Contribution",   highlight: true, extract: s => str((s.research as any)?.total_ec) },

  { group: "PROCURE",      label: "Procurement Total", highlight: true, extract: s => str((s.procurement as any)?.procurement_total) },
  { group: "PROCURE",      label: "Contracts",                          extract: s => str((s.procurement as any)?.contracts) },

  { group: "FDI",          label: "FDI Level",         highlight: true, extract: s => str((s.fdi as any)?.fdi_level_canonical) },
  { group: "FDI",          label: "Escalation",                         extract: s => str((s.fdi as any)?.fdi_escalation_flag_canonical) },
  { group: "FDI",          label: "Sovereignty Risk",                   extract: s => str((s.fdi as any)?.sovereignty_risk_multiplier) },

  { group: "EVENTS",       label: "Total Events",      highlight: true, extract: s => str((s.events as any)?.events_total) },
  { group: "EVENTS",       label: "Contract Value",                     extract: s => str((s.events as any)?.total_contract_value) },
  { group: "EVENTS",       label: "First Event",                        extract: s => str((s.events as any)?.first_event) },
  { group: "EVENTS",       label: "Last Event",                         extract: s => str((s.events as any)?.last_event) },

  { group: "GRAPH",        label: "Graph Edges",                        extract: s => str(s.graph_connectivity?.edge_count) },

  { group: "NORMATIVE",    label: "Eval Count",                         extract: s => str((s.normative_compliance as any)?.eval_count) },
  { group: "NORMATIVE",    label: "Pass",              highlight: true, extract: s => str((s.normative_compliance as any)?.pass_count) },
  { group: "NORMATIVE",    label: "Fail",                               extract: s => str((s.normative_compliance as any)?.fail_count) },

  { group: "TECH",         label: "Tech Domains",                       extract: s => String(s.tech_domains?.length ?? "—") },

  { group: "SUPPLY CHAIN", label: "SC Role",           highlight: true, extract: s => str((s.supply_chain as any)?.supply_chain_role) },
  { group: "SUPPLY CHAIN", label: "SC Tech Code",                       extract: s => str((s.supply_chain as any)?.dfm_tech_code) },
  { group: "SUPPLY CHAIN", label: "SC Proc. Value",                     extract: s => str((s.supply_chain as any)?.procurement_value) },

  { group: "AUTONOMY",     label: "Autonomy Flag",     highlight: true, extract: s => str((s.autonomy as any)?.autonomy_flag) },
  { group: "AUTONOMY",     label: "EU Entities",                        extract: s => str((s.autonomy as any)?.eu_entities_remaining) },
  { group: "AUTONOMY",     label: "Non-EU Entities",                    extract: s => str((s.autonomy as any)?.non_eu_entities_remaining) },
];

const GROUPS = Array.from(new Set(METRICS.map((m) => m.group)));
const MAX_SLOTS = 6;

// ── Fixed 6-slot query hooks ────────────────────────────────────────────────

function useSlot(id: string) {
  return useQuery<ScenarioResponse>({
    queryKey: ["scenario", id],
    queryFn: () => getEntityScenario(id),
    enabled: id.trim().length > 0,
  });
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function ScenariosPage() {
  const [selected, setSelected] = useState<SelectedEntity[]>([]);
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const [activeNames, setActiveNames] = useState<Record<string, string>>({});

  const s0 = useSlot(activeIds[0] ?? "");
  const s1 = useSlot(activeIds[1] ?? "");
  const s2 = useSlot(activeIds[2] ?? "");
  const s3 = useSlot(activeIds[3] ?? "");
  const s4 = useSlot(activeIds[4] ?? "");
  const s5 = useSlot(activeIds[5] ?? "");
  const slots = [s0, s1, s2, s3, s4, s5];
  const activeSlots = activeIds.map((_, i) => slots[i]);

  const anyLoading = activeSlots.some((s) => s.isLoading);

  const run = () => {
    const ids = selected.map((s) => s.id).slice(0, MAX_SLOTS);
    const names: Record<string, string> = {};
    selected.forEach((s) => { names[s.id] = s.name; });
    setActiveIds(ids);
    setActiveNames(names);
  };

  const clear = () => {
    setSelected([]);
    setActiveIds([]);
    setActiveNames({});
  };

  // Resolve column display name: prefer scenario data name, then picker name, then raw ID
  const nameFor = (id: string, slotIndex: number): string => {
    const scenarioName = str(slots[slotIndex]?.data?.profile?.official_name);
    if (scenarioName && scenarioName !== "—") return scenarioName;
    return activeNames[id] ?? id;
  };

  function cell(slot: typeof s0, slotIndex: number, metric: MetricRow): string {
    if (!activeIds[slotIndex]) return "";
    if (slot.isLoading) return "…";
    if (slot.error || !slot.data) return "ERR";
    return metric.extract(slot.data);
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <Activity size={16} className="text-terminal-cyan" />
        <h1 className="text-terminal-cyan text-sm font-bold tracking-widest">SCENARIO COMPARISON</h1>
        <span className="text-terminal-dim text-xs">multi-entity intelligence matrix</span>
      </div>

      {/* Entity picker */}
      <div className="panel p-3">
        <div className="text-terminal-secondary text-[10px] tracking-widest mb-2">
          SELECT ENTITIES TO COMPARE (2–{MAX_SLOTS})
        </div>
        <EntityPicker
          selected={selected}
          onChange={setSelected}
          max={MAX_SLOTS}
          placeholder="Search entity by name…"
        />
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={run}
            disabled={selected.length < 2}
            className="text-terminal-cyan text-xs hover:text-white disabled:opacity-30 tracking-wider px-3 py-1.5 border border-terminal-border hover:border-terminal-cyan transition-colors"
          >
            RUN {selected.length >= 2 ? `(${selected.length})` : ""}
          </button>
          {(selected.length > 0 || activeIds.length > 0) && (
            <button onClick={clear} className="text-terminal-dim text-xs hover:text-terminal-text">CLEAR</button>
          )}
        </div>
      </div>

      {/* Comparison table */}
      {activeIds.length > 0 ? (
        <div className="panel flex-1 overflow-auto">
          <table className="w-full text-xs font-mono border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-terminal-panel border-b border-terminal-border">
                <th className="px-3 py-2 text-left text-[10px] text-terminal-secondary font-normal tracking-widest w-36">
                  METRIC
                </th>
                {activeIds.map((eid, i) => (
                  <th key={eid} className="px-3 py-2 text-center font-semibold tracking-wider">
                    <div className="text-terminal-cyan truncate max-w-[140px] mx-auto" title={nameFor(eid, i)}>
                      {nameFor(eid, i)}
                    </div>
                    {nameFor(eid, i) !== eid && (
                      <div className="text-terminal-dim text-[9px] font-normal mt-0.5">{eid}</div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GROUPS.map((group) => {
                const groupMetrics = METRICS.filter((m) => m.group === group);
                return (
                  <>
                    <tr key={`g-${group}`} className="bg-terminal-muted">
                      <td
                        colSpan={activeIds.length + 1}
                        className="px-3 py-1 text-[9px] text-terminal-dim tracking-widest font-bold"
                      >
                        {group}
                      </td>
                    </tr>
                    {groupMetrics.map((metric) => (
                      <tr
                        key={`${group}-${metric.label}`}
                        className="border-b border-terminal-muted hover:bg-terminal-muted transition-colors"
                      >
                        <td className="px-3 py-1.5 text-terminal-secondary whitespace-nowrap">{metric.label}</td>
                        {activeSlots.map((slot, si) => {
                          const v = cell(slot, si, metric);
                          return (
                            <td
                              key={si}
                              className={`px-3 py-1.5 text-center whitespace-nowrap ${
                                v === "…"   ? "text-terminal-orange animate-pulse" :
                                v === "ERR" ? "text-terminal-red" :
                                metric.highlight ? "text-terminal-cyan font-semibold" :
                                "text-terminal-text"
                              }`}
                            >
                              {v || ""}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-terminal-dim text-xs tracking-widest">
          SEARCH AND SELECT ENTITIES ABOVE, THEN PRESS RUN
        </div>
      )}

      <StatusBar
        loading={anyLoading}
        message={activeIds.length > 0 ? `COMPARING ${activeIds.length} ENTITIES` : "SCENARIOS"}
      />
    </div>
  );
}
