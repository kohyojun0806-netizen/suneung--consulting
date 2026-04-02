# UI QA Checklist

## Scope
- Screens: landing, onboarding, plan, weekly report, AI consult
- Breakpoints: desktop (>=1280px), tablet (768px), mobile (375px)

## Common Acceptance
- No horizontal overflow at each breakpoint.
- Core CTA buttons are visible without layout breakage.
- Korean text is readable and not clipped.
- Error toast appears and dismisses correctly.
- Focus order is logical with keyboard navigation.

## Landing
- Hero title, stats, and CTA are visible on first paint.
- Enter animation completes and transitions to app shell.
- Background visual effects do not block text contrast.

## Onboarding
- Grade chips select/deselect correctly.
- Elective cards update hidden compatibility radio inputs.
- Weekly hours slider updates numeric badge.
- `로드맵 생성` activates only when required fields are set.

## Plan
- Accordion sections open/close with stable height.
- Evidence badges render with confidence class (`official/community/youtube`).
- Book source link is external (`https?`) with `noopener noreferrer`.
- Grade badge reflects target grade band.

## Weekly Report
- Placeholder copy changes by target grade band.
- `주간 리포트 생성` shows loading and disables duplicate submits.
- Result card renders sectioned response without overflow.
- Grade 1-target report includes high-tier language (e.g., 변별/킬러).
- Lower-band report includes foundation language (e.g., 기초/개념/반복).

## AI Consult
- Suggestion chips populate question textarea.
- Answer card renders line breaks safely.
- Long answers are truncated to concise length in UI.

## Mobile Specific (375x812)
- Tab nav labels stay readable without wrapping overlap.
- Cards stack to 1-column layout.
- Accordions and buttons keep touch-friendly height.
- Toast/overlay does not block bottom navigation controls.

## Verification Commands
- `npm run build`
- `npx playwright test tests/e2e/badge-gradeband.spec.ts`
- `npx playwright test tests/e2e/strict-evaluator-ui.spec.ts`