"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import type { RingProject } from "@/components/scene/Ring";
import { Button } from "@/components/ui/Button";
import { isSoftwareRenderer, type WebGLSupport } from "@/lib/webgl";
import { useUiStore } from "@/store/ui";

/**
 * The slot's height: exactly what the ring takes once it is drawn — the stage
 * (`h-72`, or `clamp(18rem, 50svh, 30rem)` from 1024px) plus the 4.75rem of controls
 * and padding under it (RingScene.tsx). Change one, change the other; e2e compares them.
 */
const SLOT_HEIGHT = "min-h-91 lg:min-h-[calc(clamp(18rem,50svh,30rem)+4.75rem)]";

const noteClass =
  "tracking-readout text-ink-dim flex items-center gap-2 font-mono text-xs uppercase";

/**
 * The list is the page, and stays: say why there is no ring, once, quietly. The slot
 * collapses around this note (see `RingStage`), so it is an ordinary line above the list.
 */
function RingUnavailable() {
  return (
    <p role="status" data-ring-note="unavailable" className={`${noteClass} justify-end pb-2`}>
      3D view isn&apos;t available here
      {/* One line on a phone; the rest is still read out. */}
      <span className="max-sm:sr-only">— showing the list</span>
    </p>
  );
}

/**
 * `next/dynamic` with `ssr: false` splits the 3D scene (three.js, R3F, drei) into its
 * own chunk that is requested only when <RingScene> first renders. The import is
 * `import type` above and a dynamic `import()` here, so nothing from
 * `components/scene` lands in the page's first-load JavaScript.
 */
const RingScene = dynamic(
  // A chunk that fails to download (flaky network, a deploy that replaced it) must
  // not take the page down: the list stays, with a note in the scene's place.
  () => import("@/components/scene/RingScene").catch(() => ({ default: RingUnavailable })),
  { ssr: false },
);

/**
 * Anything the 3D scene throws stops here. Without this an error in the lazy chunk
 * would reach Next's root error screen and replace the whole page, list included.
 * Rendering the note instead unmounts the scene, whose cleanup switches back to the list.
 * (Error boundaries are still class components — there is no hook for this.)
 */
class RingBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <RingUnavailable /> : this.props.children;
  }
}

/**
 * Asks the browser for a WebGL context and what draws it. Browsers that mask the
 * renderer name expose the real one through the `WEBGL_debug_renderer_info`
 * extension; Firefox has retired that extension and returns it from `RENDERER`.
 */
function probeWebGL(): WebGLSupport {
  try {
    const context = document.createElement("canvas").getContext("webgl2");
    if (!context) return "none";
    const info = context.getExtension("WEBGL_debug_renderer_info");
    const renderer: unknown = context.getParameter(
      info ? info.UNMASKED_RENDERER_WEBGL : context.RENDERER,
    );
    // Give the test context back; browsers cap how many a page may hold.
    context.getExtension("WEBGL_lose_context")?.loseContext();
    return typeof renderer === "string" && isSoftwareRenderer(renderer) ? "software" : "gpu";
  } catch {
    return "none";
  }
}

/**
 * What the reserved slot shows while there is no ring in it.
 * - Loading: "Loading 3D view", a cue for the eyes only (`aria-hidden`) — the list is
 *   already there to be read, and announcing a load on every visit would be noise.
 * - Ready, but the visitor was already reading the list when the scene arrived, so
 *   the page was left alone: a button that brings the ring in when they want it.
 */
function RingPending() {
  const ringReady = useUiStore((state) => state.ringReady);
  const viewMode = useUiStore((state) => state.viewMode);
  const setViewMode = useUiStore((state) => state.setViewMode);
  if (ringReady && viewMode === "ring") return null;
  if (ringReady) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <Button variant="secondary" onClick={() => setViewMode("ring")}>
          Show the 3D ring
        </Button>
      </div>
    );
  }
  return (
    <p
      aria-hidden="true"
      data-ring-note="loading"
      // If the chunk fails, the note that replaces the scene is this line's next
      // sibling; nothing is loading any more, so it steps aside.
      className={`${noteClass} absolute top-2 right-0 has-[+[data-ring-note=unavailable]]:hidden`}
    >
      <span className="bg-accent size-1.5 animate-pulse rounded-full" />
      Loading 3D view
    </p>
  );
}

const listRequested = () => new URLSearchParams(window.location.search).get("view") === "list";
/** The query string does not change under a mounted page, so there is nothing to listen to. */
const subscribeToNothing = () => () => {};

/**
 * The ring's slot, and the loader that fills it after first paint.
 *
 * The slot is in the server's HTML at the ring's final height, with the list below
 * it. When the scene is ready it appears inside the slot and the list fades out
 * underneath: nothing on screen changes position, so there is no layout shift. (It
 * used to mount at zero height and push the page around when it took the list's place.)
 *
 * The slot gives its space back only when there will be no ring: JavaScript off
 * (CSS), `?view=list`, no WebGL, a scene that failed (CSS: it holds the "not
 * available" note), or the visitor choosing "List view".
 *
 * Keep this file small: it is the only ring code in the first load (AGENTS.md:
 * JS before 3D < 150 KB).
 */
export function RingStage({ projects }: { projects: readonly RingProject[] }) {
  const [support, setSupport] = useState<WebGLSupport | null>(null);
  // `?view=list`: the ring is never loaded. The server cannot see the query string
  // (the page is static), so it renders the slot and the browser takes it back while
  // hydrating, before the first paint — which an effect and state would miss.
  const skipped = useSyncExternalStore(subscribeToNothing, listRequested, () => false);
  /** The visitor switched from the ring to the list (or the scene handed the page back). */
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (listRequested()) return;
    const start = () => setSupport(probeWebGL());
    // Wait until the browser is idle so the hero paints and becomes interactive first.
    // Safari has no requestIdleCallback; a short timeout does the same job.
    if (typeof window.requestIdleCallback === "function") {
      const handle = window.requestIdleCallback(start, { timeout: 1500 });
      return () => window.cancelIdleCallback(handle);
    }
    const handle = window.setTimeout(start, 200);
    return () => window.clearTimeout(handle);
  }, []);

  // Leaving the ring for the list frees the slot; coming back takes it again.
  useEffect(
    () =>
      useUiStore.subscribe((state, previous) => {
        if (state.viewMode !== previous.viewMode) setDismissed(state.viewMode === "list");
      }),
    [],
  );

  const reserved = !skipped && !dismissed && support !== "none";

  return (
    <div
      data-ring-slot
      className={`relative has-[[data-ring-note=unavailable]]:min-h-0 [@media(scripting:none)]:hidden ${reserved ? SLOT_HEIGHT : ""}`}
    >
      {support === "none" ? <RingUnavailable /> : null}
      {support === "gpu" || support === "software" ? (
        <RingBoundary>
          <RingPending />
          <RingScene projects={projects} software={support === "software"} />
        </RingBoundary>
      ) : null}
    </div>
  );
}
