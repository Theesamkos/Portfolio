import { dampingFor, smoothTimeFor } from "@/lib/ring";

/**
 * The scene's colors and motion durations come from the same CSS variables as the rest of the site
 * (app/globals.css). WebGL cannot read `var(--accent)`, so read the computed values
 * once when the scene mounts and pass them down.
 */
export type SceneTokens = {
  accent: string;
  accentSoft: string;
  glow: string;
  bgGlow: string;
  /** The cyan-blue of the panes' frosting. */
  glassTint: string;
  white: string;
  /** Damping rates for `ease`, from the motion tokens (docs/DESIGN.md "Motion"). */
  ringRate: number;
  /** `smoothTime` for the ring's spring (`smoothDamp`), from the same 600ms token. */
  ringSmoothTime: number;
  cameraRate: number;
  hoverRate: number;
};

/** "600ms" → 0.6. */
function seconds(duration: string): number {
  const milliseconds = Number.parseFloat(duration);
  return (Number.isFinite(milliseconds) && milliseconds > 0 ? milliseconds : 600) / 1000;
}

/** "600ms" → the damping rate that finishes a move in that time. */
function rate(duration: string): number {
  return dampingFor(seconds(duration));
}

export function readSceneTokens(): SceneTokens {
  const styles = getComputedStyle(document.documentElement);
  const token = (name: string) => styles.getPropertyValue(name).trim();
  return {
    accent: token("--accent"),
    accentSoft: token("--accent-soft"),
    glow: token("--glow"),
    bgGlow: token("--bg-glow-2"),
    glassTint: token("--glass-tint"),
    white: token("--on-accent"),
    ringRate: rate(token("--motion-ring")),
    ringSmoothTime: smoothTimeFor(seconds(token("--motion-ring"))),
    cameraRate: rate(token("--motion-camera")),
    hoverRate: rate(token("--motion-hover")),
  };
}
