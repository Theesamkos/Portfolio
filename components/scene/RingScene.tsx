"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { indexAfterDrag } from "@/lib/ring";
import { projectPosition } from "@/lib/project-position";
import { useUiStore, type Tier } from "@/store/ui";
import { runRingAction, runRingKey } from "./actions";
import { useMediaQuery, usePageVisible } from "./hooks";
import { ringInput, ringLabels } from "./input";
import { COMPACT_LAYOUT, FULL_LAYOUT, LABEL_WIDTH_PX } from "./layout";
import { Renderer } from "./Renderer";
import type { RingProject } from "./Ring";
import { RingControls } from "./RingControls";
import { Scene } from "./Scene";
import { TierReadout } from "./TierReadout";
import { readSceneTokens } from "./tokens";

/** Matches Tailwind's `lg` and the detail panel: full ring from here, carousel below. */
const DESKTOP = "(min-width: 1024px)";
const INTRO_KEY = "ring-intro-seen";

/** `?tier=low|medium|high` pins the effects tier — for testing and measuring. */
function tierFromUrl(): Tier | null {
  const value = new URLSearchParams(window.location.search).get("tier");
  return value === "high" || value === "medium" || value === "low" ? value : null;
}

/** The intro plays once per browser; storage can be blocked, and then it just plays. */
function introSeen(): boolean {
  try {
    return window.localStorage.getItem(INTRO_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * The ring stage: the canvas, its keyboard / drag / wheel handling, the controls
 * under it and the live region. This file is the root of the lazy 3D chunk —
 * `components/hud/RingStage.tsx` imports it with `next/dynamic` after first paint,
 * so none of three.js is in the page's first load.
 *
 * Mounting it switches the site to ring view; the server-rendered list stays in the
 * DOM, hidden by CSS (`html[data-view="ring"]`), and comes back with "List view".
 */
export default function RingScene({ projects }: { projects: readonly RingProject[] }) {
  const viewMode = useUiStore((state) => state.viewMode);
  const frontProjectId = useUiStore((state) => state.frontProjectId);
  const panelOpen = useUiStore((state) => state.activeProjectId !== null);
  const desktop = useMediaQuery(DESKTOP);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const pageVisible = usePageVisible();
  const [onScreen, setOnScreen] = useState(true);
  const [announcement, setAnnouncement] = useState("");
  const [tokens] = useState(readSceneTokens);
  const [setup] = useState(() => ({ pinnedTier: tierFromUrl(), skipIntro: introSeen() }));
  const stage = useRef<HTMLDivElement>(null);

  const count = projects.length;
  const frontIndex = Math.max(
    0,
    projects.findIndex((project) => project.id === frontProjectId),
  );
  const front = projects[frontIndex];
  const layout = desktop ? FULL_LAYOUT : COMPACT_LAYOUT;
  const showing = viewMode === "ring";

  // Mounted = the ring works: switch to it, and hand the list back on unmount.
  useEffect(() => {
    const store = useUiStore.getState();
    const first = projects[0];
    if (store.frontProjectId === null && first) store.setFrontProject(first.id);
    store.setRingReady(true);
    store.setViewMode("ring");
    try {
      window.localStorage.setItem(INTRO_KEY, "1");
    } catch {
      // Storage blocked: the intro plays again next time.
    }
    return () => {
      const { setRingReady, setViewMode } = useUiStore.getState();
      setRingReady(false);
      setViewMode("list");
    };
  }, [projects]);

  // Small screens start one tier down, with the reflective floor off (docs/DESIGN.md).
  useEffect(() => {
    useUiStore.getState().setTier(setup.pinnedTier ?? (desktop ? "high" : "medium"));
  }, [desktop, setup.pinnedTier]);

  // The list is hidden with CSS keyed on this attribute, so it needs no client code.
  useEffect(() => {
    document.documentElement.dataset.view = viewMode;
    return () => {
      delete document.documentElement.dataset.view;
    };
  }, [viewMode]);

  // Announce the front project when it changes — but not the first one on load.
  useEffect(
    () =>
      useUiStore.subscribe((state, previous) => {
        if (state.frontProjectId === previous.frontProjectId || previous.frontProjectId === null) {
          return;
        }
        const index = projects.findIndex((project) => project.id === state.frontProjectId);
        const project = projects[index];
        if (project) setAnnouncement(`${project.title}, project ${index + 1} of ${count}`);
      }),
    [projects, count],
  );

  // Don't render frames nobody can see.
  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry) setOnScreen(entry.isIntersecting);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const ids = useMemo(() => projects.map((project) => project.id), [projects]);

  // A horizontal wheel or trackpad swipe turns the ring. Vertical scrolling is left
  // alone so the page never gets stuck on the ring. The listener must be non-passive
  // to call preventDefault, which React's onWheel is not.
  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    let travelled = 0;
    let lastStep = 0;
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      travelled += event.deltaX;
      const now = performance.now();
      if (Math.abs(travelled) < 60 || now - lastStep < 350) return;
      runRingAction(travelled > 0 ? "next" : "prev", ids);
      travelled = 0;
      lastStep = now;
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [ids]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (runRingKey(event.key, ids)) event.preventDefault();
  };

  // Drag and swipe: while the pointer is down the ring follows it; on release it
  // snaps to the nearest panel. The values go into `ringInput`, which the render
  // loop reads — no state, so no re-render per pointer move.
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const startX = event.clientX;
    const width = Math.max(1, event.currentTarget.clientWidth);
    const startIndex = frontIndex;
    // Full ring: dragging across the stage turns it about a third of the way round.
    // Carousel: under half the width moves one panel.
    const perPixel = (layout.compact ? Math.PI / 4 / 0.45 : Math.PI * 0.7) / width;
    ringInput.anchor = ringInput.rotation;
    ringInput.drag = 0;

    const onMove = (move: globalThis.PointerEvent) => {
      const distance = move.clientX - startX;
      if (!ringInput.dragging && Math.abs(distance) < 6) return;
      ringInput.dragging = true;
      ringInput.drag = distance * perPixel;
    };
    const onEnd = (end: globalThis.PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
      if (!ringInput.dragging) return;
      const index = indexAfterDrag(
        startIndex,
        ringInput.anchor + ringInput.drag,
        end.clientX - startX,
        count,
      );
      ringInput.dragging = false;
      ringInput.drag = 0;
      const target = projects[index];
      if (target) useUiStore.getState().setFrontProject(target.id);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured projects ring"
      hidden={!showing}
      className="relative isolate pb-10"
    >
      <div
        ref={stage}
        role="group"
        tabIndex={0}
        aria-label={`3D ring of ${count} projects. ${front?.title ?? ""} is in front. Left and right arrow keys turn the ring, Enter opens the project.`}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        className="ring-stage rounded-sheet relative h-88 cursor-grab lg:h-[clamp(20rem,58svh,34rem)] touch-pan-y -outline-offset-2 active:cursor-grabbing"
      >
        <Renderer
          running={showing && onScreen && pageVisible}
          ceiling={desktop ? "high" : "medium"}
          pinned={setup.pinnedTier !== null}
        >
          <Scene
            projects={projects}
            layout={layout}
            tokens={tokens}
            reducedMotion={reducedMotion}
            skipIntro={setup.skipIntro}
          />
        </Renderer>
        {/* The panels' text: real DOM, laid over the canvas and moved by the render
            loop (ProjectPanel). Hidden from assistive tech — the live region and the
            controls below say the same thing in order. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {projects.map((project, index) => (
            <div
              key={project.id}
              ref={(node) => {
                ringLabels[index] = node;
              }}
              className="text-ink absolute top-0 left-0 flex origin-top-left flex-col justify-between p-5 opacity-0 select-none"
              style={{
                width: LABEL_WIDTH_PX,
                height: (LABEL_WIDTH_PX * layout.panelHeight) / layout.panelWidth,
              }}
            >
              <span className="tracking-readout text-ink-dim font-mono text-sm">
                {projectPosition(project.order, count)}
              </span>
              <span className="text-xl leading-tight font-bold">{project.title}</span>
            </div>
          ))}
        </div>
        {process.env.NODE_ENV === "development" ? <TierReadout /> : null}
      </div>

      <RingControls
        frontTitle={front?.title ?? ""}
        besidePanel={panelOpen && desktop}
        onPrevious={() => runRingAction("prev", ids)}
        onNext={() => runRingAction("next", ids)}
        onOpen={() => runRingAction("select", ids)}
      />

      <p role="status" className="sr-only">
        {announcement}
      </p>
    </section>
  );
}
