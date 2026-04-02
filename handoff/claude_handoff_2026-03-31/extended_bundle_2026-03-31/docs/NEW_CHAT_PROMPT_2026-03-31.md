# New Chat Start Prompt

Copy and paste this into a fresh chat:

```text
Project root is: C:\Users\tocho\suneung

Please continue this project from current state without redoing completed work.

First, read these files in order and summarize current status in 5 lines:
1) docs/PROJECT_STATE.md
2) docs/NEXT_TASKS.md
3) docs/SPRINT_AUDIT_2026-03-30.md
4) docs/SERVER_ERROR_INCIDENT_2026-03-31.md
5) docs/NEW_CHAT_HANDOFF_2026-03-31.md

Execution mode:
- Keep GSD + 3AGENT structure (Planner -> Generator -> Evaluator).
- Run strict sprint loops until evaluator passes.
- Keep UI clean and coherent (not cluttered), and preserve the latest Claude-made design language as baseline.

Primary goals:
1) UI/UX polish for landing + roadmap flow.
2) Improve data structure for level bands:
   - no-base, grade 5-7, grade 3-4, grade 2, grade 1, near-perfect/100.
3) Expand recommendation detail (content timing, lecture/book fit by level and season).
4) Strengthen textbook/N-je references and guidance structure.

Engineering requirements:
- Implement directly in code (not just planning).
- Run build + verify + Playwright e2e.
- If a failure appears, fix root cause and rerun verification.
- At the end, provide:
  - changed files list
  - test/build/e2e results
  - deployment status and live URL
  - concise sprint log

Deployment:
- Push to repository and deploy to Vercel production.
- Use existing project conventions and avoid including temporary handoff/import artifacts in release commits.
```
