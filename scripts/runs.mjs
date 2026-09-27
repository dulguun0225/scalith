#!/usr/bin/env node
// What the skills did on real work — a reader over the Workflow run journals
// that `build-feature` and `converge-feature` leave behind.
//
// Why it exists. Every other measurement in this repo is synthetic: `npm run
// firing` runs headless sessions against fixtures, `npm run probes` runs them
// with no skills installed, and the `tokens` family counts text. None of them
// observes a skill doing the work it was written for. Meanwhile every real run
// writes a journal holding its stage exits, its round counts, which of its
// mechanisms fired, per-agent tokens and wall-clock, and its findings verbatim
// — and until this script nothing read one back. The first read of the banked
// journals found a shipped status line claiming three mechanisms unrun while one
// of them had 17 firings, which is the defect class this script exists for: the
// lapse rule decays a `confirmed` marker over time with no maintainer action,
// and nothing here ever promoted an `unrun` claim when a run took it.
//
// Where the journals are, and that they are ephemeral. Claude Code writes them
// to `~/.claude/projects/<consumer repo path with "/" replaced by "-">/
// <sessionId>/workflows/wf_*.json`. They are machine-local, they are not in any
// repository, and a cleared projects directory erases them. **This script's
// output pasted into `docs/history/runs.md` is the durable record** — the same
// arrangement `npm run firing` has, where the sessions are thrown away and the
// rates are written down. Nothing here commits a journal or a copy of one.
//
// A report, not a gate, and it can never become one. Every number below is a
// property of runs that happened on one machine, in consumer repositories this
// repo does not control, by an operator who may have intervened by hand between
// runs. A threshold on any of it would fail this build for something nobody in
// this repo did, which is the check-that-fails-on-noise `guardrails-toolchain`
// bans by name. It is not in `npm run gates` and must not be added to it.
//
// A second source, git, for every stop. Each `needs-human` exit off the base
// branch commits `<featureDir>/HANDOFF.md` in the service repo; the per-stop
// block finds that commit, reports its size and the command that reads it in
// full, and lists the commits between it and the next run on the feature — what
// was changed before the restart, which no journal records. Owner's decision,
// 2026-09-24: harvest step d decides a prevention target for every stop, not
// only for recurring groups, and this block is its input. Its git calls are
// read-only.
//
// It computes groups and never names a rule. A finding that recurs across
// features is printed as a candidate; whether it becomes a directive, a
// constitution article, a template gate or nothing is the harvest's judgment,
// and the procedure for that is in `docs/history/runs.md`.
//
// Exits 0 on a clean read. Exits 1 when a journal could not be parsed or an
// agent label could not be read, because then every table below it is short by
// an unknown amount — the sibling principle from `frontmatter-tokens.mjs`, that
// a silently miscounted number is worse than a failure.
//
// Flags:
//   --repo <abs path>   consumer repo to read; repeatable; defaults below
//   --since <ISO date>  only runs whose timestamp is on or after this date
//   --until <ISO date>  only runs whose timestamp is on or before this date,
//                       inclusive; with --since it reproduces a sweep's stamp.
//                       A stop's next run is still looked up past --until and,
//                       when it lies outside the window, is shown marked so: it
//                       answers whether the resolution took, which the window
//                       cannot. It is not counted in any table
//   --run <runId>       only this run (substring match on the run id)
//   --json              machine-readable dump instead of the text report, the per-stop records included

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, sep } from "node:path";

// The consumer repos that have run these skills. Named rather than discovered:
// a scan of every project directory would read journals from unrelated work,
// and the names are the fact being reported on.
const DEFAULT_REPOS = [
  join(homedir(), "repos", "netos", "netcore-platform", "reference-data"),
  join(homedir(), "repos", "netos", "netcore-platform", "product-catalog"),
  join(homedir(), "repos", "netos", "netcore-platform", "customer-party-adapter"),
];

const argv = process.argv.slice(2);
const flagValues = (name) =>
  argv.flatMap((a, i) => (a === name && argv[i + 1] ? [argv[i + 1]] : []));
const flagValue = (name) => flagValues(name).at(-1);
const repos = flagValues("--repo").length ? flagValues("--repo") : DEFAULT_REPOS;
const since = flagValue("--since");
const until = flagValue("--until");
const onlyRun = flagValue("--run");
const asJson = argv.includes("--json");

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

/** The project directory Claude Code writes a repo's journals to. */
const projectDir = (repo) => join(homedir(), ".claude", "projects", repo.split(sep).join("-"));

const dirEntries = (dir) => {
  try {
    return readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
};

/** Every `wf_*.json` under a repo's project directory, one per session subdir. */
function journalPaths(repo) {
  const base = projectDir(repo);
  const out = [];
  for (const session of dirEntries(base)) {
    if (!session.isDirectory()) continue;
    const wf = join(base, session.name, "workflows");
    for (const f of dirEntries(wf)) {
      if (f.isFile() && /^wf_.*\.json$/.test(f.name)) out.push(join(wf, f.name));
    }
  }
  return out.sort((a, b) => statSync(a).mtimeMs - statSync(b).mtimeMs);
}

const unreadable = [];
const unparsedLabels = [];

// ---------------------------------------------------------------------------
// Agent labels
// ---------------------------------------------------------------------------

// A label is `<stage> (<model> <effort>)` followed by zero or more trailing
// parenthesised annotations — ` (retry N)` from the stall retry, and free text
// such as ` (after usage limit)` on an agent relaunched by hand after a usage
// stop (first seen 2026-09-22, wf_9e8bb81f-135). The stage part may itself hold
// parentheses — `preflight (discovery and sync)`, `converge 3 (assess only)` —
// so the tier is the last `(<model> <effort>)` group and everything after it
// must be annotation groups. Model and effort are not fields on the journal
// entry; they exist only inside this string, so this parse is coupled to
// `workflow.mjs`'s label format and says so when it fails rather than dropping
// the agent and quietly shortening every total below.
const MODELS = ["opus", "sonnet", "haiku", "fable"];
const EFFORTS = ["low", "medium", "high", "xhigh", "max"];
const LABEL = new RegExp(`^(.*)\\s\\((${MODELS.join("|")}) (${EFFORTS.join("|")})\\)((?:\\s\\([^()]*\\))*)$`);

function parseLabel(label) {
  if (typeof label !== "string") return null;
  const t = label.match(LABEL);
  if (!t) return null;
  const stage = t[1].trim();
  let retry = 0;
  const annotations = [];
  for (const [, a] of t[4].matchAll(/\(([^()]*)\)/g)) {
    const r = a.match(/^retry (\d+)$/);
    if (r) retry = Number(r[1]);
    else annotations.push(a.trim());
  }
  return {
    stage,
    // The round or phase number is what makes two runs of one stage look like
    // two stages; strip it so the cost table groups.
    normalStage: stage.replace(/\s+\d+/g, "").replace(/\s+/g, " ").trim(),
    model: t[2],
    effort: t[3],
    retry,
    annotations,
  };
}

// ---------------------------------------------------------------------------
// Findings
// ---------------------------------------------------------------------------

// `result.detail[]` is a string in some runs and an object in others, with the
// prose under `problem` or `summary`; `result.converge.forced[]` is always an
// object. Both shapes are read rather than one being preferred, because the
// shape a run used is not a property anyone chose.
function findingText(f) {
  if (typeof f === "string") return f;
  if (!f || typeof f !== "object") return "";
  return [f.problem, f.summary, f.detail].find((v) => typeof v === "string" && v) ?? "";
}
const findingLocation = (f) =>
  typeof f === "object" && f ? [f.location, f.artifact].filter(Boolean).join(" / ") : "";
const findingSeverity = (f) => {
  if (typeof f === "object" && f?.severity) return String(f.severity).toUpperCase();
  const m = typeof f === "string" ? f.match(/\[(CRITICAL|HIGH|MEDIUM|LOW|BLOCKING|MAJOR|MINOR)\]/i) : null;
  return m ? m[1].toUpperCase() : "?";
};

// Normalisation for grouping: case, whitespace, quoting, file:line and the
// requirement, task and finding ids that differ between two features stating
// the same thing. This is an exact match after normalising and nothing more —
// it does not catch re-typed wording, which `build-feature` itself records as
// the reason its own duplicate test needs the assessment's `repeatOf` label.
const normalise = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[`'"«»]/g, "")
    .replace(/:\d+(-\d+)?/g, "")
    .replace(/\b(fr|sc|us|ac|op|nc|i|r|d|t|a|u|g|m|c|e)-?\d+[a-z]?\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

// ---------------------------------------------------------------------------
// One record per run
// ---------------------------------------------------------------------------

function readRun(path, repo) {
  let j;
  try {
    j = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    unreadable.push(`${path}: ${e.message.slice(0, 80)}`);
    return null;
  }
  const res = j.result ?? {};
  const agents = (j.workflowProgress ?? []).filter((p) => p?.type === "workflow_agent");

  const parsed = [];
  for (const a of agents) {
    const p = parseLabel(a.label);
    if (!p) {
      unparsedLabels.push(`${j.runId ?? "?"}: ${String(a.label).slice(0, 70)}`);
      parsed.push({ stage: "(unparsed)", normalStage: "(unparsed)", model: a.model ?? "?", effort: "?", retry: 0, annotations: [], agent: a });
      continue;
    }
    parsed.push({ ...p, agent: a });
  }

  const withTokens = parsed.filter((p) => typeof p.agent.tokens === "number");
  const stageCount = (re) => parsed.filter((p) => re.test(p.normalStage)).length;
  const logs = (j.logs ?? []).map(String);

  // `timestamp` is when the run ended; `startTime` (epoch ms) is when it began.
  const endMs = Date.parse(j.timestamp ?? "") || null;
  const startMs = typeof j.startTime === "number" ? j.startTime : endMs && j.durationMs ? endMs - j.durationMs : endMs;

  return {
    repo: repo.split(sep).at(-1),
    repoPath: repo,
    path,
    runId: j.runId ?? "?",
    startMs,
    endMs,
    branch: res.branch ?? j.args?.branch ?? null,
    baseBranch: j.args?.baseBranch ?? null,
    handoffRecord: res.handoff ?? null,
    date: String(j.timestamp ?? "").slice(0, 10),
    timestamp: String(j.timestamp ?? ""),
    workflowName: j.workflowName ?? "?",
    harnessStatus: j.status ?? "?",
    feature: res.featureDir ?? j.args?.featureDir ?? "(unresolved)",
    from: j.args?.from ?? "-",
    until: j.args?.until ?? "-",
    exit: res.status ?? "(none)",
    stage: res.stage ?? "-",
    why: res.why ?? "",
    rounds: res.rounds ?? null,
    stagesRun: res.stagesRun ?? null,
    convergeEnded: res.converge?.ended ?? "-",
    convergeFloor: res.converge?.floor ?? "-",
    handoff: res.handoff ? `${res.handoff.written ? "written" : "NOT written"}${res.handoff.pushed ? "+pushed" : ""}` : "-",
    mech: {
      forced: stageCount(/^force-append/),
      wallRepair: stageCount(/repair/i),
      reconcile: stageCount(/reconcile/i),
      assessOnly: stageCount(/assess only/i),
      stallRetry: parsed.filter((p) => p.retry > 0).length,
    },
    stalls: logs.filter((l) => l.startsWith("[stall]")),
    wallRed: logs.filter((l) => /wall RED/.test(l)),
    roundCap: logs.filter((l) => /round cap \d+ reached/.test(l)),
    agents: parsed,
    agentCount: parsed.length,
    tokenAgents: withTokens.length,
    tokens: withTokens.reduce((n, p) => n + p.agent.tokens, 0),
    totalTokens: j.totalTokens ?? 0,
    durationMs: j.durationMs ?? 0,
    toolCalls: j.totalToolCalls ?? 0,
    findings: [
      ...(Array.isArray(res.detail) ? res.detail.map((f) => ({ kind: "detail", f })) : []),
      ...(Array.isArray(res.converge?.forced) ? res.converge.forced.map((f) => ({ kind: "forced", f })) : []),
    ],
  };
}

// `allRuns` ignores `--run` and `--until`, because the per-stop section needs
// the next run on a stopped feature even when only the stopped run was asked
// for, or when that next run falls after the window. Both date bounds compare
// against the run's end date, `YYYY-MM-DD`.
const allRuns = [];
for (const repo of repos) {
  for (const path of journalPaths(repo)) {
    const r = readRun(path, repo);
    if (!r) continue;
    if (since && r.date && r.date < since) continue;
    allRuns.push(r);
  }
}
allRuns.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
const inWindow = (r) => !(until && r.date && r.date > until.slice(0, 10));
const runs = allRuns.filter((r) => inWindow(r) && (!onlyRun || r.runId.includes(onlyRun)));

// ---------------------------------------------------------------------------
// Stops — what each needs-human exit left in git, and what changed after it
// ---------------------------------------------------------------------------

// A second source beside the journals. Every needs-human exit with a resolved
// feature directory, off the base branch, commits `<featureDir>/HANDOFF.md` with
// the subject below, rendering the return value's findings item by item. Its
// content is the journal's `result.detail`, not more (checked 2026-09-24 on
// wf_e5ab8e1a-c53: twelve items in both), but it is committed, so it survives a
// cleared projects directory and is readable on any clone. The commits on the
// branch between that commit and the next run's start are what somebody changed
// before restarting — the one thing no journal records.
//
// Read-only by construction: every call is log, show, cat-file, rev-parse,
// for-each-ref, merge-base --is-ancestor or symbolic-ref. Nothing fetches, checks
// out or writes, so the report reads a service repo without touching its state.
// A missing repo or a failing git call is reported on the stop it belongs to and
// never ends the report.
const HANDOFF_SUBJECT = /^handoff: the \S+ stage stopped and needs a person/;
const CONSTITUTION = ".specify/memory/constitution.md";
// The handoff commit is made inside the run, before it returns, so it falls
// between the run's start and its end; the slack covers clock skew between the
// journal's clock and the committer's.
const MATCH_SLACK_MS = 10 * 60 * 1000;
const MAX_LISTED_COMMITS = 15;

function git(repo, args) {
  try {
    return { ok: true, out: execFileSync("git", ["-C", repo, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 }) };
  } catch (e) {
    return { ok: false, out: "", err: String(e.stderr || e.message).trim().split("\n")[0].slice(0, 160) };
  }
}

const repoState = new Map();
function repoCheck(repo) {
  if (repoState.has(repo)) return repoState.get(repo);
  let s;
  if (!existsSync(repo)) s = { ok: false, why: `repo path ${repo} does not exist on this machine` };
  else {
    const g = git(repo, ["rev-parse", "--git-dir"]);
    if (!g.ok) s = { ok: false, why: `${repo} is not a git repository (${g.err})` };
    else {
      const head = git(repo, ["symbolic-ref", "--short", "refs/remotes/origin/HEAD"]);
      s = { ok: true, originHead: head.ok ? head.out.trim().replace(/^origin\//, "") : null };
    }
  }
  repoState.set(repo, s);
  return s;
}

/** One commit: sha, commit time, subject, and the paths it touched. */
function commitInfo(repo, sha) {
  const g = git(repo, ["show", "--no-renames", "--name-only", "--format=%H%x09%ct%x09%s", sha]);
  if (!g.ok) return null;
  const [head, ...files] = g.out.split("\n").filter((l) => l !== "");
  const [full, ct, ...subj] = head.split("\t");
  return { sha: full, timeMs: Number(ct) * 1000, subject: subj.join("\t"), files };
}

/** Numbered items under `## What the stage reported`, and the document's size. */
function handoffShape(repo, sha, path) {
  const g = git(repo, ["show", `${sha}:${path}`]);
  if (!g.ok) return { items: null, bytes: null };
  const lines = g.out.split("\n");
  const at = lines.findIndex((l) => /^## What the stage reported/.test(l));
  let items = null;
  if (at >= 0) {
    const end = lines.findIndex((l, i) => i > at && /^## /.test(l));
    items = lines.slice(at + 1, end < 0 ? undefined : end).filter((l) => /^\d+\.\s/.test(l)).length;
  }
  return { items, bytes: Buffer.byteLength(g.out, "utf8") };
}

function findHandoff(r, path) {
  const rec = r.handoffRecord;
  // The journal names the sha when its handoff agent reported one; verify it
  // against git rather than trust it.
  if (rec?.written && rec.commit) {
    const c = commitInfo(r.repoPath, rec.commit);
    if (c && HANDOFF_SUBJECT.test(c.subject) && c.files.includes(path)) return { commit: c, via: "journal sha, verified in git" };
    if (!c) return { none: `the journal names commit ${rec.commit}, which this clone does not hold` };
  }
  // Otherwise search: a handoff-subject commit touching the file inside the
  // run's window. --full-history, because default history simplification drops
  // side-branch commits behind a merge, which hid every handoff of a merged
  // feature on the first try. A commit touching HANDOFF.md under any other
  // subject is a resolution rewrite or a sweep, never the handoff.
  const g = git(r.repoPath, ["log", "--all", "--full-history", "--no-merges", "--format=%H%x09%ct%x09%s", "--", path]);
  const inside = (c) => c.timeMs >= r.startMs && c.timeMs <= r.endMs;
  if (!g.ok) return { none: `git log failed: ${g.err}` };
  const hits = g.out
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      const [sha, ct, ...s] = l.split("\t");
      return { sha, timeMs: Number(ct) * 1000, subject: s.join("\t") };
    })
    .filter((c) => HANDOFF_SUBJECT.test(c.subject) && c.timeMs >= r.startMs - MATCH_SLACK_MS && c.timeMs <= r.endMs + MATCH_SLACK_MS)
    // Inside the run's own window first, then the latest: the slack can reach a
    // neighbouring run's handoff on the same feature.
    .sort((a, b) => Number(inside(b)) - Number(inside(a)) || b.timeMs - a.timeMs);
  if (hits.length) return { commit: commitInfo(r.repoPath, hits[0].sha), via: `git search by path, subject and run window${hits.length > 1 ? ` (${hits.length} candidates; the one inside the run's window, else the latest)` : ""}` };
  if (rec && rec.written === false) return { none: `handoff not written: ${String(rec.note || "no reason given").slice(0, 160)}` };
  const base = r.baseBranch || repoCheck(r.repoPath).originHead;
  if (base && r.branch === base) return { none: `on base branch \`${base}\`; no handoff commit found` };
  return { none: rec ? "the journal records a handoff with no sha and git holds no matching commit" : "the journal holds no handoff record (none was written before 2026-09-18) and git holds no matching commit" };
}

/** The ref the resolution window is read on: the feature branch if it holds the handoff, else any ref that does. */
function resolutionRef(repo, branch, sha) {
  const tries = branch ? [`refs/heads/${branch}`, `refs/remotes/origin/${branch}`] : [];
  for (const ref of tries) {
    if (git(repo, ["rev-parse", "--verify", "--quiet", ref]).ok && git(repo, ["merge-base", "--is-ancestor", sha, ref]).ok) return { ref, fallback: false };
  }
  const g = git(repo, ["for-each-ref", "--contains", sha, "--format=%(refname)", "refs/heads", "refs/remotes"]);
  const refs = g.ok ? g.out.split("\n").filter((x) => x && !x.endsWith("/HEAD")) : [];
  const pick = refs.find((x) => x.startsWith("refs/heads/")) ?? refs[0];
  return pick ? { ref: pick, fallback: true } : null;
}

function commitFlags(repo, c, feature) {
  const flags = [];
  const f = new Set(c.files);
  if (f.has(`${feature}/spec.md`)) flags.push("SPEC");
  if (f.has(CONSTITUTION)) flags.push("CONSTITUTION");
  if (c.files.some((p) => p === "CLAUDE.md" || p.endsWith("/CLAUDE.md"))) flags.push("CLAUDE.md");
  if (f.has(`${feature}/RESOLUTIONS.md`)) flags.push("RESOLUTIONS");
  if (f.has(`${feature}/HANDOFF.md`)) {
    if (HANDOFF_SUBJECT.test(c.subject)) flags.push("HANDOFF-COMMIT");
    else {
      const g = git(repo, ["show", `${c.sha}:${feature}/HANDOFF.md`]);
      flags.push(!g.ok ? "HANDOFF-DELETED" : /^#\s*Resolved\b/.test(g.out) ? "HANDOFF-RESOLVED-REWRITE" : "HANDOFF-TOUCHED");
    }
  }
  return flags;
}

function readStop(r) {
  const next = allRuns
    .filter((n) => n.repoPath === r.repoPath && n.feature === r.feature && n.runId !== r.runId && n.startMs >= r.endMs)
    .sort((a, b) => a.startMs - b.startMs)[0];
  const stop = {
    runId: r.runId,
    date: r.date,
    repo: r.repo,
    repoPath: r.repoPath,
    featureDir: r.feature,
    stage: r.stage,
    why: r.why,
    handoff: null,
    resolution: null,
    next: next
      ? {
          runId: next.runId,
          status: next.exit === "needs-human" ? `needs-human@${next.stage}` : next.exit === "done" ? `done (${next.convergeEnded})` : `harness:${next.harnessStatus}`,
          stage: next.exit === "needs-human" ? next.stage : null,
          repeatStage: next.exit === "needs-human" && next.stage === r.stage,
          outsideWindow: !inWindow(next),
        }
      : null,
  };
  if (r.feature === "(unresolved)") {
    stop.handoff = { none: "no feature directory resolved; the return value is the whole report" };
    return stop;
  }
  const rc = repoCheck(r.repoPath);
  if (!rc.ok) {
    stop.handoff = { none: rc.why };
    return stop;
  }
  const path = `${r.feature}/HANDOFF.md`;
  const h = findHandoff(r, path);
  if (!h.commit) {
    stop.handoff = { none: h.none };
    return stop;
  }
  const shape = handoffShape(r.repoPath, h.commit.sha, path);
  stop.handoff = {
    sha: h.commit.sha,
    short: h.commit.sha.slice(0, 7),
    subject: h.commit.subject,
    via: h.via,
    items: shape.items,
    bytes: shape.bytes,
    read: `git -C ${r.repoPath} show ${h.commit.sha.slice(0, 7)}:${path}`,
  };

  const ref = resolutionRef(r.repoPath, r.branch, h.commit.sha);
  if (!ref) {
    stop.resolution = { none: "no branch or remote ref in this clone contains the handoff commit" };
    return stop;
  }
  const g = git(r.repoPath, ["log", "--ancestry-path", "--no-merges", "--reverse", "--no-renames", "--format=%x1e%H%x09%ct%x09%s", "--name-only", `${h.commit.sha}..${ref.ref}`]);
  if (!g.ok) {
    stop.resolution = { none: `git log failed: ${g.err}` };
    return stop;
  }
  const until = next ? next.startMs : null;
  const commits = g.out
    .split("\x1e")
    .filter((b) => b.trim())
    .map((b) => {
      const [head, ...files] = b.split("\n").filter((l) => l !== "");
      const [sha, ct, ...s] = head.split("\t");
      return { sha, timeMs: Number(ct) * 1000, subject: s.join("\t"), files };
    })
    .filter((c) => until === null || c.timeMs < until)
    .map((c) => ({ ...c, flags: commitFlags(r.repoPath, c, r.feature) }));
  const endSha = commits.at(-1)?.sha ?? h.commit.sha;
  stop.resolution = {
    ref: ref.ref,
    refIsFallback: ref.fallback,
    until: until ? `start of ${next.runId}` : `${ref.ref} tip (no later run on this feature)`,
    commits: commits.map(({ sha, subject, files, flags, timeMs }) => ({ sha: sha.slice(0, 7), date: `${new Date(timeMs).toISOString().slice(0, 16)}Z`, subject, files, flags })),
    resolutionsFile: git(r.repoPath, ["cat-file", "-e", `${endSha}:${r.feature}/RESOLUTIONS.md`]).ok,
  };
  return stop;
}

const stops = runs.filter((r) => r.exit === "needs-human").map(readStop);

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

const fmtM = (n) => `${(n / 1e6).toFixed(2)}M`;
const mins = (ms) => `${Math.round(ms / 60000)}m`;
const coverage = (tok, a, b) => `>=${tok.toLocaleString("en-US")} over ${a}/${b} agents`;

// Every exit sets process.exitCode and lets the process end once stdout has
// drained. process.exit() does not wait for a pipe: `--json | <reader>` was cut
// at exactly 65,536 bytes, invalid JSON, while a redirect to a file was complete.
const readFailed = unreadable.length || unparsedLabels.length ? 1 : 0;
if (asJson) {
  console.log(
    JSON.stringify(
      { generated: new Date().toISOString(), repos, since: since ?? null, until: until ?? null, stops, runs: runs.map(({ agents, ...r }) => ({ ...r, agents: agents.map((p) => ({ stage: p.normalStage, model: p.model, effort: p.effort, retry: p.retry, annotations: p.annotations, tokens: p.agent.tokens ?? null, durationMs: p.agent.durationMs ?? null })) })) },
      null,
      2,
    ),
  );
  process.exitCode = readFailed;
} else {
  process.exitCode = textReport();
}

/** The text report; returns the exit code. */
function textReport() {
  if (!runs.length) {
    console.log(
      `\nNo run journals found.\n\nLooked in:\n${repos.map((r) => `  ${projectDir(r)}`).join("\n")}\n\n` +
        `The journals are machine-local and ephemeral — a cleared ~/.claude/projects\n` +
        `erases them. The durable record is docs/history/runs.md.\n`,
    );
    return 0;
  }

  // --- Block 1: one record per run -------------------------------------------
  console.log(`\n=== Per-run record — ${runs.length} run(s), ${runs[0].date}..${runs.at(-1).date} ===\n`);
  console.log(
    `Mechanisms: fc=forced convergence round, wr=wall repair, rc=reconcile after a\n` +
      `failed forced append, ao=assess-only round, sr=stall retry. A second implement\n` +
      `pass over unchecked task ids has no label of its own and is not counted.\n`,
  );
  for (const r of runs) {
    const m = r.mech;
    const rounds = r.rounds
      ? Object.entries(r.rounds)
          .filter(([, v]) => v)
          .map(([k, v]) => `${k}=${v}`)
          .join(",") || "none"
      : "(no result)";
    console.log(
      `${r.date} ${r.runId.padEnd(17)} ${r.repo.padEnd(16)} ${(r.feature.replace(/^specs\//, "")).padEnd(22)}` +
        ` ${r.exit === "needs-human" ? `needs-human@${r.stage}` : r.exit === "done" ? `done (${r.convergeEnded})` : `harness:${r.harnessStatus}`}`,
    );
    console.log(
      `    from=${r.from} until=${r.until} rounds:${rounds} floor=${r.convergeFloor} handoff=${r.handoff}` +
        ` | fc=${m.forced} wr=${m.wallRepair} rc=${m.reconcile} ao=${m.assessOnly} sr=${m.stallRetry}` +
        ` | agents=${r.agentCount} ${coverage(r.tokens, r.tokenAgents, r.agentCount)} ${mins(r.durationMs)} tools=${r.toolCalls}`,
    );
    if (r.stagesRun) console.log(`    stagesRun: ${r.stagesRun.join(" -> ")}`);
    for (const l of [...r.wallRed, ...r.roundCap, ...r.stalls]) console.log(`    ! ${l.slice(0, 150)}`);
    if (r.why) console.log(`    why: ${r.why.slice(0, 150)}${r.why.length > 150 ? "..." : ""}`);
    console.log();
  }

  const tot = (fn) => runs.reduce((n, r) => n + fn(r), 0);
  const exits = {};
  for (const r of runs) {
    const k = r.exit === "needs-human" ? `needs-human@${r.stage}` : r.exit === "done" ? "done" : `harness:${r.harnessStatus}`;
    exits[k] = (exits[k] ?? 0) + 1;
  }
  console.log(
    `Corpus: ${runs.length} runs, ${runs[0].date}..${runs.at(-1).date}, ` +
      `${coverage(tot((r) => r.tokens), tot((r) => r.tokenAgents), tot((r) => r.agentCount))}, ` +
      `${(tot((r) => r.durationMs) / 3600000).toFixed(1)}h, ${tot((r) => r.agentCount)} agents.`,
  );
  console.log(`Exits: ${Object.entries(exits).sort().map(([k, v]) => `${k}=${v}`).join(", ")}`);
  console.log(
    `Mechanisms across the corpus: ` +
      ["forced", "wallRepair", "reconcile", "assessOnly", "stallRetry"]
        .map((k) => `${k}=${tot((r) => r.mech[k])}`)
        .join(", "),
  );
  // Label annotations other than `retry N`, which is counted as sr above. An
  // annotated agent is parsed and counted like any other; this line says how many
  // were relaunched or marked by hand, and --json carries each one per agent.
  const annotationCounts = {};
  for (const r of runs) for (const p of r.agents) for (const a of p.annotations) annotationCounts[a] = (annotationCounts[a] ?? 0) + 1;
  console.log(
    `Agent label annotations: ${Object.entries(annotationCounts).sort().map(([k, v]) => `"${k}"=${v}`).join(", ") || "none"}`,
  );

  // A feature that never reached implement is the loop failing to leave a fixed
  // point, and it is invisible in any per-run line.
  const byFeature = new Map();
  for (const r of runs) {
    const key = `${r.repo}/${r.feature}`;
    const e = byFeature.get(key) ?? { runs: 0, tokens: 0, implement: 0, exits: [] };
    e.runs += 1;
    e.tokens += r.tokens;
    e.implement += r.agents.filter((p) => /^implement/.test(p.normalStage)).length;
    e.exits.push(r.exit === "needs-human" ? r.stage : r.exit);
    byFeature.set(key, e);
  }
  console.log(`\nPer feature:`);
  for (const [k, e] of [...byFeature].sort()) {
    console.log(
      `  ${k.padEnd(52)} runs=${String(e.runs).padStart(2)} tok=${fmtM(e.tokens)} implement-agents=${String(e.implement).padStart(2)}` +
        `${e.implement === 0 ? "  <- never reached implement" : ""}`,
    );
  }

  // --- Block 2: stage x tier -------------------------------------------------
  console.log(`\n\n=== Stage x tier — tokens and wall-clock per agent ===\n`);
  const cells = new Map();
  for (const r of runs) {
    for (const p of r.agents) {
      const key = `${p.normalStage}|${p.model} ${p.effort}`;
      const c = cells.get(key) ?? { n: 0, withTok: 0, tokens: 0, ms: 0, withMs: 0, retries: 0 };
      c.n += 1;
      if (typeof p.agent.tokens === "number") {
        c.withTok += 1;
        c.tokens += p.agent.tokens;
      }
      if (typeof p.agent.durationMs === "number") {
        c.withMs += 1;
        c.ms += p.agent.durationMs;
      }
      if (p.retry > 0) c.retries += 1;
      cells.set(key, c);
    }
  }
  const rowsOut = [...cells].map(([k, c]) => ({ stage: k.split("|")[0], tier: k.split("|")[1], ...c }));
  rowsOut.sort((a, b) => b.tokens - a.tokens);
  const w = Math.max(...rowsOut.map((r) => r.stage.length), 5);
  console.log(`${"stage".padEnd(w)}  ${"tier".padEnd(14)}  ${"n".padStart(4)}  ${"tok(cov)".padStart(18)}  ${"mean tok".padStart(9)}  ${"mean s".padStart(7)}  retries`);
  for (const r of rowsOut) {
    console.log(
      `${r.stage.padEnd(w)}  ${r.tier.padEnd(14)}  ${String(r.n).padStart(4)}  ` +
        `${`${r.tokens.toLocaleString("en-US")} (${r.withTok}/${r.n})`.padStart(18)}  ` +
        `${String(r.withTok ? Math.round(r.tokens / r.withTok) : 0).padStart(9)}  ` +
        `${String(r.withMs ? Math.round(r.ms / r.withMs / 1000) : 0).padStart(7)}  ${r.retries}`,
    );
  }

  console.log(`\nBy tier alone:`);
  const tiers = new Map();
  for (const r of rowsOut) {
    const t = tiers.get(r.tier) ?? { n: 0, withTok: 0, tokens: 0, ms: 0, withMs: 0 };
    t.n += r.n;
    t.withTok += r.withTok;
    t.tokens += r.tokens;
    t.ms += r.ms;
    t.withMs += r.withMs;
    tiers.set(r.tier, t);
  }
  for (const [k, t] of [...tiers].sort((a, b) => b[1].tokens - a[1].tokens)) {
    console.log(
      `  ${k.padEnd(14)} n=${String(t.n).padStart(4)}  ${coverage(t.tokens, t.withTok, t.n).padEnd(44)}` +
        ` mean=${t.withTok ? Math.round(t.tokens / t.withTok) : 0}  mean_s=${t.withMs ? Math.round(t.ms / t.withMs / 1000) : 0}`,
    );
  }

  // --- Block 3: recurrence ---------------------------------------------------
  console.log(`\n\n=== Recurrence — what came back, and where ===\n`);

  function group(items, keyOf, labelOf) {
    const g = new Map();
    for (const it of items) {
      const k = keyOf(it);
      if (!k) continue;
      const e = g.get(k) ?? { label: labelOf(it), runs: new Set(), features: new Set(), n: 0 };
      e.runs.add(it.runId);
      e.features.add(it.feature);
      e.n += 1;
      g.set(k, e);
    }
    return [...g.values()].filter((e) => e.runs.size > 1).sort((a, b) => b.runs.size - a.runs.size);
  }

  const tag = (e) => (e.features.size > 1 ? "CROSS-FEATURE" : "REPEAT       ");
  const show = (title, groups) => {
    console.log(`-- ${title}: ${groups.length} group(s) spanning more than one run`);
    for (const e of groups) {
      console.log(`   ${tag(e)}  ${e.runs.size} runs, ${e.features.size} feature(s), ${e.n} occurrence(s)`);
      console.log(`     ${e.label.slice(0, 160)}${e.label.length > 160 ? "..." : ""}`);
      console.log(`     runs: ${[...e.runs].join(", ")}`);
      console.log(`     features: ${[...e.features].join(", ")}`);
    }
    if (!groups.length) console.log(`   none`);
    console.log();
  };

  const exitItems = runs.filter((r) => r.why).map((r) => ({ runId: r.runId, feature: r.feature, why: r.why }));
  show(
    "Exit reasons (result.why, verbatim then normalised)",
    group(exitItems, (i) => normalise(i.why), (i) => i.why),
  );

  const findingItems = runs.flatMap((r) =>
    r.findings.map(({ kind, f }) => ({
      runId: r.runId,
      feature: r.feature,
      kind,
      sev: findingSeverity(f),
      text: findingText(f),
      loc: findingLocation(f),
    })),
  );
  console.log(
    `${findingItems.length} finding(s) read: ` +
      `${findingItems.filter((i) => i.kind === "detail").length} from result.detail, ` +
      `${findingItems.filter((i) => i.kind === "forced").length} from result.converge.forced.\n`,
  );
  show(
    "Finding text",
    group(findingItems, (i) => (i.text ? normalise(i.text) : null), (i) => `[${i.sev}] ${i.text}`),
  );
  show(
    "Finding location",
    group(findingItems, (i) => (i.loc ? normalise(i.loc) : null), (i) => `[${i.sev}] ${i.loc}`),
  );

  // --- Block 4: every stop ---------------------------------------------------
  console.log(`\n=== Per-stop record — every needs-human exit, its handoff and what changed after it ===\n`);
  console.log(
    `Read from each service repo's git history, read-only, beside the journal. Flags on a\n` +
      `resolution commit: SPEC, CONSTITUTION, CLAUDE.md, RESOLUTIONS; HANDOFF-RESOLVED-REWRITE\n` +
      `(HANDOFF.md overwritten with a "# Resolved" document), HANDOFF-TOUCHED or -DELETED\n` +
      `(the file changed under a non-handoff subject), HANDOFF-COMMIT (another stop's handoff\n` +
      `inside the window). REPEAT-STAGE: the next run on the feature stopped at the same stage.\n`,
  );
  for (const s of stops) {
    console.log(`${s.date} ${s.runId.padEnd(17)} ${s.repo.padEnd(16)} ${s.featureDir.replace(/^specs\//, "").padEnd(22)} needs-human@${s.stage}`);
    if (s.why) console.log(`    why: ${s.why.slice(0, 150)}${s.why.length > 150 ? "..." : ""}`);
    const h = s.handoff;
    if (h.none) console.log(`    handoff: none — ${h.none}`);
    else {
      console.log(`    handoff: ${h.short} (${h.via}) items=${h.items ?? "?"} bytes=${h.bytes ?? "?"}`);
      console.log(`      read: ${h.read}`);
    }
    const rs = s.resolution;
    if (rs?.none) console.log(`    resolution: unreadable — ${rs.none}`);
    else if (rs) {
      console.log(
        `    resolution: ${rs.commits.length} commit(s) on ${rs.ref}${rs.refIsFallback ? " (feature branch not in this clone; a ref holding the handoff)" : ""}, up to ${rs.until}; ` +
          `RESOLUTIONS.md ${rs.resolutionsFile ? "present" : "absent"} at the window's end`,
      );
      for (const c of rs.commits.slice(0, MAX_LISTED_COMMITS)) {
        console.log(`      ${c.sha} ${c.date} ${c.subject.slice(0, 90)}${c.flags.length ? `  [${c.flags.join(" ")}]` : ""}`);
        console.log(`        ${c.files.slice(0, 6).join(", ")}${c.files.length > 6 ? `, +${c.files.length - 6} more` : ""}`);
      }
      if (rs.commits.length > MAX_LISTED_COMMITS) console.log(`      ... ${rs.commits.length - MAX_LISTED_COMMITS} more; --json lists them all`);
    }
    const n = s.next;
    console.log(
      `    next: ${n ? `${n.runId} ${n.status}${n.repeatStage ? "  REPEAT-STAGE" : ""}${n.outsideWindow ? `  (after --until ${until}; outside the window)` : ""}` : "none in the journals read"}`,
    );
    console.log();
  }
  if (!stops.length) console.log(`   none\n`);
  const withHandoff = stops.filter((s) => s.handoff.sha).length;
  console.log(
    `Stops: ${stops.length}; with a handoff commit in git: ${withHandoff}; none found, so journal-only here: ${stops.length - withHandoff}; ` +
      `next run stopped at the same stage: ${stops.filter((s) => s.next?.repeatStage).length}.\n`,
  );

  // --- What could not be read ------------------------------------------------
  if (unreadable.length) {
    console.log(`Journals that could not be parsed — every table above is short by these:`);
    for (const u of unreadable) console.log(`  ${u}`);
    console.log();
  }
  if (unparsedLabels.length) {
    console.log(
      `Agent labels this script could not read. They are counted in the agent totals\n` +
        `under "(unparsed)" and contribute no tier, so the stage x tier table is short\n` +
        `by them. A label format change in workflow.mjs is the usual cause:`,
    );
    for (const u of unparsedLabels) console.log(`  ${u}`);
    console.log();
  }

  console.log(`What this report does not decide:
  - anything about money. The journal carries one undifferentiated token number
    per agent with no input/output/cache split, so no price could be applied
    even with a table. Cost here is tokens and wall-clock, never dollars
  - which skills an agent loaded. No journal names a skill at all, so whether
    \`money\`, \`primary-keys\` or any other directive reached an implement agent
    is not observable from here. The consumer repo's own backend/docs/GATES.md is
    the only per-directive coverage record, and it is a different reader
  - whether the produced code obeys a directive. That is the consumer repo's
    wall, which was green on the runs it ran on; this reports what the loop did
  - whether a recurrence group should become a rule. It prints candidates; the
    harvest procedure in docs/history/runs.md decides, and a CROSS-FEATURE group
    is a candidate and not a verdict
  - near-duplicate findings. Grouping is an exact match after normalising, and
    \`build-feature\` records that exact match alone never fired on re-typed
    wording — which is why its own loop asks the assessment for \`repeatOf\`
  - which skill invoked the run. Every journal names build-feature's script, so a
    \`converge-feature\` run is indistinguishable from build-feature with
    \`from: "converge"\`
  - wall attempts inside an implement agent, or a second implement pass over
    unchecked ids. Neither has a label or a log line; only the phase-level wall
    outcome is recorded
  - anything a finding did not survive into. Agent previews are capped at 401
    characters, so a finding a round graded and the script did not lift into
    result.detail or result.converge.forced is unrecoverable. A handoff renders
    result.detail and nothing more: it makes a stop's reported findings durable
    in git (the per-stop "read:" command), it does not recover a lost one
  - why a resolution was chosen. The per-stop window shows what changed between
    a stop and the next run, not what the confidence rested on; only a
    RESOLUTIONS.md, where one was written, says that
  - whether a commit in a resolution window is resolution work. The window is
    every non-merge commit on the ref between the handoff and the next run's
    start, by time; on a fallback ref, or with no later run, it can hold
    unrelated work
  - a decision made in conversation and never committed. Git holds only what
    was committed; the journal holds only what the run returned
  - the prevention target of a stop. The per-stop record is the input to harvest
    step d in docs/history/runs.md; which earlier stage should have caught the
    stop is that step's judgment
  - whether any of this generalises. One machine, one operator, no control arm;
    a number here is comparable only to another taken the same way
`);

  return readFailed;
}
