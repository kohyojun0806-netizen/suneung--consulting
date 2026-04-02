# Upload File List (for Claude)

아래 파일/폴더를 그대로 업로드하면 UI 작업을 안정적으로 이어갈 수 있습니다.

## 필수
- `package.json`
- `playwright.config.js`
- `src/suneung-tracker.jsx`
- `src/suneung-tracker.css`
- `src/App.jsx`
- `src/index.js`
- `src/index.css`
- `server/index.js`
- `server/preview.js`
- `tests/e2e/`
- `scripts/gsd_workflow.js`

## 데이터/추천 로직 확인용 (권장)
- `data/knowledge/recommendation_catalog.json`
- `data/knowledge/source_registry.json`
- `data/knowledge/knowledge_base.json`
- `scripts/verify_recommendation_quality.js`
- `scripts/verify_ingest_quality.js`

## GSD 정책/프로젝트 컨텍스트 (권장)
- `gsd/state.json`
- `gsd/ui-data-priority-20260330/06_process_policy.json`
- `gsd/ui-data-priority-20260330/03_plan.xml`

## 업로드 팁
- 문서만(예: `06_`, `07_`, `08_`) 올리지 말고, 반드시 `src/`, `server/`, `tests/e2e/` 같은 **실제 소스**를 함께 업로드하세요.

