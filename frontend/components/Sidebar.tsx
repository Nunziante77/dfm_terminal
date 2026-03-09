"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  Search,
  BarChart2,
  GitBranch,
  Layers,
  ArrowLeftRight,
  ShoppingCart,
  Shield,
  Clock,
  Cpu,
  FlaskConical,
  FileText,
  BookOpen,
  Globe2,
  Calendar,
  Activity,
} from "lucide-react";

type NavSection = {
  section: string;
  items: { href: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }>; shortcut: string }[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    section: "CORE",
    items: [
      { href: "/",           label: "SEARCH",      icon: Search,        shortcut: "S" },
      { href: "/screener",   label: "SCREENER",    icon: BarChart2,     shortcut: "R" },
      { href: "/rankings",   label: "RANKINGS",    icon: Layers,        shortcut: "K" },
      { href: "/priorities", label: "PRIORITIES",  icon: Cpu,           shortcut: "P" },
      { href: "/graph",      label: "GRAPH",       icon: GitBranch,     shortcut: "G" },
      { href: "/compare",    label: "COMPARE",     icon: ArrowLeftRight,shortcut: "C" },
      { href: "/scenarios",  label: "SCENARIOS",   icon: Activity,      shortcut: "X" },
    ],
  },
  {
    section: "INTELLIGENCE",
    items: [
      { href: "/patents",    label: "PATENTS",     icon: FlaskConical,  shortcut: "A" },
      { href: "/research",   label: "RESEARCH",    icon: BookOpen,      shortcut: "H" },
      { href: "/procurement",label: "PROCUREMENT", icon: ShoppingCart,  shortcut: "O" },
      { href: "/ownership",  label: "OWNERSHIP",   icon: Globe2,        shortcut: "W" },
    ],
  },
  {
    section: "REGULATORY",
    items: [
      { href: "/normative",  label: "NORMATIVE",   icon: FileText,      shortcut: "N" },
      { href: "/strategic",  label: "STRATEGIC",   icon: Shield,        shortcut: "D" },
      { href: "/compliance", label: "COMPLIANCE",  icon: Shield,        shortcut: "L" },
    ],
  },
  {
    section: "TEMPORAL",
    items: [
      { href: "/events",     label: "EVENTS",      icon: Calendar,      shortcut: "V" },
      { href: "/timeline",   label: "TIMELINE",    icon: Clock,         shortcut: "T" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-48 min-h-screen bg-terminal-panel border-r border-terminal-border flex flex-col shrink-0 overflow-y-auto">
      {/* Logo */}
      <div className="px-4 py-3 border-b border-terminal-border shrink-0">
        <div className="text-terminal-cyan font-bold text-sm tracking-widest">DFM</div>
        <div className="text-terminal-secondary text-xs tracking-widest">TERMINAL</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-1">
        {NAV_SECTIONS.map(({ section, items }) => (
          <div key={section}>
            <div className="px-4 pt-3 pb-1 text-[9px] text-terminal-dim tracking-widest font-semibold">
              {section}
            </div>
            {items.map(({ href, label, icon: Icon, shortcut }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    "flex items-center gap-2 px-4 py-2 text-xs font-medium tracking-wider transition-colors",
                    active
                      ? "text-terminal-cyan bg-terminal-muted border-l-2 border-terminal-cyan"
                      : "text-terminal-secondary hover:text-terminal-text hover:bg-terminal-muted border-l-2 border-transparent"
                  )}
                >
                  <Icon size={12} className="shrink-0" />
                  <span className="flex-1 text-[11px]">{label}</span>
                  <kbd className="text-terminal-dim text-[9px] opacity-40">{shortcut}</kbd>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Version */}
      <div className="px-4 py-2 border-t border-terminal-border text-terminal-dim text-[9px] shrink-0">
        v1.1.0 · dfm_db_semantic
      </div>
    </aside>
  );
}
