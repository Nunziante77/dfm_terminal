"use client";
import { useState } from "react";
import type { ViewRow } from "@/lib/types";

interface Props {
  data: ViewRow[];
  columns?: string[];           // explicit column order; auto-detected if omitted
  onRowClick?: (row: ViewRow) => void;
  maxHeight?: string;
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "YES" : "NO";
  if (typeof value === "number") {
    return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(2);
  }
  return String(value);
}

function cellClass(value: unknown): string {
  if (typeof value === "number") {
    if (value > 0) return "text-terminal-green";
    if (value < 0) return "text-terminal-red";
  }
  return "";
}

export default function DataTable({ data, columns, onRowClick, maxHeight = "calc(100vh - 200px)" }: Props) {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-32 text-terminal-dim text-xs tracking-widest">
        NO DATA
      </div>
    );
  }

  const cols = columns ?? Object.keys(data[0]);

  const sorted = sortCol
    ? [...data].sort((a, b) => {
        const av = a[sortCol] ?? "";
        const bv = b[sortCol] ?? "";
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortDir === "asc" ? cmp : -cmp;
      })
    : data;

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
  };

  return (
    <div className="overflow-auto" style={{ maxHeight }}>
      <table className="dfm-table">
        <thead>
          <tr>
            {cols.map((col) => (
              <th
                key={col}
                onClick={() => handleSort(col)}
                className="cursor-pointer select-none whitespace-nowrap"
              >
                {col.replace(/_/g, " ")}
                {sortCol === col && (
                  <span className="ml-1 text-terminal-orange">
                    {sortDir === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={i}
              onClick={() => onRowClick?.(row)}
              className={onRowClick ? "cursor-pointer" : ""}
            >
              {cols.map((col) => (
                <td key={col} className={`whitespace-nowrap ${cellClass(row[col])}`}>
                  {formatCell(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
