// Generic row from any view
export type ViewRow = Record<string, unknown>;

// ── Paginated responses ──────────────────────────────────────────────────────
export interface PaginatedResponse {
  data: ViewRow[];
  total: number;
  limit: number;
  offset: number;
}

export interface SearchResponse {
  query: string;
  domain: string;
  total: number;
  results: {
    entities?: ViewRow[];
    patents?: ViewRow[];
    procurement?: ViewRow[];
    normative?: ViewRow[];
    strategic?: ViewRow[];
  };
}

// ── Graph ────────────────────────────────────────────────────────────────────
export interface GraphResponse {
  nodes: ViewRow[];
  edges: ViewRow[];
}

// ── Entity intelligence ───────────────────────────────────────────────────────
export interface EntityContextResponse {
  entity_id: string;
  context_rows: ViewRow[];
  count: number;
}

export interface EntityProcurementResponse {
  entity_id: string;
  awards: ViewRow[];
  summary: ViewRow | null;
  award_count: number;
}

export interface EntityResearchResponse {
  entity_id: string;
  data: ViewRow[];
  total: number;
  total_ec_contribution: number;
}

export interface EntityEventsResponse {
  entity_id: string;
  summary: ViewRow | null;
  events: ViewRow[];
}

export interface EntityOwnershipResponse {
  entity_id: string;
  ownership: ViewRow[];
  owner_count: number;
}

export interface EntityFdiResponse {
  entity_id: string;
  fdi_signal: ViewRow | null;
  regulatory_workflow: ViewRow | null;
}

export interface EntityNormativeEvalResponse {
  entity_id: string;
  evaluations: ViewRow[];
  total: number;
  status_summary: Record<string, number>;
}

export interface EntityPatentsResponse {
  entity_id: string;
  data: ViewRow[];
  total: number;
}

// ── Scenario ─────────────────────────────────────────────────────────────────
export interface ScenarioResponse {
  entity_id: string;
  profile: ViewRow | null;
  ranking: ViewRow | null;
  tech_domains: ViewRow[];
  research: ViewRow | null;
  procurement: ViewRow | null;
  fdi: ViewRow | null;
  events: ViewRow | null;
  graph_connectivity: { edge_count: number };
  normative_compliance: ViewRow | null;
}

// ── Normative ─────────────────────────────────────────────────────────────────
export interface NormativeDocResponse {
  document: ViewRow;
  atoms: ViewRow[];
  pr_profile: ViewRow[];
}

// ── Strategic ─────────────────────────────────────────────────────────────────
export interface StrategicDocResponse {
  document: ViewRow;
  atoms: ViewRow[];
}

// ── React Flow node/edge ──────────────────────────────────────────────────────
export interface FlowNode {
  id: string;
  data: { label: string; [key: string]: unknown };
  position: { x: number; y: number };
  style?: Record<string, unknown>;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  style?: Record<string, unknown>;
  labelStyle?: Record<string, unknown>;
}
