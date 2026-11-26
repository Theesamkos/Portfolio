# PLAN — phases and progress

Work one phase at a time on its own branch (`phase/<n>-<name>`). Exact prompts and expected commits for each phase: the **Portfolio Runbook** (kept outside the repo). Tick boxes in the same commit that proves them.

## Phase 0 — Repo hygiene · Sam
- [x] Vercel project connected to `Portfolio`
- [x] Branch protection on `main` (PR required, status checks, no force push)
- [x] Dependabot alerts + security updates on
- [x] Remote URL uses `Theesamkos/Portfolio`

## Phase 1 — Foundation: scaffold, tooling, CI, security baseline
**Lesson:** quality and security gates are scaffolding, not features.
- [x] Next.js + TS strict + Turbopack + pnpm, versions verified; existing docs preserved
- [x] ESLint, Prettier, lefthook pre-commit
- [x] Vitest + Playwright smoke test
- [x] `lib/env.ts` Zod env validation with `server-only`
- [x] Security headers + report-only CSP
- [x] CI: typecheck, lint, test, build, e2e, gitleaks, audit — job `ci`
- [x] Dependabot config
- [x] CI green; Vercel preview loads
- [ ] securityheaders.com A or better — scan the production URL after merge, tick on `main` (see Handoff)

## Phase 2 — Content model + list view
**Lesson:** progressive enhancement — the list view is the real site.
- [x] Schema + ProjectId enum + 8 seeded projects; validation tests
- [x] Design tokens + fonts
- [x] UI store + tests
- [x] SSR list view (works with JS off), mobile e2e
- [x] Lighthouse mobile ≥ 90; real phone check — Lighthouse measured locally only (100 against the production build; not run on the preview); phone and Mac checks passed on the Vercel preview (Sam)

## Phase 2.5 — Visual direction: light glass
**Lesson:** design tokens are a contract; a whole look changes in one file.
**Spec:** docs/DESIGN.md + docs/design/reference-hero-light.png + reference-ring-light.png
- [x] Light glass tokens, Inter + JetBrains Mono, background glows
- [x] UI primitives: Button, Chip, GlassPanel, MonoLabel
- [x] Sticky glass nav bar (desktop + mobile)
- [x] Hero restyled: actions, resume link, contact links
- [x] Project cards as glass panels; DetailPanel with mobile bottom sheet
- [x] About section (facts from AI_GUIDE.md only)
- [x] Contrast ratio reported ≥ 4.5:1; JS-off still complete; Lighthouse mobile ≥ 90; phone check — `--ink-dim` on `--glass` 6.61:1; JS-off e2e passes; Lighthouse mobile 100 locally against the production build (not run on the preview); phone check passed on the Vercel preview (Sam)

## Phase 3 — 3D project ring
**Lesson:** the render loop — motion in useFrame on refs.
**Spec:** docs/DESIGN.md "3D scene" + the reference images
- [x] Transparent isolated renderer, lazy-loaded after first paint — `Renderer.tsx` is the only Canvas config; the scene is one lazy chunk (`next/dynamic`, `ssr: false`); e2e: mounts with no console errors, list stays if the chunk fails
- [x] Glass platform, core with halo, 8 glass panels, lighting + selective bloom — glass is a transparent physical material, not transmission (docs/DECISIONS.md); checked by eye at all three tiers, no automated visual test
- [x] Camera rig + pointer/wheel/swipe/keyboard controls + prev/next — e2e: arrows, Enter, drag, buttons; touch swipe checked by the ui-auditor in an emulated phone, not on a real one; wheel is horizontal only
- [x] Performance tiers; mobile carousel layout — tiers follow drei `PerformanceMonitor`; `?tier=` pins one; carousel below 1024px, e2e at 375px
- [x] Intro, reduced motion, live-region announcements, list/ring toggle — intro is the panels' staggered rise only: "name resolves last" and the glow fade-in are not built (the name is the LCP element); reduced motion and the announcements have e2e tests
- [x] Matches reference side by side; ~60fps laptop; JS before 3D < 150 KB gz; phone check — measured: 60 fps at every tier (Apple M5, headless Chrome, capped at 60); first-load JS +2.2 KB gz. Side-by-side comparison (screenshots in `docs/screenshots/phase-3/`) and the real phone check passed (Sam, 2026-11-26); the gaps he saw are Phase 4's scope

## Phase 4 — Polish pass on the look
**Lesson:** the last 10% is where "nice" becomes "what?!".
- [ ] Diff against the reference fixed in order of visual impact — built: near-square frosted cyan-blue panes with icon, pitch and status dot; soft glowing front edge with a pool of light on the disc; halo as an orbit; opaque sphere half behind the front panel; panel reflections on the disc (high tier); disc in frame at rest and when selected. Judged by eye from `docs/screenshots/phase-4/`, no automated visual test. Open: Sam's side-by-side verdict and real phone check
- [x] Hover/press states; ring damping tuned; detail panel motion — `pressable` utility at 150ms (e2e: button scales to 0.97 while pressed, card lifts 6px); ring on a critically damped spring (7 unit tests: 60/120Hz, no overshoot, exact rest); panel closes over 240ms (sampled: opacity 1 → 0 in about 250ms, content kept). The sheet has half and full snap points with a draggable handle (e2e)
- [x] Placeholder project icons in the reference style — 8 isometric SVGs, each under 4 KB (unit test)
- [x] Loading and no-WebGL fallback states — e2e: loading line while the chunk is delayed, note with WebGL disabled and when the chunk fails, nothing with `?view=list`
- [x] Start on the low tier when WebGL reports a software renderer — e2e on SwiftShader draws `data-tier="low"`; `?tier=` still wins; 13 unit tests for the renderer names
- [x] ui-auditor findings fixed; Lighthouse a11y ≥ 95 — audit: 0 high, 3 medium (all fixed; the focus ring has an e2e assertion, the touch-drag case has none), 7 low (4 fixed, 3 under "Later"). Lighthouse accessibility 100 on ring and list, mobile and desktop, against the production build; ring view performance 97 mobile / 100 desktop with CLS 0 after the slot fix (e2e holds layout shift under 0.1 at 1280 and 375)

## Phase 5 — AI guide
**Lesson:** grounding beats RAG here; tools drive UI; evals test prompts.
- [ ] Provider config, grounded cached prompt, Zod tools
- [ ] Rate-limited, token-capped streaming route
- [ ] Chat panel wired to ring
- [ ] `pnpm eval` ≥ 18/20; security-reviewer findings fixed

## Phase 6 — Case studies + access requests
**Lesson:** server actions keep secrets off the client.
- [ ] Static case study pages + metadata + OG images
- [ ] Request-access server action (validated, honeypot, rate-limited) + form
- [ ] No secrets in client bundle

## Phase 7 — Real assets and content (overlaps 3–6)
- [ ] All 8 projects: screenshots, verified link or video, corrected copy, honest status

## Phase 8 — Polish, enforce CSP, launch
- [ ] CSP enforced, no console errors
- [ ] Lighthouse ≥ 90 all four, mobile + desktop
- [ ] a11y pass, 404, error boundaries, analytics
- [ ] README rewritten; all three subagent reviews clean
- [ ] Launched: uptime monitors, OG preview checked, phone test by someone else

## Handoff
_(updated at the end of each session)_

**2026-11-26 — Phase 4 built on `phase/4-polish`, waiting on Sam's side-by-side verdict and phone check.** Phases 1, 2, 2.5 and 3 are merged.
- **Sam — to close Phase 4:** compare `docs/screenshots/phase-4/after-*.webp` (or the preview) with the two reference images, then on a real phone: open a project (the sheet should open at the top, at half height), drag the handle up and down, check the three panes fit the screen, and that About is gone. Then tick the first Phase 4 box.
- **Sam — the sheet opening scrolled down:** not reproduced in Chromium or WebKit phone emulation, including after scrolling, closing and reopening. A guard is in (scroll reset after the dialog opens, `preventScroll` on focus moves, always reopens at half height). Only a real phone can confirm it is gone.
- **Sam — securityheaders.com (A or better):** still open from Phase 1.
- **Layout shift in ring view, fixed:** the ring used to mount at zero height and take the list's place, which Lighthouse scored at CLS 0.44 (mobile) and 0.51 (desktop), performance 46 and 62. Its slot is now in the server HTML at full height and the list fades out under it. Lighthouse on the production build, ring view: CLS 0 on both; performance 97 mobile, 100 desktop; accessibility 100. List view: 100 / 100, CLS 0. Lighthouse ran in headless Chrome, which draws the ring in software on the low tier. The "before" figures were measured on this branch before the fix, not on `main`.
- **Checks:** typecheck and lint clean; 172 unit tests; 53 e2e tests. e2e runs WebGL in software, so it proves behavior, not speed.
- **JavaScript:** first-load scripts 187,122 → 188,358 bytes gzipped (+1.2 KB: the renderer probe, the ring's slot and its notes, the `pressable` classes), measured as the gzipped sum of the scripts in the home page's HTML — compare deltas only. About 4 KB of the 150 KB budget is left on the ui-auditor's scale. The lazy 3D chunk was not re-measured.
- **Frame rate:** 60 fps idle and turning at high, medium and low, at 1440px and 375px, on an Apple M5 in headless Chrome with the GPU on, against the production build. Capped at 60, so no headroom figure. Not measured on a mid laptop or any phone.
- **Not what the plan said:** the halo leans 6°, not 15° (the camera already looks down 9°, so it shows at about 15°); the sphere is opaque, not translucent glass; the panes have no pitch below 1024px; the first sheet snap is 55% of the screen, which on a small phone shows the title, pitch and the start of the bullets, not all three; chips have no hover state; the "before" screenshots come from the dev server (they show the dev-only tier readout). All in docs/DECISIONS.md or docs/DESIGN.md.
- **Not verified by anyone:** Safari, Firefox, a real screen reader, a real GPU other than the M5.
- **Content:** every project is `coming-soon`, posters and icons are placeholders, and real posters must not become the LCP element. Check docs/AI_GUIDE.md's eval line "agents? → software-factory/acme-invoice-agent" still reads right in Phase 5.
- **`?view=list`** keeps the ring from loading; **`?tier=high|medium|low`** pins the effects tier. A software renderer starts and stays on low, so e2e pins `?tier=high` for the one full-pipeline test. The tier readout shows in `pnpm dev` only.
- **Local setup:** `brew install gitleaks` on a new machine. `PORT=3100 pnpm e2e` if port 3000 is taken; stop any `next start` left on that port first, or Playwright reuses its old build. `pnpm exec playwright install webkit` if you want to run the phone emulation checks in WebKit.

## Later
- Code room (if source sharing allowed and repos stay private) · custom domain · "More work" grid · Spanish version
- Nav: underline the active section while scrolling · nav pill at full viewport width like the reference
- Ring: blur on the non-front panels (high tier) · trim the 315 KB 3D chunk · render on demand under reduced motion · Tab from the non-modal panel should reach the ring · "name resolves last" intro · core-to-panel light trace (Phase 5) · skip the label math on frames where the ring, camera and stage have not moved · side-pane titles are 10px at 375px and 8.5px at 320px · put the icons on the list cards
- Loading: the "3D view isn't available" note mounts already filled, so a screen reader may not announce it
- Copy: a short tagline per project (about 40 characters) for the panes, in place of the 90-character pitch
