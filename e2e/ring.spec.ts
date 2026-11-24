import { expect, test, type Page } from "@playwright/test";

/**
 * The 3D ring. Headless Chromium renders WebGL in software, so these tests prove the
 * ring mounts and that every way of driving it works — not that it is fast.
 */

const ring = (page: Page) => page.getByRole("group", { name: /3D ring of 8 projects/ });
const status = (page: Page) => page.getByRole("status");

async function openRing(page: Page, url = "/") {
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

  await openRing(page);

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
