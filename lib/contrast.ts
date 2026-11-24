/**
 * WCAG 2.x contrast math for the design tokens. Used by lib/contrast.test.ts to keep
 * every text color at AA (4.5:1) on the surfaces it is used on.
 */

export type Rgb = readonly [number, number, number];

/** `#rrggbb` → [r, g, b]. */
export function hexToRgb(hex: string): Rgb {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!match) throw new Error(`Not a #rrggbb color: ${hex}`);
  return [parseInt(match[1]!, 16), parseInt(match[2]!, 16), parseInt(match[3]!, 16)];
}

/** `rgba(r, g, b, a)` → color and alpha. */
export function parseRgba(value: string): { color: Rgb; alpha: number } {
  const parts = /^rgba?\(([^)]+)\)$/.exec(value.trim())?.[1]?.split(",").map(Number);
  if (!parts || parts.length < 3 || parts.some(Number.isNaN)) {
    throw new Error(`Not an rgba() color: ${value}`);
  }
  return { color: [parts[0]!, parts[1]!, parts[2]!], alpha: parts[3] ?? 1 };
}

/** A translucent color painted over an opaque one — what the eye actually sees. */
export function composite(foreground: Rgb, alpha: number, background: Rgb): Rgb {
  const mix = (index: 0 | 1 | 2) => foreground[index] * alpha + background[index] * (1 - alpha);
  return [mix(0), mix(1), mix(2)];
}

function relativeLuminance([r, g, b]: Rgb): number {
  const linear = (channel: number) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (lighter! + 0.05) / (darker! + 0.05);
}
