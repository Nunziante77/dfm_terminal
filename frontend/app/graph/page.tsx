"use client";
import { useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type Node,
  type Edge,
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
  return raw.map((n, i) => ({
    id: String(n.node_id ?? i),
    data: {
      label: String(n.node_label ?? n.node_id ?? i),
      node_type: String(n.node_type ?? "entity"),
    },
    position: { x: (i % 8) * LAYOUT_GAP, y: Math.floor(i / 8) * LAYOUT_GAP },
    style: {
      background: "#0f1629",
      color: "#00d4ff",
      border: "1px solid #1e3a5f",
      borderRadius: 4,
      fontSize: 11,
      padding: "4px 8px",
      fontFamily: "monospace",
    },
  }));
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
    setMode(entityFilter.trim() ? "subgraph" : "global");
  };

  const clear = () => {
    setEntityFilter("");
    setSubmitted("");
    setMode("global");
  };

  // Global mode: all nodes + edges (capped)
  const { data: nodesData, isFetching: loadingNodes } = useQuery({
    queryKey: ["graph-nodes-global"],
    queryFn: () => getGraphNodes({ limit: 300 }),
    enabled: mode === "global",
    staleTime: 60_000,
  });

  const { data: edgesData, isFetching: loadingEdges } = useQuery({
    queryKey: ["graph-edges-global"],
    queryFn: () => getGraphEdges({ limit: 600 }),
    enabled: mode === "global",
    staleTime: 60_000,
  });

  // Subgraph mode: ego-network around a specific entity
  const { data: subgraph, isFetching: loadingSubgraph } = useQuery({
    queryKey: ["graph-subgraph", submitted],
    queryFn: () => getEntitySubgraph(submitted, 300),
    enabled: mode === "subgraph" && submitted.trim().length > 0,
  });

  // Derive raw arrays — stable references from React Query, no ?? [] fallback needed
  const rawNodes: ViewRow[] = mode === "subgraph"
    ? (subgraph?.nodes ?? [])
    : (nodesData?.nodes ?? []);

  const rawEdges: ViewRow[] = mode === "subgraph"
    ? (subgraph?.edges ?? [])
    : (edgesData?.edges ?? []);

  // Compute ReactFlow-ready arrays directly via useMemo.
  // Do NOT use useNodesState/useEdgesState: those initialise from props once at
  // mount (when data is still empty) and require an awkward useEffect sync that
  // causes fitView to miss the final node positions.  Passing nodes/edges as
  // controlled external state lets ReactFlow re-render and re-fit correctly.
  const nodes: Node[] = useMemo(() => layoutNodes(rawNodes), [rawNodes]);
  const edges: Edge[] = useMemo(() => buildEdges(rawEdges), [rawEdges]);

  const loading = loadingNodes || loadingEdges || loadingSubgraph;
  const nodeCount = nodes.length;
  const edgeCount = edges.length;

  // Key changes whenever the data set changes so ReactFlow remounts and
  // re-runs fitView on the actual node positions.
  const flowKey = `${mode}-${nodeCount}-${edgeCount}`;

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
          {loading ? "LOADING…" : `${mode === "subgraph" ? `EGO · ${submitted}` : "GLOBAL"} · ${nodeCount} nodes · ${edgeCount} edges`}
        </span>
      </div>

      <div className="panel flex-1 overflow-hidden" style={{ minHeight: "calc(100vh - 280px)" }}>
        {loading && nodeCount === 0 ? (
          <div className="flex items-center justify-center h-full text-terminal-orange text-xs animate-pulse tracking-widest">
            LOADING GRAPH…
          </div>
        ) : nodeCount === 0 ? (
          <div className="flex items-center justify-center h-full text-terminal-dim text-xs tracking-widest">
            {mode === "subgraph" ? `NO GRAPH DATA FOR ${submitted}` : "NO GRAPH DATA"}
          </div>
        ) : (
          <ReactFlow
            key={flowKey}
            nodes={nodes}
            edges={edges}
            onNodesChange={() => {}}
            onEdgesChange={() => {}}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            fitView
            fitViewOptions={{ padding: 0.2 }}
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
        )}
      </div>

      <StatusBar
        loading={loading}
        message={`GRAPH · ${nodeCount} nodes · ${edgeCount} edges${mode === "subgraph" ? ` · EGO: ${submitted}` : ""}`}
      />
    </div>
  );
}
