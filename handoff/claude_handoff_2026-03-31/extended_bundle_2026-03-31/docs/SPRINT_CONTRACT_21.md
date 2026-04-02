# Sprint Contract 21

Date: 2026-03-30

## PLANER Scope
- Expand evidence data for real student success trajectories.
- Ensure recommendation output can reference richer evidence.
- No schema-breaking changes in API response.

## Generator Deliverables
- Add and wire `scripts/upgrade_priority_data.js`.
- Increase instructors/books/success-cases/question-signals/source-registry volume.
- Keep de-identified and source-referenced records only.

## evaluator Acceptance
- Data files are updated with increased counts.
- `/api/health` and `/api/analyze` reflect expanded dataset counts.
- `npm run verify:ingest` and `npm run build` pass.

## Sprint Contract Agreement
- Evidence quality and source mapping are required for close.
