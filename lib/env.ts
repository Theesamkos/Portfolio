import "server-only";

import { parseServerEnv } from "./env.schema";

/**
 * Validated server environment. Importing this from a Client Component fails the build,
 * which is the point: env values never reach the browser bundle.
 */
export const env = parseServerEnv(process.env);
