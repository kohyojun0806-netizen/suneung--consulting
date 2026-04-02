import { test, expect } from "@playwright/test";

function expectNoBrokenText(text: string) {
  expect(text).not.toContain("??");
  expect(text).not.toContain("\uFFFD");
}

test("ui text should not include broken characters on landing/onboarding/plan", async ({ page }) => {
  await page.goto("/");

  const startButton = page.getByRole("button", { name: /시작하기/ }).first();
  await expect(startButton).toBeVisible();

  const landingText = await page.locator("body").innerText();
  expectNoBrokenText(landingText);

  await startButton.click();
  await expect(page.locator(".onboarding-tab")).toBeVisible();

  const onboardingText = await page.locator("body").innerText();
  expectNoBrokenText(onboardingText);

  await page.selectOption("#currentGrade", "4+");
  await page.selectOption("#targetGrade", "2-3");
  await page.locator('input[name="electiveVisible"][value="calculus"]').check({ force: true });
  await page.fill("#weeklyHours", "18");
  await page.getByRole("button", { name: /로드맵 생성/ }).click();

  await expect(page.locator(".plan-tab")).toBeVisible();
  const planText = await page.locator("body").innerText();
  expectNoBrokenText(planText);
});
