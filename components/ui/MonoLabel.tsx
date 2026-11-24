import type { ReactNode } from "react";

/** A data readout (docs/DESIGN.md): JetBrains Mono, uppercase, 12px, tracked out. */
export function MonoLabel({
  as: Tag = "span",
  tone = "accent",
  className = "",
  children,
}: {
  as?: "span" | "p";
  tone?: "accent" | "dim";
  className?: string;
  children: ReactNode;
}) {
  const color = tone === "accent" ? "text-accent-ink" : "text-ink-dim";
  return (
    <Tag className={`tracking-readout font-mono text-xs uppercase ${color} ${className}`.trim()}>
      {children}
    </Tag>
  );
}
