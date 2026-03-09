"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Shield, ChevronLeft, ChevronRight, ChevronRight as ChevRight } from "lucide-react";
import { listStrategicDocuments, listCapabilityDomains, getStrategicAtomEntities } from "@/lib/api";
import type { ViewRow } from "@/lib/types";
import DataTable from "@/components/DataTable";
import StatusBar from "@/components/StatusBar";

const PAGE_SIZE = 50;
type Tab = "documents" | "capability-map";

export default function StrategicPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("documents");
  const [offset, setOffset] = useState(0);
  const [issuer, setIssuer] = useState("");
  const [strategicLevel, setStrategicLevel] = useState("");
  const [layerClass, setLayerClass] = useState("");
  const [submitted, setSubmitted] = useState({ issuer: "", strategic_level: "", layer_class: "" });
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  const apply = () => {
    setSubmitted({ issuer, strategic_level: strategicLevel, layer_class: layerClass });
    setOffset(0);
  };

  const { data, isFetching: docsFetching, error } = useQuery({
    queryKey: ["strategic-docs", offset, submitted],
    queryFn: () =>
      listStrategicDocuments({
        limit: PAGE_SIZE,
        offset,
        issuer: submitted.issuer || undefined,
        strategic_level: submitted.strategic_level || undefined,
        layer_class: submitted.layer_class || undefined,
      }),
    enabled: tab === "documents",
  });

  const { data: domains, isFetching: domainsFetching } = useQuery({
    queryKey: ["capability-domains"],
    queryFn: listCapabilityDomains,
    enabled: tab === "capability-map",
    staleTime: 120_000,
  });

  const { data: domainEntities, isFetching: entitiesFetching } = useQuery({
    queryKey: ["domain-entities", selectedDomain],
    queryFn: () => getStrategicAtomEntities(selectedDomain!, 50),
    enabled: tab === "capability-map" && !!selectedDomain,
  });

  const loading = docsFetching || domainsFetching || entitiesFetching;
  const total = data?.total ?? 0;
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pages = Math.ceil(total / PAGE_SIZE) || 1;

  const TABS: { key: Tab; label: string }[] = [
    { key: "documents",      label: "STRATEGIC DOCUMENTS" },
    { key: "capability-map", label: "CAPABILITY MAP" },
  ];

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <Shield size={16} className="text-terminal-cyan" />
        <h1 className="text-terminal-cyan text-sm font-bold tracking-widest">STRATEGIC DOCUMENTS</h1>
        <span className="text-terminal-dim text-xs">dfm_strategic_documents · dfm_strategic_atoms · v_dfm_entity_tech_union_v1</span>
      </div>

      <div className="flex border-b border-terminal-border">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setOffset(0); }}
            className={`px-4 py-2 text-xs tracking-wider border-b-2 transition-colors ${
              tab === key ? "border-terminal-cyan text-terminal-cyan" : "border-transparent text-terminal-secondary hover:text-terminal-text"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* STRATEGIC DOCUMENTS */}
      {tab === "documents" && (
        <>
          <div className="panel p-3 flex flex-wrap gap-3 items-center">
            <input value={issuer} onChange={(e) => setIssuer(e.target.value)} onKeyDown={(e) => e.key === "Enter" && apply()}
              placeholder="Issuer…"
              className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-36 placeholder:text-terminal-dim" />
            <input value={strategicLevel} onChange={(e) => setStrategicLevel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && apply()}
              placeholder="Strategic level…"
              className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-36 placeholder:text-terminal-dim" />
            <input value={layerClass} onChange={(e) => setLayerClass(e.target.value)} onKeyDown={(e) => e.key === "Enter" && apply()}
              placeholder="Layer class…"
              className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-28 placeholder:text-terminal-dim" />
            <button onClick={apply} className="text-terminal-cyan text-xs hover:text-white">APPLY</button>
            <div className="flex-1" />
            <span className="text-terminal-secondary text-xs">{total.toLocaleString()} documents</span>
          </div>

          {error && <div className="text-terminal-red text-xs panel px-4 py-3">ERROR: {String(error)}</div>}

          <div className="panel flex-1 overflow-hidden">
            <DataTable
              data={data?.data ?? []}
              columns={["doc_id", "issuer", "doc_type", "strategic_level", "geographic_scope", "published_date", "layer_class"]}
              onRowClick={(row) => { if (row.doc_id) router.push(`/strategic/${row.doc_id}`); }}
              maxHeight="calc(100vh - 270px)"
            />
          </div>

          <div className="flex items-center justify-between">
            <StatusBar loading={loading} message={`${total} documents · STRATEGIC`} />
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

      {/* CAPABILITY MAP */}
      {tab === "capability-map" && (
        <>
          <div className="grid grid-cols-3 gap-4 flex-1 overflow-hidden">
            {/* Left: domain list */}
            <div className="panel overflow-auto">
              <div className="px-3 py-2 border-b border-terminal-border text-terminal-cyan text-xs tracking-widest">
                CAPABILITY DOMAINS ({domains?.total ?? 0})
              </div>
              {domainsFetching && (
                <div className="px-3 py-4 text-terminal-orange text-xs animate-pulse">LOADING…</div>
              )}
              {(domains?.data ?? []).map((row: ViewRow) => {
                const domain = String(row.capability_domain ?? "");
                const count = Number(row.atom_count ?? 0);
                return (
                  <div
                    key={domain}
                    onClick={() => setSelectedDomain(domain)}
                    className={`flex items-start gap-2 px-3 py-2 text-xs cursor-pointer border-b border-terminal-muted transition-colors ${
                      selectedDomain === domain
                        ? "bg-terminal-muted text-terminal-cyan border-l-2 border-terminal-cyan"
                        : "text-terminal-secondary hover:bg-terminal-muted hover:text-terminal-text border-l-2 border-transparent"
                    }`}
                  >
                    <ChevRight size={10} className="shrink-0 text-terminal-dim mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono font-semibold truncate">{domain || "—"}</div>
                      <div className="text-terminal-dim text-[10px] mt-0.5">{count} atoms</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: entities for selected domain */}
            <div className="col-span-2 panel overflow-hidden flex flex-col">
              <div className="px-3 py-2 border-b border-terminal-border flex items-center justify-between shrink-0">
                <span className="text-terminal-cyan text-xs tracking-widest">
                  {selectedDomain
                    ? `ENTITIES · ${selectedDomain}`
                    : "SELECT A CAPABILITY DOMAIN"}
                </span>
                {selectedDomain && (
                  <button
                    onClick={() => setSelectedDomain(null)}
                    className="text-terminal-dim text-xs hover:text-terminal-text"
                  >
                    ✕ CLEAR
                  </button>
                )}
              </div>

              {!selectedDomain && (
                <div className="flex-1 flex items-center justify-center text-terminal-dim text-xs tracking-widest">
                  SELECT A DOMAIN ON THE LEFT TO SEE LINKED ENTITIES
                </div>
              )}

              {selectedDomain && (
                <>
                  {entitiesFetching ? (
                    <div className="flex-1 flex items-center justify-center text-terminal-orange text-xs animate-pulse tracking-widest">
                      LOADING…
                    </div>
                  ) : (domainEntities?.data ?? []).length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-terminal-dim text-xs tracking-widest">
                      NO ENTITIES LINKED TO THIS DOMAIN
                    </div>
                  ) : (
                    <div className="flex-1 overflow-auto">
                      <table className="dfm-table w-full">
                        <thead>
                          <tr>
                            <th>Entity</th>
                            <th>Country</th>
                            <th>Priority</th>
                            <th>TRL</th>
                            <th>Final Score</th>
                            <th>Ops</th>
                            <th>Tech Code</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(domainEntities?.data ?? []).map((row: ViewRow, i: number) => (
                            <tr
                              key={i}
                              onClick={() => { if (row.entity_id) router.push(`/entities/${String(row.entity_id)}`); }}
                              className="cursor-pointer transition-colors border-l-2 border-transparent hover:border-terminal-cyan"
                            >
                              <td className="text-terminal-cyan font-semibold">
                                {String(row.official_name ?? row.entity_id ?? "—")}
                              </td>
                              <td className="text-terminal-secondary">{String(row.headquarters_country_iso2 ?? "—")}</td>
                              <td className="font-mono text-[10px]">{String(row.primary_strategic_code ?? "—")}</td>
                              <td className="text-center font-mono">
                                {row.highest_trl != null
                                  ? <span className="inline-block bg-terminal-muted text-terminal-cyan px-1.5 py-0.5 text-[10px] font-bold rounded-sm">{String(row.highest_trl)}</span>
                                  : <span className="text-terminal-dim">—</span>}
                              </td>
                              <td className="font-mono font-bold text-terminal-cyan">
                                {row.final_score != null ? Number(row.final_score).toFixed(3) : "—"}
                              </td>
                              <td className="text-terminal-secondary">{row.supported_op_count != null ? String(row.supported_op_count) : "—"}</td>
                              <td className="font-mono text-terminal-dim text-[10px]">{String(row.dfm_tech_code ?? "—")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="px-3 py-1.5 border-t border-terminal-border text-terminal-dim text-[10px] shrink-0">
                    {domainEntities?.total ?? 0} entities matched via tech code · domain: {selectedDomain}
                  </div>
                </>
              )}
            </div>
          </div>

          <StatusBar loading={loading} message={selectedDomain ? `CAPABILITY MAP · ${selectedDomain}` : "CAPABILITY MAP"} />
        </>
      )}
    </div>
  );
}
