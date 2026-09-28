#!/usr/bin/env node
// Set up a project created by /new-java-backend for scalith's pipeline (plan-feature, build-feature), in one command.
//
//   node init-pipeline.mjs [--dir <project root>] [--replace-constitution] [--amend]
//   node init-pipeline.mjs [--dir <project root>] --update
//
// Run from the project root (or name it with --dir). It copies every file under this skill's project/ directory
// into the project root where the target does not exist yet -- the spec-kit constitution, .claude/settings.json,
// the traceability gate with its self-test and fixtures, scripts/wall-checks.txt, which the backend wall reads --
// appends the pipeline section to the root CLAUDE.md once, and appends the missing .gitignore lines. Two existing
// files are merged instead of skipped: .claude/settings.json gets worktree.baseRef "head" when the key is
// missing, and scripts/wall-checks.txt gets the missing lines, the self-test before the gate. Any other existing
// file is never overwritten; each one skipped is printed. Running it again changes nothing.
//
// --replace-constitution replaces a .specify/memory/constitution.md that is not this skill's (spec-kit ran
// first); without it such a file is refused. The replaced file stays in git history.
// --amend prints the final commit as `git commit --amend --no-edit`, for a service created before the pipeline
// moved out of the template, whose template update, CLAUDE.md edit and this setup go in one unpushed commit. It is
// refused when HEAD is on a remote branch or on any local branch other than the one checked out.
// --update writes the files this skill owns and a project never edits -- scripts/check-traceability.mjs,
// scripts/check-traceability.selftest.mjs, and scripts/fixtures/traceability/ (replaced whole) -- whether or not
// each exists, and nothing else. It is refused where the gate was never installed: no gate file and no
// scripts/wall-checks.txt line naming it.
//
// Preconditions, all checked before anything is written: every file this skill installs is present under its
// project/ directory; the directory is a git repository's root with a clean tree; backend/scripts/wall.mjs
// exists (the template vendored into backend/, not a standalone service) and runs scripts/wall-checks.txt;
// backend/ holds no copy of the traceability gate the template carried before the split, and, on a first
// setup, backend/scripts/wall.mjs, backend/CLAUDE.md and backend/docs/GATES.md do not name it; the root
// CLAUDE.md exists, holds the base-branch line in its one form, naming a branch other than main, master or
// HEAD, holds the rule that a session runs `git pull --ff-only` before changing a file, and holds none of the
// pipeline text the template carried before the split; that branch is checked out; an existing
// .claude/settings.json is a JSON object.
//
// What it does not do, on purpose: run spec-kit, or commit. It prints the next step, which runs
// `specify init`, disables spec-kit's git extension when it is installed and enabled, and commits the result.
// That step is POSIX shell: on Windows, run it in Git Bash.
//
// Node, standard library only, 22 or newer: the runtime `npx skills add` already needed to install this skill.
// Needs git on PATH.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

const [major] = process.versions.node.split('.').map(Number);
if (major < 22) die(`node ${process.versions.node} is too old; this script needs 22 or newer`);

function die(message, status = 1) {
  console.error(message);
  process.exit(status);
}

// The files this skill installs, at the paths they take in the project.
const SOURCE = path.join(import.meta.dirname, '..', 'project');
// The CLAUDE.md section's source: appended to the root CLAUDE.md, never copied as a file.
const SECTION_FILE = 'CLAUDE.section.md';
// Lines the project's .gitignore must hold.
const GITIGNORE_LINES = ['.claude/worktrees/'];
// Merged into an existing file instead of skipped.
const SETTINGS = path.join('.claude', 'settings.json');
const WALL_CHECKS = path.join('scripts', 'wall-checks.txt');
const SELFTEST = 'scripts/check-traceability.selftest.mjs';
const GATE = 'scripts/check-traceability.mjs';
// What --update overwrites: files this skill owns and a project never edits. A directory is replaced whole.
const OWNED_FILES = [path.join('scripts', 'check-traceability.mjs'), path.join('scripts', 'check-traceability.selftest.mjs')];
const OWNED_DIRS = [path.join('scripts', 'fixtures', 'traceability')];
// Every file under project/ the install needs, and the directories that must hold at least one file. Checked
// before anything is written: an install tool that drops dot-directories would otherwise go unnoticed.
const CONSTITUTION = path.join('.specify', 'memory', 'constitution.md');
const EXPECTED_FILES = [SECTION_FILE, SETTINGS, CONSTITUTION, ...OWNED_FILES, WALL_CHECKS];
// The one form build-feature reads, and the wider shape it also catches so a near miss is refused, not skipped.
const BASE_LINE = /^Base branch: `([^`\s]+)`\s*$/;
const BASE_LINE_LIKE = /^\s*([-*+]\s+|\d+[.)]\s+)?[*_]*base branch[*_]*\s*[*_]*:/i;
// A heading of this skill's constitution: an existing constitution without it is some other one.
const CONSTITUTION_MARK = '## Article I. The platform is decided';
const TEMPLATE_URL = 'https://github.com/dulguun0225/java-backend-template.git';
// The pipeline text a root CLAUDE.md carried before the template and this skill were split, each paragraph found
// by a line only it holds. The section this skill appends repeats some of them and is left out of the search.
const OLD_PIPELINE_TEXT = [
  {
    marker: 'names the trunk, and `build-feature` reads it',
    what: 'the sentence "The line above names the trunk, and `build-feature` reads it as written, in that one form, unindented and once.": replace it with "The line above names the trunk, and tools read it as written, in that one form, unindented and once."',
  },
  {
    marker: 'feature branches are cut from',
    what: 'the sentence "The line above names the trunk: feature branches are cut from ... and merged back into it, and `build-feature` reads it as written, in that one form, unindented and once.": replace it with "The line above names the trunk, and tools read it as written, in that one form, unindented and once."',
  },
  {
    marker: 'so the session runs these steps without asking and says nothing about git to them',
    what: 'the paragraph "A Claude Code session a person runs in this project keeps `dev` current itself. The person may not know git, so the session runs these steps ..." and its numbered steps 1-3: keep its first sentence and replace the rest, steps included, with "The person may not know git, so without asking and without mentioning git to them, before changing a file the session updates `dev` from origin: `git pull --ff-only`."',
  },
  {
    marker: 'An agent of the `build-feature` or `plan-feature` workflow is not such a session',
    what: 'the paragraph "An agent of the `build-feature` or `plan-feature` workflow is not such a session: ...": remove it',
  },
  {
    marker: "A feature's spec is fixed once its build has started",
    what: 'the paragraph "A feature\'s spec is fixed once its build has started: ...": remove it',
  },
  {
    marker: "A feature's `spec.md` is written here and owned here",
    what: 'the bullet "- A feature\'s `spec.md` is written here and owned here: ...": remove it',
  },
  {
    marker: 'backend/scripts/check-traceability.mjs',
    what: 'the bullet "- `node backend/scripts/check-traceability.mjs` is the spec↔code gate ...": remove it',
  },
  {
    marker: '`.specify/memory/constitution.md` is pre-filled for spec-kit',
    what: 'the bullet "- `.specify/memory/constitution.md` is pre-filled for spec-kit. ...": remove it',
  },
  {
    marker: '`.claude/settings.json` pins `worktree.baseRef: head`',
    what: 'the bullet "- `.claude/settings.json` pins `worktree.baseRef: head`: ...": remove it',
  },
];
// The rule the appended section refers to ("keeps the base branch current as described above"). A root CLAUDE.md
// from a template before 31009fd lacks it; the paragraph to add is the current template's.
const PULL_RULE_MARK = 'git pull --ff-only';
// The traceability gate the template carried before the split, which a service that copies template changes by
// hand can keep after its wall runs scripts/wall-checks.txt: a second, stale copy of the gate this skill installs.
const OLD_GATE_PATHS = ['backend/scripts/check-traceability.mjs', 'backend/scripts/check-traceability.selftest.mjs', 'backend/scripts/fixtures/traceability/'];
// Template files that described that gate; the current template's text names it nowhere.
const OLD_GATE_DOCS = ['backend/scripts/wall.mjs', 'backend/CLAUDE.md', 'backend/docs/GATES.md'];
const OLD_GATE_MARK = 'check-traceability';
const pullRule = (base) =>
  `A Claude Code session a person runs in this project keeps \`${base}\` current itself. The person may not know git, so without asking and without mentioning git to them, before changing a file the session updates \`${base}\` from origin: \`git pull --ff-only\`.`;

function git(args, cwd) {
  const r = spawnSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
  if (r.error) throw r.error.code === 'ENOENT' ? new Error('git not on PATH') : r.error;
  return { status: r.status ?? 1, stdout: r.stdout.trimEnd(), stderr: r.stderr.trim() };
}

let opts;
try {
  ({ values: opts } = parseArgs({
    options: {
      dir: { type: 'string' },
      update: { type: 'boolean' },
      'replace-constitution': { type: 'boolean' },
      amend: { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
    },
  }));
} catch (e) {
  die(e.message, 2);
}
if (opts.help) {
  const text = fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n');
  const header = text.slice(1, text.findIndex((l) => l.startsWith('import ')));
  console.log(header.map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
  process.exit(0);
}
if (opts.update && (opts['replace-constitution'] || opts.amend)) die('--update takes neither --replace-constitution nor --amend', 2);
{
  const isFile = (rel) => fs.statSync(path.join(SOURCE, rel), { throwIfNoEntry: false })?.isFile() ?? false;
  const hasFile = (rel) => {
    const dir = path.join(SOURCE, rel);
    if (!(fs.statSync(dir, { throwIfNoEntry: false })?.isDirectory() ?? false)) return false;
    return fs.readdirSync(dir, { recursive: true }).some((f) => fs.statSync(path.join(dir, f)).isFile());
  };
  const missing = [...EXPECTED_FILES.filter((rel) => !isFile(rel)), ...OWNED_DIRS.filter((rel) => !hasFile(rel)).map((rel) => `${rel}${path.sep}`)];
  if (missing.length > 0) {
    die(`${SOURCE} is incomplete; nothing was written. Missing:\n${missing.map((rel) => `  ${rel.split(path.sep).join('/')}`).join('\n')}\nreinstall the skill`);
  }
}

// --- preconditions -------------------------------------------------------------------------------------------
let root;
try {
  root = fs.realpathSync(path.resolve(opts.dir ?? '.'));
} catch {
  die(`${opts.dir ?? '.'} does not exist`);
}
// --show-prefix is the path from the repository root to root, empty at the root itself. Git prints it, so no
// path spelling (drive letter case, short names, symlinks) is compared.
let where;
try {
  where = git(['rev-parse', '--is-inside-work-tree', '--show-prefix'], root);
} catch (e) {
  die(e.message);
}
const [inWorkTree, prefix = ''] = where.stdout.split(/\r?\n/);
if (where.status !== 0 || inWorkTree !== 'true') die(`${root} is not in a git working tree; run this from the project root /new-java-backend created`);
if (prefix.trim() !== '') die(`${root} is not the repository root (it is ${prefix.trim()} below it); run this from the project root`);
const status = git(['status', '--porcelain'], root);
if (status.status !== 0) die(`git status failed: ${status.stderr}`);
if (status.stdout !== '') die(`the working tree is not clean; commit or stash first:\n${status.stdout}`);
const wall = path.join(root, 'backend', 'scripts', 'wall.mjs');
if (!fs.existsSync(wall)) {
  die('backend/scripts/wall.mjs does not exist: the pipeline needs java-backend-template vendored into backend/, as /new-java-backend creates it; a standalone service is not supported');
}
const claudeMd = path.join(root, 'CLAUDE.md');
if (!fs.existsSync(claudeMd)) die('CLAUDE.md does not exist at the project root; /new-java-backend creates it');
const claudeText = fs.readFileSync(claudeMd, 'utf8');
const baseLines = claudeText.split(/\r?\n/).filter((l) => BASE_LINE_LIKE.test(l));
const baseNames = [...new Set(baseLines.map((l) => BASE_LINE.exec(l)?.[1]).filter(Boolean))];
if (baseLines.length === 0) die('CLAUDE.md holds no base-branch line; add one line, exactly: Base branch: `dev`');
if (baseLines.some((l) => !BASE_LINE.test(l)) || baseNames.length !== 1) {
  die(`CLAUDE.md holds base-branch lines build-feature cannot read:\n${baseLines.map((l) => `  ${l}`).join('\n')}\nkeep one line, unindented, exactly: Base branch: \`dev\``);
}
const base = baseNames[0];
if (['main', 'master', 'HEAD'].includes(base)) {
  die(`CLAUDE.md names ${base} as the base branch; build-feature refuses it: a service works on dev, and its main takes pull requests from dev only`);
}
const current = git(['symbolic-ref', '--short', '-q', 'HEAD'], root);
if (current.status !== 0) die(`HEAD is detached; check out ${base}, the branch CLAUDE.md names, and run this again`);
if (current.stdout !== base) die(`the current branch is ${current.stdout}, and CLAUDE.md names ${base} as the base branch; check out ${base} and run this again`);

// A service created before the split: its wall does not run the project's checks, or its CLAUDE.md still holds
// the pipeline text the template carried. Both are refused together, since the fix is one commit.
const section = fs.readFileSync(path.join(SOURCE, SECTION_FILE), 'utf8');
const heading = section.split(/\r?\n/).find((l) => l.startsWith('#'));
const claudeLines = claudeText.split(/\r?\n/);
const sectionAt = claudeLines.findIndex((l) => l.trimEnd() === heading);
const outsideSection =
  sectionAt < 0
    ? claudeLines
    : (() => {
        const level = heading.match(/^#+/)[0].length;
        const next = claudeLines.findIndex((l, i) => i > sectionAt && /^#+ /.test(l) && l.match(/^#+/)[0].length <= level);
        return [...claudeLines.slice(0, sectionAt), ...(next < 0 ? [] : claudeLines.slice(next))];
      })();
const flat = outsideSection.join(' ').replace(/\s+/g, ' ');
const oldText = OLD_PIPELINE_TEXT.filter(({ marker }) => flat.includes(marker));
const hasPullRule = flat.includes(PULL_RULE_MARK);
const claudeEdit = oldText.length > 0 || !hasPullRule;
const wallRunsChecks = fs.readFileSync(wall, 'utf8').includes('wall-checks.txt');
const oldGate = OLD_GATE_PATHS.filter((rel) => fs.existsSync(path.join(root, rel)));
// Checked on a first setup only: once set up, backend/docs/GATES.md may name the project's own gate.
const oldGateDocs = opts.update
  ? []
  : OLD_GATE_DOCS.filter((rel) => {
      const file = path.join(root, rel);
      return fs.existsSync(file) && fs.readFileSync(file, 'utf8').includes(OLD_GATE_MARK);
    });
const templateUpdate = !wallRunsChecks || oldGate.length > 0 || oldGateDocs.length > 0;
if (templateUpdate || claudeEdit) {
  const out = ['this service was created before the pipeline moved out of java-backend-template; nothing was written.'];
  let n = 0;
  if (!wallRunsChecks) {
    out.push(
      `${++n}. backend/scripts/wall.mjs does not run scripts/wall-checks.txt, so the gate this skill installs would never run. Bring backend/ up to the template first, one of two ways:`,
      `     git subtree pull --prefix backend ${TEMPLATE_URL} main --squash`,
      '   or, in a service that copies template changes by hand, copy the template\'s changes since the last commit it copied; at least the projectChecks() step in backend/scripts/wall.mjs, which replaces its two traceability steps, and the deletion of the old gate files.',
    );
  }
  if (oldGate.length > 0) {
    out.push(`${++n}. backend/ still holds the traceability gate the template used to carry, a second copy of the one this skill installs. Delete these, as the template has:`);
    for (const rel of oldGate) out.push(`     ${rel}`);
  }
  // A wall that does not run wall-checks.txt is item 1, which names its traceability steps.
  const docs = oldGateDocs.filter((rel) => wallRunsChecks || rel !== 'backend/scripts/wall.mjs');
  if (docs.length > 0) {
    out.push(`${++n}. These still describe that gate (they name ${OLD_GATE_MARK}). Remove what they say about it, as the template has:`);
    for (const rel of docs) out.push(`     ${rel}`);
  }
  if (oldText.length > 0) {
    out.push(`${++n}. CLAUDE.md holds the pipeline text the template used to carry, which the section this skill appends replaces:`);
    for (const { what } of oldText) out.push(`   - ${what}`);
  }
  if (!hasPullRule) {
    out.push(
      `${++n}. CLAUDE.md has no rule that a session brings \`${base}\` up to date before changing a file, which the section this skill appends refers to. Add this paragraph after the paragraph that follows the base-branch line:`,
      `     ${pullRule(base)}`,
    );
  }
  out.push(
    templateUpdate
      ? claudeEdit
        ? 'The template update, the CLAUDE.md edit and this skill\'s setup go in one commit, pushed only when complete: commit the template update and the CLAUDE.md edit together (after a subtree pull, fold the edit into its commit with `git commit --amend --no-edit --all`), push nothing, then run this again with --amend.'
        : 'The template update and this skill\'s setup go in one commit, pushed only when complete: commit the template update (a subtree pull commits it itself), push nothing, then run this again with --amend.'
      : 'The CLAUDE.md edit and this skill\'s setup go in one commit: commit the edit, push nothing, and run this again with --amend.',
  );
  die(out.join('\n'));
}

// --amend rewrites HEAD, so HEAD must be a commit no remote has and no other local branch holds: on a new
// project, main still points at the first commit, and amending it would leave the base and main apart.
if (opts.amend) {
  const remote = git(['for-each-ref', '--contains', 'HEAD', '--format=%(symref) %(refname:short)', 'refs/remotes'], root);
  if (remote.status !== 0) die(`git for-each-ref --contains HEAD failed: ${remote.stderr}`);
  const on = remote.stdout.split('\n').filter((l) => l.startsWith(' ')).map((l) => l.trim());
  if (on.length > 0) die(`--amend would rewrite HEAD, which is already on ${on.join(', ')}; run this without --amend`);
  const local = git(['for-each-ref', '--contains', 'HEAD', '--format=%(refname:short)', 'refs/heads'], root);
  if (local.status !== 0) die(`git for-each-ref --contains HEAD failed: ${local.stderr}`);
  const others = local.stdout.split('\n').map((l) => l.trim()).filter((l) => l !== '' && l !== base);
  if (others.length > 0) {
    die(`--amend would rewrite HEAD, which the local branch${others.length > 1 ? 'es' : ''} ${others.join(', ')} also hold${others.length > 1 ? '' : 's'}; ${others.length > 1 ? 'they' : 'it'} would keep the old commit. Run this without --amend`);
  }
}

const shown = (rel) => rel.split(path.sep).join('/');
/** A wall-checks.txt entry as the wall resolves it, so `./scripts/x` and `scripts/x` are one entry. */
const entryKey = (line) => path.posix.normalize(line.trim().replaceAll('\\', '/'));
const exists = (file) => {
  try {
    fs.lstatSync(file);
    return true;
  } catch {
    return false;
  }
};

let settings = null;
const settingsPath = path.join(root, SETTINGS);
if (!opts.update && exists(settingsPath)) {
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8').replace(/^\uFEFF/, ''));
  } catch (e) {
    die(`${SETTINGS.split(path.sep).join('/')} is not valid JSON (${e.message}); fix it and run this again`);
  }
  if (settings === null || typeof settings !== 'object' || Array.isArray(settings)) {
    die(`${SETTINGS.split(path.sep).join('/')} is not a JSON object; fix it and run this again`);
  }
}

const constitutionPath = path.join(root, CONSTITUTION);
const foreignConstitution =
  !opts.update && exists(constitutionPath) && !fs.readFileSync(constitutionPath, 'utf8').includes(CONSTITUTION_MARK);
if (foreignConstitution && !opts['replace-constitution']) {
  die(
    `${CONSTITUTION.split(path.sep).join('/')} is not this skill's constitution (no "${CONSTITUTION_MARK}"): spec-kit probably wrote it before this skill ran. ` +
      'Run this again with --replace-constitution; the file it replaces stays in git history. Nothing was written.',
  );
}
// --update restores a deleted owned file, so the gate counts as installed while wall-checks.txt still names it.
if (opts.update) {
  const checksPath = path.join(root, WALL_CHECKS);
  const listed =
    exists(checksPath) &&
    fs.readFileSync(checksPath, 'utf8').split(/\r?\n/).some((l) => !l.trim().startsWith('#') && entryKey(l) === GATE);
  if (!listed && !exists(path.join(root, GATE))) {
    die(`${GATE} does not exist and ${shown(WALL_CHECKS)} does not list it; --update refreshes an installed gate, so run this without --update first`);
  }
}

// --- install -------------------------------------------------------------------------------------------------
/** Every file under dir, as paths relative to it, sorted. */
function filesUnder(dir, prefix = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const rel = path.join(prefix, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(path.join(dir, entry.name), rel));
    else if (entry.isFile()) out.push(rel);
  }
  return out;
}

const written = [];
const skipped = [];
const warnings = [];
try {
  if (opts.update) {
    for (const rel of OWNED_FILES) {
      const target = path.join(root, rel);
      const fresh = fs.readFileSync(path.join(SOURCE, rel));
      if (exists(target) && fs.statSync(target).isFile() && fs.readFileSync(target).equals(fresh)) skipped.push(rel);
      else {
        fs.rmSync(target, { recursive: true, force: true });
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, fresh);
        written.push(rel);
      }
    }
    for (const rel of OWNED_DIRS) {
      const target = path.join(root, rel);
      const want = filesUnder(path.join(SOURCE, rel));
      const have = exists(target) && fs.statSync(target).isDirectory() ? filesUnder(target) : [];
      const same =
        want.length === have.length &&
        want.every((f, i) => f === have[i] && fs.readFileSync(path.join(SOURCE, rel, f)).equals(fs.readFileSync(path.join(target, f))));
      if (same) skipped.push(`${rel}${path.sep}`);
      else {
        fs.rmSync(target, { recursive: true, force: true });
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.cpSync(path.join(SOURCE, rel), target, { recursive: true });
        written.push(`${rel}${path.sep}`);
      }
    }
  } else {
    for (const rel of filesUnder(SOURCE).filter((rel) => rel !== SECTION_FILE && rel !== SETTINGS && rel !== WALL_CHECKS)) {
      const target = path.join(root, rel);
      if (rel === CONSTITUTION && foreignConstitution) {
        fs.copyFileSync(path.join(SOURCE, rel), target);
        written.push(`${rel} (replaced spec-kit's; the previous file is in git history)`);
        continue;
      }
      if (exists(target)) {
        skipped.push(rel);
        continue;
      }
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.join(SOURCE, rel), target, fs.constants.COPYFILE_EXCL);
      written.push(rel);
    }

    // .claude/settings.json: worktree.baseRef "head" is added when missing; another value is the project's.
    if (settings === null) {
      fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
      fs.copyFileSync(path.join(SOURCE, SETTINGS), settingsPath, fs.constants.COPYFILE_EXCL);
      written.push(SETTINGS);
    } else {
      const worktree = settings.worktree;
      if (worktree !== undefined && (worktree === null || typeof worktree !== 'object' || Array.isArray(worktree))) {
        warnings.push(`${shown(SETTINGS)}: "worktree" is not an object, so worktree.baseRef "head" was not added; left as it is`);
      } else if (worktree?.baseRef === undefined) {
        settings.worktree = { ...(worktree ?? {}), baseRef: 'head' };
        fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
        written.push(`${SETTINGS} key worktree.baseRef "head"`);
      } else if (worktree.baseRef === 'head') {
        skipped.push(`${SETTINGS} key worktree.baseRef "head"`);
      } else {
        warnings.push(
          `${shown(SETTINGS)} sets worktree.baseRef to ${JSON.stringify(worktree.baseRef)}, not "head"; left as it is. An agent run in an isolated worktree then does not start from the branch it was run on`,
        );
      }
    }

    // scripts/wall-checks.txt: the missing lines are added, the self-test before the gate.
    const checksPath = path.join(root, WALL_CHECKS);
    if (!exists(checksPath)) {
      fs.mkdirSync(path.dirname(checksPath), { recursive: true });
      fs.copyFileSync(path.join(SOURCE, WALL_CHECKS), checksPath, fs.constants.COPYFILE_EXCL);
      written.push(WALL_CHECKS);
    } else {
      const text = fs.readFileSync(checksPath, 'utf8');
      const eol = text.includes('\r\n') ? '\r\n' : '\n';
      const lines = text.split(/\r?\n/);
      if (lines.at(-1) === '') lines.pop();
      const at = (entry) => lines.findIndex((l) => !l.trim().startsWith('#') && entryKey(l) === entry);
      const added = [];
      if (at(SELFTEST) < 0) {
        const gateAt = at(GATE);
        if (gateAt < 0) lines.push(SELFTEST);
        else lines.splice(gateAt, 0, SELFTEST);
        added.push(SELFTEST);
      }
      if (at(GATE) < 0) {
        lines.push(GATE);
        added.push(GATE);
      }
      if (added.length > 0) {
        fs.writeFileSync(checksPath, lines.join(eol) + eol);
        for (const l of added) written.push(`${WALL_CHECKS} line ${l}`);
      }
      for (const l of [SELFTEST, GATE].filter((l) => !added.includes(l))) skipped.push(`${WALL_CHECKS} line ${l}`);
      if (at(SELFTEST) > at(GATE)) {
        warnings.push(`${shown(WALL_CHECKS)} lists ${GATE} before ${SELFTEST}; left as it is. The self-test belongs first: a gate that cannot fail proves nothing`);
      }
    }

    if (sectionAt >= 0) {
      skipped.push(`CLAUDE.md section "${heading}"`);
    } else {
      // A CRLF file gets the section in CRLF.
      const eol = claudeText.includes('\r\n') ? '\r\n' : '\n';
      const lf = claudeText.replaceAll('\r\n', '\n');
      const sep = lf.endsWith('\n\n') ? '' : lf.endsWith('\n') ? '\n' : '\n\n';
      fs.appendFileSync(claudeMd, (sep + section.replaceAll('\r\n', '\n')).replaceAll('\n', eol));
      written.push(`CLAUDE.md section "${heading}"`);
    }

    const gitignore = path.join(root, '.gitignore');
    const ignoreText = exists(gitignore) ? fs.readFileSync(gitignore, 'utf8') : '';
    const present = new Set(ignoreText.split(/\r?\n/).map((l) => l.trim()));
    const missing = GITIGNORE_LINES.filter((l) => !present.has(l));
    if (missing.length > 0) {
      const sep = ignoreText === '' || ignoreText.endsWith('\n') ? '' : '\n';
      fs.appendFileSync(gitignore, sep + missing.map((l) => `${l}\n`).join(''));
      for (const l of missing) written.push(`.gitignore line ${l}`);
    }
    for (const l of GITIGNORE_LINES.filter((l) => present.has(l))) skipped.push(`.gitignore line ${l}`);
  }
} catch (e) {
  console.error(`failed (${e.message}) after writing:`);
  for (const w of written) console.error(`  ${shown(w)}`);
  die('`git status` shows every change; `git checkout -- . && git clean -fd` undoes them');
}

// A directory three levels down (the fixture trees) is printed as one line when every file in it went the same
// way, and file by file otherwise.
const groupOf = (rel) => {
  const parts = rel.split(path.sep);
  return parts.length > 4 ? parts.slice(0, 3).join('/') : null;
};
function report(list, verb, suffix, other) {
  const groups = new Map();
  for (const rel of list) {
    const g = groupOf(rel);
    if (g !== null && !other.some((o) => groupOf(o) === g)) {
      groups.set(g, (groups.get(g) ?? 0) + 1);
      continue;
    }
    console.log(`${verb} ${shown(rel)}${suffix}`);
  }
  for (const [g, n] of groups) console.log(`${verb} ${g}/ (${n} files)${suffix}`);
}
report(written, opts.update ? 'updated  ' : 'wrote  ', '', skipped);
report(skipped, opts.update ? 'unchanged' : 'skipped', opts.update ? '' : ' (exists)', written);
for (const w of warnings) console.log(`warning: ${w}`);

if (opts.update) {
  if (written.length === 0) {
    console.log('\nnothing to commit: the gate is current');
  } else {
    console.log(`\nnext, from ${root}:`);
    console.log(`  git add -A scripts && git commit -m "pipeline: traceability gate from scalith init-pipeline"`);
  }
  process.exit(0);
}

// spec-kit's git extension has a mandatory before_specify hook that makes and checks out a <NNN>-<name> branch
// for every /speckit-specify, which would move the domain expert off the base branch. spec-kit 1.0.8 installs it
// only on `--extension git`; older releases installed it by default. It is disabled wherever it is installed and
// enabled: installed when .specify/extensions/git exists, and enabled unless .specify/extensions/.registry parses
// and marks it enabled: false. Where spec-kit is already initialised the script decides; after `specify init`,
// which may install it, the printed step decides with the same test.
const commit = opts.amend ? 'git commit --amend --no-edit' : 'git commit -m "$m"';
const REGISTRY_ENABLED =
  "try{process.exit(JSON.parse(require('fs').readFileSync('.specify/extensions/.registry','utf8')).extensions.git.enabled===false?1:0)}catch{}";
function gitExtensionEnabled() {
  if (!fs.existsSync(path.join(root, '.specify', 'extensions', 'git'))) return false;
  try {
    return JSON.parse(fs.readFileSync(path.join(root, '.specify', 'extensions', '.registry'), 'utf8')).extensions.git.enabled !== false;
  } catch {
    return true;
  }
}
const specKitThere = fs.existsSync(path.join(root, '.specify', 'templates'));
const disableNow = specKitThere && gitExtensionEnabled();
const next = specKitThere
  ? disableNow
    ? [
        'specify extension disable git &&',
        `m="pipeline: scalith init-pipeline, spec-kit git extension disabled" && git add -A && { git diff --cached --quiet || ${commit}; }`,
      ]
    : [`m="pipeline: scalith init-pipeline" && git add -A && { git diff --cached --quiet || ${commit}; }`]
  : [
      'specify init --here --force --non-interactive --integration claude &&',
      `if [ -d .specify/extensions/git ] && node -e "${REGISTRY_ENABLED}"; then specify extension disable git && m="pipeline: scalith init-pipeline, spec-kit init, git extension disabled"; else m="pipeline: scalith init-pipeline, spec-kit init"; fi &&`,
      `git add -A && { git diff --cached --quiet || ${commit}; }`,
    ];
console.log(`\nnext, from ${root}, in a POSIX shell (Git Bash on Windows):`);
for (const l of next) console.log(`  ${l}`);
console.log(
  specKitThere
    ? disableNow
      ? '  # spec-kit is already initialised here; its git extension, enabled, would move /speckit-specify off the base branch'
      : '  # spec-kit is already initialised here, and its git extension is not installed or already disabled'
    : '  # --force only lets init run in a non-empty directory: the files installed above are kept; its git extension, where installed, would move /speckit-specify off the base branch',
);
