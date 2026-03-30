# UI QA 체크리스트

Date: 2026-03-30
Sprint: 31
Project: ui-data-priority-20260330

## 1. Evidence Badge 렌더링

### 데스크탑 (1280px)
- [ ] 추천 교재 카드마다 confidence 배지가 표시된다
- [ ] official 배지: 초록색 배경, "공식" 또는 아이콘 표시
- [ ] community 배지: 파란색 배경, "커뮤니티" 표시
- [ ] youtube-comment 배지: 주황색 배경, "유튜브" 표시
- [ ] sourceRefs URL이 배지 옆 또는 하단에 링크로 표시된다
- [ ] 링크 클릭 시 새 탭에서 외부 URL이 열린다

### 모바일 (375px)
- [ ] 배지가 카드 내부에서 줄바꿈 없이 표시된다
- [ ] 배지 텍스트가 잘리지 않는다
- [ ] 링크가 터치 영역 44px 이상 확보된다

## 2. 플랜 UI 구조

### 데스크탑 (1280px)
- [ ] 정보 계층이 3단계 이내: 헤더 > 섹션카드 > 아이템
- [ ] 섹션 accordion 열기/닫기 동작이 매끄럽다
- [ ] 카드 간격이 일관하다 (동일 간격)
- [ ] 타이포그래피 스케일: 제목 > 소제목 > 본문 구분 명확
- [ ] 빈 상태(empty state)가 안내 문구로 처리된다

### 모바일 (375px)
- [ ] 카드가 single column으로 스택된다
- [ ] 가로 스크롤이 발생하지 않는다
- [ ] 버튼 터치 영역 48px 이상

## 3. 주간보고 등급 분기

- [ ] 1등급 선택 시 리포트에 "심화" / "변별력" 키워드 포함
- [ ] 2~3등급 선택 시 "취약 유형" / "실전 감각" 키워드 포함
- [ ] 4등급 이하 선택 시 "기초 개념" / "반복 훈련" 키워드 포함
- [ ] 등급 미선택 시 기본값(3등급) 적용

## 4. 전역 접근성

- [ ] 모든 배지/버튼에 aria-label 또는 title 속성 존재
- [ ] 색맹 대응: 배지 구분이 색상 외 아이콘/텍스트로도 가능
- [ ] 키보드 탐색: Tab 포커스 순서 논리적
- [ ] 외부 링크에 rel="noopener noreferrer" 적용

## 5. 성능

- [ ] 초기 로드 3초 이내 (3G 환경 시뮬레이션)
- [ ] 빌드 번들 사이즈 +100KB 미초과 (기존 대비)
- [ ] CSS 애니메이션 60fps 유지 (jank 없음)

## 6. Playwright E2E 매핑

| 테스트 | 파일 | 상태 |
|--------|------|------|
| 온보딩 flow | strict-evaluator-ui.spec.ts | PASS |
| 플랜 분석 | strict-evaluator-ui.spec.ts | PASS |
| 위클리 리포트 | strict-evaluator-ui.spec.ts | PASS |
| AI 컨설트 | strict-evaluator-ui.spec.ts | PASS |
| Badge 렌더링 | badge-gradeband.spec.ts | 신규 |
| 등급 분기 리포트 | badge-gradeband.spec.ts | 신규 |

## 판정 기준
- PASS: 모든 항목 ✅
- CONDITIONAL: 1~2개 minor ⚠️ (다음 스프린트 수정)
- FAIL: 3개+ 또는 critical 1개+ ❌ (현 스프린트 재작업)
