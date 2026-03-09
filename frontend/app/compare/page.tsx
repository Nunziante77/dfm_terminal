"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Plus, X, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { compareEntities } from "@/lib/api";
import type { ViewRow } from "@/lib/types";
import StatusBar from "@/components/StatusBar";

// ── Curated field groups ────────────────────────────────────────────────────

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
  return <span className="inline-block bg-terminal-muted text-terminal-cyan px-2 py-0.5 text-[10px] font-bold rounded-sm">{String(v)}</span>;
}

function fragility(v: unknown): React.ReactNode {
  const s = String(v ?? "").toUpperCase().trim();
  if (!s || s === "NULL") return <span className="text-terminal-dim">—</span>;
  const cls =
    s === "HIGH"   ? "bg-red-950 text-terminal-red border-terminal-red" :
    s === "MEDIUM" ? "bg-amber-950 text-terminal-orange border-terminal-orange" :
    s === "LOW"    ? "bg-green-950 text-terminal-green border-terminal-green" :
    "bg-terminal-muted text-terminal-secondary border-terminal-border";
  return <span className={`inline-block text-[10px] font-mono font-bold px-1.5 py-0.5 border rounded-sm tracking-wider ${cls}`}>{s}</span>;
}

function regCount(v: unknown, type: "pass" | "fail"): React.ReactNode {
  const n = Number(v ?? 0);
  if (type === "pass")
    return <span className={`font-mono ${n > 0 ? "text-terminal-green" : "text-terminal-dim"}`}>{n > 0 ? <><CheckCircle size={9} className="inline mr-1" />{n}</> : "—"}</span>;
  return <span className={`font-mono ${n > 0 ? "text-terminal-red" : "text-terminal-dim"}`}>{n > 0 ? <><XCircle size={9} className="inline mr-1" />{n}</> : "—"}</span>;
}

function sanctions(v: unknown): React.ReactNode {
  const n = Number(v ?? 0);
  if (!n) return <span className="text-terminal-dim">—</span>;
  return <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-terminal-red"><AlertTriangle size={10} />{n}</span>;
}

const FIELD_DEFS: FieldDef[] = [
  // Identity
  { key: "official_name",         label: "Name",               group: "IDENTITY" },
  { key: "hq_country",            label: "HQ Country",         group: "IDENTITY" },
  { key: "ownership_status",      label: "Ownership",          group: "IDENTITY" },
  { key: "entity_type_code",      label: "Entity Type",        group: "IDENTITY" },
  // Strategic
  { key: "primary_strategic_code", label: "Strategic Priority", group: "STRATEGIC" },
  { key: "final_score",           label: "Final Score",        group: "STRATEGIC", render: score },
  { key: "base_score",            label: "Base Score",         group: "STRATEGIC", render: score },
  { key: "highest_trl",           label: "Highest TRL",        group: "STRATEGIC", render: trl },
  // Operations
  { key: "supported_op_count",    label: "Supported Ops",      group: "OPERATIONS" },
  { key: "supported_tc_count",    label: "Supported Caps.",    group: "OPERATIONS" },
  // Regulatory
  { key: "reg_pass_count",        label: "Reg ✓ Pass",         group: "REGULATORY", render: (v) => regCount(v, "pass") },
  { key: "reg_fail_count",        label: "Reg ✗ Fail",         group: "REGULATORY", render: (v) => regCount(v, "fail") },
  // Risk
  { key: "pr_fragility",          label: "PR Fragility",       group: "RISK",        render: fragility },
  { key: "sanction_link_count",   label: "Sanctions",          group: "RISK",        render: sanctions },
  // Market
  { key: "buyer_contract_count",  label: "Contracts",          group: "MARKET" },
  { key: "tech_count",            label: "Tech Domains",       group: "MARKET" },
];

const GROUPS = ["IDENTITY", "STRATEGIC", "OPERATIONS", "REGULATORY", "RISK", "MARKET"];

// ── Column header ───────────────────────────────────────────────────────────

function ColHeader({ name, entityId, onRemove }: { name: string; entityId: string; onRemove: () => void }) {
  const router = useRouter();
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-terminal-border">
      <button
        onClick={() => router.push(`/entities/${entityId}`)}
        className="text-terminal-cyan text-xs font-bold tracking-wider hover:underline truncate max-w-[80%]"
      >
        {name}
      </button>
      <button onClick={onRemove} className="text-terminal-dim hover:text-terminal-red shrink-0 ml-1">
        <X size={11} />
      </button>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function ComparePage() {
  const [inputs, setInputs] = useState<string[]>(["", ""]);
  const [submitted, setSubmitted] = useState<string[]>([]);

  const { data, isFetching, error } = useQuery({
    queryKey: ["compare", submitted],
    queryFn: () => compareEntities(submitted),
    enabled: submitted.length >= 2,
  });

  const handleSubmit = () => {
    const valid = inputs.filter((i) => i.trim());
    if (valid.length >= 2) setSubmitted(valid);
  };

  const removeEntity = (entityId: string) => {
    const next = submitted.filter((id) => id !== entityId);
    setSubmitted(next);
    setInputs(next.length >= 2 ? [...next, ""] : next);
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

  const entityIds = data?.entity_ids ?? [];
  const presentIds = entityIds.filter((id) => entityMap[id]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <ArrowLeftRight size={16} className="text-terminal-cyan" />
        <h1 className="text-terminal-cyan text-sm font-bold tracking-widest">MULTI-ENTITY COMPARISON</h1>
        <span className="text-terminal-dim text-xs">{presentIds.length > 0 ? `${presentIds.length} entities` : ""}</span>
      </div>

      {/* Input */}
      <div className="panel p-3 flex flex-wrap gap-2 items-center">
        {inputs.map((val, i) => (
          <div key={i} className="flex items-center gap-1">
            <input
              value={val}
              onChange={(e) => {
                const next = [...inputs];
                next[i] = e.target.value;
                setInputs(next);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder={`Entity ID ${i + 1}`}
              className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-36 placeholder:text-terminal-dim"
            />
            {inputs.length > 2 && (
              <button onClick={() => setInputs((p) => p.filter((_, idx) => idx !== i))} className="text-terminal-dim hover:text-terminal-red">
                <X size={12} />
              </button>
            )}
          </div>
        ))}
        {inputs.length < 10 && (
          <button onClick={() => setInputs((p) => [...p, ""])} className="text-terminal-cyan hover:text-white">
            <Plus size={14} />
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={inputs.filter((i) => i.trim()).length < 2}
          className="ml-2 text-xs text-terminal-cyan border border-terminal-cyan px-3 py-1.5 hover:bg-terminal-muted disabled:opacity-30 transition-colors"
        >
          COMPARE
        </button>
        {submitted.length > 0 && (
          <button
            onClick={() => { setSubmitted([]); setInputs(["", ""]); }}
            className="text-terminal-dim text-xs hover:text-terminal-text"
          >
            CLEAR
          </button>
        )}
      </div>

      {error && (
        <div className="text-terminal-red text-xs panel px-4 py-3">ERROR: {String(error)}</div>
      )}

      {/* Curated comparison grid */}
      {data && presentIds.length > 0 && (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                {/* Field label column */}
                <th className="sticky left-0 z-10 bg-terminal-panel border-b border-r border-terminal-border px-3 py-2 text-left text-[10px] text-terminal-dim tracking-widest w-32 min-w-32">
                  FIELD
                </th>
                {presentIds.map((id) => {
                  const row = entityMap[id] ?? {};
                  const name = String(row.official_name ?? id);
                  return (
                    <th key={id} className="bg-terminal-panel border-b border-r border-terminal-border px-0 py-0 min-w-40">
                      <ColHeader
                        name={name}
                        entityId={id}
                        onRemove={() => removeEntity(id)}
                      />
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {GROUPS.map((group) => {
                const groupFields = FIELD_DEFS.filter((f) => f.group === group);
                return (
                  <>
                    <tr key={`group-${group}`}>
                      <td
                        colSpan={presentIds.length + 1}
                        className="sticky left-0 bg-terminal-muted px-3 py-1 text-[9px] text-terminal-cyan tracking-widest border-b border-terminal-border"
                      >
                        {group}
                      </td>
                    </tr>
                    {groupFields.map((field) => {
                      const values = presentIds.map((id) => entityMap[id]?.[field.key]);
                      // Highlight if values differ across entities
                      const uniq = new Set(values.map((v) => String(v ?? "")));
                      const diverges = uniq.size > 1 && !values.every((v) => v === null || v === undefined);
                      return (
                        <tr key={field.key} className={`border-b border-terminal-muted ${diverges ? "bg-terminal-panel" : ""}`}>
                          <td className={`sticky left-0 px-3 py-2 text-terminal-secondary whitespace-nowrap border-r border-terminal-border ${diverges ? "bg-terminal-panel" : "bg-terminal-bg"}`}>
                            {field.label}
                            {diverges && <span className="ml-1 text-[8px] text-terminal-orange">≠</span>}
                          </td>
                          {presentIds.map((id) => {
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

      {!data && !isFetching && (
        <div className="flex-1 flex items-center justify-center text-terminal-dim text-xs tracking-widest">
          ENTER ENTITY IDs TO COMPARE
        </div>
      )}

      <StatusBar loading={isFetching} message={presentIds.length > 0 ? `COMPARE · ${presentIds.length} ENTITIES` : "COMPARE"} />
    </div>
  );
}
