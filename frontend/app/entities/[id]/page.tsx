"use client";
import { useState } from "react";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Building2,
  ArrowLeft,
  GitBranch,
  BarChart2,
  Activity,
  FileText,
} from "lucide-react";
import {
  getEntityProfile,
  getEntityContext,
  getEntityRanking,
  getEntityScenario,
  getEntitySubgraph,
} from "@/lib/api";
import type { ViewRow } from "@/lib/types";
import MetricCard from "@/components/MetricCard";
import DataTable from "@/components/DataTable";
import StatusBar from "@/components/StatusBar";
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  type Node,
  type Edge,
} from "reactflow";
import "reactflow/dist/style.css";

type Tab = "profile" | "context" | "graph" | "ranking" | "scenario";

function ProfilePanel({ profile }: { profile: ViewRow }) {
  const entries = Object.entries(profile);
  return (
    <div className="grid grid-cols-2 gap-3">
      {entries.map(([k, v]) => (
        <div key={k} className="panel px-3 py-2">
          <div className="text-terminal-secondary text-[10px] tracking-widest uppercase mb-0.5">
            {k.replace(/_/g, " ")}
          </div>
          <div className={`text-xs font-medium ${
            typeof v === "number" && v > 0 ? "text-terminal-green" :
            typeof v === "number" && v < 0 ? "text-terminal-red" :
            "text-terminal-text"
          }`}>
            {v === null || v === undefined ? "—" : String(v)}
          </div>
        </div>
      ))}
    </div>
  );
}

function buildFlow(rawNodes: ViewRow[], rawEdges: ViewRow[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = rawNodes.map((n, i) => ({
    id: String(n.node_id ?? n.id ?? i),
    data: { label: String(n.label ?? n.entity_name ?? n.name ?? n.node_id ?? i) },
    position: { x: (i % 5) * 180, y: Math.floor(i / 5) * 120 },
    style: {
      background: "#0f1629", color: "#00d4ff",
      border: "1px solid #1e3a5f", borderRadius: 4,
      fontSize: 11, padding: "4px 8px", fontFamily: "monospace",
    },
  }));
  const edges: Edge[] = rawEdges.map((e, i) => ({
    id: String(e.edge_id ?? i),
    source: String(e.source_id ?? e.source ?? ""),
    target: String(e.target_id ?? e.target ?? ""),
    label: String(e.relationship_type ?? e.label ?? ""),
    style: { stroke: "#1e3a5f" },
    labelStyle: { fill: "#94a3b8", fontSize: 10 },
  }));
  return { nodes, edges };
}

export default function EntityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profile");

  const { data: profile, isLoading: pLoading, error: pError } = useQuery({
    queryKey: ["entity-profile", id],
    queryFn: () => getEntityProfile(id),
  });

  const { data: context, isLoading: cLoading } = useQuery({
    queryKey: ["entity-context", id],
    queryFn: () => getEntityContext(id),
    enabled: tab === "context",
  });

  const { data: ranking, isLoading: rLoading } = useQuery({
    queryKey: ["entity-ranking", id],
    queryFn: () => getEntityRanking(id),
    enabled: tab === "ranking",
  });

  const { data: scenario, isLoading: sLoading } = useQuery({
    queryKey: ["entity-scenario", id],
    queryFn: () => getEntityScenario(id),
    enabled: tab === "scenario",
  });

  const { data: subgraph, isLoading: gLoading } = useQuery({
    queryKey: ["entity-subgraph", id],
    queryFn: () => getEntitySubgraph(id),
    enabled: tab === "graph",
  });

  const { nodes: flowNodes, edges: flowEdges } = buildFlow(
    subgraph?.nodes ?? [],
    subgraph?.edges ?? []
  );
  const [nodes, , onNodesChange] = useNodesState(flowNodes);
  const [edges, , onEdgesChange] = useEdgesState(flowEdges);

  const entityName = String(profile?.entity_name ?? profile?.name ?? id);
  const loading = pLoading || cLoading || rLoading || sLoading || gLoading;

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "profile",  label: "PROFILE",  icon: <Building2 size={12} /> },
    { key: "context",  label: "CONTEXT",  icon: <FileText size={12} /> },
    { key: "ranking",  label: "RANKING",  icon: <BarChart2 size={12} /> },
    { key: "graph",    label: "GRAPH",    icon: <GitBranch size={12} /> },
    { key: "scenario", label: "SCENARIO", icon: <Activity size={12} /> },
  ];

  if (pError) {
    return (
      <div className="text-terminal-red text-xs panel px-4 py-6 text-center">
        ENTITY NOT FOUND: {String(pError)}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-terminal-dim hover:text-terminal-cyan transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <Building2 size={16} className="text-terminal-cyan" />
        <div>
          <h1 className="text-terminal-cyan text-sm font-bold tracking-widest">
            {pLoading ? "LOADING…" : entityName}
          </h1>
          <div className="text-terminal-dim text-xs">entity_id: {id}</div>
        </div>
      </div>

      {/* Quick metrics */}
      {profile && (
        <div className="grid grid-cols-4 gap-3">
          <MetricCard
            label="Entity ID"
            value={String(profile.entity_id ?? id)}
            highlight
          />
          <MetricCard
            label="Sector"
            value={String(profile.sector ?? profile.industry ?? "—")}
          />
          <MetricCard
            label="Country"
            value={String(profile.country ?? profile.country_code ?? "—")}
          />
          <MetricCard
            label="Rank"
            value={ranking ? String(ranking.rank ?? ranking.overall_rank ?? "—") : "—"}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-terminal-border">
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs tracking-wider transition-colors border-b-2 ${
              tab === key
                ? "border-terminal-cyan text-terminal-cyan"
                : "border-transparent text-terminal-secondary hover:text-terminal-text"
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {tab === "profile" && profile && <ProfilePanel profile={profile} />}

        {tab === "context" && (
          cLoading
            ? <div className="text-terminal-orange text-xs animate-pulse p-4">LOADING CONTEXT…</div>
            : context
              ? <ProfilePanel profile={context} />
              : <div className="text-terminal-dim text-xs p-4 tracking-widest">NO CONTEXT DATA</div>
        )}

        {tab === "ranking" && (
          rLoading
            ? <div className="text-terminal-orange text-xs animate-pulse p-4">LOADING RANKING…</div>
            : ranking
              ? <ProfilePanel profile={ranking} />
              : <div className="text-terminal-dim text-xs p-4 tracking-widest">NO RANKING DATA</div>
        )}

        {tab === "scenario" && scenario && (
          <div className="grid grid-cols-2 gap-4">
            <div className="panel p-4">
              <div className="text-terminal-cyan text-xs font-bold tracking-widest mb-3">GRAPH CONNECTIVITY</div>
              <MetricCard
                label="Edge Count"
                value={String(scenario.graph_connectivity?.edge_count ?? "—")}
                highlight
              />
            </div>
            {scenario.profile && (
              <div className="panel p-4">
                <div className="text-terminal-cyan text-xs font-bold tracking-widest mb-3">PROFILE SUMMARY</div>
                <div className="text-xs space-y-1">
                  {Object.entries(scenario.profile).slice(0, 8).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4">
                      <span className="text-terminal-secondary">{k.replace(/_/g, " ")}</span>
                      <span className="text-terminal-text">{v === null ? "—" : String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "graph" && (
          gLoading
            ? <div className="text-terminal-orange text-xs animate-pulse p-4">LOADING GRAPH…</div>
            : (
              <div className="panel" style={{ height: "calc(100vh - 380px)" }}>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  fitView
                  style={{ background: "#0a0e1a" }}
                >
                  <Background color="#1e3a5f" gap={32} variant={BackgroundVariant.Dots} />
                  <Controls style={{ background: "#0f1629", border: "1px solid #1e3a5f" }} />
                </ReactFlow>
              </div>
            )
        )}
      </div>

      <StatusBar loading={loading} message={`ENTITY · ${entityName}`} />
    </div>
  );
}
