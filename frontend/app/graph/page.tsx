"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import { useQuery } from "@tanstack/react-query";
import { GitBranch } from "lucide-react";
import { getGraphNodes, getGraphEdges } from "@/lib/api";
import type { ViewRow } from "@/lib/types";
import StatusBar from "@/components/StatusBar";

const LAYOUT_GAP = 180;

function layoutNodes(raw: ViewRow[]): Node[] {
  return raw.map((n, i) => {
    const col = i % 8;
    const row = Math.floor(i / 8);
    return {
      id: String(n.node_id ?? n.id ?? i),
      data: {
        label: String(n.label ?? n.entity_name ?? n.name ?? n.node_id ?? i),
        type: String(n.node_type ?? "entity"),
        ...n,
      },
      position: { x: col * LAYOUT_GAP, y: row * LAYOUT_GAP },
      style: {
        background: "#0f1629",
        color: "#00d4ff",
        border: "1px solid #1e3a5f",
        borderRadius: 4,
        fontSize: 11,
        padding: "4px 8px",
        fontFamily: "monospace",
      },
    };
  });
}

function buildEdges(raw: ViewRow[]): Edge[] {
  return raw.map((e, i) => ({
    id: String(e.edge_id ?? i),
    source: String(e.source_id ?? e.source ?? ""),
    target: String(e.target_id ?? e.target ?? ""),
    label: String(e.relationship_type ?? e.label ?? ""),
    animated: false,
    style: { stroke: "#1e3a5f", strokeWidth: 1 },
    labelStyle: { fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" },
  }));
}

export default function GraphPage() {
  const [entityFilter, setEntityFilter] = useState("");
  const [submitted, setSubmitted] = useState("");

  const { data: nodesData, isFetching: loadingNodes } = useQuery({
    queryKey: ["graph-nodes", submitted],
    queryFn: () => getGraphNodes({ entity_id: submitted || undefined, limit: 300 }),
  });

  const { data: edgesData, isFetching: loadingEdges } = useQuery({
    queryKey: ["graph-edges", submitted],
    queryFn: () => getGraphEdges({ source_id: submitted || undefined, limit: 600 }),
  });

  const initialNodes = useMemo(
    () => layoutNodes(nodesData?.nodes ?? []),
    [nodesData]
  );
  const initialEdges = useMemo(
    () => buildEdges(edgesData?.edges ?? []),
    [edgesData]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => setNodes(initialNodes), [initialNodes, setNodes]);
  useEffect(() => setEdges(initialEdges), [initialEdges, setEdges]);

  const loading = loadingNodes || loadingEdges;

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <GitBranch size={16} className="text-terminal-cyan" />
        <h1 className="text-terminal-cyan text-sm font-bold tracking-widest">KNOWLEDGE GRAPH</h1>
        <span className="text-terminal-dim text-xs">
          v_dfm_graph_nodes_v1 · v_dfm_graph_edges_v3
        </span>
      </div>

      {/* Filter */}
      <div className="panel p-3 flex items-center gap-3">
        <input
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && setSubmitted(entityFilter)}
          placeholder="Filter by entity ID… (Enter to apply)"
          className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-64 placeholder:text-terminal-dim"
        />
        <button
          onClick={() => setSubmitted(entityFilter)}
          className="text-terminal-cyan text-xs hover:text-white transition-colors"
        >
          APPLY
        </button>
        <button
          onClick={() => { setEntityFilter(""); setSubmitted(""); }}
          className="text-terminal-dim text-xs hover:text-terminal-text transition-colors"
        >
          CLEAR
        </button>
        <div className="flex-1" />
        <span className="text-terminal-secondary text-xs">
          {nodesData?.count ?? 0} nodes · {edgesData?.count ?? 0} edges
        </span>
      </div>

      {/* React Flow canvas */}
      <div className="panel flex-1 overflow-hidden" style={{ minHeight: "calc(100vh - 280px)" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          style={{ background: "#0a0e1a" }}
        >
          <Background color="#1e3a5f" gap={32} variant={BackgroundVariant.Dots} />
          <Controls style={{ background: "#0f1629", border: "1px solid #1e3a5f", color: "#00d4ff" }} />
          <MiniMap
            style={{ background: "#0f1629", border: "1px solid #1e3a5f" }}
            nodeColor="#00d4ff"
            maskColor="rgba(10,14,26,0.8)"
          />
        </ReactFlow>
      </div>

      <StatusBar loading={loading} message={`GRAPH · ${nodesData?.count ?? 0} nodes · ${edgesData?.count ?? 0} edges`} />
    </div>
  );
}
