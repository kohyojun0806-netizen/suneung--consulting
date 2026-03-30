# Sprint Contract 13

Date: 2026-03-30

## PLANER Scope
- Wire new datasets into server recommendation pipeline.
- Expose student success and question trend counts through health/summary APIs.
- Add seasonal class guidance fields for instructor recommendations.

## Generator Deliverables
- Extend server loaders/sanitizers for student_success_cases and youtube_question_signals.
- Extend recommendation seed, analyze prompt, normalize/fallback plan.
- Add seasonal plan support in recommended instructors.

## evaluator Acceptance
- `node --check server/index.js` must pass.
- API smoke test must include success_case_insights and question_trend_insights.
- High-tier analyze request must return seasonal guidance.

## Sprint Contract Agreement
- Generator and evaluator agree on deliverable scope and DoD before execution.
- Score rubric: Design 35 / Originality 30 / Completeness 20 / Functionality 15.
- Pass condition: total >= 85 and functionality >= 12.
