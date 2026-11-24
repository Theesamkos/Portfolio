import { Chip } from "@/components/ui/Chip";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { MonoLabel } from "@/components/ui/MonoLabel";
import type { Project } from "@/lib/schema";
import { Poster } from "./Poster";
import { ProjectLinks } from "./ProjectLinks";
import { StatusChip, VisibilityChip } from "./StatusChip";

/** `01 / 08` — a project's place on the ring. */
export function projectPosition(order: number, total: number): string {
  return `${String(order).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
}

/** One project in the list view: a pane of glass. A Server Component — plain HTML. */
export function ProjectCard({ project, total }: { project: Project; total: number }) {
  const headingId = `${project.id}-title`;

  return (
    <GlassPanel
      as="article"
      id={project.id}
      aria-labelledby={headingId}
      className="relative flex h-full flex-col overflow-hidden"
    >
      <Poster project={project} total={total} />

      <div className="flex flex-1 flex-col gap-4 p-5 md:p-6">
        {/* Never wraps: a wrap here before the mono font loads would shift the card. */}
        <div className="flex items-center gap-2">
          <MonoLabel className="mr-auto min-w-0 truncate">
            <span className="sr-only">Project </span>
            {projectPosition(project.order, total)}
          </MonoLabel>
          <StatusChip status={project.status} />
          <VisibilityChip visibility={project.visibility} />
        </div>

        <div className="flex flex-col gap-2">
          <h3 id={headingId} className="text-xl font-bold">
            {project.title}
          </h3>
          <p className="text-ink-dim text-base">{project.pitch}</p>
        </div>

        <ul className="text-ink-dim marker:text-accent flex list-disc flex-col gap-1.5 pl-5 text-sm">
          {project.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>

        {project.team ? (
          <p className="text-ink-dim text-sm">
            Team project with the {project.team.name}. Sam&apos;s role: {project.team.role}.
          </p>
        ) : null}

        <ul role="list" aria-label={`${project.title} skills`} className="flex flex-wrap gap-2">
          {project.skills.map((skill) => (
            <Chip key={skill} as="li">
              {skill}
            </Chip>
          ))}
        </ul>

        <ProjectLinks project={project} className="mt-auto pt-1" />
      </div>
    </GlassPanel>
  );
}
