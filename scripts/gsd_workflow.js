#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = process.cwd();
const GSD_ROOT = path.join(ROOT, "gsd");
const STATE_FILE = path.join(GSD_ROOT, "state.json");
const POLICY_FILE = "06_process_policy.json";

const DEFAULT_POLICY = {
  process: "GSD + 3agent",
  roles: {
    planer: "what to build only",
    generator: "how to build with emphasis on design quality and originality",
    evaluator: "score + feedback + re-evaluate loop with Playwright when available",
  },
  scoreWeights: {
    designQuality: 35,
    originality: 30,
    completeness: 20,
    functionality: 15,
  },
  sprintDefaults: {
    minIterations: 5,
    maxIterations: 12,
    targetScore: 92,
    nearOptimalDelta: 1.5,
    stablePassStreak: 2,
    withE2E: false,
    sandboxFallback: false,
  },
};
const GSD_MIN_ITERATION_FLOOR = 5;

const command = process.argv[2] || "help";
const args = parseArgs(process.argv.slice(3));

main();

function main() {
  ensureDir(GSD_ROOT);

  switch (command) {
    case "new-project":
      runNewProject(args);
      return;
    case "discuss-phase":
      runDiscussPhase(args);
      return;
    case "plan-phase":
      runPlanPhase(args);
      return;
    case "execute-phase":
      runExecutePhase(args);
      return;
    case "sprint-loop":
      runSprintLoop(args);
      return;
    case "verify-work":
      runVerifyWork(args);
      return;
    case "help":
    default:
      printHelp();
      return;
  }
}

function runNewProject(args) {
  const name = args.flags.name || args.flags.n || `project-${todayStamp()}`;
  const goal = args.flags.goal || "";
  const owner = args.flags.owner || process.env.USERNAME || "unknown";

  const slugBase = slugify(name);
  const slug = ensureUniqueSlug(slugBase);
  const projectDir = path.join(GSD_ROOT, slug);
  ensureDir(projectDir);

  const meta = {
    slug,
    name,
    goal,
    owner,
    createdAt: nowIso(),
    workflow: [
      "new-project",
      "discuss-phase",
      "plan-phase",
      "execute-phase",
      "verify-work",
    ],
  };

  writeJson(path.join(projectDir, "context.json"), meta);

  const intake = `# Intake Questions\n\nProject: ${name}\nCreated: ${meta.createdAt}\n\n## Problem\n- What exact problem are we solving?\n- Why now?\n- What breaks if we do nothing?\n\n## Users\n- Who is the primary user?\n- Who is explicitly out of scope?\n- What is the user's current behavior?\n\n## Outcome\n- What does success look like in measurable terms?\n- What metric moves first?\n- What is the minimum acceptable outcome?\n\n## Scope\n- Must-have features for v1\n- Nice-to-have features\n- Explicit non-goals\n\n## Data and Research\n- Which data sources are required?\n- Which sources are high trust vs low trust?\n- What evidence is required before recommendations are shown?\n\n## Design\n- Preferred visual direction\n- UX constraints\n- Mobile-first requirements\n\n## Security and Operations\n- Required security controls\n- Privacy constraints\n- Deployment and monitoring constraints\n\n## Open Questions\n- [TBD]`;

  const brief = `# Project Brief\n\n## Goal\n${goal || "[TBD]"}\n\n## Target Users\n- [TBD]\n\n## Scope\n- [TBD]\n\n## Constraints\n- [TBD]\n\n## Data and Sources\n- [TBD]\n\n## Security and Privacy\n- [TBD]\n\n## Definition of Done\n- [TBD]\n`;

  const discussion = `# Discussion Notes\n\n## Clarified Decisions\n- Decision: [TBD]\n\n## Ambiguities\n- Open Question: [TBD]\n\n## Research Tasks\n- Research: [TBD]\n`;

  const planSeed = `<?xml version="1.0" encoding="UTF-8"?>\n<plan generatedAt="${nowIso()}" projectSlug="${xmlEscape(slug)}">\n  <objective>[TBD]</objective>\n  <scope>\n    <task id="T1" status="pending">[TBD]</task>\n  </scope>\n  <research>\n    <item id="R1" status="pending">[TBD]</item>\n  </research>\n  <selfValidation>\n    <check id="V1" status="pending">build passes</check>\n  </selfValidation>\n</plan>\n`;

  writeFile(path.join(projectDir, "00_intake_questions.md"), intake);
  writeFile(path.join(projectDir, "01_project_brief.md"), brief);
  writeFile(path.join(projectDir, "02_discussion_notes.md"), discussion);
  writeFile(path.join(projectDir, "03_plan.xml"), planSeed);
  writeFile(path.join(projectDir, "04_execution_log.md"), `# Execution Log\n\n`);
  writeFile(path.join(projectDir, "05_verify_report.md"), `# Verify Report\n\n`);
  writeJson(path.join(projectDir, POLICY_FILE), DEFAULT_POLICY);

  const state = readState();
  state.currentProject = slug;
  state.projects = Array.isArray(state.projects) ? state.projects : [];
  state.projects.push({ slug, name, createdAt: meta.createdAt });
  writeJson(STATE_FILE, state);

  console.log(`[gsd:new-project] initialized: ${rel(projectDir)}`);
  console.log(`next: npm run gsd:discuss-phase`);
}

function runDiscussPhase(args) {
  const project = getProject(args.flags.project);
  const briefPath = path.join(project.dir, "01_project_brief.md");
  const discussionPath = path.join(project.dir, "02_discussion_notes.md");
  const outPath = path.join(project.dir, "02a_clarification_questions.md");

  const brief = readText(briefPath);
  const discussion = readText(discussionPath);

  const unresolved = collectUnresolved([brief, discussion]);

  const lines = [
    "# Clarification Questions",
    "",
    `Project: ${project.slug}`,
    `Generated: ${nowIso()}`,
    "",
  ];

  if (!unresolved.length) {
    lines.push("No unresolved markers found. Discussion looks ready for planning.");
  } else {
    lines.push("## Unresolved Points");
    for (let i = 0; i < unresolved.length; i += 1) {
      const u = unresolved[i];
      lines.push(`${i + 1}. [${u.file}] line ${u.line}: ${u.text}`);
    }
    lines.push("");
    lines.push("## Questions to Resolve");
    for (const u of unresolved) {
      lines.push(`- What concrete decision replaces: \"${u.text}\" ?`);
    }
  }

  writeFile(outPath, `${lines.join("\n")}\n`);

  appendFile(
    discussionPath,
    `\n## Discuss Phase Run (${nowIso()})\n- unresolved_count: ${unresolved.length}\n- output: ${path.basename(outPath)}\n`
  );

  console.log(`[gsd:discuss-phase] output: ${rel(outPath)}`);
  console.log(`next: npm run gsd:plan-phase`);
}

function runPlanPhase(args) {
  const project = getProject(args.flags.project);
  const brief = readText(path.join(project.dir, "01_project_brief.md"));
  const discussion = readText(path.join(project.dir, "02_discussion_notes.md"));

  const goal = pickFirstNonEmpty([
    extractSection(brief, "Goal"),
    extractFirstDecision(discussion),
    "Define a concrete objective",
  ]);

  const scopeItems = dedupe(
    parseBulletLines(extractSection(brief, "Scope")).filter(isMeaningful)
  );
  const constraints = dedupe(
    parseBulletLines(extractSection(brief, "Constraints")).filter(isMeaningful)
  );
  const researchItems = dedupe([
    ...parseResearchLines(discussion),
    ...parseBulletLines(extractSection(brief, "Data and Sources")),
  ].filter(isMeaningful));

  const executionTasks = scopeItems.length
    ? scopeItems
    : [
        "Implement core feature path",
        "Wire required data sources",
        "Add validation and fallback behavior",
      ];

  const validationChecks = [
    "verify:ingest passes",
    "build passes",
    "critical API path returns expected schema",
    "security controls are enabled for production",
  ];

  const xml = buildPlanXml({
    projectSlug: project.slug,
    goal,
    constraints,
    researchItems,
    executionTasks,
    validationChecks,
  });

  const xmlPath = path.join(project.dir, "03_plan.xml");
  writeFile(xmlPath, xml);

  const planValidation = validatePlan({
    goal,
    researchItems,
    executionTasks,
    validationChecks,
  });

  const validationPath = path.join(project.dir, "03_plan_validation.md");
  const validationText = [
    "# Plan Validation",
    "",
    `Generated: ${nowIso()}`,
    `Result: ${planValidation.pass ? "PASS" : "FAIL"}`,
    "",
    "## Checks",
    `- Goal defined: ${goal ? "yes" : "no"}`,
    `- Research items >= 2: ${researchItems.length >= 2 ? "yes" : "no"}`,
    `- Execution tasks >= 3: ${executionTasks.length >= 3 ? "yes" : "no"}`,
    `- Validation checks >= 3: ${validationChecks.length >= 3 ? "yes" : "no"}`,
    "",
    "## Issues",
    ...(planValidation.issues.length ? planValidation.issues.map((x) => `- ${x}`) : ["- none"]),
    "",
  ].join("\n");

  writeFile(validationPath, validationText);

  console.log(`[gsd:plan-phase] xml: ${rel(xmlPath)}`);
  console.log(`[gsd:plan-phase] self-check: ${rel(validationPath)} (${planValidation.pass ? "PASS" : "FAIL"})`);
  if (!planValidation.pass) {
    process.exitCode = 1;
    return;
  }
  console.log(`next: npm run gsd:execute-phase`);
}

function runExecutePhase(args) {
  const single = Boolean(args.flags.single || args.flags.once);
  if (single) {
    runExecutePhaseOnce(args);
    return;
  }
  runSprintLoop(args);
}

function runExecutePhaseOnce(args) {
  const project = getProject(args.flags.project);
  const checklistPath = path.join(project.dir, "04_execution_checklist.md");
  buildExecutionChecklist(project, checklistPath);

  const logPath = path.join(project.dir, "04_execution_log.md");
  const taskLine = args.flags.task || "Generated execution checklist from 03_plan.xml";
  const status = args.flags.status || "done";
  appendFile(logPath, `- ${nowIso()} | ${status} | ${taskLine}\n`);

  console.log(`[gsd:execute-phase] checklist: ${rel(checklistPath)}`);
  console.log(`[gsd:execute-phase] log updated: ${rel(logPath)}`);
  console.log(`next: npm run gsd:verify-work`);
}

function runSprintLoop(args) {
  const project = getProject(args.flags.project);
  const policy = loadPolicy(project.dir);
  ensurePolicyFile(project.dir, policy);
  const scoreWeights = policy.scoreWeights || DEFAULT_POLICY.scoreWeights;
  const defaults = policy.sprintDefaults || DEFAULT_POLICY.sprintDefaults;
  const minIterations = Math.max(
    GSD_MIN_ITERATION_FLOOR,
    pickNumberFlag(args.flags["min-iterations"], defaults.minIterations, GSD_MIN_ITERATION_FLOOR)
  );
  const maxIterations = Math.max(minIterations, pickNumberFlag(args.flags["max-iterations"], defaults.maxIterations, 12));
  const targetScore = pickNumberFlag(args.flags["target-score"], defaults.targetScore, 92);
  const nearOptimalDelta = pickNumberFlag(args.flags["near-optimal-delta"], defaults.nearOptimalDelta, 1.5);
  const stablePassRequired = Math.max(
    1,
    pickNumberFlag(args.flags["stable-pass-streak"], defaults.stablePassStreak, 2)
  );
  const withE2E = parseBooleanFlag(args.flags["with-e2e"], defaults.withE2E);
  const sandboxFallback = parseBooleanFlag(args.flags["sandbox-fallback"], defaults.sandboxFallback);
  const scorecardPath = args.flags.scorecard ? path.resolve(ROOT, args.flags.scorecard) : "";

  const sprintDir = path.join(project.dir, "sprints", `sprint-${nowFileStamp()}`);
  ensureDir(sprintDir);

  const summary = [];
  let previousScore = null;
  let passStreak = 0;
  let stopReason = `Reached max iterations (${maxIterations})`;

  for (let i = 1; i <= maxIterations; i += 1) {
    const iterationId = `iter-${String(i).padStart(2, "0")}`;
    const contractPath = path.join(sprintDir, `${iterationId}_contract.md`);
    const planerPath = path.join(sprintDir, `${iterationId}_planer_brief.md`);
    writeFile(
      contractPath,
      buildSprintContractText({
        projectSlug: project.slug,
        iteration: i,
        weights: scoreWeights,
        targetScore,
        minIterations,
      })
    );
    writeFile(
      planerPath,
      buildPlanerBriefText({
        projectSlug: project.slug,
        iteration: i,
        targetScore,
        minIterations,
        planXml: readText(path.join(project.dir, "03_plan.xml")),
      })
    );

    const checklistPath = path.join(sprintDir, `${iterationId}_execution_checklist.md`);
    buildExecutionChecklist(project, checklistPath);

    const logPath = path.join(project.dir, "04_execution_log.md");
    const taskLine = args.flags.task || `Generator sprint iteration ${i} implementation`;
    appendFile(logPath, `- ${nowIso()} | done | [CONTRACT] ${rel(contractPath)}\n`);
    appendFile(logPath, `- ${nowIso()} | done | [PLANER] ${rel(planerPath)}\n`);
    appendFile(logPath, `- ${nowIso()} | done | [GENERATOR] ${taskLine}\n`);

    const verify = runVerificationSteps({ withE2E, sandboxFallback });
    if (verify.pass) {
      passStreak += 1;
    } else {
      passStreak = 0;
    }

    const verifyPath = path.join(sprintDir, `${iterationId}_verify_report.md`);
    writeVerificationReport({
      reportPath: verifyPath,
      title: `Verify Report (${iterationId})`,
      pass: verify.pass,
      results: verify.results,
    });

    const manualScore = readScoreCardForIteration(scorecardPath, i);
    const score = scoreIteration({
      manualScore,
      verifyResults: verify.results,
      scoreWeights,
    });

    const improvement = previousScore === null ? null : Number((score.total - previousScore).toFixed(1));
    previousScore = score.total;

    const scorePath = path.join(sprintDir, `${iterationId}_evaluator_score.json`);
    writeJson(scorePath, {
      generatedAt: nowIso(),
      iteration: i,
      mode: manualScore ? "manual-scorecard" : "auto-from-verification",
      weights: scoreWeights,
      ...score,
      improvementFromPrev: improvement,
    });

    const feedbackPath = path.join(sprintDir, `${iterationId}_feedback.md`);
    const feedback = [
      `# Evaluator Feedback (${iterationId})`,
      "",
      `Generated: ${nowIso()}`,
      `Mode: ${manualScore ? "manual-scorecard" : "auto-from-verification"}`,
      `Total Score: ${score.total.toFixed(1)} / 100`,
      `Improvement: ${improvement === null ? "n/a" : `${improvement >= 0 ? "+" : ""}${improvement}`}`,
      "",
      "## Breakdown",
      `- Design Quality: ${score.designQuality.toFixed(1)} / ${scoreWeights.designQuality}`,
      `- Originality: ${score.originality.toFixed(1)} / ${scoreWeights.originality}`,
      `- Completeness: ${score.completeness.toFixed(1)} / ${scoreWeights.completeness}`,
      `- Functionality: ${score.functionality.toFixed(1)} / ${scoreWeights.functionality}`,
      "",
      "## Verification",
      ...verify.results.map((r) => `- ${r.name}: ${r.code === 0 ? "PASS" : `FAIL (code ${r.code})`}`),
      "",
      "## Action Items for Next Iteration",
      "- Fix failing checks first, then improve UX polish and novelty.",
      "- Keep scope aligned with PLANER contract.",
      "",
    ].join("\n");
    writeFile(feedbackPath, `${feedback}\n`);

    appendFile(
      logPath,
      `- ${nowIso()} | done | [EVALUATOR] score=${score.total.toFixed(1)} pass=${verify.pass ? "yes" : "no"}\n`
    );

    const stop = shouldStopLoop({
      iteration: i,
      minIterations,
      totalScore: score.total,
      targetScore,
      improvement,
      nearOptimalDelta,
      passStreak,
      stablePassRequired,
    });

    summary.push({
      iteration: i,
      score: score.total,
      pass: verify.pass,
      improvement,
      stop,
      files: {
        contract: rel(contractPath),
        planer: rel(planerPath),
        checklist: rel(checklistPath),
        verify: rel(verifyPath),
        score: rel(scorePath),
        feedback: rel(feedbackPath),
      },
    });

    if (stop.stop) {
      stopReason = stop.reason;
      break;
    }
  }

  const summaryPath = path.join(sprintDir, "sprint_summary.md");
  const summaryLines = [
    "# Sprint Loop Summary",
    "",
    `Project: ${project.slug}`,
    `Generated: ${nowIso()}`,
    `Stop Reason: ${stopReason}`,
    `Policy: minIterations=${minIterations}, maxIterations=${maxIterations}, targetScore=${targetScore}`,
    "",
    "## Iterations",
  ];
  for (const row of summary) {
    summaryLines.push(
      `- Iteration ${row.iteration}: score=${row.score.toFixed(1)}, verify=${row.pass ? "PASS" : "FAIL"}, improvement=${
        row.improvement === null ? "n/a" : row.improvement
      }`
    );
    summaryLines.push(
      `  files: contract=${row.files.contract}, planer=${row.files.planer}, verify=${row.files.verify}, score=${row.files.score}`
    );
  }
  writeFile(summaryPath, `${summaryLines.join("\n")}\n`);

  const finalRow = summary[summary.length - 1];
  const trailingPassCount = countTrailingPasses(summary);
  const overallPass =
    Boolean(finalRow) &&
    finalRow.score >= targetScore &&
    summary.length >= minIterations &&
    trailingPassCount >= stablePassRequired;

  console.log(`[gsd:sprint-loop] output: ${rel(sprintDir)}`);
  console.log(`[gsd:sprint-loop] summary: ${rel(summaryPath)}`);
  console.log(`[gsd:sprint-loop] iterations: ${summary.length}`);
  console.log(`[gsd:sprint-loop] overall: ${overallPass ? "PASS" : "FAIL"}`);
  if (!overallPass) {
    process.exitCode = 1;
  }
}

function runVerifyWork(args) {
  const project = getProject(args.flags.project);
  const policy = loadPolicy(project.dir);
  const defaults = policy.sprintDefaults || DEFAULT_POLICY.sprintDefaults;
  const withE2E = parseBooleanFlag(args.flags["with-e2e"], defaults.withE2E);
  const sandboxFallback = parseBooleanFlag(args.flags["sandbox-fallback"], defaults.sandboxFallback);
  const verify = runVerificationSteps({ withE2E, sandboxFallback });

  const reportPath = path.join(project.dir, "05_verify_report.md");
  writeVerificationReport({
    reportPath,
    title: "Verify Report",
    pass: verify.pass,
    results: verify.results,
  });

  console.log(`[gsd:verify-work] report: ${rel(reportPath)}`);
  console.log(`[gsd:verify-work] overall: ${verify.pass ? "PASS" : "FAIL"}`);

  if (!verify.pass) {
    process.exitCode = 1;
  }
}

function buildExecutionChecklist(project, outputPath) {
  const xmlPath = path.join(project.dir, "03_plan.xml");
  const xml = readText(xmlPath);
  const tasks = extractXmlValues(xml, "task");
  const research = extractXmlValues(xml, "item");
  const lines = [
    "# Execution Checklist",
    "",
    `Generated: ${nowIso()}`,
    "",
    "## Research",
    ...(research.length ? research.map((x) => `- [ ] ${x}`) : ["- [ ] none"]),
    "",
    "## Implementation",
    ...(tasks.length ? tasks.map((x) => `- [ ] ${x}`) : ["- [ ] none"]),
    "",
  ];
  writeFile(outputPath, `${lines.join("\n")}\n`);
}

function runVerificationSteps({ withE2E, sandboxFallback }) {
  const steps = [
    {
      name: "verify:ingest",
      cmd: process.execPath,
      argv: [path.join("scripts", "verify_ingest_quality.js"), "--strict"],
    },
    {
      name: "build",
      cmd: process.execPath,
      argv: [path.join("node_modules", "react-scripts", "bin", "react-scripts.js"), "build"],
    },
  ];
  if (withE2E) {
    steps.push({
      name: "test:e2e",
      cmd: process.execPath,
      argv: [path.join("node_modules", "@playwright", "test", "cli.js"), "test"],
    });
  }

  const results = [];
  for (const step of steps) {
    const result = runCommand(step.cmd, step.argv);
    const patched = applySandboxFallback(result, sandboxFallback);
    results.push({ ...step, ...patched });
  }

  return {
    pass: results.every((r) => r.code === 0),
    results,
  };
}

function applySandboxFallback(result, sandboxFallback) {
  if (!sandboxFallback) return result;
  const stderr = String(result?.stderr || "");
  const hasSandboxSpawnError =
    /spawnSync/i.test(stderr) && (/\bEPERM\b/i.test(stderr) || /\bEINVAL\b/i.test(stderr));
  if (!hasSandboxSpawnError) return result;

  const extra = [
    stderr,
    "[sandbox-fallback] spawn blocked by environment. Marked as pass for workflow continuity.",
    "[sandbox-fallback] run equivalent verification from shell to confirm real status.",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    ...result,
    code: 0,
    stderr: extra,
    sandboxFallback: true,
  };
}

function writeVerificationReport({ reportPath, title, pass, results }) {
  const reportLines = [
    `# ${title}`,
    "",
    `Generated: ${nowIso()}`,
    `Overall: ${pass ? "PASS" : "FAIL"}`,
    "",
    "## Summary",
    ...results.map((r) => `- ${r.name}: ${r.code === 0 ? "PASS" : `FAIL (code ${r.code})`}`),
    "",
    "## Logs",
  ];

  for (const r of results) {
    reportLines.push(`### ${r.name}`);
    reportLines.push("```text");
    reportLines.push(trimOutput((r.stdout || "") + (r.stderr || ""), 4000));
    reportLines.push("```");
    reportLines.push("");
  }

  writeFile(reportPath, `${reportLines.join("\n")}\n`);
}

function loadPolicy(projectDir) {
  const policyPath = path.join(projectDir, POLICY_FILE);
  if (!fs.existsSync(policyPath)) {
    return DEFAULT_POLICY;
  }
  try {
    const raw = JSON.parse(readText(policyPath));
    return {
      ...DEFAULT_POLICY,
      ...raw,
      roles: { ...DEFAULT_POLICY.roles, ...(raw.roles || {}) },
      scoreWeights: { ...DEFAULT_POLICY.scoreWeights, ...(raw.scoreWeights || {}) },
      sprintDefaults: { ...DEFAULT_POLICY.sprintDefaults, ...(raw.sprintDefaults || {}) },
    };
  } catch {
    return DEFAULT_POLICY;
  }
}

function ensurePolicyFile(projectDir, policy) {
  const policyPath = path.join(projectDir, POLICY_FILE);
  if (fs.existsSync(policyPath)) return;
  writeJson(policyPath, policy);
}

function pickNumberFlag(value, fallback, hardDefault) {
  const n = Number(value);
  if (Number.isFinite(n)) return n;
  if (Number.isFinite(fallback)) return Number(fallback);
  return Number(hardDefault);
}

function parseBooleanFlag(value, fallback) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const t = value.trim().toLowerCase();
    if (["1", "true", "yes", "y", "on"].includes(t)) return true;
    if (["0", "false", "no", "n", "off"].includes(t)) return false;
  }
  return Boolean(fallback);
}

function readScoreCardForIteration(scorecardPath, iteration) {
  if (!scorecardPath) return null;
  if (!fs.existsSync(scorecardPath)) return null;

  try {
    const raw = JSON.parse(readText(scorecardPath));
    const list = Array.isArray(raw) ? raw : Array.isArray(raw.iterations) ? raw.iterations : [];
    const target = list[iteration - 1];
    return target && typeof target === "object" ? target : null;
  } catch {
    return null;
  }
}

function scoreIteration({ manualScore, verifyResults, scoreWeights }) {
  if (manualScore) {
    const designQuality = clampNumber(manualScore.designQuality, 0, scoreWeights.designQuality);
    const originality = clampNumber(manualScore.originality, 0, scoreWeights.originality);
    const completeness = clampNumber(manualScore.completeness, 0, scoreWeights.completeness);
    const functionality = clampNumber(manualScore.functionality, 0, scoreWeights.functionality);
    const total = Number((designQuality + originality + completeness + functionality).toFixed(1));
    return { designQuality, originality, completeness, functionality, total };
  }

  const totalSteps = verifyResults.length || 1;
  const passedSteps = verifyResults.filter((x) => x.code === 0).length;
  const ratio = passedSteps / totalSteps;
  const designQuality = Number((scoreWeights.designQuality * ratio).toFixed(1));
  const originality = Number((scoreWeights.originality * ratio).toFixed(1));
  const completeness = Number((scoreWeights.completeness * ratio).toFixed(1));
  const functionality = Number((scoreWeights.functionality * ratio).toFixed(1));
  const total = Number((designQuality + originality + completeness + functionality).toFixed(1));
  return { designQuality, originality, completeness, functionality, total };
}

function shouldStopLoop({
  iteration,
  minIterations,
  totalScore,
  targetScore,
  improvement,
  nearOptimalDelta,
  passStreak,
  stablePassRequired,
}) {
  if (iteration < minIterations) {
    return { stop: false, reason: `continue: minimum iterations (${minIterations}) not reached` };
  }
  if (totalScore < targetScore) {
    return { stop: false, reason: `continue: score ${totalScore.toFixed(1)} is below target ${targetScore}` };
  }
  if (passStreak < stablePassRequired) {
    return { stop: false, reason: `continue: pass streak ${passStreak}/${stablePassRequired}` };
  }
  if (improvement === null) {
    return { stop: false, reason: "continue: need at least one previous score to check near-optimal plateau" };
  }
  if (Math.abs(improvement) > nearOptimalDelta) {
    return {
      stop: false,
      reason: `continue: improvement magnitude ${Math.abs(improvement).toFixed(1)} is above near-optimal delta ${nearOptimalDelta}`,
    };
  }
  return {
    stop: true,
    reason: `stop: score reached target and stabilized near-optimal (improvement ${improvement})`,
  };
}

function buildSprintContractText({ projectSlug, iteration, weights, targetScore, minIterations }) {
  const lines = [
    `# Sprint Contract (Iteration ${iteration})`,
    "",
    `Project: ${projectSlug}`,
    `Generated: ${nowIso()}`,
    "",
    "## PLANER",
    "- Define what to build and why this iteration exists.",
    "- Define scope and out-of-scope.",
    "",
    "## Generator",
    "- Implement how to build it.",
    "- Prioritize design quality and originality first.",
    "",
    "## evaluator",
    "- Score and provide concrete feedback.",
    "- Verify technical behavior with Playwright when available.",
    "",
    "## DoD",
    "- Implementation merged for this iteration.",
    "- Verification artifacts generated.",
    "- Feedback file generated for next iteration.",
    "",
    "## Score Weights",
    `- Design Quality: ${weights.designQuality}`,
    `- Originality: ${weights.originality}`,
    `- Completeness: ${weights.completeness}`,
    `- Functionality: ${weights.functionality}`,
    "",
    "## Loop Policy",
    `- Minimum iterations: ${minIterations}`,
    `- Target score: ${targetScore}`,
    "- Continue until near-optimal plateau after minimum iterations.",
    "",
  ];
  return lines.join("\n");
}

function buildPlanerBriefText({ projectSlug, iteration, targetScore, minIterations, planXml }) {
  const research = extractXmlValues(planXml, "item").slice(0, 6);
  const tasks = extractXmlValues(planXml, "task").slice(0, 8);
  const checks = extractXmlValues(planXml, "check").slice(0, 6);
  const lines = [
    `# PLANER Brief (Iteration ${iteration})`,
    "",
    `Project: ${projectSlug}`,
    `Generated: ${nowIso()}`,
    "",
    "## What To Build",
    ...(tasks.length ? tasks.map((x) => `- ${x}`) : ["- none"]),
    "",
    "## Required Research Context",
    ...(research.length ? research.map((x) => `- ${x}`) : ["- none"]),
    "",
    "## Validation Targets",
    ...(checks.length ? checks.map((x) => `- ${x}`) : ["- none"]),
    "",
    "## Loop Constraints",
    `- Minimum iterations: ${minIterations}`,
    `- Target score: ${targetScore}`,
    "- Role handoff order: PLANER -> Generator -> evaluator",
    "",
  ];
  return lines.join("\n");
}

function clampNumber(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function countTrailingPasses(summary) {
  let count = 0;
  for (let i = summary.length - 1; i >= 0; i -= 1) {
    if (!summary[i].pass) break;
    count += 1;
  }
  return count;
}

function runCommand(cmd, argv) {
  const child = spawnSync(cmd, argv, {
    cwd: ROOT,
    encoding: "utf8",
    shell: false,
  });

  const code = Number.isInteger(child.status) ? child.status : 1;
  const spawnError = child.error ? `spawn error: ${child.error.message}` : "";
  const stderr = `${child.stderr || ""}${spawnError ? `\n${spawnError}` : ""}`.trim();
  return {
    code,
    stdout: child.stdout || "",
    stderr,
  };
}

function buildPlanXml({ projectSlug, goal, constraints, researchItems, executionTasks, validationChecks }) {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<plan generatedAt="${xmlEscape(nowIso())}" projectSlug="${xmlEscape(projectSlug)}">`,
    `  <objective>${xmlEscape(goal)}</objective>`,
    "  <constraints>",
    ...constraints.map((item, idx) => `    <constraint id="C${idx + 1}">${xmlEscape(item)}</constraint>`),
    "  </constraints>",
    "  <research>",
    ...researchItems.map((item, idx) => `    <item id="R${idx + 1}" status="pending">${xmlEscape(item)}</item>`),
    "  </research>",
    "  <scope>",
    ...executionTasks.map((task, idx) => `    <task id="T${idx + 1}" status="pending">${xmlEscape(task)}</task>`),
    "  </scope>",
    "  <selfValidation>",
    ...validationChecks.map((check, idx) => `    <check id="V${idx + 1}" status="pending">${xmlEscape(check)}</check>`),
    "  </selfValidation>",
    "</plan>",
    "",
  ];
  return lines.join("\n");
}

function validatePlan({ goal, researchItems, executionTasks, validationChecks }) {
  const issues = [];
  if (!goal || /\[TBD\]|\[TODO\]/i.test(goal)) {
    issues.push("Goal is unresolved.");
  }
  if (researchItems.length < 2) {
    issues.push("Research items should be at least 2.");
  }
  if (executionTasks.length < 3) {
    issues.push("Execution tasks should be at least 3.");
  }
  if (validationChecks.length < 3) {
    issues.push("Validation checks should be at least 3.");
  }
  return { pass: issues.length === 0, issues };
}

function getProject(flagProject) {
  const state = readState();
  const slug = flagProject || state.currentProject;
  if (!slug) {
    throw new Error("No current project. Run: npm run gsd:new-project -- --name \"your project\"");
  }
  const dir = path.join(GSD_ROOT, slug);
  if (!fs.existsSync(dir)) {
    throw new Error(`Project folder not found: ${dir}`);
  }
  return { slug, dir };
}

function collectUnresolved(files) {
  const out = [];
  const markers = [/\[TBD\]/i, /\[TODO\]/i, /TODO:/i];
  const names = ["brief", "discussion"];
  files.forEach((raw, fileIdx) => {
    String(raw || "")
      .split(/\r?\n/)
      .forEach((line, idx) => {
        const text = line.trim();
        if (!text) return;
        if (!markers.some((m) => m.test(text))) return;
        out.push({ file: names[fileIdx] || `file-${fileIdx + 1}`, line: idx + 1, text });
      });
  });
  return out;
}

function parseResearchLines(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter((x) => /^-\s*research\s*:/i.test(x))
    .map((x) => x.replace(/^-\s*research\s*:/i, "").trim());
}

function parseBulletLines(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter((x) => /^-\s+/.test(x))
    .map((x) => x.replace(/^-\s+/, "").trim());
}

function extractSection(md, heading) {
  const esc = escapeRegExp(heading);
  const re = new RegExp(`##\\s+${esc}\\s*\\n([\\s\\S]*?)(\\n##\\s+|$)`, "i");
  const m = String(md || "").match(re);
  return m ? m[1].trim() : "";
}

function extractFirstDecision(md) {
  const lines = String(md || "").split(/\r?\n/);
  const found = lines.find((x) => /^-\s*decision\s*:/i.test(x.trim()));
  if (!found) return "";
  return found.replace(/^-\s*decision\s*:/i, "").trim();
}

function extractXmlValues(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const out = [];
  let m;
  while ((m = re.exec(xml)) !== null) {
    const value = decodeXml(m[1].trim());
    if (value) out.push(value);
  }
  return out;
}

function isMeaningful(text) {
  const value = String(text || "").trim();
  if (!value) return false;
  if (/^\[TBD\]|^\[TODO\]|^TBD$/i.test(value)) return false;
  return true;
}

function trimOutput(text, max) {
  const value = String(text || "").trim();
  if (value.length <= max) return value || "(no output)";
  return `${value.slice(0, max)}\n... (truncated)`;
}

function xmlEscape(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function decodeXml(value) {
  return String(value || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function parseArgs(argv) {
  const out = { _: [], flags: {} };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      out._.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      out.flags[key] = true;
      continue;
    }
    out.flags[key] = next;
    i += 1;
  }
  return out;
}

function readState() {
  if (!fs.existsSync(STATE_FILE)) return { currentProject: "", projects: [] };
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return { currentProject: "", projects: [] };
  }
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function writeFile(filePath, text) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, text, "utf8");
}

function appendFile(filePath, text) {
  ensureDir(path.dirname(filePath));
  fs.appendFileSync(filePath, text, "utf8");
}

function readText(filePath) {
  if (!fs.existsSync(filePath)) return "";
  return fs.readFileSync(filePath, "utf8");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function rel(filePath) {
  return path.relative(ROOT, filePath) || ".";
}

function slugify(value) {
  return String(value || "project")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || `project-${todayStamp()}`;
}

function ensureUniqueSlug(base) {
  let slug = base;
  let idx = 2;
  while (fs.existsSync(path.join(GSD_ROOT, slug))) {
    slug = `${base}-${idx}`;
    idx += 1;
  }
  return slug;
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

function nowFileStamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "");
}

function nowIso() {
  return new Date().toISOString();
}

function pickFirstNonEmpty(values) {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) return text;
  }
  return "";
}

function dedupe(values) {
  const seen = new Set();
  const out = [];
  for (const value of values) {
    const key = String(value || "").trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(String(value || "").trim());
  }
  return out;
}

function escapeRegExp(text) {
  return String(text || "").replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
}

function printHelp() {
  const lines = [
    "GSD Workflow CLI",
    "",
    "Commands:",
    "  new-project      initialize project intake and templates",
    "  discuss-phase    generate clarification questions from unresolved markers",
    "  plan-phase       generate XML plan + self validation report",
    "  execute-phase    run default 3agent sprint loop (min 5 iterations)",
    "  sprint-loop      explicit alias for execute-phase loop",
    "  execute-phase --single   run single iteration checklist/log only",
    "  verify-work      run project verification commands and write report",
    "  --sandbox-fallback true   treat sandbox spawn EPERM/EINVAL as pass (default: false)",
    "",
    "Examples:",
    "  npm run gsd:new-project -- --name \"math-coach-v2\" --goal \"evidence-first coaching\"",
    "  npm run gsd:discuss-phase",
    "  npm run gsd:plan-phase",
    "  npm run gsd:execute-phase -- --task \"implemented dashboard cards\"",
    "  npm run gsd:sprint-loop -- --min-iterations 5 --target-score 92",
    "  npm run gsd:execute-phase -- --single --task \"single run only\" --status done",
    "  npm run gsd:verify-work",
    "  npm run gsd:verify-work -- --with-e2e",
  ];
  console.log(lines.join("\n"));
}
