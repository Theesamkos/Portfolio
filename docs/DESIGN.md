# Design system — light glass

**Visual spec:** `docs/design/reference-hero-light.png` (hero + ring + open detail panel) and `docs/design/reference-ring-light.png` (ring at rest, all 8 panels). Build toward those pictures. When this file and the pictures disagree, the pictures win; update this file.

Direction: a modern, light, frosted-glass interface with one electric blue. Clean and premium, like a well-made product site, with a 3D glass project ring as the centerpiece. Futuristic through light, glass, depth and motion, not through darkness or sci-fi chrome. Original design only: no Marvel/Iron Man/JARVIS references, arc-reactor motifs, or lookalike UI.

## Principles
1. **Clarity first.** A recruiter finds the demo link in 5 seconds. Every effect must survive that test.
2. **One accent.** Electric blue means active or clickable. Nothing else is blue except the glow.
3. **Glass, not cards.** Surfaces are translucent white over a soft blue-lit background; they read as panes of glass, not boxes.
4. **Motion has a reason.** Things move to show relationships (ring → detail panel, guide → ring), never to decorate.
5. **Real text.** All copy is DOM text over the canvas, selectable and readable by screen readers.

## Tokens (CSS variables in `app/globals.css`, mapped into the Tailwind theme)

### Color
| Token | Value | Use |
|---|---|---|
| `--bg` | `#eef2f8` | page background |
| `--bg-glow-1` | `#dbe7fb` | soft radial glow top-left |
| `--bg-glow-2` | `#c9dcff` | soft radial glow behind the ring |
| `--glass` | `rgba(255,255,255,0.62)` | panel fill (with `backdrop-filter: blur(20px)`) |
| `--glass-strong` | `rgba(255,255,255,0.9)` | nav bar, detail panel (0.82 let content ghost through; the reference is near-opaque) |
| `--glass-edge` | `rgba(255,255,255,0.85)` | 1px inner highlight on glass |
| `--line` | `rgba(11,21,38,0.10)` | outer borders, dividers |
| `--ink` | `#0b1526` | headings, primary text |
| `--ink-dim` | `#4b5b73` | secondary text (passes AA on `--glass`) |
| `--accent` | `#1f6bff` | buttons, links, active states, mono labels |
| `--accent-hover` | `#1557d6` | hover/pressed |
| `--accent-ink` | `#1557d6` | accent-colored **text**: mono labels, text links, section labels |
| `--accent-soft` | `#e6efff` | chip fills, hover washes |
| `--glow` | `#7fb2ff` | 3D halo, bloom tint, poster strokes |
| `--glass-tint` | `#cdeaff` | the ring's panes: a cyan-leaning blue, so frosted glass does not read violet |
| `--live` | `#16a34a` | LIVE status dot |
| `--live-ink` / `--live-soft` | `#166534` / `#e3f5e9` | LIVE chip text / fill |
| `--warn` | `#f59e0b` | COMING SOON status dot |
| `--warn-ink` / `--warn-soft` | `#92400e` / `#fdf0d5` | COMING SOON chip text / fill |
| `--on-accent` | `#ffffff` | text on a solid accent button |

Status chips: a dot in the semantic color, mono text in its `-ink` shade, on the `-soft` fill. **LIVE** green; **VIDEO** accent; **COMING SOON** amber; **PRIVATE** / **TEAM** `--ink-dim` outline, no dot. (The reference shows LIVE in amber; we use green so status colors stay semantic.)

**Text contrast.** `--accent`, `--live` and `--warn` are for fills, dots, borders and icons only. As small text on glass they measure 4.04, 2.92 and 1.90 at worst, below WCAG AA (4.5), so text uses the `-ink` shades. `--ink-dim` on `--glass` is 6.61:1 (6.12 over the strongest glow). `lib/contrast.test.ts` computes all of these from `app/globals.css`.

**Focus ring:** 2px `--accent`, 3px offset. Not `--glow`: a focus ring needs 3:1 against the page and `--glow` has about 2:1.

Shadows: `0 1px 2px rgba(11,21,38,.06), 0 12px 40px rgba(31,107,255,.10)` on glass panels. No hard drop shadows.

### Type
- **Inter** for everything (display and body) via `next/font`. Headings weight 700–800, letter-spacing −0.02em, `text-wrap: balance`.
- **JetBrains Mono** for readouts: uppercase, 12px, letter-spacing 0.08em, color `--accent-ink` (e.g. `PROJECT 01 / 08`).
- Scale: 12 / 14 / 16 / 20 / 28 / 44 / 64 (hero name 64 desktop, 44 mobile).
- Space Grotesk (from the earlier dark spec) is gone.

### Shape
- Pills for buttons, chips and the nav bar (`border-radius: 9999px`).
- Panels `border-radius: 20px`; detail panel 24px.
- Buttons: 44px tall. Primary = solid `--accent`, white text. Secondary = 1px `--line` outline on `--glass`, `--ink` text. Icon + label, 8px gap.

## Layout (desktop, from the reference)
- **Nav bar:** sticky glass pill, 16px from top. Left: name. Center: Projects · About · Resume · Contact (anchor links). Right: "List view" (secondary) and "Contact me" (primary).
- **Hero (left column):** name (64/800), identity line in `--ink-dim` at 20–28px ("AI engineer building agentic systems that ship."), then a row: "View projects →" (primary), "Download resume" (secondary), a vertical divider, and Email · LinkedIn · GitHub text links with icons.
- **Ring (center/right, below the hero line):** the 3D scene. Under it, centered: ← button · "Drag or use ← → to explore" · → button.
- **Detail panel (right, overlays the ring's right edge when a project is active):** glass-strong, 24px radius. Top: mono `PROJECT 01 / 08`, close ×. Title 44/800. Pitch 20 `--ink-dim`. Divider. "Impact" label in accent + 3 bullets with a blue double-check icon. "Stack" label + outline chips. Status chip. Button row: Live demo (primary), Watch video, Code, Case study (secondary). Previous / Next secondary buttons are pinned to the bottom of the panel so they do not move between projects. The panel is modal in the list view (light backdrop, click outside to close) and non-modal over the ring.
- **Ask bar (bottom center, docked):** glass pill 56px tall, sparkle icon, placeholder "Ask about my work…", primary "Ask" button inside the pill on the right.

## Mobile and tablet (< 1024px)
- Nav collapses to name + List view + a menu button; Contact me moves into the menu. (The full nav does not fit on one line below about 880px.)
- Hero stacks; buttons full-width in two rows.
- Ring becomes a curved swipeable carousel across the full width (three panels visible, center one front); the glass disc and core stay but smaller.
- Detail panel becomes a bottom sheet (24px top radius) with the same content order. It has two heights: it opens at half (55% of the screen) and goes to full (92%). The handle at the top is a real button: drag it up for full, down from half to close, or press it to switch between the two. × , Esc and the backdrop also close it.
- The About section is hidden; the menu has no About link.
- Ask bar becomes a floating pill button bottom-right that opens a full-screen sheet.
- Lighter effects tier by default; the reflective floor is off.

## 3D scene (the ring)
- **Platform:** a wide glass disc with a thin bright rim and a reflection of the panels on its surface (drei `MeshReflectorMaterial` on high tier; a baked gradient "reflection" on medium and low). The whole disc stays in the stage; while a project is selected the camera slides and backs off so the disc sits beside the detail panel.
- **Core:** a glossy blue sphere at the center, half hidden behind the front panel, with a thin glowing halo ring (torus, emissive `--glow`) around it. The halo leans 6° toward the camera, which already looks down on it by about 9°, so it shows at about 15°: a thin orbit, with its far half hidden behind the sphere. The sphere is opaque and slightly rough, with a soft gradient glow behind it (docs/DECISIONS.md). On the carousel the core sits above the panel tops so the halo stays visible. It is the AI guide's presence: slow idle pulse, brighter while the guide is answering, and a light trace from the core to the matching panel when the guide calls `focusProject` (Phase 5).
- **Panels:** 8 rounded, near-square glass planes (1.75 × 1.85, 20px radius) on the ring, tilted to face the camera path. The glass is frosted: a blue tint that deepens toward the bottom, thinned on the low tier. Each shows the project's icon as a texture; the index label (`01 / 08`), a status dot in the status chip colors, the title and the pitch are DOM text laid over the pane, not texture. The pitch is `--ink`, not `--ink-dim`: over tinted glass and a moving scene the dim shade fell under 4.5:1. Below 1024px the pitch is left off (the panes are too small). Front panel: scales to 1.12, full opacity, a thin light-blue edge with a soft glow around it and a pool of light on the disc below. Others: 0.9 opacity. (Blur on the other panels is not built — see PLAN "Later".)
- **Light:** soft studio lighting, a cool key from the top-left, environment map for the glass. Bloom only on the halo and the front panel's edge: the threshold sits above lit glass and only those two are drawn brighter, so the page never looks foggy. The soft glow around the front panel and its pool on the disc are gradient textures, not bloom, so the low tier has them too.
- **Materials:** transparent `MeshPhysicalMaterial` with clearcoat on high tier; transparent `MeshStandardMaterial` on medium/low. No transmission (docs/DECISIONS.md).
- **Background:** the DOM page background shows through the transparent canvas; add a few large, very soft blue blobs as DOM gradients behind the canvas, not in WebGL.

## Motion
| Interaction | Duration | Easing |
|---|---|---|
| Ring step / snap | 600ms | a critically damped spring (`smoothDamp` in `lib/ring.ts`, in useFrame on refs): eases in, keeps a drag's speed on release, never overshoots, lands exactly on target. Not a fixed-factor lerp, which runs faster on 120Hz screens; no React state per frame |
| Camera ease to active panel | 800ms | damped |
| Detail panel open and close | 240ms | ease-out, slide 16px + fade; the sheet's height change uses the same 240ms |
| Intro | ≤ 1.2s: background glows fade in, ring panels rise 24px and fade in staggered 60ms, name resolves last. Skipped on repeat visits and under reduced motion. No "boot sequence" text. |
| Hover on panel or card | 150ms | lift 6px, edge glow (3D panel) / accent edge (list card) |
| Hover and press on controls | 150ms | colors ease on hover; the control scales to 0.97 while pressed (`pressable` utility). Chips are labels and have neither |
`prefers-reduced-motion`: no auto-rotate, no intro, instant camera moves, no stagger.

## Performance tiers (drei `PerformanceMonitor`)
| Tier | Reflection | Glass material | Bloom | DPR |
|---|---|---|---|---|
| High | on | physical, clearcoat | on | up to 2 |
| Medium | off (baked) | standard | on (half res) | up to 1.5 |
| Low | off (baked) | standard | off | 1 |

Below 1024px the ceiling is Medium. When WebGL reports a software renderer (SwiftShader, llvmpipe, a software rasterizer) the ring starts on Low and stays there. `?tier=high|medium|low` pins a tier for testing.

The ring's slot is in the page from the first paint at the ring's full height, with the list below it. While the scene loads, the slot shows a small "Loading 3D view" line; when the scene is ready it appears in the slot and the list fades out underneath, so nothing on screen moves. Without WebGL, or if the scene fails, the slot collapses to a one-line note above the list. A visitor who was already reading the list when the scene arrived keeps the list, and the slot offers a "Show the 3D ring" button.

## Project art
Each project needs a simple 3D-feeling icon in the reference's style (isometric glass layers, a lens, a network, a wave). Until real art exists, each project has a generated isometric icon, `public/projects/<id>/icon.svg`, in the accent blues (stacked layers, tile grid, network, lens, pose figure, bars, map pin and route, document and check). Phase 7 replaces them. Posters are `public/projects/<id>/poster.webp`, 1600×1000.

## Dark variant (later, optional)
The same layout works on a deep navy background with the same accent (see the second reference image, but blue instead of pink). If added, it follows `prefers-color-scheme` and lives entirely in tokens. Light is the default and the launch target.
