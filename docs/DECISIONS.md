# Decisions (lightweight ADRs)

Newest first. One entry per architectural choice: context → decision → consequence.

## 2026-11-24 · Card blur is off; blur stays on the nav, menu and detail panel
- **Context:** all eight cards had `backdrop-filter: blur(20px)`. The only thing behind a card is the page's soft gradient, and the ui-auditor's on/off comparison showed card interiors unchanged. Each blurred card is still a layer the browser re-samples on every scroll frame. Phone frame times were not measured: headless main-thread timing was identical either way and cannot see GPU cost.
- **Decision:** cards, About and the footer use `GlassPanel blur={false}`. Blur stays where content really passes underneath: the nav bar, the menu and the detail panel.
- **Consequence:** no visible change, eight fewer backdrop-filter layers. If a later design puts imagery behind the cards, turn the prop back on and measure on a phone first.

## 2026-11-24 · Detail panel and mobile menu use native `<dialog>` and `popover`
- **Context:** the detail panel must be a side panel on desktop and a bottom sheet on phones, and the mobile menu must work with JavaScript off. A hand-built modal needs a focus-trap library and its own Esc, backdrop and scroll handling.
- **Decision:** `DetailPanel` is a `<dialog>` driven by `activeProjectId`; side panel from 1024px, bottom sheet below. It opens with `showModal()` everywhere except the ring view on desktop, which uses `show()` so the ring stays draggable. The first build was non-modal on desktop in the list view too; the ui audit showed it covering the right card column while focus could still move underneath, so the list view is modal at every width. The mobile menu is a `popover="auto"` element opened by `popovertarget`. No dependency added.
- **Consequence:** the browser supplies the focus trap, Esc, backdrop and top layer. Handled in the component: returning focus to whatever selected the project, and ignoring a `close` event that arrives after the panel was reopened. The page scroll is locked behind the sheet in CSS (`html:has(dialog:modal)`, below 1024px only, so no desktop scrollbar shift). jsdom has no dialog methods, so open/close behavior is tested in Playwright.

## 2026-11-24 · Icons are inline SVG, not an icon package
- **Context:** the page needs about a dozen icons, two of them brand marks (LinkedIn, GitHub) that `lucide-react` no longer ships. The page is near its JavaScript budget.
- **Decision:** `components/ui/icons.tsx` holds the icons as Server Component SVG. They are decorative (`aria-hidden`); the label next to each carries the meaning.
- **Consequence:** no dependency, no client JavaScript, no request. Adding an icon means drawing or pasting a path; revisit if the set passes about 30.

## 2026-11-24 · Text uses darker `-ink` shades of the accent and status colors
- **Context:** the light glass spec colors mono labels and links `--accent` and status text `--live` / `--warn`. On glass those measure 4.04:1, 2.92:1 and 1.90:1 at worst — below WCAG AA for small text, and Lighthouse a11y would drop under the 95 target.
- **Decision:** add `--accent-ink` (#1557d6), `--live-ink` (#166534) and `--warn-ink` (#92400e) for text; keep the spec colors for fills, dots, borders and icons. Tailwind's default palette is switched off (`--color-*: initial`) so only tokens can be used. The focus ring is `--accent`, not `--glow`, for the same reason.
- **Consequence:** every text token is at least 4.5:1 on every surface, enforced by `lib/contrast.test.ts`, which reads the values from `app/globals.css`. The look stays close to the reference: the dot carries the semantic color, the text is a darker shade of it.

## 2026-11-18 · The LCP element is hero text; posters get no loading priority
- **Context:** the first card's poster sits inside the phone viewport and is larger than any text, so it became the LCP element (2.7s on simulated slow 4G against a 2.5s budget), whether loaded eagerly or lazily.
- **Decision:** placeholder posters are drawn as inline SVG by `components/hud/Poster.tsx` (no request, not an LCP candidate). Real posters will be lazy `next/image` with no `preload`. An e2e test asserts the LCP element is hero text.
- **Consequence:** LCP equals first paint (0.8s mobile locally). When real posters land the test may fail on phones; fix the layout then (the ring will sit above the list), not by prioritizing a poster.

## 2026-11-18 · Zustand store is a client-only module singleton
- **Context:** the ring, HUD, list view and AI guide must share `activeProjectId`, `filters` and `viewMode`. A store created at module level is shared across requests if server code touches it.
- **Decision:** Zustand 5 (`store/ui.ts`), one module-level store, imported only from client components. Server Components read `content/projects.ts` directly. Default `viewMode` is `list` until the ring ships.
- **Consequence:** no provider, and code outside React (guide tool calls) can dispatch with `useUiStore.getState()`. If state ever has to be rendered on the server per request, move to a per-request store in a context provider.

## 2026-11-18 · Project ids are a type derived from the content
- **Context:** the store, the routes and the guide's tools all take a project id; a free `string` lets typos through.
- **Decision:** `content/projects.ts` declares the seed `as const satisfies ProjectInput[]`; `ProjectId` and `projectIdSchema` are derived from it. `lib/schema.ts` holds the schema (strict objects, readonly arrays) plus cross-field rules: `live` needs a demo link, `video` needs a video link, `team` needs a credit, and only `public` projects may carry a repo link.
- **Consequence:** adding a project is one edit; an unknown id fails typecheck, and content that would ship a dead or private link fails `pnpm test` and the build.

## 2026-11-18 · New package versions wait 3 days before install
- **Context:** compromised npm releases are usually caught and unpublished within a day or two; installing on release day is the exposure window.
- **Decision:** `minimumReleaseAge: 4320` (minutes) in `pnpm-workspace.yaml`, with a matching 3-day `cooldown` in Dependabot. pnpm fails resolution rather than falling back when no version is old enough.
- **Consequence:** a brand-new version (including an urgent security patch) can't be installed for 3 days unless it is listed in `minimumReleaseAgeExclude` — do that deliberately, per package, and remove it afterwards.

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
