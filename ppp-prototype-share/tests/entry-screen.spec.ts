import { test, expect } from "@playwright/test";

test.describe("Entry Screen UX Fixes", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000");
    await page.waitForLoadState("networkidle");
  });

  test("Header with Coursera image logo is visible", async ({ page }) => {
    const header = page.locator("header");
    await expect(header).toBeVisible();

    const logo = header.locator('img[alt="Coursera"]');
    await expect(logo).toBeVisible();

    const exitText = header.locator("text=Exit");
    await expect(exitText).toBeVisible();
  });

  test("No squared suggestion buttons on entry screen", async ({ page }) => {
    const suggestionButtons = page.locator("button.rounded-lg");
    await expect(suggestionButtons).toHaveCount(0);
  });

  test("Prompt pills container is wider than the chat input", async ({
    page,
  }) => {
    const chatInput = page.locator('[class*="max-w-[746px]"]').first();
    const pillsContainer = page.locator('[class*="max-w-[1030px]"]').first();

    await expect(chatInput).toBeVisible();
    await expect(pillsContainer).toBeVisible();

    const inputBox = await chatInput.boundingBox();
    const pillsBox = await pillsContainer.boundingBox();

    expect(pillsBox!.width).toBeGreaterThan(inputBox!.width);
  });

  test("Prompt pills have dynamic scroll animation with GPU acceleration", async ({
    page,
  }) => {
    const pillRow = page.locator('[style*="scroll-"]').first();
    await expect(pillRow).toBeVisible();

    const style = await pillRow.getAttribute("style");
    expect(style).toContain("scroll-");
    expect(style).toContain("linear");
    expect(style).toContain("infinite");
    expect(style).toContain("will-change: transform");
  });

  test("Hovering pauses scroll animation, leaving resumes", async ({
    page,
  }) => {
    const container = page.locator("div.overflow-hidden").first();
    await expect(container).toBeVisible();

    const row = container.locator(".w-max");

    // Verify animation is running before hover
    const styleBefore = await row.getAttribute("style");
    expect(styleBefore).toContain("running");

    // Hover pauses
    await container.hover();
    await page.waitForTimeout(200);
    const styleHovered = await row.getAttribute("style");
    expect(styleHovered).toContain("paused");

    // Move mouse away — animation resumes
    await page.mouse.move(0, 0);
    await page.waitForTimeout(200);
    const styleAfter = await row.getAttribute("style");
    expect(styleAfter).toContain("running");
  });

  test("All prompt pills have consistent 20px border radius", async ({ page }) => {
    // Prompt pills inside the carousel rows
    const pills = page.locator("div.overflow-hidden button");
    const count = await pills.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(count, 10); i++) {
      const radius = await pills.nth(i).evaluate((el) => {
        return getComputedStyle(el).borderRadius;
      });
      expect(radius).toBe("20px");
    }
  });
});
