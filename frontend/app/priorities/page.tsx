"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Cpu, ChevronRight } from "lucide-react";
import { getPriorities, getRootPriorities } from "@/lib/api";
import type { ViewRow } from "@/lib/types";
import StatusBar from "@/components/StatusBar";
import DataTable from "@/components/DataTable";

function PriorityNode({ row, depth, onSelect }: { row: ViewRow; depth: number; onSelect: (id: string) => void }) {
  const indent = depth * 16;
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 hover:bg-terminal-muted cursor-pointer border-b border-terminal-muted transition-colors"
      style={{ paddingLeft: `${12 + indent}px` }}
      onClick={() => onSelect(String(row.priority_id ?? row.id ?? ""))}
    >
      <ChevronRight size={11} className="text-terminal-dim shrink-0" />
      <span className="text-terminal-cyan text-xs font-medium">
        {String(row.name ?? row.priority_name ?? row.label ?? row.priority_id ?? "—")}
      </span>
      {row.level !== undefined && (
        <span className="text-terminal-dim text-xs ml-2">L{String(row.level)}</span>
      )}
    </div>
  );
}

export default function PrioritiesPage() {
  const [selectedParent, setSelectedParent] = useState<string | undefined>();

  const { data: roots, isFetching: loadingRoots } = useQuery({
    queryKey: ["priorities-root"],
    queryFn: getRootPriorities,
  });

  const { data: children, isFetching: loadingChildren } = useQuery({
    queryKey: ["priorities-children", selectedParent],
    queryFn: () => getPriorities({ parent_id: selectedParent }),
    enabled: !!selectedParent,
  });

  const { data: all, isFetching: loadingAll } = useQuery({
    queryKey: ["priorities-all"],
    queryFn: () => getPriorities(),
  });

  const displayData = selectedParent ? children?.data : all?.data;

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <Cpu size={16} className="text-terminal-cyan" />
        <h1 className="text-terminal-cyan text-sm font-bold tracking-widest">STRATEGIC PRIORITIES</h1>
        <span className="text-terminal-dim text-xs">v_dfm_priority_tree_v1</span>
      </div>

      <div className="grid grid-cols-3 gap-4 flex-1 overflow-hidden">
        {/* Root tree */}
        <div className="panel overflow-auto">
          <div className="px-3 py-2 border-b border-terminal-border text-terminal-cyan text-xs tracking-widest">
            ROOT NODES
          </div>
          {roots?.data.map((row, i) => (
            <PriorityNode key={i} row={row} depth={0} onSelect={setSelectedParent} />
          ))}
          {loadingRoots && (
            <div className="px-3 py-4 text-terminal-orange text-xs animate-pulse">LOADING…</div>
          )}
        </div>

        {/* Detail table */}
        <div className="col-span-2 panel overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b border-terminal-border flex items-center justify-between">
            <span className="text-terminal-cyan text-xs tracking-widest">
              {selectedParent ? `CHILDREN OF ${selectedParent}` : "ALL PRIORITIES"}
            </span>
            {selectedParent && (
              <button
                onClick={() => setSelectedParent(undefined)}
                className="text-terminal-dim text-xs hover:text-terminal-text"
              >
                ✕ CLEAR
              </button>
            )}
          </div>
          <DataTable
            data={displayData ?? []}
            maxHeight="calc(100vh - 240px)"
          />
        </div>
      </div>

      <StatusBar loading={loadingRoots || loadingChildren || loadingAll} message="PRIORITIES" />
    </div>
  );
}
