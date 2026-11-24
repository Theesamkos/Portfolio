import type { Project } from "@/lib/schema";
import { Poster } from "./Poster";
import { StatusChip, VisibilityChip } from "./StatusChip";

const linkLabels = { demo: "Live demo", video: "Video", repo: "Code" } as const;
const linkOrder = ["demo", "video", "repo"] as const;

/** One project in the list view. A Server Component: plain HTML, no client JS. */
export function ProjectCard({ project, total }: { project: Project; total: number }) {
  const headingId = `${project.id}-title`;
  const links = linkOrder.flatMap((kind) => {
    const href = project.links[kind];
    return href ? [{ kind, href }] : [];
  });
  const position = `${String(project.order).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;

  return (
    <article
      id={project.id}
      aria-labelledby={headingId}
      className="glass rounded-panel relative flex h-full flex-col overflow-hidden"
    >
      <Poster project={project} total={total} />

      <div className="flex flex-1 flex-col gap-4 p-5">
        {/* Never wraps: a wrap here before the mono font loads would shift the card. */}
        <div className="flex items-center gap-2">
          <span className="text-ink-dim tracking-readout mr-auto min-w-0 truncate font-mono text-xs uppercase">
            <span className="sr-only">Project </span>
            {position}
          </span>
          <StatusChip status={project.status} />
          <VisibilityChip visibility={project.visibility} />
        </div>

        <div className="flex flex-col gap-2">
          <h3 id={headingId} className="text-xl font-bold">
            {project.title}
          </h3>
          <p className="text-base">{project.pitch}</p>
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
            <li
              key={skill}
              className="border-line text-ink tracking-readout border px-2 py-0.5 font-mono text-xs uppercase"
            >
              {skill}
            </li>
          ))}
        </ul>

        {links.length > 0 ? (
          <ul
            role="list"
            aria-label={`${project.title} links`}
            className="mt-auto flex flex-wrap gap-3 pt-1"
          >
            {links.map(({ kind, href }) => (
              <li key={kind}>
                <a
                  href={href}
                  rel="noopener noreferrer"
                  className="border-accent text-accent-ink hover:bg-accent hover:text-on-accent duration-hover inline-flex min-h-11 items-center border px-4 text-sm font-medium transition-colors"
                >
                  {linkLabels[kind]}
                  <span className="sr-only">
                    : {project.title}
                    {kind === "repo" ? " on GitHub" : ""}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
