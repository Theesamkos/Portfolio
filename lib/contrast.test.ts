import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { composite, contrastRatio, hexToRgb, parseRgba, type Rgb } from "./contrast";

/**
 * The token contract, checked: every text color must reach WCAG AA (4.5:1) on every
 * surface it is used on. The values are read from app/globals.css, so changing a
 * token there re-runs the math — nobody has to remember to.
 */

const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");

function token(name: string): string {
  const match = new RegExp(`--${name}:\\s*([^;]+);`).exec(css);
  if (!match) throw new Error(`Token --${name} not found in app/globals.css`);
  return match[1]!.trim();
}

const hex = (name: string) => hexToRgb(token(name));

function glassOver(glassToken: string, backdrop: Rgb): Rgb {
  const { color, alpha } = parseRgba(token(glassToken));
  return composite(color, alpha, backdrop);
}

const bg = hex("bg");
/** The strongest glow is the darkest thing glass ever sits on: the worst case. */
const glow = hex("bg-glow-2");

const surfaces: Record<string, Rgb> = {
  "page background": bg,
  "strongest glow": glow,
  "glass over the page": glassOver("glass", bg),
  "glass over the strongest glow": glassOver("glass", glow),
  "glass-strong over the page": glassOver("glass-strong", bg),
  "glass-strong over the strongest glow": glassOver("glass-strong", glow),
};

const AA = 4.5;

describe("design token contrast (WCAG AA)", () => {
  test("--ink-dim on --glass is about 6.6:1", () => {
    const ratio = contrastRatio(hex("ink-dim"), surfaces["glass over the page"]!);
    expect(ratio).toBeGreaterThan(6.5);
    expect(ratio).toBeLessThan(6.7);
  });

  for (const text of ["ink", "ink-dim", "accent-ink", "live-ink", "warn-ink"]) {
    for (const [surface, color] of Object.entries(surfaces)) {
      test(`--${text} on ${surface}`, () => {
        expect(contrastRatio(hex(text), color)).toBeGreaterThanOrEqual(AA);
      });
    }
  }

  test.each([
    ["on-accent", "accent"],
    ["on-accent", "accent-hover"],
    ["accent-ink", "accent-soft"],
    ["live-ink", "live-soft"],
    ["warn-ink", "warn-soft"],
    ["ink", "accent-soft"],
  ])("--%s on --%s (buttons and chips)", (text, fill) => {
    expect(contrastRatio(hex(text), hex(fill))).toBeGreaterThanOrEqual(AA);
  });

  // The ring's panes are --glass-tint under a gradient and over a moving 3D scene, so
  // this is the floor, not the whole story: the rendered panes were measured in the
  // Phase 4 ui audit, and the pitch uses --ink because --ink-dim fell short there.
  test.each(["ink", "ink-dim"])("--%s on --glass-tint (the ring's panes)", (text) => {
    expect(contrastRatio(hex(text), hex("glass-tint"))).toBeGreaterThanOrEqual(AA);
  });

  test("the base accent and status colors are not safe as small text — use the -ink shades", () => {
    for (const base of ["accent", "live", "warn"]) {
      expect(contrastRatio(hex(base), surfaces["glass over the strongest glow"]!)).toBeLessThan(AA);
    }
  });

  test("the focus ring (--accent) has 3:1 against the page", () => {
    expect(contrastRatio(hex("accent"), bg)).toBeGreaterThanOrEqual(3);
  });
});
