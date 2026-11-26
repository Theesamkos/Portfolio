import { Path, Shape, type BufferGeometry } from "three";

function roundedRectPath<T extends Path>(
  path: T,
  width: number,
  height: number,
  radius: number,
): T {
  const x = -width / 2;
  const y = -height / 2;
  path.moveTo(x + radius, y);
  path.lineTo(x + width - radius, y);
  path.absarc(x + width - radius, y + radius, radius, -Math.PI / 2, 0, false);
  path.lineTo(x + width, y + height - radius);
  path.absarc(x + width - radius, y + height - radius, radius, 0, Math.PI / 2, false);
  path.lineTo(x + radius, y + height);
  path.absarc(x + radius, y + height - radius, radius, Math.PI / 2, Math.PI, false);
  path.lineTo(x, y + radius);
  path.absarc(x + radius, y + radius, radius, Math.PI, Math.PI * 1.5, false);
  return path;
}

/** A rounded rectangle centered on the origin. */
export function roundedRect(width: number, height: number, radius: number): Shape {
  return roundedRectPath(new Shape(), width, height, radius);
}

/** A rounded-rectangle frame: the outline of a panel, `thickness` wide. */
export function roundedFrame(
  width: number,
  height: number,
  radius: number,
  thickness: number,
): Shape {
  const frame = roundedRect(width + thickness, height + thickness, radius + thickness / 2);
  frame.holes.push(
    roundedRectPath(new Path(), width - thickness, height - thickness, radius - thickness / 2),
  );
  return frame;
}

/**
 * A `ShapeGeometry`'s texture coordinates are its vertex positions in world units,
 * not 0–1. This rescales them so a texture covers a `width` × `height` shape exactly
 * once, the way it would on a plane.
 */
export function fitUvs<T extends BufferGeometry>(geometry: T, width: number, height: number): T {
  const uv = geometry.getAttribute("uv");
  for (let index = 0; index < uv.count; index += 1) {
    uv.setXY(index, uv.getX(index) / width + 0.5, uv.getY(index) / height + 0.5);
  }
  uv.needsUpdate = true;
  return geometry;
}
