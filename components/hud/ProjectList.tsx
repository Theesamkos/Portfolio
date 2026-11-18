import type { Project } from "@/lib/schema";
import { ProjectCard } from "./ProjectCard";

/** The list view: every project, server-rendered, in ring order. */
export function ProjectList({ projects }: { projects: readonly Project[] }) {
  return (
    <section aria-labelledby="projects-heading" className="flex flex-col gap-6">
      <div className="border-line flex items-baseline justify-between gap-4 border-b pb-3">
        <h2 id="projects-heading" className="font-display text-lg font-semibold">
          Featured projects
        </h2>
        <p className="text-ink-dim tracking-readout font-mono text-xs uppercase">
          {projects.length} projects
        </p>
      </div>

      <ol className="grid gap-6 md:grid-cols-2">
        {projects.map((project, index) => (
          <li key={project.id}>
            {/* The first row is on screen at load; the rest load as they scroll in. */}
            <ProjectCard project={project} total={projects.length} eager={index < 2} />
          </li>
        ))}
      </ol>
    </section>
  );
}
