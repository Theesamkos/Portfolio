/**
 * Sizes and positions for the ring, in world units. Two layouts (docs/DESIGN.md):
 * the full ring from 1024px, and below that a curved carousel — same scene, closer
 * camera, three panels across, smaller platform and core.
 */
export type RingLayout = {
  compact: boolean;
  /** Distance from the ring's center to each panel. */
  radius: number;
  panelWidth: number;
  panelHeight: number;
  /** Corner radius: 20px on a panel that is about 240px wide on screen. */
  panelRadius: number;
  platformRadius: number;
  platformY: number;
  coreScale: number;
  /** World width the camera must fit across the stage. */
  fitWidth: number;
  /** The camera never comes closer than this, however wide the stage is. */
  minDistance: number;
  cameraHeight: number;
  lookAtY: number;
  /** How far the camera slides right when a project is selected (ring moves left). */
  activeShift: number;
  /**
   * Width of a panel's DOM label in CSS pixels, close to the front pane's width on
   * screen — so the label is mapped onto the pane at about 1:1 and its type stays
   * the size it was set in.
   */
  labelWidth: number;
};

export const FULL_LAYOUT: RingLayout = {
  compact: false,
  radius: 3.1,
  panelWidth: 1.45,
  panelHeight: 1.85,
  panelRadius: 0.12,
  platformRadius: 4.4,
  platformY: -1.2,
  coreScale: 1,
  fitWidth: 9.8,
  minDistance: 10,
  cameraHeight: 2.4,
  lookAtY: -0.75,
  activeShift: 1.7,
  labelWidth: 210,
};

export const COMPACT_LAYOUT: RingLayout = {
  compact: true,
  radius: 2.5,
  panelWidth: 1.45,
  panelHeight: 1.85,
  panelRadius: 0.12,
  platformRadius: 3.1,
  platformY: -1.2,
  coreScale: 0.7,
  fitWidth: 4.9,
  minDistance: 8.5,
  cameraHeight: 1.6,
  lookAtY: 0.2,
  activeShift: 0,
  labelWidth: 150,
};

/** How far the panels stand off the platform. */
export const PANEL_CLEARANCE = 0.22;

/** The panels' center height; the core's center sits level with their top edge. */
export function panelCenterY(layout: RingLayout): number {
  return layout.platformY + PANEL_CLEARANCE + layout.panelHeight / 2;
}
