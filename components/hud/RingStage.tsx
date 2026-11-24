"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { RingProject } from "@/components/scene/Ring";

/**
 * `next/dynamic` with `ssr: false` splits the 3D scene (three.js, R3F, drei) into its
 * own chunk that is requested only when <RingScene> first renders. The import is
 * `import type` above and a dynamic `import()` here, so nothing from
 * `components/scene` lands in the page's first-load JavaScript.
 */
const RingScene = dynamic(() => import("@/components/scene/RingScene"), { ssr: false });

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

  return load ? <RingScene projects={projects} /> : null;
}
