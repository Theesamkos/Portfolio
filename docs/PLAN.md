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
- [ ] Matches reference side by side; ~60fps laptop; JS before 3D < 150 KB gz; phone check — measured: 60 fps at every tier (Apple M5, headless Chrome, capped at 60); first-load JS +2.2 KB gz. Open: Sam's side-by-side verdict (screenshots in `docs/screenshots/phase-3/`) and the real phone check

## Phase 4 — Polish pass on the look
**Lesson:** the last 10% is where "nice" becomes "what?!".
- [ ] Diff against the reference fixed in order of visual impact
- [ ] Hover/press states; ring damping tuned; detail panel motion; core-to-panel trace
- [ ] Placeholder project icons in the reference style
- [ ] Loading and no-WebGL fallback states
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

**2026-11-24 — Phase 3 built on `phase/3-ring`, waiting on Sam's reference and phone checks.** Phases 1, 2 and 2.5 are merged.
- **Sam — to close Phase 3:** compare `docs/screenshots/phase-3/` (or the preview) with the two reference images, and try the ring on a real phone: swipe, tap the front panel, the bottom sheet, "List view". Then tick the last box.
- **Sam — securityheaders.com (A or better):** still open from Phase 1.
- **Checks:** typecheck and lint clean; 145 unit tests; 43 e2e tests (15 for the ring). e2e runs WebGL in software, so it proves behavior, not speed.
- **JavaScript:** first-load scripts 184,833 → 187,122 bytes gzipped (+2.2 KB: the loader, its error boundary, the nav toggle), same measuring method as Phase 2.5 — compare deltas only. That is inside the ~5 KB left of the 150 KB budget on the ui-auditor's scale; the budget was not raised. The lazy 3D chunk is 315 KB gzipped, untrimmed.
- **Frame rate:** 60 fps idle and turning at high, medium and low, at 1440px and 375px, on an Apple M5 in headless Chrome with the GPU on. Headless caps at 60, so this shows no tier drops frames here, not how much headroom there is. Not measured on a mid laptop or any phone.
- **Not what the plan said:** panel labels are plain DOM moved by the render loop, not drei `Html` (its first instance mounted empty); no transmission material; bloom needed a custom alpha fix and has `mipmapBlur` off; only a horizontal wheel turns the ring; the ring replaces the list only if the visitor is not already using it. All in docs/DECISIONS.md.
- **Content:** ring order changed (Acme Invoice Agent is now 8, left of the front panel at rest). Acme's bullets come from its repo; "Human-in-the-loop" is gone because the repo has no human approval step, and the database is SQLite, not PostgreSQL. Check docs/AI_GUIDE.md's eval line "agents? → software-factory/acme-invoice-agent" still reads right in Phase 5.
- **ui-auditor:** 3 high, 5 medium, 8 low. All high and medium fixed with e2e tests; low fixed except the ones under "Later". Not verified by anyone: Safari, Firefox, a real screen reader.
- **Known gaps against the reference (Phase 4):** placeholder art on every panel, no pitch line or status dot on panels, the left panel's title is clipped at 375px, the ask bar (Phase 5).
- **`?view=list`** keeps the ring from loading (the list e2e tests use it); **`?tier=high|medium|low`** pins the effects tier. The tier readout shows in `pnpm dev` only.
- **Draft copy, placeholders, Phase 7 watch-out:** unchanged from Phase 2.5 — every project is `coming-soon`, posters are placeholders, and real posters must not become the LCP element.
- **Local setup:** `brew install gitleaks` on a new machine. `PORT=3100 pnpm e2e` if port 3000 is taken.

## Later
- Code room (if source sharing allowed and repos stay private) · custom domain · "More work" grid · Spanish version
- Nav: underline the active section while scrolling · bottom sheet: drag the handle to dismiss · nav pill at full viewport width like the reference
- Ring: blur on the non-front panels (high tier) · pitch line and status dot on panels · trim the 315 KB 3D chunk · render on demand under reduced motion · Tab from the non-modal panel should reach the ring · "name resolves last" intro · core-to-panel light trace (Phase 5)
