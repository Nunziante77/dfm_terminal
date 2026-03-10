"use client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Building2, ArrowLeft, GitBranch, BarChart2, Activity, FileText,
  FlaskConical, BookOpen, ShoppingCart, Shield, Calendar, Globe2,
} from "lucide-react";
import ReactFlow, { Background, Controls, useNodesState, useEdgesState, BackgroundVariant, type Node, type Edge } from "reactflow";
import "reactflow/dist/style.css";

import {
  getEntityProfile, getEntityContext, getEntityRanking, getEntityScenario,
  getEntitySubgraph, getEntityPatents, getEntityTechFromPatents,
  getEntityResearch, getEntityProcurement, getEntityNormativeEval,
  getEntityEventsSummary, getEntityOwnership, getEntityFdi,
  getEntitySupplyChain, getEntityTechnology,
} from "@/lib/api";
import { formatAutonomyFlag } from "@/lib/autonomy";
import type { ViewRow } from "@/lib/types";
import MetricCard from "@/components/MetricCard";
import DataTable from "@/components/DataTable";
import StatusBar from "@/components/StatusBar";

type Tab =
  | "profile" | "context" | "ranking" | "graph" | "scenario"
  | "patents" | "research" | "procurement" | "normative" | "events" | "ownership"
  | "supply_chain" | "technology";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "profile",      label: "PROFILE",      icon: <Building2 size={11} /> },
  { key: "context",      label: "CONTEXT",      icon: <FileText size={11} /> },
  { key: "ranking",      label: "RANKING",      icon: <BarChart2 size={11} /> },
  { key: "scenario",     label: "SCENARIO",     icon: <Activity size={11} /> },
  { key: "patents",      label: "PATENTS",      icon: <FlaskConical size={11} /> },
  { key: "research",     label: "RESEARCH",     icon: <BookOpen size={11} /> },
  { key: "procurement",  label: "PROCURE",      icon: <ShoppingCart size={11} /> },
  { key: "normative",    label: "NORMATIVE",    icon: <Shield size={11} /> },
  { key: "events",       label: "EVENTS",       icon: <Calendar size={11} /> },
  { key: "ownership",    label: "OWNERSHIP",    icon: <Globe2 size={11} /> },
  { key: "supply_chain", label: "SUPPLY CHAIN", icon: <GitBranch size={11} /> },
  { key: "technology",   label: "TECH EXPOSURE",icon: <FlaskConical size={11} /> },
  { key: "graph",        label: "GRAPH",        icon: <GitBranch size={11} /> },
];

function KVGrid({ data }: { data: ViewRow }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {Object.entries(data).map(([k, v]) => (
        <div key={k} className="panel px-3 py-2">
          <div className="text-[9px] text-terminal-secondary tracking-widest uppercase mb-0.5">
            {k.replace(/_/g, " ")}
          </div>
          <div className={`text-xs font-medium ${
            typeof v === "number" && v > 0 ? "text-terminal-green" :
            typeof v === "number" && v < 0 ? "text-terminal-red" :
            v === true ? "text-terminal-green" :
            v === false ? "text-terminal-red" :
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
    id: String(n.node_id ?? i),
    data: { label: String(n.node_label ?? n.node_id ?? i) },
    position: { x: (i % 5) * 180, y: Math.floor(i / 5) * 120 },
    style: { background: "#0f1629", color: "#00d4ff", border: "1px solid #1e3a5f", borderRadius: 4, fontSize: 11, padding: "4px 8px", fontFamily: "monospace" },
  }));
  const edges: Edge[] = rawEdges.map((e, i) => ({
    id: String(e.edge_id ?? i),
    source: String(e.from_id ?? ""),
    target: String(e.to_id ?? ""),
    label: String(e.edge_type ?? ""),
    style: { stroke: "#1e3a5f" },
    labelStyle: { fill: "#94a3b8", fontSize: 10 },
  }));
  return { nodes, edges };
}

export default function EntityPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profile");

  const enabled = (t: Tab) => tab === t;

  const { data: profile, isLoading: pLoading, error: pError } = useQuery({
    queryKey: ["entity-profile", id], queryFn: () => getEntityProfile(id),
  });
  const { data: context, isLoading: cLoading } = useQuery({
    queryKey: ["entity-context", id], queryFn: () => getEntityContext(id), enabled: enabled("context"),
  });
  const { data: ranking } = useQuery({
    queryKey: ["entity-ranking", id], queryFn: () => getEntityRanking(id), enabled: enabled("ranking"),
  });
  const { data: scenario, isLoading: sLoading } = useQuery({
    queryKey: ["entity-scenario", id], queryFn: () => getEntityScenario(id), enabled: enabled("scenario"),
  });
  const { data: subgraph, isLoading: gLoading } = useQuery({
    queryKey: ["entity-subgraph", id], queryFn: () => getEntitySubgraph(id), enabled: enabled("graph"),
  });
  const { data: patents, isLoading: patLoading } = useQuery({
    queryKey: ["entity-patents", id], queryFn: () => getEntityPatents(id), enabled: enabled("patents"),
  });
  const { data: tech } = useQuery({
    queryKey: ["entity-tech", id], queryFn: () => getEntityTechFromPatents(id), enabled: enabled("patents"),
  });
  const { data: research, isLoading: resLoading } = useQuery({
    queryKey: ["entity-research", id], queryFn: () => getEntityResearch(id), enabled: enabled("research"),
  });
  const { data: procurement, isLoading: procLoading } = useQuery({
    queryKey: ["entity-procurement", id], queryFn: () => getEntityProcurement(id), enabled: enabled("procurement"),
  });
  const { data: normative, isLoading: normLoading } = useQuery({
    queryKey: ["entity-normative", id], queryFn: () => getEntityNormativeEval(id), enabled: enabled("normative"),
  });
  const { data: events, isLoading: evLoading } = useQuery({
    queryKey: ["entity-events", id], queryFn: () => getEntityEventsSummary(id), enabled: enabled("events"),
  });
  const { data: ownership, isLoading: owLoading } = useQuery({
    queryKey: ["entity-ownership", id], queryFn: () => getEntityOwnership(id), enabled: enabled("ownership"),
  });
  const { data: fdi } = useQuery({
    queryKey: ["entity-fdi", id], queryFn: () => getEntityFdi(id), enabled: enabled("ownership"),
  });
  const { data: supplyChain, isLoading: scLoading } = useQuery({
    queryKey: ["entity-supply-chain", id], queryFn: () => getEntitySupplyChain(id), enabled: enabled("supply_chain"),
  });
  const { data: techExposure, isLoading: techLoading } = useQuery({
    queryKey: ["entity-technology", id], queryFn: () => getEntityTechnology(id), enabled: enabled("technology"),
  });

  const loading = pLoading || cLoading || sLoading || gLoading || patLoading || resLoading || procLoading || normLoading || evLoading || owLoading || scLoading || techLoading;

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  useEffect(() => {
    if (subgraph) {
      const { nodes: n, edges: e } = buildFlow(subgraph.nodes, subgraph.edges);
      setNodes(n);
      setEdges(e);
    }
  }, [subgraph, setNodes, setEdges]);

  const entityName = String(profile?.official_name ?? id);

  if (pError) {
    return (
      <div className="text-terminal-red text-xs panel px-4 py-6 text-center">
        ENTITY NOT FOUND: {String(pError)}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-terminal-dim hover:text-terminal-cyan">
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
        <div className="grid grid-cols-5 gap-2">
          <MetricCard label="Type" value={String(profile.entity_type_code ?? "—")} highlight />
          <MetricCard label="Country" value={String(profile.hq_country ?? "—")} />
          <MetricCard label="Ownership" value={String(profile.ownership_status ?? "—")} />
          <MetricCard label="Final Score" value={ranking ? String(ranking.final_score ?? "—") : "—"} />
          <MetricCard label="Active" value={profile.is_active === true ? "YES" : profile.is_active === false ? "NO" : "—"} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-terminal-border overflow-x-auto">
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1 px-3 py-1.5 text-[11px] tracking-wider transition-colors border-b-2 whitespace-nowrap shrink-0 ${
              tab === key
                ? "border-terminal-cyan text-terminal-cyan"
                : "border-transparent text-terminal-secondary hover:text-terminal-text"
            }`}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {tab === "profile" && profile && <KVGrid data={profile} />}

        {tab === "context" && (
          cLoading ? <LoadingMsg /> :
          context ? (
            <div className="flex flex-col gap-2">
              <div className="text-terminal-secondary text-xs px-1">
                {context.count} context rows from <span className="font-mono text-terminal-dim">v_dfm_entity_context_v1</span>
              </div>
              <div className="panel">
                {/* Show only the variable/relational columns — entity identity fields repeat on every row */}
                <DataTable
                  data={context.context_rows}
                  columns={["dfm_tech_code", "pr_code", "normative_atom_id", "normative_eval_evidence", "project_id", "sanction_entity_id"]}
                  maxHeight="calc(100vh - 360px)"
                />
              </div>
            </div>
          ) : <EmptyMsg />
        )}

        {tab === "ranking" && (ranking ? <KVGrid data={ranking} /> : <EmptyMsg />)}

        {tab === "scenario" && scenario && (
          <div className="grid grid-cols-2 gap-3">
            {scenario.profile && (
              <div className="panel p-3">
                <div className="text-terminal-cyan text-xs tracking-widest mb-2">PROFILE</div>
                {Object.entries(scenario.profile).slice(0, 6).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 text-xs py-0.5 border-b border-terminal-muted">
                    <span className="text-terminal-secondary">{k.replace(/_/g, " ")}</span>
                    <span className="text-terminal-text">{v === null ? "—" : String(v)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="panel p-3">
              <div className="text-terminal-cyan text-xs tracking-widest mb-2">INTELLIGENCE SUMMARY</div>
              {[
                ["Graph edges",      String(scenario.graph_connectivity?.edge_count ?? "—")],
                ["Research projects", String((scenario.research as any)?.project_count ?? "—")],
                ["EC contribution",  String((scenario.research as any)?.total_ec ?? "—")],
                ["Procurement total",String((scenario.procurement as any)?.procurement_total ?? "—")],
                ["Contracts",        String((scenario.procurement as any)?.contracts ?? "—")],
                ["FDI level",        String((scenario.fdi as any)?.fdi_level_canonical ?? "—")],
                ["FDI escalation",   String((scenario.fdi as any)?.fdi_escalation_flag_canonical ?? "—")],
                ["Events total",     String((scenario.events as any)?.events_total ?? "—")],
                ["Norm. evals",      String((scenario.normative_compliance as any)?.eval_count ?? "—")],
                ["Norm. pass",       String((scenario.normative_compliance as any)?.pass_count ?? "—")],
                ["Norm. fail",       String((scenario.normative_compliance as any)?.fail_count ?? "—")],
                ["SC role",          String((scenario.supply_chain as any)?.supply_chain_role ?? "—")],
                ["SC tech code",     String((scenario.supply_chain as any)?.dfm_tech_code ?? "—")],
                ["Autonomy flag",    formatAutonomyFlag((scenario.autonomy as any)?.autonomy_flag)],
                ["EU entities",      String((scenario.autonomy as any)?.eu_entities_remaining ?? "—")],
                ["Non-EU entities",  String((scenario.autonomy as any)?.non_eu_entities_remaining ?? "—")],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between gap-3 text-xs py-0.5 border-b border-terminal-muted">
                  <span className="text-terminal-secondary">{label}</span>
                  <span className="text-terminal-text">{val}</span>
                </div>
              ))}
            </div>
            {scenario.tech_domains.length > 0 && (
              <div className="col-span-2 panel p-3">
                <div className="text-terminal-cyan text-xs tracking-widest mb-2">TECH DOMAINS FROM PATENTS</div>
                <DataTable data={scenario.tech_domains} columns={["dfm_tech_code", "patent_count"]} maxHeight="200px" />
              </div>
            )}
          </div>
        )}

        {tab === "patents" && (
          patLoading ? <LoadingMsg /> : (
            <div className="flex flex-col gap-3">
              {tech && tech.data.length > 0 && (
                <div className="panel">
                  <div className="px-3 py-2 border-b border-terminal-border text-terminal-cyan text-xs tracking-widest">
                    TECH DOMAINS ({tech.total})
                  </div>
                  <DataTable data={tech.data} columns={["dfm_tech_code", "patent_count"]} maxHeight="160px" />
                </div>
              )}
              <div className="panel">
                <div className="px-3 py-2 border-b border-terminal-border text-terminal-cyan text-xs tracking-widest">
                  PATENT LINKS ({patents?.total ?? 0})
                </div>
                <DataTable
                  data={patents?.data ?? []}
                  columns={["patent_id", "link_type", "confidence_score", "family_id", "cpc_codes", "evidence_text"]}
                  maxHeight="calc(100vh - 450px)"
                />
              </div>
            </div>
          )
        )}

        {tab === "research" && (
          resLoading ? <LoadingMsg /> : research ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <MetricCard label="Projects" value={String(research.total)} highlight />
                <MetricCard label="Total EC Contribution" value={research.total_ec_contribution.toFixed(0)} unit="€" />
              </div>
              <div className="panel">
                <DataTable
                  data={research.data}
                  columns={["project_id", "role", "ec_contribution", "hq_country", "participation_created_at"]}
                  maxHeight="calc(100vh - 370px)"
                />
              </div>
            </div>
          ) : <EmptyMsg />
        )}

        {tab === "procurement" && (
          procLoading ? <LoadingMsg /> : procurement ? (
            <div className="flex flex-col gap-3">
              {procurement.summary && (
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard label="Total Procurement" value={String((procurement.summary as any).procurement_total ?? "—")} highlight />
                  <MetricCard label="Contracts" value={String((procurement.summary as any).contracts ?? "—")} />
                </div>
              )}
              <div className="panel">
                <div className="px-3 py-2 border-b border-terminal-border text-terminal-cyan text-xs tracking-widest">
                  AWARDS ({procurement.award_count})
                </div>
                <DataTable
                  data={procurement.awards}
                  columns={["supplier_name", "contract_value", "country_code", "cpv_main", "score"]}
                  maxHeight="calc(100vh - 400px)"
                />
              </div>
            </div>
          ) : <EmptyMsg />
        )}

        {tab === "normative" && (
          normLoading ? <LoadingMsg /> : normative ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(normative.status_summary).map(([status, count]) => (
                  <MetricCard
                    key={status}
                    label={status.toUpperCase()}
                    value={String(count)}
                    highlight={status === "pass"}
                  />
                ))}
              </div>
              <div className="panel">
                <div className="px-3 py-2 border-b border-terminal-border text-terminal-cyan text-xs tracking-widest">
                  EVALUATIONS ({normative.total})
                </div>
                <DataTable
                  data={normative.evaluations}
                  columns={["doc_id", "atom_id", "eval_status", "title", "doc_type", "issuer"]}
                  maxHeight="calc(100vh - 380px)"
                />
              </div>
            </div>
          ) : <EmptyMsg />
        )}

        {tab === "events" && (
          evLoading ? <LoadingMsg /> : events ? (
            <div className="flex flex-col gap-3">
              {events.summary && (
                <div className="grid grid-cols-3 gap-3">
                  <MetricCard label="Total Events" value={String((events.summary as any).events_total ?? "—")} highlight />
                  <MetricCard label="First Event" value={String((events.summary as any).first_event ?? "—")} />
                  <MetricCard label="Last Event" value={String((events.summary as any).last_event ?? "—")} />
                </div>
              )}
              <div className="panel">
                <DataTable
                  data={events.events}
                  columns={["event_id", "event_type", "event_source", "event_date", "country_code", "event_value", "currency"]}
                  maxHeight="calc(100vh - 390px)"
                />
              </div>
            </div>
          ) : <EmptyMsg />
        )}

        {tab === "ownership" && (
          owLoading ? <LoadingMsg /> : (
            <div className="flex flex-col gap-3">
              {fdi?.fdi_signal && (
                <div className="panel p-3">
                  <div className="text-terminal-cyan text-xs tracking-widest mb-2">FDI SIGNAL</div>
                  <div className="grid grid-cols-3 gap-2">
                    {["fdi_level_canonical", "hq_risk_tier", "controller_risk_tier", "fdi_tech_sensitivity_level", "sovereignty_risk_multiplier", "fdi_escalation_flag_canonical"].map((k) => (
                      <div key={k} className="panel px-2 py-1.5">
                        <div className="text-[9px] text-terminal-secondary uppercase tracking-widest mb-0.5">{k.replace(/_/g, " ")}</div>
                        <div className="text-xs text-terminal-text">{String((fdi.fdi_signal as any)[k] ?? "—")}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {fdi?.regulatory_workflow && (
                <div className="panel p-3">
                  <div className="text-terminal-cyan text-xs tracking-widest mb-2">REGULATORY WORKFLOW</div>
                  <KVGrid data={fdi.regulatory_workflow} />
                </div>
              )}
              <div className="panel">
                <div className="px-3 py-2 border-b border-terminal-border text-terminal-cyan text-xs tracking-widest">
                  OWNERSHIP ({ownership?.owner_count ?? 0})
                </div>
                <DataTable
                  data={ownership?.ownership ?? []}
                  columns={["controller_name", "controller_country_iso2", "shareholding_percentage", "voting_rights_percentage", "has_special_rights", "board_control_flag", "beneficial_owner_verified"]}
                  maxHeight="calc(100vh - 420px)"
                />
              </div>
            </div>
          )
        )}

        {tab === "supply_chain" && (
          scLoading ? <LoadingMsg /> : supplyChain ? (
            <div className="flex flex-col gap-3">
              <div className="panel">
                <div className="px-3 py-2 border-b border-terminal-border text-terminal-cyan text-xs tracking-widest">
                  SUPPLY CHAIN ROLES ({supplyChain.supply_chain_count})
                </div>
                <DataTable
                  data={supplyChain.supply_chain}
                  columns={["supply_chain_role", "dfm_tech_code", "contracts", "procurement_value"]}
                  maxHeight="200px"
                />
              </div>
              {supplyChain.tech_map.length > 0 && (
                <div className="panel">
                  <div className="px-3 py-2 border-b border-terminal-border text-terminal-cyan text-xs tracking-widest">
                    TECHNOLOGY MAP ({supplyChain.tech_map.length})
                  </div>
                  <DataTable
                    data={supplyChain.tech_map}
                    columns={["dfm_tech_code", "supply_chain_role", "procurement_total", "contracts"]}
                    maxHeight="calc(100vh - 500px)"
                  />
                </div>
              )}
            </div>
          ) : <EmptyMsg />
        )}

        {tab === "technology" && (
          techLoading ? <LoadingMsg /> : techExposure ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="panel px-3 py-2">
                  <div className="text-[9px] text-terminal-secondary tracking-widest mb-0.5">TECH DOMAINS</div>
                  <div className="text-terminal-cyan font-semibold text-sm">{techExposure.tech_count}</div>
                </div>
              </div>
              <div className="panel">
                <div className="px-3 py-2 border-b border-terminal-border text-terminal-cyan text-xs tracking-widest">
                  TECHNOLOGY EXPOSURE — v_dfm_entity_tech_union_v1
                </div>
                <DataTable
                  data={techExposure.tech_domains}
                  columns={["dfm_tech_code", "patent_count", "source_layer"]}
                  maxHeight="calc(100vh - 380px)"
                />
              </div>
            </div>
          ) : <EmptyMsg />
        )}

        {tab === "graph" && (
          gLoading ? <LoadingMsg /> : (
            <div className="panel" style={{ height: "calc(100vh - 380px)" }}>
              <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} fitView style={{ background: "#0a0e1a" }}>
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

function LoadingMsg() {
  return <div className="text-terminal-orange text-xs animate-pulse p-4 tracking-widest">LOADING…</div>;
}
function EmptyMsg() {
  return <div className="text-terminal-dim text-xs p-4 tracking-widest text-center">NO DATA</div>;
}
