#!/usr/bin/env node

const { spawnSync } = require("child_process");
const path = require("path");

const aliasMap = {
  "/gsd:new-project": "new-project",
  "/gsd:discuss-phase": "discuss-phase",
  "/gsd:plan-phase": "plan-phase",
  "/gsd:execute-phase": "execute-phase",
  "/gsd:sprint-loop": "sprint-loop",
  "/gsd-verify-work": "verify-work",
  "/gsd:verify-work": "verify-work",
};

const argv = process.argv.slice(2);
const raw = argv[0] || "help";
const mapped = aliasMap[raw] || raw;
const forward = [path.join("scripts", "gsd_workflow.js"), mapped, ...argv.slice(1)];

const isWin = process.platform === "win32";
const result = isWin
  ? spawnSync("node", forward, { stdio: "inherit", shell: false })
  : spawnSync("node", forward, { stdio: "inherit", shell: false });

if (result.error) {
  console.error(`[gsd] failed: ${result.error.message}`);
  process.exit(1);
}

process.exit(Number.isInteger(result.status) ? result.status : 1);
