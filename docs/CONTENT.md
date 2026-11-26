# Content — featured projects

`content/projects.ts` is the single source of truth. This file holds the seed data and asset specs. Pitches below are drafts — Sam corrects them.

## Schema (lib/schema.ts)
```ts
Project {
  id: string            // kebab-case, stable
  title: string
  pitch: string         // one line, ≤ 90 chars
  bullets: [string, string, string]  // impact, ≤ 110 chars each
  skills: string[]      // e.g. "RAG", "LangGraph", "Computer Vision"
  tags: string[]        // e.g. "agents", "edtech", "safety"
  status: 'live' | 'video' | 'coming-soon'
  visibility: 'public' | 'private' | 'team'
  team?: { name: string; role: string }   // for team projects
  links: { demo?: url; repo?: url; video?: url }
  stack: string[]
  assets: { poster: string; icon: string; screenshots: string[] }
  order: number         // ring position
}
```

## Seed data (8 featured)
| order | id | title | visibility | draft pitch | skills |
|---|---|---|---|---|---|
| 1 | software-factory | Software Factory | private | A pipeline that turns a written spec into verified, mergeable code | Agent orchestration, multi-model routing, quality gates, CI |
| 2 | math-tiles | Math Tiles | public | Physical math tiles read by a webcam — live at an AI-driven school | Computer vision, real-time, PWA, edtech |
| 3 | chatbridge | ChatBridge | public | A K-12 AI tutor that runs sandboxed learning apps inside chat, safely | AI safety, prompt-injection defense, moderation, tRPC |
| 4 | legacylens | LegacyLens | private | Ask questions of COBOL, Fortran, and C codebases and get cited answers | RAG, code parsing, embeddings, FastAPI |
| 5 | sentinel-six | Sentinel Six | team | Real-time pose tracking that coaches stance against training doctrine | Pose estimation, rule engines, MediaPipe, product lead |
| 6 | autonomous-ad-engine | Autonomous Ad Engine | public | Generates ads, grades them on 5 dimensions, and fixes its own failures | Evals, LLM-as-judge, self-healing loops, cost tracking |
| 7 | servicecore | ServiceCore | private | Field ops platform: GPS-verified time, job costing, payroll, QuickBooks export | Full-stack, geofencing, business logic |
| 8 | acme-invoice-agent | Acme Invoice Agent | public | Four LangGraph agents take an invoice from intake to payment with an audit trail | LangGraph, multi-agent, financial operations |

Sentinel Six team credit: Gauntlet AI capstone (G4-Prime-Capstone). Sam = product lead, research lead, wrote code, tuned the biometric/mechanical tracking. Confirm wording with the team before launch.

**Ring order (Phase 3):** positions 1, 2 and 8 are the three panels visible at rest — Acme Invoice Agent to the left of the front panel, Math Tiles to the right.

**Acme Invoice Agent (Phase 3):** its bullets were rewritten from the repo's README and source, tagged `fintech`, with a "Financial operations" skill. "Human-in-the-loop" was removed: approval in the repo is a simulated VP review with a critic loop, not a person, and the database is SQLite.

**Draft copy (Phase 2):** `bullets`, `tags` and `stack` in `content/projects.ts` were drafted from this table and state no metrics. Phase 7 rewrites them from each repo. `stack` lists only technologies named above, so some are empty.

**Schema rules beyond the field types:** `live` needs `links.demo`, `video` needs `links.video`, `team` needs `team`, and `links.repo` is allowed only when `visibility` is `public`.

## Status at launch (v1)
Set `status` from what actually works on launch day: `live` only if the demo link opens on a phone; `video` if there's a recorded demo; `coming-soon` otherwise. Never ship a dead link.

## Assets per project (`public/projects/<id>/`)
| File | Spec |
|---|---|
| `poster.webp` | 1600×1000, < 200 KB — used on the list card + OG image |
| `icon.svg` | The icon on the ring panel. Self-contained SVG under 4 KB with `width`/`height` set (it is drawn as a WebGL texture). Generated placeholders until Phase 7 |
| `shot-1..5.webp` | 1600px wide, < 250 KB each, real UI from a real run |
| demo video | 60–90s, 1080p, hosted on YouTube (unlisted) or Vercel Blob; link in `links.video` |

## Video script (60–90s, same shape for every project)
1. 0–10s: the problem in one sentence, on screen
2. 10–60s: the product doing the thing, real data, no dead air
3. 60–80s: one "under the hood" shot (architecture, evals, tests passing)
4. Last 5s: title + "samorth portfolio" card

## Adding a project
Run `/add-project <id>` in Claude Code, or: add assets → add entry to projects.ts → `pnpm test` (schema check) → update the guide evals if it changes skill answers.
