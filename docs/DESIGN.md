# Design system — holographic HUD

Direction: a calm, high-end command interface. Think aerospace HUD and mission control, not a movie prop. Original design only — no Marvel/Iron Man/JARVIS references, arc-reactor motifs, or lookalike UI.

## Principles
1. **Clarity first, spectacle second.** Every effect must survive "can a recruiter find the demo link in 5 seconds?"
2. **One accent.** Cyan carries meaning (active, interactive). Everything else is quiet.
3. **Motion has purpose.** Things move to show relationships (ring → panel), not to decorate.
4. **Real text.** All copy is DOM text over the canvas, selectable and readable by screen readers.

## Tokens (define in `app/globals.css` as CSS variables + Tailwind theme)
| Token | Value | Use |
|---|---|---|
| `--bg` | `#05080f` | page background |
| `--bg-glow` | `#0b1a2e` | radial glow behind ring |
| `--panel` | `rgba(12, 22, 38, 0.72)` | HUD panels (with backdrop blur) |
| `--line` | `rgba(110, 200, 255, 0.22)` | borders, brackets, grid |
| `--accent` | `#3fd0ff` | active / interactive |
| `--accent-2` | `#7cf5d4` | secondary highlights (sparingly) |
| `--warn` | `#ffcc66` | coming-soon / status |
| `--ink` | `#e8f1fb` | primary text |
| `--ink-dim` | `#8aa0b8` | secondary text |

Contrast: body text on panels must pass WCAG AA (check `--ink-dim` on `--panel`).

## Type
- Display: a geometric sans (e.g. "Space Grotesk" or "Sora") via `next/font`
- Body/UI: "Inter" via `next/font`
- Data readouts: a mono (e.g. "JetBrains Mono"), uppercase, letter-spacing 0.08em, small sizes
- Scale: 12 / 14 / 16 / 20 / 28 / 44 / 64

## HUD elements
- Corner brackets on panels (2px, `--line`, accent on active)
- Readout rows: `LABEL ··········· VALUE` in mono
- Thin scan line sweep on panel open (≤ 400ms, once)
- Status chips: LIVE (accent), VIDEO (accent-2), COMING SOON (warn), PRIVATE / TEAM (ink-dim outline)

## 3D look
- 8 glass-like panels on a ring, slight tilt, fresnel edge glow
- Bloom on emissive edges only (threshold high)
- Sparse particle field / depth grid for scale
- Active panel: brighter edge, slight scale-up, others dim to 40%

## Motion
| Interaction | Duration | Easing |
|---|---|---|
| Ring step | 600ms | damped (useFrame lerp) |
| Camera fly-to | 800ms | damped |
| Panel open | 250ms | ease-out |
| Intro | ≤ 1.5s total, skippable, skipped on repeat visits | — |
`prefers-reduced-motion`: no auto-rotate, no intro, instant camera moves, no scan sweep.

## Performance tiers (drei PerformanceMonitor)
| Tier | Bloom | Particles | DPR |
|---|---|---|---|
| High | on | 2000 | up to 2 |
| Medium | on (lower res) | 800 | 1.5 |
| Low | off | 200 | 1 |

## Layout
- Desktop: ring center, HUD detail panel right, guide bottom-left (collapsible), contact top-right
- Mobile (< 768px): ring top half, detail panel as bottom sheet, guide as full-screen sheet from a floating button
- 16px minimum side gutter, no horizontal scroll
