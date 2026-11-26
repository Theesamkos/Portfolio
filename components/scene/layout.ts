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
  /** How far below the panels' top edge the core's center sits. */
  coreDrop: number;
  /** World width the camera must fit across the stage. */
  fitWidth: number;
  /**
   * How far in front of the ring's center that width sits. The full ring is widest at
   * the disc (0); the carousel is widest at its side panels, which stand closer to
   * the camera — measured at the center they would be cut off by the screen edge.
   */
  fitDepth: number;
  /** The camera never comes closer than this, however wide the stage is. */
  minDistance: number;
  cameraHeight: number;
  lookAtY: number;
  /** How far the camera slides right when a project is selected (ring moves left). */
  activeShift: number;
  /**
   * How much further back the camera sits while a project is selected. The detail
   * panel covers the right of the stage; sliding alone would push the disc out of the
   * left edge, so the camera also backs off until the whole disc fits beside the panel.
   */
  activeZoom: number;
  /**
   * Width of a panel's DOM label in CSS pixels, close to the front pane's width on
   * screen — so the label is mapped onto the pane at about 1:1 and its type stays
   * the size it was set in.
   */
  labelWidth: number;
};

export const FULL_LAYOUT: RingLayout = {
  compact: false,
  radius: 3.3,
  panelWidth: 1.75,
  panelHeight: 1.85,
  panelRadius: 0.12,
  platformRadius: 4.35,
  platformY: -1.2,
  coreScale: 1,
  coreDrop: 0.3,
  fitWidth: 10.2,
  fitDepth: 0,
  minDistance: 10.4,
  cameraHeight: 2.1,
  lookAtY: -1.08,
  activeShift: 3.3,
  activeZoom: 1.18,
  labelWidth: 250,
};

export const COMPACT_LAYOUT: RingLayout = {
  compact: true,
  radius: 2.2,
  panelWidth: 1.6,
  panelHeight: 1.85,
  panelRadius: 0.12,
  platformRadius: 3.1,
  platformY: -1.2,
  coreScale: 0.7,
  coreDrop: -0.25,
  fitWidth: 4.9,
  fitDepth: 1.55,
  minDistance: 8,
  cameraHeight: 1.6,
  lookAtY: 0.2,
  activeShift: 0,
  activeZoom: 1,
  labelWidth: 150,
};

/** How far the panels stand off the platform. */
export const PANEL_CLEARANCE = 0.22;

/** The panels' center height. */
export function panelCenterY(layout: RingLayout): number {
  return layout.platformY + PANEL_CLEARANCE + layout.panelHeight / 2;
}

/**
 * The core's center height. It stands at the middle of the ring, behind the front
 * panel, and the camera looks down on both — so to have the front panel cover the
 * sphere's lower half, the sphere has to sit well below the panel's top edge.
 */
export function coreCenterY(layout: RingLayout): number {
  return panelCenterY(layout) + layout.panelHeight / 2 - layout.coreDrop;
}
