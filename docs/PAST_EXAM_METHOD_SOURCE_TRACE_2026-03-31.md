# Past Exam Method Data Trace (2026-03-31)

## Scope
- Goal: strengthen "past-exam study method" guidance with evidence-backed data.
- Request focus: Orbi columns, instructor board posts, YouTube question/comment intent.

## Added Source Registry IDs
- `orbi-final-50days-math-00064579399`
- `orbi-geometry-guide-column-00077047288`
- `official-megastudy-woojin-qna-rule-2024`
- `official-megastudy-woojin-lecture-board-56232`
- `youtube-search-csat-math-past-method-2026`
- `youtube-search-akoreum-past-method-2026`

## Added Knowledge Items
- `kb-past-97-output-first`
- `kb-past-75-rotation-structure`
- `kb-past-53-decision-log`
- `kb-past-31-final-reuse`
- `kb-past-all-review-sheet`
- `kb-past-all-instructor-board-template`

## Runtime Integration
- API now returns:
  - `plan.past_exam_guide` (core principles, action steps, common failures, source refs)
  - `plan.evidence_trace` (category refs + resolved source metadata + unresolved ids)
- Analyze metadata now includes:
  - `meta.sourceRegistryUpdatedAt`
  - `meta.evidenceSourceCount`

## UI Integration
- Plan tab now includes a `Past-Exam Guide` accordion.
- Source IDs are link-resolved through `plan.evidence_trace.resolved_sources`.
- Book source references also accept `source_refs` from backend snake_case fields.

