# PRD — Samuel Orth Portfolio

## Problem
Sam's best work is spread across ~20 repos (many private), with few live demos. When someone asks "what can you do?", there's no single link that shows it fast and well.

## Goal
One URL that makes a recruiter, hiring manager, or founder say "what?!" in 10 seconds and gives them everything in 60: what Sam built, a live demo or video, the code (or how to request it), and a way to ask questions.

## Users
| User | Has | Wants |
|---|---|---|
| Recruiter | 30 seconds, a phone | Is he legit? What roles fit? How do I contact him? |
| Hiring manager / engineer | 2–5 minutes, a laptop | Depth: architecture, decisions, code quality, tests |
| Founder | 1–2 minutes | Can he ship real products end to end? |

## Experience
1. **Landing (0–10s):** holographic HUD intro (≤ 1.5s, skippable), Sam's name + one-line identity, the 3D ring of 8 projects already gently rotating. Visible "List view" toggle.
2. **Browse (10–40s):** drag / scroll / arrow keys rotate the ring; selecting a panel opens the HUD detail panel: pitch, 3 bullets, skills, buttons (Live demo · Video · Code · Case study).
3. **Ask (any time):** AI guide panel. "Has he built RAG?" → answers from project data, cites projects, spins the ring to the match.
4. **Depth:** `/projects/[id]` case study: problem, architecture diagram, stack, decisions, impact, links.
5. **Contact:** always-visible email, LinkedIn, GitHub. Private/team repos show "Request code access".

## Features (v1 — 24-hour sprint)
- [ ] SSR list view of all 8 projects (works without JS)
- [ ] 3D ring with drag/scroll/keyboard, camera fly-to, reduced-motion support
- [ ] HUD look: bloom, holo shader, particles, overlay; performance tiers
- [ ] AI guide: streaming chat, 3 UI tools, rate limit, token cap, evals
- [ ] Case study pages + OG images
- [ ] Request-code-access form (server action → email)
- [ ] Analytics, uptime monitor

## Later (v2+)
- Code room (GitHub App, read-only, expiring invites, view log) — only if Gauntlet allows source sharing and repos stay private
- Custom domain
- "More work" grid for non-featured projects
- Spanish version (Sam is Bogotá-based)

## Non-goals
- Blog, CMS, auth for visitors, voice for the guide (v1), WebGPU renderer (v1).

## Success metrics
- Lighthouse ≥ 90 on all four scores, mobile + desktop
- Guide evals ≥ 18/20
- Every featured project has a working live demo or a video at launch
- Median visit > 45s (Vercel Analytics, after launch)
