# Claude One-File Start (UI + GSD)

## Goal
Continue UI/design improvement work quickly with minimal context-loading cost.

## Working Mode
- Use GSD 3-agent flow with strict evaluator.
- Focus on UI/UX quality and consistency.
- Keep behavior stable; avoid backend-risky edits unless needed.

## Current Status (as of 2026-03-31)
- Build and Playwright were passing in Codex workspace.
- Primary recent work included report grade-band handling and UI E2E stabilization.
- Handoff docs and prompt docs already prepared.

## Start Here (Do in order)
1. Read this file only first.
2. Read docs/CLAUDE_HANDOFF_UI_GSD_2026-03-31.md.
3. Open src/suneung-tracker.jsx and src/suneung-tracker.css.
4. Run smallest safe UI change set first.
5. Run targeted tests for changed UI paths.

## Primary Files
- src/suneung-tracker.jsx
- src/suneung-tracker.css
- tests/e2e/badge-gradeband.spec.ts
- docs/CLAUDE_HANDOFF_UI_GSD_2026-03-31.md
- docs/CLAUDE_PROMPT_UI_GSD_2026-03-31.md

## Constraints
- Keep upload package under 31MB.
- Prioritize minimal file reads for speed.
- Prefer concise diffs over broad refactors.

## Suggested First Prompt
Use the content from docs/CLAUDE_PROMPT_UI_GSD_2026-03-31.md.
