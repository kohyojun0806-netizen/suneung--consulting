# Claude Handoff (UI + 3AGENT/GSD)

이 폴더는 Claude에서 작업을 이어갈 때 사용할 표준 세트입니다.

## 사용 순서
1. `01_file_open_order.txt`를 먼저 읽고 파일 열기
2. Claude 첫 메시지로 `02_start_prompt_ko.txt` 전체 붙여넣기
3. 세션 중단 후 재개 시 `03_continue_prompt_ko.txt` 또는 `04_resume_prompt_ui_gsd_ko.txt` 사용
4. 실행 명령은 `05_command_checklist.txt` 그대로 사용

## 현재 기준 상태 (2026-03-30)
- 최신 푸시 커밋: `ac39cfc`
- 프로덕션 URL: `https://suneung-psi.vercel.app`
- strict evaluator 기본 정책:
  - 최소 반복 5회
  - 목표 점수 95
  - Playwright PASS 필수
  - sandbox fallback pass 금지

## 핵심 원칙
- 우선순위: UI 디자인 품질/유기성 -> strict 검증 -> 데이터 신뢰도 확장
- 개발 방식: PLANER -> Generator -> evaluator
- 종료 조건: evaluator 만족 + strict 검증 통과 + 문서 로그 기록
