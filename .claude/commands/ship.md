---
description: Pre-deploy checklist before pushing to production
---

Before I push to main:

1. `git status` clean except intended changes; no `.env*` staged.
2. `pnpm typecheck && pnpm lint && pnpm test && pnpm build` all pass. `pnpm eval` ≥ 18/20 if the guide changed.
3. Search the build output (`.next/static`) for anything that looks like a key (`sk-`, `re_`, `AX`, long base64) — report hits.
4. Every project with `status: 'live'` — list its demo URL so I can click-test it.
5. Run the `security-reviewer` subagent on the diff since the last deploy.
6. Summarize what's shipping in 3 bullets for the commit/PR message.
Don't push. I'll push after reviewing.
