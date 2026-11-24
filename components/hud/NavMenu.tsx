"use client";

import type { ReactNode } from "react";

/**
 * The mobile menu surface. It is a native popover (`popover="auto"`), so the menu
 * button opens it and a tap outside or Esc closes it with no JavaScript at all.
 * The one thing HTML cannot do is close it after a link inside is followed — that
 * is all this client component adds.
 */
export function NavMenu({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div
      id={id}
      popover="auto"
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest("a")) {
          event.currentTarget.hidePopover();
        }
      }}
      className="glass-strong glass-blur rounded-panel text-ink fixed inset-auto top-20 right-4 m-0 w-64 p-3"
    >
      {children}
    </div>
  );
}
