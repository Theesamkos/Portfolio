# Decisions (lightweight ADRs)

Newest first. One entry per architectural choice: context → decision → consequence.

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
