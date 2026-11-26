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
- [ ] Diff against the reference fixed in order of visual impact
- [ ] Hover/press states; ring damping tuned; detail panel motion
- [ ] Placeholder project icons in the reference style
- [ ] Loading and no-WebGL fallback states
- [ ] Start on the low tier when WebGL reports a software renderer
- [ ] ui-auditor findings fixed; Lighthouse a11y ≥ 95

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

**2026-11-26 — Phase 4 started on `phase/4-polish`.** Phases 1, 2, 2.5 and 3 are merged.
- **Phase 3 is closed:** Sam compared the ring with the two reference images and tried it on a real phone on 2026-11-26; both passed.
- **Phase 4 plan:** panels first (near-square proportions, frosted blue-tinted fill, a soft glowing edge that spills onto the disc, then icon + pitch + status dot), then the halo and core, the platform reflection, the low tier for software renderers, the phone fixes (About hidden below 1024px, the sheet opens at the top with half and full snap points), hover and press states, ring damping, loading and no-WebGL states, and the ui-auditor pass.
- **Decided:** the core-to-panel light trace is Phase 5 work (the guide drives it), so it is off the Phase 4 checklist. Starting on the low tier for software renderers moved from "Later" into Phase 4.
- **Sam — securityheaders.com (A or better):** still open from Phase 1.
- **Baseline from Phase 3:** 145 unit tests; 43 e2e tests (15 for the ring); first-load scripts 187,122 bytes gzipped, with about 5 KB of the 150 KB budget left on the ui-auditor's scale; the lazy 3D chunk is 315 KB gzipped; 60 fps at every tier on an Apple M5 in headless Chrome (capped at 60, so no headroom figure). Not measured on a mid laptop or any phone. e2e runs WebGL in software, so it proves behavior, not speed.
- **Known gaps against the reference at the start of Phase 4:** placeholder art on every panel, no pitch line or status dot on panels, washed-out side panels, a flat halo, the sphere sitting above the panels, no visible reflection on the disc, the left panel clipped at 375px. The ask bar is Phase 5.
- **Not verified by anyone:** Safari, Firefox, a real screen reader.
- **Content:** every project is `coming-soon`, posters are placeholders, and real posters must not become the LCP element. Check docs/AI_GUIDE.md's eval line "agents? → software-factory/acme-invoice-agent" still reads right in Phase 5.
- **`?view=list`** keeps the ring from loading (the list e2e tests use it); **`?tier=high|medium|low`** pins the effects tier. The tier readout shows in `pnpm dev` only.
- **Local setup:** `brew install gitleaks` on a new machine. `PORT=3100 pnpm e2e` if port 3000 is taken.

## Later
- Code room (if source sharing allowed and repos stay private) · custom domain · "More work" grid · Spanish version
- Nav: underline the active section while scrolling · bottom sheet: drag the handle to dismiss · nav pill at full viewport width like the reference
- Ring: blur on the non-front panels (high tier) · pitch line and status dot on panels · trim the 315 KB 3D chunk · render on demand under reduced motion · Tab from the non-modal panel should reach the ring · "name resolves last" intro · core-to-panel light trace (Phase 5)
