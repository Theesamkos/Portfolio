"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, type Mesh, type ShaderMaterial } from "three";
import { useUiStore, type Tier } from "@/store/ui";
import { panelCenterY, type RingLayout } from "./layout";
import type { SceneTokens } from "./tokens";

const haloVertex = /* glsl */ `
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * The halo's brightness is a number above 1 on purpose: with bloom's threshold at 1
 * (Effects.tsx), this is one of the two things in the scene that glows.
 * `uActivity` (0–1) is the hook for the AI guide in Phase 5.
 */
const haloFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uActivity;
  uniform float uPulse;
  void main() {
    float strength = 3.0 + 0.6 * uPulse + 2.5 * uActivity;
    gl_FragColor = vec4(uColor * strength, 1.0);
    #include <colorspace_fragment>
  }
`;

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
    }),
    [tokens],
  );

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
    <group
      position-y={panelCenterY(layout) + layout.panelHeight / 2 + 0.1}
      scale={layout.coreScale}
    >
      <mesh ref={sphere}>
        <sphereGeometry args={[0.95, 48, 32]} />
        {tier === "high" ? (
          <meshPhysicalMaterial
            color={tokens.bgGlow}
            transparent
            opacity={0.7}
            roughness={0.03}
            metalness={0.15}
            clearcoat={1}
            clearcoatRoughness={0.04}
            envMapIntensity={1.6}
            depthWrite={false}
          />
        ) : (
          <meshStandardMaterial
            color={tokens.bgGlow}
            transparent
            opacity={0.7}
            roughness={0.06}
            metalness={0.15}
            envMapIntensity={1.4}
            depthWrite={false}
          />
        )}
      </mesh>
      {/* A denser blue center, so the sphere reads as solid glass and not a bubble. */}
      <mesh scale={0.62}>
        <sphereGeometry args={[0.95, 24, 16]} />
        <meshBasicMaterial color={tokens.glow} transparent opacity={0.45} depthWrite={false} />
      </mesh>

      <group rotation={[Math.PI / 2 - 0.16, 0.1, 0]}>
        {/* Soft blue falloff around the halo. Plain alpha blending: on a light page,
            additive glow would only wash out to white. */}
        <mesh>
          <torusGeometry args={[1.42, 0.06, 12, 128]} />
          <meshBasicMaterial color={tokens.glow} transparent opacity={0.22} depthWrite={false} />
        </mesh>
        <mesh>
          <torusGeometry args={[1.42, 0.016, 12, 160]} />
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
  );
}
