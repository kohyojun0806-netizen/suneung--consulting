import { expect, test } from "@playwright/test";

async function completeSetup(page) {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "학생 맞춤 수학 코칭 시작" })
  ).toBeVisible();

  await page.getByLabel("이름(선택)").fill("테스트학생");
  await page.locator(".grade-grid").nth(0).locator(".grade-chip").nth(5).click();
  await page.locator(".grade-grid").nth(1).locator(".grade-chip").nth(2).click();
  await page.getByRole("button", { name: "미적분" }).click();
  await page.getByRole("button", { name: "저장하고 코칭 시작" }).click();
}

test("onboarding to dashboard and core tab navigation", async ({ page }) => {
  await completeSetup(page);

  await expect(
    page.getByRole("heading", { name: /6등급에서 3등급까지/ })
  ).toBeVisible();

  await page.getByRole("button", { name: "학습 설계" }).click();
  await expect(page.getByRole("heading", { name: "근본 학습법" })).toBeVisible();

  await page.getByRole("button", { name: "누적 기록" }).click();
  await expect(page.getByRole("heading", { name: "학습 기록 입력" })).toBeVisible();

  await page.getByRole("button", { name: "주간 리포트" }).click();
  await expect(page.getByRole("heading", { name: "주간 리포트 생성" })).toBeVisible();

  await page.getByRole("button", { name: "AI 코치" }).click();
  await expect(page.getByRole("heading", { name: "AI 코치 상담" })).toBeVisible();
});
