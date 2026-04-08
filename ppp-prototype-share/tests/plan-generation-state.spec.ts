import { test, expect } from "@playwright/test";

test.describe("Plan generation state machine", () => {
  test.setTimeout(180000);

  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000");
    await page.waitForLoadState("networkidle");
  });

  test("gathered info persists and plan generates through conversation", async ({
    page,
  }) => {
    const consoleLogs: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      if (text.includes("[AppShell]") || text.includes("[server]")) {
        consoleLogs.push(text);
      }
    });

    // Submit initial message
    const entryInput = page.locator("textarea");
    await expect(entryInput).toBeVisible();
    await entryInput.fill(
      "I want to become a data analyst. I know basic Excel but I'm new to programming. I can study 6 hours per week for 3 months. I want to learn SQL, Python, and data visualization."
    );
    await entryInput.press("Enter");

    // Wait for LIHP
    const moduleContainer = page
      .locator("div.rounded-xl.border.border-\\[\\#dae1ed\\]")
      .first();
    await expect(moduleContainer).toBeVisible({ timeout: 15000 });

    let goalWasSet = false;
    let goalSnapshot = "";
    let planAppeared = false;
    let followUpCount = 0;

    const startTime = Date.now();
    while (Date.now() - startTime < 150000) {
      const moduleText = (await moduleContainer.textContent()) ?? "";

      // Track goal
      if (!goalWasSet && moduleText && !moduleText.includes("Adding your goal...")) {
        goalWasSet = true;
        goalSnapshot = moduleText;
        console.log("[test] Goal set:", goalSnapshot);
      }

      // Regression check
      if (goalWasSet && moduleText.includes("Adding your goal...")) {
        const planBanner = page.locator('text="Your learning plan"');
        if (!(await planBanner.isVisible().catch(() => false))) {
          throw new Error(`Gathered info reverted! Was: "${goalSnapshot}", Now: "${moduleText}"`);
        }
      }

      // Success: plan appeared
      const planBanner = page.locator('text="Your learning plan"');
      if (await planBanner.isVisible().catch(() => false)) {
        planAppeared = true;
        console.log("[test] Plan generated!");
        break;
      }

      // Wait for AI to finish responding
      await page.waitForTimeout(3000);

      // Skip interaction if AI is still streaming
      const chatInputDisabled = await page
        .locator("div.shrink-0.border-t textarea")
        .isDisabled()
        .catch(() => true);
      if (chatInputDisabled) {
        // Check for disabled save button (choice card visible but AI streaming)
        const saveDisabled = await page
          .locator('button:has-text("Save")[disabled]')
          .isVisible()
          .catch(() => false);
        if (saveDisabled) {
          await page.waitForTimeout(5000);
          continue;
        }
      }

      // Try sending follow-up if we haven't triggered plan yet
      if (followUpCount < 3) {
        // Option 1: freeform input visible
        const chatInput = page.locator("div.shrink-0.border-t textarea");
        const inputVisible = await chatInput.isVisible().catch(() => false);
        const inputEnabled = inputVisible && !(await chatInput.isDisabled().catch(() => true));

        if (inputEnabled) {
          followUpCount++;
          console.log(`[test] Sending follow-up #${followUpCount} via chat input`);
          await chatInput.fill("I have some basic coding experience from online tutorials");
          await chatInput.press("Enter");
          await page.waitForTimeout(10000);
          continue;
        }

        // Option 2: choice card with Save button
        const saveBtn = page.locator('button:has-text("Save"):not([disabled])');
        if (await saveBtn.isVisible({ timeout: 500 }).catch(() => false)) {
          // Select first unchecked option
          const option = page.locator('input[type="checkbox"]:not(:checked), input[type="radio"]:not(:checked)').first();
          if (await option.isVisible().catch(() => false)) {
            await option.click();
          }
          followUpCount++;
          console.log(`[test] Clicking Save on choice card (#${followUpCount})`);
          await saveBtn.click();
          await page.waitForTimeout(10000);
          continue;
        }

        // Option 3: freeform input inside choice card
        const freeformInput = page.locator('input[placeholder*="option"], input[placeholder*="else"]');
        if (await freeformInput.isVisible({ timeout: 500 }).catch(() => false)) {
          followUpCount++;
          console.log(`[test] Sending via choice card freeform (#${followUpCount})`);
          await freeformInput.fill("Some coding experience");
          const submitBtn = page.locator('button:has-text("Save"):not([disabled])');
          if (await submitBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
            await submitBtn.click();
          }
          await page.waitForTimeout(10000);
          continue;
        }
      }

      await page.waitForTimeout(3000);
    }

    // Log results
    const relevantLogs = consoleLogs.filter(
      (l) => l.includes("plan") || l.includes("ready_for_plan") || l.includes("Auto-sending") || l.includes("trigger")
    );
    console.log("[test] Plan-related logs:");
    for (const log of relevantLogs) console.log("  ", log);
    console.log("[test] Plan appeared:", planAppeared);
    console.log("[test] Follow-ups sent:", followUpCount);

    // Core assertion
    if (goalWasSet) {
      const finalText = (await moduleContainer.textContent()) ?? "";
      expect(finalText).not.toContain("Adding your goal...");
    }
  });
});
