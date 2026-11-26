import { About } from "@/components/hud/About";
import { DetailPanel } from "@/components/hud/DetailPanel";
import { Hero } from "@/components/hud/Hero";
import { NavBar } from "@/components/hud/NavBar";
import { ProjectList } from "@/components/hud/ProjectList";
import { RingStage } from "@/components/hud/RingStage";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { projects } from "@/content/projects";
import { site } from "@/lib/site";

/** The ring gets only the fields it draws, so the rest of the content stays on the server. */
const ringProjects = projects.map(({ id, title, pitch, status, order, assets }) => ({
  id,
  title,
  pitch,
  status,
  order,
  icon: assets.icon,
}));

/**
 * The list view — the real site. The content is all Server Components, so it arrives
 * as HTML and works with JavaScript off. The 3D ring loads after first paint
 * (RingStage) and takes the list's place until "List view" is chosen.
 */
export default function HomePage() {
  return (
    <>
      <a
        href="#projects"
        className="bg-accent text-on-accent sr-only z-40 rounded-full text-sm font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:px-4 focus:py-2"
      >
        Skip to projects
      </a>

      <NavBar />

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 md:px-8">
        <Hero />
        <ProjectList projects={projects} ring={<RingStage projects={ringProjects} />} />
        <About />
      </main>

      <footer id="contact" className="mx-auto w-full max-w-6xl px-4 pb-8 md:px-8">
        <GlassPanel
          blur={false}
          className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <h2 className="text-lg font-bold">Contact</h2>
            <p className="text-ink-dim text-sm">{site.name}</p>
          </div>
          <ul role="list" className="flex flex-col gap-x-6 md:flex-row md:flex-wrap">
            {site.contact.map(({ label, text, href }) => (
              <li key={label}>
                <a
                  href={href}
                  rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer me"}
                  className="text-accent-ink hover:text-accent-hover duration-hover inline-flex min-h-11 items-center text-sm break-all underline-offset-4 transition-colors hover:underline"
                >
                  {text}
                </a>
              </li>
            ))}
          </ul>
        </GlassPanel>
      </footer>

      <DetailPanel projects={projects} />
    </>
  );
}
