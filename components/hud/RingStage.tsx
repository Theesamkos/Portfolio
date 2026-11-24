"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useState, type ReactNode } from "react";
import type { RingProject } from "@/components/scene/Ring";

/**
 * `next/dynamic` with `ssr: false` splits the 3D scene (three.js, R3F, drei) into its
 * own chunk that is requested only when <RingScene> first renders. The import is
 * `import type` above and a dynamic `import()` here, so nothing from
 * `components/scene` lands in the page's first-load JavaScript.
 */
const RingScene = dynamic(
  // A chunk that fails to download (flaky network, a deploy that replaced it) must
  // not take the page down: resolve to nothing and the list stays.
  () => import("@/components/scene/RingScene").catch(() => ({ default: () => null })),
  { ssr: false },
);

/**
 * Anything the 3D scene throws stops here. Without this an error in the lazy chunk
 * would reach Next's root error screen and replace the whole page, list included.
 * Rendering nothing unmounts the scene, whose cleanup switches back to the list.
 * (Error boundaries are still class components — there is no hook for this.)
 */
class RingBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function hasWebGL(): boolean {
  try {
    const context = document.createElement("canvas").getContext("webgl2");
    if (!context) return false;
    // Give the test context back; browsers cap how many a page may hold.
    context.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/**
 * Loads the ring after first paint. Until then — and for good if there is no WebGL,
 * no JavaScript, or the URL says `?view=list` — this renders nothing and the
 * server-rendered list below is the page.
 *
 * Keep this file tiny: it is the only ring code in the first load (AGENTS.md:
 * JS before 3D < 150 KB).
 */
export function RingStage({ projects }: { projects: readonly RingProject[] }) {
  const [load, setLoad] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("view") === "list") return;
    const start = () => {
      if (hasWebGL()) setLoad(true);
    };
    // Wait until the browser is idle so the hero paints and becomes interactive first.
    // Safari has no requestIdleCallback; a short timeout does the same job.
    if (typeof window.requestIdleCallback === "function") {
      const handle = window.requestIdleCallback(start, { timeout: 1500 });
      return () => window.cancelIdleCallback(handle);
    }
    const handle = window.setTimeout(start, 200);
    return () => window.clearTimeout(handle);
  }, []);

  return load ? (
    <RingBoundary>
      <RingScene projects={projects} />
    </RingBoundary>
  ) : null;
}
