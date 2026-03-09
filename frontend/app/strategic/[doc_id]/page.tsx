"use client";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Shield, ArrowLeft } from "lucide-react";
import { getStrategicDocument } from "@/lib/api";
import DataTable from "@/components/DataTable";
import StatusBar from "@/components/StatusBar";
import MetricCard from "@/components/MetricCard";

export default function StrategicDocPage({ params }: { params: Promise<{ doc_id: string }> }) {
  const { doc_id } = use(params);
  const router = useRouter();

  const { data, isFetching, error } = useQuery({
    queryKey: ["strategic-doc", doc_id],
    queryFn: () => getStrategicDocument(doc_id),
  });

  const doc = data?.document;
  const atoms = data?.atoms ?? [];

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-terminal-dim hover:text-terminal-cyan">
          <ArrowLeft size={16} />
        </button>
        <Shield size={16} className="text-terminal-cyan" />
        <div>
          <h1 className="text-terminal-cyan text-sm font-bold tracking-widest">
            {doc ? String(doc.doc_type ?? doc.doc_id) : doc_id}
          </h1>
          <div className="text-terminal-dim text-xs">doc_id: {doc_id} · {String(doc?.issuer ?? "")}</div>
        </div>
      </div>

      {error && <div className="text-terminal-red text-xs panel px-4 py-3">ERROR: {String(error)}</div>}

      {doc && (
        <div className="grid grid-cols-4 gap-3">
          <MetricCard label="Strategic Level" value={String(doc.strategic_level ?? "—")} highlight />
          <MetricCard label="Geographic Scope" value={String(doc.geographic_scope ?? "—")} />
          <MetricCard label="Layer Class" value={String(doc.layer_class ?? "—")} />
          <MetricCard label="Published" value={String(doc.published_date ?? "—")} />
        </div>
      )}

      <div className="panel flex-1 overflow-hidden">
        <div className="px-3 py-2 border-b border-terminal-border text-terminal-cyan text-xs tracking-widest">
          STRATEGIC ATOMS ({atoms.length})
        </div>
        <DataTable
          data={atoms}
          columns={["atom_id", "atom_type", "section", "capability_domain", "confidence_level", "budget_value", "currency", "timeframe_start", "timeframe_end", "excerpt"]}
          maxHeight="calc(100vh - 360px)"
        />
      </div>

      <StatusBar loading={isFetching} message={`${atoms.length} atoms · ${doc_id}`} />
    </div>
  );
}
