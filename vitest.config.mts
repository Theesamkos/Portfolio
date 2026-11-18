import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Vite resolves the "@/*" alias from tsconfig.json natively; no plugin needed.
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    // e2e/ belongs to Playwright.
    exclude: ["node_modules/**", ".next/**", "e2e/**"],
  },
});
