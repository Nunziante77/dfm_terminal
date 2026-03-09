"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight, Plus, X } from "lucide-react";
import { compareEntities } from "@/lib/api";
import type { ViewRow } from "@/lib/types";
import StatusBar from "@/components/StatusBar";

function EntityColumn({ profile, ranking }: { profile: ViewRow; ranking: ViewRow | undefined }) {
  const rows = {
    ...profile,
    ...(ranking ?? {}),
  };
  const entityName = String(profile.official_name ?? profile.entity_id ?? "Entity");

  return (
    <div className="panel flex-1 min-w-48 overflow-auto">
      <div className="px-3 py-2 border-b border-terminal-border text-terminal-cyan text-xs font-bold tracking-wider">
        {entityName}
      </div>
      <div className="text-xs">
        {Object.entries(rows).map(([k, v]) => (
          <div key={k} className="flex border-b border-terminal-muted">
            <div className="px-3 py-1.5 text-terminal-secondary w-1/2 shrink-0 truncate">
              {k.replace(/_/g, " ")}
            </div>
            <div className={`px-3 py-1.5 text-terminal-text w-1/2 truncate ${
              typeof v === "number" && v > 0 ? "text-terminal-green" :
              typeof v === "number" && v < 0 ? "text-terminal-red" : ""
            }`}>
              {v === null || v === undefined ? "—" : String(v)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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

  const addInput = () => setInputs((prev) => [...prev, ""]);
  const removeInput = (i: number) =>
    setInputs((prev) => prev.filter((_, idx) => idx !== i));

  const rankingMap: Record<string, ViewRow> = {};
  data?.rankings.forEach((r) => {
    const id = String(r.entity_id ?? "");
    if (id) rankingMap[id] = r;
  });

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-3">
        <ArrowLeftRight size={16} className="text-terminal-cyan" />
        <h1 className="text-terminal-cyan text-sm font-bold tracking-widest">MULTI-ENTITY COMPARISON</h1>
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
              placeholder={`Entity ID ${i + 1}`}
              className="bg-terminal-muted border border-terminal-border text-terminal-text text-xs px-3 py-1.5 outline-none w-36 placeholder:text-terminal-dim"
            />
            {inputs.length > 2 && (
              <button onClick={() => removeInput(i)} className="text-terminal-dim hover:text-terminal-red">
                <X size={12} />
              </button>
            )}
          </div>
        ))}
        {inputs.length < 10 && (
          <button onClick={addInput} className="text-terminal-cyan hover:text-white">
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
      </div>

      {error && (
        <div className="text-terminal-red text-xs panel px-4 py-3">
          ERROR: {String(error)}
        </div>
      )}

      {/* Comparison columns */}
      {data && (
        <div className="flex gap-3 flex-1 overflow-auto">
          {data.profiles.map((profile) => {
            const id = String(profile.entity_id ?? "");
            return (
              <EntityColumn
                key={id}
                profile={profile}
                ranking={rankingMap[id]}
              />
            );
          })}
        </div>
      )}

      {!data && !isFetching && (
        <div className="flex-1 flex items-center justify-center text-terminal-dim text-xs tracking-widest">
          ENTER ENTITY IDs TO COMPARE
        </div>
      )}

      <StatusBar loading={isFetching} message="COMPARE" />
    </div>
  );
}
