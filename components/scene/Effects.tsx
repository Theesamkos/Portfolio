"use client";

import { Bloom, EffectComposer, wrapEffect } from "@react-three/postprocessing";
import { BlendFunction, Effect } from "postprocessing";
import type { Tier } from "@/store/ui";

/**
 * Lit white glass reaches about 1.2 in the HDR buffer. The threshold sits above that,
 * and the two things meant to glow — the halo and the front panel's edge — are drawn
 * at 3 and up (Core.tsx, ProjectPanel.tsx). Nothing else can bloom.
 */
export const BLOOM_THRESHOLD = 1.7;

/**
 * Makes post-processing safe on a transparent canvas over a light page.
 *
 * The browser expects canvas pixels as sRGB color already multiplied by alpha. The
 * composer blends in linear light and converts to sRGB at the very end — after the
 * alpha was multiplied in — so a 50%-opaque white pane comes out brighter than 50%
 * and the browser adds it to the page as pure light. Everything translucent turns
 * solid white: the "foggy" failure.
 *
 * This runs last and hands the output stage a value that survives its conversion:
 * un-multiply, convert, re-multiply, convert back. Bloom adds light with no alpha at
 * all, so alpha is also raised to cover it; the glow then tints the page blue
 * instead of bleaching it.
 */
const fragmentShader = /* glsl */ `
  vec3 toSRGB(vec3 c) {
    return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
  }
  vec3 toLinear(vec3 c) {
    return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
  }
  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    float peak = max(inputColor.r, max(inputColor.g, inputColor.b));
    float alpha = clamp(max(inputColor.a, peak), 0.0, 1.0);
    vec3 straight = clamp(inputColor.rgb / max(alpha, 1e-5), 0.0, 1.0);
    outputColor = vec4(toLinear(toSRGB(straight) * alpha), alpha);
  }
`;

class PremultipliedOutputEffect extends Effect {
  constructor() {
    super("PremultipliedOutputEffect", fragmentShader, { blendFunction: BlendFunction.SRC });
  }
}

const PremultipliedOutput = wrapEffect(PremultipliedOutputEffect);

/**
 * Bloom, and only on what is meant to glow — that is what keeps a light page from
 * looking foggy.
 *
 * `mipmapBlur` stays off: on a transparent canvas it spreads light across the whole
 * frame and the canvas turns opaque white.
 *
 * High tier: full resolution, 4x multisampling. Medium: half-resolution bloom, no
 * multisampling. Low: no post-processing at all.
 */
export function Effects({ tier }: { tier: Tier }) {
  if (tier === "low") return null;
  return (
    <EffectComposer multisampling={tier === "high" ? 4 : 0}>
      <Bloom
        luminanceThreshold={BLOOM_THRESHOLD}
        luminanceSmoothing={0.15}
        intensity={0.9}
        resolutionScale={tier === "high" ? 1 : 0.5}
      />
      <PremultipliedOutput />
    </EffectComposer>
  );
}
