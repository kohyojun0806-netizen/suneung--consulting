$ErrorActionPreference = "Stop"

$root = Resolve-Path "."
$packDir = Join-Path $root "handoff\claude_ui_pack_2026-04-01"
$zipPath = Join-Path $root "handoff\claude_ui_pack_2026-04-01.zip"

$files = @(
  "README.md",
  "CLAUDE.md",
  "package.json",
  "package-lock.json",
  ".env.example",
  "playwright.config.js",
  "src\App.jsx",
  "src\index.js",
  "src\index.css",
  "src\suneung-tracker.jsx",
  "src\suneung-tracker.css",
  "server\index.js",
  "server\preview.js",
  "server\report-prompt-patch.js",
  "api\index.js",
  "api\analyze.js",
  "api\health.js",
  "api\[...path].js",
  "tests\e2e\badge-gradeband.spec.ts",
  "tests\e2e\onboarding-and-navigation.spec.ts",
  "tests\e2e\persistence-coaching.spec.ts",
  "tests\e2e\strict-evaluator-ui.spec.ts",
  "scripts\gsd_workflow.js",
  "scripts\gsd_slash.js",
  "scripts\verify_ingest_quality.js",
  "scripts\verify_recommendation_quality.js",
  "docs\SPRINT_AUDIT_2026-03-30.md",
  "docs\PROJECT_STATE.md",
  "docs\NEXT_TASKS.md",
  "docs\UI_QA_CHECKLIST.md",
  "docs\SPRINT_CONTRACT_31.md",
  "docs\SPRINT_LOG_31.md",
  "docs\SERVER_ERROR_INCIDENT_2026-03-31.md",
  "data\knowledge\knowledge_base.json",
  "data\knowledge\recommendation_catalog.json",
  "data\knowledge\source_registry.json",
  "data\knowledge\student_success_cases.json",
  "data\knowledge\youtube_question_signals.json",
  "data\knowledge\instructor_curriculum_map.json",
  "data\knowledge\grade_study_methods.json",
  "docs\claude_handoff_2026-04-01\README.md",
  "docs\claude_handoff_2026-04-01\01_FILESET_UI_STRICT.md",
  "docs\claude_handoff_2026-04-01\02_PROMPT_START_UI_GSD_STRICT.txt",
  "docs\claude_handoff_2026-04-01\03_PROMPT_CONTINUE_UI_GSD_STRICT.txt",
  "docs\claude_handoff_2026-04-01\04_PROMPT_RESUME_UI_GSD_STRICT.txt",
  "docs\claude_handoff_2026-04-01\05_COMMAND_CHECKLIST_UI_STRICT.txt"
)

if (Test-Path -LiteralPath $packDir) {
  Remove-Item -LiteralPath $packDir -Recurse -Force
}
if (Test-Path -LiteralPath $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

New-Item -ItemType Directory -Path $packDir -Force | Out-Null

$missing = @()
foreach ($relative in $files) {
  $src = Join-Path $root $relative
  if (-not (Test-Path -LiteralPath $src)) {
    $missing += $relative
    continue
  }
  $dst = Join-Path $packDir $relative
  $dstDir = Split-Path -Parent $dst
  if (-not (Test-Path -LiteralPath $dstDir)) {
    New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
  }
  Copy-Item -LiteralPath $src -Destination $dst -Force
}

$manifestPath = Join-Path $packDir "FILE_MANIFEST.txt"
$manifest = @(
  "Claude UI Strict Pack - 2026-04-01",
  "Root: C:\Users\tocho\suneung",
  ""
)
$manifest += $files
if ($missing.Count -gt 0) {
  $manifest += ""
  $manifest += "Missing files:"
  $manifest += $missing
}
$manifest | Set-Content -LiteralPath $manifestPath -Encoding UTF8

Compress-Archive -Path (Join-Path $packDir "*") -DestinationPath $zipPath -Force

Write-Output "Pack directory: $packDir"
Write-Output "Zip file: $zipPath"
if ($missing.Count -gt 0) {
  Write-Output "Missing count: $($missing.Count)"
}
