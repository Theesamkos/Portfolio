"use client";

import { Environment, Lightformer } from "@react-three/drei";
import type { SceneTokens } from "./tokens";

/**
 * Soft studio light (docs/DESIGN.md): a cool key from the top-left, a weak fill, and
 * an environment for the glass to reflect.
 *
 * The environment is built here from a few large light panels and rendered once
 * (`frames={1}`). No HDR file: drei's presets download from a third-party CDN, which
 * the CSP blocks and which would cost a network round trip.
 */
export function Lighting({ tokens }: { tokens: SceneTokens }) {
  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[-5, 7, 6]} intensity={1.0} color={tokens.accentSoft} />
      <directionalLight position={[6, 3, 4]} intensity={0.3} />

      <Environment resolution={256} frames={1}>
        <color attach="background" args={[tokens.bgGlow]} />
        {/* Overhead softbox. */}
        <Lightformer
          form="rect"
          intensity={1.5}
          color={tokens.white}
          position={[0, 6, 0]}
          rotation-x={Math.PI / 2}
          scale={[12, 12, 1]}
        />
        {/* Cool key, top-left. */}
        <Lightformer
          form="rect"
          intensity={1.2}
          color={tokens.bgGlow}
          position={[-7, 3, 3]}
          rotation-y={Math.PI / 2}
          scale={[8, 5, 1]}
        />
        {/* Fill, right. */}
        <Lightformer
          form="rect"
          intensity={0.6}
          color={tokens.white}
          position={[7, 1, 3]}
          rotation-y={-Math.PI / 2}
          scale={[6, 4, 1]}
        />
        {/* A blue strip low in front, for an edge highlight on the sphere. */}
        <Lightformer
          form="rect"
          intensity={0.8}
          color={tokens.glow}
          position={[0, -2, 7]}
          scale={[10, 1.5, 1]}
        />
      </Environment>
    </>
  );
}
