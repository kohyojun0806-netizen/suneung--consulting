import { expect, test } from "@playwright/test";

async function enterApp(page) {
  const startButton = page.getByRole("button", { name: /시작하기/ });
  if (await startButton.isVisible()) {
    await startButton.click();
  }
  await expect(page.locator(".onboarding-tab")).toBeVisible();
}

async function completeSetup(page) {
  await page.goto("/");
  await enterApp(page);

  await page.selectOption("#currentGrade", "4+");
  await page.selectOption("#targetGrade", "2-3");
  await page.locator('input[name="electiveVisible"][value="calculus"]').check({ force: true });
  await page.fill("#weeklyHours", "12");

  await page.getByRole("button", { name: /로드맵 생성/ }).click();
  await expect(page.locator(".plan-tab")).toBeVisible();
}

test("onboarding to plan and core tab navigation", async ({ page }) => {
  await completeSetup(page);

  const bookCards = page.locator(".book-card");
  if (await bookCards.count()) {
    await expect(bookCards.first()).toBeVisible();
  } else {
    await expect(page.locator(".empty-state__title", { hasText: "추천 교재 없음" })).toBeVisible();
  }

  await page.locator('.tab-nav__btn:has-text("주간보고")').click();
  await expect(page.locator(".report-tab")).toBeVisible();

  await page.locator('.tab-nav__btn:has-text("컨설팅")').click();
  await expect(page.locator(".consult-tab")).toBeVisible();

  await page.locator('.tab-nav__btn:has-text("플랜")').click();
  await expect(page.locator(".plan-tab")).toBeVisible();
});
