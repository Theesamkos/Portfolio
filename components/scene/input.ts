/**
 * Per-frame input state shared between the DOM handlers (drag, in RingScene) and the
 * render loop (Ring, ProjectPanel). A plain mutable object on purpose: these values
 * change on every pointer move and every frame, and nothing should re-render for them.
 */
export const ringInput = {
  /** True while the pointer is dragging the ring. */
  dragging: false,
  /** Ring rotation when the drag started. */
  anchor: 0,
  /** How far the drag has turned the ring since then, in radians. */
  drag: 0,
  /** The ring's current rotation, written by the render loop every frame. */
  rotation: 0,
};

/**
 * The panels' DOM labels (title and `01 / 08`), by panel index. RingScene renders
 * them as ordinary DOM over the canvas and registers each node here; every frame the
 * matching ProjectPanel writes a CSS transform onto its node so the text sits on the
 * glass. Real text, positioned by the render loop, with no React re-render.
 */
export const ringLabels: (HTMLElement | null)[] = [];

/** Intro clock: a ref holding the seconds since the scene first rendered. */
export type IntroClock = { current: number };

/** `THREE.MathUtils.damp`, or a jump straight to the target under reduced motion. */
export function ease(
  current: number,
  target: number,
  lambda: number,
  delta: number,
  instant: boolean,
): number {
  if (instant) return target;
  return current + (target - current) * (1 - Math.exp(-lambda * delta));
}
