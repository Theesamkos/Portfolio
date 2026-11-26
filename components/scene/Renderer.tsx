"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useRef, type ReactNode } from "react";
import { useUiStore, type Tier } from "@/store/ui";

const TIERS: readonly Tier[] = ["low", "medium", "high"];

/** Device pixel ratio per tier (docs/DESIGN.md "Performance tiers"). */
const DPR: Record<Tier, number | [number, number]> = {
  high: [1, 2],
  medium: [1, 1.5],
  low: 1,
};

/**
 * The only file that configures the WebGL canvas (AGENTS.md) — a later move to
 * WebGPU changes this file and nothing else.
 *
 * - Transparent: the page background and its DOM glows show through.
 * - `flat`: no tone mapping, so token colors render as specified.
 * - drei's `PerformanceMonitor` measures the real frame rate and steps the effects
 *   tier in the store down or up; components read the tier and drop reflections,
 *   bloom and pixel ratio accordingly. Tiers follow measured speed, not screen size.
 */
export function Renderer({
  running,
  ceiling,
  pinned,
  onReady,
  onContextLost,
  onContextRestored,
  children,
}: {
  /** False pauses the render loop (ring off-screen, tab hidden, list view). */
  running: boolean;
  /** The highest tier this device may use (`medium` on small screens). */
  ceiling: Tier;
  /** True when a tier was forced with `?tier=`; the monitor then leaves it alone. */
  pinned: boolean;
  /** The WebGL context exists and the first frame is about to be drawn. */
  onReady: () => void;
  /** The browser took the context away (memory pressure, backgrounded tab). */
  onContextLost: () => void;
  onContextRestored: () => void;
  children: ReactNode;
}) {
  const tier = useUiStore((state) => state.tier);
  // Once the frame rate has flip-flopped between two tiers, stay on the lower one.
  const settled = useRef(false);

  const step = (direction: -1 | 1) => {
    if (pinned || settled.current) return;
    const { tier: current, setTier } = useUiStore.getState();
    const next = Math.min(TIERS.indexOf(ceiling), Math.max(0, TIERS.indexOf(current) + direction));
    const nextTier = TIERS[next];
    if (nextTier && nextTier !== current) setTier(nextTier);
  };

  return (
    <Canvas
      aria-hidden="true"
      // For tests and debugging: which effects tier is being drawn.
      data-tier={tier}
      flat
      frameloop={running ? "always" : "never"}
      dpr={DPR[tier]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 30, near: 0.1, far: 60, position: [0, 2.6, 12] }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        // preventDefault tells the browser we will handle a restore; until then the
        // page falls back to the list instead of showing an empty stage.
        gl.domElement.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
          onContextLost();
        });
        gl.domElement.addEventListener("webglcontextrestored", onContextRestored);
        onReady();
      }}
    >
      <PerformanceMonitor
        flipflops={3}
        onDecline={() => step(-1)}
        onIncline={() => step(1)}
        onFallback={() => {
          step(-1);
          settled.current = true;
        }}
      >
        {children}
      </PerformanceMonitor>
    </Canvas>
  );
}
