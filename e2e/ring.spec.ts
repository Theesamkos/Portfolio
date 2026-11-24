import { expect, test, type Page } from "@playwright/test";

/**
 * The 3D ring. Headless Chromium renders WebGL in software, so these tests prove the
 * ring mounts and that every way of driving it works — not that it is fast.
 */

const ring = (page: Page) => page.getByRole("group", { name: /3D ring of 8 projects/ });
const status = (page: Page) => page.getByRole("status");

/**
 * Opens the page and waits for the ring. Behavior tests pin the low effects tier:
 * they check keys, focus, drag and the panel, not rendering, and the full pipeline
 * drawn in software is slow enough on a CI runner to time a test out.
 */
async function openRing(page: Page, url = "/?tier=low") {
  await page.goto(url);
  // Software WebGL under parallel tests can take a few seconds to start.
  await expect(page.locator("canvas")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("html")).toHaveAttribute("data-view", "ring");
}

test("the ring mounts after first paint, without console errors, and hides the list", async ({
  page,
}) => {
  const problems: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(message.text());
  });
  page.on("pageerror", (error) => problems.push(error.message));

  // The default tier on purpose: this is the one test that runs the full pipeline.
  await openRing(page, "/");

  await expect(ring(page)).toHaveAccessibleName(/Software Factory is in front/);
  // The list is still in the DOM — hidden, not removed.
  await expect(page.getByRole("article")).toHaveCount(0);
  await expect(page.locator("article")).toHaveCount(8);
  // Panel titles are real DOM text, not pixels in the canvas.
  await expect(page.locator(".ring-stage").getByText("Software Factory")).toBeAttached();
  expect(problems).toEqual([]);
});

test("arrow keys turn the ring and announce the project; Enter opens it", async ({ page }) => {
  await openRing(page);
  await ring(page).focus();

  await page.keyboard.press("ArrowRight");
  await expect(status(page)).toHaveText("Math Tiles, project 2 of 8");
  await expect(ring(page)).toHaveAccessibleName(/Math Tiles is in front/);
  // Turning the ring does not open the panel.
  await expect(page.getByRole("dialog")).toBeHidden();

  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(status(page)).toHaveText("Acme Invoice Agent, project 8 of 8");

  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { level: 2 })).toHaveText("Acme Invoice Agent");
});

test("the ring follows the detail panel's Previous and Next", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openRing(page);
  await ring(page).focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { level: 2 })).toHaveText("Software Factory");
  await dialog.getByRole("button", { name: "Next" }).click();
  await expect(dialog.getByRole("heading", { level: 2 })).toHaveText("Math Tiles");
  await expect(ring(page)).toHaveAccessibleName(/Math Tiles is in front/);

  // And the other way: turning the ring while the panel is open moves the panel.
  await page.getByRole("button", { name: "Next project" }).click();
  await expect(dialog.getByRole("heading", { level: 2 })).toHaveText("ChatBridge");
});

test("the buttons under the ring step through the projects", async ({ page }) => {
  await openRing(page);

  await expect(page.getByText("Drag or use ← → to explore")).toBeVisible();
  await page.getByRole("button", { name: "Next project" }).click();
  await expect(status(page)).toHaveText("Math Tiles, project 2 of 8");
  await page.getByRole("button", { name: "Previous project" }).click();
  await expect(status(page)).toHaveText("Software Factory, project 1 of 8");
});

test("dragging the ring turns it to another project", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openRing(page);

  const box = (await ring(page).boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.1);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.1, { steps: 8 });
  await page.mouse.up();

  // Dragging left brings later projects to the front.
  await expect(status(page)).toHaveText(/project [2-4] of 8/);
});

test("List view switches to the list and back", async ({ page }) => {
  await openRing(page);
  const banner = page.getByRole("banner");

  await banner.getByRole("button", { name: "List view" }).click();
  await expect(page.getByRole("article")).toHaveCount(8);
  await expect(page.locator("canvas")).toBeHidden();

  await banner.getByRole("button", { name: "Ring view" }).click();
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(0);
});

test("?view=list never loads the ring", async ({ page }) => {
  await page.goto("/?view=list");
  await expect(page.getByRole("article")).toHaveCount(8);
  await page.waitForTimeout(2500);
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("at 375px the ring is a carousel: it mounts, steps, and does not scroll sideways", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openRing(page);

  await page.getByRole("button", { name: "Next project" }).click();
  await expect(status(page)).toHaveText("Math Tiles, project 2 of 8");

  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
});

test("with reduced motion the ring still works", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openRing(page);
  await ring(page).focus();
  await page.keyboard.press("ArrowRight");
  await expect(status(page)).toHaveText("Math Tiles, project 2 of 8");
});

/** Routes every script that is not in the first-load HTML — that is, the lazy 3D chunk. */
async function onLazyScripts(
  page: Page,
  handle: (route: import("@playwright/test").Route) => Promise<void>,
) {
  const html = await (await page.request.get("/")).text();
  const firstLoad = new Set([...html.matchAll(/src="([^"]+\.js[^"]*)"/g)].map((match) => match[1]));
  await page.route("**/_next/static/**/*.js*", async (route) => {
    const url = new URL(route.request().url());
    if (firstLoad.has(url.pathname + url.search) || firstLoad.has(url.pathname)) {
      await route.continue();
    } else {
      await handle(route);
    }
  });
}

test("if the 3D chunk fails to load, the list is still the page", async ({ page }) => {
  await onLazyScripts(page, (route) => route.abort());
  await page.goto("/");
  await page.waitForTimeout(3000);

  await expect(page.getByRole("heading", { level: 1, name: "Samuel Orth" })).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(8);
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("a visitor already reading the list keeps it when the ring arrives late", async ({ page }) => {
  await onLazyScripts(page, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    await route.continue();
  });
  await page.goto("/");

  const details = page.getByRole("button", { name: "Details: Sentinel Six" });
  await details.scrollIntoViewIfNeeded();
  await details.focus();
  const before = await page.evaluate(() => window.scrollY);

  // The ring becomes available: the nav offers it, and nothing else moves.
  await expect(page.getByRole("banner").getByRole("button", { name: "Ring view" })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByRole("article")).toHaveCount(8);
  await expect(details).toBeFocused();
  expect(await page.evaluate(() => window.scrollY)).toBe(before);

  await page.getByRole("banner").getByRole("button", { name: "Ring view" }).click();
  await expect(page.locator("canvas")).toBeVisible();
});

test("closing the panel in ring view returns focus to the ring", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openRing(page);
  await ring(page).focus();
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("button", { name: "Close project details" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(ring(page)).toBeFocused();
});

test("the hero stays clear of the open panel in ring view", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openRing(page);
  await ring(page).focus();
  await page.keyboard.press("Enter");

  const panel = (await page.getByRole("dialog").boundingBox())!;
  const github = (await page
    .getByRole("navigation", { name: "Contact" })
    .getByRole("link", { name: "GitHub" })
    .boundingBox())!;
  expect(github.x + github.width).toBeLessThanOrEqual(panel.x);
});

test("the controls under the ring are in the first screen", async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 375, height: 812 },
  ]) {
    await page.setViewportSize(viewport);
    await openRing(page);
    await expect(page.getByRole("button", { name: "Next project" })).toBeInViewport({ ratio: 1 });
  }
});

test("a lost WebGL context falls back to the list", async ({ page }) => {
  await openRing(page);
  await page.evaluate(() => {
    const canvas = document.querySelector("canvas")!;
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  });
  await expect(page.getByRole("article")).toHaveCount(8);
});
