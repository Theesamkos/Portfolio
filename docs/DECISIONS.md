# Decisions (lightweight ADRs)

Newest first. One entry per architectural choice: context → decision → consequence.

## 2026-11-18 · CSP: small enforced policy now, full policy report-only until launch
- **Context:** `frame-ancestors` is not honored in a report-only policy, and nonce-based CSP forces every page to render dynamically, which conflicts with the speed budget.
- **Decision:** enforce only `frame-ancestors`, `base-uri`, `object-src`, `form-action` (they can't break rendering). Ship the full policy as `Content-Security-Policy-Report-Only`, without nonces (`script-src 'self' 'unsafe-inline'`). No report endpoint yet — violations show in the browser console and fail the e2e suite.
- **Consequence:** pages stay static. Phase 8 decides how far to tighten `script-src` (hashes/SRI vs. keeping `'unsafe-inline'`) before enforcing.

## 2026-11-18 · Env vars become required in the phase that uses them
- **Context:** nothing reads a secret until Phase 5, and `next build` sets `NODE_ENV=production` everywhere (CI, previews), so it can't mark a real production deploy.
- **Decision:** `lib/env.schema.ts` validates on every build; the "required" list applies only when `VERCEL_ENV=production` and starts empty. Each variable is added to it in the phase that first uses it.
- **Consequence:** CI and previews build without secrets; a production deploy fails fast with the missing names once a feature depends on them.

## 2026-11-18 · TypeScript 6.0.x, not 7
- **Context:** TypeScript 7.0 is the latest release, but typescript-eslint supports `<6.1` and the Next.js docs say installing TS 7 as `typescript` breaks ESLint config loading.
- **Decision:** pin TypeScript 6.0.3. Skip the side-by-side 6+7 alias setup.
- **Consequence:** one compiler, working lint. Revisit when typescript-eslint supports TS 7.

## 2026-11-18 · Cache Components on from the start
- **Context:** `create-next-app` enables `cacheComponents` by default for App Router in Next 16.
- **Decision:** keep the default (with `partialPrefetching`). Adopting it with zero pages costs nothing.
- **Consequence:** pages prerender by default; request-time data must sit behind `<Suspense>` or use `"use cache"`.

## 2026-11-17 · Open: source code sharing for Gauntlet projects
- **Context:** Gauntlet confirmed Sam can use his Gauntlet projects in the portfolio. Not yet confirmed whether that includes showing source.
- **Options:** (a) source OK → make repos public after a full-history secret scan, no code room needed; (b) showcase only → case studies + "Request code access" form.
- **Status:** pending Sam's confirmation. v1 ships option (b) either way.

## 2026-11-17 · Grounding instead of RAG for the AI guide
- **Context:** 8 projects + a bio fit easily in context.
- **Decision:** pass all content in a cached system prompt. No vector DB.
- **Consequence:** simpler, cheaper, more accurate. Revisit if content outgrows context.

## 2026-11-17 · WebGL renderer, isolated for a later WebGPU swap
- **Context:** R3F's native WebGPU support (v10) is alpha as of Nov 2026.
- **Decision:** stable R3F + WebGL; all renderer setup in `components/scene/Renderer.tsx`.
- **Consequence:** reliable on all browsers now; one-file swap later.

## 2026-11-17 · Vercel AI SDK with a swappable provider
- **Context:** Sam has credits on more than one provider.
- **Decision:** AI SDK; provider + model chosen only in `lib/guide/model.ts`. Anthropic by default.
- **Consequence:** switching providers is a one-line change.

## 2026-11-17 · List view is the real site
- **Context:** recruiters often open links on phones; search engines and screen readers need real HTML.
- **Decision:** SSR list view first; 3D loaded after first paint on top of it.
- **Consequence:** the site works everywhere; 3D is enhancement.

## 2026-11-17 · Launch on *.vercel.app
- **Decision:** custom domain after launch (5-minute change, no rebuild).
