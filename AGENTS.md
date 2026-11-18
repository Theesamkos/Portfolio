# AGENTS.md — portfolio

Source of truth for any AI coding agent (Claude Code, Cursor, others) working in this repo. Keep it current in the same commit as any change that affects it.

## What this is
Samuel Orth's portfolio: a futuristic holographic-HUD site where visitors browse 8 featured projects on a rotating 3D ring, open case studies, see live demos/videos/code links, and ask an AI guide questions that drive the 3D view through tool calls.

- **Audience:** recruiters, hiring managers, founders. They give it 30–60 seconds, often on a phone.
- **Win condition:** "what?!" in the first 10 seconds, everything they need in 60.
- **Deploy target:** Vercel. Repo: `portfolio`.

Read next, as needed: `docs/PRD.md` (what), `docs/ARCHITECTURE.md` (how), `docs/DESIGN.md` (look), `docs/AI_GUIDE.md` (guide rules), `docs/CONTENT.md` (projects data), `docs/PLAN.md` (phases + progress), `docs/DECISIONS.md` (why), `SECURITY.md`.

## Non-negotiables
1. **Original IP only.** HUD/holographic aesthetic is fine. No Marvel/Iron Man/JARVIS names, logos, sounds, arc reactors, or likenesses anywhere (code, copy, assets, comments).
2. **Speed is a feature.** LCP < 2.5s, interactive < 3s on a mid laptop, 60fps on the ring. 3D loads after first paint.
3. **Progressive enhancement.** The server-rendered list view is the real site and works with JS off. 3D sits on top.
4. **Mobile is first-class.** Effects tiers by measured performance (drei `PerformanceMonitor`), not screen size. Honor `prefers-reduced-motion`.
5. **Accessible.** Keyboard-operable ring (←/→/Enter), visible focus, ARIA labels, real DOM text (never text baked into textures). Lighthouse a11y ≥ 95.
6. **No secrets client-side.** API keys only in server code and Vercel env vars. Never `NEXT_PUBLIC_` a secret.
7. **Every LLM endpoint is capped.** Rate limit + max output tokens + provider spend limit.
8. **Honesty.** Copy and the AI guide only state what's in `content/` and `docs/AI_GUIDE.md`. No invented metrics, degrees, or skills.

## Stack (verify current stable versions with `npm view <pkg> version` before installing — never trust versions from memory)
- Next.js 16 (App Router, TypeScript strict, Turbopack, Cache Components on), pnpm 10 (pinned in `packageManager`), Node 22 (`.nvmrc`)
- TypeScript **6.0.x** — not 7 yet: typescript-eslint doesn't support it (see docs/DECISIONS.md)
- Tailwind CSS 4 (2D HUD layer), loaded through the `@tailwindcss/turbopack` loader in `next.config.ts` — there is no PostCSS config
- React Three Fiber + @react-three/drei + @react-three/postprocessing — **WebGL renderer** (R3F WebGPU is alpha as of Nov 2026; keep renderer isolated in `components/scene/Renderer.tsx` for a later swap)
- Zustand (shared UI state), Zod (all schemas)
- Vercel AI SDK (guide), Anthropic by default; provider chosen in one file (`lib/guide/model.ts`)
- Upstash Redis + @upstash/ratelimit, Resend (access-request email)
- Vitest (unit, `*.test.ts(x)` next to the code), Playwright (e2e smoke in `e2e/`, runs against the production build), ESLint 10 flat config, Prettier, lefthook pre-commit

## Architecture (short — full version in docs/ARCHITECTURE.md)
```
app/
  page.tsx                 # SSR shell + list view (works without JS/WebGL)
  projects/[id]/page.tsx   # case study pages
  api/guide/route.ts       # AI guide: streamText + tools, rate-limited, token-capped
  actions/request-access.ts# server action → Resend email
  fonts.ts                 # next/font (Inter, Space Grotesk, JetBrains Mono) → CSS variables
  globals.css              # design tokens + Tailwind 4 @theme — the only place colors/type are defined
content/projects.ts        # single source of truth, Zod-validated; exports ProjectId + projectIdSchema
lib/schema.ts              # Project schema + cross-field rules (no dead or private links)
lib/site.ts                # name, identity line, contact links (facts from docs/AI_GUIDE.md)
lib/env.schema.ts          # pure Zod env parser; next.config.ts runs it so a bad env fails the build
lib/env.ts                 # `server-only` + parsed env — the only way app code reads env vars
lib/security-headers.ts    # response headers + CSP (enforced subset, full policy report-only)
lib/guide/                 # model.ts, system-prompt.ts, tools.ts, evals.ts
components/hud/            # 2D overlay: panels, readouts, chat, list view (Hero, ProjectList, ProjectCard, Poster, StatusChip)
components/scene/          # R3F: Renderer, Ring, ProjectPanel, CameraRig, Effects
store/ui.ts                # Zustand: activeProjectId, filters, viewMode
e2e/                       # Playwright smoke tests
.github/workflows/ci.yml   # job `ci`: secret scan, audit, typecheck, lint, format, test, build, e2e
```
As of Phase 2 everything exists except `app/projects/[id]`, `app/api/guide`, `app/actions`, `lib/guide/` and `components/scene/` — those arrive in later phases.

**LCP is hero text.** Posters never get `preload`/eager loading; placeholders are inline SVG and real posters are lazy images. `e2e/home.spec.ts` fails if the LCP element is an image or outside the hero.
**Project ids:** use the `ProjectId` type (derived from `content/projects.ts`), never a bare `string`.
**Store:** `store/ui.ts` is a module singleton — import it only from client components. Server Components read `content/projects.ts` directly.

**Env vars:** add each new variable to `.env.example` (name only) and to `serverEnvSchema` in `lib/env.schema.ts` as optional; add it to `requiredInProduction` in the phase that first uses it. Never read `process.env` directly in app code.

**CSP:** when a feature needs a new source (fonts, analytics, the guide's streaming), add it to `reportOnlyCsp` in `lib/security-headers.ts` in the same commit. The e2e suite fails on console errors.
**One store drives everything.** Ring, HUD panel, list view, and AI guide all read/write `activeProjectId` + `filters`. An AI tool call dispatches the same store action a click does.

## Commands
```
pnpm dev          # local dev
pnpm build        # production build (must pass before any PR)
pnpm typecheck    # next typegen && tsc --noEmit
pnpm lint         # eslint .
pnpm format       # prettier --write . (format:check in CI)
pnpm test         # vitest run (test:watch for watch mode)
pnpm e2e          # playwright smoke; builds first locally (first time: pnpm exec playwright install chromium)
pnpm eval         # AI guide evals — placeholder until Phase 5
```
`pnpm install` also installs the lefthook pre-commit hook (prettier + eslint on staged files, typecheck when TS changes).

## Conventions
- TypeScript strict; no `any` without a comment explaining why.
- Server Components by default; `"use client"` only where needed (scene, chat, interactive HUD).
- Animation in `useFrame` on refs — never drive per-frame motion through React state.
- Colors, spacing, motion durations come from design tokens (`docs/DESIGN.md`), not ad-hoc values.
- Small commits, Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`).
- New dependency = one line in the PR saying why, and an entry in `docs/DECISIONS.md` if it's architectural.

## Definition of done (every task)
- `pnpm typecheck && pnpm lint && pnpm test && pnpm build` pass — show the output.
- UI change: checked in the browser at desktop and 375px width; keyboard path works.
- Acceptance criteria for the current phase in `docs/PLAN.md` met and ticked.
- Docs updated if behavior or architecture changed.

## Ask before
Adding a paid service, changing the stack, deleting a feature, changing the visual direction, touching `SECURITY.md` rules, or exposing any private repo content.

## Glossary
- **Ring** — the 3D carousel of project panels.
- **HUD** — the 2D overlay (brackets, readouts, detail panel, chat).
- **Guide** — the AI assistant; its tools drive the ring.
- **List view** — the plain, SSR, no-3D view of all projects.
- **v1 / v2** — v1 = project shown with best existing demo; v2 = project fully polished (see docs/CONTENT.md).
