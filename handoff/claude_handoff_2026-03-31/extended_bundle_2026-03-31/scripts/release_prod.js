#!/usr/bin/env node

const { spawnSync } = require("child_process");

function parseArgs(argv) {
  const options = {
    branch: "main",
    commitMessage: "",
    stageAll: false,
    skipVerify: false,
    skipE2E: false,
    skipPush: false,
    skipDeploy: false,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "-m" || arg === "--message") {
      options.commitMessage = String(next || "").trim();
      i += 1;
      continue;
    }
    if (arg === "-b" || arg === "--branch") {
      options.branch = String(next || "").trim() || "main";
      i += 1;
      continue;
    }
    if (arg === "--all") options.stageAll = true;
    else if (arg === "--skip-verify") options.skipVerify = true;
    else if (arg === "--skip-e2e") options.skipE2E = true;
    else if (arg === "--skip-push") options.skipPush = true;
    else if (arg === "--skip-deploy") options.skipDeploy = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "-h" || arg === "--help") options.help = true;
    else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function usage() {
  console.log(
    [
      "Usage:",
      "  node scripts/release_prod.js [options]",
      "",
      "Options:",
      "  -m, --message <text>   Commit message (optional)",
      "  -b, --branch <name>    Push target branch (default: main)",
      "  --all                  Stage all changes before release",
      "  --skip-verify          Skip strict data verification",
      "  --skip-e2e             Skip Playwright e2e",
      "  --skip-push            Skip git push",
      "  --skip-deploy          Skip Vercel production deploy",
      "  --dry-run              Print commands only",
      "  -h, --help             Show this help",
      "",
      "Examples:",
      "  npm run release:prod -- -m \"feat: ui polish\"",
      "  npm run release:prod:all -- -m \"chore: full release\"",
    ].join("\n")
  );
}

function commandToString(command, args) {
  return [command, ...args].join(" ");
}

function run(command, args, options = {}) {
  const { dryRun = false, allowFailure = false, env = process.env } = options;
  const rendered = commandToString(command, args);
  console.log(`\n$ ${rendered}`);

  if (dryRun) {
    return { status: 0, stdout: "", stderr: "" };
  }

  const result = spawnSync(command, args, {
    stdio: "inherit",
    env,
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }
  if (!allowFailure && result.status !== 0) {
    throw new Error(`Command failed (${result.status}): ${rendered}`);
  }
  return result;
}

function runCapture(command, args, options = {}) {
  const { dryRun = false, allowFailure = false } = options;
  const rendered = commandToString(command, args);
  console.log(`\n$ ${rendered}`);

  if (dryRun) {
    return { status: 0, stdout: "", stderr: "" };
  }

  const result = spawnSync(command, args, {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }
  if (!allowFailure && result.status !== 0) {
    throw new Error(
      `Command failed (${result.status}): ${rendered}\n${String(result.stderr || "").trim()}`
    );
  }
  return result;
}

function hasStagedChanges(dryRun) {
  const result = runCapture("git", ["diff", "--cached", "--quiet"], {
    dryRun,
    allowFailure: true,
  });
  return dryRun ? true : result.status === 1;
}

function runNpmScript(scriptName, dryRun) {
  if (process.platform === "win32") {
    return run("cmd", ["/c", `npm run ${scriptName}`], { dryRun });
  }
  return run("npm", ["run", scriptName], { dryRun });
}

function runVercelDeploy(dryRun) {
  if (process.platform === "win32") {
    return run("cmd", ["/c", "npx vercel --prod --yes"], { dryRun });
  }
  return run("npx", ["vercel", "--prod", "--yes"], { dryRun });
}

function defaultCommitMessage() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `chore: release ${y}-${m}-${d} ${hh}:${mm}`;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    usage();
    return;
  }

  const commitMessage = options.commitMessage || defaultCommitMessage();
  console.log("[release] start");
  console.log(`[release] branch=${options.branch}`);
  console.log(`[release] stageAll=${options.stageAll}`);
  console.log(`[release] skipVerify=${options.skipVerify}`);
  console.log(`[release] skipE2E=${options.skipE2E}`);
  console.log(`[release] skipPush=${options.skipPush}`);
  console.log(`[release] skipDeploy=${options.skipDeploy}`);
  console.log(`[release] dryRun=${options.dryRun}`);

  runCapture("git", ["rev-parse", "--is-inside-work-tree"], { dryRun: options.dryRun });

  if (options.stageAll) {
    run("git", ["add", "-A"], { dryRun: options.dryRun });
  }

  if (!hasStagedChanges(options.dryRun)) {
    throw new Error("No staged changes found. Stage files first or run with --all.");
  }

  if (!options.skipVerify) {
    run("node", ["scripts/verify_ingest_quality.js", "--strict"], { dryRun: options.dryRun });
    run("node", ["scripts/verify_recommendation_quality.js", "--strict"], {
      dryRun: options.dryRun,
    });
  }

  runNpmScript("build", options.dryRun);

  if (!options.skipE2E) {
    runNpmScript("test:e2e", options.dryRun);
  }

  run("git", ["commit", "-m", commitMessage], { dryRun: options.dryRun });

  if (!options.skipPush) {
    run("git", ["push", "origin", options.branch], { dryRun: options.dryRun });
  }

  if (!options.skipDeploy) {
    runVercelDeploy(options.dryRun);
  }

  console.log("\n[release] done");
}

try {
  main();
} catch (error) {
  console.error(`\n[release] failed: ${error.message}`);
  process.exit(1);
}
