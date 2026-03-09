import type {
  PaginatedResponse,
  SearchResponse,
  GraphResponse,
  ScenarioResponse,
  ViewRow,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
  : "/api/v1";

async function get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(`${BASE}${path}`, typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, String(v));
      }
    });
  }
  const res = await fetch(url.pathname + url.search, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

// ── Search ───────────────────────────────────────────────────────────────────
export const searchEntities = (q: string, limit = 20) =>
  get<SearchResponse>("/search", { q, limit });

// ── Entities ─────────────────────────────────────────────────────────────────
export const listEntities = (limit = 50, offset = 0) =>
  get<PaginatedResponse>("/entities", { limit, offset });

export const getEntityProfile = (id: string) =>
  get<ViewRow>(`/entities/${id}/profile`);

export const getEntityContext = (id: string) =>
  get<ViewRow>(`/entities/${id}/context`);

export const getEntityRanking = (id: string) =>
  get<ViewRow>(`/entities/${id}/ranking`);

export const compareEntities = (ids: string[]) =>
  get<{ profiles: ViewRow[]; rankings: ViewRow[]; entity_ids: string[] }>(
    "/entities/compare/multi",
    { ids: ids.join(",") }
  );

// ── Graph ────────────────────────────────────────────────────────────────────
export const getGraphNodes = (params?: { entity_id?: string; node_type?: string; limit?: number }) =>
  get<{ nodes: ViewRow[]; count: number }>("/graph/nodes", params as Record<string, number>);

export const getGraphEdges = (params?: {
  source_id?: string;
  target_id?: string;
  relationship_type?: string;
  limit?: number;
}) => get<{ edges: ViewRow[]; count: number }>("/graph/edges", params as Record<string, number>);

export const getEntitySubgraph = (entityId: string, depth = 1) =>
  get<GraphResponse>(`/graph/subgraph/${entityId}`, { depth });

// ── Screener ─────────────────────────────────────────────────────────────────
export const getScreener = (params?: {
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_dir?: string;
  sector?: string;
  search?: string;
}) => get<PaginatedResponse>("/screener", params as Record<string, string | number>);

export const getScreenerColumns = () =>
  get<{ columns: { column_name: string; data_type: string }[] }>("/screener/columns");

// ── Rankings ──────────────────────────────────────────────────────────────────
export const getRankings = (limit = 100, offset = 0) =>
  get<PaginatedResponse>("/rankings", { limit, offset });

// ── Priorities ────────────────────────────────────────────────────────────────
export const getPriorities = (params?: { parent_id?: string; depth?: number }) =>
  get<{ data: ViewRow[]; total: number }>("/priorities", params as Record<string, string | number>);

export const getRootPriorities = () =>
  get<{ data: ViewRow[]; total: number }>("/priorities/root");

// ── Procurement ───────────────────────────────────────────────────────────────
export const getProcurement = (params?: { entity_id?: string; limit?: number; offset?: number }) =>
  get<PaginatedResponse>("/procurement", params as Record<string, string | number>);

// ── Compliance ────────────────────────────────────────────────────────────────
export const getCompliance = (params?: { entity_id?: string; limit?: number; offset?: number }) =>
  get<PaginatedResponse>("/compliance", params as Record<string, string | number>);

// ── Timeline ──────────────────────────────────────────────────────────────────
export const getTimeline = (params?: { entity_id?: string; limit?: number }) =>
  get<{ data: ViewRow[] }>("/timeline", params as Record<string, string | number>);

export const getEntityTimeline = (entityId: string) =>
  get<{ data: ViewRow[]; entity_id: string }>(`/timeline/entity/${entityId}`);

// ── Scenario ─────────────────────────────────────────────────────────────────
export const getEntityScenario = (entityId: string) =>
  get<ScenarioResponse>(`/scenario/entity/${entityId}`);
