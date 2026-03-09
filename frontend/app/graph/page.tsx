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
import { getGraphNodes, getGraphEdges, getEntitySubgraph } from "@/lib/api";
import type { ViewRow } from "@/lib/types";
import StatusBar from "@/components/StatusBar";

const LAYOUT_GAP = 180;

// node_label is the actual DB column name in v_dfm_graph_nodes_v1
function layoutNodes(raw: ViewRow[]): Node[] {
  return raw.map((n, i) => {
    const col = i % 8;
    const row = Math.floor(i / 8);
    return {
      id: String(n.node_id ?? i),
      data: {
        label: String(n.node_label ?? n.node_id ?? i),
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

// from_id / to_id / edge_type are the actual DB column names in v_dfm_graph_edges_v3
function buildEdges(raw: ViewRow[]): Edge[] {
  return raw
    .filter((e) => e.from_id && e.to_id)
    .map((e, i) => ({
      id: String(e.edge_id ?? i),
      source: String(e.from_id),
      target: String(e.to_id),
      label: String(e.edge_type ?? ""),
      animated: false,
      style: { stroke: "#1e3a5f", strokeWidth: 1 },
      labelStyle: { fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" },
    }));
}

type Mode = "global" | "subgraph";

export default function GraphPage() {
  const [entityFilter, setEntityFilter] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [mode, setMode] = useState<Mode>("global");

  const apply = () => {
    setSubmitted(entityFilter);
    setMode(entityFilter ? "subgraph" : "global");
  };

  const clear = () => {
    setEntityFilter("");
    setSubmitted("");
    setMode("global");
  };

  // Global mode: load all nodes + edges (capped)
  const { data: nodesData, isFetching: loadingNodes } = useQuery({
    queryKey: ["graph-nodes-global"],
    queryFn: () => getGraphNodes({ limit: 300 }),
    enabled: mode === "global",
  });

  const { data: edgesData, isFetching: loadingEdges } = useQuery({
    queryKey: ["graph-edges-global"],
    queryFn: () => getGraphEdges({ limit: 600 }),
    enabled: mode === "global",
  });

  // Subgraph mode: ego-network for a specific entity
  const { data: subgraph, isFetching: loadingSubgraph } = useQuery({
    queryKey: ["graph-subgraph", submitted],
    queryFn: () => getEntitySubgraph(submitted, 300),
    enabled: mode === "subgraph" && !!submitted,
  });

  const rawNodes: ViewRow[] =
    mode === "subgraph"
      ? (subgraph?.nodes ?? [])
      : (nodesData?.nodes ?? []);

  const rawEdges: ViewRow[] =
    mode === "subgraph"
      ? (subgraph?.edges ?? [])
      : (edgesData?.edges ?? []);

  const initialNodes = useMemo(() => layoutNodes(rawNodes), [rawNodes]);
  const initialEdges = useMemo(() => buildEdges(rawEdges), [rawEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => setNodes(initialNodes), [initialNodes, setNodes]);
  useEffect(() => setEdges(initialEdges), [initialEdges, setEdges]);

  const loading = loadingNodes || loadingEdges || loadingSubgraph;
  const nodeCount = rawNodes.length;
  const edgeCount = rawEdges.length;

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <GitBranch size={16} className="text-terminal-cyan" />
        <h1 className="text-terminal-cyan text-sm font-bold tracking-widest">KNOWLEDGE GRAPH</h1>
        <span className="text-terminal-dim text-xs">
          v_dfm_graph_nodes_v1 · v_dfm_graph_edges_v3
        </span>
      </div>

      <div className="panel p-3 flex items-center gap-3">
        <input
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="Entity ID for ego-network… (blank = global view)"
          className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-72 placeholder:text-terminal-dim"
        />
        <button onClick={apply} className="text-terminal-cyan text-xs hover:text-white">APPLY</button>
        <button onClick={clear} className="text-terminal-dim text-xs hover:text-terminal-text">CLEAR</button>
        <div className="flex-1" />
        <span className="text-terminal-secondary text-xs">
          {mode === "subgraph" ? `EGO · ${submitted}` : "GLOBAL"} · {nodeCount} nodes · {edgeCount} edges
        </span>
      </div>

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

      <StatusBar
        loading={loading}
        message={`GRAPH · ${nodeCount} nodes · ${edgeCount} edges${mode === "subgraph" ? ` · EGO: ${submitted}` : ""}`}
      />
    </div>
  );
}
