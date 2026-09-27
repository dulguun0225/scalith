#!/usr/bin/env node
// Create a Java backend from dulguun0225/java-backend-template, deterministically, in one command.
//
//   node new-backend.mjs --package com.acme.someservice1 --name some_service_1 [--dir <path>] [--group com.acme]
//                        [--ref <sha|tag|branch>] [--standalone] [--skip-verify]
//
// This is the sequence the template's README lists as four commands, run as one, with the template pinned
// to a recorded commit instead of whatever `main` is today. Nothing here is a decision: the stack and every
// gate are fixed by the template, the rename is the template's own scripts/init.mjs, and the output for a
// given (ref, package, name) is byte-identical every time. An agent that is about to scaffold a Java backend
// runs this and then starts on domain code; anything it would write during scaffolding is the defect.
//
// Two shapes, matching the template's two modes:
//   vendored (default)  <dir>/ is a project root; the template lands in <dir>/backend/ by `git subtree add`
//                       and init.mjs lifts project-root/ (root CI, ruleset, compose, frontend stub, spec-kit
//                       constitution, project CLAUDE.md) one level up.
//   --standalone        <dir>/ is the service itself; the template's own .github/workflows/ci.yml is its CI.
//
// What it does not do, on purpose: create the forge repository, push, apply the branch ruleset, install the
// skills, run `specify init`. Each of those has side effects outside this directory and is printed as the
// next step. `--skip-verify` skips codegen and `mvn verify`, which need Docker and minutes; the commit it
// makes then records an unverified tree and says so.
//
// Node, standard library only, 22 or newer: the runtime `npx skills add` already needed to install this skill,
// so it runs the same on Linux, macOS and Windows. Needs git and mvn on PATH.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

const TEMPLATE_URL = process.env.TEMPLATE_URL || 'https://github.com/dulguun0225/java-backend-template.git';
// The pinned template commit. Move it deliberately, in a commit that says which gate change it brings in.
// Recorded 2026-09-26: "gates: any feature reads any table; only the owner writes it" on main.
// TableOwnershipTest no longer fails a feature that reads another feature's table; it fails a method that starts
// a write and names a table its feature does not own, proven on starterfixtures.ownership, and constitution
// Article VI says the same (ai-maintainer-principles *Count the independent wills*). Verified at this pin: a full
// vendored run of this script against a local clone (TEMPLATE_URL), mvn verify green, its own init: commit made.
// On top of "gates: strict request bodies — identifiers in the path only, one request type per
// operation", recorded 2026-09-25 on main. Every @RequestBody binds as BoundBody<T> through StrictJsonBodyConverter, which refuses
// undeclared members, members named after a path variable and wrong JSON types; RequestBodyContractTest,
// StrictBodyEndpointIT and the vacuum rule request-body-schemas-are-closed gate it, and constitution Article IV
// states it for the plan stage (java-backend-api *Request bodies*). Verified at this pin: a full vendored run of
// this script for package mn.netgroup.netcore.pintest, mvn verify green, its own init: commit made. On top of
// "docs: the project CLAUDE.md states the base branch in one line", recorded 2026-09-25. Both CLAUDE.md
// files gain the line `Base branch: \`main\``, beside the definition-of-done command, which build-feature reads
// from the repository root's CLAUDE.md; main is the trunk this script's `git init -b main` makes. No build input
// changed, so mvn verify was not re-run for this pin; verified by a --skip-verify vendored run of this script
// against a local clone (TEMPLATE_URL), whose root CLAUDE.md carried the line. On top of
// "init: the printed procedure formats after the rename, before the wall", recorded 2026-09-21.
// The template's init.mjs message and README procedure gain `mvn spotless:apply` between codegen and verify,
// matching step 5 below. Verified at this pin: a full run of this script for package mn.netgroup.netcore.fmttest,
// codegen, format and `mvn verify` green, its own init: commit made, 2026-09-21. On top of
// "constitution: Article VII reads "None", not "Add what this product decides"" on
// main, with "docs: /speckit.constitution is not a step; Article VII is an optional slot" under it. No gate
// changes: the scaffolded README, project CLAUDE.md and constitution stop listing /speckit.constitution as what
// follows the scaffold, and Article VII states that empty is complete instead of asking to be filled. Two
// projects scaffolded from the previous pin the same day carried the old wording, which is why the pin moves
// for a docs change. mvn verify was not re-run for this pin; the diff from 4a1c6fd touches no build input. On top of
// "gate: specs are written here, so provenance is not a layer the gate holds".
// A feature's spec.md is now written directly in the service repo by a domain expert with stock spec-kit and
// build work starts at /speckit-plan, so the upstream half of the traceability gate is gone: no
// specs/trace-upstreams.tsv, no specs/trace-upstream-dropped.tsv, no pinned copies under specs/upstream/, no
// scripts/refresh-upstream-snapshot.mjs. The gate keeps only the shape: a <QUALIFIER>/FR-nnn token whose
// qualifier is not a feature number is prose -- it resolves nothing, covers nothing and is not the bare id it
// wraps. The scaffolded CLAUDE.md says who owns spec.md. On top of
// "gates: a listed-but-absent build file carries no flags to find": `check-forbidden-flags.mjs` had the same
// latent shape as the traceability gate's own fix two commits below: it read every path `git ls-files` handed it unguarded, so a tracked build or deploy file this script's
// `init.mjs` removes before the first commit -- listed by the index, absent on disk -- died with an uncaught
// ENOENT instead of a verdict. Such a path is now skipped there too, and any other read error fails the gate
// naming the file. `squawk-changed-migrations.mjs` has the same shape of read but does not crash the same way
// (squawk-cli reads the files itself and a missing one is its own "Configuration error" exit); this template
// has no gate that owns refusing a deleted shipped migration, so it was left unguarded rather than made to
// silently skip a deletion nothing else here would catch. On top of
// "gates: a tracked file deleted from the working tree carries no citations", which fixes the traceability
// gate the same way on exactly the tree this script produces. On top of
// "gates: an upstream citation resolves against a pinned copy of its document", of which what survives is
// that every requirement of a feature that has a tasks.md is named by a task; on top of
// "gates: spec<->code traceability, with the canary that proves it" (a project
// scaffolded from this pin refuses a bare requirement id from its first commit), "scaffold: project-level
// .claude/settings.json pins worktree.baseRef=head" (an agent worktree starts from the session's HEAD, not
// main), #9 (guarded version update, ORDER BY id ban, table ownership, vacuum ruleset, migration lint
// additions) and #8 (Article VI names no package; CLAUDE.md holds the pointer).
const DEFAULT_REF = '9fff054b07f1000725f99b485233b0a1e03466f2';

const [major] = process.versions.node.split('.').map(Number);
if (major < 22) die(`node ${process.versions.node} is too old; this script needs 22 or newer`);

function die(message, status = 1) {
  console.error(message);
  process.exit(status);
}

const win = process.platform === 'win32';
const batchOnWindows = new Set(['mvn']); // a .cmd on Windows; Node refuses to spawn one without a shell
const quote = (a) => (win && /[\s"&|<>^()]/.test(a) ? `"${a.replaceAll('"', '\\"')}"` : a);
function spawn(cmd, args, opts) {
  const shell = win && batchOnWindows.has(cmd);
  const r = spawnSync(cmd, shell ? args.map(quote) : args, { shell, ...opts });
  if (r.error) throw r.error.code === 'ENOENT' ? new Error(`${cmd} not on PATH`) : r.error;
  return r;
}
/** Run with inherited stdio; a non-zero exit throws, like `set -e`. */
function run(cmd, args, opts = {}) {
  const r = spawn(cmd, args, { stdio: 'inherit', ...opts });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} exited ${r.status}`);
}
function capture(cmd, args, opts = {}) {
  const r = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8', ...opts });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} exited ${r.status}`);
  return r.stdout.trim();
}
const ok = (cmd, args, opts = {}) => spawn(cmd, args, { stdio: 'ignore', ...opts }).status === 0;

let opts;
try {
  ({ values: opts } = parseArgs({
    options: {
      package: { type: 'string' }, name: { type: 'string' }, dir: { type: 'string' }, group: { type: 'string' },
      ref: { type: 'string' }, standalone: { type: 'boolean' }, 'skip-verify': { type: 'boolean' }, help: { type: 'boolean', short: 'h' },
    },
  }));
} catch (e) {
  die(e.message, 2);
}
if (opts.help) {
  const header = fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 22);
  console.log(header.map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
  process.exit(0);
}
const pkg = opts.package ?? '';
const name = opts.name ?? '';
const group = opts.group ?? '';
const ref = opts.ref ?? DEFAULT_REF;
const mode = opts.standalone ? 'standalone' : 'vendored';
const verify = !opts['skip-verify'];
if (!/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/.test(pkg)) die('--package must be a lowercase dotted java package', 2);
if (!/^[a-z][a-z0-9_-]*$/.test(name)) die('--name must be lowercase letters, digits, hyphens or underscores', 2);
const dir = opts.dir || `./${name}`;
for (const tool of ['git', 'mvn']) if (!ok(tool, ['--version'])) die(`${tool} not on PATH`);
if (fs.existsSync(dir) && fs.readdirSync(dir).length > 0) die(`${dir} exists and is not empty`);

// 1. project root with one empty commit: `git subtree add` refuses a repository that has no HEAD.
// Until the template is in place there is nothing worth keeping, so a failure before then removes the
// directory this run created; after it, the tree is left for inspection and said so.
const madeDir = !fs.existsSync(dir);
fs.mkdirSync(dir, { recursive: true });
process.chdir(dir);
const absDir = fs.realpathSync(process.cwd());
let keep = false;
try {
  run('git', ['init', '-q', '-b', 'main']);
  run('git', ['commit', '-q', '--allow-empty', '-m', 'init: empty root']);

  // 2. fetch the template and resolve the ref to a commit, so the record says exactly what was instantiated.
  let sha;
  if (/^[0-9a-f]{40}$/.test(ref)) {
    // A bare sha is not fetchable by name from every server; fetch main and require the sha to be reachable.
    run('git', ['fetch', '-q', '--no-tags', TEMPLATE_URL, 'main']);
    if (!ok('git', ['cat-file', '-e', `${ref}^{commit}`])) throw new Error(`template commit ${ref} is not reachable from main of ${TEMPLATE_URL}`);
    sha = ref;
  } else {
    run('git', ['fetch', '-q', '--no-tags', TEMPLATE_URL, ref]);
    sha = capture('git', ['rev-parse', 'FETCH_HEAD']);
  }
  const short = sha.slice(0, 12);

  // 3. instantiate.
  let service;
  if (mode === 'vendored') {
    run('git', ['subtree', 'add', '-q', '--prefix', 'backend', sha, '--squash', '-m', `vendor: java-backend-template ${short} into backend/`]);
    service = 'backend';
  } else {
    run('git', ['read-tree', '-u', '--reset', sha]);
    run('git', ['commit', '-q', '-m', `init: java-backend-template ${short}`]);
    service = '.';
  }

  keep = true;
  // 4. rename, and in vendored mode lift project-root/ to here. The template owns this script; it is not copied.
  run(process.execPath, [path.join('scripts', 'init.mjs'), '--package', pkg, '--name', name, ...(group ? ['--group', group] : [])], { cwd: service });

  // 5. regenerate jOOQ under the new package and run the wall. This is the template's definition of done.
  let verified = 'unverified: --skip-verify';
  if (verify) {
    run('mvn', ['-q', '-Pcodegen', 'generate-sources'], { cwd: service });
    // The rename changes where the project's own imports sort (a package after `java.` moves below it) and how
    // long lines wrap, so the renamed tree is not formatted until the formatter has run; without this,
    // spotless:check inside verify refused every scaffold whose package sorts after `java.`, 2026-09-21.
    run('mvn', ['-q', 'spotless:apply'], { cwd: service });
    run('mvn', ['-q', 'verify'], { cwd: service });
    verified = 'mvn verify green';
  }

  run('git', ['add', '-A']);
  run('git', ['commit', '-q', '-m', `init: ${name} from java-backend-template ${short} (${verified})`]);

  const next = [`gh repo create <org>/${name} --private --source=. --push`];
  if (mode === 'vendored') next.push('node scripts/apply-ruleset.mjs     # PR + backend + frontend checks required on main');
  next.push('npx skills add dulguun0225/skills -a claude-code -y     # the engineering-decision skills');
  next.push('npx skills add dulguun0225/scalith -a claude-code -y    # plan-feature, build-feature');
  // No /speckit.* line here: a printed step is read as owed, and at scaffold time Article VII has nothing to hold.
  if (mode === 'vendored') next.push('specify init --here               # optional; .specify/memory/constitution.md is pre-filled and survives it');
  if (!verify) next.push(`(cd ${service} && mvn -Pcodegen generate-sources && mvn spotless:apply && mvn verify)   # skipped above; run before the first push`);
  console.log(`created ${dir} (${mode}): package ${pkg}, artifact ${name}, template ${sha} — ${verified}`);
  console.log("next, each outside this directory's control and so not done here:");
  for (const n of next) console.log(`  ${n}`);
} catch (e) {
  process.chdir(path.dirname(absDir));
  if (keep) {
    console.error(`failed (${e.message}); ${absDir} left in place for inspection`);
  } else if (madeDir) {
    fs.rmSync(absDir, { recursive: true, force: true });
    console.error(`failed (${e.message}) before the template was in place; removed ${absDir}`);
  } else {
    fs.rmSync(path.join(absDir, '.git'), { recursive: true, force: true });
    console.error(`failed (${e.message}) before the template was in place; removed ${absDir}/.git`);
  }
  process.exit(1);
}
