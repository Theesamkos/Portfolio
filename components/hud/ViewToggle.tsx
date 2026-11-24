"use client";

import { Button } from "@/components/ui/Button";
import { ListIcon } from "@/components/ui/icons";
import { useUiStore } from "@/store/ui";

/**
 * The nav's "List view" control. Before the ring has loaded (or with JavaScript off)
 * it is a plain link to the project list. Once the ring is ready the same element
 * acts as a button that switches between the ring and the list, named for the view
 * it switches to.
 */
export function ViewToggle() {
  const ringReady = useUiStore((state) => state.ringReady);
  const viewMode = useUiStore((state) => state.viewMode);
  const setViewMode = useUiStore((state) => state.setViewMode);
  const focusProject = useUiStore((state) => state.focusProject);

  // Icon only under 360px, where the label would push the bar off-screen.
  const label = (text: string) => <span className="max-[359px]:sr-only">{text}</span>;

  // Always the same <a>: swapping it for a <button> when the ring loads would drop
  // keyboard focus if it was on this control. Before the ring is ready (and with
  // JavaScript off) it simply jumps to the list.
  return (
    <Button
      href="#projects"
      role={ringReady ? "button" : undefined}
      variant="secondary"
      icon={<ListIcon />}
      className="px-4"
      onClick={(event) => {
        if (!ringReady) return;
        event.preventDefault();
        // The panel opens differently in each view; close it before switching.
        focusProject(null);
        setViewMode(viewMode === "ring" ? "list" : "ring");
      }}
      onKeyDown={(event) => {
        // A button also answers to Space; a link does not.
        if (ringReady && event.key === " ") {
          event.preventDefault();
          event.currentTarget.click();
        }
      }}
    >
      {label(ringReady && viewMode === "list" ? "Ring view" : "List view")}
    </Button>
  );
}
