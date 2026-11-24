"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@/components/ui/icons";

const arrowClass =
  "glass text-ink hover:bg-accent-soft duration-hover inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors";

/**
 * The row under the ring (docs/DESIGN.md): ← · "Drag or use ← → to explore" · →.
 * Real buttons, so the ring works for people who cannot drag or use arrow keys.
 * "Open …" is for screen-reader and switch users: it appears when focused and does
 * what Enter or a click on the front panel does.
 */
export function RingControls({
  frontTitle,
  besidePanel,
  onPrevious,
  onNext,
  onOpen,
}: {
  frontTitle: string;
  /** True while the detail panel is open beside the ring (desktop). */
  besidePanel: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onOpen: () => void;
}) {
  return (
    <div
      // The open panel covers the right of the stage and the ring slides left; the
      // controls follow it so the panel never sits on top of the "next" button.
      className={`relative flex items-center justify-center gap-4 pt-2 transition-[padding] duration-panel ${besidePanel ? "lg:pr-[32rem]" : ""}`}
    >
      <button
        type="button"
        aria-label="Previous project"
        onClick={onPrevious}
        className={arrowClass}
      >
        <ArrowLeftIcon />
      </button>
      <p className="text-ink-dim text-center text-sm">Drag or use ← → to explore</p>
      <button type="button" aria-label="Next project" onClick={onNext} className={arrowClass}>
        <ArrowRightIcon />
      </button>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={onOpen}
        className="bg-accent text-on-accent sr-only rounded-full text-sm font-semibold focus:not-sr-only focus:absolute focus:top-full focus:mt-2 focus:px-4 focus:py-2"
      >
        Open {frontTitle}
      </button>
    </div>
  );
}
