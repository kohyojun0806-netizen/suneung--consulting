import { expect, test } from "@playwright/test";

async function completeSetup(page) {
  await page.goto("/");
  await expect(page.locator(".onboarding-tab")).toBeVisible();

  await page.selectOption("#currentGrade", "4+");
  await page.selectOption("#targetGrade", "2-3");
  await page.check('input[name="elective"][value="calculus"]');
  await page.fill("#weeklyHours", "12");

  await page.getByRole("button", { name: /로드맵 생성/ }).click();
  await expect(page.locator(".plan-tab")).toBeVisible();
}

test("onboarding to plan and core tab navigation", async ({ page }) => {
  await completeSetup(page);

  await expect(page.locator(".book-card").first()).toBeVisible();

  await page.locator('.tab-nav__btn:has-text("주간보고")').click();
  await expect(page.locator(".report-tab")).toBeVisible();

  await page.locator('.tab-nav__btn:has-text("컨설팅")').click();
  await expect(page.locator(".consult-tab")).toBeVisible();

  await page.locator('.tab-nav__btn:has-text("플랜")').click();
  await expect(page.locator(".plan-tab")).toBeVisible();
});
