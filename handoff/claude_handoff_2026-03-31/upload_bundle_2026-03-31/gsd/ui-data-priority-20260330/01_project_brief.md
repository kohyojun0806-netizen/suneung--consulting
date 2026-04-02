# Project Brief

## Goal
UI redesign first, then evidence-rich student success and instructor/book recommendation expansion

## Target Users
- Korean CSAT math students who need a realistic grade-up path.
- Parents and mentors who want transparent evidence behind recommendations.

## Scope
- Redesign the main UI with stronger visual identity and mobile stability.
- Expand recommendation datasets: instructors, books, student success cases, question signals.
- Add season-based guidance for top-tier tracks (Sidaeinjae and Dugak).
- Keep recommendation outputs tied to source registry references.

## Constraints
- Do not break existing API schemas used by frontend.
- Keep build and ingest verification passing.
- Respect source trust hierarchy: official > official+community > community > youtube_comment.
- No personally identifiable student data.

## Data and Sources
- Official instructor pages and curriculum pages.
- Community evidence from Orbi/Fomanhan/Sumanhwi-indexed references.
- YouTube question trend themes (Akeoreum channel emphasis).
- Internal normalized files under `data/knowledge`.

## Security and Privacy
- Keep de-identified summaries only in success cases.
- No raw scraping dump committed when trust/review is uncertain.
- Source registry must store URLs and capture date.

## Definition of Done
- UI build passes and visual system is updated.
- Data counts increase meaningfully for instructors/books/success cases/signals.
- `npm run verify:ingest` and `npm run build` pass.
- Sprint artifacts (contract, evaluator score, feedback) are generated for at least 5 iterations.
