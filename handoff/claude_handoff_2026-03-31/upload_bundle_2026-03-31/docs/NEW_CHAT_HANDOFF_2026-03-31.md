# New Chat Handoff (2026-03-31)

## Project
- Root path: `C:\Users\tocho\suneung`
- Production URL: `https://suneung-psi.vercel.app`
- Latest commit checked: `aac6883`
- Latest commit message: `fix: add canonical api retry fallback for intermittent analyze 500`

## Read First (in this order)
1. `docs/PROJECT_STATE.md`
2. `docs/NEXT_TASKS.md`
3. `docs/SPRINT_AUDIT_2026-03-30.md`
4. `docs/SERVER_ERROR_INCIDENT_2026-03-31.md`
5. `docs/GSD_WORKFLOW.md`

## Current Status (short)
- Live checks for `/api/analyze`, `/api/tracker/report`, `/api/tracker/consult` were validated with successful responses in recent runs.
- Frontend error handling was improved so endpoint-specific causes are shown more clearly.
- `analyze` route has a fallback retry path to canonical API (`suneung-psi`) when intermittent 5xx appears.
- User priority is still UI coherence and practical roadmap quality based on real student outcome patterns.

## Quick Verify Commands
1. `git pull`
2. `npm run build`
3. `npm run test:e2e` (or project Playwright command)
4. Health check and analyze request check (local + production)

## Notes
- Keep existing Claude UI structure as much as possible while improving flow consistency.
- Be careful not to accidentally include temporary import artifacts in release commits:
  - `data/imports/files_3/`
  - `handoff/`
