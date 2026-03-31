# Project Context For Claude

This repository is a CSAT math consulting + tracker service.

## Product Goal

- Input: `currentGrade`, `targetGrade`, `electiveSubject`
- Output:
  - personalized core feedback
  - what to focus on now
  - period plan (`3~6모`, `6~9모`, `9모~수능 전`)
  - instructor/book recommendations
  - cumulative coaching signals (weekly logs/reports/coach consult)
- Rule: Do **not** expose raw source links in user-facing plan text.

## Current Architecture

- Frontend:
  - entry: `src/App.jsx` (re-export)
  - main UI: `src/suneung-tracker.jsx`
  - style: `src/suneung-tracker.css`
- Backend API: `server/index.js`
- Ingest pipeline: `server/ingest.js`
- Ingest QA script: `scripts/verify_ingest_quality.js`
- Data files:
  - `data/knowledge/knowledge_base.json`
  - `data/knowledge/recommendation_catalog.json`
  - `data/knowledge/sources.json`
  - `data/knowledge/source_registry.json`
- E2E evaluator:
  - `playwright.config.js`
  - `tests/e2e/*.spec.ts`

## Main API

- `POST /api/analyze`
- `POST /api/tracker/report`
- `POST /api/tracker/consult`
- `GET /api/health`
- `GET /api/knowledge/summary`

## Sprint Workflow (Required)

Use `PLANER → Generator → evaluator`:
1. PLANER defines **what** to build (scope/DoD/score)
2. Generator implements (**design quality + originality weighted**)
3. evaluator scores and loops with feedback

Reference docs:
- `docs/SPRINT_WORKFLOW.md`
- `docs/SPRINT_CONTRACT_001.md`
- `docs/SPRINT_CONTRACT_002.md`
- `docs/SPRINT_LOG_10.md`
- `docs/SPRINT_LOG_11.md`

## Run Commands

- `npm run server`
- `npm start`
- `npm run ingest`
- `npm run verify:ingest`
- `npm run build`
- `npm run test:e2e`

## Important Constraints

- Official-first recommendation policy must remain intact.
- Community sources are supplementary evidence.
- Keep `sourceLevel` + `confidence` scoring behavior.
- Keep API response keys backward-compatible with frontend.

## Current Priority

1. Priority 2 product quality items in `docs/NEXT_TASKS.md`
2. Expand Playwright evaluator coverage (API error/fallback scenarios)
3. Keep cumulative coaching UX coherent across dashboard/plan/report/consult/settings
