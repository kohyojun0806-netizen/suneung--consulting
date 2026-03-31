# Tier Recommendation Policy (2026-03-31)

## Purpose
- Prevent low-impact recommendations for high-tier students.
- Example insight: for 1-grade target students, EBS should not be the primary lecture/book track.

## Data/Rule Changes
- EBS-like books (`type=EBS`, `suneungteukgang`, `suneungwanseong`) no longer target `3-1` fitKey in `recommendation_catalog.json`.
- EBS-like entries are marked as supplement intent in purpose text.
- Onsite/practical resources (N-set, mock, academy tracks) are prioritized for top-tier profile.

## Engine Guards (server)
- Top-tier profile definition:
  - `currentGrade <= 2` OR `targetGrade <= 1`
- For top-tier profile:
  - Filter out EBS-like books from recommendation seed when enough alternatives exist.
  - Filter out EBS-like lecture hints when enough alternatives exist.
  - Filter out EBS-like instructors when enough alternatives exist.
  - Apply extra score bonus to practical/high-tier books and onsite tracks.
- For lower-tier profile:
  - Keep EBS as a valid bridge resource.

## Validation Rule
- `scripts/verify_recommendation_quality.js`
  - Warning if EBS-like book still contains `fitKeys` with `3-1`.

## Spot Check Results
- Profile A: `2 -> 1` (미적분)
  - Top books: Drill/N-set, 시대인재/두각 실모·학원교재
  - No EBS in top recommendation slice
- Profile B: `7 -> 5` (미적분)
  - Top books include EBS 수특/수완 라인

