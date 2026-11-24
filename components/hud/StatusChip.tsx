import type { ProjectStatus, ProjectVisibility } from "@/lib/schema";

/** Chip colors per docs/DESIGN.md: LIVE green, VIDEO accent, COMING SOON amber (text in the -ink shades). */
const statusChips: Record<ProjectStatus, { label: string; className: string }> = {
  live: { label: "Live", className: "border-live text-live-ink" },
  video: { label: "Video", className: "border-accent text-accent-ink" },
  "coming-soon": { label: "Coming soon", className: "border-warn text-warn-ink" },
};

/** PRIVATE / TEAM get a quiet outline. Public is the default, so it gets no chip. */
const visibilityLabels: Record<ProjectVisibility, string | null> = {
  public: null,
  private: "Private",
  team: "Team",
};

const chip =
  "inline-flex shrink-0 items-center border px-2 py-0.5 font-mono text-xs tracking-readout whitespace-nowrap uppercase";

export function StatusChip({ status }: { status: ProjectStatus }) {
  const { label, className } = statusChips[status];
  return (
    <span className={`${chip} ${className}`}>
      <span className="sr-only">Status: </span>
      {label}
    </span>
  );
}

export function VisibilityChip({ visibility }: { visibility: ProjectVisibility }) {
  const label = visibilityLabels[visibility];
  if (!label) return null;
  return (
    <span className={`${chip} border-ink-dim text-ink-dim`}>
      <span className="sr-only">Source: </span>
      {label}
    </span>
  );
}
