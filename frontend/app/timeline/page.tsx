"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import { getTimeline } from "@/lib/api";
import type { ViewRow } from "@/lib/types";
import StatusBar from "@/components/StatusBar";
import DataTable from "@/components/DataTable";

function TimelineEvent({ row, index }: { row: ViewRow; index: number }) {
  const date = String(row.event_date ?? row.date ?? row.created_at ?? row.updated_at ?? "");
  const title = String(row.event_name ?? row.title ?? row.event_type ?? row.context_type ?? `Event ${index + 1}`);
  const desc = String(row.description ?? row.summary ?? row.context_value ?? "");
  const entity = String(row.entity_name ?? row.entity_id ?? "");

  return (
    <div className="flex gap-4 group">
      {/* Timeline spine */}
      <div className="flex flex-col items-center">
        <div className="w-2 h-2 rounded-full bg-terminal-cyan mt-1.5 shrink-0 group-hover:bg-terminal-orange transition-colors" />
        <div className="w-px flex-1 bg-terminal-border mt-1" />
      </div>
      {/* Event body */}
      <div className="panel px-4 py-3 mb-3 flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="text-terminal-cyan text-xs font-semibold tracking-wide">{title}</span>
          {date && (
            <span className="text-terminal-dim text-xs shrink-0">{date}</span>
          )}
        </div>
        {entity && (
          <div className="text-terminal-secondary text-xs mb-1">{entity}</div>
        )}
        {desc && (
          <p className="text-terminal-text text-xs leading-relaxed">{desc}</p>
        )}
      </div>
    </div>
  );
}

export default function TimelinePage() {
  const [entityId, setEntityId] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [viewMode, setViewMode] = useState<"timeline" | "table">("timeline");

  const { data, isFetching, error } = useQuery({
    queryKey: ["timeline", submitted],
    queryFn: () => getTimeline({ entity_id: submitted || undefined, limit: 200 }),
  });

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <Clock size={16} className="text-terminal-cyan" />
        <h1 className="text-terminal-cyan text-sm font-bold tracking-widest">EVENT TIMELINE</h1>
        <span className="text-terminal-dim text-xs">v_dfm_entity_context_v1</span>
      </div>

      <div className="panel p-3 flex items-center gap-3">
        <input
          value={entityId}
          onChange={(e) => setEntityId(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") setSubmitted(entityId); }}
          placeholder="Filter by Entity ID… (Enter)"
          className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-56 placeholder:text-terminal-dim"
        />
        <button onClick={() => setSubmitted(entityId)} className="text-terminal-cyan text-xs hover:text-white">
          APPLY
        </button>
        {submitted && (
          <button onClick={() => { setSubmitted(""); setEntityId(""); }}
            className="text-terminal-dim text-xs hover:text-terminal-text">CLEAR</button>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-1 border border-terminal-border">
          {(["timeline", "table"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`text-xs px-3 py-1.5 tracking-wider transition-colors ${
                viewMode === m
                  ? "bg-terminal-cyan text-terminal-bg font-semibold"
                  : "text-terminal-secondary hover:text-terminal-text"
              }`}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>
        <span className="text-terminal-secondary text-xs">{data?.data.length ?? 0} events</span>
      </div>

      {error && (
        <div className="text-terminal-red text-xs panel px-4 py-3">ERROR: {String(error)}</div>
      )}

      <div className="flex-1 overflow-auto">
        {viewMode === "timeline" ? (
          <div className="pr-2 pl-1">
            {(data?.data ?? []).map((row, i) => (
              <TimelineEvent key={i} row={row} index={i} />
            ))}
            {!isFetching && !data?.data.length && (
              <div className="text-center text-terminal-dim text-xs tracking-widest mt-12">
                NO EVENTS FOUND
              </div>
            )}
          </div>
        ) : (
          <div className="panel overflow-hidden">
            <DataTable data={data?.data ?? []} maxHeight="calc(100vh - 260px)" />
          </div>
        )}
      </div>

      <StatusBar loading={isFetching} message={`${data?.data.length ?? 0} events · TIMELINE`} />
    </div>
  );
}
