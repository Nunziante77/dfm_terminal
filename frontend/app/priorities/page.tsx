"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Cpu, ChevronRight } from "lucide-react";
import { getDistinctPriorities, getPriorityNodes } from "@/lib/api";
import type { ViewRow } from "@/lib/types";
import DataTable from "@/components/DataTable";
import StatusBar from "@/components/StatusBar";

export default function PrioritiesPage() {
  const [selectedPrId, setSelectedPrId] = useState<string | undefined>();

  const { data: distinct, isFetching: loadingDistinct } = useQuery({
    queryKey: ["priorities-distinct"],
    queryFn: getDistinctPriorities,
  });

  const { data: nodes, isFetching: loadingNodes } = useQuery({
    queryKey: ["priority-nodes", selectedPrId],
    queryFn: () => getPriorityNodes(selectedPrId!),
    enabled: !!selectedPrId,
  });

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <Cpu size={16} className="text-terminal-cyan" />
        <h1 className="text-terminal-cyan text-sm font-bold tracking-widest">STRATEGIC PRIORITIES</h1>
        <span className="text-terminal-dim text-xs">v_dfm_priority_tree_v1</span>
      </div>

      <div className="grid grid-cols-3 gap-4 flex-1 overflow-hidden">
        {/* Priority list */}
        <div className="panel overflow-auto">
          <div className="px-3 py-2 border-b border-terminal-border text-terminal-cyan text-xs tracking-widest">
            PRIORITIES ({distinct?.total ?? 0})
          </div>
          {loadingDistinct && (
            <div className="px-3 py-4 text-terminal-orange text-xs animate-pulse">LOADING…</div>
          )}
          {distinct?.data.map((row: ViewRow, i: number) => {
            const id = String(row.pr_id ?? "");
            return (
              <div
                key={i}
                onClick={() => setSelectedPrId(id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs cursor-pointer border-b border-terminal-muted transition-colors ${
                  selectedPrId === id
                    ? "bg-terminal-muted text-terminal-cyan border-l-2 border-terminal-cyan"
                    : "text-terminal-secondary hover:bg-terminal-muted hover:text-terminal-text border-l-2 border-transparent"
                }`}
              >
                <ChevronRight size={10} className="shrink-0 text-terminal-dim" />
                <span className="font-mono">{id || "—"}</span>
              </div>
            );
          })}
        </div>

        {/* Nodes for selected priority */}
        <div className="col-span-2 panel overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b border-terminal-border flex items-center justify-between">
            <span className="text-terminal-cyan text-xs tracking-widest">
              {selectedPrId ? `NODES · ${selectedPrId}` : "SELECT A PRIORITY"}
            </span>
            {selectedPrId && (
              <button onClick={() => setSelectedPrId(undefined)}
                className="text-terminal-dim text-xs hover:text-terminal-text">✕ CLEAR</button>
            )}
          </div>
          {!selectedPrId && (
            <div className="flex-1 flex items-center justify-center text-terminal-dim text-xs tracking-widest">
              SELECT A PRIORITY ON THE LEFT
            </div>
          )}
          {selectedPrId && (
            <DataTable
              data={nodes?.data ?? []}
              columns={["pr_id", "node_id", "node_level"]}
              maxHeight="calc(100vh - 240px)"
            />
          )}
        </div>
      </div>

      <StatusBar loading={loadingDistinct || loadingNodes} message="PRIORITIES" />
    </div>
  );
}
