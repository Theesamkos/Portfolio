/**
 * Geometry of the placeholder poster: a segmented ring with this project's position
 * lit (docs/DESIGN.md "Project art"). Drawn by the server-rendered card poster as
 * inline SVG with CSS-variable colors. (The 3D panels show each project's `icon.svg`
 * instead.) Phase 7 replaces it with real art.
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
