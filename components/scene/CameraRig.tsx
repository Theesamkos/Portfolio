"use client";

import { useFrame } from "@react-three/fiber";
import { type PerspectiveCamera } from "three";
import { useUiStore } from "@/store/ui";
import { ease } from "./input";
import type { RingLayout } from "./layout";
import type { SceneTokens } from "./tokens";

/**
 * Moves the camera, every frame, toward where it should be (docs/DESIGN.md: 800ms,
 * damped). The ring turns the front panel toward the camera, so "easing to the active
 * panel" means: when a project is selected, slide right and back off a little, which
 * puts the whole ring left of center, beside the detail panel.
 *
 * It also fits the ring to the stage: the narrower the stage, the further back the
 * camera sits. No React state changes here — refs and the camera only.
 */
export function CameraRig({
  layout,
  tokens,
  reducedMotion,
}: {
  layout: RingLayout;
  tokens: SceneTokens;
  reducedMotion: boolean;
}) {
  useFrame((state, delta) => {
    const camera = state.camera as PerspectiveCamera;
    const aspect = state.size.width / Math.max(1, state.size.height);
    const halfFov = Math.tan((camera.fov * Math.PI) / 360);
    const fit = Math.max(
      layout.minDistance,
      layout.fitDepth + layout.fitWidth / 2 / (halfFov * aspect),
    );

    const selected = useUiStore.getState().activeProjectId !== null;
    const shift = selected ? layout.activeShift : 0;
    const distance = selected ? fit * layout.activeZoom : fit;
    // A little parallax from the pointer; none under reduced motion.
    const sway = reducedMotion ? 0 : state.pointer.x * 0.18;

    const x = ease(camera.position.x, shift + sway, tokens.cameraRate, delta, reducedMotion);
    const z = ease(camera.position.z, distance, tokens.cameraRate, delta, reducedMotion);
    camera.position.set(x, layout.cameraHeight, z);
    camera.lookAt(x - sway * 0.6, layout.lookAtY, 0);
  });

  return null;
}
