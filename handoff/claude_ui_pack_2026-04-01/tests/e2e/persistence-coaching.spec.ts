import { expect, test } from "@playwright/test";

async function enterApp(page) {
  const startButton = page.getByRole("button", { name: /시작하기/ });
  if (await startButton.isVisible()) {
    await startButton.click();
  }
  await expect(page.locator(".onboarding-tab")).toBeVisible();
}

async function bootstrapPlan(page) {
  await page.goto("/");
  await enterApp(page);
  await page.selectOption("#currentGrade", "4+");
  await page.selectOption("#targetGrade", "2-3");
  await page.locator('input[name="electiveVisible"][value="calculus"]').check({ force: true });
  await page.fill("#weeklyHours", "11");
  await page.getByRole("button", { name: /로드맵 생성/ }).click();
  await expect(page.locator(".plan-tab")).toBeVisible();
}

test("report and consult results persist across tab switches", async ({ page }) => {
  await bootstrapPlan(page);

  await page.locator('.tab-nav__btn:has-text("주간보고")').click();
  await expect(page.locator(".report-tab")).toBeVisible();

  await page.fill("#completedTopics", "미적분 킬러 유형 A 8문항 복습");
  await page.fill("#difficulties", "조건 해석에서 시간을 많이 씀");
  await page.getByRole("button", { name: /주간 리포트 생성/ }).click();
  await expect(page.locator(".report-result")).toBeVisible();

  await page.locator('.tab-nav__btn:has-text("컨설팅")').click();
  await expect(page.locator(".consult-tab")).toBeVisible();
  await page.fill("#consultQuestion", "실전에서 시간 배분을 어떻게 고정하면 좋을까요?");
  await page.getByRole("button", { name: /컨설팅 받기/ }).click();
  await expect(page.locator(".consult-result")).toBeVisible();

  await page.locator('.tab-nav__btn:has-text("주간보고")').click();
  await expect(page.locator(".report-result")).toBeVisible();
});
