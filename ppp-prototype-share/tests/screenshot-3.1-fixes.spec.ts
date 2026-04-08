import { test, expect } from "@playwright/test";

test("Verify Phase 3.1 fixes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://localhost:3000");
  await page.waitForTimeout(2000);

  // Click a pill to transition to LIHP
  const pill = page.locator("div.overflow-hidden button").first();
  await pill.click({ force: true });
  await page.waitForTimeout(3000);

  // Screenshot LIHP with chat panel
  await page.screenshot({ path: "/tmp/fix-lihp-full.png", fullPage: false });

  // Verify chat panel header uses brand_default sparkle (not brand_open)
  // brand_default has TWO path elements, brand_open has TWO path elements but different viewBox
  const chatPanelHeader = page.locator("aside .border-b");
  const sparkleSvg = chatPanelHeader.locator("svg").first();
  const viewBox = await sparkleSvg.getAttribute("viewBox");
  console.log("Chat panel sparkle viewBox:", viewBox);
  // brand_default is 0 0 22 22, brand_open is 0 0 21 22
  expect(viewBox).toBe("0 0 22 22");

  // Screenshot chat panel header close-up
  await chatPanelHeader.screenshot({ path: "/tmp/fix-chat-header.png" });

  // Screenshot the progressive plan module area
  const mainContent = page.locator("main .mx-auto");
  await mainContent.screenshot({ path: "/tmp/fix-progressive-module.png" });
});
