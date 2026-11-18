import { expect, test } from "vitest";
import { securityHeaders } from "./security-headers";

function headerMap(isDev: boolean) {
  return new Map(securityHeaders({ isDev }).map(({ key, value }) => [key, value]));
}

test("sends the baseline headers", () => {
  const headers = headerMap(false);

  expect(headers.get("Strict-Transport-Security")).toBe("max-age=63072000; includeSubDomains");
  expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
  expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  expect(headers.get("Permissions-Policy")).toBe("camera=(), microphone=(), geolocation=()");
  expect(headers.get("X-Frame-Options")).toBe("DENY");
});

test("enforces only the directives that cannot break rendering", () => {
  expect(headerMap(false).get("Content-Security-Policy")).toBe(
    "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  );
});

test("ships the full policy as report-only", () => {
  const policy = headerMap(false).get("Content-Security-Policy-Report-Only");

  expect(policy).toContain("default-src 'self'");
  expect(policy).toContain("frame-ancestors 'none'");
});

test("allows eval in development only", () => {
  expect(headerMap(true).get("Content-Security-Policy-Report-Only")).toContain("'unsafe-eval'");
  expect(headerMap(false).get("Content-Security-Policy-Report-Only")).not.toContain(
    "'unsafe-eval'",
  );
});
