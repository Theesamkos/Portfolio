import type { NextConfig } from "next";
import { parseServerEnv } from "./lib/env.schema";
import { securityHeaders } from "./lib/security-headers";

// Validate env before anything builds: a bad or missing variable fails `next build` here.
parseServerEnv(process.env);

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Don't advertise the framework version.
  poweredByHeader: false,
  // `next dev` otherwise appends its own rules block to AGENTS.md on every start.
  // AGENTS.md is written by hand in this repo.
  agentRules: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders({ isDev }) }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
