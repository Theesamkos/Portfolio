"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Color, type Mesh, type ShaderMaterial } from "three";
import { useUiStore, type Tier } from "@/store/ui";
import { coreCenterY, type RingLayout } from "./layout";
import { softGlow } from "./textures";
import type { SceneTokens } from "./tokens";

const haloVertex = /* glsl */ `
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * The halo's brightness is well above 1 on purpose: it is one of the two things in
 * the scene drawn brighter than bloom's threshold (Effects.tsx), so it glows.
 * `uActivity` (0–1) is the hook for the AI guide in Phase 5.
 */
const haloFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uActivity;
  uniform float uPulse;
  uniform float uBoost;
  void main() {
    float strength = uBoost * (1.0 + 0.2 * uPulse + 0.8 * uActivity);
    gl_FragColor = vec4(uColor * strength, 1.0);
    #include <colorspace_fragment>
  }
`;

/**
 * How far the halo leans toward the camera, and how far it rolls. The camera already
 * looks down on the core by about 9°; leaning the halo another 6° shows it at about
 * 15° — a thin ellipse that reads as an orbit. (Before, it leaned 9° the other way
 * and was seen edge-on: a line across the sphere.) The roll keeps it from looking
 * like a level plate.
 */
const HALO_LEAN = (6 * Math.PI) / 180;
const HALO_ROLL = (-8 * Math.PI) / 180;

/**
 * The core (docs/DESIGN.md): a glass sphere with a thin glowing halo, tilted
 * slightly. It is the AI guide's presence in the scene — a slow idle pulse now;
 * the guide raises `coreActivity` in the store while it answers (Phase 5).
 *
 * The render loop reads `coreActivity` with `getState()` and writes it into a shader
 * uniform: a value that changes every frame never goes through React state.
 */
export function Core({
  layout,
  tokens,
  tier,
  reducedMotion,
}: {
  layout: RingLayout;
  tokens: SceneTokens;
  tier: Tier;
  reducedMotion: boolean;
}) {
  const sphere = useRef<Mesh>(null);
  const halo = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uColor: { value: new Color(tokens.glow) },
      uActivity: { value: 0 },
      uPulse: { value: 0 },
      // Above bloom's threshold where there is bloom; on the low tier the halo is
      // drawn at its plain color, which would otherwise clip toward white.
      uBoost: { value: tier === "low" ? 1 : 6 },
    }),
    [tokens, tier],
  );

  const glow = useMemo(() => softGlow(tokens), [tokens]);
  useEffect(() => () => glow.dispose(), [glow]);

  useFrame((state, delta) => {
    const activity = useUiStore.getState().coreActivity;
    const time = state.clock.elapsedTime;
    const pulse = reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(time * 1.4);
    if (halo.current) {
      const current = halo.current.uniforms.uActivity;
      const pulseUniform = halo.current.uniforms.uPulse;
      // Activity eases in and out over about a third of a second.
      if (current) current.value += (activity - current.value) * Math.min(1, delta * 9);
      if (pulseUniform) pulseUniform.value = pulse;
    }
    if (sphere.current && !reducedMotion) {
      sphere.current.scale.setScalar(1 + 0.012 * pulse + 0.03 * activity);
    }
  });

  return (
    <group position-y={coreCenterY(layout)} scale={layout.coreScale}>
      {/* Light around the sphere. A sprite always faces the camera, and a gradient
          falls off smoothly — a second, denser sphere inside read as a hard ball. */}
      <sprite scale={3.4} renderOrder={-1}>
        <spriteMaterial map={glow} transparent opacity={0.8} depthWrite={false} />
      </sprite>

      {/* Unlike the rest of the glass, the sphere is opaque. Translucent, it showed the
          panel behind it as a pale rectangle, and sharp highlights from the two lights
          sat on it like a pair of eyes. Opaque and a little rough, it reads as a solid
          glossy ball; and because it writes depth, the far half of the halo is hidden
          behind it — which is what makes the halo read as an orbit. */}
      <mesh ref={sphere}>
        <sphereGeometry args={[0.95, 48, 32]} />
        <meshStandardMaterial
          color={tokens.glow}
          roughness={0.5}
          metalness={0.1}
          envMapIntensity={1.3}
        />
      </mesh>

      {/* The torus is built upright; a quarter turn lays it flat, then it leans. */}
      <group rotation={[Math.PI / 2 + HALO_LEAN, 0, 0]}>
        <group rotation-y={HALO_ROLL}>
          {/* Soft blue falloff around the halo. Plain alpha blending: on a light page,
              additive glow would only wash out to white. */}
          <mesh>
            <torusGeometry args={[1.38, 0.05, 12, 128]} />
            <meshBasicMaterial color={tokens.glow} transparent opacity={0.45} depthWrite={false} />
          </mesh>
          <mesh>
            <torusGeometry args={[1.38, 0.016, 12, 160]} />
            <shaderMaterial
              ref={halo}
              uniforms={uniforms}
              vertexShader={haloVertex}
              fragmentShader={haloFragment}
              toneMapped={false}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}
