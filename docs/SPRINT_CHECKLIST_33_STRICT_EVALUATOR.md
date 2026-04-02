# Sprint 33 Strict Evaluator Checklist

Date: 2026-04-02
Sprint baseline: `docs/SPRINT_CONTRACT_33.md` (2026-04-01)
Focus: landing/app cohesion + success-case data visibility

## Pass/Fail Rule
- PASS only if every `Critical` item passes and all listed Playwright regression constraints pass.
- FAIL if any `Critical` item fails, any required test fails, or expected fallback behavior is missing.

## Execution Gates (Required)
1. `npm run build`
2. `npx playwright test tests/e2e/onboarding-and-navigation.spec.ts`
3. `npx playwright test tests/e2e/strict-evaluator-ui.spec.ts`
4. `npx playwright test tests/e2e/persistence-coaching.spec.ts`
5. `npx playwright test tests/e2e/badge-gradeband.spec.ts`

## A. Landing/App Cohesion Checklist

### Critical
- [ ] Landing screen is first paint on `/` and primary CTA is visible (`.landing`, `.landing__cta`).
- [ ] Landing to app transition is functional: user can reach onboarding and generate a plan (`.onboarding-tab` to `.plan-tab`).
- [ ] App tab routing remains coherent after plan generation: plan, report, consult, and profile tabs each route to the correct tab content.
- [ ] Mobile coherence: no horizontal overflow at 390x844 (`body.scrollWidth <= 395`) and tab switching remains usable.
- [ ] Mobile coherence: no horizontal overflow at 375x812 (`body.scrollWidth <= 380`).

### Non-Critical
- [ ] App-to-landing return path (logo click or equivalent) does not dead-end.
- [ ] Landing content and app-shell visual language are consistent (type scale, spacing, CTA semantics).

## B. Success-Case Data Visibility Checklist

### Critical
- [ ] Landing success snapshot section renders when `/api/knowledge/summary` contains `student_success_cases` (`.landing__success`).
- [ ] Landing success snapshot fails gracefully when data is absent (no crash, no broken card shell).
- [ ] Plan tab renders success-case panel when plan includes `successCaseBands` or `successCaseInsights` (`.success-cases-panel`).
- [ ] Success-case panel shows actionable content per visible band (label and summary required; optional shift/actions allowed).
- [ ] Success-case panel is hidden cleanly when success-case payload is empty (no malformed placeholders).

### Non-Critical
- [ ] Success-case count label matches visible case aggregation logic.
- [ ] Insight chips remain readable and do not overflow on mobile.

## C. Playwright Regression Constraints (Must Hold)

### `tests/e2e/onboarding-and-navigation.spec.ts`
- [ ] Onboarding can produce a plan (`.plan-tab` visible after plan generation submit).
- [ ] Plan evidence area degrades safely: either `.book-card` exists or empty-state title is shown.
- [ ] Core tab navigation works: report (`.report-tab`), consult (`.consult-tab`), plan (`.plan-tab`).

### `tests/e2e/strict-evaluator-ui.spec.ts`
- [ ] Plan UI keeps exactly 3 accordion sections (`.accordion-section` count is 3).
- [ ] Evidence and grade markers degrade safely: badge present or valid fallback UI.
- [ ] Tab routing covers report, consult, profile.
- [ ] Mobile test: overflow and tab switching constraints hold at 390x844.

### `tests/e2e/persistence-coaching.spec.ts`
- [ ] Weekly report result renders (`.report-result`).
- [ ] Consult result renders (`.consult-result`).
- [ ] Report result persists after switching tabs away and back.

### `tests/e2e/badge-gradeband.spec.ts`
- [ ] Evidence badge renders with valid confidence class (`badge--official|badge--community|badge--youtube`) when cards exist.
- [ ] Source link validity holds (`href` is `http(s)` and `rel` includes `noopener`).
- [ ] Grade-band report language constraints hold:
  - Grade 1 path includes at least one high-tier keyword (`1st-grade`, `killer`, or discriminative-intent wording).
  - Grade 4+ path includes at least one foundation keyword (`foundation`, `concept`, `basic`, or repetition-intent wording).
- [ ] Accordion toggle changes `aria-expanded`.
- [ ] Mobile overflow constraint holds at 375x812.

## Verdict Template
- Build: `PASS | FAIL`
- Playwright regression suite: `PASS | FAIL`
- Landing/app cohesion: `PASS | FAIL`
- Success-case visibility: `PASS | FAIL`
- Final sprint verdict: `PASS | FAIL`
