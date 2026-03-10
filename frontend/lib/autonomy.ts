/**
 * Autonomy flag constants — verified from live v_dfm_pr_autonomy_gap_flags_v1
 * Actual values: EU_COVERAGE_OK | EU_COVERAGE_LOW | EU_COVERAGE_ZERO
 */
export const AUTONOMY_FLAG_LABELS: Record<string, string> = {
  EU_COVERAGE_OK:   "EU Sufficient",
  EU_COVERAGE_LOW:  "EU Partial",
  EU_COVERAGE_ZERO: "No EU Coverage",
};

/** Maps a raw autonomy_flag code to its human-readable label. */
export function formatAutonomyFlag(raw: unknown): string {
  const v = String(raw ?? "").trim().toUpperCase();
  return AUTONOMY_FLAG_LABELS[v] ?? (v || "—");
}

/** True when the flag indicates a concerning autonomy state. */
export function autonomyFlagIsWarn(raw: unknown): boolean {
  const v = String(raw ?? "").trim().toUpperCase();
  return v === "EU_COVERAGE_ZERO" || v === "EU_COVERAGE_LOW";
}
