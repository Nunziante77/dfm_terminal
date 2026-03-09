"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { compareEntities } from "@/lib/api";
import type { ViewRow } from "@/lib/types";
import EntityPicker, { type SelectedEntity } from "@/components/EntityPicker";
import StatusBar from "@/components/StatusBar";

// ── Curated field definitions ─────────────────────────────────────────────

type FieldDef = {
  key: string;
  label: string;
  group: string;
  render?: (v: unknown) => React.ReactNode;
};

function fmt(v: unknown): React.ReactNode {
  if (v === null || v === undefined || v === "") return <span className="text-terminal-dim">—</span>;
  return String(v);
}

function score(v: unknown): React.ReactNode {
  const n = Number(v ?? null);
  if (isNaN(n)) return <span className="text-terminal-dim">—</span>;
  return <span className="font-bold text-terminal-cyan">{n.toFixed(3)}</span>;
}

function trl(v: unknown): React.ReactNode {
  if (v === null || v === undefined) return <span className="text-terminal-dim">—</span>;
  return (
    <span className="inline-block bg-terminal-muted text-terminal-cyan px-2 py-0.5 text-[10px] font-bold rounded-sm">
      {String(v)}
    </span>
  );
}

function fragility(v: unknown): React.ReactNode {
  const s = String(v ?? "").toUpperCase().trim();
  if (!s || s === "NULL" || s === "UNDEFINED") return <span className="text-terminal-dim">—</span>;
  const cls =
    s === "HIGH"   ? "bg-red-950 text-terminal-red border-terminal-red" :
    s === "MEDIUM" ? "bg-amber-950 text-terminal-orange border-terminal-orange" :
    s === "LOW"    ? "bg-green-950 text-terminal-green border-terminal-green" :
    "bg-terminal-muted text-terminal-secondary border-terminal-border";
  return (
    <span className={`inline-block text-[10px] font-mono font-bold px-1.5 py-0.5 border rounded-sm tracking-wider ${cls}`}>
      {s}
    </span>
  );
}

function regPass(v: unknown): React.ReactNode {
  const n = Number(v ?? 0);
  if (!n) return <span className="text-terminal-dim">—</span>;
  return <span className="font-mono text-terminal-green inline-flex items-center gap-1"><CheckCircle size={9} />{n}</span>;
}

function regFail(v: unknown): React.ReactNode {
  const n = Number(v ?? 0);
  if (!n) return <span className="text-terminal-dim">—</span>;
  return <span className="font-mono text-terminal-red inline-flex items-center gap-1"><XCircle size={9} />{n}</span>;
}

function sanctions(v: unknown): React.ReactNode {
  const n = Number(v ?? 0);
  if (!n) return <span className="text-terminal-dim">—</span>;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-terminal-red">
      <AlertTriangle size={10} />{n}
    </span>
  );
}

const FIELD_DEFS: FieldDef[] = [
  { key: "official_name",          label: "Name",               group: "IDENTITY" },
  { key: "hq_country",             label: "HQ Country",         group: "IDENTITY" },
  { key: "ownership_status",       label: "Ownership",          group: "IDENTITY" },
  { key: "entity_type_code",       label: "Entity Type",        group: "IDENTITY" },
  { key: "primary_strategic_code", label: "Strategic Priority", group: "STRATEGIC" },
  { key: "final_score",            label: "Final Score",        group: "STRATEGIC", render: score },
  { key: "base_score",             label: "Base Score",         group: "STRATEGIC", render: score },
  { key: "highest_trl",            label: "Highest TRL",        group: "STRATEGIC", render: trl },
  { key: "supported_op_count",     label: "Supported Ops",      group: "OPERATIONS" },
  { key: "supported_tc_count",     label: "Supported Caps.",    group: "OPERATIONS" },
  { key: "reg_pass_count",         label: "Reg ✓ Pass",         group: "REGULATORY", render: regPass },
  { key: "reg_fail_count",         label: "Reg ✗ Fail",         group: "REGULATORY", render: regFail },
  { key: "pr_fragility",           label: "PR Fragility",       group: "RISK",        render: fragility },
  { key: "sanction_link_count",    label: "Sanctions",          group: "RISK",        render: sanctions },
  { key: "buyer_contract_count",   label: "Contracts",          group: "MARKET" },
  { key: "tech_count",             label: "Tech Domains",       group: "MARKET" },
];

const GROUPS = ["IDENTITY", "STRATEGIC", "OPERATIONS", "REGULATORY", "RISK", "MARKET"];

// ── Page ────────────────────────────────────────────────────────────────────

export default function ComparePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<SelectedEntity[]>([]);
  const [submitted, setSubmitted] = useState<string[]>([]);

  const { data, isFetching, error } = useQuery({
    queryKey: ["compare", submitted],
    queryFn: () => compareEntities(submitted),
    enabled: submitted.length >= 2,
  });

  const handleCompare = () => {
    if (selected.length >= 2) setSubmitted(selected.map((s) => s.id));
  };

  const handleClear = () => {
    setSelected([]);
    setSubmitted([]);
  };

  // Build merged data keyed by entity_id
  const entityMap: Record<string, Record<string, unknown>> = {};
  data?.profiles.forEach((r) => {
    const id = String(r.entity_id ?? "");
    if (id) entityMap[id] = { ...r };
  });
  data?.rankings.forEach((r) => {
    const id = String(r.entity_id ?? "");
    if (id) entityMap[id] = { ...(entityMap[id] ?? {}), ...r };
  });
  data?.screener?.forEach((r) => {
    const id = String(r.entity_id ?? "");
    if (id) entityMap[id] = { ...(entityMap[id] ?? {}), ...r };
  });

  // Use submitted IDs for column order, filtered to those with data
  const colIds = submitted.length > 0
    ? submitted.filter((id) => entityMap[id])
    : [];

  // Resolve display name: prefer picker name, fall back to entityMap
  const nameFor = (id: string) => {
    const picked = selected.find((s) => s.id === id);
    return picked?.name ?? String(entityMap[id]?.official_name ?? id);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <ArrowLeftRight size={16} className="text-terminal-cyan" />
        <h1 className="text-terminal-cyan text-sm font-bold tracking-widest">MULTI-ENTITY COMPARISON</h1>
        <span className="text-terminal-dim text-xs">{colIds.length > 0 ? `${colIds.length} entities` : ""}</span>
      </div>

      {/* Entity selector */}
      <div className="panel p-3">
        <div className="text-terminal-secondary text-[10px] tracking-widest mb-2">SELECT ENTITIES TO COMPARE (2–10)</div>
        <EntityPicker
          selected={selected}
          onChange={setSelected}
          max={10}
          placeholder="Search entity by name…"
        />
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={handleCompare}
            disabled={selected.length < 2}
            className="text-xs text-terminal-cyan border border-terminal-cyan px-4 py-1.5 hover:bg-terminal-muted disabled:opacity-30 transition-colors tracking-wider"
          >
            COMPARE {selected.length >= 2 ? `(${selected.length})` : ""}
          </button>
          {(selected.length > 0 || submitted.length > 0) && (
            <button onClick={handleClear} className="text-terminal-dim text-xs hover:text-terminal-text">
              CLEAR ALL
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="text-terminal-red text-xs panel px-4 py-3">ERROR: {String(error)}</div>
      )}

      {/* Curated comparison grid */}
      {colIds.length > 0 && (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-terminal-panel border-b border-r border-terminal-border px-3 py-2 text-left text-[10px] text-terminal-dim tracking-widest w-36 min-w-36">
                  FIELD
                </th>
                {colIds.map((id) => (
                  <th key={id} className="bg-terminal-panel border-b border-r border-terminal-border px-0 py-0 min-w-44">
                    <div className="flex items-center justify-between px-3 py-2">
                      <button
                        onClick={() => router.push(`/entities/${id}`)}
                        className="text-terminal-cyan text-xs font-bold tracking-wider hover:underline truncate max-w-[80%] text-left"
                        title={nameFor(id)}
                      >
                        {nameFor(id)}
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GROUPS.map((group) => {
                const groupFields = FIELD_DEFS.filter((f) => f.group === group);
                return (
                  <>
                    <tr key={`group-${group}`}>
                      <td
                        colSpan={colIds.length + 1}
                        className="sticky left-0 bg-terminal-muted px-3 py-1 text-[9px] text-terminal-cyan tracking-widest border-b border-terminal-border"
                      >
                        {group}
                      </td>
                    </tr>
                    {groupFields.map((field) => {
                      const values = colIds.map((id) => entityMap[id]?.[field.key]);
                      const uniq = new Set(values.map((v) => String(v ?? "")));
                      const diverges = uniq.size > 1 && !values.every((v) => v === null || v === undefined);
                      return (
                        <tr
                          key={field.key}
                          className={`border-b border-terminal-muted ${diverges ? "bg-terminal-panel" : ""}`}
                        >
                          <td
                            className={`sticky left-0 px-3 py-2 text-terminal-secondary whitespace-nowrap border-r border-terminal-border ${diverges ? "bg-terminal-panel" : "bg-terminal-bg"}`}
                          >
                            {field.label}
                            {diverges && <span className="ml-1 text-[8px] text-terminal-orange">≠</span>}
                          </td>
                          {colIds.map((id) => {
                            const v = entityMap[id]?.[field.key];
                            return (
                              <td key={id} className="px-3 py-2 border-r border-terminal-muted font-mono">
                                {field.render ? field.render(v) : fmt(v)}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {submitted.length === 0 && !isFetching && (
        <div className="flex-1 flex items-center justify-center text-terminal-dim text-xs tracking-widest">
          SEARCH AND SELECT ENTITIES ABOVE, THEN PRESS COMPARE
        </div>
      )}

      {isFetching && (
        <div className="flex-1 flex items-center justify-center text-terminal-orange text-xs animate-pulse tracking-widest">
          LOADING…
        </div>
      )}

      <StatusBar
        loading={isFetching}
        message={colIds.length > 0 ? `COMPARE · ${colIds.length} ENTITIES` : "COMPARE"}
      />
    </div>
  );
}
