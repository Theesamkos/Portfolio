---
description: Run every check and compare against the current phase's acceptance criteria
---

1. Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` (and `pnpm eval` if anything under lib/guide changed). Show the tail of each output.
2. Find the current phase in docs/PLAN.md (first phase with unticked boxes). For each acceptance criterion, report: ✅ proven (with evidence) · ❌ failing (why) · 👤 needs Sam (manual check, e.g. real phone, Lighthouse in his browser).
3. If anything is ❌, propose the smallest fix. Don't fix without my OK unless it's a lint/type error you introduced.
4. Use the `ui-auditor` subagent if this phase changed UI, and `security-reviewer` if it touched API routes, server actions, or env vars.
