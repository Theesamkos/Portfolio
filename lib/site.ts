/**
 * Who the site is about. Every value comes from "Facts about Sam" in docs/AI_GUIDE.md —
 * change it there first, then here.
 */
export const site = {
  name: "Samuel Orth",
  identity: "AI engineer building agentic systems that ship.",
  /** Served from `public/resume.pdf`. */
  resumeHref: "/resume.pdf",
  contact: [
    { label: "Email", text: "samorthtech@gmail.com", href: "mailto:samorthtech@gmail.com" },
    {
      label: "LinkedIn",
      text: "linkedin.com/in/samuelorthtech",
      href: "https://www.linkedin.com/in/samuelorthtech",
    },
    { label: "GitHub", text: "github.com/Theesamkos", href: "https://github.com/Theesamkos" },
  ],
} as const;

/** Section anchors on the home page, in nav order. */
export const navLinks = [
  { label: "Projects", href: "#projects" },
  { label: "About", href: "#about" },
  { label: "Resume", href: site.resumeHref },
  { label: "Contact", href: "#contact" },
] as const;
