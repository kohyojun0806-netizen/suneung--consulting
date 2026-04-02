# Verify Report (iter-03)

Generated: 2026-03-30T13:13:12.777Z
Overall: PASS

## Summary
- verify:ingest: PASS
- verify:catalog: PASS
- build: PASS
- test:e2e: PASS

## Logs
### verify:ingest
```text
[verify:ingest] items: 20
[verify:ingest] issues -> critical:0, warning:0
[verify:ingest] category -> 깨짐:0, 중복:0, 저품질:0
[verify:ingest] report: data\knowledge\ingest_quality_report.json
```

### verify:catalog
```text
[verify:catalog] books: 63
[verify:catalog] coverage -> nje/mock:30, sdij-style:19
[verify:catalog] issues -> critical:0, warning:0
[verify:catalog] report: data\knowledge\recommendation_quality_report.json
```

### build
```text
Creating an optimized production build...
Compiled successfully.

File sizes after gzip:

  70.99 kB  build\static\js\main.822d355d.js
  3.33 kB   build\static\css\main.28cbc3f5.css

The project was built assuming it is hosted at /.
You can control this with the homepage field in your package.json.

The build folder is ready to be deployed.
You may serve it with a static server:

  npm install -g serve
  serve -s build

Find out more about deployment here:

  https://cra.link/deployment

(node:67752) [DEP0176] DeprecationWarning: fs.F_OK is deprecated, use fs.constants.F_OK instead
(Use `node --trace-deprecation ...` to show where the warning was created)
```

### test:e2e
```text
Running 4 tests using 2 workers

  ok 1 [chromium] › tests\e2e\onboarding-and-navigation.spec.ts:16:5 › onboarding to dashboard and core tab navigation (10.4s)
  ok 2 [chromium] › tests\e2e\persistence-coaching.spec.ts:12:5 › weekly checklist persistence and coach memory reflection (21.6s)
  ok 3 [chromium] › tests\e2e\strict-evaluator-ui.spec.ts:18:5 › strict dashboard evidence blocks and tab routing (15.4s)
  ok 4 [chromium] › tests\e2e\strict-evaluator-ui.spec.ts:44:7 › mobile coherence › mobile tab switching remains usable (10.9s)

  4 passed (39.4s)
```

