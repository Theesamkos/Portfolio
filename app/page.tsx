import { Hero } from "@/components/hud/Hero";
import { ProjectList } from "@/components/hud/ProjectList";
import { projects } from "@/content/projects";
import { site } from "@/lib/site";

/**
 * The list view — the real site. Everything here is a Server Component, so the
 * full content arrives as HTML and works with JavaScript off. The 3D ring is
 * layered on top of it in Phase 3.
 */
export default function HomePage() {
  const email = site.contact[0];

  return (
    <>
      <a
        href="#main"
        className="bg-accent text-bg sr-only z-10 text-sm font-medium focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:px-4 focus:py-2"
      >
        Skip to projects
      </a>

      <Hero />

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 md:px-8">
        <ProjectList projects={projects} />
      </main>

      <footer className="border-line border-t">
        <div className="text-ink-dim mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-6 text-sm md:flex-row md:items-center md:justify-between md:px-8">
          <p>{site.name}</p>
          <a href={email.href} className="text-accent inline-flex min-h-11 items-center break-all">
            {email.text}
          </a>
        </div>
      </footer>
    </>
  );
}
