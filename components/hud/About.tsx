import { GlassPanel } from "@/components/ui/GlassPanel";
import { MonoLabel } from "@/components/ui/MonoLabel";
import { site } from "@/lib/site";

/**
 * Three sentences about Sam, shown from 1024px up. The copy lives in lib/site.ts;
 * facts from docs/AI_GUIDE.md only.
 */
export function About() {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      // Desktop only: on a phone the first screens belong to the projects. Hidden with
      // CSS, so it is the same with JavaScript off.
      className="hidden flex-col gap-6 pt-16 lg:flex"
    >
      <div className="border-line flex items-baseline justify-between gap-4 border-b pb-3">
        <h2 id="about-heading" className="text-xl font-bold">
          About
        </h2>
        <MonoLabel as="p" tone="dim">
          Bogotá, Colombia
        </MonoLabel>
      </div>

      <GlassPanel blur={false} className="flex flex-col gap-4 p-6 md:p-8">
        {site.about.map((sentence) => (
          <p key={sentence} className="max-w-3xl text-base md:text-lg">
            {sentence}
          </p>
        ))}
      </GlassPanel>
    </section>
  );
}
