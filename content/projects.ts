import { z } from "zod";
import { projectIdEnum, projectSchema, type Project, type ProjectInput } from "@/lib/schema";

/**
 * The 8 featured projects — the single source of truth for the list view, the ring,
 * the case studies and the AI guide. Seeded from docs/CONTENT.md.
 *
 * DRAFT COPY: every `bullets`, `tags` and `stack` value below is a draft written from
 * the pitch and skills in docs/CONTENT.md. They state no metrics on purpose. Phase 7
 * replaces them with copy checked against each repo.
 *
 * Placeholders until Phase 7: `assets.poster` is a generated SVG, `screenshots` is
 * empty, and every `status` is "coming-soon" until a demo or video link is verified.
 * `links.repo` is set only for public repos (the schema rejects it otherwise).
 */
const seed = [
  {
    id: "software-factory",
    title: "Software Factory",
    pitch: "A pipeline that turns a written spec into verified, mergeable code",
    bullets: [
      "Takes a written spec and carries it through to code that is verified and ready to merge",
      "Orchestrates multiple agents and routes work across more than one model",
      "Quality gates and CI checks stand between generated code and a merge",
    ],
    skills: ["Agent orchestration", "Multi-model routing", "Quality gates", "CI"],
    tags: ["agents", "developer-tools"],
    status: "coming-soon",
    visibility: "private",
    links: {},
    stack: [],
    assets: { poster: "/projects/software-factory/poster.svg", screenshots: [] },
    order: 1,
  },
  {
    id: "math-tiles",
    title: "Math Tiles",
    pitch: "Physical math tiles read by a webcam — live at an AI-driven school",
    bullets: [
      "A webcam reads physical math tiles in real time using computer vision",
      "Built as a progressive web app that runs in the browser",
      "In use at an AI-driven school",
    ],
    skills: ["Computer vision", "Real-time", "PWA", "Edtech"],
    tags: ["computer-vision", "edtech"],
    status: "coming-soon",
    visibility: "public",
    links: { repo: "https://github.com/Theesamkos/math-tiles" },
    stack: ["PWA"],
    assets: { poster: "/projects/math-tiles/poster.svg", screenshots: [] },
    order: 2,
  },
  {
    id: "chatbridge",
    title: "ChatBridge",
    pitch: "A K-12 AI tutor that runs sandboxed learning apps inside chat, safely",
    bullets: [
      "A K-12 AI tutor that runs learning apps inside the chat",
      "Each learning app runs in a sandbox",
      "Prompt-injection defenses and moderation for a K-12 audience",
    ],
    skills: ["AI safety", "Prompt-injection defense", "Moderation", "tRPC"],
    tags: ["safety", "edtech"],
    status: "coming-soon",
    visibility: "public",
    links: { repo: "https://github.com/Theesamkos/chatbridge" },
    stack: ["tRPC"],
    assets: { poster: "/projects/chatbridge/poster.svg", screenshots: [] },
    order: 3,
  },
  {
    id: "sentinel-six",
    title: "Sentinel Six",
    pitch: "Real-time pose tracking that coaches stance against training doctrine",
    bullets: [
      "Tracks body pose in real time with MediaPipe",
      "A rule engine checks each stance against training doctrine and coaches corrections",
      "Sam wrote code and tuned the biometric and mechanical tracking",
    ],
    skills: ["Pose estimation", "Rule engines", "MediaPipe", "Product lead"],
    tags: ["computer-vision", "training"],
    status: "coming-soon",
    visibility: "team",
    // Wording to be confirmed with the team before launch (docs/CONTENT.md).
    team: { name: "Gauntlet AI capstone team", role: "Product lead and research lead" },
    links: {},
    stack: ["MediaPipe"],
    assets: { poster: "/projects/sentinel-six/poster.svg", screenshots: [] },
    order: 4,
  },
  {
    id: "acme-invoice-agent",
    title: "Acme Invoice Agent",
    pitch: "Four LangGraph agents take an invoice from intake to payment with an audit trail",
    bullets: [
      "Four LangGraph agents carry an invoice from intake through to payment",
      "Human-in-the-loop checkpoints keep a person in control of the workflow",
      "Each invoice leaves an audit trail",
    ],
    skills: ["LangGraph", "Multi-agent", "Human-in-the-loop"],
    tags: ["agents", "finance"],
    status: "coming-soon",
    visibility: "public",
    links: { repo: "https://github.com/Theesamkos/acme-invoice-agent" },
    stack: ["LangGraph"],
    assets: { poster: "/projects/acme-invoice-agent/poster.svg", screenshots: [] },
    order: 5,
  },
  {
    id: "autonomous-ad-engine",
    title: "Autonomous Ad Engine",
    pitch: "Generates ads, grades them on 5 dimensions, and fixes its own failures",
    bullets: [
      "Generates ads, then grades each one on five dimensions with an LLM judge",
      "Ads that fail the grade go back through a self-healing loop",
      "Tracks cost as it runs",
    ],
    skills: ["Evals", "LLM-as-judge", "Self-healing loops", "Cost tracking"],
    tags: ["evals", "marketing"],
    status: "coming-soon",
    visibility: "public",
    links: { repo: "https://github.com/Theesamkos/autonomous-ad-engine" },
    stack: [],
    assets: { poster: "/projects/autonomous-ad-engine/poster.svg", screenshots: [] },
    order: 6,
  },
  {
    id: "legacylens",
    title: "LegacyLens",
    pitch: "Ask questions of COBOL, Fortran, and C codebases and get cited answers",
    bullets: [
      "Ask questions of COBOL, Fortran and C codebases",
      "Answers come back with citations",
      "Retrieval built on code parsing and embeddings, served with FastAPI",
    ],
    skills: ["RAG", "Code parsing", "Embeddings", "FastAPI"],
    tags: ["rag", "developer-tools"],
    status: "coming-soon",
    visibility: "private",
    links: {},
    stack: ["FastAPI"],
    assets: { poster: "/projects/legacylens/poster.svg", screenshots: [] },
    order: 7,
  },
  {
    id: "servicecore",
    title: "ServiceCore",
    pitch: "Field ops platform: GPS-verified time, job costing, payroll, QuickBooks export",
    bullets: [
      "GPS-verified time tracking with geofencing",
      "Job costing and payroll in one field-operations platform",
      "Exports to QuickBooks",
    ],
    skills: ["Full-stack", "Geofencing", "Business logic"],
    tags: ["full-stack", "operations"],
    status: "coming-soon",
    visibility: "private",
    links: {},
    stack: [],
    assets: { poster: "/projects/servicecore/poster.svg", screenshots: [] },
    order: 8,
  },
] as const satisfies readonly ProjectInput[];

/** Union of the ids above — derived from the data, so a typo is a compile error. */
export type ProjectId = (typeof seed)[number]["id"];

const [firstId, ...otherIds] = seed.map((project) => project.id);

/** Zod enum of the project ids. The AI guide's tool inputs use this in Phase 5. */
export const projectIdSchema = projectIdEnum([firstId, ...otherIds] as [ProjectId, ...ProjectId[]]);

/** A validated project whose id is one of the known ids. */
export type FeaturedProject = Project & { id: ProjectId };

/** Validated at module load, sorted by ring position. */
export const projects: readonly FeaturedProject[] = z
  .array(projectSchema)
  .parse(seed)
  .map((project) => ({ ...project, id: projectIdSchema.parse(project.id) }))
  .sort((a, b) => a.order - b.order);

export function getProject(id: ProjectId): FeaturedProject {
  const project = projects.find((candidate) => candidate.id === id);
  if (!project) throw new Error(`Unknown project id: ${id}`);
  return project;
}
