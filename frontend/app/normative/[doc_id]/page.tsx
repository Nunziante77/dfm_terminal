"use client";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FileText, ArrowLeft } from "lucide-react";
import { getNormativeDocument } from "@/lib/api";
import DataTable from "@/components/DataTable";
import StatusBar from "@/components/StatusBar";
import MetricCard from "@/components/MetricCard";

export default function NormativeDocPage({ params }: { params: Promise<{ doc_id: string }> }) {
  const { doc_id } = use(params);
  const router = useRouter();

  const { data, isFetching, error } = useQuery({
    queryKey: ["normative-doc", doc_id],
    queryFn: () => getNormativeDocument(doc_id),
  });

  const doc = data?.document;
  const atoms = data?.atoms ?? [];
  const prProfile = data?.pr_profile ?? [];

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-terminal-dim hover:text-terminal-cyan">
          <ArrowLeft size={16} />
        </button>
        <FileText size={16} className="text-terminal-cyan" />
        <div>
          <h1 className="text-terminal-cyan text-sm font-bold tracking-widest">
            {doc ? String(doc.title ?? doc.doc_id) : doc_id}
          </h1>
          <div className="text-terminal-dim text-xs">doc_id: {doc_id}</div>
        </div>
      </div>

      {error && <div className="text-terminal-red text-xs panel px-4 py-3">ERROR: {String(error)}</div>}

      {doc && (
        <div className="grid grid-cols-4 gap-3">
          <MetricCard label="Doc Type" value={String(doc.doc_type ?? "—")} />
          <MetricCard label="Issuer" value={String(doc.issuer ?? "—")} />
          <MetricCard label="Published" value={String(doc.published_date ?? "—")} />
          <MetricCard label="Version" value={String(doc.version_no ?? "—")} />
        </div>
      )}

      {prProfile.length > 0 && (
        <div className="panel">
          <div className="px-3 py-2 border-b border-terminal-border text-terminal-cyan text-xs tracking-widest">
            PRIORITY COVERAGE
          </div>
          <DataTable
            data={prProfile}
            columns={["priority_code", "mapping_type", "total_atoms", "pr_atoms", "coverage_percent"]}
            maxHeight="200px"
          />
        </div>
      )}

      <div className="panel flex-1 overflow-hidden">
        <div className="px-3 py-2 border-b border-terminal-border text-terminal-cyan text-xs tracking-widest">
          NORMATIVE ATOMS ({atoms.length})
        </div>
        <DataTable
          data={atoms}
          columns={["atom_id", "article_ref", "section", "subject_text", "predicate_text", "object_text", "condition_text", "excerpt"]}
          maxHeight="calc(100vh - 400px)"
        />
      </div>

      <StatusBar loading={isFetching} message={`${atoms.length} atoms · ${doc_id}`} />
    </div>
  );
}
