# Decisions (lightweight ADRs)

Newest first. One entry per architectural choice: context → decision → consequence.

## 2026-11-26 · The core sphere is opaque; the panes stay translucent
- **Context:** the sphere was translucent glass like the panels. In practice the panel behind it showed through as a pale rectangle, and the two directional lights left small sharp highlights on it. The output pass scales colors far above screen white down to keep their hue, so those highlights came out as dark dots. Rectangle plus two dots read as a face.
- **Decision:** the sphere is an opaque, slightly rough `MeshStandardMaterial` in `--glow`, with a soft gradient sprite behind it for the glow. It writes depth, unlike the rest of the glass.
- **Consequence:** the far half of the halo is hidden behind the sphere, which is what makes the halo read as an orbit. The sphere no longer shows what is behind it. A sharp highlight on any material brighter than about 1.5 will come out dark for the same reason; keep new glossy materials rough enough to stay under it.

## 2026-11-26 · Soft light is a gradient texture, not bloom
- **Context:** the reference's front panel has a soft glow around its edge and a pool of light on the disc. Bloom only spreads what is already brighter than its threshold, drawing the edge far over the threshold gave a hard saturated stroke, and the low tier has no bloom at all.
- **Decision:** the pane tint, the glow around the front panel, its pool on the disc and the core's glow are small gradients drawn once on a 2D canvas (`components/scene/textures.ts`). The front edge is drawn only just above bloom's threshold.
- **Consequence:** the same look on every tier, at no per-frame cost. The low tier has no post-processing pass and blends translucent layers heavier, so the pane tint is thinned there (`LOW_TIER_TINT`).

## 2026-11-26 · A `--glass-tint` token for the ring's panes
- **Context:** the panes were tinted with `--bg-glow-2`, a periwinkle that read violet on glass; the reference is a cyan-leaning blue.
- **Decision:** one new color token, `--glass-tint` (`#cdeaff`), used only by the 3D panes and their tint gradient.
- **Consequence:** not a text or UI color; it has no Tailwind utility and no contrast rule.

## 2026-11-24 · The ring takes over the page only when it is ready and the visitor is not using the list
- **Context:** the first build switched to ring view the moment the lazy chunk mounted. The ui audit showed two failures: on a slow connection the list vanished under a visitor already reading card 5 (scroll position and focus lost, CLS 0.81), and a chunk that failed to load reached Next's root error screen and replaced the whole page.
- **Decision:** the scene mounts invisibly and out of the flow, and switches to ring view only when its WebGL context exists — and only if the visitor has not scrolled past half a screen, has no panel open and has no focus in the list. Otherwise the nav offers "Ring view". The dynamic import resolves to nothing on failure, an error boundary in `RingStage` catches anything the scene throws, and a lost WebGL context switches back to the list until it is restored.
- **Consequence:** the list is what the page falls back to in every failure case, each covered by an e2e test. `next dev` appending rules to AGENTS.md is switched off (`agentRules: false`) — unrelated, but found in the same phase.

## 2026-11-24 · The ring has a "front" project that is separate from the selected one
- **Context:** the store had one field, `activeProjectId`, and the detail panel opens whenever it is set. If arrow keys and drag wrote to it, the panel would open on every step — and below 1024px the panel is a modal sheet that covers the carousel.
- **Decision:** add `frontProjectId`. Arrow keys, drag, swipe, wheel and the buttons under the ring move it (`setFrontProject`); Enter, Space or a click on the front panel calls `focusProject`. `focusProject` also sets the front, so the ring follows every selection (panel Previous/Next, the guide in Phase 5). While a project is selected, turning the ring moves the selection too, so the open panel always matches the front panel.
- **Consequence:** one more field, covered by `store/ui.test.ts` and `components/scene/actions.test.ts`. Guide tools keep calling `focusProject` only.

## 2026-11-24 · In ring view the list is hidden with CSS, not removed
- **Context:** showing the ring and the card grid together brings back the Phase 2.5 audit problem: on desktop the ring view's panel is non-modal, so it would cover cards that can still take focus.
- **Decision:** the scene sets `data-view="ring"` on `<html>` when it mounts and `app/globals.css` hides `[data-project-list]`. The list stays in the DOM and is the page whenever the ring is not: JavaScript off, no WebGL, `?view=list`, or "List view" in the nav.
- **Consequence:** no client code is needed to hide the list, and the fallback is the default state, not a code path. List-view e2e tests open `/?view=list`.

## 2026-11-24 · Post-processing on a transparent canvas needs an alpha fix; bloom's mipmap blur stays off
- **Context:** the canvas is transparent so the page shows through. With `EffectComposer` on, every translucent surface rendered solid white. Cause: the composer blends in linear light and converts to sRGB at the end, after alpha was multiplied in, so pixels end up brighter than their alpha and the browser adds them to the page. Separately, `Bloom mipmapBlur` turned the whole canvas opaque white.
- **Decision:** `components/scene/Effects.tsx` ends with a small custom effect that un-multiplies, converts and re-multiplies, and raises alpha to cover bloom's added light (so glow tints the page blue instead of bleaching it). `mipmapBlur` is off. Bloom's threshold is 1.7, above lit white glass; only the halo and the front panel's edge are drawn brighter than that.
- **Consequence:** bloom is selective without a second render or layers. Any new bright material has to stay under 1.7 or it will glow. Checked by eye at all three tiers; there is no automated visual test.

## 2026-11-24 · Panel labels are plain DOM moved by the render loop, not drei `Html`
- **Context:** the plan was drei `Html` for titles and index labels. With drei 10.7.9 and React 19.3 the first `Html` in the tree mounted empty (it follows tree position: reversing the panels moved the empty one), and each `Html` creates its own React root.
- **Decision:** `RingScene` renders the eight labels as ordinary DOM over the canvas. Each `ProjectPanel` projects three corners of its pane to screen pixels every frame and writes a CSS `matrix()` onto its label. Labels are `aria-hidden`; the stage's label, the live region and the controls carry the same information in order.
- **Consequence:** real DOM text with no extra roots. The mapping is affine, so text is not foreshortened within a pane — not noticeable at this field of view. Labels of panels at the back fade out, because DOM cannot be hidden behind WebGL.

## 2026-11-24 · Glass is a transparent physical material, not transmission
- **Context:** docs/DESIGN.md called for `MeshPhysicalMaterial` with transmission on the high tier. Transmission samples a render of the opaque objects behind the surface; in this scene everything is translucent and the canvas itself is transparent, so there is nothing for it to sample, and it costs an extra pass.
- **Decision:** high tier uses `MeshPhysicalMaterial` with clearcoat and environment reflections; medium and low use `MeshStandardMaterial`. No transmissive material anywhere. This was decided from how transmission works, not from a side-by-side test.
- **Consequence:** one render pass fewer on the high tier. If a later design puts opaque art behind the glass, try transmission on the core only.

## 2026-11-24 · The environment map is built in code, not loaded
- **Context:** drei's `Environment` presets download an HDR file from a third-party CDN. The CSP blocks that, and it would add a request before the scene looks right.
- **Decision:** `Lighting.tsx` builds the environment from four `Lightformer` panels, rendered once.
- **Consequence:** no network request, no new CSP source, colors come from tokens.

## 2026-11-24 · Only a horizontal wheel turns the ring
- **Context:** capturing the vertical wheel over the ring would stop the page from scrolling whenever the pointer is on it — on a page where the ring fills most of the first screen.
- **Decision:** a horizontal wheel or trackpad swipe steps the ring; vertical scrolling is never intercepted. On touch, `touch-action: pan-y` gives vertical pans to the browser and horizontal ones to the ring.
- **Consequence:** a mouse with only a vertical wheel uses drag, the arrow keys or the buttons.

## 2026-11-24 · three.js, React Three Fiber, drei and postprocessing added
- **Context:** Phase 3. Versions checked with `npm view` on the day: three 0.187.0, @react-three/fiber 9.8.2, @react-three/drei 10.7.9, @react-three/postprocessing 3.2.2, postprocessing 6.39.6.
- **Decision:** all four load only in the lazy scene chunk (`next/dynamic`, `ssr: false`).
- **Consequence:** first-load JavaScript grew by 2.2 KB gzipped (the loader with its error boundary, and the nav toggle). The lazy chunk is 315 KB gzipped — one chunk, not yet trimmed.

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
