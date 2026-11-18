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
- [ ] Schema + ProjectId enum + 8 seeded projects; validation tests
- [ ] Design tokens + fonts
- [ ] UI store + tests
- [ ] SSR list view (works with JS off), mobile e2e
- [ ] Lighthouse mobile ≥ 90; real phone check

## Phase 3 — 3D project ring
**Lesson:** the render loop — motion in useFrame on refs.
- [ ] Isolated renderer, lazy-loaded after first paint
- [ ] Ring + camera rig + pointer/wheel/keyboard controls
- [ ] Live-region announcements, reduced motion, list/ring toggle
- [ ] ~60fps laptop; JS before 3D < 150 KB gz; phone check

## Phase 4 — HUD look + performance tiers
**Lesson:** effects budget — measure, then step down.
- [ ] Bloom, holo material, particles
- [ ] Performance tiers per docs/DESIGN.md
- [ ] HUD overlay + detail panel + mobile bottom sheet + skippable intro
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

**2026-11-18 — Phase 1 built; one check left, done after merge.** PR #1 (`phase/1-foundation`), CI green, `ci` is a required check on `main`. Sam confirmed the Vercel preview loads and that Dependabot alerts, security updates and malware alerts are on.
- **Sam — securityheaders.com (A or better):** previews sit behind Vercel login, so the scanner can't reach them. Scan the production URL after merge, then tick the last Phase 1 box on `main`.
- **Local setup:** the pre-commit hook now runs a gitleaks secret scan and fails if gitleaks is missing — `brew install gitleaks` on any new machine.

## Later
- Code room (if source sharing allowed and repos stay private) · custom domain · "More work" grid · Spanish version
