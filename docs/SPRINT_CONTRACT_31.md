# Sprint Contract 31

Date: 2026-03-30
Project: ui-data-priority-20260330
Phase: 4 (UI Evidence Badge + Grade-band Report + QA)

## PLANER Scope

### P1. Evidence Badge UI
- 추천 교재 카드마다 sourceRefs confidence 배지 노출 (official / community / youtube-comment)
- sourceRefs URL 클릭 → 외부 링크 오픈
- confidence 레벨 색상 구분: official(green) / community(blue) / youtube-comment(orange)

### P2. 플랜 UI 구조 재설계
- 정보 계층 3단계 이내: 헤더 > 섹션카드 > 아이템
- 섹션별 collapsible accordion 적용
- 빈 공간/과밀 해소: 카드 간격 일관화, 타이포그래피 스케일 정비

### P3. 등급대별 주간보고 템플릿 분화
- 1등급: "심화/변별력 포인트" 강조 프롬프트
- 2~3등급: "취약 유형 보완 + 실전감각" 균형 프롬프트
- 4등급 이하: "기초 개념 + 반복 훈련" 중심 프롬프트

### P4. UI QA 체크리스트
- 모바일 375px / 데스크탑 1280px 기준 항목 정의
- Badge 렌더링, 링크, 반응형, 색상 접근성 포함

### P5. Playwright E2E 확장
- Badge 렌더링 확인 시나리오
- 등급 분기 리포트 시나리오
- 기존 4개 + 신규 2개 = 최소 6개 PASS

## 완료 기준
- [ ] 모든 추천 교재 카드에 confidence 배지 표시
- [ ] sourceRefs 링크 클릭 가능
- [ ] 플랜 화면 정보 계층 3단계 이내
- [ ] 주간보고 등급대 자동 분기 프롬프트 적용
- [ ] Playwright 6개+ PASS
- [ ] verify:ingest --strict: PASS
- [ ] verify:catalog --strict: PASS
- [ ] build: PASS (에러 0)

## 평가 기준 (100점)
| 항목 | 배점 |
|------|------|
| UI 유기성/가독성 (배지, 카드 계층, 여백) | 35 |
| 데이터 품질 (sourceRefs 연결율, confidence) | 25 |
| 기능 완결성 (등급 분기, 링크, E2E) | 25 |
| 문서 기록 (Contract/Log/Audit/QA체크리스트) | 15 |
| **합계** | **100** |

## 프로세스 정책
- sandbox fallback pass 금지
- Playwright PASS 필수
- 최소 5회 반복, target score 95
- 문서 누락 금지
