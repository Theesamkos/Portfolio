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
- [ ] Light glass tokens, Inter + JetBrains Mono, background glows
- [ ] UI primitives: Button, Chip, GlassPanel, MonoLabel
- [ ] Sticky glass nav bar (desktop + mobile)
- [ ] Hero restyled: actions, resume link, contact links
- [ ] Project cards as glass panels; DetailPanel with mobile bottom sheet
- [ ] About section (facts from AI_GUIDE.md only)
- [ ] Contrast ratio reported ≥ 4.5:1; JS-off still complete; Lighthouse mobile ≥ 90; phone check

## Phase 3 — 3D project ring
**Lesson:** the render loop — motion in useFrame on refs.
**Spec:** docs/DESIGN.md "3D scene" + the reference images
- [ ] Transparent isolated renderer, lazy-loaded after first paint
- [ ] Glass platform, core with halo, 8 glass panels, lighting + selective bloom
- [ ] Camera rig + pointer/wheel/swipe/keyboard controls + prev/next
- [ ] Performance tiers; mobile carousel layout
- [ ] Intro, reduced motion, live-region announcements, list/ring toggle
- [ ] Matches reference side by side; ~60fps laptop; JS before 3D < 150 KB gz; phone check

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

**2026-11-18 — Phase 2 complete on `phase/2-content-list` (PR #2).** Phase 1 merged (PR #1).
- **Lighthouse:** local run against the production build scores 100 / 100 / 100 / 100 (performance / a11y / best practices / SEO). It was not run on the Vercel preview; Sam accepted the local result.
- **Phone and Mac check:** passed on the Vercel preview (Sam).
- **Sam — securityheaders.com (A or better):** still open from Phase 1. Scan the production URL, then tick the last Phase 1 box.
- **Draft copy:** every `bullets`, `tags` and `stack` value in `content/projects.ts` is a draft with no metrics; Phase 7 replaces them from each repo. Sentinel Six team wording still needs the team's OK.
- **Placeholders:** `assets.poster` points at generated SVGs (`public/projects/<id>/poster.svg`), not the `poster.webp` in docs/CONTENT.md; the list view draws the same ring inline (`components/hud/Poster.tsx`) instead of requesting them. All 8 projects are `coming-soon`; the 4 public repos link to GitHub.
- **LCP:** fixed in `fix(perf)`. The first poster was the LCP element (2.7s simulated slow 4G). Placeholders are now inline SVG, the hero text is the LCP element, and local Lighthouse mobile reports LCP 0.8s. Two e2e tests fail if the LCP element is an image or sits outside the hero.
- **Phase 7 watch-out:** real posters load as lazy images with no priority. The first card's poster is inside the phone viewport today, so re-run Lighthouse when the first real poster lands (the ring will sit above the list by then).
- **ui-auditor:** no critical or high findings; one medium (mobile layout shift, now 0) and five low, all fixed in `fix(list): address ui audit findings`.
- **Phase 3 risk:** the page already ships about 141 KB gzipped of framework JS against the 150 KB "JS before 3D" budget (ui-auditor's measurement). The store, toggle and lazy loader must fit in about 9 KB, or the budget needs a logged decision.
- **Local setup:** the pre-commit hook runs a gitleaks secret scan and fails if gitleaks is missing — `brew install gitleaks` on any new machine.

## Later
- Code room (if source sharing allowed and repos stay private) · custom domain · "More work" grid · Spanish version
