import { Chip } from "@/components/ui/Chip";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { MonoLabel } from "@/components/ui/MonoLabel";
import type { FeaturedProject } from "@/content/projects";
import { projectPosition } from "@/lib/project-position";
import { Poster } from "./Poster";
import { ProjectCardTrigger } from "./ProjectCardTrigger";
import { ProjectLinks } from "./ProjectLinks";
import { StatusChip, VisibilityChip } from "./StatusChip";

/**
 * One project in the list view: a pane of glass. A Server Component — plain HTML;
 * the only client JavaScript is the small "Details" trigger.
 */
export function ProjectCard({ project, total }: { project: FeaturedProject; total: number }) {
  const headingId = `${project.id}-title`;

  return (
    <GlassPanel
      as="article"
      id={project.id}
      aria-labelledby={headingId}
      // No blur: only the page gradient is behind a card, and blurring a gradient
      // changes nothing visible (docs/DECISIONS.md).
      blur={false}
      className="relative flex h-full flex-col overflow-hidden"
    >
      <Poster project={project} total={total} />

      <div className="flex flex-1 flex-col gap-4 p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-2">
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
          {/* Above the trigger's click layer (like the lists below), so the copy can be selected. */}
          <p className="text-ink-dim relative z-10 text-base">{project.pitch}</p>
        </div>

        <ul className="text-ink-dim marker:text-accent relative z-10 flex list-disc flex-col gap-1.5 pl-5 text-sm">
          {project.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>

        {project.team ? (
          <p className="text-ink-dim relative z-10 text-sm">
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

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Above the trigger's stretched click layer, so the links stay clickable. */}
          <ProjectLinks project={project} className="relative z-10" />
          <span className="ml-auto">
            <ProjectCardTrigger id={project.id} title={project.title} />
          </span>
        </div>
      </div>
    </GlassPanel>
  );
}
