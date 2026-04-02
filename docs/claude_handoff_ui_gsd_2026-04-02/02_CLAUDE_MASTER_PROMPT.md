# Claude Master Prompt (copy/paste)

```txt
목표:
수능수학 코칭 서비스의 UI 디자인을 "랜딩과 실제 프로그램이 완전히 하나의 제품처럼 보이는 수준"으로 고도화한다.

작업 체계:
반드시 3AGENTS + GSD(strict evaluator)로 진행한다.
- PLANER: 이번 스프린트에서 바꿀 것/안 바꿀 것 정의
- GENERATOR: 코드 구현
- EVALUATOR: 엄격 판정(점수+수정지시), 미달 시 반복

필수 규칙:
1) 최소 5회 iteration 또는 evaluator가 near-optimal PASS 판정할 때까지 반복
2) 테스트 계약(셀렉터/텍스트) 절대 파괴 금지
3) UI는 과장된 AI 느낌 금지, 제품 일관성/가독성/모바일 우선
4) 성공사례 데이터는 실제 사용자가 신뢰할 수 있는 형태로 요약/노출

절대 유지해야 하는 계약:
- 버튼 텍스트: 시작하기, 로드맵 생성, 주간 리포트 생성, 컨설팅 받기
- 탭 텍스트: 프로필, 플랜, 주간보고, 컨설팅
- 핵심 셀렉터: .onboarding-tab, .plan-tab, .report-tab, .consult-tab
- 폼 셀렉터: #currentGrade, #targetGrade, input[name="electiveVisible"], #weeklyHours
- 플랜 영역: .accordion-section 개수 3개 유지

작업 우선순위:
- 랜딩과 앱 본문의 시각 톤/타이포/간격/카드 언어 통일
- 성공사례 UI(랜딩+플랜) 가독성/신뢰감 강화
- 모바일 overflow 0 유지

검증 명령:
- npm run verify:ingest
- npm run verify:catalog -- --strict
- npm run build
- npx playwright test
- npm run gsd:verify-work -- --project ui-data-priority-20260330 --strict-evaluator true --with-e2e true --sandbox-fallback false

최종 산출:
1) 변경 파일 목록
2) evaluator 점수표(항목별 점수, FAIL 원인 포함)
3) 테스트/빌드/verify 로그 요약
4) 다음 스프린트 액션 3개
```

