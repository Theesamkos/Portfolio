import Image from "next/image";
import { POSTER, posterSegments, posterTick } from "@/lib/poster-art";
import type { Project } from "@/lib/schema";

/**
 * Placeholder poster: a segmented ring with this project's position lit. Drawn as
 * inline SVG on the server, so it costs no image request and can never be the
 * Largest Contentful Paint element — the hero text is. Accent on accent-soft
 * (docs/DESIGN.md "Project art"); colors come from the tokens.
 */
function PosterPlaceholder({ order, total }: { order: number; total: number }) {
  return (
    <svg
      viewBox={`0 0 ${POSTER.width} ${POSTER.height}`}
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
      className="border-line aspect-[16/7] w-full border-b bg-accent-soft"
    >
      <circle
        cx={POSTER.center.x}
        cy={POSTER.center.y}
        r={POSTER.innerRadius}
        stroke="var(--glow)"
        strokeOpacity={0.8}
        strokeWidth={2}
      />
      {posterSegments(order, total).map(({ d, lit }, index) => (
        <path
          key={index}
          d={d}
          stroke={lit ? "var(--accent)" : "var(--glow)"}
          strokeOpacity={lit ? 1 : 0.9}
          strokeLinecap="round"
          strokeWidth={lit ? 14 : 6}
        />
      ))}
      <path d={posterTick(order, total)} stroke="var(--accent)" strokeWidth={3} />
    </svg>
  );
}

/**
 * The card's poster. Until Phase 7, `assets.poster` is a generated `poster.svg`
 * and the inline placeholder is drawn instead. A real poster (`poster.webp`) is a
 * lazy-loaded image with no priority: posters must not compete with the hero text
 * for first paint.
 */
export function Poster({ project, total }: { project: Project; total: number }) {
  if (project.assets.poster.endsWith("/poster.svg")) {
    return <PosterPlaceholder order={project.order} total={total} />;
  }

  return (
    <Image
      src={project.assets.poster}
      alt=""
      width={1600}
      height={1000}
      loading="lazy"
      sizes="(min-width: 768px) 50vw, 100vw"
      className="border-line aspect-[16/7] w-full border-b object-cover"
    />
  );
}
