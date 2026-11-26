import { expect, test } from "@playwright/test";

/**
 * The ring replaces the list once it has loaded (e2e/ring.spec.ts covers it). Tests of
 * the list itself open the page with `?view=list`, which keeps the ring from loading.
 * Tests that go to "/" run with the ring on the page.
 */
const LIST = "/?view=list";

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
    await page.goto(LIST);

    await expect(page.getByRole("article")).toHaveCount(8);
    const contact = page.getByRole("navigation", { name: "Contact" });
    await expect(contact.getByRole("link")).toHaveCount(3);
    await expect(page.getByRole("link", { name: /^Code/ })).toHaveCount(4);
  });

  test("keyboard: first Tab reaches the skip link, which is visible when focused", async ({
    page,
  }) => {
    await page.goto(LIST);
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

    await page.goto(LIST);
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
    await page.goto(LIST);

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
    await page.goto(LIST);

    await expect(page.getByRole("article")).toHaveCount(8);
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test("keeps a 16px gutter around every card", async ({ page }) => {
    await page.goto(LIST);

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

    // The Details buttons need JavaScript, so they are hidden; nothing else is lost.
    await expect(page.getByRole("button", { name: /^Details/ })).toHaveCount(0);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 2, name: "About" })).toBeVisible();
    await expect(page.getByRole("region", { name: "About" }).getByRole("paragraph")).toHaveCount(4);
    await expect(page.getByRole("link", { name: "Download resume" })).toBeVisible();
  });

  test("the mobile menu opens without JavaScript (native popover)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    const menu = page.getByRole("navigation", { name: "Menu" });
    await expect(menu).toBeHidden();
    await page.getByRole("button", { name: "Menu" }).click();
    await expect(menu.getByRole("link", { name: "Resume" })).toBeVisible();
    await expect(menu.getByRole("link", { name: "Contact me" })).toBeVisible();
    // About is hidden below 1024px with CSS alone, so also without JavaScript.
    await expect(page.getByRole("heading", { level: 2, name: "About" })).toBeHidden();
  });
});

test.describe("nav bar", () => {
  test("at 1280px: sticky, with section links, List view and Contact me", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(LIST);

    const banner = page.getByRole("banner");
    const primary = page.getByRole("navigation", { name: "Primary" });
    for (const name of ["Projects", "About", "Resume", "Contact"]) {
      await expect(primary.getByRole("link", { name, exact: true })).toBeVisible();
    }
    await expect(banner.getByRole("link", { name: "List view" })).toBeVisible();
    await expect(banner.getByRole("link", { name: "Contact me" })).toBeVisible();
    await expect(banner.getByRole("button", { name: "Menu" })).toBeHidden();

    await primary.getByRole("link", { name: "About" }).click();
    await expect(page.getByRole("heading", { level: 2, name: "About" })).toBeInViewport();
    // Still on screen after scrolling: the bar is sticky.
    await expect(banner.getByRole("link", { name: "Samuel Orth" })).toBeInViewport();
    // And the heading it jumped to is not hidden underneath it.
    const bar = await banner.boundingBox();
    const heading = await page.getByRole("heading", { level: 2, name: "About" }).boundingBox();
    expect(heading!.y).toBeGreaterThanOrEqual(bar!.y + bar!.height);
  });

  test("the resume link serves a PDF", async ({ request }) => {
    const response = await request.get("/resume.pdf");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/pdf");
  });

  test("at 375px: name, List view and a menu that holds the links and Contact me", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(LIST);

    const banner = page.getByRole("banner");
    await expect(banner.getByRole("link", { name: "Samuel Orth" })).toBeVisible();
    await expect(banner.getByRole("link", { name: "List view" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeHidden();
    await expect(banner.getByRole("link", { name: "Contact me" })).toBeHidden();

    const menuButton = banner.getByRole("button", { name: "Menu" });
    const box = await menuButton.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);

    await menuButton.click();
    const menu = page.getByRole("navigation", { name: "Menu" });
    for (const name of ["Projects", "Resume", "Contact"]) {
      await expect(menu.getByRole("link", { name, exact: true })).toBeVisible();
    }
    await expect(menu.getByRole("link", { name: "Contact me" })).toBeVisible();
    // About is a desktop section: no link to it, and it is not on the page here.
    await expect(menu.getByRole("link", { name: "About" })).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 2, name: "About" })).toBeHidden();

    // Following a link closes the menu and lands on the section.
    await menu.getByRole("link", { name: "Contact", exact: true }).click();
    await expect(menu).toBeHidden();
    await expect(page.getByRole("heading", { level: 2, name: "Contact" })).toBeInViewport();
  });
});

for (const viewport of [
  { width: 375, height: 812, sheet: true },
  { width: 1280, height: 720, sheet: false },
]) {
  test.describe(`detail panel at ${viewport.width}px`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("a card click opens it; close button, Esc and focus return all work", async ({ page }) => {
      await page.goto(LIST);
      const dialog = page.getByRole("dialog");
      const trigger = page.getByRole("button", { name: "Details: Math Tiles" });
      await expect(dialog).toBeHidden();

      // Click the card's poster, not the button: the whole card is the target.
      await page.getByRole("article", { name: "Math Tiles" }).click({ position: { x: 40, y: 40 } });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole("heading", { level: 2, name: "Math Tiles" })).toBeVisible();
      await expect(dialog.getByText("Project 02 / 08")).toBeVisible();
      await expect(dialog.getByRole("link", { name: /^Code/ })).toBeVisible();

      // Modal in the list view at every width: nothing behind it can take focus.
      expect(await dialog.evaluate((element) => element.matches(":modal"))).toBe(true);
      // A bottom sheet under 1024px, a panel on the right from there up.
      const bottom = async () => {
        const rect = (await dialog.boundingBox())!;
        return Math.round(rect.y + rect.height);
      };
      if (viewport.sheet) {
        // Polled: the sheet slides up 16px over 240ms.
        await expect.poll(bottom).toBe(viewport.height);
      }
      const box = (await dialog.boundingBox())!;
      if (viewport.sheet) {
        // Full width of the layout viewport (which excludes a classic scrollbar's gutter).
        expect(box.x).toBe(0);
        expect(box.width).toBe(await page.evaluate(() => document.documentElement.clientWidth));
      } else {
        expect(box.x).toBeGreaterThan(viewport.width / 2);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      }

      await dialog.getByRole("button", { name: "Close project details" }).click();
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();

      // Keyboard path: Enter on the trigger opens, Esc closes, focus comes back.
      await page.keyboard.press("Enter");
      await expect(dialog).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
    });

    test("Next and Previous move between projects; links in a card still work", async ({
      page,
    }) => {
      await page.goto(LIST);
      const dialog = page.getByRole("dialog");

      await page.getByRole("button", { name: "Details: Software Factory" }).click();
      await expect(dialog.getByRole("heading", { level: 2 })).toHaveText("Software Factory");
      await dialog.getByRole("button", { name: "Next" }).click();
      await expect(dialog.getByRole("heading", { level: 2 })).toHaveText("Math Tiles");
      await dialog.getByRole("button", { name: "Previous" }).click();
      await dialog.getByRole("button", { name: "Previous" }).click();
      await expect(dialog.getByText("Project 08 / 08")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();

      // A card's Code link sits above the card-wide click layer: clicking it must
      // follow the link, not open the panel.
      const code = page
        .getByRole("article", { name: "Math Tiles" })
        .getByRole("link", { name: /^Code/ });
      await page.route("https://github.com/**", (route) => route.abort());
      await code.click({ noWaitAfter: true });
      await expect(dialog).toBeHidden();
    });

    test("the page behind a sheet does not scroll, and a click outside closes it", async ({
      page,
    }) => {
      await page.goto(LIST);
      const dialog = page.getByRole("dialog");
      await page.getByRole("button", { name: "Details: ChatBridge" }).click();
      await expect(dialog).toBeVisible();

      if (viewport.sheet) {
        const before = await page.evaluate(() => window.scrollY);
        await page.mouse.move(20, 60);
        await page.mouse.wheel(0, 600);
        await page.waitForTimeout(200);
        expect(await page.evaluate(() => window.scrollY)).toBe(before);
      }

      await page.mouse.click(20, 60);
      await expect(dialog).toBeHidden();
      await expect(page.getByRole("button", { name: "Details: ChatBridge" })).toBeFocused();
    });

    if (viewport.sheet) {
      test("the sheet opens at the top, at half height, and its handle expands it", async ({
        page,
      }) => {
        await page.goto(LIST);
        await page.getByRole("button", { name: "Details: Software Factory" }).click();
        const dialog = page.getByRole("dialog");
        const height = async () => (await dialog.boundingBox())!.height / viewport.height;

        // Title and pitch are in view and the content has not been scrolled.
        await expect(dialog.getByRole("heading", { level: 2 })).toBeInViewport();
        await expect(dialog.getByText("A pipeline that turns a written spec")).toBeInViewport();
        expect(
          await dialog
            .locator("> div")
            .first()
            .evaluate((node) => node.scrollTop),
        ).toBe(0);
        await expect.poll(height).toBeCloseTo(0.55, 1);

        // The handle is a button: pressing it switches between half and full.
        const handle = dialog.getByRole("button", { name: "Expand project details" });
        await expect(handle).toHaveAttribute("aria-expanded", "false");
        await handle.press("Enter");
        await expect.poll(height).toBeCloseTo(0.92, 1);
        await expect(
          dialog.getByRole("button", { name: "Collapse project details" }),
        ).toHaveAttribute("aria-expanded", "true");

        // Scrolled down, closed and opened again: back at the top and at half height.
        await dialog
          .locator("> div")
          .first()
          .evaluate((node) => (node.scrollTop = 9999));
        await page.keyboard.press("Escape");
        await page.getByRole("button", { name: "Details: Software Factory" }).click();
        await expect.poll(height).toBeCloseTo(0.55, 1);
        expect(
          await dialog
            .locator("> div")
            .first()
            .evaluate((node) => node.scrollTop),
        ).toBe(0);
      });

      test("dragging the handle up expands the sheet; dragging it down closes it", async ({
        page,
      }) => {
        await page.goto(LIST);
        await page.getByRole("button", { name: "Details: Software Factory" }).click();
        const dialog = page.getByRole("dialog");
        const height = async () => (await dialog.boundingBox())!.height / viewport.height;
        await expect.poll(height).toBeCloseTo(0.55, 1);

        const dragHandle = async (name: string, distance: number) => {
          const box = (await dialog.getByRole("button", { name }).boundingBox())!;
          const x = box.x + box.width / 2;
          const y = box.y + box.height / 2;
          await page.mouse.move(x, y);
          await page.mouse.down();
          await page.mouse.move(x, y + distance / 2, { steps: 4 });
          await page.mouse.move(x, y + distance, { steps: 4 });
          await page.mouse.up();
        };

        await dragHandle("Expand project details", -260);
        await expect.poll(height).toBeCloseTo(0.92, 1);
        await dragHandle("Collapse project details", 620);
        await expect(dialog).toBeHidden();
      });
    }

    test("Previous and Next stay put from project to project", async ({ page }) => {
      await page.goto(LIST);
      const dialog = page.getByRole("dialog");
      await page.getByRole("button", { name: "Details: Software Factory" }).click();
      const next = dialog.getByRole("button", { name: "Next" });
      await expect(next).toBeInViewport({ ratio: 1 });
      await page.waitForTimeout(300);
      const first = (await next.boundingBox())!;

      for (let step = 0; step < 7; step++) {
        await next.click();
        const box = (await next.boundingBox())!;
        expect(Math.round(box.y)).toBe(Math.round(first.y));
        // The new project starts at its title, not wherever the last one was scrolled to.
        await expect(dialog.getByRole("heading", { level: 2 })).toBeInViewport();
      }
      await expect(dialog.getByText("Project 08 / 08")).toBeVisible();
    });

    test("no horizontal scroll while the panel is open", async ({ page }) => {
      await page.goto(LIST);
      await page.getByRole("button", { name: "Details: Autonomous Ad Engine" }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });
  });
}

// Widths between the designed ones: the smallest phones and a portrait tablet.
for (const width of [320, 768, 1024]) {
  test(`layout holds at ${width}px: no horizontal scroll, nav on one line`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

    const bar = (await page.getByRole("banner").boundingBox())!;
    expect(bar.height).toBeLessThanOrEqual(60);
    for (const control of await page
      .getByRole("banner")
      .locator("a:visible, button:visible")
      .all()) {
      const box = (await control.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(bar.x);
      expect(box.x + box.width).toBeLessThanOrEqual(bar.x + bar.width);
    }
  });
}
