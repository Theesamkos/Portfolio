# PLAN — phases and progress

Work one phase at a time. Each phase ends deployed. Tick boxes in the same commit that meets them. Full plan with timeline and risks lives in Sam's Claude doc "Portfolio Build — Master Plan".

## Phase 0 — Setup (hour 0–1) · Sam
- [ ] Repo `portfolio` on GitHub, connected to a Vercel project
- [ ] LLM API key created, monthly spend limit set at the provider
- [ ] Upstash Redis (free) + Resend account created
- [ ] Env vars added in Vercel (see `.env.example`), and in local `.env.local`

## Phase 1 — Scaffold, data, list view (hours 1–3)
**Lesson:** progressive enhancement — the list view is the real site.
**Note:** this folder already has docs. Scaffold Next.js in a temp folder and move it in, or init manually — don't overwrite README.md, .gitignore, AGENTS.md, CLAUDE.md, docs/, .claude/.
- [ ] Next.js + TS strict + Tailwind + Zod + Zustand + Vitest + ESLint/Prettier, versions verified
- [ ] `lib/schema.ts` + `content/projects.ts` seeded from docs/CONTENT.md
- [ ] Schema validation test passes
- [ ] SSR list view with all 8 projects, HUD palette from docs/DESIGN.md, works with JS off
- [ ] Deployed; Lighthouse mobile performance ≥ 90; checked on a real phone

## Phase 2 — 3D ring (hours 3–7)
**Lesson:** the render loop — motion in `useFrame` on refs, state only on selection change.
- [ ] R3F + drei, renderer isolated in `components/scene/Renderer.tsx`
- [ ] 8 panels on a ring; drag, scroll, ←/→ rotate; Enter/click selects
- [ ] Selection → `store.focusProject`; camera rig eases to panel
- [ ] Scene lazy-loaded after first paint; list view toggle; reduced-motion respected
- [ ] ~60fps on laptop (Performance panel); interactive < 3s; phone check

## Phase 3 — HUD look + performance tiers (hours 7–10)
**Lesson:** effects budget — measure, then step down.
- [ ] Bloom, holo panel shader, particles, 2D HUD overlay + detail panel
- [ ] PerformanceMonitor tiers per docs/DESIGN.md
- [ ] All text is DOM; Lighthouse a11y ≥ 95; phone stays smooth

## Phase 4 — AI guide (hours 10–14)
**Lesson:** grounding beats RAG at this size; tools are how the model drives UI.
- [ ] AI SDK route (verify current major version + docs first), provider in `lib/guide/model.ts`
- [ ] System prompt from docs/AI_GUIDE.md facts + projects.ts, cached
- [ ] Tools: focusProject, filterProjects, openLink (Zod, id enum)
- [ ] Rate limit, max tokens, message window per docs/AI_GUIDE.md
- [ ] `pnpm eval` ≥ 18/20; rate limit tested by hand

## Phase 5 — Case studies + access requests (hours 14–16)
**Lesson:** server actions keep keys and emails off the client.
- [ ] `/projects/[id]` pages from projects.ts
- [ ] Request-access form → server action → Resend; honeypot + rate limit
- [ ] Per-project OG images
- [ ] No secrets found in built client JS

## Phase 6 — Assets (hours 16–20, overlaps 2–5) · Sam + Claude
- [ ] Screenshots for all 8
- [ ] Video for every project without a working live link
- [ ] Pitches/bullets corrected by Sam
- [ ] `status` set honestly for each project

## Phase 7 — Polish + launch (hours 20–24)
- [ ] Lighthouse ≥ 90 on all four scores, mobile + desktop
- [ ] Keyboard, screen reader labels, reduced motion, 404, loading/error states
- [ ] Vercel Analytics; uptime monitor on site + each live demo
- [ ] OG preview checked in LinkedIn / WhatsApp / iMessage
- [ ] One person tests it on their phone without help

## Later (ideas go here, not into the current phase)
- Code room (if Gauntlet allows source sharing and repos stay private)
- Custom domain
- "More work" grid
- Spanish version
