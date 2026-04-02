# Sprint Contract 002

Date: 2026-03-30

## PLANER Scope (무엇을 만들지)
- evaluator 역할에 Playwright 자동 검증 루프를 실전 배치
- 핵심 사용자 흐름(초기 설정, 탭 이동, 누적 코칭 요소)의 회귀 안정성 확보
- 스프린트 결과를 점수화해 다음 개선 루프 기준선으로 활용

## Generator Deliverables
- Playwright 설정 파일 및 실행 스크립트 추가
- e2e 테스트 2개 이상 작성:
  - 초기 설정 → 대시보드 진입
  - 누적 코칭(체크리스트/코치메모) 반영 확인
- 테스트 산출물(리포트/결과 디렉토리) Git 무시 처리

## evaluator Score Rubric
- 디자인 품질: 35
- 독창성: 30
- 완성도: 20
- 기능성: 15

## Definition of Done
- `npm run test:e2e` 성공
- 주요 플로우 테스트 통과
- 기존 `npm run build`도 유지 성공
- 스프린트 평가 로그 문서 추가

## Pass Condition
- 총점 85 이상 + 기능성 12 이상
