# Server Error Incident Log (2026-03-31)

## Symptom
- User reported repeated `서버 오류 500` while generating roadmap.

## What Was Investigated
1. Verified live endpoint behavior from browser-like Origin.
2. Reproduced request/response in Playwright and direct API calls.
3. Compared endpoint-level behavior (`/api/analyze`, `/api/tracker/report`, `/api/tracker/consult`).

## Findings
- External model API key absence was **not** the primary cause.
  - Backend already has fallback path when `OPENAI_API_KEY` is missing.
- CORS policy caused browser-only failures in some Origin combinations.
- `report/consult` endpoints had Vercel routing gaps at one point (404), which surfaced as generic server errors in UI.
- Generic UI error text (`서버 오류: 500`) reduced diagnosability.

## Fixes Applied
1. Payload mapping fix for analyze request (grade/elective normalization).
2. Serverless-safe write behavior for generated files (avoid hard-fail on write in constrained env).
3. CORS hardening:
   - Allow same-host Origin automatically.
   - Keep explicit allowed origins and localhost/vercel cases.
   - Return blocked-origin as 403 path instead of opaque failure.
4. Added explicit Vercel route files:
   - `api/analyze.js`
   - `api/health.js`
   - `api/tracker/report.js`
   - `api/tracker/consult.js`
5. Improved frontend error diagnostics:
   - Include endpoint in error message and parse backend JSON error body for
     `/api/analyze`, `/api/tracker/report`, `/api/tracker/consult`.

## Verification Snapshot
- Live checks after deployment:
  - `POST /api/analyze` => 200
  - `POST /api/tracker/report` => 200
  - `POST /api/tracker/consult` => 200
- Playwright click-flow on onboarding/roadmap creation => plan rendered (no 500) on main deployment URL.

## Deployed Commits (relevant)
- `54a4168` fix: avoid analyze 500 on serverless write
- `ee00fbc` fix: allow vercel origin in cors to stop browser 500
- `b1b5bd9` fix: add explicit vercel routes for tracker report/consult
- `a4ae2d3` fix: allow same-host cors and configure frontend origin

## Remaining Risk
- If user opens an older cached bundle, stale client behavior can still show old generic errors.
- If user accesses a different host URL than the verified main deployment, behavior can differ.

## Next Debug Data Needed (if issue still reproduces)
- Exact page URL shown in browser address bar.
- Exact error text shown after latest refresh.
- Which action triggers error (`로드맵 생성`, `주간 리포트 생성`, `컨설팅 질문`).
