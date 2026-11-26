/**
 * What kind of WebGL a browser has. Pure, so it is unit-tested; the probe that asks
 * the browser lives in components/hud/RingStage.tsx.
 */
export type WebGLSupport = "none" | "software" | "gpu";

/**
 * Renderer names of WebGL drawn on the CPU. With no usable GPU (a VM, a remote
 * desktop, a blocklisted driver) browsers fall back to one of these, and every pixel
 * of every frame is computed by the processor:
 * - SwiftShader — Chrome and Edge
 * - llvmpipe, softpipe — Mesa on Linux, which Firefox uses
 * - "Software" — e.g. "Apple Software Renderer", "Software Rasterizer"
 * - Microsoft Basic Render Driver — Windows without a GPU driver
 */
const SOFTWARE_RENDERERS = /swiftshader|llvmpipe|softpipe|software|microsoft basic render/i;

/** True when `renderer` (the WebGL renderer string) names a CPU renderer. */
export function isSoftwareRenderer(renderer: string): boolean {
  return SOFTWARE_RENDERERS.test(renderer);
}
