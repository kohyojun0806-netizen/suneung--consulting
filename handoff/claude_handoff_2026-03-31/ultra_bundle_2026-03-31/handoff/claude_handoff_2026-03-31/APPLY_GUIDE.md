# Sprint 31 산출물 적용 가이드

Date: 2026-03-30
Project: ui-data-priority-20260330

## 파일 배치 방법

```
이 번들의 파일을 아래와 같이 로컬 저장소(c:\Users\tocho\suneung)에 복사하세요:

src/suneung-tracker.jsx           → 기존 파일 교체
src/suneung-tracker.css           → 기존 파일 교체
server/report-prompt-patch.js     → 신규 파일 추가 후 아래 통합 작업 수행
tests/e2e/badge-gradeband.spec.ts → 신규 파일 추가
docs/SPRINT_CONTRACT_31.md        → 신규 파일 추가
docs/SPRINT_LOG_31.md             → 신규 파일 추가
docs/UI_QA_CHECKLIST.md           → 신규 파일 추가
```

## 서버 패치 통합 (필수)

`server/index.js`의 `/api/tracker/report` 핸들러를 아래와 같이 수정:

```js
const { getReportSystemPrompt, getReportUserPrompt, getFallbackReport } = require('./report-prompt-patch');

app.post('/api/tracker/report', async (req, res) => {
  const { profile = {}, weekInput = {} } = req.body;
  try {
    const systemPrompt = getReportSystemPrompt(profile.targetGrade);
    const userPrompt   = getReportUserPrompt(profile, weekInput);
    // ... 기존 AI 호출 로직에 위 prompt 사용
  } catch (err) {
    res.json({ report: getFallbackReport(profile, weekInput) });
  }
});
```

## 검증 실행 순서

```bash
# 1. 데이터 품질
node scripts/verify_ingest_quality.js --strict
node scripts/verify_recommendation_quality.js --strict

# 2. 빌드
npm run build

# 3. E2E (기존 4개 + 신규 6개)
npx playwright test

# 4. GSD strict loop
npm run gsd:sprint-loop -- \
  --project ui-data-priority-20260330 \
  --min-iterations 5 \
  --max-iterations 7 \
  --target-score 95 \
  --strict-evaluator true \
  --with-e2e true \
  --sandbox-fallback false

# 5. GSD verify
npm run gsd:verify-work -- \
  --project ui-data-priority-20260330 \
  --strict-evaluator true \
  --with-e2e true \
  --sandbox-fallback false
```

## API 응답 필드 확인

`/api/analyze` 응답의 `plan.recommendedBooks` 배열 항목이 다음 필드를 포함해야 합니다:

```json
{
  "id": "book_001",
  "title": "교재명",
  "author": "저자",
  "confidence": "official",
  "sourceRefs": ["https://orbi.kr/..."],
  "reason": "추천 이유",
  "tags": ["미적분", "N제"]
}
```

`confidence` 값: `"official"` | `"community"` | `"youtube-comment"`
없으면 기본값 `"community"`로 fallback 처리됩니다.
