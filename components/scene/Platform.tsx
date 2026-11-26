"use client";

import { MeshReflectorMaterial } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import { lightPool } from "./textures";
import type { Tier } from "@/store/ui";
import type { RingLayout } from "./layout";
import type { SceneTokens } from "./tokens";

/**
 * A radial gradient drawn once on a 2D canvas: the "baked" stand-in for a real
 * reflection on medium and low tiers. Brightest in a band under the panels, fading
 * to clear at the rim so the page shows through.
 */
function bakedFloor(tokens: SceneTokens): CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    gradient.addColorStop(0, tokens.white);
    gradient.addColorStop(0.45, tokens.accentSoft);
    gradient.addColorStop(0.72, tokens.bgGlow);
    gradient.addColorStop(1, tokens.accentSoft);
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * The glass disc the ring stands on (docs/DESIGN.md): a wide translucent disc with a
 * bright rim and a second, fainter ring inside it.
 *
 * High tier: drei `MeshReflectorMaterial` — the scene is rendered a second time from
 * below to get a soft reflection of the panels. That is a whole extra render pass,
 * so medium and low tiers use the baked gradient instead.
 */
export function Platform({
  layout,
  tokens,
  tier,
}: {
  layout: RingLayout;
  tokens: SceneTokens;
  tier: Tier;
}) {
  const radius = layout.platformRadius;
  const reflective = tier === "high" && !layout.compact;
  const baked = useMemo(() => bakedFloor(tokens), [tokens]);
  useEffect(() => () => baked.dispose(), [baked]);
  const pool = useMemo(() => lightPool(tokens), [tokens]);
  useEffect(() => () => pool.dispose(), [pool]);

  return (
    <group position-y={layout.platformY}>
      <mesh rotation-x={-Math.PI / 2} renderOrder={-2}>
        <circleGeometry args={[radius, 96]} />
        {reflective ? (
          <MeshReflectorMaterial
            resolution={1024}
            blur={[300, 110]}
            mixBlur={0.85}
            mixStrength={1.1}
            mirror={0.55}
            roughness={0.6}
            color={tokens.bgGlow}
            transparent
            opacity={0.55}
            depthWrite={false}
          />
        ) : (
          <meshBasicMaterial map={baked} transparent opacity={0.6} depthWrite={false} />
        )}
      </mesh>

      {/* The front panel's glow, spilled onto the disc. The front of the ring is always
          the same spot — the ring turns, this does not — so it never needs to move. */}
      <mesh
        rotation-x={-Math.PI / 2}
        position={[0, 0.012, layout.radius + 0.1]}
        scale={[layout.panelWidth * 1.9, 1.5, 1]}
        renderOrder={-1}
      >
        <planeGeometry />
        <meshBasicMaterial map={pool} transparent opacity={0.75} depthWrite={false} />
      </mesh>

      {/* The disc's edge: a shallow glass wall below the surface. */}
      <mesh position-y={-0.09} renderOrder={-2}>
        <cylinderGeometry args={[radius, radius, 0.18, 96, 1, true]} />
        <meshStandardMaterial
          color={tokens.white}
          transparent
          opacity={0.35}
          roughness={0.2}
          depthWrite={false}
        />
      </mesh>

      {/* Rim. */}
      <mesh rotation-x={Math.PI / 2} renderOrder={-1}>
        <torusGeometry args={[radius, 0.022, 12, 160]} />
        <meshStandardMaterial color={tokens.white} roughness={0.15} transparent opacity={0.7} />
      </mesh>
      {/* Inner ring, where the panels stand. */}
      <mesh rotation-x={Math.PI / 2} position-y={0.005} renderOrder={-1}>
        <torusGeometry args={[layout.radius + 0.45, 0.012, 8, 160]} />
        <meshStandardMaterial color={tokens.white} roughness={0.2} transparent opacity={0.35} />
      </mesh>
    </group>
  );
}
