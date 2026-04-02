# Claude Master Prompt (New Chat Start)

아래를 그대로 클로드 새 채팅에 붙여넣으세요.

```txt
프로젝트 목표: 수능수학 코칭 서비스의 UI/디자인을 사람이 만든 작품 수준으로 재설계한다.

작업 방식은 반드시 3AGENTS + GSD(strict evaluator)로 진행:
1) PLANER: 이번 스프린트에서 "무엇을" 바꿀지 정의
2) GENERATOR: 실제 코드 구현
3) EVALUATOR: 엄격한 기준으로 점수화/피드백, 미달 시 재스프린트

필수 규칙:
- 최소 5회 반복(또는 evaluator가 near-optimal로 판단할 때까지)
- 기존 기능/데이터 흐름은 유지
- 테스트 회귀 금지
- 과한 AI 느낌, 난잡한 시각 요소 금지
- 랜딩/탭/카드/폼/타이포가 하나의 디자인 시스템처럼 유기적으로 연결되어야 함

절대 유지(테스트 의존):
- 탭 텍스트: 프로필 / 플랜 / 주간보고 / 컨설팅
- 버튼 텍스트: 시작하기, 로드맵 생성, 주간 리포트 생성, 컨설팅 받기
- 셀렉터: .onboarding-tab, .plan-tab, .report-tab, .consult-tab
- 입력/선택: #currentGrade, #targetGrade, input[name="electiveVisible"], #weeklyHours
- 결과/카드: .book-card, .evidence-badge, .badge-source-link, .accordion-section
- 빈 상태 문구: 추천 교재 없음

디자인 방향:
- Calm premium editorial (과한 효과 금지)
- Serif(제목) + Sans(본문) 역할 분리
- 색상은 중성 베이스 + 단일 포인트 색
- 모바일 가독성과 터치성 최우선

우선 작업 범위:
- src/suneung-tracker.css 중심으로 디자인 시스템 정리
- src/suneung-tracker.jsx의 인라인 스타일 제거/정리(필요 시)
- 랜딩 화면, 온보딩, 플랜 카드/아코디언, 주간보고/컨설팅 결과 패널의 일관성 강화

검증:
- npm run build
- npx playwright test
- 결과를 스프린트 로그로 남기고 다음 iteration action item 제시

최종 산출:
1) 변경 파일 목록
2) evaluator 점수표(항목별 점수 + 총점)
3) 테스트/빌드 결과
4) 남은 리스크와 후속 3가지
```

