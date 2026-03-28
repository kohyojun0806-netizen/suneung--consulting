# Project Context For Claude

This repository is a CSAT math roadmap service.

## Product Goal

- User inputs current grade and target grade.
- Service returns:
  - current personalized feedback
  - what to focus on now
  - phase plans:
    - before March~June mock
    - June~September mock
    - September mock~CSAT
  - instructor and book recommendations
- Do **not** expose source links in final user-facing plan text.

## Current Architecture

- Frontend: React (`src/App.jsx`)
- Backend API: Express (`server/index.js`)
- Data ingest pipeline: `server/ingest.js`
- Knowledge base: `data/knowledge/knowledge_base.json`
- Source list for ingest: `data/knowledge/sources.json`
- Recommendation catalog: `data/knowledge/recommendation_catalog.json`
- Source registry: `data/knowledge/source_registry.json`

## Main API

- `POST /api/analyze`
  - input: `currentGrade`, `targetGrade`, optional `electiveSubject`
  - output includes:
    - `student_feedback`
    - `current_focus`
    - `period_plan`
    - `math_structure`
    - `subject_curriculum`
    - `recommended_instructors`
    - `recommended_books`

## Run Commands

- `npm run server` (backend)
- `npm start` (frontend)
- `npm run ingest` (rebuild knowledge from source list)
- `npm run build` (frontend build)

## Important Constraints

- Prioritize official data over community data.
- Community data is supplementary signal only.
- Keep recommendation confidence logic (`sourceLevel`, `confidence`) intact.
- Do not hardcode source links in user-facing roadmap output.
- Keep output focused on practical study actions, not generic motivation.

## Next Priority Work

1. Improve ingest quality filtering to reduce noisy transcripts.
2. Strengthen subject-specific recommendation mapping (`subjectTags`).
3. Increase official instructor/course metadata coverage.
4. Keep fallback responses meaningful even when model calls fail.

