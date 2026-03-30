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

## Evidence Data Snapshot (Phase2)
- Knowledge items: `20`
- Recommendation instructors: `14`
- Recommendation books: `43`
- Student success cases: `17`
- Question signals: `22`
- Source registry entries: `40`

## Quality Guardrails
- Ingest quality verification script: `scripts/verify_ingest_quality.js`
- Strict mode supported (`--strict`) for warning-level enforcement
- Recommendation reason dedupe/quality scoring in server logic
- API fallback plans/reports/consult responses if model call fails

## Workflow State
- GSD process: `GSD + 3agent (PLANER -> Generator -> evaluator)`
- Minimum iterations floor: `5`
- Internal sandbox fallback default: `false` (explicit opt-in only)
- Current active GSD project: `ui-data-priority-20260330`

## Recent Verification
- `npm run verify:ingest`: PASS
- `npm run build`: PASS
- `npm run test:e2e`: PASS (2 tests)
- `npm run gsd:execute-phase -- --min-iterations 5 --max-iterations 5`: PASS

## Key Risks
- Sandbox-restricted environments can block Node child-process spawn (`EPERM`)
- External data quality varies by source trust level; confidence weighting remains important
- Deployment still depends on valid Vercel/Render credentials and env parity
