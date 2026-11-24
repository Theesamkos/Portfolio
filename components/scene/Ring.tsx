"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { ExtrudeGeometry, PlaneGeometry, ShapeGeometry, type Group } from "three";
import type { ProjectId } from "@/content/projects";
import { dampingFor, rotationFor } from "@/lib/ring";
import { useUiStore, type Tier } from "@/store/ui";
import { roundedFrame, roundedRect } from "./geometry";
import { ease, ringInput, type IntroClock } from "./input";
import { panelCenterY, type RingLayout } from "./layout";
import { ProjectPanel, type PanelGeometry } from "./ProjectPanel";
import type { SceneTokens } from "./tokens";

/** What the ring needs to know about a project — the page passes only this. */
export type RingProject = { id: ProjectId; title: string; order: number };

/** While dragging, the ring should stick to the pointer. */
const DRAG_RATE = dampingFor(0.08);

/**
 * The ring: one group holding the 8 panels on a circle.
 *
 * This is the render-loop lesson in one place. React state (the store) says *which*
 * project is in front. `useFrame` runs once per frame and moves the group's rotation
 * a little closer to the angle that puts that project in front. The store is read
 * with `getState()`, so turning the ring re-renders nothing.
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
  const count = projects.length;

  // One set of geometry shared by all panels.
  const geometry = useMemo<PanelGeometry>(() => {
    const { panelWidth: width, panelHeight: height, panelRadius: radius } = layout;
    const art = width * 0.72;
    return {
      glass: new ExtrudeGeometry(roundedRect(width, height, radius), {
        depth: 0.02,
        bevelEnabled: false,
        curveSegments: 10,
      }),
      edge: new ShapeGeometry(roundedFrame(width, height, radius, 0.022), 10),
      poster: new PlaneGeometry(art, art),
    };
  }, [layout]);
  useEffect(
    () => () => {
      geometry.glass.dispose();
      geometry.edge.dispose();
      geometry.poster.dispose();
    },
    [geometry],
  );

  useFrame((_, delta) => {
    const ring = group.current;
    if (!ring) return;
    const frontId = useUiStore.getState().frontProjectId;
    const frontIndex = Math.max(
      0,
      projects.findIndex((project) => project.id === frontId),
    );
    const goal = ringInput.dragging
      ? ringInput.anchor + ringInput.drag
      : rotationFor(frontIndex, count, ring.rotation.y);
    ring.rotation.y = ease(
      ring.rotation.y,
      goal,
      ringInput.dragging ? DRAG_RATE : tokens.ringRate,
      delta,
      reducedMotion && !ringInput.dragging,
    );
    ringInput.rotation = ring.rotation.y;
    introRef.current += delta;
  });

  return (
    <group ref={group} position-y={panelCenterY(layout)}>
      {projects.map((project, index) => (
        <ProjectPanel
          key={project.id}
          id={project.id}
          order={project.order}
          index={index}
          count={count}
          layout={layout}
          tokens={tokens}
          tier={tier}
          geometry={geometry}
          introRef={introRef}
          reducedMotion={reducedMotion}
        />
      ))}
    </group>
  );
}
