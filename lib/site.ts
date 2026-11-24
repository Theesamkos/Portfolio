/**
 * Who the site is about. Every value comes from "Facts about Sam" in docs/AI_GUIDE.md —
 * change it there first, then here.
 */
export const site = {
  name: "Samuel Orth",
  identity: "AI engineer building agentic systems that ship.",
  /** Served from `public/resume.pdf`. */
  resumeHref: "/resume.pdf",
  /** The About section. Each sentence restates facts from docs/AI_GUIDE.md and nothing else. */
  about: [
    "I'm Sam Orth, an AI engineer based in Bogotá, Colombia, and Lead Engineer at Dodge AI, where I build production AI agents and full-stack systems.",
    "I'm a U.S. Navy veteran and a 2026 graduate of Gauntlet AI's AI engineering program; before software I was an ironworker, a utility technician, and ran my own construction company.",
    "I'm authorized to work in the US and Colombia and open to remote US roles, Bogotá roles, or relocating for the right role.",
  ],
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
