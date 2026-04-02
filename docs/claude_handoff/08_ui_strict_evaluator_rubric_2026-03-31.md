# Strict Evaluator Rubric (UI + Design)

## Pass Policy
- Final score must be `>= 97/100`.
- Minimum iterations: `5`.
- `Playwright e2e` must be all pass.
- Any hard-fail item means automatic reject, regardless of total score.

## Hard-Fail Items
1. Broken primary user flow (start -> input -> roadmap result).
2. Playwright e2e failure on strict UI specs.
3. Visual clutter that reduces clarity.
4. Mobile layout breakage or severe overflow/cutoff.
5. Generic template-level output with no identifiable design intent.

## Scoring Categories (100 total)
1. Product Coherence (20)
- One clear visual language across screens.
- Natural transition between sections.
- No disconnected random blocks.

2. Information Hierarchy (20)
- Important content is instantly discoverable.
- Typography scale supports scanability.
- Actions and labels are unambiguous.

3. Originality with Control (20)
- Distinctive identity beyond common boilerplate.
- Creative direction is intentional, not decorative noise.
- Style choices reinforce product trust.

4. UX Clarity and Simplicity (20)
- Fewer cognitive steps for the same goal.
- Inputs are understandable and level-aware.
- Output cards/plans are concise and actionable.

5. Implementation Quality (20)
- No obvious regression in existing behavior.
- Desktop + mobile quality is both acceptable.
- Build and tests pass with reproducible commands.

## Evaluator Output Format (required)
1. Iteration number
2. Score by category
3. Hard-fail check result
4. Top 5 issues to fix
5. Approve or Reject decision
6. If reject: exact next-iteration tasks

## Recommended Verification Commands
- `npm run build`
- `npm run test:e2e`
- `node scripts/verify_ingest_quality.js --strict`
- `node scripts/verify_recommendation_quality.js --strict`
