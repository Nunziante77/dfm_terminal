// Generic row from any view
export type ViewRow = Record<string, unknown>;

// ── Paginated / list responses ──────────────────────────────────────────────
export interface PaginatedResponse {
  data: ViewRow[];
  total: number;
  limit: number;
  offset: number;
}

export interface SearchResponse {
  data: ViewRow[];
  total: number;
  query: string;
}

// ── Graph ────────────────────────────────────────────────────────────────────
export interface GraphResponse {
  nodes: ViewRow[];
  edges: ViewRow[];
  count?: number;
}

// ── Scenario ─────────────────────────────────────────────────────────────────
export interface ScenarioResponse {
  entity_id: string;
  profile: ViewRow | null;
  context: ViewRow | null;
  ranking: ViewRow | null;
  graph_connectivity: { edge_count: number };
}

// ── React Flow node/edge (transformed from API) ───────────────────────────
export interface FlowNode {
  id: string;
  data: { label: string; type?: string; [key: string]: unknown };
  position: { x: number; y: number };
  type?: string;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
}

// ── Screener column metadata ──────────────────────────────────────────────
export interface ColumnMeta {
  column_name: string;
  data_type: string;
}
