# Project State

## Overview
- Service: Suneung Math Coaching Tracker (evidence-driven roadmap + weekly coaching)
- Frontend: React (CRA) in `src/suneung-tracker.jsx` + `src/suneung-tracker.css`
- Backend: Express API in `server/index.js`
- Deploy targets:
- Frontend: Vercel
- Backend: Render

## Core Flows
- Onboarding: current grade / target grade / elective subject
- Analyze plan: `POST /api/analyze`
- Weekly report: `POST /api/tracker/report`
- AI consult: `POST /api/tracker/consult`
- Health + data summary: `GET /api/health`, `GET /api/knowledge/summary`

## Evidence Data Snapshot (Phase3)
- Knowledge items: `20`
- Recommendation instructors: `14`
- Recommendation books: `63`
- Student success cases: `19`
- Question signals: `25`
- Source registry entries: `50`

## Quality Guardrails
- Ingest quality verification script: `scripts/verify_ingest_quality.js`
- Recommendation catalog verification script: `scripts/verify_recommendation_quality.js`
- Strict mode supported (`--strict`) for warning-level enforcement
- Recommendation reason dedupe/quality scoring in server logic
- API fallback plans/reports/consult responses if model call fails

## Workflow State
- GSD process: `GSD + 3agent (PLANER -> Generator -> evaluator)`
- Minimum iterations floor: `5`
- Internal sandbox fallback default: `false` (explicit opt-in only)
- Strict evaluator default: `true` (Playwright required, no fallback pass)
- Current active GSD project: `ui-data-priority-20260330`

## Recent Verification
- `npm run verify:ingest`: PASS
- `npm run verify:catalog -- --strict`: PASS
- `npm run build`: PASS
- `npm run test:e2e`: PASS (4 tests)
- `npm run gsd:sprint-loop -- --strict-evaluator true --min-iterations 5 --max-iterations 7`: PASS
- `npm run gsd:verify-work -- --strict-evaluator true --with-e2e true`: PASS

## Key Risks
- Sandbox-restricted environments can block Node child-process spawn (`EPERM`)
- External data quality varies by source trust level; confidence weighting remains important
- Deployment still depends on valid Vercel/Render credentials and env parity
