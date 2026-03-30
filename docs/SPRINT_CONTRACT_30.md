# Sprint Contract 30

Date: 2026-03-30

## PLANER Scope
- Enforce strict evaluator behavior for GSD + 3agent loop to reduce context rot and weak-pass risk.
- Expand math book dataset depth for Sidaeinjae + community NJE/mock recommendations.
- Strengthen Playwright regression coverage for dashboard/tab coherence.

## Generator Deliverables
- Patch `scripts/gsd_workflow.js` strict evaluator defaults and stop gates.
- Add `scripts/verify_recommendation_quality.js` and include it in verification pipeline.
- Add phase3 data merge script for books/sources/signals/success cases.
- Add a new Playwright spec for strict UI flow and mobile coherence.

## evaluator Acceptance
- `verify:ingest` + `verify:catalog` strict checks pass.
- `build` passes.
- `test:e2e` passes with the new strict spec included.
- `gsd:sprint-loop` strict mode runs >=5 iterations and reports overall PASS.
- `gsd:verify-work` strict mode reports PASS.

## Sprint Contract Agreement
- No sandbox fallback pass is allowed in strict evaluator mode.
- Playwright PASS is mandatory for evaluator satisfaction.
