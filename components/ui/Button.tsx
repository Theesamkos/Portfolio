import type { ComponentPropsWithoutRef, ReactNode } from "react";

/**
 * The one button shape (docs/DESIGN.md): a 44px pill, icon + label with an 8px gap.
 * Primary is solid accent; secondary is a hairline outline on glass.
 *
 * Pass `href` and it renders a link, otherwise a `<button type="button">` — so
 * navigation is always a real link and actions are always a real button.
 */

export type ButtonVariant = "primary" | "secondary";

type Shared = {
  variant?: ButtonVariant;
  /** Decorative icon. Rendered before the label unless `iconPosition="end"`. */
  icon?: ReactNode;
  iconPosition?: "start" | "end";
  children: ReactNode;
};

type LinkProps = Shared & { href: string } & Omit<ComponentPropsWithoutRef<"a">, "href">;
type ActionProps = Shared & { href?: undefined } & ComponentPropsWithoutRef<"button">;

export type ButtonProps = LinkProps | ActionProps;

const base =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold whitespace-nowrap transition-colors duration-hover disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover",
  secondary: "border-line bg-glass text-ink hover:bg-accent-soft border",
};

export function buttonClasses(variant: ButtonVariant = "primary", className = ""): string {
  return `${base} ${variants[variant]} ${className}`.trim();
}

export function Button(props: ButtonProps) {
  const { variant = "primary", icon, iconPosition = "start", className, children, ...rest } = props;
  const classes = buttonClasses(variant, className);
  const content = (
    <>
      {iconPosition === "start" ? icon : null}
      <span>{children}</span>
      {iconPosition === "end" ? icon : null}
    </>
  );

  if (rest.href !== undefined) {
    return (
      <a data-variant={variant} className={classes} {...rest}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" data-variant={variant} className={classes} {...rest}>
      {content}
    </button>
  );
}
