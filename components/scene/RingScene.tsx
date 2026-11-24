"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { indexAfterDrag } from "@/lib/ring";
import { projectPosition } from "@/lib/project-position";
import { useUiStore, type Tier } from "@/store/ui";
import { runRingAction, runRingKey } from "./actions";
import { useMediaQuery, usePageVisible } from "./hooks";
import { ringInput, ringLabels } from "./input";
import { COMPACT_LAYOUT, FULL_LAYOUT } from "./layout";
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
 * Once the first frame is ready it switches the site to ring view; the
 * server-rendered list stays in the DOM, hidden by CSS (`html[data-view="ring"]`),
 * and comes back with "List view", on an error, or if the WebGL context is lost.
 */
export default function RingScene({ projects }: { projects: readonly RingProject[] }) {
  const viewMode = useUiStore((state) => state.viewMode);
  const frontProjectId = useUiStore((state) => state.frontProjectId);
  const panelOpen = useUiStore((state) => state.activeProjectId !== null);
  const desktop = useMediaQuery(DESKTOP);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const pageVisible = usePageVisible();
  const [onScreen, setOnScreen] = useState(true);
  // False until the WebGL context exists. Until then the stage is laid out but
  // invisible and out of the flow, so the list stays put while the scene warms up.
  const [created, setCreated] = useState(false);
  const captionId = useId();
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

  // On mount: pick the first project. On unmount (including after an error caught by
  // RingStage's boundary): hand the page back to the list.
  useEffect(() => {
    const store = useUiStore.getState();
    const first = projects[0];
    if (store.frontProjectId === null && first) store.setFrontProject(first.id);
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

  // The scene can draw: offer the ring, and switch to it — unless the visitor is
  // already using the list. On a slow connection the 3D chunk can arrive seconds
  // after they started reading; swapping the page under them then would lose their
  // place. In that case the nav button offers "Ring view" instead.
  const onReady = () => {
    const store = useUiStore.getState();
    const active = document.activeElement;
    const engaged =
      window.scrollY > window.innerHeight / 2 ||
      store.activeProjectId !== null ||
      Boolean(active?.closest("[data-project-list]"));
    store.setRingReady(true);
    if (!engaged) store.setViewMode("ring");
    setCreated(true);
  };

  // A lost WebGL context leaves an empty canvas (phones drop contexts for background
  // tabs). Show the list until the browser gives the context back.
  const onContextLost = () => {
    const store = useUiStore.getState();
    store.setRingReady(false);
    store.setViewMode("list");
  };
  const onContextRestored = () => {
    const store = useUiStore.getState();
    store.setRingReady(true);
    store.setViewMode("ring");
  };

  // Small screens start one tier down, with the reflective floor off (docs/DESIGN.md).
  // Set once: after that the tier belongs to the frame-rate monitor.
  useEffect(() => {
    const isDesktop = window.matchMedia(DESKTOP).matches;
    useUiStore.getState().setTier(setup.pinnedTier ?? (isDesktop ? "high" : "medium"));
  }, [setup.pinnedTier]);
  // Crossing below 1024px (a rotated tablet) only lowers the ceiling; it never resets
  // a tier the monitor already stepped down.
  useEffect(() => {
    const store = useUiStore.getState();
    if (!desktop && setup.pinnedTier === null && store.tier === "high") store.setTier("medium");
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
      hidden={created && !showing}
      className={
        created
          ? "relative isolate pb-6"
          : "pointer-events-none invisible absolute inset-x-0 top-0 isolate"
      }
    >
      {/* The list's "Featured projects" heading is hidden with the list in ring view. */}
      <h2 className="sr-only">Featured projects</h2>
      <div
        ref={stage}
        role="group"
        tabIndex={0}
        aria-label={`3D ring of ${count} projects. ${front?.title ?? ""} is in front.`}
        aria-describedby={captionId}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        className="ring-stage rounded-sheet relative h-72 cursor-grab touch-pan-y -outline-offset-2 active:cursor-grabbing lg:h-[clamp(18rem,50svh,30rem)]"
      >
        <Renderer
          // Also paused under the phone's bottom sheet, which covers the stage and
          // would otherwise re-blur a moving canvas every frame.
          running={(showing || !created) && onScreen && pageVisible && !(panelOpen && !desktop)}
          ceiling={desktop ? "high" : "medium"}
          pinned={setup.pinnedTier !== null}
          onReady={onReady}
          onContextLost={onContextLost}
          onContextRestored={onContextRestored}
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
              className="text-ink absolute top-0 left-0 flex origin-top-left flex-col justify-between p-3 opacity-0 select-none"
              style={{
                width: layout.labelWidth,
                height: (layout.labelWidth * layout.panelHeight) / layout.panelWidth,
              }}
            >
              <span className="tracking-readout text-ink-dim font-mono text-xs">
                {projectPosition(project.order, count)}
              </span>
              <span className="text-base leading-tight font-bold lg:text-lg">{project.title}</span>
            </div>
          ))}
        </div>
        {process.env.NODE_ENV === "development" ? <TierReadout /> : null}
      </div>

      <RingControls
        frontTitle={front?.title ?? ""}
        captionId={captionId}
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
