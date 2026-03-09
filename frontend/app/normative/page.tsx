"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { listNormativeDocuments } from "@/lib/api";
import type { ViewRow } from "@/lib/types";
import DataTable from "@/components/DataTable";
import StatusBar from "@/components/StatusBar";

const PAGE_SIZE = 50;

export default function NormativePage() {
  const router = useRouter();
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [issuer, setIssuer] = useState("");
  const [docType, setDocType] = useState("");
  const [submitted, setSubmitted] = useState({ search: "", issuer: "", doc_type: "" });

  const { data, isFetching, error } = useQuery({
    queryKey: ["normative-docs", offset, submitted],
    queryFn: () =>
      listNormativeDocuments({
        limit: PAGE_SIZE,
        offset,
        search: submitted.search || undefined,
        issuer: submitted.issuer || undefined,
        doc_type: submitted.doc_type || undefined,
      }),
  });

  const apply = () => { setSubmitted({ search, issuer, doc_type: docType }); setOffset(0); };

  const total = data?.total ?? 0;
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pages = Math.ceil(total / PAGE_SIZE) || 1;

  const handleRow = (row: ViewRow) => {
    if (row.doc_id) router.push(`/normative/${row.doc_id}`);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <FileText size={16} className="text-terminal-cyan" />
        <h1 className="text-terminal-cyan text-sm font-bold tracking-widest">NORMATIVE DOCUMENTS</h1>
        <span className="text-terminal-dim text-xs">dfm_normative_documents</span>
      </div>

      <div className="panel p-3 flex flex-wrap gap-3 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="Search title / issuer…"
          className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-48 placeholder:text-terminal-dim"
        />
        <input
          value={issuer}
          onChange={(e) => setIssuer(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="Issuer…"
          className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-32 placeholder:text-terminal-dim"
        />
        <input
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="Doc type…"
          className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-28 placeholder:text-terminal-dim"
        />
        <button onClick={apply} className="text-terminal-cyan text-xs hover:text-white">APPLY</button>
        <div className="flex-1" />
        <span className="text-terminal-secondary text-xs">{total.toLocaleString()} documents</span>
      </div>

      {error && <div className="text-terminal-red text-xs panel px-4 py-3">ERROR: {String(error)}</div>}

      <div className="panel flex-1 overflow-hidden">
        <DataTable
          data={data?.data ?? []}
          columns={["doc_id", "title", "doc_type", "issuer", "published_date", "language_code", "version_no"]}
          onRowClick={handleRow}
          maxHeight="calc(100vh - 250px)"
        />
      </div>

      <div className="flex items-center justify-between">
        <StatusBar loading={isFetching} message={`${total} documents · NORMATIVE`} />
        <div className="flex items-center gap-2 pr-2">
          <button onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))} disabled={offset === 0}
            className="text-terminal-cyan disabled:opacity-30"><ChevronLeft size={16} /></button>
          <span className="text-xs text-terminal-secondary">{page}/{pages}</span>
          <button onClick={() => setOffset(offset + PAGE_SIZE)} disabled={offset + PAGE_SIZE >= total}
            className="text-terminal-cyan disabled:opacity-30"><ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}
