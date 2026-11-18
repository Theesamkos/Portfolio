import { z } from "zod";

/**
 * Project schema — mirrors docs/CONTENT.md field for field. `content/projects.ts`
 * is parsed with it at module load, so bad content fails the build and the tests.
 *
 * Arrays are `.readonly()`: content is a source of truth, nothing mutates it at runtime.
 */

const kebabCase = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Site-relative asset path under `public/`, e.g. `/projects/math-tiles/poster.svg`. */
const assetPath = z.string().startsWith("/");

const httpsUrl = z.url({ protocol: /^https$/ });

export const projectStatusSchema = z.enum(["live", "video", "coming-soon"]);
export const projectVisibilitySchema = z.enum(["public", "private", "team"]);

export const projectSchema = z
  .strictObject({
    id: z.string().regex(kebabCase, "id must be kebab-case"),
    title: z.string().min(1),
    pitch: z.string().min(1).max(90),
    bullets: z
      .tuple([z.string().min(1).max(110), z.string().min(1).max(110), z.string().min(1).max(110)])
      .readonly(),
    skills: z.array(z.string().min(1)).min(1).readonly(),
    tags: z.array(z.string().min(1)).readonly(),
    status: projectStatusSchema,
    visibility: projectVisibilitySchema,
    team: z.strictObject({ name: z.string().min(1), role: z.string().min(1) }).optional(),
    links: z.strictObject({
      demo: httpsUrl.optional(),
      repo: httpsUrl.optional(),
      video: httpsUrl.optional(),
    }),
    stack: z.array(z.string().min(1)).readonly(),
    assets: z.strictObject({
      poster: assetPath,
      screenshots: z.array(assetPath).readonly(),
    }),
    order: z.number().int().positive(),
  })
  // Rules from docs/CONTENT.md that span more than one field.
  .refine((project) => project.status !== "live" || project.links.demo !== undefined, {
    message: "a live project needs links.demo",
    path: ["links", "demo"],
  })
  .refine((project) => project.status !== "video" || project.links.video !== undefined, {
    message: "a video project needs links.video",
    path: ["links", "video"],
  })
  .refine((project) => project.visibility !== "team" || project.team !== undefined, {
    message: "a team project needs team credit",
    path: ["team"],
  })
  .refine((project) => project.visibility === "public" || project.links.repo === undefined, {
    message: "only public projects may link a repo",
    path: ["links", "repo"],
  });

/** What you write in `content/projects.ts`. */
export type ProjectInput = z.input<typeof projectSchema>;
/** What the app reads after validation. */
export type Project = z.output<typeof projectSchema>;
export type ProjectStatus = z.infer<typeof projectStatusSchema>;
export type ProjectVisibility = z.infer<typeof projectVisibilitySchema>;

/**
 * Builds the id enum from the data: pass the ids of the seeded projects and get a
 * Zod enum whose type is the union of exactly those ids. `content/projects.ts`
 * calls this, so adding a project there is the only step needed to extend the enum.
 */
export function projectIdEnum<const Ids extends readonly [string, ...string[]]>(ids: Ids) {
  return z.enum(ids);
}
