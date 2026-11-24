/**
 * The scene's colors come from the same CSS variables as the rest of the site
 * (app/globals.css). WebGL cannot read `var(--accent)`, so read the computed values
 * once when the scene mounts and pass them down.
 */
export type SceneTokens = {
  accent: string;
  accentSoft: string;
  glow: string;
  bgGlow: string;
  white: string;
};

export function readSceneTokens(): SceneTokens {
  const styles = getComputedStyle(document.documentElement);
  const token = (name: string) => styles.getPropertyValue(name).trim();
  return {
    accent: token("--accent"),
    accentSoft: token("--accent-soft"),
    glow: token("--glow"),
    bgGlow: token("--bg-glow-2"),
    white: token("--on-accent"),
  };
}
