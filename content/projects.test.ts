import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { projectIdSchema, projects, getProject } from "@/content/projects";
import { projectSchema, type ProjectInput } from "@/lib/schema";

const publicRepos = ["math-tiles", "chatbridge", "acme-invoice-agent", "autonomous-ad-engine"];

describe("content/projects", () => {
  test("has the 8 featured projects", () => {
    expect(projects).toHaveLength(8);
  });

  test.each(projects.map((project) => [project.id, project] as const))(
    "%s validates against the schema",
    (_id, project) => {
      expect(projectSchema.safeParse(project).success).toBe(true);
    },
  );

  test("ids are unique", () => {
    const ids = projects.map((project) => project.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("order is unique and runs 1 to 8 with no gaps", () => {
    expect(projects.map((project) => project.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  test("the id enum is derived from the data", () => {
    expect([...projectIdSchema.options].sort()).toEqual(projects.map((p) => p.id).sort());
    expect(projectIdSchema.safeParse("not-a-project").success).toBe(false);
  });

  test("getProject returns the matching project", () => {
    expect(getProject("legacylens").title).toBe("LegacyLens");
  });

  test("every status is coming-soon until links are verified", () => {
    expect(projects.every((project) => project.status === "coming-soon")).toBe(true);
    expect(projects.every((project) => !project.links.demo && !project.links.video)).toBe(true);
  });

  test("only the public repos carry a repo link, on Sam's GitHub", () => {
    const linked = projects.filter((project) => project.links.repo);
    expect(linked.map((project) => project.id).sort()).toEqual([...publicRepos].sort());
    for (const project of linked) {
      expect(project.visibility).toBe("public");
      expect(project.links.repo).toBe(`https://github.com/Theesamkos/${project.id}`);
    }
  });

  test("every poster file exists under public/", () => {
    for (const project of projects) {
      expect(existsSync(join(process.cwd(), "public", project.assets.poster))).toBe(true);
    }
  });
});

describe("projectSchema", () => {
  const valid: ProjectInput = {
    id: "example-project",
    title: "Example",
    pitch: "One line",
    bullets: ["one", "two", "three"],
    skills: ["Testing"],
    tags: [],
    status: "coming-soon",
    visibility: "public",
    links: {},
    stack: [],
    assets: { poster: "/projects/example-project/poster.svg", screenshots: [] },
    order: 1,
  };
  const rejects = (override: Partial<ProjectInput>) =>
    expect(projectSchema.safeParse({ ...valid, ...override }).success).toBe(false);

  test("accepts a minimal valid project", () => {
    expect(projectSchema.safeParse(valid).success).toBe(true);
  });

  test("rejects an id that is not kebab-case", () => {
    rejects({ id: "Example Project" });
  });

  test("rejects a pitch over 90 characters", () => {
    rejects({ pitch: "x".repeat(91) });
  });

  test("rejects a bullet over 110 characters", () => {
    rejects({ bullets: ["one", "two", "x".repeat(111)] });
  });

  test("rejects a link that is not https", () => {
    rejects({ links: { repo: "http://github.com/example/example" } });
  });

  test("rejects a live project with no demo link", () => {
    rejects({ status: "live" });
  });

  test("rejects a video project with no video link", () => {
    rejects({ status: "video" });
  });

  test("rejects a team project with no team credit", () => {
    rejects({ visibility: "team" });
  });

  test("rejects a repo link on a private project", () => {
    rejects({ visibility: "private", links: { repo: "https://github.com/example/example" } });
  });

  test("rejects unknown fields", () => {
    expect(projectSchema.safeParse({ ...valid, metric: "10x faster" }).success).toBe(false);
  });
});
