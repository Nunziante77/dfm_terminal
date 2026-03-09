"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Cpu, ChevronRight } from "lucide-react";
import {
  getDistinctPriorities,
  getPriorityNodes,
  getPriorityEntities,
  getPriorityNormative,
} from "@/lib/api";
import type { ViewRow } from "@/lib/types";
import DataTable from "@/components/DataTable";
import StatusBar from "@/components/StatusBar";

type DetailTab = "nodes" | "entities" | "normative";

export default function PrioritiesPage() {
  const router = useRouter();
  const [selectedPrId, setSelectedPrId] = useState<string | undefined>();
  const [detailTab, setDetailTab] = useState<DetailTab>("nodes");

  const { data: distinct, isFetching: loadingDistinct } = useQuery({
    queryKey: ["priorities-distinct"],
    queryFn: getDistinctPriorities,
  });

  const { data: nodes, isFetching: loadingNodes } = useQuery({
    queryKey: ["priority-nodes", selectedPrId],
    queryFn: () => getPriorityNodes(selectedPrId!),
    enabled: !!selectedPrId && detailTab === "nodes",
  });

  const { data: entities, isFetching: loadingEntities } = useQuery({
    queryKey: ["priority-entities", selectedPrId],
    queryFn: () => getPriorityEntities(selectedPrId!),
    enabled: !!selectedPrId && detailTab === "entities",
  });

  const { data: normative, isFetching: loadingNormative } = useQuery({
    queryKey: ["priority-normative", selectedPrId],
    queryFn: () => getPriorityNormative(selectedPrId!),
    enabled: !!selectedPrId && detailTab === "normative",
  });

  const loading = loadingDistinct || loadingNodes || loadingEntities || loadingNormative;

  const DETAIL_TABS: { key: DetailTab; label: string }[] = [
    { key: "nodes",    label: "TREE NODES" },
    { key: "entities", label: "ALIGNED ENTITIES" },
    { key: "normative", label: "NORMATIVE COVERAGE" },
  ];

  const handleEntityRow = (row: ViewRow) => {
    if (row.entity_id) router.push(`/entities/${row.entity_id}`);
  };

  const handleNormativeRow = (row: ViewRow) => {
    if (row.doc_id) router.push(`/normative/${row.doc_id}`);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <Cpu size={16} className="text-terminal-cyan" />
        <h1 className="text-terminal-cyan text-sm font-bold tracking-widest">STRATEGIC PRIORITIES</h1>
        <span className="text-terminal-dim text-xs">v_dfm_priority_tree_v1</span>
      </div>

      <div className="grid grid-cols-3 gap-4 flex-1 overflow-hidden">
        {/* Left: priority list */}
        <div className="panel overflow-auto">
          <div className="px-3 py-2 border-b border-terminal-border text-terminal-cyan text-xs tracking-widest">
            PRIORITIES ({distinct?.total ?? 0})
          </div>
          {loadingDistinct && (
            <div className="px-3 py-4 text-terminal-orange text-xs animate-pulse">LOADING…</div>
          )}
          {distinct?.data.map((row: ViewRow) => {
            const id = String(row.pr_id ?? "");
            return (
              <div
                key={id}
                onClick={() => { setSelectedPrId(id); setDetailTab("nodes"); }}
                className={`flex items-start gap-2 px-3 py-2 text-xs cursor-pointer border-b border-terminal-muted transition-colors ${
                  selectedPrId === id
                    ? "bg-terminal-muted text-terminal-cyan border-l-2 border-terminal-cyan"
                    : "text-terminal-secondary hover:bg-terminal-muted hover:text-terminal-text border-l-2 border-transparent"
                }`}
              >
                <ChevronRight size={10} className="shrink-0 text-terminal-dim mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-mono font-bold">{id || "—"}</div>
                  <div className="text-terminal-dim mt-0.5 flex gap-3">
                    {row.node_count != null && (
                      <span>{String(row.node_count)} nodes</span>
                    )}
                    {row.entity_count != null && (
                      <span className="text-terminal-cyan">{String(row.entity_count)} entities</span>
                    )}
                    {row.normative_doc_count != null && (
                      <span className="text-terminal-orange">{String(row.normative_doc_count)} docs</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: detail panel */}
        <div className="col-span-2 panel overflow-hidden flex flex-col">
          {/* Detail header */}
          <div className="border-b border-terminal-border">
            <div className="px-3 py-2 flex items-center justify-between">
              <span className="text-terminal-cyan text-xs tracking-widest">
                {selectedPrId ? selectedPrId : "SELECT A PRIORITY"}
              </span>
              {selectedPrId && (
                <button
                  onClick={() => setSelectedPrId(undefined)}
                  className="text-terminal-dim text-xs hover:text-terminal-text"
                >
                  ✕ CLEAR
                </button>
              )}
            </div>
            {selectedPrId && (
              <div className="flex border-t border-terminal-muted">
                {DETAIL_TABS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setDetailTab(key)}
                    className={`px-4 py-1.5 text-xs tracking-wider border-b-2 transition-colors ${
                      detailTab === key
                        ? "border-terminal-cyan text-terminal-cyan"
                        : "border-transparent text-terminal-secondary hover:text-terminal-text"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!selectedPrId && (
            <div className="flex-1 flex items-center justify-center text-terminal-dim text-xs tracking-widest">
              SELECT A PRIORITY ON THE LEFT
            </div>
          )}

          {selectedPrId && detailTab === "nodes" && (
            <DataTable
              data={nodes?.data ?? []}
              columns={["pr_id", "node_id", "node_level"]}
              maxHeight="calc(100vh - 280px)"
            />
          )}

          {selectedPrId && detailTab === "entities" && (
            <div className="flex flex-col overflow-hidden flex-1">
              {/* Autonomy + concentration header */}
              {entities && (
                <div className="grid grid-cols-5 gap-px border-b border-terminal-border bg-terminal-border shrink-0">
                  {[
                    { label: "HHI STRUCTURAL",    value: entities.hhi_structural != null ? Number(entities.hhi_structural).toFixed(3) : "—", warn: entities.hhi_structural != null && Number(entities.hhi_structural) > 0.25 },
                    { label: "CONCENTRATION",      value: entities.concentration_entity_count != null ? String(entities.concentration_entity_count) + " entities" : "—", warn: false },
                    { label: "AUTONOMY FLAG",      value: entities.autonomy_flag ?? "—", warn: !!entities.autonomy_flag && entities.autonomy_flag !== "RESILIENT" },
                    { label: "EU ENTITIES",        value: entities.eu_entities_remaining != null ? String(entities.eu_entities_remaining) : "—", warn: false },
                    { label: "NON-EU ENTITIES",    value: entities.non_eu_entities_remaining != null ? String(entities.non_eu_entities_remaining) : "—", warn: (entities.non_eu_entities_remaining ?? 0) > (entities.eu_entities_remaining ?? 0) },
                  ].map(({ label, value, warn }) => (
                    <div key={label} className="bg-terminal-panel px-3 py-2">
                      <div className="text-[9px] text-terminal-dim tracking-widest mb-0.5">{label}</div>
                      <div className={`text-xs font-mono font-semibold ${warn ? "text-terminal-orange" : "text-terminal-cyan"}`}>{value}</div>
                    </div>
                  ))}
                </div>
              )}
              <DataTable
                data={entities?.data ?? []}
                columns={[
                  "entity_id", "official_name", "headquarters_country_iso2",
                  "primary_strategic_code", "final_score", "highest_trl",
                  "supported_op_count", "supported_tc_count",
                ]}
                onRowClick={handleEntityRow}
                maxHeight="calc(100vh - 340px)"
              />
            </div>
          )}

          {selectedPrId && detailTab === "normative" && (
            <DataTable
              data={normative?.data ?? []}
              columns={["doc_id", "priority_code", "title", "issuer", "doc_type", "published_date"]}
              onRowClick={handleNormativeRow}
              maxHeight="calc(100vh - 280px)"
            />
          )}
        </div>
      </div>

      <StatusBar loading={loading} message={selectedPrId ? `PRIORITIES · ${selectedPrId}` : "PRIORITIES"} />
    </div>
  );
}
