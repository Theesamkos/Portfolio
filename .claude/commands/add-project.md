---
description: Add or update a featured project entry from its source repo
argument-hint: <project-id> [path to the project's local repo]
---

Add or update project `$ARGUMENTS` in content/projects.ts.

1. If a repo path was given, read its README, package.json/pyproject, and main source to understand what it does. Don't copy private source code into this repo.
2. Draft: pitch (≤ 90 chars), 3 impact bullets (≤ 110 chars, concrete, no invented numbers), skills, tags, stack. Only claim what the code shows.
3. Ask me for: demo URL, video URL, repo URL/visibility, and team credit if it's a team project.
4. Set `status` honestly (live only if the demo URL loads; video if there's a video; else coming-soon).
5. Check assets exist in public/projects/<id>/ per docs/CONTENT.md; list what's missing.
6. Update docs/CONTENT.md seed table and the guide evals if this changes which project answers a skill question.
7. Run `pnpm test` (schema) and `pnpm eval` if evals changed.
