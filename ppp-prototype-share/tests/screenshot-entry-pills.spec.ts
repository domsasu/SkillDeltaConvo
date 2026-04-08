import { test, expect } from "@playwright/test";

test("All pill rows pause when hovering any row", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://localhost:3000");
  await page.waitForTimeout(2000);

  // Screenshot before hover
  await page.screenshot({ path: "/tmp/entry-pills-running.png", fullPage: false });

  // Hover over the first pill row
  const firstRow = page.locator("div.overflow-hidden").first();
  await firstRow.hover();
  await page.waitForTimeout(500);

  // Check ALL three rows are paused
  const strips = page.locator("div.flex.w-max");
  const count = await strips.count();
  console.log(`Found ${count} animation strips`);

  for (let i = 0; i < count; i++) {
    const playState = await strips.nth(i).evaluate((el) => {
      return window.getComputedStyle(el).animationPlayState;
    });
    console.log(`Row ${i + 1} animation-play-state: ${playState}`);
    expect(playState).toBe("paused");
  }

  // Screenshot while hovered (all paused)
  await page.screenshot({ path: "/tmp/entry-pills-hovered.png", fullPage: false });
});
