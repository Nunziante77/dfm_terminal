"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Shield, ChevronLeft, ChevronRight, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { listCompliance, getNormativePrProfile } from "@/lib/api";
import type { ViewRow } from "@/lib/types";
import DataTable from "@/components/DataTable";
import StatusBar from "@/components/StatusBar";

const PAGE_SIZE = 50;
type Tab = "matrix" | "priority";

function StatusPill({ status }: { status: unknown }) {
  const s = String(status ?? "").toLowerCase();
  if (s === "pass")
    return (
      <span className="inline-flex items-center gap-1 text-terminal-green text-xs font-mono">
        <CheckCircle size={11} /> PASS
      </span>
    );
  if (s === "fail")
    return (
      <span className="inline-flex items-center gap-1 text-terminal-red text-xs font-mono">
        <XCircle size={11} /> FAIL
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-terminal-dim text-xs font-mono">
      <HelpCircle size={11} /> {String(status ?? "UNKNOWN").toUpperCase()}
    </span>
  );
}

export default function CompliancePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("matrix");
  const [offset, setOffset] = useState(0);
  const [entityId, setEntityId] = useState("");
  const [evalStatus, setEvalStatus] = useState("");
  const [prCode, setPrCode] = useState("");
  const [submitted, setSubmitted] = useState({ entityId: "", evalStatus: "" });
  const [submittedPr, setSubmittedPr] = useState("");

  const apply = () => { setSubmitted({ entityId, evalStatus }); setOffset(0); };

  const { data: matrix, isFetching: mFetching, error: mError } = useQuery({
    queryKey: ["compliance-matrix", offset, submitted],
    queryFn: () =>
      listCompliance({
        entity_id: submitted.entityId || undefined,
        eval_status: submitted.evalStatus || undefined,
        limit: PAGE_SIZE,
        offset,
      }),
    enabled: tab === "matrix",
  });

  const { data: prProfile, isFetching: pFetching } = useQuery({
    queryKey: ["normative-pr-profile", submittedPr],
    queryFn: () => getNormativePrProfile({ priority_code: submittedPr || undefined, limit: 200 }),
    enabled: tab === "priority",
  });

  const loading = mFetching || pFetching;
  const total = matrix?.total ?? 0;
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pages = Math.ceil(total / PAGE_SIZE) || 1;

  const TABS: { key: Tab; label: string }[] = [
    { key: "matrix",   label: "ADMISSIBILITY MATRIX" },
    { key: "priority", label: "PRIORITY COVERAGE" },
  ];

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <Shield size={16} className="text-terminal-cyan" />
        <h1 className="text-terminal-cyan text-sm font-bold tracking-widest">
          REGULATORY ADMISSIBILITY
        </h1>
        <span className="text-terminal-dim text-xs">
          v_dfm_entity_normative_eval_v2 · v_normative_doc_pr_profile_v1
        </span>
      </div>

      <div className="flex border-b border-terminal-border">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setOffset(0); }}
            className={`px-4 py-2 text-xs tracking-wider border-b-2 transition-colors ${
              tab === key
                ? "border-terminal-cyan text-terminal-cyan"
                : "border-transparent text-terminal-secondary hover:text-terminal-text"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ADMISSIBILITY MATRIX */}
      {tab === "matrix" && (
        <>
          <div className="panel p-3 flex flex-wrap gap-3 items-center">
            <input
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && apply()}
              placeholder="Entity ID…"
              className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-48 placeholder:text-terminal-dim"
            />
            <select
              value={evalStatus}
              onChange={(e) => setEvalStatus(e.target.value)}
              className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none placeholder:text-terminal-dim"
            >
              <option value="">All statuses</option>
              <option value="pass">PASS</option>
              <option value="fail">FAIL</option>
              <option value="unknown">UNKNOWN</option>
            </select>
            <button onClick={apply} className="text-terminal-cyan text-xs hover:text-white">APPLY</button>
            {(submitted.entityId || submitted.evalStatus) && (
              <button
                onClick={() => { setEntityId(""); setEvalStatus(""); setSubmitted({ entityId: "", evalStatus: "" }); setOffset(0); }}
                className="text-terminal-dim text-xs hover:text-terminal-text"
              >
                CLEAR
              </button>
            )}
            <div className="flex-1" />
            <span className="text-terminal-secondary text-xs">{total.toLocaleString()} evaluations</span>
          </div>

          {mError && (
            <div className="text-terminal-red text-xs panel px-4 py-3">ERROR: {String(mError)}</div>
          )}

          <div className="panel flex-1 overflow-hidden">
            {matrix?.data && matrix.data.length > 0 ? (
              <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 310px)" }}>
                <table className="dfm-table">
                  <thead>
                    <tr>
                      <th>Entity ID</th>
                      <th>Doc ID</th>
                      <th>Title</th>
                      <th>Issuer</th>
                      <th>Doc Type</th>
                      <th>Atom ID</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.data.map((row: ViewRow, i: number) => (
                      <tr
                        key={i}
                        onClick={() => { if (row.entity_id) router.push(`/entities/${row.entity_id}`); }}
                        className="cursor-pointer"
                      >
                        <td className="font-mono text-terminal-cyan">{String(row.entity_id ?? "—")}</td>
                        <td className="font-mono text-terminal-dim">{String(row.doc_id ?? "—")}</td>
                        <td className="max-w-xs truncate">{String(row.title ?? "—")}</td>
                        <td>{String(row.issuer ?? "—")}</td>
                        <td className="text-terminal-secondary">{String(row.doc_type ?? "—")}</td>
                        <td className="font-mono text-terminal-dim">{String(row.atom_id ?? "—")}</td>
                        <td><StatusPill status={row.eval_status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <DataTable data={[]} maxHeight="calc(100vh - 310px)" />
            )}
          </div>

          <div className="flex items-center justify-between">
            <StatusBar loading={loading} message={`${total} evaluations · ADMISSIBILITY`} />
            <div className="flex items-center gap-2 pr-2">
              <button onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))} disabled={offset === 0}
                className="text-terminal-cyan disabled:opacity-30"><ChevronLeft size={16} /></button>
              <span className="text-xs text-terminal-secondary">{page}/{pages}</span>
              <button onClick={() => setOffset(offset + PAGE_SIZE)} disabled={offset + PAGE_SIZE >= total}
                className="text-terminal-cyan disabled:opacity-30"><ChevronRight size={16} /></button>
            </div>
          </div>
        </>
      )}

      {/* PRIORITY COVERAGE */}
      {tab === "priority" && (
        <>
          <div className="panel p-3 flex gap-3 items-center">
            <input
              value={prCode}
              onChange={(e) => setPrCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setSubmittedPr(prCode)}
              placeholder="Priority code (e.g. PR-01)…"
              className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-48 placeholder:text-terminal-dim"
            />
            <button onClick={() => setSubmittedPr(prCode)} className="text-terminal-cyan text-xs hover:text-white">APPLY</button>
            {submittedPr && (
              <button onClick={() => { setPrCode(""); setSubmittedPr(""); }} className="text-terminal-dim text-xs hover:text-terminal-text">CLEAR</button>
            )}
            <div className="flex-1" />
            <span className="text-terminal-secondary text-xs">{(prProfile?.total ?? 0).toLocaleString()} mappings</span>
          </div>

          <div className="panel flex-1 overflow-hidden">
            <DataTable
              data={prProfile?.data ?? []}
              columns={["doc_id", "priority_code", "title", "issuer", "doc_type", "published_date"]}
              maxHeight="calc(100vh - 270px)"
            />
          </div>

          <StatusBar loading={loading} message={`NORMATIVE PRIORITY COVERAGE`} />
        </>
      )}
    </div>
  );
}
