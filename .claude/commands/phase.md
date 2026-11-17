---
description: Start a build phase from docs/PLAN.md — lesson, plan, build, verify
argument-hint: <phase number>
---

We're starting Phase $ARGUMENTS from docs/PLAN.md.

1. **Lesson.** Read the phase's "Lesson" line. Teach it to me in under 200 words with a tiny code example from this stack. Point out the outdated way people usually do it and why the current way is better. Then stop and wait for me to say "go".
2. **Check versions and docs.** For every library this phase touches, run `npm view <pkg> version` and read its current docs for the APIs you'll use. List the versions.
3. **Plan.** List files to create/change, the approach, and risks. Wait for my approval.
4. **Build.** Implement in small commits. Tests and typecheck pass after each.
5. **Verify.** Run `/verify`. Tick the phase's boxes in docs/PLAN.md only for criteria you proved, with evidence. List anything not yet verified (e.g. real phone check — that's mine to do).
6. Log any architectural decision in docs/DECISIONS.md.
