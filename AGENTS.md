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
- Next.js (App Router, TypeScript strict, Turbopack), pnpm
- Tailwind CSS (2D HUD layer)
- React Three Fiber + @react-three/drei + @react-three/postprocessing — **WebGL renderer** (R3F WebGPU is alpha as of Nov 2026; keep renderer isolated in `components/scene/Renderer.tsx` for a later swap)
- Zustand (shared UI state), Zod (all schemas)
- Vercel AI SDK (guide), Anthropic by default; provider chosen in one file (`lib/guide/model.ts`)
- Upstash Redis + @upstash/ratelimit, Resend (access-request email)
- Vitest (unit), Playwright (e2e smoke), ESLint, Prettier

## Architecture (short — full version in docs/ARCHITECTURE.md)
```
app/
  page.tsx                 # SSR shell + list view (works without JS/WebGL)
  projects/[id]/page.tsx   # case study pages
  api/guide/route.ts       # AI guide: streamText + tools, rate-limited, token-capped
  actions/request-access.ts# server action → Resend email
content/projects.ts        # single source of truth, Zod-validated
lib/schema.ts              # Project schema
lib/guide/                 # model.ts, system-prompt.ts, tools.ts, evals.ts
components/hud/            # 2D overlay: panels, readouts, chat, list view
components/scene/          # R3F: Renderer, Ring, ProjectPanel, CameraRig, Effects
store/ui.ts                # Zustand: activeProjectId, filters, viewMode
```
**One store drives everything.** Ring, HUD panel, list view, and AI guide all read/write `activeProjectId` + `filters`. An AI tool call dispatches the same store action a click does.

## Commands
```
pnpm dev          # local dev
pnpm build        # production build (must pass before any PR)
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
pnpm test         # vitest
pnpm e2e          # playwright smoke
pnpm eval         # AI guide evals (run before deploying guide changes)
```

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
