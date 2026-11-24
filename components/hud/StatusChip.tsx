import { Chip, type ChipTone } from "@/components/ui/Chip";
import type { ProjectStatus, ProjectVisibility } from "@/lib/schema";

/** Status colors per docs/DESIGN.md: LIVE green, VIDEO accent, COMING SOON amber. */
const statusChips: Record<ProjectStatus, { label: string; tone: ChipTone }> = {
  live: { label: "Live", tone: "live" },
  video: { label: "Video", tone: "video" },
  "coming-soon": { label: "Coming soon", tone: "coming-soon" },
};

/** PRIVATE / TEAM get a quiet outline. Public is the default, so it gets no chip. */
const visibilityLabels: Record<ProjectVisibility, string | null> = {
  public: null,
  private: "Private",
  team: "Team",
};

export function StatusChip({ status }: { status: ProjectStatus }) {
  const { label, tone } = statusChips[status];
  return (
    <Chip tone={tone}>
      <span className="sr-only">Status: </span>
      {label}
    </Chip>
  );
}

export function VisibilityChip({ visibility }: { visibility: ProjectVisibility }) {
  const label = visibilityLabels[visibility];
  if (!label) return null;
  return (
    <Chip tone="muted">
      <span className="sr-only">Source: </span>
      {label}
    </Chip>
  );
}
