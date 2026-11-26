"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useState, type ReactNode } from "react";
import type { RingProject } from "@/components/scene/Ring";
import { isSoftwareRenderer, type WebGLSupport } from "@/lib/webgl";
import { useUiStore } from "@/store/ui";

/**
 * `next/dynamic` with `ssr: false` splits the 3D scene (three.js, R3F, drei) into its
 * own chunk that is requested only when <RingScene> first renders. The import is
 * `import type` above and a dynamic `import()` here, so nothing from
 * `components/scene` lands in the page's first-load JavaScript.
 */
/**
 * Both lines sit in the hero's bottom padding, out of the flow: the list below never
 * moves when one appears or goes (no layout shift).
 */
const noteClass =
  "tracking-readout text-ink-dim absolute -top-9 right-0 flex items-center gap-2 font-mono text-xs uppercase";

/** The list is the page, and stays: say why there is no ring, once, quietly. */
function RingUnavailable() {
  return (
    <p role="status" data-ring-note="unavailable" className={noteClass}>
      3D view isn&apos;t available here — showing the list
    </p>
  );
}

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
 * "Loading 3D view" while the scene's chunk downloads and its first frame is drawn.
 * A cue for the eyes only (`aria-hidden`): the list is already there to be read, and
 * announcing a load on every visit would just be noise for a screen reader.
 */
function RingLoading() {
  const ringReady = useUiStore((state) => state.ringReady);
  if (ringReady) return null;
  return (
    <p
      aria-hidden="true"
      data-ring-note="loading"
      // If the chunk fails, the note that replaces the scene is this line's next
      // sibling; nothing is loading any more, so it steps aside.
      className={`${noteClass} has-[+[data-ring-note=unavailable]]:hidden`}
    >
      <span className="bg-accent size-1.5 animate-pulse rounded-full" />
      Loading 3D view
    </p>
  );
}

/**
 * Loads the ring after first paint. Until then — and for good if there is no WebGL,
 * no JavaScript, or the URL says `?view=list` — the server-rendered list below is the
 * page. While the scene loads a small "Loading 3D view" line shows; without WebGL, or
 * if the scene fails, a note says the list is what there is.
 *
 * Keep this file tiny: it is the only ring code in the first load (AGENTS.md:
 * JS before 3D < 150 KB).
 */
export function RingStage({ projects }: { projects: readonly RingProject[] }) {
  const [support, setSupport] = useState<WebGLSupport | null>(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("view") === "list") return;
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

  if (support === null) return null;
  if (support === "none") return <RingUnavailable />;
  return (
    <RingBoundary>
      <RingLoading />
      <RingScene projects={projects} software={support === "software"} />
    </RingBoundary>
  );
}
