"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { ExtrudeGeometry, PlaneGeometry, ShapeGeometry, type Group } from "three";
import type { ProjectId } from "@/content/projects";
import type { ProjectStatus } from "@/lib/schema";
import { dampingFor, rotationFor, smoothDamp, type Spring } from "@/lib/ring";
import { useUiStore, type Tier } from "@/store/ui";
import { fitUvs, roundedFrame, roundedRect } from "./geometry";
import { ease, ringInput, type IntroClock } from "./input";
import { panelCenterY, type RingLayout } from "./layout";
import { AURA_SCALE, ProjectPanel, type PanelGeometry, type PanelTextures } from "./ProjectPanel";
import { edgeAura, paneTint } from "./textures";
import type { SceneTokens } from "./tokens";

/** What the ring needs to know about a project — the page passes only this. */
export type RingProject = {
  id: ProjectId;
  title: string;
  pitch: string;
  status: ProjectStatus;
  order: number;
  /** Site-relative path of the panel's icon, e.g. `/projects/math-tiles/icon.svg`. */
  icon: string;
};

/** While dragging, the ring should stick to the pointer. */
const DRAG_RATE = dampingFor(0.08);

/**
 * The ring: one group holding the 8 panels on a circle.
 *
 * This is the render-loop lesson in one place. React state (the store) says *which*
 * project is in front. `useFrame` runs once per frame and moves the group's rotation
 * a little closer to the angle that puts that project in front — with a spring
 * (`smoothDamp`), so it has weight. The store is read with `getState()`, so turning
 * the ring re-renders nothing.
 */
export function Ring({
  projects,
  layout,
  tokens,
  tier,
  introRef,
  reducedMotion,
}: {
  projects: readonly RingProject[];
  layout: RingLayout;
  tokens: SceneTokens;
  tier: Tier;
  introRef: IntroClock;
  reducedMotion: boolean;
}) {
  const group = useRef<Group>(null);
  /** The ring's rotation and how fast it is turning — a ref, advanced every frame. */
  const spin = useRef<Spring>({ value: 0, velocity: 0 });
  const count = projects.length;

  // One set of geometry shared by all panels.
  const geometry = useMemo<PanelGeometry>(() => {
    const { panelWidth: width, panelHeight: height, panelRadius: radius } = layout;
    // The icon sits between the index label and the title, about half the pane high.
    const art = height * 0.5;
    return {
      glass: new ExtrudeGeometry(roundedRect(width, height, radius), {
        depth: 0.02,
        bevelEnabled: false,
        curveSegments: 10,
      }),
      tint: fitUvs(new ShapeGeometry(roundedRect(width, height, radius), 10), width, height),
      edge: new ShapeGeometry(roundedFrame(width, height, radius, 0.012), 10),
      aura: new PlaneGeometry(width * AURA_SCALE, height * AURA_SCALE),
      poster: new PlaneGeometry(art, art),
    };
  }, [layout]);
  useEffect(
    () => () => {
      for (const part of Object.values(geometry)) part.dispose();
    },
    [geometry],
  );

  // And one set of textures: the same tint and glow on every pane.
  const textures = useMemo<PanelTextures>(() => {
    const aspect = layout.panelWidth / layout.panelHeight;
    return {
      tint: paneTint(tokens),
      aura: edgeAura(tokens, aspect, (1 - 1 / AURA_SCALE) / 2),
    };
  }, [layout, tokens]);
  useEffect(
    () => () => {
      textures.tint.dispose();
      textures.aura.dispose();
    },
    [textures],
  );

  useFrame((_, delta) => {
    const ring = group.current;
    if (!ring) return;
    const frontId = useUiStore.getState().frontProjectId;
    const frontIndex = Math.max(
      0,
      projects.findIndex((project) => project.id === frontId),
    );
    const turn = spin.current;
    if (ringInput.dragging) {
      // Stick to the pointer, and measure the speed: on release the spring starts
      // from it, so the ring keeps moving the way it was thrown instead of stopping
      // dead and starting again.
      const next = ease(turn.value, ringInput.anchor + ringInput.drag, DRAG_RATE, delta, false);
      if (delta > 0) turn.velocity = (next - turn.value) / delta;
      turn.value = next;
    } else if (reducedMotion) {
      turn.value = rotationFor(frontIndex, count, turn.value);
      turn.velocity = 0;
    } else {
      // A spring with weight: eases in, carries momentum, settles without overshoot,
      // and lands exactly on the target — so a ring at rest writes nothing.
      smoothDamp(turn, rotationFor(frontIndex, count, turn.value), tokens.ringSmoothTime, delta);
    }
    ring.rotation.y = turn.value;
    ringInput.rotation = ring.rotation.y;
    introRef.current += delta;
  });

  return (
    <group ref={group} position-y={panelCenterY(layout)}>
      {projects.map((project, index) => (
        <ProjectPanel
          key={project.id}
          id={project.id}
          icon={project.icon}
          index={index}
          count={count}
          layout={layout}
          tokens={tokens}
          tier={tier}
          geometry={geometry}
          textures={textures}
          introRef={introRef}
          reducedMotion={reducedMotion}
        />
      ))}
    </group>
  );
}
