import { test } from "@playwright/test";

test("Screenshot LIHP with plan loading state", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://localhost:3000");
  await page.waitForTimeout(2000);

  // Click a pill to trigger transition to LIHP
  const pill = page.locator("div.overflow-hidden button").first();
  await pill.click({ force: true });
  await page.waitForTimeout(3000);

  // Screenshot the LIHP with chat (before plan generation)
  await page.screenshot({ path: "/tmp/lihp-before-plan.png", fullPage: false });

  // Inject plan_generating state by adding the skeleton component
  // This simulates what the user sees during plan generation
  await page.evaluate(() => {
    // Find the main content area and prepend a loading skeleton
    const main = document.querySelector("main .mx-auto");
    if (main) {
      const skeleton = document.createElement("div");
      skeleton.className = "rounded-xl border border-gray-200 bg-white p-6 animate-pulse space-y-4";
      skeleton.innerHTML = `
        <div class="flex justify-between items-start">
          <div class="space-y-2">
            <div class="h-4 w-32 bg-gray-200 rounded"></div>
            <div class="h-3 w-64 bg-gray-200 rounded"></div>
          </div>
          <div class="h-8 w-24 bg-gray-200 rounded-full"></div>
        </div>
        <div class="space-y-3">
          <div class="h-12 bg-gray-100 rounded-lg"></div>
          <div class="h-12 bg-gray-100 rounded-lg"></div>
          <div class="h-12 bg-gray-100 rounded-lg"></div>
        </div>
      `;
      main.insertBefore(skeleton, main.firstChild);
    }
  });
  await page.waitForTimeout(500);

  // Screenshot with simulated loading state
  await page.screenshot({ path: "/tmp/lihp-plan-loading.png", fullPage: false });
});
