# Claude Transfer (2026-03-30)

## 1) 현재 상태 요약
- 최신 푸시 커밋: `6c80d8e` (`main`)
- 핵심 반영: `gsd + 3agent` 개발 워크플로우 자동화, 사이트 내 Workflow 상태 표시 추가
- 프론트 배포 확인: `https://suneung-consulting.vercel.app/` (HTTP 200)
- 프론트 번들 반영 확인: `Workflow Status` 문자열 포함 확인
- 백엔드(Render) 상태: `https://suneung-consulting.onrender.com` 가 `Service Suspended`

## 2) 이번 커밋 변경 파일
- `.gitignore`
- `package.json`
- `scripts/gsd_workflow.js`
- `scripts/gsd_slash.js`
- `docs/GSD_WORKFLOW.md`
- `docs/SPRINT_WORKFLOW.md`
- `gsd/.gitkeep`
- `server/index.js`
- `src/suneung-tracker.jsx`

## 3) 기능적으로 바뀐 점
- 개발 프로세스:
  - `execute-phase` 기본 동작이 3agent 루프(최소 5회)로 동작
  - `sprint-loop` 명령 추가
  - 프로젝트별 정책 파일 `06_process_policy.json` 자동 생성/사용
- 서버:
  - `GET /api/workflow` 추가
  - 현재 gsd 상태(`gsd/state.json`) + 정책 파일 읽어 반환
- 프론트:
  - 설정(Settings) 탭에 `Workflow Status` 카드 추가
  - `/api/workflow` 호출 결과 표시(프로세스/현재 프로젝트/반복정책/가중치)

## 4) 중요한 운영 메모
- `gsd + 3agent`는 **개발 워크플로우 전용**임
- 서비스 런타임(학생 사용 기능)에 3agent 루프가 직접 붙는 구조는 아님
- 현재 사용자 서비스 이슈 우선순위 1순위는 Render 백엔드 재개(unsuspend)

## 5) Claude에서 바로 할 일 (우선순위)
1. Render 서비스 재개 상태 확인
   - `GET /api/health`
   - `GET /api/workflow`
2. 프론트-백엔드 연동 점검
   - Vercel의 `REACT_APP_API_BASE` 값 검증
3. `docs/NEXT_TASKS.md` Priority 1부터 진행
4. 배포 재검증 후 로그 문서 업데이트

## 6) 로컬 검증 명령
```bash
npm run build
npm run gsd:help
npm run server
npm start
```

## 7) 배포 확인 명령(예시)
```bash
curl -I https://suneung-consulting.vercel.app/
curl https://suneung-consulting.onrender.com/api/health
curl https://suneung-consulting.onrender.com/api/workflow
```

## 8) 참고 문서
- `docs/PROJECT_STATE.md`
- `docs/NEXT_TASKS.md`
- `docs/ROLLBACK_POINTS.md`
- `docs/GSD_WORKFLOW.md`
- `docs/SPRINT_WORKFLOW.md`
