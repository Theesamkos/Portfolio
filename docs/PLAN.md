# PLAN — phases and progress

Work one phase at a time on its own branch (`phase/<n>-<name>`). Exact prompts and expected commits for each phase: the **Portfolio Runbook** (kept outside the repo). Tick boxes in the same commit that proves them.

## Phase 0 — Repo hygiene · Sam
- [ ] Vercel project connected to `Portfolio`
- [ ] Branch protection on `main` (PR required, status checks, no force push)
- [ ] Dependabot alerts + security updates on
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
- [ ] CI green; securityheaders.com A or better on preview — CI is green on PR #1; the preview does not deploy yet (see Handoff)

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

**2026-11-18 — Phase 1 built, not yet accepted.** PR #1 (`phase/1-foundation`), CI green.
- **Blocker:** the Vercel preview fails after a successful build with `No Output Directory named "public"`. The Vercel project's Framework Preset is not Next.js (it was created before the app existed). Fix: set the preset to Next.js in Project Settings, or add `vercel.json` with `"framework": "nextjs"`.
- **Then (Sam):** confirm the preview loads; scan it on securityheaders.com (A or better); add the `ci` status check to the `protect-main` ruleset.
- **Open from the security review:** no local secret scan before push (repo is public); `.gitignore` misses `.envrc` and `*.env`; `.claude/settings.json` allows `git commit --no-verify`.
- **Not done:** `serverEnvSchema` has no real variables yet — the names in `.env.example` still need adding (as optional) to `lib/env.schema.ts`.

## Later
- Code room (if source sharing allowed and repos stay private) · custom domain · "More work" grid · Spanish version
