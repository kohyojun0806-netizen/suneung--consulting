import { expect, test } from "@playwright/test";

async function completeSetup(page) {
  await page.goto("/");
  await page.getByLabel("이름(선택)").fill("누적테스트");
  await page.locator(".grade-grid").nth(0).locator(".grade-chip").nth(4).click();
  await page.locator(".grade-grid").nth(1).locator(".grade-chip").nth(1).click();
  await page.getByRole("button", { name: "미적분" }).click();
  await page.getByRole("button", { name: "저장하고 코칭 시작" }).click();
}

test("weekly checklist persistence and coach memory reflection", async ({
  page,
}) => {
  await completeSetup(page);
  await expect(page.getByRole("heading", { name: "주간 미션 계약" })).toBeVisible();

  const firstMission = page.locator(".mission-item").first();
  await firstMission.click();
  await expect(firstMission.getByText("완료")).toBeVisible();

  await page.reload();
  await expect(page.locator(".mission-item").first().getByText("완료")).toBeVisible();

  await page.getByRole("button", { name: "설정" }).click();
  await page
    .getByLabel("코치 메모(지속 지시사항)")
    .fill("오답복기 우선, 설명은 짧고 강하게");
  await page.getByRole("button", { name: "코치 메모 저장" }).click();

  await page.getByRole("button", { name: "AI 코치" }).click();
  await expect(
    page.getByText("코치 메모 반영 중: 오답복기 우선, 설명은 짧고 강하게")
  ).toBeVisible();
});
