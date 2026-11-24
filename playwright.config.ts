import { defineConfig, devices } from "@playwright/test";

// `PORT=3100 pnpm e2e` runs the suite on another port when 3000 is taken.
const PORT = Number(process.env.PORT ?? 3000);
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Smoke tests run against the production build, so headers and output match what ships.
  webServer: {
    // CI builds in its own step first; locally the build happens here.
    command: isCI ? "pnpm start" : "pnpm build && pnpm start",
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
});
