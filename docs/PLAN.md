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
- [ ] Contrast ratio reported ≥ 4.5:1; JS-off still complete; Lighthouse mobile ≥ 90; phone check — first three proven (`--ink-dim` on `--glass` 6.61:1; JS-off e2e passes; Lighthouse mobile 100 locally against the production build). **Phone check is open (Sam)**; tick after it.

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

**2026-11-24 — Phase 2.5 built on `phase/2.5-visual`; one box open (phone check, Sam).** Phases 1 and 2 are merged.
- **Sam — phone check:** on the Vercel preview, check the nav menu, a card tap (bottom sheet opens, page behind does not scroll, Previous / Next, close), and scrolling smoothness. Then tick the last Phase 2.5 box. Not tested here: Safari, Firefox, a real screen reader, a real touch device.
- **Sam — securityheaders.com (A or better):** still open from Phase 1. Scan the production URL, then tick the last Phase 1 box.
- **Checks:** typecheck and lint clean; 118 unit tests; 28 e2e tests (run three times in a row). Lighthouse mobile, local production build: 100 / 100 / 100 / 100, LCP 0.9s, CLS 0. Not run on the preview.
- **Contrast:** `--ink-dim` on `--glass` is 6.61:1 (6.12:1 over the strongest glow). The spec's `--accent`, `--live` and `--warn` fail AA as small text, so text uses `--accent-ink`, `--live-ink` and `--warn-ink`. `lib/contrast.test.ts` computes every pair from `app/globals.css`.
- **Changed from the approved plan after the ui audit:** the detail panel is modal in the list view at every width (it covered the right card column while focus could move underneath); it is non-modal only when `viewMode === "ring"` on desktop, so Phase 3 gets the behavior it needs by setting the view mode. The side-panel and full-nav layouts start at 1024px, not 768px. Card blur is off. `--glass-strong` is 0.9, not 0.82. All four are in docs/DECISIONS.md or docs/DESIGN.md.
- **ui-auditor:** no critical; 2 high, 4 medium, 5 low — all fixed in `fix(a11y): address ui audit findings` except one judgement call left as is: the reference nav pill runs nearly the full viewport width, ours is capped to the 72rem content column.
- **Resume:** `public/resume.pdf` exists, so "Download resume" and the nav's Resume link point at it (no LinkedIn fallback needed).
- **Identity line** is now "AI engineer building agentic systems that ship." (from the reference). docs/AI_GUIDE.md still describes the role in its own words; no fact changed.
- **JavaScript:** the page's scripts went from 176.3 KB to 180.2 KB gzipped (+3.9 KB: Zustand, the detail panel, the card trigger, the menu closer), measured by fetching every script the HTML references. That method reads higher than the ui-auditor's 141 KB from Phase 2, so compare deltas only. **Phase 3 risk stands:** about 5 KB is left of the 150 KB "JS before 3D" budget on the auditor's scale, or the budget needs a logged decision.
- **"List view"** in the nav is a link to `#projects`. Phase 3 turns it into the ring/list toggle.
- **Screenshots:** before/after at 1280 and 375 plus the open panel are in `docs/screenshots/phase-2.5/` (WebP, each under 200 KB).
- **Draft copy:** every `bullets`, `tags` and `stack` value in `content/projects.ts` is a draft with no metrics; Phase 7 replaces them from each repo. The detail panel shows `skills` because `stack` is mostly empty. Sentinel Six team wording still needs the team's OK.
- **Placeholders:** posters are inline SVG placeholders (`components/hud/Poster.tsx`); all 8 projects are `coming-soon`; the 4 public repos link to GitHub.
- **Phase 7 watch-out:** real posters load as lazy images with no priority. Re-run Lighthouse when the first real poster lands; two e2e tests fail if the LCP element is an image or sits outside the hero.
- **Local setup:** the pre-commit hook runs a gitleaks secret scan and fails if gitleaks is missing — `brew install gitleaks` on any new machine.

## Later
- Code room (if source sharing allowed and repos stay private) · custom domain · "More work" grid · Spanish version
- Nav: underline the active section while scrolling · bottom sheet: drag the handle to dismiss · nav pill at full viewport width like the reference
