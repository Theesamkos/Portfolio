import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { GitHubIcon, PlayCircleIcon, PlayIcon } from "@/components/ui/icons";
import type { Project } from "@/lib/schema";

const linkOrder = ["demo", "video", "repo"] as const;
type LinkKind = (typeof linkOrder)[number];

const linkMeta: Record<LinkKind, { label: string; icon: ReactNode }> = {
  demo: { label: "Live demo", icon: <PlayIcon className="size-4" /> },
  video: { label: "Watch video", icon: <PlayCircleIcon /> },
  repo: { label: "Code", icon: <GitHubIcon /> },
};

/**
 * A project's link buttons, shared by the list card and the detail panel. Only links
 * that exist are rendered, and it renders nothing when there are none. `primaryDemo`
 * makes the live demo the one solid button (the detail panel does this).
 */
export function ProjectLinks({
  project,
  primaryDemo = false,
  className = "",
}: {
  project: Project;
  primaryDemo?: boolean;
  className?: string;
}) {
  const links = linkOrder.flatMap((kind) => {
    const href = project.links[kind];
    return href ? [{ kind, href }] : [];
  });
  if (links.length === 0) return null;

  return (
    <ul
      role="list"
      aria-label={`${project.title} links`}
      className={`flex flex-wrap gap-3 ${className}`.trim()}
    >
      {links.map(({ kind, href }) => (
        <li key={kind}>
          <Button
            href={href}
            rel="noopener noreferrer"
            variant={primaryDemo && kind === "demo" ? "primary" : "secondary"}
            icon={linkMeta[kind].icon}
          >
            {linkMeta[kind].label}
            <span className="sr-only">
              : {project.title}
              {kind === "repo" ? " on GitHub" : ""}
            </span>
          </Button>
        </li>
      ))}
    </ul>
  );
}
