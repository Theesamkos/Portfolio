import type { ReactNode } from "react";
import { MonoLabel } from "@/components/ui/MonoLabel";
import type { FeaturedProject } from "@/content/projects";
import { ProjectCard } from "./ProjectCard";

/**
 * The projects section. The list — every project, server-rendered, in ring order — is
 * the real content and works with JavaScript off. `ring` is the slot for the 3D ring,
 * which loads after first paint; in ring view the list is hidden with CSS
 * (`html[data-view="ring"] [data-project-list]`, app/globals.css) but stays in the DOM.
 */
export function ProjectList({
  projects,
  ring,
}: {
  projects: readonly FeaturedProject[];
  ring?: ReactNode;
}) {
  return (
    <section id="projects" aria-labelledby="projects-heading">
      {ring}
      <div data-project-list className="flex flex-col gap-6">
        <div className="border-line flex items-baseline justify-between gap-4 border-b pb-3">
          <h2 id="projects-heading" className="text-xl font-bold">
            Featured projects
          </h2>
          <MonoLabel as="p" tone="dim">
            {projects.length} projects
          </MonoLabel>
        </div>

        {/* role="list": Safari drops list semantics when list-style is none (Tailwind's reset). */}
        <ol role="list" className="grid gap-6 md:grid-cols-2">
          {projects.map((project) => (
            <li key={project.id} className="min-w-0">
              <ProjectCard project={project} total={projects.length} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
