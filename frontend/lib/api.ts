import type {
  PaginatedResponse,
  SearchResponse,
  EntityContextResponse,
  EntityProcurementResponse,
  EntityResearchResponse,
  EntityEventsResponse,
  EntityOwnershipResponse,
  EntityFdiResponse,
  EntityNormativeEvalResponse,
  EntityPatentsResponse,
  ScenarioResponse,
  NormativeDocResponse,
  StrategicDocResponse,
  GraphResponse,
  ViewRow,
} from "./types";

const BASE =
  typeof window !== "undefined"
    ? "/api/v1"
    : `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1`;

async function get<T>(path: string, params?: Record<string, string | number | boolean>): Promise<T> {
  const url = new URL(path, typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  // Reconstruct with correct base
  const fullPath = BASE + path;
  const fetchUrl = typeof window !== "undefined" ? fullPath : `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1${path}`;
  const u = new URL(fetchUrl.startsWith("http") ? fetchUrl : `http://localhost:3000${fetchUrl}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v) !== "") u.searchParams.set(k, String(v));
    });
  }
  const res = await fetch(typeof window !== "undefined" ? u.pathname + u.search : u.href, {
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

// ── Unified Search ────────────────────────────────────────────────────────────
export const unifiedSearch = (q: string, limit = 20, domain = "all") =>
  get<SearchResponse>("/search", { q, limit, domain });

// ── Entities ─────────────────────────────────────────────────────────────────
export const listEntities = (params?: { limit?: number; offset?: number; hq_country?: string; ownership_status?: string; is_active?: boolean }) =>
  get<PaginatedResponse>("/entities", params as Record<string, string | number>);

export const getEntityProfile = (id: string) =>
  get<ViewRow>(`/entities/${id}/profile`);

export const getEntityContext = (id: string) =>
  get<EntityContextResponse>(`/entities/${id}/context`);

export const getEntityRanking = (id: string) =>
  get<ViewRow>(`/entities/${id}/ranking`);

export const compareEntities = (ids: string[]) =>
  get<{ profiles: ViewRow[]; rankings: ViewRow[]; tech_from_patents: ViewRow[]; entity_ids: string[] }>(
    "/entities/compare/multi",
    { ids: ids.join(",") }
  );

// ── Graph ────────────────────────────────────────────────────────────────────
export const getGraphNodes = (params?: { node_type?: string; node_id?: string; limit?: number }) =>
  get<{ nodes: ViewRow[]; count: number }>("/graph/nodes", params as Record<string, string | number>);

export const getGraphEdges = (params?: { from_id?: string; to_id?: string; edge_type?: string; from_type?: string; to_type?: string; limit?: number }) =>
  get<{ edges: ViewRow[]; count: number }>("/graph/edges", params as Record<string, string | number>);

export const getEntitySubgraph = (entityId: string, limit = 300) =>
  get<GraphResponse>(`/graph/subgraph/${entityId}`, { limit });

// ── Screener ─────────────────────────────────────────────────────────────────
export const getScreener = (params?: { limit?: number; offset?: number; sort_by?: string; sort_dir?: string; hq_country?: string; ownership_status?: string; pr_code?: string; search?: string }) =>
  get<PaginatedResponse>("/screener", params as Record<string, string | number>);

// ── Rankings ──────────────────────────────────────────────────────────────────
export const getRankings = (params?: { limit?: number; offset?: number; sort_by?: string; sort_dir?: string; primary_strategic_code?: string; country?: string }) =>
  get<PaginatedResponse>("/rankings", params as Record<string, string | number>);

// ── Priorities ────────────────────────────────────────────────────────────────
export const getPriorities = (params?: { pr_id?: string; node_level?: string; limit?: number }) =>
  get<{ data: ViewRow[]; total: number }>("/priorities", params as Record<string, string | number>);

export const getDistinctPriorities = () =>
  get<{ data: ViewRow[]; total: number }>("/priorities/distinct");

export const getPriorityNodes = (pr_id: string) =>
  get<{ data: ViewRow[]; total: number; pr_id: string }>(`/priorities/${pr_id}/nodes`);

export const getPriorityEntities = (pr_id: string, limit = 200) =>
  get<{
    data: ViewRow[];
    total: number;
    pr_id: string;
    hhi_structural: number | null;
    concentration_entity_count: number | null;
    autonomy_flag: string | null;
    eu_entities_remaining: number | null;
    non_eu_entities_remaining: number | null;
  }>(`/priorities/${pr_id}/entities`, { limit });

export const getPriorityNormative = (pr_id: string) =>
  get<{ data: ViewRow[]; total: number; pr_id: string }>(`/priorities/${pr_id}/normative`);

// ── Patents ───────────────────────────────────────────────────────────────────
export const listPatents = (params?: { limit?: number; offset?: number; family_id?: string }) =>
  get<PaginatedResponse>("/patents", params as Record<string, string | number>);

export const getEntityPatents = (entityId: string, limit = 100) =>
  get<EntityPatentsResponse>(`/patents/entity/${entityId}`, { limit });

export const getEntityTechFromPatents = (entityId: string) =>
  get<{ data: ViewRow[]; total: number; entity_id: string }>(`/patents/entity/${entityId}/tech`);

export const getTechSignals = (params?: { dfm_tech_code?: string; limit?: number }) =>
  get<{ data: ViewRow[]; total: number }>("/patents/tech-signals", params as Record<string, string | number>);

// ── Research ──────────────────────────────────────────────────────────────────
export const listResearch = (params?: { limit?: number; offset?: number; hq_country?: string; role?: string }) =>
  get<PaginatedResponse>("/research", params as Record<string, string | number>);

export const getEntityResearch = (entityId: string) =>
  get<EntityResearchResponse>(`/research/entity/${entityId}`);

export const getProjectParticipants = (projectId: string) =>
  get<{ data: ViewRow[]; total: number; project_id: string }>(`/research/project/${projectId}`);

// ── Procurement ───────────────────────────────────────────────────────────────
export const listProcurement = (params?: { limit?: number; offset?: number; country_code?: string; cpv_main?: string; search?: string }) =>
  get<PaginatedResponse>("/procurement", params as Record<string, string | number>);

export const listAwards = (params?: { limit?: number; offset?: number; country_code?: string; cpv_main?: string }) =>
  get<PaginatedResponse>("/procurement/awards", params as Record<string, string | number>);

export const listLinkedAwards = (params?: { limit?: number; offset?: number; entity_id?: string; country_code?: string }) =>
  get<PaginatedResponse>("/procurement/awards/linked", params as Record<string, string | number>);

export const getEntityProcurement = (entityId: string, limit = 100) =>
  get<EntityProcurementResponse>(`/procurement/entity/${entityId}`, { limit });

export const getProcurementSummary = (params?: { limit?: number; offset?: number }) =>
  get<{ data: ViewRow[]; total: number }>("/procurement/summary", params as Record<string, string | number>);

export const getProcurementSignals = () =>
  get<{ data: ViewRow[]; total: number }>("/procurement/signals");

// ── Normative ─────────────────────────────────────────────────────────────────
export const listNormativeDocuments = (params?: { limit?: number; offset?: number; doc_type?: string; issuer?: string; language_code?: string; search?: string }) =>
  get<PaginatedResponse>("/normative/documents", params as Record<string, string | number>);

export const getNormativeDocument = (docId: string) =>
  get<NormativeDocResponse>(`/normative/documents/${docId}`);

export const listNormativeAtoms = (params?: { doc_id?: string; atom_type?: string; search?: string; limit?: number; offset?: number }) =>
  get<{ data: ViewRow[]; total: number; limit: number; offset: number }>("/normative/atoms", params as Record<string, string | number>);

export const getEntityNormativeEval = (entityId: string) =>
  get<EntityNormativeEvalResponse>(`/normative/entity/${entityId}/eval`);

export const getNormativePrProfile = (params?: { priority_code?: string; limit?: number }) =>
  get<{ data: ViewRow[]; total: number }>("/normative/pr-profile", params as Record<string, string | number>);

// ── Strategic ─────────────────────────────────────────────────────────────────
export const listStrategicDocuments = (params?: { limit?: number; offset?: number; doc_type?: string; issuer?: string; strategic_level?: string; geographic_scope?: string; layer_class?: string }) =>
  get<PaginatedResponse>("/strategic/documents", params as Record<string, string | number>);

export const getStrategicDocument = (docId: string) =>
  get<StrategicDocResponse>(`/strategic/documents/${docId}`);

export const listStrategicAtoms = (params?: { doc_id?: string; atom_type?: string; capability_domain?: string; confidence_level?: string; limit?: number; offset?: number }) =>
  get<{ data: ViewRow[]; total: number; limit: number; offset: number }>("/strategic/atoms", params as Record<string, string | number>);

// ── Events ────────────────────────────────────────────────────────────────────
export const listEvents = (params?: { limit?: number; offset?: number; entity_id?: string; event_type?: string; country_code?: string; event_source?: string }) =>
  get<PaginatedResponse>("/events", params as Record<string, string | number>);

export const getEntityEventsSummary = (entityId: string) =>
  get<EntityEventsResponse>(`/events/entity/${entityId}/summary`);

export const getEventsRankings = (limit = 100) =>
  get<{ data: ViewRow[]; total: number }>("/events/rankings", { limit });

// ── Ownership & FDI ───────────────────────────────────────────────────────────
export const listOwnership = (params?: { limit?: number; offset?: number; controller_country_iso2?: string; board_control_flag?: boolean; has_special_rights?: boolean }) =>
  get<{ data: ViewRow[]; total: number; limit: number; offset: number }>("/ownership", params as Record<string, string | number | boolean>);

export const getEntityOwnership = (entityId: string) =>
  get<EntityOwnershipResponse>(`/ownership/entity/${entityId}`);

export const listFdiSignals = (params?: { limit?: number; offset?: number; hq_iso2?: string; controller_iso2?: string; fdi_escalation_flag_canonical?: boolean; is_nato_member?: boolean }) =>
  get<{ data: ViewRow[]; total: number; limit: number; offset: number }>("/ownership/fdi", params as Record<string, string | number | boolean>);

export const getEntityFdi = (entityId: string) =>
  get<EntityFdiResponse>(`/ownership/fdi/entity/${entityId}`);

export const getFdiWorkflow = (params?: { fdi_escalation_flag?: boolean; fdi_procedure_level?: string; limit?: number }) =>
  get<{ data: ViewRow[]; total: number }>("/ownership/fdi/workflow", params as Record<string, string | number | boolean>);

// ── Scenario ─────────────────────────────────────────────────────────────────
export const getEntityScenario = (entityId: string) =>
  get<ScenarioResponse>(`/scenario/entity/${entityId}`);

// ── Compliance ────────────────────────────────────────────────────────────────
export const listCompliance = (params?: { limit?: number; offset?: number; eval_status?: string; doc_id?: string }) =>
  get<{ data: ViewRow[]; total: number; limit: number; offset: number }>("/compliance", params as Record<string, string | number>);

// ── Timeline ──────────────────────────────────────────────────────────────────
export const getTimeline = (params?: { entity_id?: string; event_type?: string; country_code?: string; limit?: number; offset?: number }) =>
  get<{ data: ViewRow[]; total: number }>("/timeline", params as Record<string, string | number>);

export const getEntityTimeline = (entityId: string) =>
  get<{ data: ViewRow[]; entity_id: string; total: number }>(`/timeline/entity/${entityId}`);

// ── Supply Chain ───────────────────────────────────────────────────────────────
export const getSupplyChainNetwork = (params?: { supply_chain_role?: string; dfm_tech_code?: string; limit?: number; offset?: number }) =>
  get<{ data: ViewRow[]; total: number; limit: number; offset: number }>("/supply-chain/network", params as Record<string, string | number>);

export const getSupplyChainDependencies = (params?: { supply_chain_role?: string; dfm_tech_code?: string; search?: string; limit?: number; offset?: number }) =>
  get<{ data: ViewRow[]; total: number; limit: number; offset: number }>("/supply-chain/dependencies", params as Record<string, string | number>);

export const getSupplyChainCentrality = (params?: { supply_chain_role?: string; search?: string; limit?: number; offset?: number }) =>
  get<{ data: ViewRow[]; total: number; limit: number; offset: number }>("/supply-chain/centrality", params as Record<string, string | number>);

export const getEntitySupplyChain = (entityId: string, limit = 100) =>
  get<{ entity_id: string; supply_chain: ViewRow[]; tech_map: ViewRow[]; supply_chain_count: number }>(`/supply-chain/entity/${entityId}`, { limit });

// ── Technology ────────────────────────────────────────────────────────────────
export const getTechnologyClusters = (params?: { dfm_tech_code?: string; limit?: number; offset?: number }) =>
  get<{ data: ViewRow[]; total: number; limit: number; offset: number }>("/technology/clusters", params as Record<string, string | number>);

export const getTechnologyConcentration = (params?: { scenario_code?: string; pr_code?: string; limit?: number }) =>
  get<{ data: ViewRow[]; total: number }>("/technology/concentration", params as Record<string, string | number>);

export const getTechnologyVulnerabilities = (params?: { country_code?: string; dfm_tech_code?: string; limit?: number; offset?: number }) =>
  get<{ data: ViewRow[]; total: number; limit: number; offset: number }>("/technology/vulnerabilities", params as Record<string, string | number>);

export const getEntityTechnology = (entityId: string, limit = 100) =>
  get<{ entity_id: string; tech_domains: ViewRow[]; tech_count: number }>(`/technology/entity/${entityId}`, { limit });

// ── Strategic Autonomy ────────────────────────────────────────────────────────
export const getAutonomyIndex = (params?: { scenario_code?: string; pr_code?: string; limit?: number }) =>
  get<{ data: ViewRow[]; total: number }>("/autonomy/index", params as Record<string, string | number>);

export const getAutonomyGaps = (params?: { scenario_code?: string; pr_code?: string; autonomy_flag?: string; limit?: number }) =>
  get<{ data: ViewRow[]; total: number }>("/autonomy/gaps", params as Record<string, string | number>);

export const getAutonomyDependencies = (params?: { scenario_code?: string; pr_code?: string; limit?: number }) =>
  get<{ data: ViewRow[]; total: number }>("/autonomy/dependencies", params as Record<string, string | number>);

// ── Capabilities ──────────────────────────────────────────────────────────────
export const getCapabilityDemand = (params?: { dfm_tech_code?: string; limit?: number; offset?: number }) =>
  get<{ data: ViewRow[]; total: number; limit: number; offset: number }>("/capabilities/demand", params as Record<string, string | number>);

export const getCapabilityGaps = (params?: { supply_chain_role?: string; dfm_tech_code?: string; limit?: number; offset?: number }) =>
  get<{ data: ViewRow[]; total: number; limit: number; offset: number }>("/capabilities/gaps", params as Record<string, string | number>);

export const getCapabilitiesByTechnology = (params?: { country_code?: string; dfm_tech_code?: string; limit?: number; offset?: number }) =>
  get<{ data: ViewRow[]; total: number; limit: number; offset: number }>("/capabilities/by-technology", params as Record<string, string | number>);
