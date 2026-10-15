#!/usr/bin/env node
// Writes skills/plan-feature/workflow.mjs from build-feature's script.
//
// plan-feature runs build-feature's script `until: "analyze"`. The Workflow tool
// shows a running script's `meta.name`, and `meta` must be a literal, so one file
// cannot show each skill's own name. plan-feature therefore ships a copy whose
// `name`, `description` and `whenToUse` are its own; every other line, `phases`
// included, is build-feature's.
//
//   node scripts/plan-feature-workflow.mjs           write the copy
//   node scripts/plan-feature-workflow.mjs --check   exit 1 when the committed copy
//                                                    differs from what this writes
//
// Exit 1 on any failure. The check fails the build; it is not advisory.

import { lstatSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SOURCE = join(ROOT, "skills", "build-feature", "workflow.mjs");
const TARGET = join(ROOT, "skills", "plan-feature", "workflow.mjs");
const REGENERATE = "npm run gen:plan-feature";

// plan-feature's values for the three `meta` keys it replaces.
const META = {
  name: "plan-feature",
  description:
    "Plan one spec-kit feature from a clarified spec with no human gate: preflight, plan, review, tasks, analyze; hand every question only the spec can answer to the domain expert in QUESTIONS.md",
  whenToUse:
    "When a feature directory holds the spec its domain expert wrote and clarified, and the project is a spec-kit project whose definition of done is one command",
};

const HEADER =
  `// Generated from skills/build-feature/workflow.mjs by \`${REGENERATE}\`; do not edit.\n` +
  `// Only the name, description and whenToUse in \`meta\` differ from that file.\n\n`;

function fail(message) {
  console.log(`FAIL ${message}`);
  process.exit(1);
}

function generate() {
  const source = readFileSync(SOURCE, "utf8");
  const start = source.indexOf("\nexport const meta = {\n");
  const end = start < 0 ? -1 : source.indexOf("\n}\n", start);
  if (start < 0 || end < 0) fail(`${SOURCE} has no \`export const meta = {\` block closed by a \`}\` line`);
  let block = source.slice(start, end);
  for (const [key, value] of Object.entries(META)) {
    if (/['\\]/.test(value)) fail(`plan-feature's ${key} holds a quote or backslash, which this script does not escape`);
    const line = new RegExp(`^  ${key}: '[^'\\\\]*',$`, "m");
    const matches = block.match(new RegExp(line.source, "gm")) ?? [];
    if (matches.length !== 1) fail(`build-feature's meta has ${matches.length} single-quoted \`${key}\` line(s); expected 1`);
    block = block.replace(line, () => `  ${key}: '${value}',`);
  }
  return HEADER + source.slice(0, start) + block + source.slice(end);
}

const expected = generate();

if (process.argv.includes("--check")) {
  let actual = null;
  try {
    if (!lstatSync(TARGET).isSymbolicLink()) actual = readFileSync(TARGET, "utf8");
  } catch {
    // missing: reported as stale below
  }
  if (actual !== expected) {
    fail(`skills/plan-feature/workflow.mjs differs from what build-feature's script generates; run \`${REGENERATE}\` and commit the result`);
  }
  console.log("plan-feature-workflow: skills/plan-feature/workflow.mjs matches build-feature's script.");
} else {
  try {
    if (lstatSync(TARGET).isSymbolicLink()) unlinkSync(TARGET);
  } catch {
    // missing: written below
  }
  writeFileSync(TARGET, expected);
  console.log("plan-feature-workflow: wrote skills/plan-feature/workflow.mjs.");
}
