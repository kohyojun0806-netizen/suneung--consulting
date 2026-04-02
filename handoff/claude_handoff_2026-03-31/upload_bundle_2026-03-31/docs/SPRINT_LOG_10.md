# Sprint Log (10 Iterations)

Date: 2026-03-29

Scoring rubric:
- 디자인 품질 35
- 독창성 30
- 완성도 20
- 기능성 15
- Pass: 85+ and 기능성 12+

Evaluator note:
- Playwright 미설치 환경이므로 이번 10회 평가는 `build + API smoke + preview smoke + UI 체크리스트`로 수행.

## Sprint 1
- Contract: 앱 메시지를 "데이터 근거 기반 누적 코칭"으로 재정의하고 Hero 구조 개편
- DoD: 메시지/정보 위계가 첫 화면에서 명확
- Result: 디자인 30 / 독창성 24 / 완성도 16 / 기능성 14 = 84
- Feedback: 브랜드 톤은 좋아졌지만 데이터 근거 노출이 더 필요

## Sprint 2
- Contract: 카드/탭/타이포/배경 시스템 리디자인
- DoD: 기존 단순 다크 카드에서 벗어난 시각 언어 확보
- Result: 디자인 32 / 독창성 26 / 완성도 17 / 기능성 14 = 89
- Feedback: 시각적 완성도 상승, 코칭 지속성 지표 추가 필요

## Sprint 3
- Contract: 대시보드 핵심 지표(시간/점수/연속 기록) 강화
- DoD: 학생이 현재 상태를 10초 내 파악 가능
- Result: 디자인 32 / 독창성 26 / 완성도 18 / 기능성 14 = 90
- Feedback: 성과 지표는 충분, 위험 신호 가시화 필요

## Sprint 4
- Contract: 학습 데이터 근거 패널 확장(지식/추천 항목 및 카테고리 수)
- DoD: 커뮤니티/유튜브/OT/커리큘럼 기반이 화면에서 확인 가능
- Result: 디자인 33 / 독창성 27 / 완성도 18 / 기능성 14 = 92
- Feedback: 신뢰성 강화 완료, 실행 루프(주간 계약) 추가 권장

## Sprint 5
- Contract: 근본 학습법 + 시기별 로드맵 표현 고도화
- DoD: 3~6모, 6~9모, 9모~수능 전 실행 계획 명확
- Result: 디자인 33 / 독창성 27 / 완성도 18 / 기능성 14 = 92
- Feedback: 추천/리포트 누적 추적 기능 강화 필요

## Sprint 6
- Contract: 추천 강사/교재 가독성 및 정보 밀도 개선
- DoD: 이유(reason)/대상/사용시점이 빠르게 읽힘
- Result: 디자인 33 / 독창성 27 / 완성도 19 / 기능성 14 = 93
- Feedback: 코칭 누적 흐름을 명시적으로 보여줄 것

## Sprint 7
- Contract: 주간 미션 체크리스트 도입(실행 계약)
- DoD: 학생이 주간 실행 항목을 체크하고 진행률 확인 가능
- Result: 디자인 34 / 독창성 28 / 완성도 19 / 기능성 15 = 96
- Feedback: 매우 좋음, 리스크 탐지 기능 추가 권장

## Sprint 8
- Contract: 리스크 레이더(학습시간/취약기록/복기누락) 도입
- DoD: 최근 4주 기반 위험 신호가 수치로 표시
- Result: 디자인 34 / 독창성 28 / 완성도 19 / 기능성 15 = 96
- Feedback: 누적 이력/아카이브가 있으면 더 좋음

## Sprint 9
- Contract: 전략/리포트 이력 및 내보내기(.md) 추가
- DoD: 아카이브 가능, 외부 공유 가능한 텍스트 추출 가능
- Result: 디자인 34 / 독창성 29 / 완성도 20 / 기능성 15 = 98
- Feedback: 코치의 장기 메모를 연동하면 지속 코칭 완성도 상승

## Sprint 10
- Contract: 코치 메모(지속 지시사항) + 상담 퀵 프롬프트 연동
- DoD: 누적 코칭 성격이 설정/상담에서 일관되게 반영
- Result: 디자인 34 / 독창성 29 / 완성도 20 / 기능성 15 = 98
- Feedback: 현 스프린트 목표 달성, 다음 단계는 Playwright 자동 평가 체계 복구

## Final
- 10회 반복 완료
- Final Score: 98/100
- Verification:
  - `npm run build` 성공
  - `/api/health`, `/api/knowledge/summary` 200
  - preview endpoint 200
