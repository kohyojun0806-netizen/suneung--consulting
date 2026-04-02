# Claude Handoff - UI/Design Sprint (2026-03-31)

## Goal
- Keep the current Claude design language.
- Improve full flow coherence: landing -> onboarding -> plan -> report -> consult.
- Execute in strict mode: GSD + 3agent + strict-evaluator.

## Current Baseline
- Root: C:\Users\tocho\suneung
- Active GSD project: ui-data-priority-20260330
- Policy: strictEvaluator=true, withE2E=true, minIterations>=5
- Build: PASS (cmd /c npm run build)
- Playwright: PASS (cmd /c npx playwright test, 10/10)

## Already Applied
1) Weekly report band prompt hardening
- server/report-prompt-patch.js
- server/index.js (mode=grade-band-v2-text, tighter token caps)

2) Preview same-origin API route support
- server/preview.js
- /api/* forwarded to backend app in preview mode

3) E2E stabilization
- tests/e2e/*.spec.ts selector/fallback updates

4) QA docs
- docs/UI_QA_CHECKLIST.md
- docs/NEXT_TASKS.md priority2 checked

## Next Sprint Focus (for Claude)
- Primary: overall UI/design polish and consistency.
- Keep visual hierarchy intentional, avoid clutter.
- Improve mobile quality at 375px (readability, tab usability, no overflow).

## Mandatory Execution Mode
Run strict loop:

cmd /c npm run gsd:sprint-loop -- --project ui-data-priority-20260330 --min-iterations 5 --max-iterations 7 --target-score 95 --strict-evaluator true --with-e2e true --sandbox-fallback false

Then verify:

cmd /c npm run build
cmd /c npx playwright test
cmd /c npm run gsd:verify-work -- --project ui-data-priority-20260330 --strict-evaluator true --with-e2e true --sandbox-fallback false

## Constraints
- Do not include handoff/, data/imports/files_3/, probe artifacts in release commits.
- Keep core E2E selectors/classes stable (.plan-tab, .book-card, .badge-source-link, .tab-nav__btn).
- API key may be invalid; fallback path should still keep functional tests passing.

## Definition of Done
- UI quality is visibly improved.
- build PASS
- playwright PASS
- strict evaluator outputs clean result with no unresolved FAIL reason.
- Final report includes changed files, verification result, remaining risks.