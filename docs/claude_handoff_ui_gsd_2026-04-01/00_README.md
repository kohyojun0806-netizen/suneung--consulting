# Claude Handoff: UI Reinforcement (3AGENTS + GSD)

이 폴더는 클로드에서 **UI/디자인 보강 작업**을 바로 이어가기 위한 핸드오프 세트입니다.

## 목표
- AI 느낌이 아닌, 사람이 만든 것 같은 완성도 높은 UI로 재정비
- 기존 기능/데이터 흐름 유지
- `3AGENTS + GSD + strict evaluator` 루프로 품질 고도화

## 이 폴더 구성
- `01_UPLOAD_FILELIST.md`: 클로드에 업로드할 실제 파일 목록
- `02_CLAUDE_MASTER_PROMPT.md`: 새 채팅 첫 입력용 마스터 프롬프트
- `03_AGENT_PROMPTS.md`: PLANER/GENERATOR/EVALUATOR 개별 프롬프트
- `04_STRICT_EVALUATOR_CHECKLIST.md`: 회귀 방지 체크리스트

## 현재 주의사항
- E2E 의존 셀렉터/문구가 많으므로 임의 변경 금지
- 특히 탭 텍스트(`프로필`, `플랜`, `주간보고`, `컨설팅`)와 버튼 텍스트(`로드맵 생성`, `시작하기`)는 유지
- `src/suneung-tracker.jsx`의 hidden compatibility control(`#currentGrade`, `#targetGrade`, `#weeklyHours`) 유지

