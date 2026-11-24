"use client";

import { ArrowRightIcon } from "@/components/ui/icons";
import type { ProjectId } from "@/content/projects";
import { useUiStore } from "@/store/ui";

/**
 * Opens a project in the detail panel. It dispatches `focusProject` — the same store
 * action the ring and the AI guide use — so every way of selecting a project agrees.
 *
 * The `::after` layer stretches the button over the whole card, so a click anywhere
 * on the card opens the panel while the card stays one real button for keyboard and
 * screen-reader users. Links and body copy inside the card sit above it
 * (`relative z-10`), so links stay clickable and text stays selectable.
 *
 * With JavaScript off the button cannot do anything, so `scripting: none` hides it;
 * the card already shows everything the panel would.
 */
export function ProjectCardTrigger({ id, title }: { id: ProjectId; title: string }) {
  const focusProject = useUiStore((state) => state.focusProject);

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-label={`Details: ${title}`}
      onClick={(event) => {
        // Safari does not focus a button on click; the panel returns focus here on close.
        event.currentTarget.focus();
        focusProject(id);
      }}
      className="text-accent-ink after:rounded-panel duration-hover inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-sm font-semibold underline-offset-4 transition-colors after:absolute after:inset-0 hover:underline [@media(scripting:none)]:hidden"
    >
      Details
      <ArrowRightIcon className="size-4" />
    </button>
  );
}
