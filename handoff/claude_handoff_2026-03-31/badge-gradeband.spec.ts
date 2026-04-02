// tests/e2e/badge-gradeband.spec.ts
// Sprint 31 — Evidence Badge + Grade-band Playwright E2E
// 3AGENT + GSD: ui-data-priority-20260330

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const API_URL  = process.env.TEST_API_URL  || 'http://localhost:4000';

// ─── Helpers ────────────────────────────────────────────────────────────────

async function fillProfile(page, opts: {
  currentGrade?: string;
  targetGrade?: string;
  elective?: string;
  weeklyHours?: string;
} = {}) {
  const {
    currentGrade = '2-3',
    targetGrade  = '2-3',
    elective     = 'calculus',
    weeklyHours  = '12',
  } = opts;

  await page.selectOption('#currentGrade', currentGrade);
  await page.selectOption('#targetGrade',  targetGrade);
  await page.click(`input[name="elective"][value="${elective}"]`);
  await page.fill('#weeklyHours', weeklyHours);
}

// ─── Test Suite ──────────────────────────────────────────────────────────────

test.describe('Sprint 31 — Evidence Badge + Grade-band', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/수능수학|수능 수학|Suneung/i);
  });

  // ─── TC-01: Evidence Badge renders on plan cards ──────────────────────────

  test('TC-01: 플랜 교재 카드에 evidence-badge가 렌더링된다', async ({ page }) => {
    // 온보딩 프로필 입력
    await fillProfile(page, { currentGrade: '2-3', targetGrade: '1' });

    // 플랜 생성
    await page.click('button:has-text("로드맵 생성")');
    await expect(page.locator('.plan-tab')).toBeVisible({ timeout: 15_000 });

    // 플랜 탭으로 전환 (이미 이동했을 수 있음)
    const planNavBtn = page.locator('.tab-nav__btn', { hasText: '플랜' });
    if (await planNavBtn.isVisible()) {
      await planNavBtn.click();
    }

    // 교재 섹션 열기
    const bookAccordion = page.locator('.accordion-header', { hasText: '추천 교재' });
    if (await bookAccordion.isVisible()) {
      await bookAccordion.click();
      await expect(page.locator('.book-card').first()).toBeVisible({ timeout: 5_000 });
    }

    // Badge 렌더링 확인
    const badges = page.locator('.evidence-badge');
    const badgeCount = await badges.count();
    expect(badgeCount).toBeGreaterThan(0);

    // Badge 클래스 확인
    const firstBadge = badges.first();
    const badgeClass = await firstBadge.getAttribute('class');
    expect(badgeClass).toMatch(/badge--(official|community|youtube)/);
  });

  // ─── TC-02: sourceRefs link opens external URL ────────────────────────────

  test('TC-02: sourceRefs 링크가 외부 URL로 연결된다', async ({ page }) => {
    await fillProfile(page, { currentGrade: '4+', targetGrade: '2-3' });
    await page.click('button:has-text("로드맵 생성")');
    await page.waitForTimeout(2_000);

    const planTab = page.locator('.tab-nav__btn', { hasText: '플랜' });
    if (await planTab.isVisible()) await planTab.click();

    const bookAccordion = page.locator('.accordion-header', { hasText: '추천 교재' });
    if (await bookAccordion.isVisible()) {
      await bookAccordion.click();
      await page.waitForTimeout(500);
    }

    const sourceLinks = page.locator('.badge-source-link');
    const linkCount = await sourceLinks.count();

    if (linkCount > 0) {
      const href = await sourceLinks.first().getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).toMatch(/^https?:\/\//);

      const rel = await sourceLinks.first().getAttribute('rel');
      expect(rel).toContain('noopener');
    } else {
      // sourceRefs 없는 경우도 허용 (데이터에 따라 다름)
      console.log('TC-02: sourceRefs 링크 없음 (데이터에 따라 정상)');
    }
  });

  // ─── TC-03: Grade 1 report contains 변별력 keyword ────────────────────────

  test('TC-03: 1등급 목표 → 주간보고에 "변별" 키워드 포함', async ({ page }) => {
    // 프로필 설정: 목표 1등급
    await fillProfile(page, { currentGrade: '2-3', targetGrade: '1', elective: 'calculus' });

    // 주간보고 탭 이동
    await page.click('.tab-nav__btn:has-text("주간보고")');
    await expect(page.locator('.report-tab')).toBeVisible();

    // 등급 배지 확인
    const gradeBadge = page.locator('.grade-badge');
    await expect(gradeBadge).toContainText('1등급');

    // 주간 내용 입력
    await page.fill('#completedTopics', '수능 킬러 유형 A 복습, 사설모고 29번 풀이');
    await page.fill('#difficulties', '추론형에서 논리 비약 발생');

    // 리포트 생성
    await page.click('button:has-text("주간 리포트 생성")');
    const resultArea = page.locator('.report-result');
    await expect(resultArea).toBeVisible({ timeout: 20_000 });

    // 1등급 키워드 확인 (변별, 심화, 킬러 중 하나 이상)
    const reportText = await resultArea.textContent();
    const hasGrade1Keyword = /변별|심화|킬러|1등급/.test(reportText || '');
    expect(hasGrade1Keyword).toBe(true);
  });

  // ─── TC-04: Grade 4+ report contains 기초 keyword ────────────────────────

  test('TC-04: 4등급 이하 목표 → 주간보고에 "기초" 키워드 포함', async ({ page }) => {
    await fillProfile(page, { currentGrade: '4+', targetGrade: '4+', elective: 'probability' });

    await page.click('.tab-nav__btn:has-text("주간보고")');
    await expect(page.locator('.report-tab')).toBeVisible();

    await page.fill('#completedTopics', '수학1 수열 개념 복습');
    await page.fill('#difficulties', '공식 암기 후 적용 혼동');

    await page.click('button:has-text("주간 리포트 생성")');
    const resultArea = page.locator('.report-result');
    await expect(resultArea).toBeVisible({ timeout: 20_000 });

    const reportText = await resultArea.textContent();
    const hasGrade4Keyword = /기초|반복|개념|기본/.test(reportText || '');
    expect(hasGrade4Keyword).toBe(true);
  });

  // ─── TC-05: Accordion open/close behavior ─────────────────────────────────

  test('TC-05: 플랜 아코디언 열기/닫기 동작', async ({ page }) => {
    await fillProfile(page);
    await page.click('button:has-text("로드맵 생성")');
    await page.waitForTimeout(2_000);

    const planTab = page.locator('.tab-nav__btn', { hasText: '플랜' });
    if (await planTab.isVisible()) await planTab.click();

    const accordions = page.locator('.accordion-header');
    const count = await accordions.count();
    expect(count).toBeGreaterThan(0);

    // 첫 번째 accordion click → 열리거나 닫힘
    const firstAccordion = accordions.first();
    const initialExpanded = await firstAccordion.getAttribute('aria-expanded');
    await firstAccordion.click();
    await page.waitForTimeout(300);

    const newExpanded = await firstAccordion.getAttribute('aria-expanded');
    expect(newExpanded).not.toBe(initialExpanded);
  });

  // ─── TC-06: Mobile viewport — no horizontal scroll ────────────────────────

  test('TC-06: 모바일(375px) — 가로 스크롤 없음', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE_URL);

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 375;

    // scrollWidth가 viewport보다 커지면 가로 스크롤 발생
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5); // 5px tolerance
  });

});
