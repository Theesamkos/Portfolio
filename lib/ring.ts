/**
 * Ring math — pure functions, no three.js and no React, so they are unit-tested and
 * shared by the render loop, the keyboard handler and the drag handler.
 *
 * Convention: panel `index` sits at angle `index / count` of a full turn around the
 * Y axis, and the front of the ring is angle 0 (facing the camera). The ring group's
 * `rotation.y` is therefore `-panelAngle(index)` when that panel is in front. Panel
 * `index + 1` is to the right of the front panel.
 */

export const TAU = Math.PI * 2;

/** Wraps any integer into `0 … count - 1`. */
export function wrapIndex(index: number, count: number): number {
  return ((index % count) + count) % count;
}

/** Wraps an angle into `[-π, π)`. */
export function wrapAngle(angle: number): number {
  return ((((angle + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
}

/** Where panel `index` sits on the ring, in radians. */
export function panelAngle(index: number, count: number): number {
  return (index / count) * TAU;
}

/**
 * The ring rotation that puts panel `index` in front, picked as the one closest to
 * `current` — so the ring always turns the short way round and never unwinds.
 */
export function rotationFor(index: number, count: number, current: number): number {
  return current + wrapAngle(-panelAngle(index, count) - current);
}

/** The panel nearest the front for a given ring rotation (used to snap after a drag). */
export function nearestIndex(rotation: number, count: number): number {
  return wrapIndex(Math.round(-rotation / (TAU / count)), count);
}

/** 1 when panel `index` faces the camera, -1 when it is at the back. */
export function facing(index: number, count: number, rotation: number): number {
  return Math.cos(panelAngle(index, count) + rotation);
}

/**
 * Where a drag ends up. Snaps to the nearest panel; a short, deliberate swipe that
 * did not get past the halfway point still moves one step in its direction.
 */
export function indexAfterDrag(
  startIndex: number,
  rotation: number,
  dragPixels: number,
  count: number,
  swipeThreshold = 40,
): number {
  const snapped = nearestIndex(rotation, count);
  if (snapped !== startIndex || Math.abs(dragPixels) < swipeThreshold) return snapped;
  // Dragging right pulls the previous panel to the front.
  return wrapIndex(startIndex - Math.sign(dragPixels), count);
}

export type RingAction = "prev" | "next" | "first" | "last" | "select";

/** Keyboard map for the ring (AGENTS.md: ←/→/Enter). */
export function keyAction(key: string): RingAction | null {
  switch (key) {
    case "ArrowLeft":
      return "prev";
    case "ArrowRight":
      return "next";
    case "Home":
      return "first";
    case "End":
      return "last";
    case "Enter":
    case " ":
      return "select";
    default:
      return null;
  }
}

/** The index a step action lands on; `select` does not move. */
export function indexAfterAction(action: RingAction, index: number, count: number): number {
  switch (action) {
    case "prev":
      return wrapIndex(index - 1, count);
    case "next":
      return wrapIndex(index + 1, count);
    case "first":
      return 0;
    case "last":
      return count - 1;
    case "select":
      return index;
  }
}

/**
 * Damping rate for `THREE.MathUtils.damp` so a move is ~99% done after `seconds`.
 * Frame-rate independent: the same duration at 60Hz and 120Hz (docs/DESIGN.md "Motion").
 */
export function dampingFor(seconds: number): number {
  return Math.log(100) / seconds;
}
