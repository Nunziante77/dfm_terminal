"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  Search,
  Building2,
  BarChart2,
  GitBranch,
  Layers,
  ArrowLeftRight,
  ShoppingCart,
  Shield,
  Clock,
  Cpu,
} from "lucide-react";

const NAV = [
  { href: "/",             label: "SEARCH",       icon: Search,         shortcut: "S" },
  { href: "/screener",     label: "SCREENER",      icon: BarChart2,      shortcut: "R" },
  { href: "/rankings",     label: "RANKINGS",      icon: Layers,         shortcut: "K" },
  { href: "/priorities",   label: "PRIORITIES",    icon: Cpu,            shortcut: "P" },
  { href: "/graph",        label: "GRAPH",         icon: GitBranch,      shortcut: "G" },
  { href: "/compare",      label: "COMPARE",       icon: ArrowLeftRight, shortcut: "C" },
  { href: "/procurement",  label: "PROCUREMENT",   icon: ShoppingCart,   shortcut: "O" },
  { href: "/compliance",   label: "COMPLIANCE",    icon: Shield,         shortcut: "L" },
  { href: "/timeline",     label: "TIMELINE",      icon: Clock,          shortcut: "T" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-48 min-h-screen bg-terminal-panel border-r border-terminal-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-terminal-border">
        <div className="text-terminal-cyan font-bold text-sm tracking-widest">DFM</div>
        <div className="text-terminal-secondary text-xs tracking-widest">TERMINAL</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2">
        {NAV.map(({ href, label, icon: Icon, shortcut }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium tracking-wider transition-colors",
                active
                  ? "text-terminal-cyan bg-terminal-muted border-l-2 border-terminal-cyan"
                  : "text-terminal-secondary hover:text-terminal-text hover:bg-terminal-muted border-l-2 border-transparent"
              )}
            >
              <Icon size={13} className="shrink-0" />
              <span className="flex-1">{label}</span>
              <kbd className="text-terminal-dim text-[9px] opacity-50">{shortcut}</kbd>
            </Link>
          );
        })}
      </nav>

      {/* Version */}
      <div className="px-4 py-3 border-t border-terminal-border text-terminal-dim text-[10px]">
        v1.0.0 · dfm_db_semantic
      </div>
    </aside>
  );
}
