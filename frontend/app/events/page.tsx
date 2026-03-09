"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { listEvents, getEventsRankings, getTimeline } from "@/lib/api";
import type { ViewRow } from "@/lib/types";
import DataTable from "@/components/DataTable";
import StatusBar from "@/components/StatusBar";

const PAGE_SIZE = 100;
type Tab = "events" | "rankings" | "timeline";

// ── Timeline card component ──────────────────────────────────────────────────

function TimelineEvent({ row, index }: { row: ViewRow; index: number }) {
  const date   = String(row.event_date ?? row.created_at ?? "");
  const title  = String(row.event_type ?? `Event ${index + 1}`);
  const source = String(row.event_source ?? "");
  const entity = String(row.entity_id ?? "");
  const value  = row.event_value != null ? `${String(row.event_value)} ${String(row.currency ?? "")}`.trim() : "";

  return (
    <div className="flex gap-4 group">
      <div className="flex flex-col items-center">
        <div className="w-2 h-2 rounded-full bg-terminal-cyan mt-1.5 shrink-0 group-hover:bg-terminal-orange transition-colors" />
        <div className="w-px flex-1 bg-terminal-border mt-1" />
      </div>
      <div className="panel px-4 py-3 mb-3 flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="text-terminal-cyan text-xs font-semibold tracking-wide">{title}</span>
          {date && <span className="text-terminal-dim text-xs shrink-0">{date}</span>}
        </div>
        <div className="flex gap-4 text-xs text-terminal-secondary">
          {entity && <span className="font-mono">{entity}</span>}
          {source && <span className="text-terminal-dim">{source}</span>}
          {value  && <span className="text-terminal-green">{value}</span>}
        </div>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("events");
  const [offset, setOffset] = useState(0);
  const [eventType, setEventType] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [timelineEntityId, setTimelineEntityId] = useState("");
  const [submitted, setSubmitted] = useState({ event_type: "", country_code: "" });
  const [submittedTimelineEntity, setSubmittedTimelineEntity] = useState("");
  const [timelineViewMode, setTimelineViewMode] = useState<"timeline" | "table">("timeline");

  const applyEvents = () => { setSubmitted({ event_type: eventType, country_code: countryCode }); setOffset(0); };

  const { data: events, isFetching: eFetching, error: eError } = useQuery({
    queryKey: ["events", offset, submitted],
    queryFn: () =>
      listEvents({
        limit: PAGE_SIZE,
        offset,
        event_type: submitted.event_type || undefined,
        country_code: submitted.country_code || undefined,
      }),
    enabled: tab === "events",
  });

  const { data: rankings, isFetching: rFetching, error: rError } = useQuery({
    queryKey: ["events-rankings"],
    queryFn: () => getEventsRankings(200),
    enabled: tab === "rankings",
  });

  const { data: timeline, isFetching: tFetching, error: tError } = useQuery({
    queryKey: ["timeline", submittedTimelineEntity],
    queryFn: () => getTimeline({ entity_id: submittedTimelineEntity || undefined, limit: 200 }),
    enabled: tab === "timeline",
  });

  const loading = eFetching || rFetching || tFetching;
  const error = eError || rError || tError;
  const total = events?.total ?? 0;
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pages = Math.ceil(total / PAGE_SIZE) || 1;

  const handleRow = (row: ViewRow) => {
    if (row.entity_id) router.push(`/entities/${row.entity_id}`);
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: "events",   label: "ALL EVENTS" },
    { key: "rankings", label: "ENTITY RANKINGS" },
    { key: "timeline", label: "TIMELINE" },
  ];

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <Calendar size={16} className="text-terminal-cyan" />
        <h1 className="text-terminal-cyan text-sm font-bold tracking-widest">EVENTS & TIMELINE</h1>
        <span className="text-terminal-dim text-xs">dfm_events_v1 · v_dfm_entity_events_rank_v1</span>
      </div>

      <div className="flex border-b border-terminal-border">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => { setTab(key); setOffset(0); }}
            className={`px-4 py-2 text-xs tracking-wider border-b-2 transition-colors ${
              tab === key ? "border-terminal-cyan text-terminal-cyan" : "border-transparent text-terminal-secondary hover:text-terminal-text"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* ALL EVENTS filters */}
      {tab === "events" && (
        <div className="panel p-3 flex flex-wrap gap-3 items-center">
          <input value={eventType} onChange={(e) => setEventType(e.target.value)} onKeyDown={(e) => e.key === "Enter" && applyEvents()}
            placeholder="Event type…"
            className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-36 placeholder:text-terminal-dim" />
          <input value={countryCode} onChange={(e) => setCountryCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && applyEvents()}
            placeholder="Country code…"
            className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-28 placeholder:text-terminal-dim" />
          <button onClick={applyEvents} className="text-terminal-cyan text-xs hover:text-white">APPLY</button>
          <div className="flex-1" />
          <span className="text-terminal-secondary text-xs">{total.toLocaleString()} events</span>
        </div>
      )}

      {/* TIMELINE filters */}
      {tab === "timeline" && (
        <div className="panel p-3 flex items-center gap-3">
          <input
            value={timelineEntityId}
            onChange={(e) => setTimelineEntityId(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") setSubmittedTimelineEntity(timelineEntityId); }}
            placeholder="Filter by Entity ID… (Enter)"
            className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-56 placeholder:text-terminal-dim"
          />
          <button onClick={() => setSubmittedTimelineEntity(timelineEntityId)} className="text-terminal-cyan text-xs hover:text-white">APPLY</button>
          {submittedTimelineEntity && (
            <button onClick={() => { setSubmittedTimelineEntity(""); setTimelineEntityId(""); }}
              className="text-terminal-dim text-xs hover:text-terminal-text">CLEAR</button>
          )}
          <div className="flex-1" />
          <div className="flex items-center gap-1 border border-terminal-border">
            {(["timeline", "table"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setTimelineViewMode(m)}
                className={`text-xs px-3 py-1.5 tracking-wider transition-colors ${
                  timelineViewMode === m
                    ? "bg-terminal-cyan text-terminal-bg font-semibold"
                    : "text-terminal-secondary hover:text-terminal-text"
                }`}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>
          <span className="text-terminal-secondary text-xs">{timeline?.data.length ?? 0} events</span>
        </div>
      )}

      {error && <div className="text-terminal-red text-xs panel px-4 py-3">ERROR: {String(error)}</div>}

      <div className="panel flex-1 overflow-hidden">
        {tab === "events" && (
          <DataTable
            data={events?.data ?? []}
            columns={["event_id", "entity_id", "event_type", "event_source", "event_date", "country_code", "event_value", "currency"]}
            onRowClick={handleRow}
            maxHeight="calc(100vh - 280px)"
          />
        )}
        {tab === "rankings" && (
          <DataTable
            data={rankings?.data ?? []}
            columns={["entity_id", "official_name", "events_total", "procurement_value"]}
            onRowClick={handleRow}
            maxHeight="calc(100vh - 220px)"
          />
        )}
        {tab === "timeline" && (
          <div className="h-full overflow-auto">
            {timelineViewMode === "timeline" ? (
              <div className="pr-2 pl-1 py-2">
                {(timeline?.data ?? []).map((row, i) => (
                  <TimelineEvent key={i} row={row} index={i} />
                ))}
                {!tFetching && !(timeline?.data ?? []).length && (
                  <div className="text-center text-terminal-dim text-xs tracking-widest mt-12">
                    NO EVENTS FOUND
                  </div>
                )}
                {tFetching && (
                  <div className="text-center text-terminal-orange text-xs animate-pulse tracking-widest mt-12">
                    LOADING…
                  </div>
                )}
              </div>
            ) : (
              <DataTable data={timeline?.data ?? []} maxHeight="calc(100vh - 280px)" />
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <StatusBar loading={loading} message={`EVENTS${tab === "timeline" ? " · TIMELINE" : ""}`} />
        {tab === "events" && (
          <div className="flex items-center gap-2 pr-2">
            <button onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))} disabled={offset === 0}
              className="text-terminal-cyan disabled:opacity-30"><ChevronLeft size={16} /></button>
            <span className="text-xs text-terminal-secondary">{page}/{pages}</span>
            <button onClick={() => setOffset(offset + PAGE_SIZE)} disabled={offset + PAGE_SIZE >= total}
              className="text-terminal-cyan disabled:opacity-30"><ChevronRight size={16} /></button>
          </div>
        )}
      </div>
    </div>
  );
}
