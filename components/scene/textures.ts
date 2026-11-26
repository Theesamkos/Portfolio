import { CanvasTexture, SRGBColorSpace } from "three";
import type { SceneTokens } from "./tokens";

/**
 * Small textures drawn once on a 2D canvas. Soft light — a tint that deepens down a
 * pane, the glow around the front panel, the pool it throws on the disc — is a
 * gradient, and a gradient in a texture costs nothing per frame. Bloom alone cannot do
 * this job: the low tier has no bloom, and bloom only spreads what is already bright.
 */
function draw(
  width: number,
  height: number,
  paint: (context: CanvasRenderingContext2D) => void,
): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (context) paint(context);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** `#1f6bff` + 0.5 → `rgba(31,107,255,0.5)`; canvas gradients need the alpha inline. */
function withAlpha(hex: string, alpha: number): string {
  const value = Number.parseInt(hex.replace("#", ""), 16);
  return `rgba(${(value >> 16) & 255},${(value >> 8) & 255},${value & 255},${alpha})`;
}

/**
 * The tint laid over a pane: clear at the top, blue toward the bottom, with a faint
 * bright band near the top edge — what makes a flat white plane read as frosted glass.
 */
export function paneTint(tokens: SceneTokens): CanvasTexture {
  return draw(4, 128, (context) => {
    const gradient = context.createLinearGradient(0, 0, 0, 128);
    // On the pane's face the canvas ends up bottom-first: stop 0 is the bottom edge.
    gradient.addColorStop(0, withAlpha(tokens.bgGlow, 0.4));
    gradient.addColorStop(0.55, withAlpha(tokens.bgGlow, 0.1));
    gradient.addColorStop(0.85, withAlpha(tokens.white, 0.15));
    gradient.addColorStop(1, withAlpha(tokens.white, 0.6));
    context.fillStyle = gradient;
    context.fillRect(0, 0, 4, 128);
  });
}

/**
 * The glow around the front panel: a rounded rectangle's outline, blurred. The pane
 * covers the middle, so only the soft falloff outside the edge shows.
 * `inset` is how far the rectangle sits inside the texture, as a fraction of its size.
 */
export function edgeAura(tokens: SceneTokens, aspect: number, inset: number): CanvasTexture {
  const height = 256;
  const width = Math.round(height * aspect);
  return draw(width, height, (context) => {
    const x = width * inset;
    const y = height * inset;
    context.shadowColor = tokens.glow;
    context.shadowBlur = height * inset * 0.55;
    context.strokeStyle = tokens.glow;
    context.lineWidth = 10;
    context.beginPath();
    context.roundRect(x, y, width - 2 * x, height - 2 * y, height * 0.06);
    // Twice: one blurred stroke is too faint to read on a light page.
    context.stroke();
    context.stroke();
  });
}

/** The pool of light the front panel throws on the disc: a soft blue ellipse. */
export function lightPool(tokens: SceneTokens): CanvasTexture {
  return draw(128, 128, (context) => {
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, withAlpha(tokens.white, 0.95));
    gradient.addColorStop(0.35, withAlpha(tokens.glow, 0.45));
    gradient.addColorStop(1, withAlpha(tokens.glow, 0));
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
  });
}
