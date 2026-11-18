# CLAUDE.md

@AGENTS.md

## Working with Sam in Claude Code

Sam is an AI engineer leveling up to current best practices. He wants to be taught, not just shipped for.

- **Teach before new concepts.** Before introducing a library, pattern, or API Sam hasn't used in this repo, stop and explain it in a few sentences with a minimal example. Call out when a request looks like an outdated habit and say what the current practice is.
- **Plan first.** For any multi-file change, show the plan (files, approach, risks) and wait for approval. Use plan mode for each new phase.
- **One phase at a time.** Work only on the current phase in `docs/PLAN.md`. Ideas outside it go in the "Later" list at the bottom of PLAN.md, not into code.
- **Prove it.** Report "done" only with evidence: command output, test results, or a browser check. If something couldn't be verified, say so.
- **Verify versions.** Check current stable versions and current docs before installing or using a library API. Don't write code from memory against fast-moving APIs (AI SDK, R3F, Next.js).
- **Keep docs live.** Tick acceptance boxes in `docs/PLAN.md`, log decisions in `docs/DECISIONS.md`, and update `AGENTS.md` when architecture changes — in the same PR as the change, but in their own `docs(...)` commit, never bundled into a `feat`/`fix` commit.
- **Never read or print `.env*` files** (except `.env.example`). Ask Sam to set env vars himself.

## Useful commands in this repo
- `/phase <n>` — start a phase: lesson → plan → build → verify
- `/verify` — run all checks against the current phase's acceptance criteria
- `/add-project <id>` — add or update a project entry from its repo
- `/ship` — pre-deploy checklist
- Subagents: `code-reviewer`, `ui-auditor`, `security-reviewer`
