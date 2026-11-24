import { expect, test } from "@playwright/test";

test("home page renders", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Samuel Orth" })).toBeVisible();
});

test("home page is served with security headers", async ({ request }) => {
  const headers = (await request.get("/")).headers();

  expect(headers["strict-transport-security"]).toContain("max-age=63072000");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["permissions-policy"]).toContain("camera=()");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["content-security-policy-report-only"]).toContain("default-src 'self'");
  expect(headers["x-powered-by"]).toBeUndefined();
});

test("home page loads without console errors or CSP violations", async ({ page }) => {
  const problems: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(message.text());
  });
  page.on("pageerror", (error) => problems.push(error.message));

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  expect(problems).toEqual([]);
});

test.describe("list view", () => {
  test("renders all 8 project cards with a contact row", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("article")).toHaveCount(8);
    const contact = page.getByRole("navigation", { name: "Contact" });
    await expect(contact.getByRole("link")).toHaveCount(3);
    await expect(page.getByRole("link", { name: /^Code/ })).toHaveCount(4);
  });

  test("keyboard: first Tab reaches the skip link, which is visible when focused", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");

    const skipLink = page.getByRole("link", { name: "Skip to projects" });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeInViewport();
  });

  test("placeholder posters are drawn inline and request no images", async ({ page }) => {
    const imageRequests: string[] = [];
    page.on("request", (request) => {
      if (request.resourceType() === "image" && !request.url().endsWith("/icon.svg")) {
        imageRequests.push(request.url());
      }
    });

    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    await expect(page.locator("article > svg")).toHaveCount(8);
    await expect(page.locator("article img")).toHaveCount(0);
    expect(imageRequests).toEqual([]);
  });
});

// Speed budget (AGENTS.md): the Largest Contentful Paint must be hero text that
// arrives in the HTML, never a poster or anything else that needs a second request.
for (const viewport of [
  { width: 375, height: 812 },
  { width: 1280, height: 720 },
]) {
  test(`largest contentful paint is hero text at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");

    const lcp = await page.evaluate(
      () =>
        new Promise<{ tag: string; inHero: boolean }>((resolve) => {
          new PerformanceObserver((list) => {
            const entry = list.getEntries().at(-1) as PerformanceEntry & { element?: Element };
            resolve({
              tag: entry.element?.tagName ?? "none",
              inHero: Boolean(entry.element?.closest("[data-hero]")),
            });
          }).observe({ type: "largest-contentful-paint", buffered: true });
        }),
    );

    expect(lcp.tag).not.toBe("IMG");
    expect(lcp.inHero).toBe(true);
  });
}

test.describe("list view at 375px", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("shows 8 cards with no horizontal scroll", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("article")).toHaveCount(8);
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test("keeps a 16px gutter around every card", async ({ page }) => {
    await page.goto("/");

    for (const card of await page.getByRole("article").all()) {
      const box = await card.boundingBox();
      expect(box?.x).toBeGreaterThanOrEqual(16);
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(375 - 16);
    }
  });
});

test.describe("list view with JavaScript disabled", () => {
  test.use({ javaScriptEnabled: false });

  test("shows the hero, contact links and all 8 projects", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1, name: "Samuel Orth" })).toBeVisible();
    const contact = page.getByRole("navigation", { name: "Contact" });
    await expect(contact.getByRole("link", { name: /email/i })).toBeVisible();
    await expect(contact.getByRole("link", { name: /linkedin/i })).toBeVisible();
    await expect(contact.getByRole("link", { name: /github/i })).toBeVisible();
    await expect(
      page.getByRole("contentinfo").getByRole("link", { name: "samorthtech@gmail.com" }),
    ).toBeVisible();

    const cards = page.getByRole("article");
    await expect(cards).toHaveCount(8);
    for (const card of await cards.all()) {
      await expect(card.getByRole("heading", { level: 3 })).toBeVisible();
      await expect(card.getByRole("listitem").first()).toBeVisible();
      await expect(card.getByText("Coming soon")).toBeVisible();
    }
    await expect(page.getByRole("link", { name: /^Code/ })).toHaveCount(4);
  });
});
