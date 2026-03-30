# Security Hardening Log (2026-03-30)

## Scope
- API runtime hardening (headers, rate-limit, optional shared-secret gate)
- Preview server hardening
- Deployment env/document hardening

## Implemented
- [server/index.js](../server/index.js)
  - `app.disable("x-powered-by")`
  - security headers middleware (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `CSP`, `HSTS`) 
  - IP rate limiting per API scope
  - optional shared secret middleware (`ENFORCE_API_SHARED_SECRET`, `API_SHARED_SECRET`)
  - API 404 + common error middleware
- [server/preview.js](../server/preview.js)
  - preview security headers and `x-powered-by` disable
- [.env.example](../.env.example)
  - security env keys added
- [DEPLOY_GUIDE.md](../DEPLOY_GUIDE.md)
  - Security hardening deployment section added

## Security Smoke Results
- Header check: `X-Content-Type-Options=nosniff`, `X-Frame-Options=DENY`
- Shared-secret check: without header -> 401, with header -> 200
- Rate-limit check: burst 130 requests -> `200:120`, `429:10`

## Environment Keys
- `REQUEST_BODY_LIMIT`
- `ENABLE_SECURITY_HEADERS`
- `ENABLE_RATE_LIMIT`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`
- `RATE_LIMIT_ANALYZE_MAX`
- `RATE_LIMIT_REPORT_MAX`
- `RATE_LIMIT_CONSULT_MAX`
- `ENFORCE_API_SHARED_SECRET`
- `API_SHARED_SECRET`
- `ENABLE_PREVIEW_SECURITY_HEADERS`
