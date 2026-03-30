# 배포 빠른 가이드 (Vercel + Render)

## 1) 백엔드 배포 (Render)
- Render > New > Web Service
- GitHub 저장소 연결
- 설정값:
  - `Name`: `suneung-api` (원하는 이름)
  - `Root Directory`: 비움
  - `Build Command`: `npm install`
  - `Start Command`: `node server/index.js`

- Environment Variables (Render):
  - `OPENAI_API_KEY=여기에_너의_키`
  - `AI_MODEL=gpt-4.1-mini`
  - `FRONTEND_ORIGIN=https://your-app.vercel.app`
  - `KNOWLEDGE_FILE=data/knowledge/knowledge_base.json`
  - `RECOMMENDATION_FILE=data/knowledge/recommendation_catalog.json`

- 배포 완료 후 API 주소 확인:
  - 예: `https://suneung-api.onrender.com`
  - 헬스체크: `https://suneung-api.onrender.com/api/health`

## 2) 프론트 배포 (Vercel)
- Vercel > Add New > Project
- 같은 GitHub 저장소 선택
- Framework: `Create React App` 자동 인식
- 설정값:
  - `Build Command`: `npm run build`
  - `Output Directory`: `build`

- Environment Variables (Vercel):
  - `REACT_APP_API_BASE=https://suneung-api.onrender.com`

- 배포 완료 후 프론트 주소 확인:
  - 예: `https://your-app.vercel.app`

## 3) CORS 연결
- Render의 `FRONTEND_ORIGIN` 값을 프론트 실제 주소로 맞추기
  - 예: `https://your-app.vercel.app`
- 필요하면 쉼표로 여러 개 허용 가능:
  - `FRONTEND_ORIGIN=http://localhost:3000,https://your-app.vercel.app`

## 4) 최종 점검
- 프론트 접속 후 분석 버튼 테스트
- 실패 시 확인:
  - Render 로그에서 에러 확인
  - `OPENAI_API_KEY` 누락 여부 확인
  - `REACT_APP_API_BASE` 오타 확인

## 5) Security Hardening (Recommended)
- Render environment variables:
  - `ENABLE_SECURITY_HEADERS=true`
  - `ENABLE_RATE_LIMIT=true`
  - `RATE_LIMIT_WINDOW_MS=60000`
  - `RATE_LIMIT_MAX_REQUESTS=120`
  - `RATE_LIMIT_ANALYZE_MAX=40`
  - `RATE_LIMIT_REPORT_MAX=80`
  - `RATE_LIMIT_CONSULT_MAX=80`
- Optional API shared secret protection:
  - `ENFORCE_API_SHARED_SECRET=true`
  - `API_SHARED_SECRET=<random-long-secret>`
  - Frontend/clients must send header: `x-api-shared-secret`
- Keep this disabled (`false`) if the public frontend cannot attach the secret header yet.
