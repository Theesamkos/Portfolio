import { z } from "zod";

/**
 * Pure env validation — no `server-only` import, so next.config.ts and Vitest can load it.
 * App code should import the parsed values from `lib/env.ts` instead.
 */

type EnvSource = Record<string, string | undefined>;

export function createEnvParser<Schema extends z.ZodObject>(
  schema: Schema,
  requiredInProduction: readonly (keyof z.infer<Schema> & string)[],
) {
  return function parseEnv(source: EnvSource): z.infer<Schema> {
    // An empty string in a dashboard or .env file means "not set".
    const cleaned = Object.fromEntries(
      Object.entries(source).filter(([, value]) => value !== undefined && value.trim() !== ""),
    );

    const result = schema.safeParse(cleaned);
    if (!result.success) {
      // prettifyError lists variable names and what was expected, never the values.
      throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
    }

    // `next build` always sets NODE_ENV=production (CI and previews too), so the
    // production gate keys on Vercel's own marker for a real production deploy.
    if (cleaned.VERCEL_ENV === "production") {
      const data = result.data as Record<string, unknown>;
      const missing = requiredInProduction.filter((name) => data[name] === undefined);
      if (missing.length > 0) {
        throw new Error(
          `Missing required production environment variables: ${missing.join(", ")}. ` +
            "Set them in Vercel → Project → Settings → Environment Variables.",
        );
      }
    }

    return result.data;
  };
}

/**
 * Server environment. `.env.example` is the list of names; add each variable here
 * (as optional) and to `requiredInProduction` in the phase that first uses it.
 */
export const serverEnvSchema = z.object({
  // Set by Vercel on every deployment.
  VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),

  // AI guide (Phase 5). Provider is chosen in lib/guide/model.ts.
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),

  // Rate limiting — Upstash Redis (Phase 5).
  UPSTASH_REDIS_REST_URL: z.url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Request-code-access emails — Resend (Phase 6).
  RESEND_API_KEY: z.string().optional(),
  ACCESS_REQUEST_TO_EMAIL: z.email().optional(),
});

export const requiredInProduction: readonly (keyof z.infer<typeof serverEnvSchema>)[] = [];

export const parseServerEnv = createEnvParser(serverEnvSchema, requiredInProduction);
