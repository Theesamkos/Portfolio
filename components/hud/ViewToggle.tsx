"use client";

import { Button } from "@/components/ui/Button";
import { ListIcon } from "@/components/ui/icons";
import { useUiStore } from "@/store/ui";

/**
 * The nav's "List view" control. Before the ring has loaded (or with JavaScript off)
 * it is a plain link to the project list. Once the ring is ready it becomes a button
 * that switches between the ring and the list, named for the view it switches to.
 */
export function ViewToggle() {
  const ringReady = useUiStore((state) => state.ringReady);
  const viewMode = useUiStore((state) => state.viewMode);
  const setViewMode = useUiStore((state) => state.setViewMode);
  const focusProject = useUiStore((state) => state.focusProject);

  // Icon only under 360px, where the label would push the bar off-screen.
  const label = (text: string) => <span className="max-[359px]:sr-only">{text}</span>;

  if (!ringReady) {
    return (
      <Button href="#projects" variant="secondary" icon={<ListIcon />} className="px-4">
        {label("List view")}
      </Button>
    );
  }

  return (
    <Button
      variant="secondary"
      icon={<ListIcon />}
      className="px-4"
      onClick={() => {
        // The panel opens differently in each view; close it before switching.
        focusProject(null);
        setViewMode(viewMode === "ring" ? "list" : "ring");
      }}
    >
      {label(viewMode === "ring" ? "List view" : "Ring view")}
    </Button>
  );
}
