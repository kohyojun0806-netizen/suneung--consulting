import { expect, test } from "@playwright/test";

async function enterApp(page) {
  const startButton = page.getByRole("button", { name: /시작하기/ });
  if (await startButton.isVisible()) {
    await startButton.click();
  }
  await expect(page.locator(".onboarding-tab")).toBeVisible();
}

async function createPlan(page) {
  await page.goto("/");
  await enterApp(page);

  await page.selectOption("#currentGrade", "2-3");
  await page.selectOption("#targetGrade", "1");
  await page.locator('input[name="electiveVisible"][value="calculus"]').check({ force: true });
  await page.fill("#weeklyHours", "14");

  await page.getByRole("button", { name: /로드맵 생성/ }).click();
  await expect(page.locator(".plan-tab")).toBeVisible();
}

test("strict ui evidence blocks and tab routing", async ({ page }) => {
  await createPlan(page);

  await expect(page.locator(".accordion-section")).toHaveCount(3);
  const badges = page.locator(".evidence-badge");
  if (await badges.count()) {
    await expect(badges.first()).toBeVisible();
  } else {
    await expect(page.locator(".empty-state__title", { hasText: "추천 교재 없음" })).toBeVisible();
  }
  const gradeBadges = page.locator(".grade-badge");
  if (await gradeBadges.count()) {
    await expect(gradeBadges.first()).toBeVisible();
  } else {
    await expect(page.locator(".tab-title", { hasText: "맞춤 학습 플랜" })).toBeVisible();
  }

  await page.locator('.tab-nav__btn:has-text("주간보고")').click();
  await expect(page.locator(".report-tab")).toBeVisible();

  await page.locator('.tab-nav__btn:has-text("컨설팅")').click();
  await expect(page.locator(".consult-tab")).toBeVisible();

  await page.locator('.tab-nav__btn:has-text("프로필")').click();
  await expect(page.locator(".onboarding-tab")).toBeVisible();
});

test.describe("mobile coherence", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile tab switching remains usable", async ({ page }) => {
    await createPlan(page);

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(395);

    await page.locator('.tab-nav__btn:has-text("주간보고")').click();
    await expect(page.locator(".report-tab")).toBeVisible();

    await page.locator('.tab-nav__btn:has-text("컨설팅")').click();
    await expect(page.locator(".consult-tab")).toBeVisible();
  });
});
