# Next Tasks

## Priority 1 (Now)
- [x] UI-first visual overhaul and dashboard polish
- [x] Evidence dataset expansion (sources, registry, success cases, question signals)
- [x] Books/NJE/mock expansion for Sidaeinjae + community recommendation coverage
- [x] Recommendation reason quality hardening (short/noisy text filtering + dedupe)
- [x] GSD + 3agent strict evaluator loop validation (Playwright required)
- [x] Add strict catalog verification (`verify:catalog`)

## Priority 2 (Product Quality)
- [ ] Add UI QA checklist with mobile/desktop visual acceptance criteria
- [ ] Improve weekly report templates by grade band and writing style
- [ ] Optimize AI coach response length/cost with tighter token policy
- [ ] Add explicit evidence badges in UI (official/community/youtube-comment confidence)
- [ ] Expose sourceRefs + confidence per recommended book in the plan UI

## Priority 3 (Operations)
- [ ] Harden deployment checklist for Render + Vercel env sync (`OPENAI_API_KEY`, `AI_MODEL`, CORS origin)
- [ ] Add post-deploy API smoke and E2E smoke runbook
- [ ] Monitor and alert when knowledge/catalog files fail strict verification
- [ ] Keep sandbox fallback disabled by default; use explicit opt-in only when needed

## Evidence Expansion Backlog
- [ ] Collect more high-quality success posts with clear score delta and duration
- [ ] Expand teacher-board curriculum references per season and per instructor
- [ ] Extend Akoreum/Youtube question signal dataset with recurring comment clusters
- [ ] Add instructor-level "which period / which class / which content" timeline cards for top-band users
