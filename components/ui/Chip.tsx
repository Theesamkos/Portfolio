import type { ReactNode } from "react";

/**
 * Pills for labels (docs/DESIGN.md).
 *
 * - `outline`: skills and stack — plain text in a hairline pill.
 * - `live` / `video` / `coming-soon`: project status — a dot in the semantic color,
 *   mono text in its darker `-ink` shade on a soft fill, so the text passes AA.
 * - `muted`: PRIVATE / TEAM — a quiet outline.
 */

export type ChipTone = "outline" | "live" | "video" | "coming-soon" | "muted";

const base = "inline-flex shrink-0 items-center gap-1.5 rounded-full border whitespace-nowrap";
const readout = "tracking-readout px-2.5 py-0.5 font-mono text-xs uppercase";

const tones: Record<ChipTone, { chip: string; dot: string | null }> = {
  outline: { chip: "border-line bg-glass text-ink px-3 py-1 text-sm", dot: null },
  live: { chip: `${readout} bg-live-soft text-live-ink border-transparent`, dot: "bg-live" },
  video: { chip: `${readout} bg-accent-soft text-accent-ink border-transparent`, dot: "bg-accent" },
  "coming-soon": {
    chip: `${readout} bg-warn-soft text-warn-ink border-transparent`,
    dot: "bg-warn",
  },
  muted: { chip: `${readout} border-ink-dim text-ink-dim`, dot: null },
};

export function Chip({
  tone = "outline",
  as: Tag = "span",
  className = "",
  children,
}: {
  tone?: ChipTone;
  as?: "span" | "li";
  className?: string;
  children: ReactNode;
}) {
  const { chip, dot } = tones[tone];
  return (
    <Tag data-tone={tone} className={`${base} ${chip} ${className}`.trim()}>
      {dot ? <span aria-hidden="true" className={`size-2 rounded-full ${dot}`} /> : null}
      {children}
    </Tag>
  );
}
