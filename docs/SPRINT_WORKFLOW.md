# Sprint Workflow (PLANER → Generator → evaluator)

## Roles
- PLANER: 무엇을 만들지 정의 (문제정의, 범위, 완료조건, 배점)
- Generator: 구현 담당 (특히 디자인 품질/독창성 가중치 우선)
- evaluator: 점수 평가 및 피드백 담당 (원칙: Playwright 기반 검증 + 기능 점검)

## Sprint Contract (필수)
스프린트 시작 전에 Generator와 evaluator가 아래를 확정한다.

1. 이번 산출물
2. 완료 기준(DoD)
3. 평가 항목/배점
4. 합격 기준
5. 반복 루프 횟수(최소 1회)

## Default Score Weights
- 디자인 품질: 35
- 독창성: 30
- 완성도: 20
- 기능성: 15
- 합격선: 총점 85 이상 + 기능성 12 이상

## Evaluation Loop
1. Generator 구현
2. evaluator 점수화 + 피드백
3. Generator 개선
4. evaluator 재평가
5. 합격 시 종료, 미달 시 반복

## Note
- Playwright가 미설치된 환경에서는 임시로 build/API 검증 + 수동 체크리스트를 사용하고,
  가능한 첫 기회에 Playwright 검증 루틴을 복구한다.
