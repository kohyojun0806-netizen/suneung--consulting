# Verify Report (iter-04)

Generated: 2026-03-30T06:14:46.000Z
Overall: PASS

## Summary
- verify:ingest: PASS
- build: PASS

## Logs
### verify:ingest
```text
[verify:ingest] items: 20
[verify:ingest] issues -> critical:0, warning:0
[verify:ingest] category -> 깨짐:0, 중복:0, 저품질:0
[verify:ingest] report: data\knowledge\ingest_quality_report.json
```

### build
```text
Creating an optimized production build...
Compiled successfully.

File sizes after gzip:

  70.83 kB  build\static\js\main.2c6dc0f0.js
  3.25 kB   build\static\css\main.5a1a60ac.css

The project was built assuming it is hosted at /.
You can control this with the homepage field in your package.json.

The build folder is ready to be deployed.
You may serve it with a static server:

  npm install -g serve
  serve -s build

Find out more about deployment here:

  https://cra.link/deployment

(node:55912) [DEP0176] DeprecationWarning: fs.F_OK is deprecated, use fs.constants.F_OK instead
(Use `node --trace-deprecation ...` to show where the warning was created)
```

