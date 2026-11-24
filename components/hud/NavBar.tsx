import { Button } from "@/components/ui/Button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { MenuIcon } from "@/components/ui/icons";
import { navLinks, site } from "@/lib/site";
import { NavMenu } from "./NavMenu";
import { ViewToggle } from "./ViewToggle";

const MENU_ID = "site-menu";

const linkClass =
  "text-ink hover:text-accent-ink duration-hover inline-flex min-h-11 items-center px-1 text-base font-medium transition-colors";

/**
 * The sticky glass nav bar (docs/DESIGN.md). Desktop: name, anchor links, "List view"
 * and "Contact me". Under 1024px: name, "List view" and a menu button; the links and
 * "Contact me" move into the menu. Everything is a plain link, so it works without JS.
 *
 * "List view" is a link to the project list until the ring has loaded, then a toggle
 * between the ring and the list (ViewToggle).
 */
export function NavBar() {
  const email = site.contact[0];

  return (
    <header className="sticky top-4 z-30 mx-auto mt-4 w-full max-w-6xl px-4 lg:px-8">
      <GlassPanel
        strong
        radius="pill"
        className="flex min-h-14 items-center gap-3 py-1.5 pr-1.5 pl-5 lg:pl-6"
      >
        <a
          href="#top"
          className="text-ink inline-flex min-h-11 shrink-0 items-center text-lg font-bold whitespace-nowrap"
        >
          {site.name}
        </a>

        <nav aria-label="Primary" className="mx-auto hidden lg:block">
          <ul role="list" className="flex items-center gap-8">
            {navLinks.map(({ label, href }) => (
              <li key={label}>
                <a href={href} className={linkClass}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0">
          <ViewToggle />
          {/* The wrapper hides it: `hidden` on the Button would lose to its own `inline-flex`. */}
          <span className="hidden lg:contents">
            <Button href={email.href}>Contact me</Button>
          </span>
          <button
            type="button"
            popoverTarget={MENU_ID}
            aria-label="Menu"
            className="border-line bg-glass text-ink hover:bg-accent-soft duration-hover inline-flex size-11 cursor-pointer items-center justify-center rounded-full border transition-colors lg:hidden"
          >
            <MenuIcon />
          </button>
        </div>
      </GlassPanel>

      <NavMenu id={MENU_ID}>
        <nav aria-label="Menu">
          <ul role="list" className="flex flex-col">
            {navLinks.map(({ label, href }) => (
              <li key={label}>
                <a href={href} className={`${linkClass} w-full px-3`}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <Button href={email.href} className="mt-2 w-full">
            Contact me
          </Button>
        </nav>
      </NavMenu>
    </header>
  );
}
