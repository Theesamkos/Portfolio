import type { NextConfig } from "next";
import { parseServerEnv } from "./lib/env.schema";

// Validate env before anything builds: a bad or missing variable fails `next build` here.
parseServerEnv(process.env);

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
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
