# Claude Prompt (Copy/Paste)

```text
Project root: C:\Users\tocho\suneung

Continue from current state. Focus on overall design/UI improvements.

Read first:
1) docs/CLAUDE_HANDOFF_UI_GSD_2026-03-31.md
2) docs/PROJECT_STATE.md
3) docs/NEXT_TASKS.md
4) docs/UI_QA_CHECKLIST.md

Execution mode is mandatory:
- GSD + 3agent + strict-evaluator
- min iterations >= 5
- with E2E required
- sandbox fallback disabled

Run these commands:
- cmd /c npm run gsd:sprint-loop -- --project ui-data-priority-20260330 --min-iterations 5 --max-iterations 7 --target-score 95 --strict-evaluator true --with-e2e true --sandbox-fallback false
- cmd /c npm run build
- cmd /c npx playwright test
- cmd /c npm run gsd:verify-work -- --project ui-data-priority-20260330 --strict-evaluator true --with-e2e true --sandbox-fallback false

Primary objective:
- Improve full UI flow (landing/onboarding/plan/report/consult) while preserving latest Claude design language.
- Raise coherence, hierarchy, spacing rhythm, and mobile usability.

Engineering constraints:
- Keep existing E2E core selectors/classes stable.
- Exclude handoff/import/probe artifacts from release commits.

Final output format:
- changed files list
- before/after UI summary
- build/e2e/strict verification results
- remaining risks and next steps
```