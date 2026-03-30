import { expect, test } from "@playwright/test";

async function completeSetupBySelectors(page) {
  await page.goto("/");
  await expect(page.locator(".setup-card")).toBeVisible();

  await page.locator("#student-name").fill("playwright-user");
  await page.locator(".grade-grid").nth(0).locator(".grade-chip").nth(5).click();
  await page.locator(".grade-grid").nth(1).locator(".grade-chip").nth(2).click();
  await page.locator(".chip-row .chip").first().click();
  await page.locator(".setup-card .primary-btn").click();

  await expect(page.locator(".tracker-container")).toBeVisible();
  await page.locator(".tabs .tab-btn").first().click();
  await expect(page.locator(".metric-card").first()).toBeVisible();
}

test("strict dashboard evidence blocks and tab routing", async ({ page }) => {
  await completeSetupBySelectors(page);

  await expect(page.locator(".tabs .tab-btn")).toHaveCount(6);
  await expect(page.locator(".metric-card")).toHaveCount(3);
  await expect(page.locator(".mission-item")).toHaveCount(5);

  await page.locator(".tabs .tab-btn").nth(1).click();
  await expect(page.locator(".timeline-item").first()).toBeVisible();

  await page.locator(".tabs .tab-btn").nth(2).click();
  await expect(page.locator(".field-input").first()).toBeVisible();

  await page.locator(".tabs .tab-btn").nth(3).click();
  await expect(page.locator(".glass-card").first()).toBeVisible();

  await page.locator(".tabs .tab-btn").nth(4).click();
  await expect(page.locator("textarea.field-textarea").first()).toBeVisible();

  await page.locator(".tabs .tab-btn").nth(5).click();
  await expect(page.locator(".danger-btn, .ghost-btn").first()).toBeVisible();
});

test.describe("mobile coherence", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile tab switching remains usable", async ({ page }) => {
    await completeSetupBySelectors(page);

    const tabs = page.locator(".tabs .tab-btn");
    await tabs.nth(1).click();
    await expect(page.locator(".timeline-item").first()).toBeVisible();

    await tabs.nth(0).click();
    await expect(page.locator(".grid-3").first()).toBeVisible();

    await tabs.nth(4).click();
    await expect(page.locator("textarea.field-textarea").first()).toBeVisible();
  });
});
