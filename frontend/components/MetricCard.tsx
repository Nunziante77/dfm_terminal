import clsx from "clsx";

interface Props {
  label: string;
  value: string | number | null | undefined;
  unit?: string;
  trend?: "up" | "down" | "neutral";
  highlight?: boolean;
  className?: string;
}

export default function MetricCard({ label, value, unit, trend, highlight, className }: Props) {
  const display = value === null || value === undefined ? "—" : String(value);
  const trendColor =
    trend === "up"   ? "text-terminal-green" :
    trend === "down" ? "text-terminal-red"   : "text-terminal-secondary";

  return (
    <div className={clsx("panel p-4 flex flex-col gap-1", className)}>
      <span className="text-[10px] text-terminal-secondary tracking-widest uppercase">
        {label}
      </span>
      <span
        className={clsx(
          "text-xl font-bold font-mono",
          highlight ? "text-terminal-cyan glow-cyan" : "text-terminal-text",
          trendColor
        )}
      >
        {display}
        {unit && <span className="text-sm font-normal text-terminal-dim ml-1">{unit}</span>}
      </span>
    </div>
  );
}
