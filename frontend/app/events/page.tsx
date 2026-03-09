"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { listEvents, getEventsRankings } from "@/lib/api";
import type { ViewRow } from "@/lib/types";
import DataTable from "@/components/DataTable";
import StatusBar from "@/components/StatusBar";

const PAGE_SIZE = 100;
type Tab = "events" | "rankings";

export default function EventsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("events");
  const [offset, setOffset] = useState(0);
  const [eventType, setEventType] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [submitted, setSubmitted] = useState({ event_type: "", country_code: "" });

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

  const apply = () => { setSubmitted({ event_type: eventType, country_code: countryCode }); setOffset(0); };

  const loading = eFetching || rFetching;
  const error = eError || rError;
  const total = events?.total ?? 0;
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pages = Math.ceil(total / PAGE_SIZE) || 1;

  const handleRow = (row: ViewRow) => {
    if (row.entity_id) router.push(`/entities/${row.entity_id}`);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <Calendar size={16} className="text-terminal-cyan" />
        <h1 className="text-terminal-cyan text-sm font-bold tracking-widest">EVENTS</h1>
        <span className="text-terminal-dim text-xs">dfm_events_v1 · v_dfm_entity_events_rank_v1</span>
      </div>

      <div className="flex border-b border-terminal-border">
        {(["events", "rankings"] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); setOffset(0); }}
            className={`px-4 py-2 text-xs tracking-wider border-b-2 transition-colors ${
              tab === t ? "border-terminal-cyan text-terminal-cyan" : "border-transparent text-terminal-secondary hover:text-terminal-text"
            }`}>
            {t === "events" ? "ALL EVENTS" : "ENTITY RANKINGS"}
          </button>
        ))}
      </div>

      {tab === "events" && (
        <div className="panel p-3 flex flex-wrap gap-3 items-center">
          <input value={eventType} onChange={(e) => setEventType(e.target.value)} onKeyDown={(e) => e.key === "Enter" && apply()}
            placeholder="Event type…"
            className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-36 placeholder:text-terminal-dim" />
          <input value={countryCode} onChange={(e) => setCountryCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && apply()}
            placeholder="Country code…"
            className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-28 placeholder:text-terminal-dim" />
          <button onClick={apply} className="text-terminal-cyan text-xs hover:text-white">APPLY</button>
          <div className="flex-1" />
          <span className="text-terminal-secondary text-xs">{total.toLocaleString()} events</span>
        </div>
      )}

      {error && <div className="text-terminal-red text-xs panel px-4 py-3">ERROR: {String(error)}</div>}

      <div className="panel flex-1 overflow-hidden">
        {tab === "events" ? (
          <DataTable
            data={events?.data ?? []}
            columns={["event_id", "entity_id", "event_type", "event_source", "event_date", "country_code", "event_value", "currency"]}
            onRowClick={handleRow}
            maxHeight="calc(100vh - 260px)"
          />
        ) : (
          <DataTable
            data={rankings?.data ?? []}
            columns={["entity_id", "official_name", "events_total", "procurement_value"]}
            onRowClick={handleRow}
            maxHeight="calc(100vh - 220px)"
          />
        )}
      </div>

      <div className="flex items-center justify-between">
        <StatusBar loading={loading} message={`EVENTS`} />
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
