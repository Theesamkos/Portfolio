import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";

/**
 * Fonts from docs/DESIGN.md. next/font downloads them at build time and serves them
 * from our own origin, so the browser never contacts Google and `font-src 'self'`
 * in the CSP stays true. Each one exposes a CSS variable that app/globals.css maps
 * to a Tailwind family (font-sans, font-display, font-mono).
 */

/** Body and UI. */
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

/** Display: headings and the hero. */
export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
});

/** Data readouts and chips. Small text only, so it is not preloaded. */
export const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
  preload: false,
});

export const fontVariables = [inter.variable, spaceGrotesk.variable, jetBrainsMono.variable].join(
  " ",
);
