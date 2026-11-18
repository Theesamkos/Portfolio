import type { ProjectStatus, ProjectVisibility } from "@/lib/schema";

/** Chip colors per docs/DESIGN.md: LIVE accent, VIDEO accent-2, COMING SOON warn. */
const statusChips: Record<ProjectStatus, { label: string; className: string }> = {
  live: { label: "Live", className: "border-accent text-accent" },
  video: { label: "Video", className: "border-accent-2 text-accent-2" },
  "coming-soon": { label: "Coming soon", className: "border-warn text-warn" },
};

/** PRIVATE / TEAM get a quiet outline. Public is the default, so it gets no chip. */
const visibilityLabels: Record<ProjectVisibility, string | null> = {
  public: null,
  private: "Private",
  team: "Team",
};

const chip =
  "inline-flex items-center border px-2 py-0.5 font-mono text-xs tracking-readout uppercase";

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
