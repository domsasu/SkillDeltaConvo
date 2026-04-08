import { test } from "@playwright/test";

test("Screenshot LIHP chat panel", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://localhost:3000");
  await page.waitForTimeout(2000);
  const pill = page.locator("div.overflow-hidden button").first();
  await pill.click({ force: true });
  await page.waitForTimeout(3000);
  // Screenshot just the chat side panel
  const aside = page.locator("aside");
  await aside.screenshot({ path: "/tmp/chat-panel.png" });
  // Also full page
  await page.screenshot({ path: "/tmp/lihp-full.png", fullPage: false });
});
