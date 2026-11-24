import type { Project } from "@/lib/schema";
import { ProjectCard } from "./ProjectCard";

/** The list view: every project, server-rendered, in ring order. */
export function ProjectList({ projects }: { projects: readonly Project[] }) {
  return (
    <section id="projects" aria-labelledby="projects-heading" className="flex flex-col gap-6">
      <div className="border-line flex items-baseline justify-between gap-4 border-b pb-3">
        <h2 id="projects-heading" className="text-lg font-bold">
          Featured projects
        </h2>
        <p className="text-ink-dim tracking-readout font-mono text-xs uppercase">
          {projects.length} projects
        </p>
      </div>

      {/* role="list": Safari drops list semantics when list-style is none (Tailwind's reset). */}
      <ol role="list" className="grid gap-6 md:grid-cols-2">
        {projects.map((project) => (
          <li key={project.id}>
            <ProjectCard project={project} total={projects.length} />
          </li>
        ))}
      </ol>
    </section>
  );
}
