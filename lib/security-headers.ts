/**
 * Security headers sent on every response (wired up in next.config.ts).
 * Pure module: no env access, so it is unit-testable.
 */

type Header = { key: string; value: string };
type Directives = Record<string, string[]>;

function serialize(directives: Directives): string {
  return Object.entries(directives)
    .map(([name, values]) => [name, ...values].join(" "))
    .join("; ");
}

/**
 * Enforced today. These directives cannot break rendering, and `frame-ancestors`
 * is only honored in an enforced policy — report-only would not stop framing.
 */
export const enforcedCsp: Directives = {
  "frame-ancestors": ["'none'"],
  "base-uri": ["'self'"],
  "object-src": ["'none'"],
  "form-action": ["'self'"],
};

/**
 * The full policy, in Report-Only mode until the launch phase: browsers log
 * violations to the console but block nothing. Tighten it as features land.
 */
export function reportOnlyCsp(isDev: boolean): Directives {
  return {
    "default-src": ["'self'"],
    // Next.js emits inline bootstrap scripts; nonces would force dynamic rendering.
    // React needs eval in development only (error stack reconstruction).
    "script-src": ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "blob:", "data:"],
    "font-src": ["'self'"],
    "connect-src": ["'self'"],
    ...enforcedCsp,
  };
}

export function securityHeaders({ isDev }: { isDev: boolean }): Header[] {
  return [
    // Two years. No `preload` until the site is on its own domain.
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    // Legacy twin of frame-ancestors for older browsers and scanners.
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Content-Security-Policy", value: serialize(enforcedCsp) },
    { key: "Content-Security-Policy-Report-Only", value: serialize(reportOnlyCsp(isDev)) },
  ];
}
