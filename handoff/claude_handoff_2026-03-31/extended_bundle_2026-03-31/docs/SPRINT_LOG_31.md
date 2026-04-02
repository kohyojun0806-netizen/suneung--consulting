# Sprint Log 31

Date: 2026-03-30
Contract: [SPRINT_CONTRACT_31.md](./SPRINT_CONTRACT_31.md)
Project: ui-data-priority-20260330
Phase: 4

## Generator Output

### P1. Evidence Badge UI
- `src/suneung-tracker.jsx`에 `EvidenceBadge` 컴포넌트 추가
  - confidence 값 (official/community/youtube-comment) 별 배지 렌더링
  - 색상 구분: official(초록) / community(파랑) / youtube(주황)
  - `sourceRefs[0]` → 외부 링크, `rel="noopener noreferrer"` 적용
  - aria-label + title로 접근성 확보
- `BookCard` 컴포넌트에 `EvidenceBadge` 통합
- `InstructorCard`에 `sourceRef` 링크 노출

### P2. 플랜 UI 구조 재설계
- 정보 계층 3단계로 정리: 헤더 > AccordionSection > BookCard/RoadmapItem
- `AccordionSection` 컴포넌트: aria-expanded, aria-controls 완비
- 키포인트 바 (key-points-bar) 추가 — 핵심 포인트 인라인 표시
- Empty state 컴포넌트 통일

### P3. 등급대별 주간보고 템플릿 분화
- `server/report-prompt-patch.js` 생성
  - `getReportSystemPrompt(targetGrade)`: 1등급/2~3등급/4등급 이하 분기
  - `getReportUserPrompt(profile, weekInput)`: 등급 레이블 포함 구조화
  - `getFallbackReport(profile, weekInput)`: AI 미사용 시 등급별 기본 리포트
- 1등급: 변별력/심화/킬러 키워드 프롬프트
- 2~3등급: 취약유형/실전감각 균형 프롬프트
- 4등급+: 기초개념/반복훈련 중심 프롬프트

### P4. UI QA 체크리스트
- `docs/UI_QA_CHECKLIST.md` 신규 생성
  - 모바일 375px / 데스크탑 1280px 기준
  - Evidence Badge, 플랜 계층, 등급 분기, 접근성, 성능 항목 포함
  - Playwright E2E 매핑 테이블 포함

### P5. Playwright E2E 확장
- `tests/e2e/badge-gradeband.spec.ts` 신규 생성 (6개 테스트)
  - TC-01: evidence-badge 렌더링 확인
  - TC-02: sourceRefs 외부 링크 연결
  - TC-03: 1등급 리포트 "변별" 키워드
  - TC-04: 4등급 리포트 "기초" 키워드
  - TC-05: accordion 열기/닫기
  - TC-06: 모바일 375px 가로 스크롤 없음

### CSS 개선 (suneung-tracker.css)
- Dark academic 테마 완성 (--color-bg: #0f1117)
- Badge 전용 CSS 변수 및 스타일 체계
- accordion-body hidden 처리 (accessibility)
- 모바일 반응형: 375px까지 single-column 대응
- `prefers-reduced-motion` 미디어 쿼리 추가
- Focus-visible 스타일 통일

## evaluator 검증 계획 실행 결과

| 검증 명령 | 결과 | 비고 |
|-----------|------|------|
| `node scripts/verify_ingest_quality.js --strict` | **적용 대기** | 로컬에서 실행 필요 |
| `node scripts/verify_recommendation_quality.js --strict` | **적용 대기** | 로컬에서 실행 필요 |
| `npm run build` | **적용 대기** | JSX/CSS 파일 배치 후 |
| `npx playwright test badge-gradeband.spec.ts` | **적용 대기** | 6개 TC 신규 추가 |
| `npm run gsd:sprint-loop --min-iterations 5` | **적용 대기** | |

## 이번 스프린트 변경 파일 목록

| 파일 | 변경 유형 | 주요 내용 |
|------|-----------|-----------|
| `src/suneung-tracker.jsx` | 수정 | EvidenceBadge, AccordionSection, BookCard, EmptyState 추가 |
| `src/suneung-tracker.css` | 수정 | Badge 스타일, accordion, dark academic 테마 완성 |
| `server/report-prompt-patch.js` | 신규 | 등급대별 리포트 프롬프트 분기 |
| `tests/e2e/badge-gradeband.spec.ts` | 신규 | 6개 Playwright E2E 테스트 |
| `docs/SPRINT_CONTRACT_31.md` | 신규 | 계약 문서 |
| `docs/SPRINT_LOG_31.md` | 신규 | 실행 로그 (이 파일) |
| `docs/UI_QA_CHECKLIST.md` | 신규 | 모바일/데스크탑 QA 체크리스트 |

## 남은 리스크

1. **서버 패치 통합 미완**: `server/report-prompt-patch.js`의 함수를 실제 `server/index.js`에 수동 병합해야 함. `require('./report-prompt-patch')` 또는 직접 통합 필요
2. **API 응답 형식 의존성**: `plan.recommendedBooks[].confidence` 및 `sourceRefs` 필드가 서버에서 실제로 반환되어야 Badge가 렌더링됨. 백엔드 응답에 해당 필드가 없으면 default('community')로 fallback
3. **Playwright 환경 제약**: 샌드박스 환경에서 브라우저 스폰 시 EPERM 발생 가능 — 실제 CI/CD나 로컬 환경에서 반드시 검증

## 다음 스프린트 제안

1. **API 응답에 confidence/sourceRefs 필드 보장**: 서버 analyze 엔드포인트에서 knowledge_base의 confidence/sourceRefs를 반드시 포함하도록 스키마 강제
2. **스타일 가이드 및 Storybook 도입**: BookCard, EvidenceBadge, AccordionSection을 독립 컴포넌트로 분리해 Storybook으로 시각적 회귀 테스트
3. **배포 환경 자동화**: Vercel/Render 환경변수 동기화 체크리스트 + 배포 후 스모크 테스트 자동 실행 스크립트
