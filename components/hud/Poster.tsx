import Image from "next/image";
import type { Project } from "@/lib/schema";

const RING_RADIUS = 300;
const INNER_RADIUS = 230;
const GAP_DEGREES = 6;
const CENTER = { x: 800, y: 500 };

function point(degrees: number, radius: number): string {
  const radians = ((degrees - 90) * Math.PI) / 180;
  const x = CENTER.x + radius * Math.cos(radians);
  const y = CENTER.y + radius * Math.sin(radians);
  return `${x.toFixed(1)} ${y.toFixed(1)}`;
}

/**
 * Placeholder poster: a segmented ring with this project's position lit. Drawn as
 * inline SVG on the server, so it costs no image request and can never be the
 * Largest Contentful Paint element — the hero text is. Accent on accent-soft
 * (docs/DESIGN.md "Project art"); colors come from the tokens.
 */
function PosterPlaceholder({ order, total }: { order: number; total: number }) {
  const step = 360 / total;
  const active = order - 1;
  const tick = active * step + step / 2;

  return (
    <svg
      viewBox="0 0 1600 1000"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
      className="border-line aspect-[16/7] w-full border-b bg-accent-soft"
    >
      <circle
        cx={CENTER.x}
        cy={CENTER.y}
        r={INNER_RADIUS}
        stroke="var(--glow)"
        strokeOpacity={0.8}
        strokeWidth={2}
      />
      {Array.from({ length: total }, (_, index) => {
        const start = index * step + GAP_DEGREES / 2;
        const end = (index + 1) * step - GAP_DEGREES / 2;
        const lit = index === active;
        return (
          <path
            key={index}
            d={`M${point(start, RING_RADIUS)} A${RING_RADIUS} ${RING_RADIUS} 0 0 1 ${point(end, RING_RADIUS)}`}
            stroke={lit ? "var(--accent)" : "var(--glow)"}
            strokeOpacity={lit ? 1 : 0.9}
            strokeLinecap="round"
            strokeWidth={lit ? 14 : 6}
          />
        );
      })}
      <path
        d={`M${point(tick, INNER_RADIUS)} L${point(tick, RING_RADIUS - 20)}`}
        stroke="var(--accent)"
        strokeWidth={3}
      />
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
