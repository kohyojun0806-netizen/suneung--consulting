# GSD Workflow

This project supports your requested phase structure with concrete commands.

Requested structure:
- `/gsd:new-project`
- `/gsd:discuss-phase`
- `/gsd:plan-phase`
- `/gsd:execute-phase`
- `/gsd-verify-work`

CLI mapping in this repo:
- `npm run gsd:new-project`
- `npm run gsd:discuss-phase`
- `npm run gsd:plan-phase`
- `npm run gsd:execute-phase` (default: 3agent sprint loop)
- `npm run gsd:sprint-loop` (explicit alias)
- `npm run gsd:verify-work` (alias: `npm run gsd-verify-work`)

Slash-style router:
- `npm run gsd -- /gsd:new-project ...`
- `npm run gsd -- /gsd:discuss-phase`
- `npm run gsd -- /gsd:plan-phase`
- `npm run gsd -- /gsd:execute-phase`
- `npm run gsd -- /gsd:sprint-loop`
- `npm run gsd -- /gsd-verify-work`

## 1) New Project
Initialize a new project workspace and question templates.

```bash
npm run gsd:new-project -- --name "student-math-coach" --goal "evidence-first coaching app"
npm run gsd -- /gsd:new-project --name "student-math-coach" --goal "evidence-first coaching app"
```

Generated files under `gsd/<project-slug>/`:
- `00_intake_questions.md`
- `01_project_brief.md`
- `02_discussion_notes.md`
- `03_plan.xml` (seed)
- `04_execution_log.md`
- `05_verify_report.md`
- `06_process_policy.json` (default loop policy: min 5 iterations)
- `context.json`

## 2) Discuss Phase
Detect unresolved markers (`[TBD]`, `[TODO]`, `TODO:`) and generate concrete clarification questions.

```bash
npm run gsd:discuss-phase
npm run gsd -- /gsd:discuss-phase
```

Output:
- `02a_clarification_questions.md`

## 3) Plan Phase
Generate XML plan + self validation report.

```bash
npm run gsd:plan-phase
npm run gsd -- /gsd:plan-phase
```

Outputs:
- `03_plan.xml`
- `03_plan_validation.md`

Validation includes:
- Goal resolved
- Research item count
- Execution task count
- Self-validation check count

## 4) Execute Phase (Default = Sprint Loop)
Run PLANER/Generator/evaluator loop automatically.
Default policy:
- Minimum 5 iterations
- Continue after 5 until near-optimal condition is met
- Strict evaluator default enabled
- Playwright verification required in strict mode
- Sandbox fallback pass not allowed in strict mode
- Generator and evaluator contract is generated at each iteration start

```bash
npm run gsd:execute-phase
npm run gsd:sprint-loop -- --min-iterations 5 --target-score 95 --strict-evaluator true
npm run gsd -- /gsd:execute-phase --task "implemented API security middleware"
```

Outputs:
- `sprints/sprint-<timestamp>/iter-XX_contract.md`
- `sprints/sprint-<timestamp>/iter-XX_execution_checklist.md`
- `sprints/sprint-<timestamp>/iter-XX_verify_report.md`
- `sprints/sprint-<timestamp>/iter-XX_evaluator_score.json`
- `sprints/sprint-<timestamp>/iter-XX_feedback.md`
- `sprints/sprint-<timestamp>/sprint_summary.md`
- `04_execution_log.md` (aggregated)

Single-run mode (legacy behavior):

```bash
npm run gsd:execute-phase -- --single --task "single iteration work" --status done
```

## 5) Verify Work
Run verification pipeline and write report.

```bash
npm run gsd:verify-work
npm run gsd:verify-work -- --with-e2e
npm run gsd -- /gsd-verify-work
```

Output:
- `05_verify_report.md`

Default checks:
- `npm run verify:ingest`
- `npm run verify:catalog`
- `npm run build`

Optional:
- `npm run test:e2e` when `--with-e2e` is provided.
- In strict mode, e2e is forced and must pass.

Manual scorecard support:

```bash
npm run gsd:sprint-loop -- --scorecard gsd/my-project/scorecard.json
```

`scorecard.json` format:

```json
{
  "iterations": [
    { "designQuality": 30, "originality": 24, "completeness": 18, "functionality": 14 },
    { "designQuality": 31, "originality": 26, "completeness": 19, "functionality": 15 }
  ]
}
```

## Notes
- Current active project is tracked in `gsd/state.json`.
- You can switch project with `--project <slug>` on each phase command.
- In this terminal environment, slash command style is represented via npm scripts.
