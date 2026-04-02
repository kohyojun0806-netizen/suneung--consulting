# File Set For Claude (UI + GSD 3agent + Strict Evaluator)

Project root: `C:\Users\tocho\suneung`

## Required
```text
README.md
CLAUDE.md
package.json
package-lock.json
.env.example
playwright.config.js
src/App.jsx
src/index.js
src/index.css
src/suneung-tracker.jsx
src/suneung-tracker.css
server/index.js
server/preview.js
server/report-prompt-patch.js
api/index.js
api/analyze.js
api/health.js
api/[...path].js
tests/e2e/badge-gradeband.spec.ts
tests/e2e/onboarding-and-navigation.spec.ts
tests/e2e/persistence-coaching.spec.ts
tests/e2e/strict-evaluator-ui.spec.ts
scripts/gsd_workflow.js
scripts/gsd_slash.js
scripts/verify_ingest_quality.js
scripts/verify_recommendation_quality.js
docs/SPRINT_AUDIT_2026-03-30.md
docs/PROJECT_STATE.md
docs/NEXT_TASKS.md
docs/UI_QA_CHECKLIST.md
docs/SPRINT_CONTRACT_31.md
docs/SPRINT_LOG_31.md
docs/SERVER_ERROR_INCIDENT_2026-03-31.md
data/knowledge/knowledge_base.json
data/knowledge/recommendation_catalog.json
data/knowledge/source_registry.json
data/knowledge/student_success_cases.json
data/knowledge/youtube_question_signals.json
data/knowledge/instructor_curriculum_map.json
data/knowledge/grade_study_methods.json
```

## Optional (if Claude requests more context)
```text
docs/SPRINT_WORKFLOW.md
docs/GSD_WORKFLOW.md
docs/TIER_RECOMMENDATION_POLICY_2026-03-31.md
docs/HIGH_TIER_ONSITE_SOURCE_TRACE_2026-03-31.md
docs/NJE_SOURCE_TRACE_2026-03-31.md
docs/PAST_EXAM_METHOD_SOURCE_TRACE_2026-03-31.md
gsd/ui-data-priority-20260330/**/*
```

## Do Not Upload
```text
node_modules/**/*
build/**/*
playwright-report/**/*
test-results/**/*
.git/**/*
```

