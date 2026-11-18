import { site } from "@/lib/site";

/** Name, one-line identity and the always-visible contact row. */
export function Hero() {
  return (
    <header className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pt-12 pb-10 md:px-8 md:pt-20">
      <p className="text-accent tracking-readout font-mono text-xs uppercase">Portfolio</p>
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
          {site.name}
        </h1>
        <p className="text-ink-dim max-w-2xl text-lg">{site.identity}</p>
      </div>

      <nav aria-label="Contact">
        <ul className="flex flex-col gap-x-8 sm:flex-row sm:flex-wrap">
          {site.contact.map(({ label, text, href }) => (
            <li key={label}>
              <a
                href={href}
                rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer me"}
                className="group inline-flex min-h-11 items-center gap-2 text-sm"
              >
                <span className="text-ink-dim tracking-readout font-mono text-xs uppercase">
                  {label}
                </span>
                <span className="text-accent break-all underline-offset-4 group-hover:underline">
                  {text}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
