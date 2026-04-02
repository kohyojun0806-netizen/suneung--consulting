import { test, expect } from "@playwright/test";

async function enterApp(page) {
  const startButton = page.getByRole("button", { name: /시작하기/ });
  if (await startButton.isVisible()) {
    await startButton.click();
  }
  await expect(page.locator(".onboarding-tab")).toBeVisible();
}

async function fillProfile(
  page,
  opts: { currentGrade?: string; targetGrade?: string; elective?: string; weeklyHours?: string } = {}
) {
  const {
    currentGrade = "2-3",
    targetGrade = "1",
    elective = "calculus",
    weeklyHours = "12",
  } = opts;

  await page.selectOption("#currentGrade", currentGrade);
  await page.selectOption("#targetGrade", targetGrade);
  await page.locator(`input[name="electiveVisible"][value="${elective}"]`).check({ force: true });
  await page.fill("#weeklyHours", weeklyHours);
}

async function createPlan(page, opts = {}) {
  await fillProfile(page, opts);
  await page.getByRole("button", { name: /로드맵 생성/ }).click();
  await expect(page.locator(".plan-tab")).toBeVisible();
}

test.describe("Sprint 31 - Evidence Badge + Grade-band", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await enterApp(page);
  });

  test("TC-01: plan cards render evidence badge", async ({ page }) => {
    await createPlan(page, { currentGrade: "2-3", targetGrade: "1" });

    const bookCards = page.locator(".book-card");
    const cardCount = await bookCards.count();
    if (cardCount === 0) {
      await expect(page.locator(".empty-state__title", { hasText: "추천 교재 없음" })).toBeVisible();
      return;
    }

    await expect(bookCards.first()).toBeVisible();
    const badges = page.locator(".evidence-badge");
    expect(await badges.count()).toBeGreaterThan(0);

    const badgeClass = await badges.first().getAttribute("class");
    expect(badgeClass || "").toMatch(/badge--(official|community|youtube)/);
  });

  test("TC-02: sourceRefs link points to external URL", async ({ page }) => {
    await createPlan(page, { currentGrade: "4+", targetGrade: "2-3" });

    const sourceLinks = page.locator(".badge-source-link");
    const count = await sourceLinks.count();
    if (count === 0) {
      await expect(page.locator(".empty-state__title", { hasText: "추천 교재 없음" })).toBeVisible();
      return;
    }

    const href = await sourceLinks.first().getAttribute("href");
    expect(href).toMatch(/^https?:\/\//);
    await expect(sourceLinks.first()).toHaveAttribute("rel", /noopener/);
  });

  test("TC-03: grade 1 weekly report includes high-tier keyword", async ({ page }) => {
    await createPlan(page, { currentGrade: "2-3", targetGrade: "1", elective: "calculus" });

    await page.locator('.tab-nav__btn:has-text("주간보고")').click();
    await expect(page.locator(".report-tab")).toBeVisible();
    await expect(page.locator(".grade-badge")).toContainText("1등급");

    await page.fill("#completedTopics", "킬러 유형 A 복습");
    await page.fill("#difficulties", "조건 해석 속도 저하");
    await page.getByRole("button", { name: /주간 리포트 생성/ }).click();

    const text = (await page.locator(".report-result").textContent()) || "";
    expect(/변별|킬러|1등급/.test(text)).toBeTruthy();
  });

  test("TC-04: grade 4+ weekly report includes foundation keyword", async ({ page }) => {
    await createPlan(page, { currentGrade: "4+", targetGrade: "4+", elective: "probability" });

    await page.locator('.tab-nav__btn:has-text("주간보고")').click();
    await expect(page.locator(".report-tab")).toBeVisible();

    await page.fill("#completedTopics", "수열 개념 복습");
    await page.fill("#difficulties", "공식 적용이 불안정함");
    await page.getByRole("button", { name: /주간 리포트 생성/ }).click();

    const text = (await page.locator(".report-result").textContent()) || "";
    expect(/기초|개념|기본|반복/.test(text)).toBeTruthy();
  });

  test("TC-05: plan accordion toggles open/close", async ({ page }) => {
    await createPlan(page);

    const firstAccordion = page.locator(".accordion-header").first();
    const initial = await firstAccordion.getAttribute("aria-expanded");
    await firstAccordion.click();
    const next = await firstAccordion.getAttribute("aria-expanded");
    expect(next).not.toEqual(initial);
  });

  test("TC-06: mobile viewport has no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(380);
  });
});
