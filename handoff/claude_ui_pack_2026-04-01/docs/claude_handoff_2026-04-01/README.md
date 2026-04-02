# Claude UI Handoff 2026-04-01

Use this folder when you want to continue UI/design work in Claude with `GSD + 3agent + strict-evaluator`.

## 1) Upload File Set
- Open `01_FILESET_UI_STRICT.md`.
- Upload all files listed under `Required`.
- Upload `Optional` files only if Claude asks for deeper context.

## 2) Start Prompt
- Paste `02_PROMPT_START_UI_GSD_STRICT.txt` as your first Claude message.

## 3) Continue Prompt
- If the session is still open, paste `03_PROMPT_CONTINUE_UI_GSD_STRICT.txt`.

## 4) Resume Prompt
- If you open a new chat and need Claude to recover context, paste `04_PROMPT_RESUME_UI_GSD_STRICT.txt`.

## 5) Validation
- Use `05_COMMAND_CHECKLIST_UI_STRICT.txt` as the run/verify checklist.

## 6) Optional Pack Script
- Run `scripts/create_claude_ui_pack_2026_04_01.ps1` from project root.
- It creates:
  - `handoff/claude_ui_pack_2026-04-01/` (file mirror)
  - `handoff/claude_ui_pack_2026-04-01.zip` (upload zip)

