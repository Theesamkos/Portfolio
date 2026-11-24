/**
 * Geometry of the placeholder poster: a segmented ring with this project's position
 * lit (docs/DESIGN.md "Project art"). Shared by the server-rendered card poster
 * (inline SVG, CSS-variable colors) and the 3D panel, which needs the same drawing as
 * an image and so gets it as an SVG string with the token colors written in.
 * Phase 7 replaces both with real art.
 */
export const POSTER = {
  width: 1600,
  height: 1000,
  center: { x: 800, y: 500 },
  ringRadius: 300,
  innerRadius: 230,
  gapDegrees: 6,
} as const;

export function posterPoint(degrees: number, radius: number): string {
  const radians = ((degrees - 90) * Math.PI) / 180;
  const x = POSTER.center.x + radius * Math.cos(radians);
  const y = POSTER.center.y + radius * Math.sin(radians);
  return `${x.toFixed(1)} ${y.toFixed(1)}`;
}

/** One arc per project; the one at `order` is lit. */
export function posterSegments(order: number, total: number): { d: string; lit: boolean }[] {
  const step = 360 / total;
  return Array.from({ length: total }, (_, index) => {
    const start = index * step + POSTER.gapDegrees / 2;
    const end = (index + 1) * step - POSTER.gapDegrees / 2;
    const r = POSTER.ringRadius;
    return {
      d: `M${posterPoint(start, r)} A${r} ${r} 0 0 1 ${posterPoint(end, r)}`,
      lit: index === order - 1,
    };
  });
}

/** The short line from the inner circle to the lit segment. */
export function posterTick(order: number, total: number): string {
  const step = 360 / total;
  const angle = (order - 1) * step + step / 2;
  return `M${posterPoint(angle, POSTER.innerRadius)} L${posterPoint(angle, POSTER.ringRadius - 20)}`;
}

/**
 * The same drawing as a standalone SVG document, cropped square around the ring,
 * with a transparent background. Used as a WebGL texture through a `data:` URL.
 */
export function posterSvg(
  order: number,
  total: number,
  colors: { accent: string; glow: string },
): string {
  const { center, ringRadius, innerRadius } = POSTER;
  const half = ringRadius + 60;
  const segments = posterSegments(order, total)
    .map(
      ({ d, lit }) =>
        `<path d="${d}" stroke="${lit ? colors.accent : colors.glow}" stroke-linecap="round" stroke-width="${lit ? 16 : 8}"/>`,
    )
    .join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" fill="none" ` +
    `viewBox="${center.x - half} ${center.y - half} ${half * 2} ${half * 2}">` +
    `<circle cx="${center.x}" cy="${center.y}" r="${innerRadius}" stroke="${colors.glow}" stroke-width="3"/>` +
    segments +
    `<path d="${posterTick(order, total)}" stroke="${colors.accent}" stroke-width="5"/>` +
    `</svg>`
  );
}
