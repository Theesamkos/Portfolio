/**
 * The bottom sheet's snap points — pure, so the decision is unit-tested. The detail
 * panel (components/hud/DetailPanel.tsx) is a sheet below 1024px: it opens at `half`
 * and a drag on its handle takes it to `full`, back to `half`, or closed.
 */
export type SheetSnap = "half" | "full";

/** Each snap point's height, as a fraction of the viewport height. */
export const SHEET_HEIGHT: Record<SheetSnap, number> = { half: 0.55, full: 0.92 };

/** How far ahead a flick is projected, in seconds: fast drags carry past where the finger left. */
const FLICK_LOOKAHEAD = 0.15;

/**
 * Where the sheet settles when the finger lifts.
 *
 * @param height   the sheet's height at release, as a fraction of the viewport
 * @param velocity how fast it was changing, in viewport heights per second
 *                 (positive = growing, the finger moving up)
 */
export function snapAfterDrag(height: number, velocity: number): SheetSnap | "closed" {
  const projected = height + velocity * FLICK_LOOKAHEAD;
  // Under 60% of the half height reads as "put it away".
  if (projected < SHEET_HEIGHT.half * 0.6) return "closed";
  return projected < (SHEET_HEIGHT.half + SHEET_HEIGHT.full) / 2 ? "half" : "full";
}
