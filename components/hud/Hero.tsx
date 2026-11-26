import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import {
  ArrowRightIcon,
  DownloadIcon,
  GitHubIcon,
  LinkedInIcon,
  MailIcon,
} from "@/components/ui/icons";
import { site } from "@/lib/site";

const contactIcons: Record<(typeof site.contact)[number]["label"], ReactNode> = {
  Email: <MailIcon />,
  LinkedIn: <LinkedInIcon />,
  GitHub: <GitHubIcon />,
};

/**
 * Name, one-line identity, the two main actions and the contact links
 * (docs/DESIGN.md). The name is the page's Largest Contentful Paint element, so
 * nothing here waits on an image or on JavaScript.
 */
export function Hero() {
  return (
    <section
      id="top"
      data-hero
      aria-label="Introduction"
      // Little padding below: the ring's slot comes next. The list brings its own space.
      className="flex flex-col gap-6 pt-12 pb-4 md:gap-8 md:pt-20"
    >
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-extrabold md:text-3xl">{site.name}</h1>
        <p className="text-ink-dim max-w-2xl text-lg font-medium md:text-xl">{site.identity}</p>
      </div>

      {/* Under 640px the two buttons stack full-width, then the contact row. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Button href="#projects" icon={<ArrowRightIcon />} iconPosition="end">
          View projects
        </Button>
        <Button
          href={site.resumeHref}
          download="Samuel-Orth-Resume.pdf"
          variant="secondary"
          icon={<DownloadIcon />}
        >
          Download resume
        </Button>

        <span aria-hidden="true" className="bg-line mx-2 hidden h-8 w-px sm:block" />

        <nav aria-label="Contact">
          <ul role="list" className="flex flex-wrap gap-x-6">
            {site.contact.map(({ label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer me"}
                  className="text-ink hover:text-accent-ink pressable inline-flex min-h-11 items-center gap-2 text-sm font-medium"
                >
                  {contactIcons[label]}
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
