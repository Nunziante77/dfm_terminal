"use client";
import { useEffect, useState } from "react";

interface Props {
  message?: string;
  loading?: boolean;
}

export default function StatusBar({ message, loading }: Props) {
  const [ts, setTs] = useState("");
  useEffect(() => {
    const fmt = () => setTs(new Date().toISOString().replace("T", " ").slice(0, 19));
    fmt();
    const id = setInterval(fmt, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer className="h-7 bg-terminal-panel border-t border-terminal-border flex items-center px-4 gap-4 text-[10px] shrink-0">
      <span
        className={`w-2 h-2 rounded-full ${loading ? "bg-terminal-orange animate-pulse" : "bg-terminal-green"}`}
      />
      <span className="text-terminal-secondary tracking-widest">
        {loading ? "LOADING…" : message ?? "READY"}
      </span>
      <div className="flex-1" />
      <span className="text-terminal-dim">{ts} UTC</span>
      <span className="text-terminal-dim">dfm_db_semantic</span>
      <span className="text-terminal-dim">PostgreSQL</span>
    </footer>
  );
}
