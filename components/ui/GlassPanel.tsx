import type { HTMLAttributes } from "react";

/**
 * A pane of glass (docs/DESIGN.md): translucent white fill, hairline border, 1px
 * inner highlight and the soft blue shadow. The styles live in the `glass` utilities
 * in app/globals.css; this component picks them.
 *
 * - `strong`: the denser fill for surfaces that sit over other content.
 * - `blur`: frost what is behind the pane. On by default. Turn it off for panes
 *   that only ever sit on the page background — blur is the expensive part.
 * - `radius`: `panel` 20px, `sheet` 24px, `pill` for bars.
 */

const radii = {
  panel: "rounded-panel",
  sheet: "rounded-sheet",
  pill: "rounded-full",
} as const;

type GlassPanelProps = {
  as?: "div" | "article" | "section" | "aside" | "header" | "nav" | "li";
  strong?: boolean;
  blur?: boolean;
  radius?: keyof typeof radii;
} & HTMLAttributes<HTMLElement>;

export function GlassPanel({
  as: Tag = "div",
  strong = false,
  blur = true,
  radius = "panel",
  className = "",
  ...props
}: GlassPanelProps) {
  const classes = [
    strong ? "glass-strong" : "glass",
    blur ? "glass-blur" : "",
    radii[radius],
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return <Tag className={classes} {...props} />;
}
