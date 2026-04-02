# UI Strict Handoff File Pack (2026-03-31)

Use this set when asking Claude to run `GSD + 3AGENT + strict evaluator` for UI/design upgrades.

## Must Attach (core)
1. `src/suneung-tracker.jsx`
2. `src/suneung-tracker.css`
3. `src/App.jsx`
4. `server/index.js`
5. `tests/e2e/strict-evaluator-ui.spec.ts`
6. `tests/e2e/badge-gradeband.spec.ts`
7. `data/knowledge/knowledge_base.json`
8. `docs/PROJECT_STATE.md`
9. `docs/NEXT_TASKS.md`
10. `docs/SPRINT_AUDIT_2026-03-30.md`
11. `docs/UI_QA_CHECKLIST.md`
12. `docs/GSD_WORKFLOW.md`

## Strongly Recommended (context + safety)
1. `docs/SERVER_ERROR_INCIDENT_2026-03-31.md`
2. `docs/TIER_RECOMMENDATION_POLICY_2026-03-31.md`
3. `docs/NJE_SOURCE_TRACE_2026-03-31.md`
4. `docs/PAST_EXAM_METHOD_SOURCE_TRACE_2026-03-31.md`
5. `docs/HIGH_TIER_ONSITE_SOURCE_TRACE_2026-03-31.md`
6. `playwright.config.js`
7. `package.json`

## Optional (if Claude asks for more)
1. `scripts/verify_ingest_quality.js`
2. `scripts/verify_recommendation_quality.js`
3. `scripts/gsd_workflow.js`
4. `scripts/release_prod.js`

## Upload Order
1. Product status docs (`PROJECT_STATE`, `NEXT_TASKS`, `SPRINT_AUDIT`)
2. UI implementation files (`src/*`)
3. API + tests (`server/*`, `tests/e2e/*`)
4. Data + policy docs (`data/knowledge/*`, source-trace docs)

## Goal Reminder
- Keep the current clean Claude baseline.
- Push originality and creativity without making the experience noisy.
- Evaluator decides release readiness, not planner/generator.
