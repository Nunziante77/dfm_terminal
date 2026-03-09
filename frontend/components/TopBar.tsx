"use client";
import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

export default function TopBar() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString("en-US", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="h-10 bg-terminal-panel border-b border-terminal-border flex items-center px-4 gap-4 shrink-0">
      {/* Brand */}
      <span className="text-terminal-cyan font-bold text-sm tracking-widest mr-2">
        DFM TERMINAL
      </span>
      <span className="text-terminal-dim text-xs">
        Strategic Intelligence Platform
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Status indicators */}
      <div className="flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5 text-terminal-green">
          <Activity size={11} />
          <span className="tracking-wider">LIVE</span>
        </span>
        <span className="text-terminal-secondary">{time}</span>
        <span className="text-terminal-dim">UTC</span>
      </div>
    </header>
  );
}
