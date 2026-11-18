import { describe, expect, test } from "vitest";
import { z } from "zod";
import { createEnvParser, parseServerEnv } from "./env.schema";

const schema = z.object({
  VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
  EXAMPLE_API_KEY: z.string().min(8).optional(),
});
const parse = createEnvParser(schema, ["EXAMPLE_API_KEY"]);

describe("createEnvParser", () => {
  test("passes outside production when a required variable is missing", () => {
    expect(() => parse({})).not.toThrow();
    expect(() => parse({ VERCEL_ENV: "preview" })).not.toThrow();
  });

  test("throws in production when a required variable is missing, naming it", () => {
    expect(() => parse({ VERCEL_ENV: "production" })).toThrow(/EXAMPLE_API_KEY/);
  });

  test("treats an empty string as missing", () => {
    expect(() => parse({ VERCEL_ENV: "production", EXAMPLE_API_KEY: "  " })).toThrow(
      /EXAMPLE_API_KEY/,
    );
  });

  test("returns parsed values in production when everything is set", () => {
    expect(parse({ VERCEL_ENV: "production", EXAMPLE_API_KEY: "long-enough-key" })).toEqual({
      VERCEL_ENV: "production",
      EXAMPLE_API_KEY: "long-enough-key",
    });
  });

  test("rejects a malformed value in any environment without echoing it", () => {
    const attempt = () => parse({ EXAMPLE_API_KEY: "short" });
    expect(attempt).toThrow(/EXAMPLE_API_KEY/);
    expect(attempt).not.toThrow(/short/);
  });
});

describe("parseServerEnv", () => {
  test("accepts the real process environment shape", () => {
    expect(() => parseServerEnv({ VERCEL_ENV: "production" })).not.toThrow();
    expect(() => parseServerEnv({ VERCEL_ENV: "nonsense" })).toThrow(/VERCEL_ENV/);
  });

  test("requires nothing yet, even in production", () => {
    expect(parseServerEnv({ VERCEL_ENV: "production" })).toEqual({ VERCEL_ENV: "production" });
  });

  test("accepts every documented variable and drops unknown ones", () => {
    const full = {
      ANTHROPIC_API_KEY: "test-anthropic",
      OPENAI_API_KEY: "test-openai",
      UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "test-token",
      RESEND_API_KEY: "test-resend",
      ACCESS_REQUEST_TO_EMAIL: "owner@example.com",
    };

    expect(parseServerEnv({ ...full, PATH: "/usr/bin" })).toEqual(full);
  });

  test("validates ACCESS_REQUEST_TO_EMAIL as an email", () => {
    expect(() => parseServerEnv({ ACCESS_REQUEST_TO_EMAIL: "not-an-email" })).toThrow(
      /ACCESS_REQUEST_TO_EMAIL/,
    );
  });

  test("validates UPSTASH_REDIS_REST_URL as a URL", () => {
    expect(() => parseServerEnv({ UPSTASH_REDIS_REST_URL: "not a url" })).toThrow(
      /UPSTASH_REDIS_REST_URL/,
    );
  });
});
