# Sprint Workflow (GSD + 3agent)

## Roles
- PLANER: Defines what to build only (problem, scope, contract, completion criteria).
- Generator: Implements how to build it, with highest weight on design quality and originality.
- evaluator: Scores outcomes, verifies behavior, gives feedback, and triggers next iteration.

## Sprint Contract (Required Before Every Iteration)
- What this iteration will deliver
- Definition of Done (DoD)
- Evaluation rubric and weights
- Passing criteria
- Loop policy

## Default Score Weights
- Design Quality: 35
- Originality: 30
- Completeness: 20
- Functionality: 15

## Loop Policy (Default)
- Minimum iterations: 5
- Continue after iteration 5 until near-optimal state
- Near-optimal state:
- total score >= 92
- score improvement magnitude <= 1.5
- stable verification pass streak >= 2
- Safety cap: max iterations = 12

## Automation Commands
- `npm run gsd:execute-phase` (default auto loop)
- `npm run gsd:sprint-loop` (explicit alias)
- `npm run gsd:execute-phase -- --single ...` (single-run fallback)

## Artifacts Per Iteration
- `iter-XX_contract.md`
- `iter-XX_execution_checklist.md`
- `iter-XX_verify_report.md`
- `iter-XX_evaluator_score.json`
- `iter-XX_feedback.md`

## Notes
- If no manual scorecard is provided, evaluator score is auto-calculated from verification pass ratio.
- Manual scorecard can override category scores per iteration.
