# Claude UI Handoff (2026-04-02)

목적: 클로드에서 **UI 디자인 고도화 작업**을 `3AGENTS + GSD + strict evaluator` 체제로 이어서 진행.

## 현재 상태 요약
- 랜딩/앱 본문 시각 톤을 다크 글래스 계열로 통합
- 플랜 탭에 성공사례 데이터 인라인 노출
- 성공사례 데이터 25건으로 확장
- build, playwright, gsd strict verify PASS 상태에서 배포 완료

## 이 폴더 사용 순서
1. `01_UPLOAD_FILELIST.md` 기준으로 파일 업로드
2. `02_CLAUDE_MASTER_PROMPT.md`를 새 채팅 첫 메시지로 입력
3. 필요 시 `03_AGENT_PROMPTS.md`로 개별 에이전트 지시
4. 완료 후 `04_STRICT_EVALUATOR_CHECKLIST.md`로 통과 판정

