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

/**
 * A value that moves like something with weight: it carries a velocity, so it eases
 * in as well as out, keeps its momentum when its target changes (or a drag lets go),
 * and settles without overshooting. `damp` above has no velocity — it starts at full
 * speed the instant the target moves, which reads as weightless.
 */
export type Spring = { value: number; velocity: number };

/** `smoothTime` for a move that is ~99% done after `seconds`. */
export function smoothTimeFor(seconds: number): number {
  // A critically damped spring is at 1% of the way left when ωt ≈ 6.64, and ω = 2 / smoothTime.
  return (2 * seconds) / 6.64;
}

/** Below this distance and speed the spring is at rest and lands exactly on its target. */
const REST = 1e-4;

/**
 * Advances `spring` toward `target` by `delta` seconds — a critically damped spring
 * (the "SmoothDamp" from Game Programming Gems 4). Frame-rate independent: the same
 * path at 60Hz and 120Hz. Mutates `spring`, so the render loop allocates nothing.
 */
export function smoothDamp(
  spring: Spring,
  target: number,
  smoothTime: number,
  delta: number,
): void {
  if (delta <= 0) return;
  const omega = 2 / Math.max(1e-4, smoothTime);
  const x = omega * delta;
  // A polynomial stand-in for e^-x that stays stable when a frame is long.
  const decay = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const from = spring.value;
  const change = from - target;
  const temp = (spring.velocity + omega * change) * delta;
  let velocity = (spring.velocity - omega * temp) * decay;
  let value = target + (change + temp) * decay;
  // Never pass the target: arriving with speed left over stops there.
  if (target - from > 0 === value > target) {
    value = target;
    velocity = 0;
  }
  if (Math.abs(value - target) < REST && Math.abs(velocity) < REST) {
    value = target;
    velocity = 0;
  }
  spring.value = value;
  spring.velocity = velocity;
}
