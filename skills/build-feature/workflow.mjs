// build-feature — one spec-kit feature from a finished spec to a converged,
// wall-green, pushed feature branch, with no human gate.
//
// Run through Claude Code's Workflow tool:
//   Workflow({ scriptPath: "<this skill dir>/workflow.mjs", args: { ... } })   // nothing is required
//
// THE SPEC IS NOT THIS RUN'S. A domain expert writes specs/<NNN>-<name>/spec.md in
// the project with /speckit-specify and /speckit-clarify, on the feature branch those
// commands created, and hands the finished spec over; this script starts at plan. No
// stage, review fix or repair pass edits spec.md, and a finding whose only remedy is
// a change to the spec is a needs-human exit naming it, addressed to its author — the
// one artifact in the feature directory this run reads and never writes.
//
// Every stage is a fresh subagent with its own model and effort (the TIERS table
// below; args.tiers overrides any entry). The script is plain JavaScript in the
// Workflow sandbox: no filesystem, no Date, no Node APIs — an agent does every
// read and write, and the script only decides what runs next.
//
// Stages, in order:
//   preflight → plan → review-plan ⇄ fix-plan → tasks → analyze ⇄ remediate
//   → implement (one agent per phase) → converge ⇄ implement → finish
//
// Preflight is also discovery, and it runs on every entry, restarts included: the
// feature directory comes from args.featureDir, else from the checked-out branch name,
// else — on the base branch — from the one directory under specs/ with a written spec
// and no plan, and only then from .specify/feature.json, which is git-ignored local
// state and is the one thing here that can be stale. A run that starts at a later stage
// still gets state.branch and state.featureDir that way (before 2026-09-21 a
// `from: "plan"` restart left the branch null, and the handoff and finish prompts
// degraded to "(unknown)" and HEAD@{1}).
//
// The base branch is discovered, not assumed (owner's decision, 2026-09-25): args.baseBranch,
// else the project's CLAUDE.md line `Base branch: \`<branch>\`` (the same file that states the
// definition of done; owner's decision, later the same day), else origin/HEAD, else the one
// local branch among main, master, develop and dev — and a run where none of those answers,
// or whose CLAUDE.md line or origin/HEAD names no local branch, stops at preflight before anything is
// written. Until that day an absent baseBranch fell back to main or master: the service
// repositories set no origin/HEAD and hold both main and dev, so a run started on dev read
// dev as a feature branch, merged main into it and committed there.
//
// Preflight also puts the repository where the build belongs. The feature's author works
// on the base branch, so a full preflight started there checks out the feature branch —
// making it when it does not exist — and then merges the base into it; so does every
// later entry that finds itself on a feature branch. A later entry started ON the base
// branch — converge-feature closing out a feature implemented on the trunk — makes the
// feature branch at the base branch's HEAD and moves onto it (2026-09-25), so no stage of
// any run commits on the base branch. Without that merge the run plans
// against a spec the author has since moved and fails its final `merge --ff-only` after
// the whole run is paid for. It writes .specify/feature.json to match, because spec-kit's
// own scripts resolve the feature from that file (or SPECIFY_FEATURE_DIRECTORY) and
// never from the branch name.
//
// Review and analyze loops stop the run on a SURVIVOR only (owner's decision,
// 2026-09-24): a serious finding the reviewer labels, by `repeatOf`, as restating one
// an earlier fix round was handed. They end cleanly on a clean verdict, and at their
// round cap they do what converge does — apply the last round's findings and go on —
// with one final review after that fix whose only stop is a survivor, so no fix of a
// serious finding reaches the next stage unreviewed; its open findings are reported on
// the return as `ended: "round-cap"`, and the plan review's open blocking and major ones
// are handed to the first analysis as well. Until that day a cap reached with blocking findings
// open was needs-human, and nine of the eleven such stops on record were resolved by
// applying the findings unchanged: these loops have no fixed point either, so a cap
// buys a stop and not closure. The converge loop
// has no fixed point either (evidence.md, 2026-09-18), so its only stop
// test is a severity floor — the loop ends when the round's findings hold nothing
// above args.severityFloor — and reaching its round cap is a reported outcome the
// run carries to finish, not a human question; the wall is still the gate. The
// default floor is NONE: it tolerates no graded finding at all, so the only clean
// stop is a round that appends nothing and grades nothing, and a long run ends at
// maxConvergeRounds rather than at the floor (owner's decision 2026-09-18,
// reversing the LOW default of the same day; evidence.md). A round that reports
// "converged" while grading findings above the floor appended nothing, so every
// further round would repeat it identically — which under NONE is any finding at
// all. Until 2026-09-18 that was a needs-human exit, and it dead-ended the loop on
// cosmetic findings it could have closed itself (feature specs/002-product exited
// on four LOW findings — FR traceability citations, an under-described GATES.md
// table row, two test and naming wordings — every one of them mechanical). The
// loop now has a third move: it appends those findings itself as a forced
// convergence phase and implements them (the `forceAppend` tier row), because a
// floor that refuses converge's non-actionability judgment must also supply the
// work that judgment withheld. Each finding is forced at most once; a finding that
// comes back above the floor after its forced round did go to a human, and the
// handoff says the loop already tried. Like the review and analyze loops, converge
// runs one pass more than its cap — an assess-only round that appends nothing — so
// the findings the run reports are the ones no implement pass has closed.
//
// Every needs-human exit writes a handoff file first — HANDOFF.md in the feature
// directory — carrying the stage, the reason, the full findings rendered legibly,
// the branch, the round counts, the stages run, the run's date and where the
// machine-local run journal is found, committed on the feature branch and pushed when
// args.push is true. Gap observed 2026-09-18 on run wf_7e4e8726-4b5 (converge, three
// findings): the payload existed only in the invoking session's tool result, a /tmp
// file and the run journal under ~/.claude/projects/, so no colleague could reach it.
// The sandbox has no filesystem, so the write is one agent (the `handoff` tier row,
// opus low) dispatched on the way out; it is wrapped so that a handoff which fails,
// errors or returns nothing still yields the full needs-human payload, with the
// outcome recorded under `handoff` on the return. An exit before discovery has
// resolved a feature directory, or one taken on the base branch, writes nothing and
// says so there instead: there is no feature branch to carry the file, and a dirty
// tree is one of the states preflight refuses on, so a commit at the repo root — or
// on the base branch — would sweep it up. Since 2026-09-25 the only exits taken on the
// base branch are preflight's own, before it has moved the run onto the feature branch —
// a missing input artifact among them, checked before any branch is made — and an
// unresolved base branch or an unreadable or stale CLAUDE.md base-branch line, which stop
// before preflight's agent runs, commit nothing.

export const meta = {
  name: 'build-feature',
  description: 'Build one spec-kit feature from a finished spec with no human gate: plan, review, tasks, analyze, implement per phase, converge until clean, push',
  whenToUse: 'When a feature directory already holds the spec its domain expert wrote, and the project is a spec-kit project whose definition of done is one command',
  phases: [
    { title: 'Preflight', detail: 'feature directory, branch, repo state, definition of done' },
    { title: 'Plan', detail: 'plan, fresh-context review, fix' },
    { title: 'Tasks', detail: 'tasks, analyze, remediate' },
    { title: 'Implement', detail: 'one agent per phase, wall green after each' },
    { title: 'Converge', detail: 'converge, implement appended phase — or append the findings the round graded but did not append, once each — repeat until nothing above the severity floor is left' },
    { title: 'Finish', detail: 'wall, push, optional fast-forward merge' },
    { title: 'Handoff', detail: 'on a needs-human exit: write, commit and push HANDOFF.md in the feature directory' },
  ],
}

// ---------------------------------------------------------------------------
// Tiers. The roster is one model at three efforts — Opus low, Opus medium, Opus
// high (owner's decision, 2026-09-23: every subagent runs on Opus 5.5, no other
// model line) — and every row, from this table or from args.tiers, must be one of
// them; tier() refuses any other model, and xhigh or max, before the first agent
// starts. The model is the alias `opus`, not a pinned id: the Workflow authoring
// reference names no accepted values for agent()'s model, and the Agent tool's
// model takes aliases only. The alias resolves to the newest Opus, which is Opus
// 5.5 as of 2026-09-23, so a later Opus release moves every row with no edit here.
// The rationale per row is in SKILL.md.
// ---------------------------------------------------------------------------
const ROSTER = { opus: ['low', 'medium', 'high'] }

// The severity scale is /speckit-converge's own Step 5 scale, most severe first, and
// the same four values the analyze schema carries. args.severityFloor names the
// highest severity the converge loop tolerates. NONE is the default and tolerates
// nothing: it ranks below every graded severity, so every finding the assessment
// grades is above it. CRITICAL is not offerable: Step 5 defines it as a constitution
// MUST violation or a gap blocking a P1 user story, so a floor there tolerates every
// finding the scale has, stops the loop after one round, and is a foot-gun wearing
// the shape of a knob. The floor is checked beside the tier rows, so a bad one fails
// the run before the first agent starts rather than hours in at the converge stage.
const SEVERITY_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
const SEVERITY_FLOORS = ['HIGH', 'MEDIUM', 'LOW', 'NONE']
const TIERS = {
  preflight: { model: 'opus', effort: 'low' },
  plan: { model: 'opus', effort: 'high' },
  reviewPlan: { model: 'opus', effort: 'high' },
  fixPlan: { model: 'opus', effort: 'medium' },
  tasks: { model: 'opus', effort: 'medium' },
  analyze: { model: 'opus', effort: 'medium' },
  remediate: { model: 'opus', effort: 'medium' },
  remediateCritical: { model: 'opus', effort: 'medium' },
  phases: { model: 'opus', effort: 'low' },
  implement: { model: 'opus', effort: 'medium' },
  converge: { model: 'opus', effort: 'medium' },
  // Writes the tasks a converge round graded and declined to append. Unlike the
  // `handoff` row below, the document is not rendered for it: it is handed findings
  // and must author one task per finding — the imperative work that closes it and its
  // trace back to the finding's location. One closure route, the fix. Until 2026-09-20
  // a task carried a second, "record why it is not a defect", and on product-catalog
  // 004 every task of six forced rounds was closed by it while four of the findings
  // were fixable in code the same day; see evidence.md. That is authorship over text
  // the implement stage then executes, so it is priced with converge and implement
  // rather than with handoff: opus medium. A cheaper row would paraphrase a finding
  // into a task that closes on something else, and nothing downstream would notice.
  // Opus high was not taken: it is kept for plan and its refutation, the two rows
  // every later stage inherits from, and this row's output is implemented and
  // wall-checked rather than trusted.
  forceAppend: { model: 'opus', effort: 'medium' },
  // Runs only when a forced append reports it failed, and answers one question about
  // tasks.md: is the forced phase wholly absent, wholly present, or neither. Git is
  // the oracle — at that instant the only uncommitted change to tasks.md is the failed
  // agent's own partial write — so the evidence is deterministic, but the two things
  // this row must get right are not cheap. It may delete lines from tasks.md (only a
  // partial forced phase, only this round's), where a wrong deletion removes real
  // tasks and nothing downstream would notice; and it must return "unsure" rather
  // than a guess, which is a calibration judgment the low-effort rows are worst at.
  // Priced with every other row in this table that writes: opus medium. Its verdict is not
  // taken on its own word — the parse-only `phases` row re-reads the file afterwards
  // and the loop escalates where the two disagree.
  reconcileTasks: { model: 'opus', effort: 'medium' },
  // Runs only when a converge round offers a spec.md deferral the run has not checked
  // yet, and answers one question per quotation: is this text in spec.md. A text search
  // with no judgment in it, so the cheapest tier; its answer decides whether a finding
  // is exempt from forcing, and an exemption resting on a quotation spec.md does not
  // hold would let the assessment defer work by quoting plan.md or by inventing a line.
  checkDeferrals: { model: 'opus', effort: 'low' },
  finish: { model: 'opus', effort: 'low' },
  // Writes one file whose whole text this script hands it, commits it, pushes it.
  // Nothing here is a judgment, so it is priced at the cheapest tier in the roster;
  // the document is rendered in the script precisely so a tier this low cannot
  // paraphrase a finding or drop one.
  handoff: { model: 'opus', effort: 'low' },
}

const STAGES = ['preflight', 'plan', 'review-plan', 'tasks', 'analyze', 'implement', 'converge', 'finish']

// ---------------------------------------------------------------------------
// Args. Nothing is required: preflight discovers the feature directory, the branch
// and the definition-of-done command, and every argument below overrides what it
// would have found. A run on a checked-out feature branch whose spec.md is written
// takes no arguments at all.
// ---------------------------------------------------------------------------
const a = args && typeof args === 'object' ? args : {}

const cfg = {
  featureDir: a.featureDir || null, // discovered by preflight when absent
  branch: a.branch || null, // discovered by preflight when absent
  baseBranch: a.baseBranch || null, // discovered before preflight when absent; see resolveBase
  wall: a.wall || null, // definition-of-done command; preflight finds it in CLAUDE.md when null
  planGuidance: a.planGuidance || '',
  tasksGuidance: a.tasksGuidance || '',
  push: a.push !== false,
  mergeInto: a.mergeInto || null,
  from: a.from || 'preflight',
  until: a.until || 'finish',
  // 3, not 2, since 2026-09-18. The 2026-09-17 record (evidence.md) is five launches
  // out of seven ending needs-human at a review or analyze round cap, and the operator's
  // resolution every time was to run one more fix agent over the open findings — the
  // exact round the cap had refused. A cap that escalates work one more round would have
  // finished is the loop declining work it could do. 3 is the smallest increment the
  // evidence supports and the largest it supports: that record also says most of the
  // findings at the cap were holes opened by the previous round's fix, so these loops
  // have no fixed point either and a bigger cap buys rounds rather than closure — and
  // the artifact reviews are where both early runs spent their tokens (1.19M and
  // 0.91M). Measured 2026-09-22 over 28 run journals: six runs took a third round —
  // four at review-plan, one at review-spec, one at analyze — and all six still ended
  // needs-human at the cap, so the raise bought rounds and not closure. Raising it
  // further is the same trade at a higher price; the unmeasured half is the
  // counterfactual, whether a fourth round would have closed any of the six. Still
  // untaken on 2026-09-24, though it looked taken: the launching session applied the
  // fourth review's findings on seven review-plan stops and restarted at review-plan,
  // and that start ran no review until the same day, so no fifth review ever read them.
  // Since 2026-09-24 the cap no longer stops the run (reviewLoop below): it is the
  // number of ordinary fix rounds, after which one more fix and one final review run.
  maxReviewRounds: a.maxReviewRounds ?? 3,
  maxAnalyzeRounds: a.maxAnalyzeRounds ?? 3,
  maxConvergeRounds: a.maxConvergeRounds ?? 6,
  severityFloor: String(a.severityFloor ?? 'NONE').toUpperCase(),
  maxWallAttempts: a.maxWallAttempts ?? 3,
  tiers: Object.assign({}, TIERS, a.tiers || {}),
}
for (const key of ['from', 'until']) {
  if (!STAGES.includes(cfg[key])) throw new Error(`args.${key} must be one of ${STAGES.join(', ')}`)
}
if (STAGES.indexOf(cfg.from) > STAGES.indexOf(cfg.until)) throw new Error('args.from is after args.until')
if (!SEVERITY_FLOORS.includes(cfg.severityFloor)) {
  throw new Error(cfg.severityFloor === 'CRITICAL'
    ? 'args.severityFloor cannot be CRITICAL: a floor there tolerates every finding the scale grades, including a constitution MUST violation, and ends the loop after one round. The floor must be one of ' + SEVERITY_FLOORS.join(', ')
    : `args.severityFloor is "${cfg.severityFloor}", not one of ${SEVERITY_FLOORS.join(', ')}`)
}
// Preflight's checks are the only stage that resolves the definition-of-done command
// (its discovery half runs on every entry and reads the command out of CLAUDE.md only
// there; the base-branch agent reads CLAUDE.md on every entry, for its one line). A run that
// starts after it would hand every later prompt the literal string "null" as the command.
if (STAGES.indexOf(cfg.from) > STAGES.indexOf('preflight') && !cfg.wall) {
  throw new Error(`args.wall is required when starting from "${cfg.from}": preflight resolves it and is skipped`)
}

const runs = stage => {
  const i = STAGES.indexOf(stage)
  return i >= STAGES.indexOf(cfg.from) && i <= STAGES.indexOf(cfg.until)
}
const rosterText = Object.entries(ROSTER).map(([m, es]) => es.map(e => `${m} ${e}`).join(', ')).join(', ')
const tier = name => {
  const t = cfg.tiers[name]
  if (!t || !t.model || !t.effort) throw new Error(`tiers.${name} must be {model, effort}`)
  if (!(ROSTER[t.model] || []).includes(t.effort)) {
    throw new Error(`tiers.${name} is "${t.model} ${t.effort}", outside the roster: ${rosterText}`)
  }
  return { model: t.model, effort: t.effort }
}
// Every row is checked here, not when its stage runs, so a row outside the roster
// fails the run before the first agent starts rather than hours in.
for (const name of Object.keys(cfg.tiers)) tier(name)

// ---------------------------------------------------------------------------
// Schemas — every stage returns data, never prose.
// ---------------------------------------------------------------------------
// One field, one description, on every stage that can write a task or resolve a
// finding: the review-plan fixer, the tasks stage and the analyze remediator (S.done),
// and since 2026-09-24 the converge assessment and the forced append. Every stage that
// returns it is read by the script and stops the run on a non-empty list — a field the
// schema says stops the run and the script ignores is the defect 211809f fixed.
const SPEC_CHANGES_FIELD = {
  type: 'array',
  items: { type: 'string' },
  description: 'findings whose only remedy is an edit to the feature\'s spec.md, which no stage of this run may make: one entry per finding, naming the requirement or section and the change the spec needs. Each one stops the run and goes to the spec\'s author, so put here only what cannot be resolved in the artifacts you may write.',
}

// Identity across rounds for the review and analyze loops (2026-09-24), on converge's
// precedent: the reviewer or analyzer is handed the numbered list of findings earlier
// fix rounds were handed, and labels each finding it returns with the entry it restates.
// The script, not the agent's prose, decides from this field whether a finding survived.
const REPEAT_OF_FIELD = {
  type: 'integer',
  description: 'the number of the earlier-round finding this one restates, from the numbered list in the prompt; 0 or absent when it is new or no list was given',
}

const S = {
  preflight: {
    type: 'object',
    required: ['ok', 'branch', 'baseBranch', 'featureDir', 'wall', 'onBaseBranch', 'synced', 'clarifications', 'missingInputs', 'checkedTasks', 'openTasks', 'problems'],
    properties: {
      ok: { type: 'boolean' },
      branch: { type: 'string', description: 'the branch checked out when you finish, which is the feature branch whenever you checked one out or made one' },
      baseBranch: { type: 'string', description: 'the base branch you worked against: the one step 2 names' },
      onBaseBranch: { type: 'boolean', description: 'true when the branch you finish on is the base branch' },
      featureDir: {
        type: 'string',
        description: 'repo-relative feature directory holding spec.md, e.g. specs/003-product-version; empty when it could not be resolved or holds no readable spec.md',
      },
      candidates: {
        type: 'array',
        items: { type: 'string' },
        description: 'when the feature had to be resolved by looking under specs/ and the answer was not exactly one directory: every directory you considered, with what made it a candidate or not. Empty otherwise.',
      },
      createdBranch: { type: 'boolean', description: 'true only when you created the feature branch in this run' },
      checkedOut: { type: 'string', description: 'the branch you checked out, empty when you checked nothing out' },
      synced: {
        type: 'string',
        enum: ['none', 'fast-forward', 'merge', 'conflict', 'not-applicable'],
        description: '"not-applicable" when the branch you finish on is the base branch or no base branch is known; "none" when the base was already an ancestor; otherwise what you did, or "conflict" when the merge was aborted',
      },
      specChanged: { type: 'boolean', description: 'true only when the sync brought a change to the feature\'s spec.md' },
      conflicts: { type: 'array', items: { type: 'string' }, description: 'the conflicted paths when synced is "conflict", empty otherwise' },
      featureJson: {
        type: 'string',
        enum: ['written', 'unchanged', 'tracked', 'unknown'],
        description: 'what you did with .specify/feature.json: "written" when you pointed it at the resolved feature, "unchanged" when it already named it, "tracked" when the repository tracks the file so you left it alone',
      },
      wall: { type: 'string', description: 'the definition-of-done command, empty when none was found' },
      clarifications: {
        type: 'array',
        items: { type: 'string' },
        description: 'every "[NEEDS CLARIFICATION]" marker still in spec.md, quoted with its line number; empty when there are none',
      },
      missingInputs: {
        type: 'array',
        items: { type: 'string' },
        description: 'the repo-relative path of every input artifact the prompt told you to check that is missing or empty; empty when all are present, or when the prompt names none to check',
      },
      checkedTasks: {
        type: 'array',
        items: { type: 'string' },
        description: 'the id (e.g. T012) of every task the feature\'s tasks.md holds ticked, "- [x]" or "- [X]", in file order; empty when the file does not exist, ticks nothing, or the prompt says to return it empty',
      },
      openTasks: {
        type: 'array',
        items: { type: 'string' },
        description: 'the id of every task the feature\'s tasks.md holds open, "- [ ]", in file order; empty when the file does not exist, holds none, or the prompt says to return it empty',
      },
      problems: { type: 'array', items: { type: 'string' } },
    },
  },
  // The base branch, when args.baseBranch is absent: three read-only facts, printed by
  // commands and returned verbatim, from which the script — not the agent — decides the
  // base (resolveBase), before any agent writes.
  baseFacts: {
    type: 'object',
    required: ['claudeMdLines', 'originHead', 'localBranches'],
    properties: {
      claudeMdLines: { type: 'array', items: { type: 'string' }, description: 'every line step 1\'s grep printed, exactly as printed, in order; empty when it printed nothing or CLAUDE.md does not exist at HEAD' },
      originHead: { type: 'string', description: 'what `git symbolic-ref --short refs/remotes/origin/HEAD` printed, e.g. origin/main; empty when the command failed or printed nothing' },
      localBranches: { type: 'array', items: { type: 'string' }, description: 'every line `git for-each-ref --format=\'%(refname)\' refs/heads/` printed, e.g. refs/heads/dev, in order' },
    },
  },
  review: {
    type: 'object',
    required: ['verdict', 'findings'],
    properties: {
      verdict: { type: 'string', enum: ['approve', 'fix'] },
      findings: {
        type: 'array',
        items: {
          type: 'object',
          required: ['severity', 'artifact', 'location', 'problem', 'fix'],
          properties: {
            severity: { type: 'string', enum: ['blocking', 'major', 'minor'] },
            artifact: { type: 'string', description: 'repo-relative path of the file the finding is in' },
            location: { type: 'string', description: 'heading, requirement id or line' },
            problem: { type: 'string' },
            fix: { type: 'string', description: 'the concrete edit that resolves it' },
            repeatOf: REPEAT_OF_FIELD,
          },
        },
      },
    },
  },
  done: {
    type: 'object',
    required: ['done', 'summary'],
    properties: {
      done: { type: 'boolean' },
      summary: { type: 'string' },
      commit: { type: 'string', description: 'short sha of the commit that holds the work, empty if nothing was committed' },
      skipped: { type: 'array', items: { type: 'string' }, description: 'findings not applied, each with the reason' },
      specChanges: SPEC_CHANGES_FIELD,
    },
  },
  // The tasks stage in update mode (2026-09-25): what it changed, task by task, so the
  // return value carries the delta and the certification below has something to hold
  // the file against.
  tasksUpdated: {
    type: 'object',
    required: ['done', 'summary', 'reopened', 'removed', 'added'],
    properties: {
      done: { type: 'boolean' },
      summary: { type: 'string' },
      commit: { type: 'string', description: 'short sha of the commit that holds the update, empty if nothing was committed' },
      reopened: {
        type: 'array',
        description: 'every ticked task you unticked, with the reason written in its line',
        items: { type: 'object', required: ['taskId', 'reason'], properties: { taskId: { type: 'string' }, reason: { type: 'string' } } },
      },
      removed: {
        type: 'array',
        description: 'every task you marked removed, ticked or not, with the reason written in its line',
        items: { type: 'object', required: ['taskId', 'reason'], properties: { taskId: { type: 'string' }, reason: { type: 'string' } } },
      },
      added: { type: 'array', items: { type: 'string' }, description: 'the id of every task you added' },
      specChanges: SPEC_CHANGES_FIELD,
    },
  },
  // The parse-only certification of an update: the state of every task that was ticked
  // before it. The agent that edited the file is not the one that certifies it.
  tasksCertified: {
    type: 'object',
    required: ['tasks'],
    properties: {
      tasks: {
        type: 'array',
        description: 'one entry per task id the prompt listed, in its order',
        items: {
          type: 'object',
          required: ['taskId', 'state'],
          properties: {
            taskId: { type: 'string' },
            state: { type: 'string', enum: ['checked', 'reopened', 'removed', 'unchecked', 'missing'] },
            reason: { type: 'string', description: 'for reopened and removed: the reason the line carries, quoted; empty otherwise' },
          },
        },
      },
    },
  },
  analysis: {
    type: 'object',
    required: ['findings', 'coverage'],
    properties: {
      findings: {
        type: 'array',
        items: {
          type: 'object',
          required: ['id', 'severity', 'artifact', 'location', 'summary', 'recommendation'],
          properties: {
            id: { type: 'string' },
            severity: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
            artifact: { type: 'string', enum: ['spec', 'plan', 'tasks', 'constitution', 'other'] },
            location: { type: 'string' },
            summary: { type: 'string' },
            recommendation: { type: 'string' },
            repeatOf: REPEAT_OF_FIELD,
          },
        },
      },
      coverage: { type: 'string', description: 'requirements with at least one task, as "n/m"' },
    },
  },
  phases: {
    type: 'object',
    required: ['phases'],
    properties: {
      phases: {
        type: 'array',
        items: {
          type: 'object',
          required: ['number', 'title', 'taskIds', 'unchecked'],
          properties: {
            number: { type: 'integer' },
            title: { type: 'string' },
            taskIds: { type: 'array', items: { type: 'string' } },
            unchecked: { type: 'integer', description: 'how many of taskIds are still "- [ ]"' },
          },
        },
      },
    },
  },
  implemented: {
    type: 'object',
    required: ['wallGreen', 'unchecked', 'summary'],
    properties: {
      wallGreen: { type: 'boolean' },
      unchecked: { type: 'array', items: { type: 'string' }, description: 'task ids of this phase still unchecked' },
      summary: { type: 'string' },
      commit: { type: 'string' },
      wallOutput: { type: 'string', description: 'the failing part of the wall output when wallGreen is false' },
      blocked: {
        type: 'array',
        description: 'forced convergence phases only: one entry per task left unchecked because its fix is blocked, with the blocker quoted',
        items: {
          type: 'object',
          required: ['taskId', 'blocker'],
          properties: {
            taskId: { type: 'string' },
            blocker: { type: 'string', description: 'the requirement or constitution article that forbids the fix, quoted with its id; the system outside this repository that does not exist; or the change the feature\'s spec.md would need, which no stage of this run makes' },
          },
        },
      },
    },
  },
  converged: {
    type: 'object',
    required: ['outcome', 'findings', 'summary'],
    properties: {
      outcome: { type: 'string', enum: ['converged', 'tasks_appended'] },
      phase: { type: 'integer', description: 'the appended phase number when outcome is tasks_appended' },
      taskIds: { type: 'array', items: { type: 'string' } },
      findings: {
        type: 'array',
        description: 'every gap the assessment found, appended or not, including the ones it judged non-actionable',
        items: {
          type: 'object',
          required: ['severity', 'location', 'summary'],
          properties: {
            // /speckit-converge's own Step 5 scale, which is also the four values the
            // analyze schema carries; a third vocabulary is not admitted.
            severity: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
            location: { type: 'string', description: 'the requirement id, plan section or file the gap is against' },
            summary: { type: 'string' },
            taskId: { type: 'string', description: 'the appended task that closes it, empty if none was appended' },
            repeatOf: { type: 'integer', description: 'the number of the already-forced finding this one restates, from the numbered list in the prompt; 0 or absent when it is new or no list was given' },
            deferredBy: {
              type: 'string',
              description: 'only when spec.md itself defers this item or puts it outside this feature\'s scope: that spec.md text, quoted verbatim with its section or line. Empty otherwise. A deferral, scope boundary or named gap written anywhere but spec.md — plan.md, tasks.md, research.md, docs/GATES.md, specs/trace-waivers.tsv — does not count and leaves this empty.',
            },
          },
        },
      },
      specChanges: SPEC_CHANGES_FIELD,
      summary: { type: 'string' },
    },
  },
  forceAppended: {
    type: 'object',
    required: ['appended', 'phase', 'tasks'],
    properties: {
      appended: {
        type: 'boolean',
        description: 'true only when the new phase and one task per finding are in tasks.md on disk and committed',
      },
      phase: { type: 'integer', description: 'the appended phase number' },
      tasks: {
        type: 'array',
        description: 'one entry per finding this prompt handed you, in the order it gave them — a finding with no task is a failed append, not an omission to report here. Empty when you returned specChanges, because then you append nothing',
        items: {
          type: 'object',
          required: ['taskId', 'location'],
          properties: {
            taskId: { type: 'string', description: 'the appended task id, e.g. T104' },
            location: { type: 'string', description: "the finding's location, copied from the prompt, so the task is traceable to the finding it was written from" },
          },
        },
      },
      commit: { type: 'string', description: 'short sha of the commit that holds tasks.md, empty if nothing was committed' },
      note: { type: 'string', description: 'when appended is false, why; otherwise anything the writer had to decide' },
      specChanges: SPEC_CHANGES_FIELD,
    },
  },
  reconciled: {
    type: 'object',
    required: ['state', 'evidence', 'summary'],
    properties: {
      state: {
        type: 'string',
        enum: ['absent', 'present', 'unsure'],
        description: 'the state tasks.md is in when you finish: "absent" — it holds no part of the forced phase for this round and is well-formed; "present" — it holds the whole forced phase, well-formed, one task per finding, none of them ticked; "unsure" — you could not establish either with confidence, including any case where you cannot tell a line of the partial phase from work that was already there. "unsure" is a correct answer and the run handles it; a guess is not recoverable.',
      },
      phase: { type: 'integer', description: 'the forced phase number when state is present, 0 otherwise' },
      taskIds: { type: 'array', items: { type: 'string' }, description: 'the forced phase task ids when state is present, empty otherwise' },
      removed: { type: 'boolean', description: 'true when you removed a partial forced phase to reach the absent state, false when the file already held none' },
      commit: { type: 'string', description: 'short sha of the commit that holds a removal, empty when nothing was committed' },
      evidence: { type: 'string', description: 'what the verdict rests on, quoted: the git status, diff and log lines you read and the tasks.md lines you saw. A person reading a handoff gets this instead of being sent to look at the file.' },
      summary: { type: 'string' },
    },
  },
  deferralsChecked: {
    type: 'object',
    required: ['checks'],
    properties: {
      checks: {
        type: 'array',
        description: 'one entry per numbered quotation in the prompt',
        items: {
          type: 'object',
          required: ['n', 'found'],
          properties: {
            n: { type: 'integer', description: 'the number of the quotation, as the prompt numbered it' },
            found: { type: 'boolean', description: 'true only when the quoted text is in spec.md' },
            line: { type: 'string', description: 'the spec.md line number and line where it was found; empty when not found' },
          },
        },
      },
    },
  },
  handoff: {
    type: 'object',
    required: ['written', 'path'],
    properties: {
      written: { type: 'boolean', description: 'true only when the whole document is on disk at path' },
      path: { type: 'string', description: 'repo-relative path written, empty when written is false' },
      commit: { type: 'string', description: 'short sha of the commit that holds it, empty if nothing was committed' },
      pushed: { type: 'boolean' },
      note: { type: 'string', description: 'when written is false, why; otherwise anything the writer had to decide' },
    },
  },
  finished: {
    type: 'object',
    required: ['wallGreen', 'clean', 'allTasksChecked', 'pushed', 'merged', 'head', 'summary'],
    properties: {
      wallGreen: { type: 'boolean' },
      clean: { type: 'boolean' },
      allTasksChecked: { type: 'boolean' },
      pushed: { type: 'boolean' },
      merged: { type: 'boolean' },
      head: { type: 'string' },
      summary: { type: 'string' },
    },
  },
}

// ---------------------------------------------------------------------------
// Prompt fragments
// ---------------------------------------------------------------------------
const UNATTENDED = [
  'UNATTENDED RUN. No human is present and nothing you print reaches one.',
  'Never ask a question, never wait for a reply, never stop for a confirmation, never present options.',
  'Where a skill tells you to ask the user, decide yourself by the rule this prompt gives, apply the decision, and write it down in the artifact.',
  'Where a skill says a hook is optional, run it. Where a skill offers a remediation, do not offer it: return the findings as data.',
  'Your final message is not read by a person: it is the return value, and it must match the schema you were given.',
].join(' ')

// The spec belongs to the domain expert who wrote it, and this run reads it and never
// writes it (owner's decision, 2026-09-21: features are specified by a person in the
// project with stock spec-kit, and the unattended build starts at plan). Every stage
// that could reach the file is handed this, in these words, so the ban reads the same
// wherever an agent meets it; the stages that can return a finding carry `specChanges`
// beside it, which is the route out — the run stops and the finding goes to the author.
const SPEC_IS_NOT_OURS = spec =>
  `THE SPEC IS NOT YOURS TO EDIT. \`${spec}\` was written by the feature's domain expert and is the fixed input to this run: never edit it, never regenerate it, never "align" it with anything, and never add, reword, renumber or delete a requirement, a success criterion, a clarification or an assumption in it. Every other artifact under the feature directory is yours to fix.`

// A task is work an implement agent can finish. On reference-data 003, 2026-09-23, an
// analysis remediation added T104 — "check that spec.md's Clarifications carries a
// /speckit-clarify session, run by the spec's owner and dated after this plan" — and
// gated two closing tasks on it, so the run built eight phases wall-green and then
// stopped at implement on a task no agent could close; the owner then confirmed every
// reading the plan had already taken, unchanged. The plan decides an open reading and
// records it (the "Unattended" rule); a question only the author can answer is a
// `specChanges` entry, which stops the run where it is found rather than after implement.
// Carried by every stage that writes tasks: tasks and remediate, and since 2026-09-24
// converge and the forced append, which until then could write the same gating task.
// Every one of them returns `specChanges` and the script reads it, so the constant no
// longer offers a stage without the field a way to leave the question out.
const NO_TASK_WAITS_ON_A_PERSON =
  'No task may wait on a person: never write a task whose completion needs an owner\'s answer, a /speckit-clarify session, a sign-off or a review by anyone outside this run, and never make another task depend on one. A reading of the spec that the plan has already decided and recorded stands as the plan wrote it; a question only the spec\'s author can answer is not a task — it goes in `specChanges`, which stops the run and takes it to that author.'

// A task the tasks stage's update mode (2026-09-25) found no longer needed. Spec-kit's
// checklist format has no such state — a task is "- [ ]" or "- [x]" — and both are wrong
// for it: an open box is work implement would run and the traceability gate counts as in
// flight, a ticked one claims work that was not done. So the box goes and the line stays,
// struck through with its reason. The id stays in the file, so /speckit-converge's append
// contract ("scan all existing task IDs; let M be the maximum") never reuses it, and no
// checkbox pattern — speckit-implement's, the service repos' OPEN_TASK — matches the line.
// Every stage that counts or runs tasks is told the same, in these words.
//
// The line keeps the id and drops the task's text, continuation lines included, and names
// no FR or SC id (adversarial review, 2026-09-25). The service repos' traceability gate
// reads every id token anywhere in tasks.md, not only on task lines: a qualified or bare id
// the spec no longer defines is a failing citation (its checks b and b2), and one it still
// defines counts as "named by some task" (its check g). So a removed line that kept its
// text turned the wall red whenever the spec edit deleted the requirement — the commonest
// reason a task is removed — and otherwise hid a requirement no live task names. Run
// against copies of reference-data's check-traceability.mjs (identical in product-catalog
// and customer-party-adapter): the text-keeping line failed on a deleted id and passed a
// requirement only it named. The task's text is in the update commit's parent.
const REMOVED_TASK = 'A line of tasks.md whose checkbox is replaced by its task id struck through and which carries "(removed: <reason>)" — `- ~~T015~~ (removed: …)` — is a removed task: it is not a task, it is neither open nor done, it covers no requirement, and its id is never reused.'
const REMOVED_LINE = '`- ~~T015~~ (removed: <what the task was for, and what in the spec or plan makes it unneeded>)`'

// Stock spec-kit resolves the feature from SPECIFY_FEATURE_DIRECTORY, then from
// .specify/feature.json, and never from the branch name (its own common.sh:
// get_current_branch() returns $SPECIFY_FEATURE or nothing and reads no git). Preflight
// normally points that file at the resolved feature, which is the whole fix — the file
// is git-ignored state. Where a repository tracks it instead, preflight leaves it alone
// and every stage that invokes a speckit skill carries the variable instead, because
// rewriting a tracked file would dirty a tree the run is about to commit from.
const FEATURE_CONTEXT = () => state.featureJsonTracked
  ? `This repository tracks \`.specify/feature.json\`, so it was not rewritten and may name another feature. Spec-kit resolves the feature from \`SPECIFY_FEATURE_DIRECTORY\` before it reads that file, so export \`SPECIFY_FEATURE_DIRECTORY=${state.featureDir}\` in every shell you run a spec-kit script or hook in, in the same command. Never work in a feature directory other than ${state.featureDir}, whatever a script resolves.`
  : ''

const SKILL_HOW = name =>
  `Invoke the skill \`${name}\` with the Skill tool. If the Skill tool is not available to you, read \`.claude/skills/${name}/SKILL.md\` and follow it exactly as that skill, hooks included.`

const featurePaths = dir => ({
  spec: `${dir}/spec.md`,
  plan: `${dir}/plan.md`,
  tasks: `${dir}/tasks.md`,
  research: `${dir}/research.md`,
  dataModel: `${dir}/data-model.md`,
  contracts: `${dir}/contracts/`,
  quickstart: `${dir}/quickstart.md`,
  checklists: `${dir}/checklists/`,
})

const CONSTITUTION = '.specify/memory/constitution.md'

// The traceability convention's qualification prefix — feature ids are per-feature
// and collide across features, so every citation outside the feature's own specs/
// directory is qualified NNN/FR-nnn or NNN/SC-nnn. featureDir is specs/<NNN>-<name>;
// falling back to 'NNN' rather than throwing lets a caller with a differently-shaped
// featureDir still get a prompt, just one that names the placeholder instead of a number.
const featureNum = dir => (/^specs\/(\d+)-/.exec(dir || '') || [])[1] || 'NNN'

const findingsBlock = findings =>
  findings.map((f, i) => `${i + 1}. [${f.severity}] ${f.artifact} — ${f.location}\n   Problem: ${f.problem}\n   Fix: ${f.fix}`).join('\n')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const state = {
  featureDir: cfg.featureDir,
  branch: cfg.branch,
  baseBranch: cfg.baseBranch,
  baseBranchSource: cfg.baseBranch ? 'arg' : null, // 'arg', 'claude-md', 'origin-HEAD' or 'fallback' once resolved
  onBaseBranch: false, // set by preflight; no handoff is committed while it is true
  createdBranch: false, // set by preflight; true when this run made the feature branch
  checkedTasks: [], // set by preflight when the tasks stage runs: ids ticked in tasks.md before it
  openTasks: [], // set by preflight with checkedTasks: ids open in tasks.md before it
  tasksUpdate: null, // { checkedBefore, kept, reopened, removed, added, commit } once an update ran
  featureJsonTracked: false, // set by preflight; true means the stages carry the env var instead
  handoffRefused: null, // set when preflight made a branch it was told not to; no handoff is committed on it
  wall: cfg.wall,
  rounds: { reviewPlan: 0, analyze: 0, converge: 0 },
  converge: null, // { ended, rounds, findings } once the converge stage has run
  reviewPlan: null, // { ended, rounds, findings } once the review-plan loop has run
  analysis: null, // { ended, rounds, findings } once the analyze loop has run
  implemented: [],
  finishRepaired: false, // true once the finish wall was red and the one repair pass ran
  open: [],
  stagesRun: [],
}

// ---------------------------------------------------------------------------
// The handoff artifact.
//
// A needs-human exit is a decision handed back to a person, and until 2026-09-18 it
// was handed back only to the session that started the run: the payload lived in
// that session's tool result, in a file under /tmp, and in the run journal under
// ~/.claude/projects/ — three machine-local places, none of them in the repository.
// Run wf_7e4e8726-4b5 stopped at converge with three findings no colleague could
// read. So every needs-human exit now leaves one committed file behind.
//
// The document is rendered here rather than described to the agent. The sandbox has
// no filesystem, so an agent must do the write; making that agent compose the report
// would let the cheapest tier in the table paraphrase a finding, reorder it or drop
// it. It gets finished Markdown and one placeholder it can only substitute, the date,
// because the script has no Date.
//
// It names no journal path (2026-09-24). The script has no handle on its own run id —
// the Workflow API gives a script none — and until that day the handoff agent took the
// newest wf_*.json on disk, which on 25 of 27 handoffs was an earlier run's journal or
// nothing, because the running journal is, by inference, not yet written. A durable
// file stating a false path is worse than one stating where the true one is kept: the
// run id is on the Workflow tool result the launching session received.
// ---------------------------------------------------------------------------
const HANDOFF_FILE = 'HANDOFF.md'

const scalar = v => (typeof v === 'string' ? v : JSON.stringify(v))

// One renderer for every detail payload the needsHuman() call sites pass: a list of
// strings (problems, unchecked task ids), a list of finding objects on any of the
// three finding shapes this script carries, or a plain object ({unchecked, wallOutput}).
// Unknown keys are printed rather than skipped — a reader who was not in the session
// is owed everything the stage returned, not the fields this function knew about.
const renderFinding = (f, i) => {
  const head = [f.severity ? `[${f.severity}]` : '', f.id || '', f.artifact || '', f.location || '']
    .filter(Boolean).join(' — ')
  const seen = { severity: 1, id: 1, artifact: 1, location: 1 }
  const body = []
  for (const key of ['summary', 'problem', 'recommendation', 'fix', 'taskId']) {
    seen[key] = 1
    if (f[key] !== undefined && f[key] !== null && f[key] !== '') body.push(`   - ${key}: ${scalar(f[key])}`)
  }
  for (const key of Object.keys(f)) {
    if (!seen[key] && f[key] !== undefined && f[key] !== null && f[key] !== '') body.push(`   - ${key}: ${scalar(f[key])}`)
  }
  return [`${i + 1}. ${head || '(no location given)'}`].concat(body).join('\n')
}

const detailBlock = detail => {
  if (detail === null || detail === undefined) return '_The stage returned no detail payload._'
  if (Array.isArray(detail)) {
    if (!detail.length) return '_The stage returned an empty list._'
    return detail.map((d, i) => (d && typeof d === 'object' ? renderFinding(d, i) : `${i + 1}. ${scalar(d)}`)).join('\n')
  }
  if (typeof detail === 'object') {
    return Object.keys(detail).map(key => {
      const v = detail[key]
      if (Array.isArray(v)) return `- ${key}: ${v.length ? v.map(scalar).join(', ') : '(none)'}`
      if (v === '' || v === null || v === undefined) return `- ${key}: (empty)`
      if (typeof v === 'object') return `- ${key}:\n\n\`\`\`json\n${JSON.stringify(v, null, 2)}\n\`\`\`\n`
      if (typeof v === 'string' && v.indexOf('\n') !== -1) return `- ${key}:\n\n\`\`\`\n${v}\n\`\`\`\n`
      return `- ${key}: ${scalar(v)}`
    }).join('\n')
  }
  return scalar(detail)
}

// An exit whose restart is not its own stage says so in its detail — the preflight exit
// for a missing input artifact, whose restart is the stage that writes it — and the
// document's restart paragraph follows it rather than contradicting the reason.
// Every exit whose whole remedy is a change to spec.md passes `restartFrom` itself —
// "review-plan" since 2026-09-24 — and the return value carries it beside `stage`.
const restartOf = detail => (detail && !Array.isArray(detail) && typeof detail === 'object' && STAGES.includes(detail.restartFrom) ? detail.restartFrom : null)
const restartAt = (detail, restartFrom) => (STAGES.includes(restartFrom) ? restartFrom : restartOf(detail))

// The restart after a spec edit (owner's decision, 2026-09-24). `from: "review-plan"`
// reads the plan already on the branch against the edited spec and repairs it in place;
// `from: "plan"` regenerates plan.md whole and discards every review fix, and on eight
// restarts that way the regenerated plan hit a fresh review-plan cap five times.
const SPEC_EDIT_RESTART = 'review-plan'

// Where the base branch came from, for the handoff table and the preflight prompt.
const BASE_SOURCE_TEXT = {
  arg: 'passed as `baseBranch`',
  'claude-md': 'read from the `Base branch:` line of the repository root\'s `CLAUDE.md`, as committed on the branch the run started on',
  'origin-HEAD': 'read from `origin/HEAD`',
  fallback: 'the one local branch among `main`, `master`, `develop` and `dev`; the repository sets no `origin/HEAD`',
}
const baseSourceText = src => BASE_SOURCE_TEXT[src] || 'source unknown'

const handoffDoc = (stage, why, detail, restartFrom) => [
  `# Handoff — the unattended build of ${state.featureDir} stopped at ${stage}`,
  '',
  `**This run has stopped.** \`build-feature\` runs the spec-kit cycle with no human gate: it reached the \`${stage}\` stage, found something no rule its own agents carry can decide, and ended there. Nothing reported below was fixed by the run.`,
  '',
  `**Who resolves this.** The session that launched the run reads it first. Under \`build-feature\`'s resolution rule it forms a recommendation for each item under *What the stage reported* and acts on every one it holds with high confidence — the recommendation it would hand you expecting you to take it unchanged, resting on the spec, the constitution, the code and the evidence quoted here, never on this run's own plan or tasks, which were written from the spec. It records what it did and what the confidence rested on in \`RESOLUTIONS.md\` beside this file, and restarts the run (below). It brings an item to you only where it does not hold a recommendation with high confidence, where the item came back after its resolution was applied once, or where the only resolution is a move the skill forbids outright — weakening a gate, deleting a test, committing on the base branch, or resolving somebody else's uncommitted work or merge conflict. **If you are a person reading this, read \`RESOLUTIONS.md\` first:** what is left for you is what the session could not settle. Outside these two files the report exists only on the machine that ran it.`,
  '',
  '| | |',
  '|---|---|',
  `| Stopped at stage | \`${stage}\` |`,
  `| Reason | ${why} |`,
  `| Feature directory | \`${state.featureDir}\` |`,
  `| Branch | \`${state.branch || '(unknown)'}\`${state.createdBranch ? ` — made by this run from \`${state.baseBranch || 'the base branch'}\`` : ''} |`,
  `| Base branch | \`${state.baseBranch || '(unknown)'}\`${state.baseBranch ? ` — ${baseSourceText(state.baseBranchSource)}` : ''} |`,
  `| Stages run | ${state.stagesRun.length ? state.stagesRun.join(' → ') : '(none)'} |`,
  `| Rounds | ${Object.keys(state.rounds).map(k => `${k} ${state.rounds[k]}`).join(', ')} |`,
  `| Definition of done | \`${state.wall || '(not resolved)'}\` |`,
  `| Converge severity floor | \`${cfg.severityFloor}\` |`,
  '| Run date | {{RUN_DATE}} |',
  '',
  '## What the stage reported',
  '',
  detailBlock(detail),
  '',
  '## Restarting the run',
  '',
  `Once the decision is applied, check out \`${state.branch || 'the feature branch'}\` and restart ${restartAt(detail, restartFrom) && restartAt(detail, restartFrom) !== stage ? 'at the stage the reason names' : 'at this stage'} through the \`build-feature\` skill with \`from: "${restartAt(detail, restartFrom) || stage}"\` and \`wall: "${state.wall || ''}"\`; \`wall\` is required on any start after preflight, and the feature directory and branch are discovered from the checkout unless you pass \`featureDir: "${state.featureDir}"\` and \`branch: "${state.branch || ''}"\`. A decision that was a change to \`${state.featureDir}/spec.md\` restarts at \`from: "${SPEC_EDIT_RESTART}"\`, whatever stage stopped: that start reads the plan already on the branch against the edited spec and repairs it in place, and every stage after it runs again over the result. \`from: "plan"\` regenerates the plan whole and discards every review fix; it is there for a person who wants that. To replay this run instead of restarting it, pass \`resumeFromRunId\` with this run's id (below).`,
  '',
  '## Run journal',
  '',
  'This file names no journal path, because the run cannot see its own id. The run id — `wf_…` — is on the Workflow tool result the launching session received, and the session that resolves this stop records it in `RESOLUTIONS.md`. On the machine that ran it, the journal is `~/.claude/projects/<the project directory, every / replaced by ->/<session id>/workflows/<run id>.json`, and it holds every agent prompt and every agent return value of this run. It is machine-local and is not in this repository: if you are reading this anywhere else, this file is the whole of what the run reported.',
  '',
  `_Written by \`build-feature\`'s handoff stage. The next needs-human exit on this feature overwrites it; \`git log -p -- ${state.featureDir}/${HANDOFF_FILE}\` holds the earlier ones._`,
].join('\n')

// Returns the handoff record for the return value and never throws: a handoff that
// fails must not cost the caller the verdict, because losing the findings because the
// write failed is strictly worse than the behaviour this replaced. Every failure path
// — no feature directory, a thrown dispatch, a skipped or dead agent, an agent that
// reports it could not write — ends in a record saying so, and the caller returns its
// full payload regardless.
const writeHandoff = async (stage, why, detail, restartFrom) => {
  // Every preflight exit lands here: no feature has been created, so there is no
  // feature directory and no feature branch to carry the file. The write is skipped
  // rather than aimed at the repo root. A preflight refusal is a repo-state fact the
  // next person reproduces in one command — a dirty tree, the wrong branch, a missing
  // speckit skill, no definition-of-done command — not a finding that exists nowhere
  // else; and a dirty tree is one of the things preflight refuses on, so a commit at
  // the root would sweep somebody's uncommitted work into a handoff commit.
  if (!state.featureDir) {
    log(`no handoff file: the run stopped at ${stage} before a feature directory was resolved; the detail on the return value is the whole report`)
    return { written: false, path: null, note: 'no feature directory — the run stopped before discovery resolved one, so there is nowhere in the repo the file belongs. The detail on this return value is the whole report.' }
  }
  // The file is committed on whatever branch the run is standing on, so a run that
  // never left the base branch gets no handoff, and neither does one on a detached HEAD,
  // where the commit would be on no branch at all and `git push origin HEAD` refuses.
  // Since 2026-09-25 a base-branch exit is only a preflight exit taken before preflight
  // moved the run onto the feature branch — a dirty tree, a
  // feature that cannot be resolved, a feature branch that already holds work the base
  // branch lacks, an input artifact missing on the branch the run would work on — because
  // every other run is on the feature branch by then, a later-stage
  // start on the trunk included. A commit on the trunk is not this script's to make, and a
  // dirty tree is one of the states preflight refuses on.
  if (state.branch === 'HEAD') {
    log('no handoff file: the checkout is a detached HEAD, where a commit is on no branch; the detail on the return value is the whole report')
    return { written: false, path: null, note: 'the checkout is a detached HEAD, and a handoff is committed on the branch the run is on — there is none. The detail on this return value is the whole report.' }
  }
  if (state.onBaseBranch) {
    log(`no handoff file: the run is standing on the base branch (${state.baseBranch || 'unknown'}), where this script commits nothing; the detail on the return value is the whole report`)
    return { written: false, path: null, note: `the run is on the base branch (${state.baseBranch || 'unknown'}), and a handoff is committed on the branch the run is on — this script does not commit to the trunk. The detail on this return value is the whole report.` }
  }
  // No base branch resolved (2026-09-25): the run stopped before preflight's agent ran, so
  // it does not know whether it stands on the trunk, and commits nothing anywhere.
  if (!state.baseBranch) {
    log('no handoff file: no base branch was resolved, so the run does not know whether it stands on the trunk; the detail on the return value is the whole report')
    return { written: false, path: null, note: 'no base branch was resolved, so the run stopped before preflight could tell whether the checkout is the trunk, and it commits nothing on a branch it cannot place. The detail on this return value is the whole report.' }
  }
  // A preflight told to stop before making a branch that made one anyway (2026-09-25): the
  // branch holds no commit of this run, and a handoff committed there would give it one.
  if (state.handoffRefused) {
    log(`no handoff file: ${state.handoffRefused}`)
    return { written: false, path: null, note: `${state.handoffRefused} The detail on this return value is the whole report.` }
  }
  const path = `${state.featureDir}/${HANDOFF_FILE}`
  let r = null
  try {
    const t = tier('handoff')
    r = await agent([
      UNATTENDED,
      `The unattended feature build has stopped at the "${stage}" stage and needs a person. Your only job is to leave a durable handoff file in the repository, so that somebody who was not in this session can pick the decision up. Fix nothing, run no build, and change no file other than the one named here.`,
      '1. Get today\'s date: run `date -I`.',
      `2. Write the document between the BEGIN and END markers below to \`${path}\`, byte for byte, replacing exactly one placeholder and nothing else: \`{{RUN_DATE}}\` with the date from step 1. Do not look for this run's journal or add a path to it: the document says where it is kept, and the newest journal on disk belongs to another run. Do not summarise it, re-word it, reorder it, shorten it or add to it — it is the report, not a draft of one. Do not write the BEGIN and END marker lines themselves. Overwrite the file if it already exists.`,
      `3. Commit that one file and nothing else: \`git add -- ${path} && git commit -m "handoff: the ${stage} stage stopped and needs a person" -- ${path}\`. The pathspec matters: the working tree may hold the run's unfinished or failing work, and none of it belongs in this commit.`,
      cfg.push
        ? '4. Push it: `git push -u origin HEAD`. Set pushed=true only if the push succeeded; a push that fails is not a failed handoff, so report it in note and leave written=true.'
        : '4. Do not push; return pushed=false. This run was started with pushing disabled.',
      'Return written=true only when the whole document is on disk at that path. If any step fails, return written=false with the reason in note; never return written=true for a partial or paraphrased file.',
      '--- BEGIN DOCUMENT ---',
      handoffDoc(stage, why, detail, restartFrom),
      '--- END DOCUMENT ---',
    ].join('\n'), { label: `handoff (${t.model} ${t.effort})`, phase: 'Handoff', schema: S.handoff, model: t.model, effort: t.effort })
  } catch (e) {
    r = null
    log(`the handoff agent threw: ${e && e.message ? e.message : String(e)}`)
  }
  if (r && r.written && r.path) {
    log(`handoff written to ${r.path}${r.commit ? ` (${r.commit})` : ''}${r.pushed ? ', pushed' : ''}`)
    return { written: true, path: r.path, commit: r.commit || '', pushed: !!r.pushed, note: r.note || '' }
  }
  log(`NO handoff file was written: the findings of this run exist only on its return value and in its journal`)
  return {
    written: false,
    path: null,
    note: (r && r.note) || 'the handoff agent failed, was skipped, or returned nothing. The detail on this return value is the whole report.',
  }
}

// Keeps the shape every caller and reader already relies on — status, stage, why,
// detail, featureDir, branch, rounds, stagesRun — and adds `handoff`, which is the
// record of the artifact, never a condition on the verdict.
const needsHuman = async (stage, why, detail, restartFrom) => {
  const handoff = await writeHandoff(stage, why, detail, restartFrom)
  return {
    status: 'needs-human',
    stage,
    restartFrom: restartAt(detail, restartFrom) || stage,
    why,
    detail: detail === undefined ? null : detail,
    featureDir: state.featureDir,
    branch: state.branch,
    createdBranch: state.createdBranch,
    baseBranch: state.baseBranch,
    baseBranchSource: state.baseBranchSource,
    rounds: state.rounds,
    stagesRun: state.stagesRun,
    handoff,
  }
}

const must = (result, stage) => {
  if (result === null || result === undefined) {
    throw new Error(`stage "${stage}" returned nothing: the agent was skipped or died on a terminal error. Resume with resumeFromRunId once the cause is fixed.`)
  }
  return result
}

const run = async (name, stage, prompt, schema, group) => {
  const t = tier(name)
  const label = `${stage} (${t.model} ${t.effort})`
  return must(await agent(prompt, { label, phase: group, schema, model: t.model, effort: t.effort }), stage)
}

// A review/fix loop: review with the reviewer tier; when it returns a blocking
// or major finding, the fixer applies every finding and the review runs again.
//
// It stops the run on a SURVIVOR and on nothing else of its own (owner's decision,
// 2026-09-24). A survivor is a serious finding that restates one an earlier fix round
// was handed — by exact identity, or by the reviewer's own `repeatOf` label against the
// numbered list of handed findings it is given — so the loop can show the same defect
// twice. That is converge's forced-once rule one stage earlier: the loop tried, the
// attempt did not take, and what is left is a decision. Both owner-needed cap stops on
// record read as survivors under the labelling rule in handedFindings — wf_c65ab41b-8a6,
// a lock protocol the review refuted again after each fix, and wf_e5ab8e1a-c53, the
// FR-024 gap the first remediation declared as a narrowing and the fourth analysis
// graded HIGH again — but the label is the reviewer's. On the first case's full agent
// transcripts (read 2026-09-24), round 3 refuted R5's no-deadlock property (its re-lock
// step deadlocks) and round 4 refuted the same property at the same place again after
// round 3's fix, so round 4 restates a round-3 entry in the rule's plain sense; only the
// earlier link, round 2's race proof to round 3's deadlock, needs the wider reading.
//
// The cap no longer stops. The rejected default is "stop at the cap": nine of the
// eleven cap stops on record were resolved by applying the last round's findings
// unchanged (or once by applying none), because the loop has no fixed point and a
// fourth review finds new holes as surely as a first. So after `max` ordinary fix
// rounds the review after the last of them is applied too — the cap fix — and one
// FINAL review reads the result. Its only stop is a survivor; its other findings are
// not applied here, since nothing in this loop would review that fix, and are returned
// open as `ended: "round-cap"`. So no fix of a serious finding reaches the next stage
// unreviewed. The one fix that does, as before, is the minors pass on an approve. The
// final review's open blocking and major findings are not left on the return value
// alone: the first analysis is handed them (analyzeCarry below), so a remediation
// applies what still holds and the next analysis reads that fix — and a finding the
// reviewer failed to label a repeat meets the survivor test a second time there.
//
// A fix round that reports `specChanges` ends the loop with them: the only remedy the
// fixer could see for those findings is an edit to spec.md, which this run does not
// make, so the caller takes them to the spec's author rather than running another
// round that would find the same thing.
const specChangesOf = r => (r && Array.isArray(r.specChanges) ? r.specChanges.filter(Boolean) : [])

const normText = v => String(v || '').toLowerCase().replace(/\s+/g, ' ').trim().replace(/\.$/, '')

// The findings earlier fix rounds were handed, numbered for the next reader, with the
// round that handed each. `idOf` is exact identity after normalisation; `repeatOf` is
// the reader's label, honoured only when it names an entry that exists.
const handedFindings = idOf => {
  const list = []
  const ids = {}
  const skipped = {}
  return {
    hand(round, findings) {
      for (const f of findings) {
        const id = idOf(f)
        if (ids[id]) continue
        list.push({ round, f })
        ids[id] = list.length
      }
    },
    // What the fix agent of a round declined, as it reported it. The script cannot map
    // a free-text entry to a finding, so a survivor carries the whole list of its round:
    // "applied and did not take" and "declined, with this reason" are different
    // decisions for whoever resolves the stop, and the reason exists nowhere else but
    // the machine-local journal.
    noteSkipped(round, list) {
      if (Array.isArray(list) && list.filter(Boolean).length) skipped[round] = list.filter(Boolean)
    },
    skippedIn(round) {
      return skipped[round] || []
    },
    roundOf(f) {
      const n = ids[idOf(f)] || (Number.isInteger(f.repeatOf) && f.repeatOf > 0 && f.repeatOf <= list.length ? f.repeatOf : 0)
      return n ? list[n - 1].round : 0
    },
    block(what, render) {
      if (!list.length) return ''
      return [
        `Earlier rounds of this ${what} handed each finding below to a fix agent, which applied it or declined it with its reason. Do the ${what} exactly as you would without this list. Then, for every finding you return, set \`repeatOf\` to the number of the entry it restates, or to 0 where it is new.`,
        'A finding restates an entry when the defect that entry named is still there: the same requirement, invariant, property or contradiction, at the same place, is still unmet — however either is worded, and also where the fix replaced the mechanism and the replacement fails the same requirement in a new way, or where the fix declared the gap, narrowed the requirement or recorded it as accepted instead of closing it. A defect the fix introduced in a different requirement or at a different place is new, and so is anything this list does not name.',
        list.map((e, i) => `${i + 1}. (round ${e.round}) ${render(e.f)}`).join('\n'),
      ].join('\n')
    },
  }
}

// The detail a survivor exit carries: the survivors first, each marked with the round
// that handed it and with what that round's fix agent declined, then everything else
// the same reader reported.
const markSurvivor = (f, handed) => {
  const survivedRound = handed.roundOf(f)
  const declined = handed.skippedIn(survivedRound)
  return declined.length ? { ...f, survivedRound, skippedByThatFix: declined } : { ...f, survivedRound }
}
const survivorDetail = (findings, isSerious, handed) => {
  const isSurvivor = f => isSerious(f) && handed.roundOf(f) > 0
  return findings.filter(isSurvivor).map(f => markSurvivor(f, handed))
    .concat(findings.filter(f => !isSurvivor(f)))
}

async function reviewLoop({ kind, group, reviewer, fixer, reviewPrompt, fixPrompt, max }) {
  const handed = handedFindings(f => [normText(f.artifact), normText(f.location), normText(f.problem)].join(' | '))
  const priorBlock = () => handed.block('review', f => `[${f.severity}] ${f.artifact} — ${f.location}: ${f.problem}`)
  let review = null
  for (let round = 1; round <= max + 2; round++) {
    const final = round === max + 2
    review = await run(reviewer, `review-${kind} ${round}${final ? ' (final)' : ''}`, reviewPrompt(round, final, priorBlock()), S.review, group)
    state.rounds[reviewer] = round
    const serious = review.findings.filter(f => f.severity !== 'minor')
    const blocking = review.findings.filter(f => f.severity === 'blocking')
    const survivors = serious.filter(f => handed.roundOf(f))
    log(`review-${kind} round ${round}${final ? ' (final)' : ''}: ${review.verdict}, ${blocking.length} blocking, ${serious.length - blocking.length} major, ${review.findings.length - serious.length} minor${survivors.length ? `, ${survivors.length} survived the fix round that was handed it` : ''}`)
    if (survivors.length) {
      return { approved: false, ended: 'survivor', rounds: round, findings: survivorDetail(review.findings, f => f.severity !== 'minor', handed), survivors: survivors.map(f => markSurvivor(f, handed)), specChanges: [] }
    }
    if (review.verdict === 'approve' && serious.length === 0) {
      if (review.findings.length) {
        const fixed = await run(fixer, `fix-${kind} minors`, fixPrompt(review.findings, round, true), S.done, group)
        const specChanges = specChangesOf(fixed)
        if (specChanges.length) return { approved: false, ended: 'spec-changes', rounds: round, findings: review.findings, survivors: [], specChanges }
      }
      return { approved: true, ended: 'approved', rounds: round, findings: review.findings, survivors: [], specChanges: [] }
    }
    if (final) {
      log(`review-${kind}: round cap ${max} reached and its findings applied; the final review found no survivor, so its ${review.findings.length} finding(s) are reported open, unapplied, and the run goes on`)
      return { approved: false, ended: 'round-cap', rounds: round, findings: review.findings, survivors: [], specChanges: [] }
    }
    handed.hand(round, review.findings)
    const capFix = round === max + 1
    const fixed = await run(fixer, `fix-${kind} ${round}${capFix ? ' (cap)' : ''}`, fixPrompt(review.findings, round, false), S.done, group)
    handed.noteSkipped(round, fixed.skipped)
    const specChanges = specChangesOf(fixed)
    if (specChanges.length) return { approved: false, ended: 'spec-changes', rounds: round, findings: review.findings, survivors: [], specChanges }
  }
  throw new Error('reviewLoop fell out of its bound') // unreachable: round max + 2 always returns
}

// ---------------------------------------------------------------------------
// Stage: preflight — discovery, the feature branch, and the sync, on every entry.
//
// The feature this run builds already exists when the run starts: its domain expert
// wrote specs/<NNN>-<name>/spec.md with /speckit-specify and /speckit-clarify. What he
// does NOT necessarily do is leave the repository on a feature branch — he works on the
// base branch (owner's statement of how the team works, 2026-09-21) — so preflight
// establishes the feature, puts the repository on the feature branch, making it when it
// does not exist, and brings that branch in step with the base.
//
// Resolution order, and why it is not spec-kit's own: `.specify/feature.json` is
// git-ignored machine-local state (`.specify/.gitignore` ships the rule), rewritten
// whenever a machine runs /speckit-specify. Ours is whatever OUR last local run left —
// on a fresh pull it names the previous feature — so trusting it first would build the
// wrong feature from a file no commit ever touched. The branch name is the authority
// where there is one; on the base branch the answer is the one specified-but-unplanned
// feature under specs/, which is a rule and not a guess, and ambiguity stops the run.
// feature.json is consulted last and never overrides.
//
// Then the run makes spec-kit agree, because resolving it here is not enough. Stock
// spec-kit 1.0.8's `.specify/scripts/bash/common.sh` resolves the feature from
// SPECIFY_FEATURE_DIRECTORY, then from .specify/feature.json, and from NOTHING else:
// `get_current_branch()` returns $SPECIFY_FEATURE or the empty string and never reads
// git, so the branch name reaches no speckit skill and no branch name is refused. A
// stale feature.json therefore sends /speckit-plan into the previous feature's directory
// however well this script resolved the new one. Writing that one git-ignored file is
// the single write preflight is allowed. Where a repository tracks it instead, it is
// left alone and every stage prompt carries SPECIFY_FEATURE_DIRECTORY, which common.sh
// honours first — and which it then persists into feature.json itself unless the caller
// passed --no-persist, a write this script cannot prevent and does not pretend to.
//
// The sync runs on every entry: the expert keeps editing spec.md on the base branch
// while the build's commits pile up on the feature branch, so without it a run plans
// against a spec that has moved and ends in a failed `git merge --ff-only` at finish,
// after the whole run has been paid for. It is a merge and never a rebase, because the
// branch may already be pushed. It is conflict-free by construction for the spec — the
// build never writes spec.md — and a conflict anywhere else stops the run with the
// paths. A spec that changed under a run told to start after review-plan is a
// needs-human exit whose restart is `from: "review-plan"` (since 2026-09-24; `plan` until
// then), which reads the plan already written against the new text and repairs it.
//
// The discovery half runs even on a start at a later stage: before 2026-09-21 a
// `from: "plan"` restart left state.branch null, the handoff table said "(unknown)" and
// finish merged from HEAD@{1}. A later-stage run standing on the base branch — which is
// converge-feature closing out a feature implemented on the trunk, as 001 was — is
// resuming work that already lives there, and until 2026-09-25 it ran there: no branch,
// no sync, and every converge, implement and fix agent committing on the trunk, while
// SKILL.md said the run never does. Since then preflight makes the feature branch at the
// base branch's HEAD and checks it out first (owner's decision, 2026-09-25), under the
// name a full preflight would make, and only after the same clean-tree check a full
// preflight makes — `git checkout -b` carries uncommitted changes onto the new branch,
// where the run would commit them. A feature branch of that name that already exists is
// reused only when it is an ancestor of the base HEAD, so moving it forward loses nothing;
// one holding work the base lacks is a problem, because which of the two places holds the
// feature is not the run's to choose. The script cannot run git, so the ancestry check is
// the agent's; the prompt makes it and `checkout -B` one `&&` command, so the move cannot
// run past a failed check, and a branch that exists nowhere is made with `-b`, which git
// refuses over one that does. A detached HEAD stops the run at preflight on every entry.
// The rejected default was to stop and ask: a person step for a mechanical act a full run
// already performs. args.wall is still required on
// a start after preflight, because only the full check reads CLAUDE.md for it; the
// base-branch line is read on every entry, by the agent that runs before preflight's.
//
// A later-stage start also checks that the feature artifacts its stages read exist
// (2026-09-24). Until then `from: "review-plan"` with no plan.md, or `from: "implement"`
// with no tasks.md, was caught by nothing in the script: the first agent of the stage met
// the absence, and spec-kit's own check-prerequisites.sh refuses a missing plan.md in
// every mode and a missing tasks.md under --require-tasks, so what came back was an agent
// failing inside a stage rather than a stop that names the start that would make the
// file. The list is derived per stage from what its prompt and its speckit skill read,
// less what a stage earlier in the same run writes; spec.md is step 4's own check.
// ---------------------------------------------------------------------------
const STAGE_READS = {
  'review-plan': ['plan.md'], // the review prompt refutes plan.md; its companions are read where present
  tasks: ['plan.md'], // speckit-tasks: check-prerequisites.sh requires plan.md
  analyze: ['plan.md', 'tasks.md'], // speckit-analyze: --require-tasks
  implement: ['plan.md', 'tasks.md'], // speckit-implement: --require-tasks; the phase reader parses tasks.md
  converge: ['plan.md', 'tasks.md'], // speckit-converge: --require-tasks; the forced append writes into tasks.md
  finish: ['tasks.md'], // the close-out checks every task in tasks.md is ticked
}
const STAGE_WRITES = { plan: ['plan.md'], tasks: ['tasks.md'] }
const producerOf = file => STAGES.find(st => (STAGE_WRITES[st] || []).includes(file))
const inputsToCheck = (() => {
  const need = []
  const made = {}
  for (const st of STAGES) {
    if (!runs(st)) continue
    for (const f of STAGE_READS[st] || []) if (!made[f] && !need.includes(f)) need.push(f)
    for (const f of STAGE_WRITES[st] || []) made[f] = true
  }
  return need
})()

// ---------------------------------------------------------------------------
// The base branch is discovered, not assumed (owner's decision, 2026-09-25).
//
// Precedence: args.baseBranch; else the project's own statement of it, one line in the
// repository root's CLAUDE.md of exactly the form BASE_LINE_FORMAT (owner's decision, later
// the same day: the file that states the definition of done states the trunk too); else
// `origin/HEAD`, the remote's default branch as the last clone or `git remote set-head`
// recorded it, where it names a local branch (one that names none is unresolved); else the one local branch among TRUNK_NAMES, where exactly one exists; else
// unresolved, which stops the run at preflight before any agent writes. Nothing is fetched:
// `git remote show origin` and `git ls-remote` would answer the origin/HEAD question from
// the network, and this run never goes there.
//
// The CLAUDE.md line exists because the step after it resolves nothing where the runs are:
// in all three service repositories origin/HEAD is unset and both dev and main exist, so
// until the line every run there without args.baseBranch stopped here. Rejected: `git
// remote set-head` per clone, lost on every fresh clone, and args.baseBranch on every run,
// a person step on every run. The line is a committed fact of the repository, so every
// clone and every run reads the same one.
//
// Which CLAUDE.md is read: the repository root's, as committed at HEAD of the branch the
// run starts on (`git show HEAD:CLAUDE.md`), whether that is the base branch or a feature
// branch. The base is not known yet, so no other branch can be chosen to read it from; a
// feature branch carries the line of the base it was cut from or last merged, and the line
// names the trunk, which does not move with the feature. A feature branch cut before the
// line was committed holds none, and the run takes the next source down — in the service
// repositories the stop, whose fix is a merge of the base or `baseBranch` once; a start on
// the base branch is not one where the spec is only on the feature branch, since preflight
// resolves the feature directory in the tree it starts in. Not a backend's
// CLAUDE.md: in a project that vendors java-backend-template into backend/, that file is
// the template's and states the template's trunk. Not the working tree: an uncommitted
// edit is nobody's decision yet.
//
// The line is parsed here, not by the agent: it greps for anything shaped like a
// `Base branch:` line — bulleted, numbered, indented, emphasised or in another case included — and returns what
// grep printed, verbatim. A line that is found and cannot be read in the exact form, two
// lines naming different branches, and a line naming a branch that does not exist locally
// are each a stop, never a fall-through to origin/HEAD or to a trunk name: the line exists
// to overrule both, and a stale one silently overruled would take the base from the source
// the owner wrote it to replace.
//
// The fallback counts develop and dev beside main and master not because either is a
// likelier trunk but because its presence makes main ambiguous. The service repositories
// set no origin/HEAD and hold local main and dev, and their trunk is dev; a fallback over
// main and master alone answers main there, which is the defect this replaces — 12 of 54
// journals on the owner's machine passed no baseBranch, and a run started on dev read dev
// as a feature branch, merged main into it and committed there. Rejected: main as a silent
// default (that defect), and refusing every run without baseBranch (a person step for a
// fact git holds wherever origin/HEAD is set). The script decides from the facts the agent
// reports, so the rule is in code and the agent runs three read-only commands.
// ---------------------------------------------------------------------------
const TRUNK_NAMES = ['main', 'master', 'develop', 'dev']
const BASE_LINE = /^Base branch: `([^`\s]+)`\s*$/
const BASE_LINE_FORMAT = 'Base branch: `<branch>`'
const BASE_LINE_CODE = '`` ' + BASE_LINE_FORMAT + ' ``' // a Markdown code span that can hold the backticks
// Wider than the form on purpose: bulleted, numbered, indented, emphasised (`**Base branch:**`) and
// any-case lines are printed too, so the parser sees them and stops rather than the grep skipping them
// (adversarial review, 2026-09-25: the emphasised and numbered forms were skipped until then, and a
// skipped line hands the base to origin/HEAD). Headings, quotes and table rows are not caught.
const BASE_LINE_GREP = "git show HEAD:CLAUDE.md | grep -i -E '^[[:space:]]*([-*+][[:space:]]+|[0-9]+[.)][[:space:]]+)?[*_]*base branch[*_]*[[:space:]]*[*_]*:'"
// What the CLAUDE.md lines say: { lines } when there are none, { lines, branch } for one
// readable name, { lines, unreadable, names } otherwise. A readable line naming HEAD is
// unreadable: HEAD is no branch.
const readBaseLine = raw => {
  const lines = (Array.isArray(raw) ? raw : []).map(l => String(l === null || l === undefined ? '' : l).replace(/\r$/, '')).filter(l => l.trim() !== '')
  const names = lines.map(l => (BASE_LINE.exec(l) || [])[1]).filter(n => n && n !== 'HEAD').filter((n, i, all) => all.indexOf(n) === i)
  const unreadable = lines.filter(l => { const m = BASE_LINE.exec(l); return !m || m[1] === 'HEAD' })
  if (!lines.length) return { lines }
  if (unreadable.length || names.length !== 1) return { lines, unreadable, names }
  return { lines, branch: names[0] }
}
const resolveBase = facts => {
  const branches = (Array.isArray(facts && facts.localBranches) ? facts.localBranches : []).map(b => String(b || '').trim().replace(/^refs\/heads\//, '')).filter(Boolean)
  const trunks = TRUNK_NAMES.filter(n => branches.includes(n))
  const line = readBaseLine(facts && facts.claudeMdLines)
  if (line.unreadable) return { branch: null, source: null, trunks, line }
  if (line.branch) return branches.includes(line.branch) ? { branch: line.branch, source: 'claude-md', trunks, line } : { branch: null, source: null, trunks, line, stale: true }
  const head = String((facts && facts.originHead) || '').trim().replace(/^refs\/remotes\//, '').replace(/^origin\//, '')
  // origin/HEAD naming a branch with no local branch is unresolved, not a base (adversarial review,
  // 2026-09-25): `git clone -b dev` records origin/HEAD as origin/main and makes only a local dev, and
  // preflight merges the local base and fetches nothing, so a run started on dev would read dev as a
  // feature branch with no base to merge — the defect this discovery replaced. Falling through to the
  // trunk names instead would answer dev there, against what origin/HEAD says.
  if (head && head !== 'HEAD') return branches.includes(head) ? { branch: head, source: 'origin-HEAD', trunks, line } : { branch: null, source: null, trunks, line, originHeadNotLocal: head }
  return trunks.length === 1 ? { branch: trunks[0], source: 'fallback', trunks, line } : { branch: null, source: null, trunks, line }
}
const codeList = names => names.map(n => `\`${n}\``).join(' and ')

{
  const full = runs('preflight')
  phase('Preflight')
  if (full) state.stagesRun.push('preflight')
  if (!state.baseBranch) {
    const t = tier('preflight')
    const facts = must(await agent([
      UNATTENDED,
      'Report three facts about this git repository. Read-only: run exactly the commands below, fetch nothing, contact no remote, and change nothing — no checkout, no branch, no config, no file.',
      `1. \`${BASE_LINE_GREP}\` — the repository root's CLAUDE.md as committed on the branch you are on, and not the working tree's copy or any other CLAUDE.md. Return every line it prints as \`claudeMdLines\`, in order and exactly as printed: do not correct, complete, trim, number or interpret a line, and do not decide what it says — the script reads them. Return it empty when the command prints nothing or fails, including when the file does not exist at HEAD.`,
      '2. `git symbolic-ref --short refs/remotes/origin/HEAD` — return what it prints as `originHead`, e.g. `origin/main`; return it empty when the command fails or prints nothing. Do not run `git remote show`, `git remote set-head` or `git ls-remote` in its place: each of those can contact the remote.',
      "3. `git for-each-ref --format='%(refname)' refs/heads/` — return every line it prints, in order, as `localBranches`.",
    ].join('\n'), { label: `base branch (${t.model} ${t.effort})`, phase: 'Preflight', schema: S.baseFacts, model: t.model, effort: t.effort }), 'preflight')
    const b = resolveBase(facts)
    const fix = `Correct the line in the repository root's \`CLAUDE.md\` and commit it on the base branch — one line, exactly ${BASE_LINE_CODE} — or pass \`baseBranch\` for this run`
    if (b.line.unreadable || b.stale) {
      return await needsHuman('preflight',
        b.stale
          ? `the repository root's \`CLAUDE.md\`, as committed on the branch this run started on, names the base branch \`${b.line.branch}\`, and no local branch of that name exists, so nothing was checked, checked out, merged or written. A base-branch line that names no branch is stale, and the run does not fall back past it to \`origin/HEAD\` or to a local trunk name: the line is there to overrule both. ${fix}, or make the local branch — \`git branch ${b.line.branch} origin/${b.line.branch}\` where the remote has it`
          : `the repository root's \`CLAUDE.md\`, as committed on the branch this run started on, holds ${b.line.lines.length === 1 ? 'a base-branch line' : 'base-branch lines'} the run cannot read${b.line.names.length > 1 ? ` — they name ${codeList(b.line.names)}` : ''}, so nothing was checked, checked out, merged or written. The line is read in one form only, ${BASE_LINE_CODE}, alone on its line and unindented, once, with the branch in backticks; a line shaped like it — bulleted, numbered, indented, emphasised or in another case — is a stop rather than skipped, because a skipped line would hand the base to \`origin/HEAD\` or to a trunk name the line was written to overrule. ${fix}`,
        { claudeMdLines: b.line.lines, unreadable: b.line.unreadable || [], named: b.line.branch || b.line.names || [], format: BASE_LINE_FORMAT, localTrunks: b.trunks })
    }
    if (!b.branch) {
      return await needsHuman('preflight',
        `no base branch could be resolved, and every step of preflight after this one keys off it — which branch is the trunk, what to check out, what to merge — so nothing was checked, checked out, merged or written. This run was given no \`baseBranch\`, the repository root's \`CLAUDE.md\` as committed on the branch it started on holds no base-branch line, ${b.originHeadNotLocal
          ? `and \`origin/HEAD\` names \`${b.originHeadNotLocal}\`, which has no local branch: preflight merges the local base and fetches nothing, so that is no base here (\`git branch ${b.originHeadNotLocal} origin/${b.originHeadNotLocal}\` makes it), and the run does not fall back past it to a local trunk name, which would contradict it.`
          : `\`origin/HEAD\` is not set, and ${b.trunks.length ? `the local branches ${codeList(b.trunks)} are all trunk-shaped` : `none of ${TRUNK_NAMES.map(n => `\`${n}\``).join(', ')} exists as a local branch`}, so which one is the trunk is not the run's to guess.`} Add the line ${BASE_LINE_CODE} to the repository root's \`CLAUDE.md\`, alone on its line and unindented, beside the definition-of-done command, and commit it on the base branch; every feature branch cut from it afterwards carries it. A feature branch cut before that commit does not: merge the base into it first, or pass \`baseBranch\` for this one run — its sync merges the base, line included, into the feature branch, so every later run there reads the line. Starting from the base branch instead reaches the feature only where its \`spec.md\` is on the base branch too, since preflight resolves the feature directory in the base branch's tree. Or pass \`baseBranch\` for this run`,
        { originHead: facts.originHead || '', localTrunks: b.trunks, checked: TRUNK_NAMES.slice(), claudeMdLines: [], format: BASE_LINE_FORMAT })
    }
    state.baseBranch = b.branch
    state.baseBranchSource = b.source
    log(`base branch: ${b.branch} (${baseSourceText(b.source)})`)
  }
  const dirName = '<the last path segment of the feature directory, e.g. 004-product-gl-config>'
  const p = await run('preflight', full ? 'preflight' : 'preflight (discovery and sync)', [
    UNATTENDED,
    full
      ? 'Establish which spec-kit feature this unattended build is for, put the repository on that feature\'s branch, bring the branch in step with the base, and check that the repository is ready to build. Everything you may write is named in the steps below — one branch checkout, one merge, one machine-local state file — and nothing else. Never write to spec.md or to anything else in the feature directory: the spec is its author\'s.'
      : 'Establish which spec-kit feature this unattended build is for and bring its branch in step with the base. This run starts at a later stage, so the readiness checks belong to the start it is resuming; you create or check out a branch only when you start on the base branch (step 5). Everything you may write is named in the steps below — at most one branch made or checked out, one merge and one machine-local state file — and nothing else. Never write to spec.md or to anything else in the feature directory: the spec is its author\'s.',
    `1. \`git rev-parse --abbrev-ref HEAD\` is the branch you start on${cfg.branch ? `. This run names \`${cfg.branch}\` as the feature branch, so that is where you must end up` : ''}. If it prints \`HEAD\`, the checkout is detached: that is a problem and you stop there — check nothing out, merge nothing, write nothing, and return \`branch\` as \`HEAD\` — because every stage of this run commits on the branch it stands on, and a detached HEAD is none.`,
    `2. The base branch — the trunk a feature merges into, and the branch the feature's author works on — is \`${state.baseBranch}\`, ${state.baseBranchSource === 'arg' ? 'which this run names' : `resolved before you started (${baseSourceText(state.baseBranchSource)})`}. Use it as given, look for no other, and return it as \`baseBranch\`.`,
    full
      ? '3. `git status --porcelain` must be empty (untracked files under .specify/workflows/runs/ and .claude/worktrees/ do not count). A dirty tree is a problem and you stop there: check nothing out, merge nothing, write nothing, and return what you have. Every step after this one moves the tree, and somebody\'s uncommitted work is not this run\'s to carry onto another branch.'
      : '3. Only when the branch you started on is the base branch: `git status --porcelain` must be empty (untracked files under .specify/workflows/runs/ and .claude/worktrees/ do not count). A dirty tree there is a problem and you stop: check nothing out, merge nothing, write nothing, and return what you have. Step 5 moves this run off the base branch, and somebody\'s uncommitted work is not this run\'s to carry onto another branch.',
    '4. Resolve the feature directory and return it as `featureDir`, in this order, taking the first that answers:',
    cfg.featureDir
      ? `   (a) this run names it: \`${cfg.featureDir}\`. If the branch you started on names a different feature by the rule in (b), that disagreement is a problem — say which two — and you stop rather than choose.`
      : '   (a) — this run names no feature directory, so start at (b).',
    '   (b) the branch you started on, when it is not the base branch: `feature/<NNN>-<name>` or a bare `<NNN>-<name>` becomes `specs/<NNN>-<name>`.',
    '   (c) only when you started on the base branch: the one directory under `specs/` that holds a non-empty `spec.md` and no `plan.md` — the feature that has been specified and not yet planned, which is what this run exists to build. List them (`ls -d specs/*/`) and test each. Exactly one is the answer. Zero or more than one is a problem: return every directory you considered in `candidates` with what made it a candidate or not, leave `featureDir` empty, and stop. Never pick one of several, and never take the newest or the highest-numbered — a person passes `args.featureDir` instead.',
    '   (d) only when nothing above resolved: the `feature_directory` value in `.specify/feature.json`. It is machine-local, git-ignored state written by whichever machine last ran /speckit-specify, so it is the last resort and never overrides (a), (b) or (c).',
    '   The resolved directory must exist and hold a `spec.md` that is present and not empty (`wc -c`). A missing directory, a missing spec.md or an empty one is a problem, and `featureDir` comes back empty — this run builds a spec somebody has already written, and it writes no spec of its own.',
    inputsToCheck.length
      ? `   Then, in the directory you resolved, check the artifacts this run reads before any stage of it writes them: ${inputsToCheck.map(f => `\`<featureDir>/${f}\``).join(', ')}. Test each on the branch the run will work on, which is not always the one you are standing on: step 5 says which it is when you started on the base branch, and step 6 tests them again after the sync. A file counts only when it is present and not empty — in the working tree, \`test -s <featureDir>/<file>\`; on a branch you have not checked out, \`git cat-file -s <ref>:<featureDir>/<file>\` succeeding and printing a number above 0. Return every one that fails there, as its repo-relative path, in \`missingInputs\`. A missing one is not a problem: do not add it to \`problems\`, do not create it; the run reports it itself.`
      : '',
    full
      ? `5. When the branch you started on IS the base branch, put the repository on the feature branch. Let DIR be the last path segment of the feature directory (${dirName}). The target branch is${cfg.branch ? ` \`${cfg.branch}\`, which this run names` : ': an existing branch named `feature/DIR` or `DIR` — look for both locally (`git branch --list`) and on the remote (`git branch -r --list \'origin/*\'`) — and otherwise a new `feature/DIR`'}. Then: a branch that exists locally, \`git checkout <target>\`; one that exists only on the remote, \`git checkout --track origin/<target>\`; one that does not exist, \`git checkout -b <target>\` from where you are standing, and return \`createdBranch\` true. Return the branch you end on as \`branch\` and the one you checked out as \`checkedOut\`. When you did not start on the base branch, check nothing out: you are already on the feature branch.`
      : [
        `5. When the branch you started on IS the base branch, move the run off it: every stage after this one commits, and none of them commits on the base branch. Let DIR be the last path segment of the feature directory (${dirName}). The target branch is${cfg.branch ? ` \`${cfg.branch}\`, which this run names` : ': an existing branch named `feature/DIR` or `DIR` — look for both locally (`git branch --list`) and on the remote (`git branch -r --list \'origin/*\'`) — and otherwise a new `feature/DIR`'}.`,
        inputsToCheck.length
          ? '   Decide which branch the run will work on before you create, move or check out anything, because that is the branch the artifacts of step 4 must be on. Test them first in the working tree, which is the base branch\'s HEAD. Then, when the target exists, test whether it holds anything the base branch lacks: `git merge-base --is-ancestor <target> HEAD` for a local one and `git merge-base --is-ancestor origin/<target> HEAD` for a remote one.'
          : '   When the target exists, test whether it holds anything the base branch lacks: `git merge-base --is-ancestor <target> HEAD` for a local one and `git merge-base --is-ancestor origin/<target> HEAD` for a remote one.',
        `   (a) The target exists nowhere, or every check succeeds: the feature branch starts at the base branch's HEAD, because the work this run resumes is on the base branch${inputsToCheck.length ? ', and the artifacts on the base branch are the ones the run reads. If any of them is missing, stop here: return them in `missingInputs`, and make, move and check out nothing, merge nothing and write nothing — a run that stops on a missing input makes no branch' : ''}. A target the run moves to the base branch's HEAD must hold nothing the base branch lacks, so run the checks and the checkout as one command, so the checkout never runs when a check fails: \`git merge-base --is-ancestor <target> HEAD && git merge-base --is-ancestor origin/<target> HEAD && git checkout -B <target>\`, leaving out the check for the side the target does not exist on. \`git checkout -B\` makes the branch at HEAD, or moves an existing one forward to HEAD and loses nothing because it was an ancestor. A target that exists neither locally nor on the remote is \`git checkout -b <target>\`, which refuses rather than moves a branch that does exist.`,
        inputsToCheck.length
          ? '   (b) A check fails — the target holds commits the base branch lacks — and the base branch holds at least one of the artifacts: the feature\'s work is on the base branch and also on that branch, and which one to continue is not yours to choose. That is a problem and you stop: check nothing out, merge nothing, write nothing.\n   (c) A check fails and the base branch holds none of the artifacts: the feature\'s work is on the target and not on the base branch, so the target is the branch the run works on. Test the artifacts on it without checking it out, with `git cat-file -s` on `<target>` when it exists locally and on `origin/<target>` otherwise. If any of them is missing there, stop as in (a): return those in `missingInputs` and check nothing out. Otherwise check it out — `git checkout <target>` for a local one, `git checkout --track origin/<target>` for one only on the remote — and go on to step 6, which merges the base branch into it.'
          : '   (b) A check fails: that is a problem — the feature\'s work is on the base branch and also on that branch, and which one to continue is not yours to choose — and you stop: check nothing out, merge nothing, write nothing.',
        '   A checkout that fails is a problem too, with git\'s message quoted. Return `createdBranch` true when no branch of that name existed locally or on the remote, the branch you end on as `branch`, and the one you checked out as `checkedOut`. When you did not start on the base branch, check nothing out and create nothing: return `branch` as the branch you are on, `createdBranch` false and `checkedOut` empty.',
      ].join('\n'),
    '6. Sync with the base branch, whenever the branch you are now on is not the base branch and a base branch is known. Do not fetch; the local base branch is what this run merges. Note `git rev-parse HEAD` first, then:',
    '   - `git merge-base --is-ancestor <base> HEAD` succeeds — the base is already in this branch. Do nothing; `synced` is "none".',
    '   - otherwise `git merge-base --is-ancestor HEAD <base>` succeeds — this branch is strictly behind. `git merge --ff-only <base>`; `synced` is "fast-forward".',
    '   - otherwise the two have diverged. `git merge --no-edit <base>`; `synced` is "merge". If it conflicts, `git merge --abort` immediately, set `synced` to "conflict", return the conflicted paths in `conflicts` and add a problem. Never resolve a conflict yourself, and never rebase: this branch may already be pushed.',
    '   Then `git diff --name-only <the sha you noted> HEAD -- <featureDir>/spec.md`: a non-empty result means the sync brought a change to the spec, and `specChanged` is true. Where you finish on the base branch, or no base branch is known, `synced` is "not-applicable".',
    inputsToCheck.length
      ? '   Then, whether or not you merged anything, test the artifacts of step 4 again in the working tree of the branch you are on now, and return in `missingInputs` every one that is missing or empty: after the checkout and the sync, this is the tree every later stage reads. Where step 5 stopped you on a missing artifact you never reach this step, and `missingInputs` is what step 5 found.'
      : '',
    runs('tasks')
      ? '   Then, whether or not you merged anything, on the branch you are on now — after the checkout of step 5 and the sync of this step, so the file is the one the run will build from — when `<featureDir>/tasks.md` exists, list every task it holds: `grep -oE \'^[[:space:]]*[-*] \\[[ xX]\\] T[0-9]+\' <featureDir>/tasks.md`. Return the id (e.g. `T012`) of each ticked one, `[x]` or `[X]`, in `checkedTasks`, and of each open one, `[ ]`, in `openTasks`, both in file order. Return both empty when the file does not exist or holds no task. This is a fact about the file, not a problem.'
      : '   Return `checkedTasks` and `openTasks` empty: no stage of this run writes tasks.md.',
    '7. Make spec-kit agree with the feature you resolved. Its own scripts resolve the feature from the `SPECIFY_FEATURE_DIRECTORY` environment variable, then from `.specify/feature.json`, and from nothing else — never from the branch name — so a stale file sends every later stage into another feature\'s directory. Run `git check-ignore -q .specify/feature.json`. Exit 0 (the file is git-ignored, which is how spec-kit ships it): if its `feature_directory` is not the directory you resolved, write the file as exactly `{"feature_directory":"<the resolved directory>"}` and return `featureJson` "written"; if it already names it, write nothing and return "unchanged". A non-zero exit means the repository tracks the file: leave it untouched, return "tracked", and add no problem — the run carries the environment variable to its stages instead.',
    full ? '8. `grep -n "\\[NEEDS CLARIFICATION" <featureDir>/spec.md` — return every hit in `clarifications`, quoted with its line number. Those markers are the spec author\'s to resolve with `/speckit-clarify`, and this run never answers one.' : '',
    full ? '9. `.specify/` must exist with `.specify/memory/constitution.md`, and `.claude/skills/speckit-plan/SKILL.md`, `speckit-tasks`, `speckit-analyze`, `speckit-implement`, `speckit-converge` must all be installed. Any missing one is a problem.' : '',
    full
      ? (cfg.wall
        ? `10. The definition-of-done command is \`${cfg.wall}\`. Check that its executable and script exist; do not run it. Return it as \`wall\`.`
        : `10. Find the project's definition-of-done command: read CLAUDE.md at the repo root (and the backend's CLAUDE.md if there is one) for the command it names as the definition of done or as "exactly what CI runs" — for example \`node backend/scripts/wall.mjs\`. Return it as \`wall\`. If no such command is named, return an empty string and add a problem saying so.`)
      : `8. Return \`wall\` as \`${cfg.wall || ''}\` and \`clarifications\` empty: the checks this run skipped are not yours to redo.`,
    'Return ok=true only when there are no problems.',
  ].filter(Boolean).join('\n'), S.preflight, 'Preflight')
  state.branch = p.branch || state.branch
  // The command preflight read out of CLAUDE.md. This line was lost in c4b9a16
  // (2026-09-21), and from then every full preflight without args.wall stopped on "no
  // definition-of-done command" with the command sitting in the agent's own return:
  // six stops on six features, 2026-09-21..24, the first run of every feature since,
  // each resolved by passing the value the agent had already found (run ledger, sweep 2).
  // args.wall, where given, wins: every argument overrides what preflight would find.
  state.wall = state.wall || p.wall || null
  // The base branch is the script's, resolved before this agent ran; the agent's echo of it
  // is not read, so a different name in its return cannot move the guard below.
  // Where preflight finishes still standing on the base branch, no handoff file is
  // written: HANDOFF.md is committed on the branch the run is on, and a commit on the trunk
  // is not this script's to make. The report then lives on the return value, which is what
  // every preflight exit did before there was a feature directory to write into at all.
  // Since 2026-09-25 that happens only on a preflight exit — preflight moves every other
  // run onto the feature branch, and the guard below stops one it did not move.
  // The agent's two fields are held against each other: a branch named the base branch is
  // the base branch, whatever `onBaseBranch` says, so the guard below does not rest on one
  // boolean the agent could get wrong.
  state.onBaseBranch = !!p.onBaseBranch || (!!state.baseBranch && p.branch === state.baseBranch)
  state.createdBranch = !!p.createdBranch
  // Task ids are only read where the tasks stage runs, since that stage alone would
  // regenerate the file over them; an id the agent returns twice is counted once, and an
  // id it returns as both ticked and open is taken as ticked.
  const taskIds = list => (Array.isArray(list) ? list : []).map(id => String(id || '').trim()).filter((id, i, all) => /^T\d+$/.test(id) && all.indexOf(id) === i)
  state.checkedTasks = runs('tasks') ? taskIds(p.checkedTasks) : []
  state.openTasks = runs('tasks') ? taskIds(p.openTasks).filter(id => !state.checkedTasks.includes(id)) : []
  state.featureJsonTracked = p.featureJson === 'tracked'
  state.featureDir = p.featureDir || null
  if (!p.featureDir && Array.isArray(p.candidates) && p.candidates.length) {
    return await needsHuman('preflight',
      `the run was started on the base branch and the feature could not be resolved from it: exactly one directory under specs/ should hold a written spec.md and no plan.md — the feature specified and not yet planned — and ${p.candidates.length} were considered. The loop will not pick one of several, because building the wrong feature is not something a later stage would notice. Pass args.featureDir, or check the feature branch out`,
      p.candidates)
  }
  if (p.synced === 'conflict') {
    return await needsHuman('preflight',
      `merging \`${state.baseBranch || 'the base branch'}\` into \`${state.branch || 'the feature branch'}\` conflicted, and the merge was aborted, so the tree is as it was. The build never edits spec.md, so a conflict here is between the base branch and this feature's own committed work in the files below — a person's to resolve, on the branch, before the run restarts`,
      { conflicts: p.conflicts || [], problems: p.problems })
  }
  // Before the `ok` test, so the exit that names the start producing the file wins even
  // where the agent also reported the absence as a problem. Only the files the prompt
  // named count; a path the agent returns beyond them is ignored.
  const missing = p.featureDir && Array.isArray(p.missingInputs)
    ? inputsToCheck.filter(f => p.missingInputs.some(m => String(m || '').replace(/\/+$/, '').split('/').pop() === f))
    : []
  if (missing.length) {
    // The earliest stage that writes a missing file; a spec the sync just changed sends
    // the restart no later than review-plan, for the reason the specChanged exit gives.
    const restart = STAGES.find(st => missing.some(f => producerOf(f) === st) || (p.specChanged && st === SPEC_EDIT_RESTART))
    const paths = missing.map(f => `${state.featureDir}/${f}`)
    const one = missing.length === 1
    // Missing inputs are checked before a branch is made (owner's decision, 2026-09-25): a
    // later start on the base branch that stops here leaves no branch and commits nothing,
    // like every other pre-branch refusal. The script cannot see whether the agent stopped
    // before `git checkout -b`; `createdBranch` is its report, and a branch it made anyway
    // gets no handoff commit, so it holds nothing of this run and the return says so.
    if (state.createdBranch) {
      state.handoffRefused = `preflight made the branch \`${state.branch}\` although ${paths.join(' and ')} ${one ? 'is' : 'are'} missing, where it is told to stop before making one. The branch holds no commit of this run, and no handoff was committed on it; a restart on the base branch moves it forward, since it is an ancestor, or it can be deleted.`
    }
    return await needsHuman('preflight',
      `this run was told to start at "${cfg.from}", and ${paths.join(' and ')} ${one ? 'is' : 'are'} missing or empty on the branch the run would work on: the run reads ${one ? 'it' : 'them'} before any stage of it writes ${one ? 'it' : 'them'}. Nothing was started${state.onBaseBranch ? `, and no branch was made — the run is still on \`${state.baseBranch}\`` : ''}. Restart with \`from: "${restart}"\`, ${missing.some(f => producerOf(f) === restart)
        ? `the first stage that writes ${missing.filter(f => producerOf(f) === restart).join(' and ')}`
        : 'because the sync also changed spec.md, and that start reads the plan already written against the new text and repairs it'}${state.onBaseBranch && !cfg.featureDir
        // Adversarial review, 2026-09-25: on the base branch with no featureDir, step 4 answers
        // only with the one directory holding a spec.md and no plan.md, so a converge-feature
        // close-out of a feature implemented on the trunk resolves some other, unplanned feature
        // and stops here on its missing plan.md — with a restart that would build that one.
        ? `. The feature was resolved on \`${state.baseBranch}\` as the one directory under specs/ with a written spec.md and no plan.md, which is the only feature a start on the base branch finds without \`featureDir\`: if this run was for another feature — one already planned or implemented on the base branch — restart with \`featureDir\` naming it rather than with the \`from\` above`
        : ''}`,
      { missingInputs: paths, from: cfg.from, restartFrom: restart, problems: p.problems || [] }, restart)
  }
  if (!p.ok) return await needsHuman('preflight', full ? 'the repository is not ready' : 'the repository does not match what this restart was given', p.problems)
  if (!p.featureDir) {
    return await needsHuman('preflight', cfg.featureDir
      ? `\`${cfg.featureDir}\` is not a feature directory this run can build: it does not exist, or it holds no readable, non-empty spec.md. A feature is specified before this run starts — /speckit-specify and /speckit-clarify are the author's, not this script's`
      : `no feature directory could be resolved, so there is no spec to build: the branch \`${p.branch || '(none reported)'}\` does not name one, no single specified-but-unplanned directory under specs/ answered for it, and .specify/feature.json — machine-local state, and the last thing this run trusts — named nothing usable either. Pass args.featureDir, or check the feature branch out`,
      p.problems)
  }
  // Every stage after preflight can commit — fix-plan, tasks, remediate, implement,
  // converge, the forced append, finish's leftovers — so a run preflight did not move off
  // the base branch is not started on it. This is the script's own check on the agent's
  // report, not a question the agent was asked: an agent that reports ok while still on
  // the trunk would otherwise hand every later agent the trunk to commit on.
  // A detached HEAD is the same exit: a commit there is on no branch, finish's push refuses
  // it, and a merge back checks out a branch the work is not on.
  if ((state.onBaseBranch || state.branch === 'HEAD') && STAGES.some(st => st !== 'preflight' && runs(st))) {
    return await needsHuman('preflight',
      `preflight finished ${state.branch === 'HEAD' ? 'on a detached HEAD' : `on the base branch \`${state.baseBranch || '(unknown)'}\``} and reported no problem, and every stage this run would start after it commits; no stage of this run commits on the base branch or off a branch, so none was started. Preflight makes the feature branch at the base branch's HEAD when it starts on the base branch, and this time the run is not on one: check the feature branch \`${cfg.branch || `feature/${(state.featureDir || '').split('/').pop()}`}\` out and restart`,
      p.problems)
  }
  if (!state.wall) return await needsHuman('preflight', 'no definition-of-done command: pass args.wall', p.problems)
  if (Array.isArray(p.clarifications) && p.clarifications.length) {
    return await needsHuman('preflight',
      `${p.clarifications.length} "[NEEDS CLARIFICATION]" marker(s) are still in ${state.featureDir}/spec.md. They are the spec author's to resolve, with \`/speckit-clarify\` in the project, and this run answers none: it does not edit the spec, and planning against an unresolved marker decides by accident what the marker exists to decide. Restart the build once the spec is clarified`,
      p.clarifications)
  }
  // A spec that moved under artifacts already written is not something a later stage
  // reconciles: plan.md, tasks.md and the code were all derived from the old text, and
  // the analyze stage would report it as a dozen findings against the wrong artifact.
  // A run that starts at plan or at review-plan is about to read the new text against
  // the plan anyway, so it carries on; review-plan is the restart this exit names.
  if (p.specChanged && STAGES.indexOf(cfg.from) > STAGES.indexOf(SPEC_EDIT_RESTART)) {
    return await needsHuman('preflight',
      `the sync with \`${state.baseBranch || 'the base branch'}\` brought a change to ${state.featureDir}/spec.md, and this run was told to start at "${cfg.from}" — after the plan review that read the old text. Every artifact from plan.md onwards is now derived from a spec that has moved. The merge is done and committed on \`${state.branch}\`, so nothing is lost: restart with \`from: "${SPEC_EDIT_RESTART}"\`, which reads the plan already written against the new text and repairs it in place`,
      { changed: [`${state.featureDir}/spec.md changed in the merge from ${state.baseBranch || 'the base branch'}`], from: cfg.from, restartFrom: SPEC_EDIT_RESTART },
      SPEC_EDIT_RESTART)
  }
  log(`${full ? 'preflight ok' : 'discovery'}: feature ${state.featureDir} on ${state.branch}${p.createdBranch ? ' (branch created)' : p.checkedOut ? ' (checked out)' : ''}, base ${state.baseBranch || '(none)'}, sync ${p.synced}${p.specChanged ? ' and the spec changed' : ''}, feature.json ${p.featureJson || 'unknown'}, wall = ${state.wall}${state.checkedTasks.length ? `, ${state.checkedTasks.length} task(s) already ticked in tasks.md` : ''}`)
}

// ---------------------------------------------------------------------------
// Stage: plan → review-plan ⇄ fix-plan
// ---------------------------------------------------------------------------
// `from: "review-plan"` runs the review over the plan already on the branch and does
// not regenerate it. Until 2026-09-24 the review sat inside the plan stage's guard, so
// that start ran no review at all and went straight to tasks: every review-plan stop
// restarted at the stage its handoff named — seven, 2026-09-21..23 — reached tasks with
// no review of what was applied after the fourth one, which is the one thing the
// resolution rule's restart exists to prevent (run ledger, sweep 2). An `until: "plan"`
// run now stops before the review, and `until: "review-plan"` is still the way to read
// a reviewed plan before tasks.
//
// Since 2026-09-24 that start is also the restart after a spec edit, so a review that
// did not follow this run's own plan stage is told the spec may have moved since the
// plan was written, and that a disagreement with the spec's current text is a finding
// whose fix brings the plan into agreement in place.
if (runs('plan') || runs('review-plan')) {
  phase('Plan')
  const P = featurePaths(state.featureDir)
  if (runs('plan')) {
    state.stagesRun.push('plan')
    await run('plan', 'plan', [
      UNATTENDED,
      SKILL_HOW('speckit-plan'),
      FEATURE_CONTEXT(),
      `The feature is ${state.featureDir}; the spec is ${P.spec}; the constitution is ${CONSTITUTION}.`,
      SPEC_IS_NOT_OURS(P.spec),
      cfg.planGuidance ? `Arguments for the skill (planning guidance): ${cfg.planGuidance}` : 'Arguments for the skill: none.',
      `Rules: read the constitution first and treat every article as binding; read the existing code the feature touches before deciding on a design; leave no "[NEEDS CLARIFICATION]" in the plan artifacts — decide from the spec, the constitution and the code, and record the decision in research.md. An "Article VII candidate" is admissible only under the constitution's Governance admission test: it binds two or more feature packages, or a table or package this feature does not own; a rule about this feature's own tables, columns, endpoints or error codes is a plan decision recorded in plan.md and docs/GATES.md, never a candidate; a pre-positioned or placeholder structure is never the subject of one. Cite an FR or SC id of the spec qualified \`${featureNum(state.featureDir)}/FR-nnn\` or \`${featureNum(state.featureDir)}/SC-nnn\`, never bare, wherever plan.md or research.md names one. A requirement the plan puts out of this feature's scope names that boundary in plan.md — the tasks stage waives it as \`deferred\` from exactly that sentence. Run the before_plan and after_plan hooks.`,
      'Return done=true with a one-paragraph summary of the design and the artifacts written.',
    ].filter(Boolean).join('\n'), S.done, 'Plan')
  }

  if (runs('review-plan')) {
    state.stagesRun.push('review-plan')
    const r = await reviewLoop({
      kind: 'plan',
      group: 'Plan',
      reviewer: 'reviewPlan',
      fixer: 'fixPlan',
      max: cfg.maxReviewRounds,
      reviewPrompt: (round, final, prior) => [
        UNATTENDED,
        `You are a fresh-context reviewer with no memory of how the plan was written. Your job is to REFUTE the claim that ${P.plan} (with ${P.research}, ${P.dataModel}, ${P.contracts} and ${P.quickstart} where present) fully and correctly realises ${P.spec} under ${CONSTITUTION}. Read-only: change nothing.`,
        'Read the spec, every plan artifact, the constitution, the project CLAUDE.md files, and the existing code and schema the plan touches or depends on.',
        !runs('plan') && round === 1
          ? `${P.spec} MAY HAVE CHANGED SINCE THE PLAN WAS WRITTEN: this run did not write the plan, and it is the start the build restarts at after its spec is edited. Read the spec as it stands now, not as the plan quotes or paraphrases it. Every place the plan artifacts disagree with its current text — a requirement, criterion, scenario, clarification or assumption added, removed, reworded or reversed — is a blocking finding against the plan artifact, and its fix is the in-place edit that brings that artifact into agreement with the spec. Never propose regenerating a file.`
          : '',
        'Report a finding for each of these, with the severity given:',
        '- a functional requirement, success criterion, state, transition or error case in the spec that no plan element realises — blocking',
        '- a plan decision that violates a constitution article or a build gate the project documents — blocking, naming the article or gate; propose a constitution amendment only when the rule passes the constitution\'s Governance admission test (it binds two or more features, or a table the feature does not own), otherwise the finding is against the plan',
        '- a contract, data model or migration that contradicts the existing schema, an existing endpoint, or another plan artifact — blocking',
        '- a decision that contradicts what the existing code already does without saying so and migrating it — major',
        '- a "[NEEDS CLARIFICATION]", a template placeholder, or a research question left open — major',
        '- a decision with no stated alternative and rationale where the constitution or the project rules require one — major',
        '- a decision that the plan defers to implementation without a task-sized statement of what to build — major',
        `- a requirement of ${P.spec} that no plan can realise because the spec contradicts itself, the constitution or the existing code — blocking, and say in the fix that the remedy is a change to the spec: ${P.spec} belongs to the domain and technical experts who wrote it, and neither you nor the agent that applies your findings edits it`,
        '- naming, ordering, duplication — minor',
        `Each finding names the exact file and location and the concrete edit that resolves it, and no finding's fix is an edit to ${P.spec}. Verdict "fix" when any finding is blocking or major; "approve" otherwise.`,
        round > 1 ? `This is review round ${round}; earlier findings were applied. Check they were applied correctly and look for what the fix broke.` : '',
        prior,
      ].filter(Boolean).join('\n'),
      fixPrompt: (findings, round, minorsOnly) => [
        UNATTENDED,
        `Apply the following review findings to the plan artifacts under ${state.featureDir}. Edit in place; do not regenerate a file. Where a finding says a plan artifact disagrees with the current text of ${P.spec}, the spec is right: bring the artifact into agreement with it. When a finding says the constitution needs an amendment, amend ${CONSTITUTION} only if the amendment passes the constitution's Governance admission test (it binds two or more features, or a table the feature does not own — otherwise change the plan instead and say so under skipped), following the constitution's own amendment and versioning rules and only in the articles it marks as the project's own, and record the amendment in ${P.research}.`,
        SPEC_IS_NOT_OURS(P.spec),
        `Where a finding cannot be resolved in the plan artifacts or the constitution because the only remedy is a change to ${P.spec} — the spec contradicts itself, the constitution or the code, or it is silent on something no plan can decide — do not apply it and do not work around it: put it in \`specChanges\`, naming the requirement and the change the spec needs. That stops the run and takes the finding to the spec's author, so put there only what you genuinely cannot resolve in the files you may write.`,
        minorsOnly ? 'These are minor findings; apply each unless it would change meaning.' : 'Apply every finding. If a finding is wrong against the spec or the code, do not apply it and list it under skipped with the reason.',
        findingsBlock(findings),
        `Then commit with the message "plan: review round ${round}". Return done=true with the short sha.`,
      ].join('\n'),
    })
    if (r.specChanges && r.specChanges.length) {
      return await needsHuman('review-plan',
        `a review finding of the plan can only be resolved by changing ${P.spec}, and no stage of this run edits the spec: it belongs to the domain and technical experts and was written before the build started. The ${r.specChanges.length} change(s) below each go to the expert the change belongs to — a domain decision to the domain expert in writing, which reopens the spec handoff, and a technical one to the technical expert as an edit to the spec — and the build restarts at ${SPEC_EDIT_RESTART} afterwards, which reads this plan against the edited spec and repairs it in place. Nothing else in the plan was left unapplied`,
        r.specChanges, SPEC_EDIT_RESTART)
    }
    if (r.ended === 'survivor') {
      return await needsHuman('review-plan',
        `${r.survivors.length} blocking or major finding(s) survived the fix round that was handed them: the loop applied every finding of that round — or the fixer declined one with its reason — and a later fresh-context review, round ${r.rounds}, reports the same defect again. Survived: ${r.survivors.map(f => `[${f.severity}] ${f.artifact} — ${f.location} (handed in round ${f.survivedRound})`).join('; ')}. A plan finding the loop has tried once and lost is usually a decision the run is not authorised to take — a design the review keeps refuting, a constitution amendment that fails its admission test, or a requirement the plan narrows rather than meets — so it is not tried again`,
        r.findings)
    }
    state.reviewPlan = { ended: r.ended, rounds: r.rounds, findings: r.findings }
  }
}

// ---------------------------------------------------------------------------
// Stage: tasks → analyze ⇄ remediate
// ---------------------------------------------------------------------------
// The rules every task this stage writes follows, in generate and update mode alike.
const TASK_RULES = P => `Rules: every task names the file it touches; every phase ends with a task that runs the definition of done, \`${state.wall}\`, and fixes until it is green; the phases follow the template ("## Phase N: ..."). Every FR and SC of ${P.spec} is named by at least one task in this file — the gate refuses an id no task names — in qualified form \`${featureNum(state.featureDir)}/FR-nnn\` or \`${featureNum(state.featureDir)}/SC-nnn\`, and that task writes a test citing it — or, it is named by a task that adds its row to specs/trace-waivers.tsv (\`${featureNum(state.featureDir)}/ID<TAB>kind<TAB>reason\`, rows sorted), where kind is exactly \`external\` (the criterion cannot be witnessed from inside this repository at all — a production latency figure, an operator procedure) or \`deferred\` (specified but deliberately not built in this feature; the reason names where that deferral is recorded — a plan.md scope boundary, a GATES.md named-gap row, the owning capability). A requirement that is merely untested is neither: it gets a test, not a waiver row. This tasks stage is the only place a waiver task may originate: no later stage adds one. A task that dictates Javadoc or comment wording also uses the qualified form, never the bare id. Run the before_tasks and after_tasks hooks.`

// The tasks stage has two modes, and preflight decides which (2026-09-25). On a first run
// tasks.md does not exist, or ticks nothing, and the stage generates it with
// /speckit-tasks exactly as before. Where preflight found ticked tasks in it — a restart at
// review-plan after a spec edit on a feature already implemented or converged, the restart
// converge-feature's spec exits name — the stage updates the file in place instead (owner's
// decision, 2026-09-25): ticked tasks stay ticked, forced convergence phases included; a
// ticked task whose requirement the change altered is unticked with the reason in its line;
// a task the revised spec and plan no longer need is marked removed (REMOVED_TASK), never
// deleted; new work gets new tasks with ids after the maximum. Implement then runs only
// what is open, as it always did. The rejected default is the regeneration this stage did
// until that day: /speckit-tasks writes tasks.md whole, every task unticked, so implement
// ran every phase again over code that exists and the forced convergence phases left the
// file.
//
// The update is certified by a parse-only reader, on the `phases` row's precedent: the
// agent that edited the file is not the one that says what it holds. Every task preflight
// saw ticked must come back ticked, reopened with a reason, or removed with a reason; one
// unticked without a reason, or gone, stops the run, because implement would then redo it
// on nobody's decision — or never know it had been done. Every task preflight saw open must
// come back open or removed with a reason; one gone or ticked stops the run too.
if (runs('tasks')) {
  phase('Tasks')
  state.stagesRun.push('tasks')
  const P = featurePaths(state.featureDir)
  const before = state.checkedTasks
  const update = before.length > 0
  const specNote = `${SPEC_IS_NOT_OURS(P.spec)} No task you write edits it either: a gap that could only be closed by changing the spec is not a task, and a task that would reword a requirement to match the plan is the same edit at one remove.`
  const generated = !update
    ? await run('tasks', 'tasks', [
      UNATTENDED,
      SKILL_HOW('speckit-tasks'),
      FEATURE_CONTEXT(),
      `The feature is ${state.featureDir}.`,
      specNote,
      NO_TASK_WAITS_ON_A_PERSON,
      cfg.tasksGuidance ? `Arguments for the skill (task generation constraints): ${cfg.tasksGuidance}` : 'Arguments for the skill: none.',
      TASK_RULES(P),
      `Return done=true with the number of tasks and phases written to ${P.tasks}.`,
    ].filter(Boolean).join('\n'), S.done, 'Tasks')
    : await run('tasks', 'tasks (update in place)', [
      UNATTENDED,
      FEATURE_CONTEXT(),
      `The feature is ${state.featureDir}. ${P.tasks} already exists and ${before.length} of its tasks are ticked: work an earlier run implemented and committed, convergence and forced convergence phases included. This run follows an edit to the spec or a revision of the plan, so bring ${P.tasks} into agreement with ${P.spec} and ${P.plan} as they stand now, IN PLACE. Do not regenerate it: do not run speckit-tasks' generation, do not rewrite the file from the template, and never renumber, reorder or re-word an existing task. Read \`.claude/skills/speckit-tasks/SKILL.md\` for its checklist format, phase structure and task rules only, and apply them to the tasks you add.`,
      specNote,
      NO_TASK_WAITS_ON_A_PERSON,
      cfg.tasksGuidance ? `Task generation constraints, for the tasks you add: ${cfg.tasksGuidance}` : '',
      `Read the spec, ${P.plan} and its companions, ${P.tasks} and the code the ticked tasks produced. Then, task by task:`,
      '- A ticked task whose requirement, criterion or plan decision is unchanged stays exactly as it is, "- [x]" — every task of a "Convergence" or "Convergence (forced round n)" phase included. Work that was done is not redone because the spec moved somewhere else.',
      '- A ticked task whose requirement, criterion or plan decision the change altered, so that what it built no longer satisfies it, is unticked, with the reason at the end of its first line: `- [ ] T014 <the task text as it stood> (reopened: <what changed, naming the requirement or plan section>)`. Untick nothing else, and never untick a task without that reason in its line.',
      `- A task, ticked or not, that the revised spec and plan no longer need is marked removed and never deleted: the task — its first line and every continuation line under it — becomes the one line ${REMOVED_LINE}. That line names no FR or SC id, in the struck part or in the reason: the wall's traceability gate reads every id anywhere in ${P.tasks}, so an id the spec no longer defines turns it red and one it still defines counts as named by a task. Say what the task was for in words; its full text stays in this commit's parent. ${REMOVED_TASK}`,
      `- An FR or SC id that ${P.spec} no longer defines is cited nowhere afterwards, because that gate refuses a citation of an undefined id in ${P.tasks} as in the code, the tests and specs/trace-waivers.tsv. Take it out of every line of ${P.tasks} that names it — the one change a ticked task's line may take while it stays ticked — and, where the code, a test or a waiver row still cites it, add a new task that takes that citation out, naming the files.`,
      '- An unticked task whose requirement is unchanged stays as it is. Tick nothing: this stage implements nothing, so no box it touches becomes "- [x]".',
      '- Work the revised spec and plan need that no task covers gets a new task, "- [ ]", with an id after the current maximum, in the phase it belongs to — or in a new phase at the end of the file when it belongs to none — in the checklist format speckit-tasks defines.',
      TASK_RULES(P),
      `Commit ${P.tasks} with the message "tasks: update in place after a spec or plan revision". Return done=true, the commit sha, and every task you reopened, removed or added — reopened and removed each with the reason its line carries.`,
    ].filter(Boolean).join('\n'), S.tasksUpdated, 'Tasks')
  // NO_TASK_WAITS_ON_A_PERSON sends a question only the author can answer to
  // `specChanges`, and the schema tells this agent that field stops the run. Until
  // 2026-09-24 nothing here read it, so the question left the run with no trace and
  // analyze was the next chance to find it again.
  const specChanges = specChangesOf(generated)
  if (specChanges.length) {
    return await needsHuman('tasks',
      `writing the tasks found ${specChanges.length} question(s) only an expert can answer in ${P.spec}, and no stage of this run edits the spec: it belongs to the domain and technical experts and was written before the build started. The change(s) below each go to the expert the change belongs to — a domain decision to the domain expert in writing, which reopens the spec handoff, and a technical one to the technical expert as an edit to the spec — and the build restarts at ${SPEC_EDIT_RESTART} afterwards, which reads the plan against the edited spec and repairs it in place`,
      specChanges, SPEC_EDIT_RESTART)
  }
  // The open tasks are certified too (adversarial review, 2026-09-25): the update may not
  // delete one — a later append would reuse its id and its requirement would go unplanned
  // — and may not tick one, which claims work nobody did and which implement then skips.
  if (update) {
    const openBefore = state.openTasks
    const cert = await run('phases', 'check tasks.md after update', [
      UNATTENDED,
      `Read ${P.tasks}. Every task id below was a task of the file, ticked or open, before an agent updated it in place. For each one, find the line that carries it as a task and report its state now:`,
      '- "checked": the line is "- [x]" or "- [X]";',
      '- "reopened": the line is "- [ ]" and carries "(reopened: <reason>)" with a reason in it;',
      '- "removed": the line has no checkbox, its task id is struck through, and it carries "(removed: <reason>)" with a reason in it;',
      '- "unchecked": the line is "- [ ]" and carries no reopened reason;',
      '- "missing": no line of the file carries that id as a task.',
      'Quote the reason for "reopened" and "removed". Parse only; change nothing.',
      before.concat(openBefore).join(', '),
    ].join('\n'), S.tasksCertified, 'Tasks')
    const seen = {}
    for (const t of Array.isArray(cert.tasks) ? cert.tasks : []) if (t && t.taskId && !seen[t.taskId]) seen[t.taskId] = t
    const hasReason = t => typeof t.reason === 'string' && t.reason.trim() !== ''
    const lost = []
    const kept = []
    const reopened = []
    const removed = []
    for (const id of before) {
      const t = seen[id]
      if (!t) lost.push({ taskId: id, state: 'not reported by the reader' })
      else if (t.state === 'checked') kept.push(id)
      else if (t.state === 'reopened' && hasReason(t)) reopened.push({ taskId: id, reason: t.reason })
      else if (t.state === 'removed' && hasReason(t)) removed.push({ taskId: id, reason: t.reason })
      else lost.push({ taskId: id, state: t.state === 'reopened' || t.state === 'removed' ? `${t.state} with no reason in its line` : t.state })
    }
    let openKept = 0
    for (const id of openBefore) {
      const t = seen[id]
      if (!t) lost.push({ taskId: id, state: 'open before the update; not reported by the reader' })
      else if (t.state === 'unchecked' || t.state === 'reopened') openKept++
      else if (t.state === 'removed' && hasReason(t)) removed.push({ taskId: id, reason: t.reason })
      else lost.push({ taskId: id, state: t.state === 'checked' ? 'open before the update and ticked by it, which implements nothing' : t.state === 'removed' ? 'removed with no reason in its line' : `open before the update; ${t.state}` })
    }
    state.tasksUpdate = {
      checkedBefore: before.length,
      openBefore: openBefore.length,
      kept: kept.length,
      openKept,
      reopened,
      removed: removed.concat((generated.removed || []).filter(r => r && r.taskId && !before.includes(r.taskId) && !openBefore.includes(r.taskId))),
      added: Array.isArray(generated.added) ? generated.added : [],
      commit: generated.commit || '',
    }
    log(`tasks updated in place: ${kept.length} of ${before.length} ticked task(s) kept, ${reopened.length} reopened, ${removed.length} task(s) removed, ${openKept} of ${openBefore.length} open task(s) left open, ${state.tasksUpdate.added.length} added${lost.length ? `; ${lost.length} task(s) unaccounted for` : ''}`)
    if (lost.length) {
      return await needsHuman('tasks',
        `the tasks stage updated ${P.tasks} in place over ${before.length} ticked and ${openBefore.length} open task(s), and a parse-only read of the file afterwards finds ${lost.length} of them unaccounted for — a ticked one neither ticked, nor reopened with a reason, nor removed with a reason, or an open one that is gone or was ticked: ${lost.map(t => `${t.taskId} (${t.state})`).join(', ')}. Implement would redo that work on nobody's decision, skip work nobody did, or lose the record of a task, so the run stops before it. The update is committed (${generated.commit || 'no commit named'}); the file as it stood before it is its parent commit's`,
        { lost, kept: kept.length, openKept, reopened, removed, updateCommit: generated.commit || '', updateSummary: generated.summary || '' })
    }
  }
}

// The analyze loop has the review loop's stop rule (2026-09-24): a survivor stops the
// run, the cap does not. After maxAnalyzeRounds remediations the analysis after the last
// one is remediated too, and one final analysis reads the result; its only stop is a
// CRITICAL or HIGH finding restating one a remediation was handed, and its other
// findings go on to implement open, reported as `analysis.ended: "round-cap"`. The
// converge loop later reads the code against the spec, which is where a finding the
// final analysis left open is met again if it is real.
//
// The first analysis is also handed the plan review's open blocking and major findings
// when that loop ended at its cap. Without it they reached nothing but the return value
// of a run that goes on to implement: /speckit-analyze checks the artifacts against each
// other and the constitution, and a design defect such as a lock protocol that can
// deadlock is not a question it asks. A blocking one is graded no lower than HIGH so it
// is remediated, since the plan review's own scale already said the plan cannot stand
// with it. Nothing here stops the run on them: the survivor test does, one round later,
// if the remediation does not take.
const analyzeCarry = () => {
  const open = state.reviewPlan && state.reviewPlan.ended === 'round-cap'
    ? state.reviewPlan.findings.filter(f => f.severity !== 'minor')
    : []
  if (!open.length) return ''
  return [
    `The plan review of this run ended at its round cap, and its final review reported the blocking and major findings below; no agent applied them. Check each against the plan artifacts as they stand now. Return every one that still holds as one of your findings, with the artifact it names, its location, a one-sentence summary and its fix as the recommendation, graded by the skill's own severity rule — except that one the plan review graded blocking is graded no lower than HIGH. Leave out one that no longer holds.`,
    open.map((f, i) => `${i + 1}. [${f.severity}] ${f.artifact} — ${f.location}\n   Problem: ${f.problem}\n   Fix: ${f.fix}`).join('\n'),
  ].join('\n')
}

if (runs('analyze')) {
  state.stagesRun.push('analyze')
  const P = featurePaths(state.featureDir)
  const handed = handedFindings(f => [normText(f.artifact), normText(f.location), normText(f.summary)].join(' | '))
  const serious = f => f.severity === 'CRITICAL' || f.severity === 'HIGH'
  let analysis = null
  let ended = null
  const max = cfg.maxAnalyzeRounds
  for (let round = 1; round <= max + 2; round++) {
    const final = round === max + 2
    analysis = await run('analyze', `analyze ${round}${final ? ' (final)' : ''}`, [
      UNATTENDED,
      SKILL_HOW('speckit-analyze'),
      FEATURE_CONTEXT(),
      `The feature is ${state.featureDir}. Read-only: change nothing.`,
      'Run the analysis in full and produce its report, then instead of offering remediation return every finding as data: id, severity as the skill grades it, the artifact it lives in (spec, plan, tasks, constitution, other), the location, a one-sentence summary and the concrete recommendation. Include the coverage figure.',
      REMOVED_TASK,
      round === 1 ? analyzeCarry() : '',
      handed.block('analysis', f => `${f.id} [${f.severity}] ${f.artifact} — ${f.location}: ${f.summary}`),
    ].filter(Boolean).join('\n'), S.analysis, 'Tasks')
    state.rounds.analyze = round
    const critical = analysis.findings.filter(f => f.severity === 'CRITICAL')
    const high = analysis.findings.filter(f => f.severity === 'HIGH')
    const survivors = analysis.findings.filter(f => serious(f) && handed.roundOf(f))
    log(`analyze round ${round}${final ? ' (final)' : ''}: ${critical.length} critical, ${high.length} high, ${analysis.findings.length - critical.length - high.length} medium/low, coverage ${analysis.coverage}${survivors.length ? `, ${survivors.length} survived the remediation that was handed it` : ''}`)
    if (survivors.length) {
      return await needsHuman('analyze',
        `${survivors.length} CRITICAL or HIGH analysis finding(s) survived the remediation round that was handed them: a remediation agent applied that round's findings — or declined one with its reason — and a later analysis, round ${round}, grades the same gap again. Survived: ${survivors.map(f => `${f.id} [${f.severity}] ${f.location} (handed in round ${handed.roundOf(f)})`).join('; ')}. A finding the loop has tried once and lost is usually a scope or design decision the run is not authorised to take — a requirement the plan narrows rather than meets, or a constitution question — so it is not tried again`,
        survivorDetail(analysis.findings, serious, handed))
    }
    if (critical.length + high.length === 0) { ended = 'approved'; break }
    if (final) {
      ended = 'round-cap'
      log(`analyze: round cap ${max} reached and its findings remediated; the final analysis found no survivor, so its ${analysis.findings.length} finding(s) go on to implement open, unapplied`)
      break
    }
    handed.hand(round, analysis.findings)
    const fixer = critical.length ? 'remediateCritical' : 'remediate'
    const remedied = await run(fixer, `remediate ${round}${round === max + 1 ? ' (cap)' : ''}`, [
      UNATTENDED,
      `Resolve the following analysis findings by editing the artifact each one names under ${state.featureDir} (plan.md and its companions, or tasks.md) or ${CONSTITUTION} for a constitution finding. Edit in place. A coverage gap is resolved by adding tasks to the right phase of ${P.tasks} with new ids after the current maximum, never by renumbering. A constitution violation is resolved by changing the plan, not the constitution, unless the finding says the constitution is what is wrong.`,
      SPEC_IS_NOT_OURS(P.spec),
      `${REMOVED_TASK} A removed task's id counts toward the current maximum.`,
      `So a finding the analysis files against the spec is resolved in the plan or the tasks where it can be — the spec is the authority the other artifacts are wrong against — and where it genuinely cannot be, put it in \`specChanges\` naming the requirement and the change the spec needs, apply the rest, and change nothing in ${P.spec}. \`specChanges\` stops the run and takes those findings to the spec's author, so put there only what no edit you are allowed to make can resolve.`,
      NO_TASK_WAITS_ON_A_PERSON,
      'Apply every CRITICAL and HIGH finding; apply MEDIUM and LOW ones when the edit is local and safe, otherwise leave them.',
      analysis.findings.map(f => `${f.id} [${f.severity}] ${f.artifact} — ${f.location}: ${f.summary}\n   Recommendation: ${f.recommendation}`).join('\n'),
      `Then commit with the message "tasks: analysis round ${round}". Return done=true with the short sha and the findings you left unapplied under skipped.`,
    ].join('\n'), S.done, 'Tasks')
    handed.noteSkipped(round, remedied.skipped)
    const specChanges = specChangesOf(remedied)
    if (specChanges.length) {
      return await needsHuman('analyze',
        `an analysis finding can only be resolved by changing ${P.spec}, and no stage of this run edits the spec: it belongs to the domain and technical experts and was written before the build started. The ${specChanges.length} change(s) below each go to the expert the change belongs to — a domain decision to the domain expert in writing, which reopens the spec handoff, and a technical one to the technical expert as an edit to the spec — and the build restarts at ${SPEC_EDIT_RESTART} afterwards, which reads the plan against the edited spec and repairs it in place. Every other finding of this round was applied`,
        specChanges, SPEC_EDIT_RESTART)
    }
  }
  state.analysis = { ended, rounds: state.rounds.analyze, findings: analysis ? analysis.findings : [] }
}

// ---------------------------------------------------------------------------
// Stage: implement, one agent per phase
// ---------------------------------------------------------------------------
// NO GATE IS EVER WEAKENED TO MAKE A WALL GREEN. The prohibition is in the ordinary
// prompt and enumerated in the repair prompt below, because the repair pass is where
// the temptation lives: an agent told to turn a red wall green, with no task list
// left to do it through, can always delete the test instead. A green wall bought that
// way is strictly worse than the needs-human exit it replaced, so the repair prompt
// names every move it may not make and tells the agent to return wallGreen=false and
// leave the tree alone when the only route it can see is one of them.
// A forced convergence task is closed by the fix (owner's rule, 2026-09-20: a severity
// floor of NONE means a LOW finding is fixed). The three blockers admitted are the ones
// an agent cannot work past from inside the feature — the third being a fix that would
// have to edit spec.md, which is the feature author's (2026-09-21); everything else claimed on
// product-catalog 004 — "this toolchain cannot express it", "a deployment decision",
// "the artifacts already name it as a gap", "the file is append-only" — was fixed by
// hand the same day, so none of those is a blocker and the prompt says so by name.
const FORCED_RULE = [
  '- FORCED CONVERGENCE PHASE. Every task in this phase is a finding the loop will not tolerate, and each is closed by the change that makes the finding untrue — code, a test, a migration, a gate, a document edit. It is never closed by writing down why it was not fixed: do not add a rationale entry anywhere, do not tick a task on the strength of one, and do not tick a task because an earlier rationale, a named gap in plan.md or a row in a gates document already describes the finding. Those describe the gap; the task is to close it.',
  '- A fix is blocked in exactly three cases: (a) a numbered requirement in spec.md or an article of the constitution forbids the change — quote it with its id; (b) the change needs a system outside this repository that does not exist; (c) the only fix is an edit to spec.md, which no stage of this run makes — name the requirement and the change the spec needs, and it goes to the spec\'s author. Nothing else is a blocker. "The toolchain cannot express this check", "this is a deployment decision", "the plan already names this as a gap", "no feature has proposed it yet" and "the file is append-only" are not blockers: find another shape for the check, make the decision and wire it, close the named gap, edit the file. A finding you believe is simply wrong is not ticked either: it stays unchecked and the reason goes in `blocked`.',
  '- A blocked task stays "- [ ]". Fix every task that is not blocked, tick those, and return the blocked ones in `blocked` with the blocker quoted. Never tick a task whose finding is still true.',
].join('\n')

const implementPhase = async (ph, phaseLabel, repair, forced) => {
  const P = featurePaths(state.featureDir)
  const ids = ph.taskIds.length ? `${ph.taskIds[0]}–${ph.taskIds[ph.taskIds.length - 1]}` : 'none'
  const r = await run('implement', `implement phase ${ph.number}${repair ? ' (wall repair)' : ''}`, [
    UNATTENDED,
    SKILL_HOW('speckit-implement'),
    FEATURE_CONTEXT(),
    `The feature is ${state.featureDir}. Arguments for the skill: "Execute only Phase ${ph.number}: ${ph.title} (tasks ${ids}). Every other phase is out of scope: do not start it, do not tick it."`,
    `${REMOVED_TASK} One inside that range is not yours to build or tick.`,
    'Rules for the unattended decisions this skill would otherwise ask about:',
    `- ${SPEC_IS_NOT_OURS(P.spec)} Where the only way you can see to finish a task is an edit to the spec, the task is not done: leave it "- [ ]" and say so, quoting the requirement. A run that reshapes the spec to fit the code has deleted its own definition of done.`,
    '- If a checklist has unchecked items, proceed anyway (the spec and plan were already reviewed) and list the unchecked items in your summary.',
    `- Definition of done for this phase: after its tasks, run \`${state.wall}\` and fix what it reports until it passes. Fix root causes in the code, never by weakening a gate, deleting a test or adding a suppression. Give up only after ${cfg.maxWallAttempts} full attempts, and then return wallGreen=false with the failing output.`,
    `- Requirement ids: cite an FR or SC only in qualified form \`${featureNum(state.featureDir)}/FR-nnn\` or \`${featureNum(state.featureDir)}/SC-nnn\`, never bare, outside ${state.featureDir}/ — code, tests, SQL, OpenAPI descriptions and docs/GATES.md included. Prove an id by citing it, in qualified form, in a test under a test root. If the wall's traceability gate fails on a missing citation, fix it by writing or citing the test that proves it. Write a row to specs/trace-waivers.tsv only when the task you are executing says to; never add one on your own judgment to turn the gate green.`,
    `- Tick each finished task in ${P.tasks} ("- [ ]" → "- [x]"). Wait for the wall to finish before you return; never leave it running in the background.`,
    '- Run the before_implement and after_implement hooks; if nothing committed the work, commit it yourself with a message naming the phase.',
    forced ? FORCED_RULE : '',
    repair ? [
      `WALL REPAIR PASS. A previous agent ran this phase and left \`${state.wall}\` RED after ${cfg.maxWallAttempts} attempts. You are a fresh context on the same phase and the same tree: read what it reported below, find the root cause in the code, fix that, and run the wall until it passes. Whatever of the phase's work is already done and committed stays done — do not redo it.`,
      `What the previous agent reported: ${repair.summary || '(no summary)'}`,
      'The failing wall output it returned:',
      '```',
      repair.wallOutput || '(the previous agent returned no output)',
      '```',
      'How you may NOT make it pass, in any circumstances: skipping, ignoring, disabling, quarantining or deleting a test; adding a suppression, an exclusion, a baseline entry, a traceability waiver row, or an ignore comment; editing the spec.md of the feature directory; lowering a threshold or a coverage figure; relaxing, reordering or removing a gate; editing the wall script, the build file or any gate configuration to stop it reporting; or passing a force flag. A green wall bought any of those ways is a worse outcome than the red wall you were given, and it is the one result this run cannot accept. If the only route you can see is one of them, change nothing, leave the tree as you found it, and return wallGreen=false naming the gate and why.',
    ].join('\n') : '',
    `Return wallGreen, the task ids of this phase still unchecked, the commit sha and a short summary${forced ? ', and in `blocked` one entry per task you left unchecked with its blocker quoted' : ''}.`,
  ].filter(Boolean).join('\n'), S.implemented, phaseLabel)
  state.implemented.push({ phase: ph.number, title: ph.title, wallGreen: r.wallGreen, unchecked: r.unchecked, commit: r.commit || '' })
  log(`phase ${ph.number} ${ph.title}${repair ? ' (wall repair)' : ''}: wall ${r.wallGreen ? 'green' : 'RED'}, ${r.unchecked.length} unchecked`)
  return r
}

// One phase run to a green wall and a fully ticked task list, with the two bounded
// retries the loop is allowed and no third. Both exist because the alternative was a
// needs-human exit on work the loop had the agents to finish (owner's rule,
// 2026-09-18: a run must not hand back what it could have fixed itself).
//   - A red wall gets ONE fresh-context repair pass carrying the failing output. The
//     first agent had already run the wall maxWallAttempts times inside its own
//     context, so a second attempt by that context is not what is missing; a second
//     context reading the same failure is, and that is this skill's own premise for
//     every review gate. Nothing in the pass may weaken a gate — see implementPhase.
//   - Tasks left unchecked get ONE second pass over exactly those ids: the shape the
//     implement stage already ran, which the convergence phases did not have.
// Ceiling: three implement agents per phase, no recursion, no retry of a retry. The
// loop escalates rather than inventing a fourth shape, and the `why` it returns says
// what was attempted and how often, so a person reading HANDOFF.md can tell "nobody
// tried" from "tried three ways". `what` names the phase for those messages.
const runPhaseToDone = async (ph, phaseLabel, what, forced) => {
  let r = await implementPhase(ph, phaseLabel, null, forced)
  if (!r.wallGreen) {
    log(`${what}: the wall is RED after ${cfg.maxWallAttempts} attempts inside one agent — one fresh-context repair pass, and the loop escalates if that fails too`)
    const repaired = await implementPhase(ph, phaseLabel, { wallOutput: r.wallOutput || '', summary: r.summary || '' }, forced)
    if (!repaired.wallGreen) {
      return {
        ok: false,
        why: `the wall is red at ${what}, and the loop has tried twice: the implementing agent ran \`${state.wall}\` up to ${cfg.maxWallAttempts} times and failed, then a second agent with a fresh context and that failing output fixed and re-ran it and failed as well. Neither was permitted to make it pass by weakening a gate`,
        detail: { unchecked: repaired.unchecked, wallOutput: repaired.wallOutput || r.wallOutput || '' },
      }
    }
    r = repaired
  }
  if (r.unchecked.length) {
    const again = await implementPhase({ ...ph, taskIds: r.unchecked }, phaseLabel, null, forced)
    if (!again.wallGreen) {
      return {
        ok: false,
        why: `the wall is red at ${what} after a second implement pass over the ${r.unchecked.length} task(s) the first one left unchecked`,
        detail: { unchecked: again.unchecked, wallOutput: again.wallOutput || '' },
      }
    }
    if (again.unchecked.length) {
      return {
        ok: false,
        why: `tasks of ${what} stay unchecked after two implement passes over them, both with the wall green: the loop ran the phase, then ran a second agent over exactly the ids left, and these are still "- [ ]". A task that two passes decline to tick is one the agents will not claim done${forced ? '. This is a forced convergence phase, where a task is closed only by the fix: each of these is a finding two agents tried to fix and returned as blocked, and the blocker each named is in the detail — a requirement that forbids the change, or a system that does not exist. Every other task of the phase was fixed and committed. What is left is a decision about the spec, not work the loop withheld' : ''}`,
        detail: forced ? { unchecked: again.unchecked, blocked: (again.blocked && again.blocked.length ? again.blocked : r.blocked) || [] } : again.unchecked,
      }
    }
  }
  return { ok: true }
}

const readPhases = async (label, group) => {
  const P = featurePaths(state.featureDir)
  const p = await run('phases', label, [
    UNATTENDED,
    `Read ${P.tasks} and return its phases: each "## Phase N: title" heading with N, the title, every task id (Txxx) under it in order, and how many of them are still unchecked ("- [ ]"). Parse only; change nothing.`,
    `${REMOVED_TASK} Leave its id out of the phase's task ids.`,
  ].join('\n'), S.phases, group)
  return p.phases
}

// The phase an append just wrote is found by its number or not at all. The reader is a
// parse-only agent on the cheapest tier, and on 2026-09-20 it returned 13 phases of a
// 31-phase tasks.md; the fallback then in place — the last phase the reader returned —
// sent implement at phase 13, already complete, which came back green, and the forced
// phase's thirteen tasks stayed unchecked through four further rounds that each reported
// them. So: one re-read that names the miss, then a person. A wrong phase implemented
// green is worse than a stop. Where the append gave no number, the last phase stands in
// only while it holds unchecked tasks, which a phase just appended always does.
const readAppendedPhase = async (number, label, group) => {
  const numbered = Number.isInteger(number)
  const pick = phases => numbered
    ? phases.find(p => p.number === number)
    : (phases.length && phases[phases.length - 1].unchecked > 0 ? phases[phases.length - 1] : undefined)
  const first = await readPhases(label, group)
  const hit = pick(first)
  if (hit) return hit
  const P = featurePaths(state.featureDir)
  const want = numbered ? `phase ${number}` : 'a last phase with unchecked tasks'
  log(`${label}: the reader returned ${first.length} phase(s), highest ${first.reduce((m, p) => Math.max(m, p.number), 0)}, and not ${want} — one re-read, and the loop escalates if that misses too`)
  const again = await run('phases', `${label} (re-read)`, [
    UNATTENDED,
    `Read ${P.tasks} to its last line and return its phases: each "## Phase N: title" heading with N, the title, every task id (Txxx) under it in order, and how many of them are still unchecked ("- [ ]"). Parse only; change nothing.`,
    `${REMOVED_TASK} Leave its id out of the phase's task ids.`,
    `An earlier read of this file returned ${first.length} phase(s) and stopped short: it did not return ${want}, which was appended to the end of the file moments ago. The file is long. Count the "## Phase" headings first (\`grep -c '^## Phase ' ${P.tasks}\`) and return exactly that many phases, the last of them included.`,
  ].join('\n'), S.phases, group)
  return pick(again.phases) || null
}

if (runs('implement')) {
  phase('Implement')
  state.stagesRun.push('implement')
  const phases = await readPhases('phases', 'Implement')
  log(`${phases.length} phases, ${phases.reduce((n, p) => n + p.unchecked, 0)} unchecked tasks`)
  for (const ph of phases) {
    if (ph.unchecked === 0) { log(`phase ${ph.number} already complete, skipped`); continue }
    const done = await runPhaseToDone(ph, 'Implement', `phase ${ph.number} (${ph.title})`)
    if (!done.ok) return await needsHuman('implement', done.why, done.detail)
  }
}

// ---------------------------------------------------------------------------
// Stage: converge ⇄ implement
// ---------------------------------------------------------------------------
if (runs('converge')) {
  phase('Converge')
  state.stagesRun.push('converge')
  // Converge has no fixed point: on the hand-driven 001-product-hierarchy run
  // (2026-09-18) it took five passes, and the fifth appended nothing only because
  // the operator stopped applying findings below the floor. So the severity floor
  // is the loop's only stop test, and reaching the cap is reported, not escalated.
  // The default floor is NONE (owner's decision 2026-09-18, reversing the LOW
  // default taken earlier the same day on that run's evidence): a tolerated finding
  // is a finding left open, so the loop tolerates none and the cap is what ends a
  // long run.
  const SEVERITY_FLOOR = cfg.severityFloor
  // NONE ranks below every graded severity, so every graded finding is above it.
  const floorRank = SEVERITY_FLOOR === 'NONE' ? SEVERITY_ORDER.length : SEVERITY_ORDER.indexOf(SEVERITY_FLOOR)
  // Rank-based against the declared order, so the floor means what its name says and
  // args.severityFloor moves it: MEDIUM stops the loop only once nothing is above
  // MEDIUM. A severity off the scale ranks above the floor — an ungradeable finding
  // is not a finding below it.
  const aboveFloorSev = f => {
    const rank = SEVERITY_ORDER.indexOf(f.severity)
    return rank === -1 || rank < floorRank
  }
  // Every log and exit message that names the floor: under NONE "nothing above NONE"
  // is not what the run means, and the reader is owed the rule rather than the name.
  const noneFloor = SEVERITY_FLOOR === 'NONE'
  const floorPhrase = noneFloor ? 'no finding is tolerated' : `nothing above ${SEVERITY_FLOOR}`
  const nothingLeft = noneFloor ? 'nothing graded at all' : `nothing graded above ${SEVERITY_FLOOR}`
  const gradeOf = findings => SEVERITY_ORDER.map(sev => `${findings.filter(f => f.severity === sev).length} ${sev.toLowerCase()}`).join(', ')
  // The floor is never in the prompt: the assessment grades on Step 5's scale alone
  // and the script filters afterwards, so moving args.severityFloor cannot move a
  // grade. One prompt for both kinds of round. assessOnly is the extra round after the cap:
  // same assessment, no append, no commit, so its findings are open work rather than
  // work the round that found it has already closed.
  // A deferral the owner wrote into the spec wins over forcing (owner's decision,
  // 2026-09-24). On wf_e4af9888-80a the loop forced and built 003/FR-034, which the
  // owner's post-plan clarification in spec.md had deferred to a later feature. Narrow by
  // construction: only spec.md text counts, quoted in `deferredBy`, because every other
  // artifact that could record a deferral — plan.md, tasks.md, research.md, GATES.md, a
  // waiver row — was written by this run or an earlier one from the spec, and the run's
  // own output is never the ground for not doing work (the resolution rule's test). A
  // deferred finding — one whose quotation checkDeferrals found in spec.md — is not
  // forced, not counted against the floor, never a survivor, and is reported under
  // converge.deferred.
  const specDefers = () => `An item ${P.spec} itself defers is not a gap of this feature: a requirement, criterion, scenario or capability that spec.md says is deferred, out of this feature's scope, or left to a later feature — in its requirements, assumptions, out-of-scope text or clarifications. Append no task for it. Return it as a finding all the same, graded as usual, with \`deferredBy\` holding that spec.md text quoted verbatim with its section or line. Only spec.md counts: a deferral, scope boundary or named gap written in plan.md, tasks.md, research.md, docs/GATES.md or specs/trace-waivers.tsv was written from the spec by a run like this one and defers nothing — a finding against it gets \`deferredBy\` empty and is handled like any other. A requirement spec.md states without deferring it is never deferred.`
  const convergePrompt = (round, assessOnly) => [
    UNATTENDED,
    SKILL_HOW('speckit-converge'),
    FEATURE_CONTEXT(),
    `The feature is ${state.featureDir}.`,
    SPEC_IS_NOT_OURS(P.spec),
    NO_TASK_WAITS_ON_A_PERSON,
    assessOnly
      ? 'ASSESS ONLY. Run the skill\'s assessment through its findings summary and stop there. Append nothing: tasks.md and every other file must be byte-for-byte unchanged when you finish, nothing is committed, and you run no hook that writes or commits. Return the outcome "converged", because nothing was appended; the findings below are the whole value of this round.'
      : `Run the assessment in full. Return the outcome exactly as the skill defines it: "converged" when nothing was appended, "tasks_appended" with the new phase number and the appended task ids otherwise. When tasks were appended, commit tasks.md with the message "tasks: convergence round ${round}".`,
    forcedSoFarBlock(),
    'Also return every gap the assessment found as findings — appended or not, actionable or not, including every gap it surfaced only for awareness — each graded by the severity rule in the skill\'s own Step 5 and by no other scale: CRITICAL, HIGH, MEDIUM or LOW exactly as that step defines them. For each appended one, name the task id that closes it; leave the task id empty for a gap no task closes.',
    REMOVED_TASK,
    'An FR or SC the wall\'s traceability gate reports as uncovered is unbuilt work, not a documentation finding: grade it like any other gap and, when it is actionable, append the task that writes the missing test — never a note explaining the absence.',
    specDefers(),
  ].filter(Boolean).join('\n')

  // -------------------------------------------------------------------------
  // The forced convergence round (2026-09-18).
  //
  // /speckit-converge Step 7 appends tasks only for the findings it judges
  // *actionable*, and Step 4 surfaces `unrequested` gaps for awareness alone, so a
  // "converged" return routinely carries graded findings that nothing in the
  // repository closes. Until today the loop escalated that to a person, and the
  // comment beside the escalation admitted the trap: the floor exists precisely to
  // refuse converge's non-actionability judgment, and under the NONE default the
  // branch fired on any finding at all. Observed on feature specs/002-product: the
  // run stopped on four LOW findings — FR traceability citations, one GATES.md table
  // row described too thinly, two test and naming wordings — and every one of them
  // was a mechanical edit the loop had the agents to make.
  //
  // So the loop gets the move it was missing. A floor that declines converge's
  // judgment must supply the work that judgment withheld: the script appends those
  // findings itself, one task per finding, and implements the phase through the same
  // implementPhase the appended rounds use, with the same wall gate.
  //
  // Round accounting: a forced round is done inside the slot of the round that
  // discovered it, and the loop then continues to its next round, exactly as a
  // `tasks_appended` round does. So maxConvergeRounds stays the single bound on the
  // stage — at most that many converge agents and at most that many
  // append-and-implement cycles, forced or not — and no pathological run can spin.
  // The extra cost of a forced round over an appended one is one forceAppend agent.
  // -------------------------------------------------------------------------
  const P = featurePaths(state.featureDir)
  // The reason every converge-stage `specChanges` exit gives — the assessment's and the
  // forced append's alike — in the words the tasks exit uses.
  const specWhy = (where, n) =>
    `${where} found ${n} question(s) only an expert can answer in ${P.spec}, and no stage of this run edits the spec or writes a task that waits on a person: it belongs to the domain and technical experts and was written before the build started. The change(s) below each go to the expert the change belongs to — a domain decision to the domain expert in writing, which reopens the spec handoff, and a technical one to the technical expert as an edit to the spec — and the build restarts at ${SPEC_EDIT_RESTART} afterwards, which reads the plan against the edited spec and repairs it in place`

  // A finding's identity, so the loop can tell a finding it already forced from a new
  // one. Severity, location and summary, lowercased with whitespace collapsed and a
  // trailing full stop dropped, because those three are the whole of what the schema
  // makes a converge round return about a finding and the wording arrives re-typed by
  // a fresh agent each round. This is exact-match identity: a finding whose summary
  // the next round re-words is a new identity and can be forced again. That is not
  // the bound — maxConvergeRounds is — and it is the honest reading of "already
  // tried": the loop claims a survivor only where it can show the same finding twice.
  const findingId = f => [
    String(f.severity || '').toUpperCase(),
    String(f.location || '').toLowerCase().replace(/\s+/g, ' ').trim().replace(/\.$/, ''),
    String(f.summary || '').toLowerCase().replace(/\s+/g, ' ').trim().replace(/\.$/, ''),
  ].join(' | ')
  // The set already forced in this run, keyed by that identity and valued with the
  // round that forced it; forcedList is the same record in order, for the return value
  // and for the handoff a survivor writes.
  const forcedIds = {}
  const forcedList = []
  // Findings the assessment reported as deferred by spec.md, once each, with the round
  // that first reported them and the quote it gave.
  //
  // A quotation is honoured only once a separate parse-only agent has found it in
  // spec.md (the `checkDeferrals` row). The script cannot read the file, and the
  // exemption is the one place the assessment's word alone would decide that work is
  // not done: a line quoted from plan.md, or one that is not in any file, would exempt a
  // finding from forcing and leave the run `converged` with the gap open. A quotation
  // the check does not find is dropped and the finding is handled like any other —
  // forced where it is above the floor — which is the rule that held before the
  // deferral existed; it is reported under converge.deferralsRefused.
  const quoted = f => typeof f.deferredBy === 'string' && f.deferredBy.trim() !== ''
  const quoteKey = f => normText(f.deferredBy)
  const quoteFound = {}
  const deferredOf = f => quoted(f) && quoteFound[quoteKey(f)] === true
  const deferredIds = {}
  const deferredList = []
  const refusedIds = {}
  const refusedList = []
  const checkDeferrals = async (findings, round) => {
    const keys = []
    const texts = []
    for (const f of findings.filter(quoted)) {
      const k = quoteKey(f)
      if (k in quoteFound || keys.includes(k)) continue
      keys.push(k)
      texts.push(f.deferredBy)
    }
    if (!keys.length) return
    const r = await run('checkDeferrals', `check spec deferrals ${round}`, [
      UNATTENDED,
      `Check each numbered quotation below against ${P.spec} and against nothing else. Each was offered as text quoted verbatim from that file, sometimes after the section or line it came from. Search and compare only: change nothing, and judge nothing about what the text means or whether it defers anything.`,
      `For each entry, take the text inside its quotation marks — the whole entry where it has none, less any leading section or line reference — and look for it in ${P.spec} with runs of whitespace collapsed on both sides and Markdown emphasis and code marks (\`*\`, \`_\`, backticks) ignored, for example \`tr -s '[:space:]' ' ' < ${P.spec} | grep -F -- '<the text>'\`. found=true only when that text is in ${P.spec}. A text that differs in any other way, is a paraphrase or a summary, or is found only in another file is found=false. Where an entry quotes several passages, every one of them must be found.`,
      texts.map((t, i) => `${i + 1}. ${t}`).join('\n'),
      'Return one entry per numbered quotation, with its number, whether it was found, and the spec.md line where it was.',
    ].join('\n'), S.deferralsChecked, 'Converge')
    const checks = Array.isArray(r.checks) ? r.checks : []
    keys.forEach((k, i) => {
      const c = checks.find(x => x && x.n === i + 1)
      quoteFound[k] = !!(c && c.found === true)
    })
    const refused = keys.filter(k => !quoteFound[k]).length
    log(`converge round ${round}: ${keys.length - refused} of ${keys.length} spec.md deferral quotation(s) found in ${P.spec}${refused ? `; ${refused} not found, so those findings are handled like any other` : ''}`)
  }
  const noteDeferred = (findings, round) => {
    for (const f of findings.filter(quoted)) {
      const id = findingId(f)
      if (deferredOf(f)) {
        if (deferredIds[id]) continue
        deferredIds[id] = round
        deferredList.push({ round, severity: f.severity, location: f.location, summary: f.summary, deferredBy: f.deferredBy })
      } else {
        if (refusedIds[id]) continue
        refusedIds[id] = round
        refusedList.push({ round, severity: f.severity, location: f.location, summary: f.summary, deferredBy: f.deferredBy })
      }
    }
  }
  // Exact match alone never fired: on product-catalog 004 (2026-09-20) the same
  // thirteen findings came back six rounds running, re-worded each time, and were
  // forced six times. So the assessment is also handed the numbered list of what this
  // run already forced and labels each finding it returns with the entry it restates
  // (repeatOf). The label is asked for after the assessment and changes nothing about
  // what is assessed or graded; it is the only reader placed to say "same gap".
  const forcedRoundOf = f => forcedIds[findingId(f)] ||
    (Number.isInteger(f.repeatOf) && f.repeatOf > 0 && forcedList[f.repeatOf - 1] ? forcedList[f.repeatOf - 1].round : 0)
  const survivorsOf = findings => findings.filter(f => forcedRoundOf(f))
  const forcedSoFarBlock = () => forcedList.length ? [
    'This run has already appended a task against each finding below and implemented it with the wall green. Assess exactly as you would without this list. Then, for every finding you return, set `repeatOf` to the number of the entry it restates — the same gap at the same place, however either is worded — or to 0 where it is new:',
    forcedList.map((f, i) => `${i + 1}. [${f.severity}] ${f.location} — ${f.summary}`).join('\n'),
  ].join('\n') : ''

  // The findings are rendered here and never described, for the reason the handoff
  // document is rendered here: the agent downstream must not be able to paraphrase a
  // finding, reorder them or drop one. It is told nothing about the severity floor —
  // it receives what the script already filtered, and re-grading is not its job.
  const forcedFindingsBlock = fs => fs.map((f, i) => [
    `${i + 1}. [${f.severity}] ${f.location || '(no location given)'}`,
    `   summary: ${f.summary}`,
    f.taskId ? `   the assessment named this existing task against it: ${f.taskId}` : '   the assessment named no task against it',
  ].join('\n')).join('\n')

  // The forced phase's title is fixed here rather than left to the agent, because three
  // separate things key off it: the append writes it, the reconcile looks for it, and
  // the parse-only reader certifies the verdict by finding it or not finding it.
  const forcedTitle = round => `Convergence (forced round ${round})`
  // The round number is matched whole, so round 1 is not found in "forced round 12", and a
  // phase with no open task is left out: since 2026-09-25 an earlier run's forced phases stay
  // in tasks.md, ticked, across a restart at review-plan as across one at converge, and one
  // titled for the same round would otherwise read as this round's phase.
  const holdsForcedPhase = (phases, round) => phases.filter(p => {
    const m = /forced round (\d+)/i.exec(String(p.title || ''))
    return m && Number(m[1]) === round && p.unchecked > 0
  })

  const forceAppendPrompt = (round, fs) => [
    UNATTENDED,
    `The feature is ${state.featureDir}; its tasks file is ${P.tasks}.`,
    `A convergence assessment of this feature has just reported that it appended no tasks, and reported the findings below all the same. They are open work: nothing in ${P.tasks} closes them. Your only job is to append them to ${P.tasks} as one new convergence phase, one task per finding, so that the implement stage runs them. You are not assessing anything. Do not read the code to re-check a finding, do not re-grade one, do not judge one non-actionable, do not drop, merge, split or reorder them, do not add a finding of your own, and do not fix anything. Every finding below gets exactly one task, in the order given, save for the one case the next paragraphs name.`,
    `${SPEC_IS_NOT_OURS(P.spec)} No task you write asks anyone else to either: a task worded to reconcile the spec with the code is that edit at one remove. Write each task against the code, the tests, the gates, the documents or the plan.`,
    `None of these is deferred by ${P.spec} itself — where the assessment offered a deferral for one, its quotation was not found in ${P.spec} — and that is the only deferral that exempts a finding here: a scope boundary, named gap or deferral in plan.md, tasks.md, research.md, docs/GATES.md or specs/trace-waivers.tsv is not a reason to drop a finding or to write its task as anything but the fix.`,
    NO_TASK_WAITS_ON_A_PERSON,
    `That is the one judgment this prompt leaves you. Where a finding below can be closed only by an answer from the spec's author — the only task you could write for it would wait on that answer — append nothing and commit nothing, for that finding or any other: return appended=false, \`tasks\` empty, and every such finding in \`specChanges\`, naming the requirement or section and the change the spec needs. The run stops there and goes to the author; the findings you did not name are assessed again when it restarts.`,
    'The findings, exactly as the assessment returned them:',
    forcedFindingsBlock(fs),
    `Append to the end of ${P.tasks}, following /speckit-converge's own append contract and nothing else: append only, rewrite nothing, renumber nothing, touch no existing task and no earlier convergence phase, and change no file but ${P.tasks}.`,
    `1. Scan every existing task id, the struck-through id of a removed task \`- ~~T015~~ (removed: …)\` included; let M be the maximum, and let N be the highest existing phase number plus one.`,
    `2. Write one new section header: \`## Phase N: ${forcedTitle(round)}\`. Write that title exactly: the rest of this run finds this phase by it.`,
    '3. Emit one checklist item per finding, in the order above, with zero-padded ids T{M+1:03d}, T{M+2:03d}, …, on this template:',
    '',
    '   ```markdown',
    '   - [ ] T042 <imperative work that closes the finding> per <the finding\'s location, copied> (forced)',
    '   ```',
    '',
    "   Substitute `<the finding's location, copied>` with the finding's location exactly as given above. The parenthetical is the literal word `forced` where an ordinary convergence task carries its gap type: the assessment gave you a severity, a location and a summary and no gap type, and inventing one would be a classification you made up.",
    '4. **One closure route: the change.** Every task names work that closes its finding — code, a test, a migration, a gate, a document edit — and is closed by that work being in the tree. Do not write a task that can be closed by recording why the finding is not a defect, by a rationale entry, or by pointing at a place that already declares the gap: a finding the artifacts already name as a gap is still a finding, and the task is to close the gap. Where the finding is about an *absence* ("no approval gate lives here"), the work is the check that fails when the absence stops being true, not a citation. Whether a fix turns out to be impossible is the implementer\'s to find by trying, not yours to predict in the task text.',
    `5. Commit ${P.tasks} and nothing else: \`git add -- ${P.tasks} && git commit -m "tasks: forced convergence round ${round}" -- ${P.tasks}\`. The pathspec matters: the tree may hold this run's other work.`,
    `Return appended=true only when the phase header and one task per finding are in ${P.tasks} on disk and committed, with the phase number and every task id paired with the location of the finding it was written from. If any step fails, return appended=false with the reason in note; never return appended=true for a partial append.`,
  ].join('\n')

  // Reconcile, 2026-09-19. A forced append that reports it failed used to end the run:
  // the reasoning was that the agent may have written part of the phase first, so a
  // blind retry would duplicate it. That is an argument against a *blind* retry and
  // not against a retry — and "somebody needs to look at tasks.md" is not a human-only
  // act, which is the owner's rule (2026-09-18) applied to the one site that had
  // survived it. Git is the oracle: at this instant nothing else in the run has
  // touched tasks.md since the last round's implement committed, so an uncommitted
  // change to it is the failed agent's own partial write and `git checkout` restores
  // the known-absent state exactly, with nothing judged by eye.
  const reconcilePrompt = (round, fs, fa) => [
    UNATTENDED,
    `The feature is ${state.featureDir}; its tasks file is ${P.tasks}.`,
    `An agent was asked to append a phase titled \`${forcedTitle(round)}\` to ${P.tasks}, holding ${fs.length} task(s) — one per finding — and to commit it. It reported that it failed: ${fa.note || '(it gave no reason)'}. ${fa.tasks && fa.tasks.length ? `Before failing it said it had written these ids: ${fa.tasks.map(t => t.taskId).filter(Boolean).join(', ') || '(none)'}.` : 'It named no task ids.'}`,
    `Your only job is to establish what state ${P.tasks} is actually in, bring it to one of two known states, and report which. You do not author a task, you do not decide anything about the findings, and you do not implement anything.`,
    'Read the evidence before you touch anything. Git is the record and your eye is not:',
    `1. \`git status --porcelain -- ${P.tasks}\` — an uncommitted change here is that agent's partial write. Nothing else in this run has touched the file since the previous round's work was committed.`,
    `2. \`git diff -- ${P.tasks}\` and \`git diff --staged -- ${P.tasks}\` — exactly what it wrote and did not commit.`,
    `3. \`git log -3 --oneline -- ${P.tasks}\` — whether it committed anything after all, for instance a commit named "tasks: forced convergence round ${round}".`,
    `4. Then read the end of ${P.tasks} itself, and look for a \`## Phase N: ${forcedTitle(round)}\` heading.`,
    'Bring the file to exactly one of two states, and nothing in between:',
    `- **absent** — no part of that phase is in ${P.tasks} and the file is well-formed. Where the partial write is uncommitted, reach this with \`git checkout -- ${P.tasks}\`, which restores the committed file byte for byte and is the whole of the repair: prefer it to editing. Where the partial phase was committed, remove exactly that phase — its heading and the task lines under it, nothing above it, nothing after it — and commit with the message "tasks: remove a partial forced convergence round ${round}".`,
    `- **present** — that phase is wholly there and well-formed: the heading, ${fs.length} task line(s) under it, each "- [ ] T###", none of them ticked, and no earlier phase or task altered. If it is committed, leave it; if it is only in the working tree, commit it with the message "tasks: forced convergence round ${round}". Report the phase number and the task ids.`,
    '**If you cannot establish either state with confidence, return state="unsure" and change nothing.** That is a correct answer, and the run has a path for it. In particular: if you cannot tell a line of the partial phase from work that was already in the file, if the diff touches anything outside the new phase, or if the git evidence and the file disagree, it is unsure. A guess here either deletes real tasks or leaves a duplicate phase behind, and nothing downstream can undo either.',
    `Hard limits. You may write to ${P.tasks} and to no other file: not spec.md, not plan.md, not the constitution, not any code. You never tick or untick a task ("- [ ]" stays "- [ ]", "- [x]" stays "- [x]"). You never renumber, reorder or reword an existing task, and you never touch a phase other than this round's forced one. You run no build and no hook.`,
    'Return the state, the phase number and task ids when it is present, whether you removed anything, the commit sha if you committed, and — in `evidence` — the git and file lines your verdict rests on, quoted. Somebody may read that instead of opening the file.',
  ].join('\n')

  let ended = null
  let endingFindings = []
  for (let round = 1; round <= cfg.maxConvergeRounds; round++) {
    const last = await run('converge', `converge ${round}`, convergePrompt(round, false), S.converged, 'Converge')
    state.rounds.converge = round
    // Read before the outcome: a phase this round appended beside a question for the
    // author is left unimplemented, since the restart the question needs is at review-plan.
    const askedR = specChangesOf(last)
    if (askedR.length) return await needsHuman('converge', specWhy(`converge round ${round}`, askedR.length), askedR, SPEC_EDIT_RESTART)
    const findings = Array.isArray(last.findings) ? last.findings : []
    await checkDeferrals(findings, round)
    noteDeferred(findings, round)
    const live = findings.filter(f => !deferredOf(f))
    const aboveFloor = live.filter(aboveFloorSev)
    const grade = gradeOf(live) + (live.length < findings.length ? `, ${findings.length - live.length} deferred by the spec` : '')
    if (last.outcome === 'converged') {
      // The floor is consulted before the outcome. /speckit-converge Step 7 calls a
      // round converged when it judges its findings non-actionable, and Step 4
      // surfaces `unrequested` gaps for awareness, so a HIGH finding can arrive on a
      // "converged" return. Nothing was appended, so another assessment would repeat
      // this round identically — but that is an argument for the loop authoring the
      // work, not for handing it to a person: converge judging a gap non-actionable
      // is exactly the judgment this floor refuses to make on its behalf, so the
      // floor owes the work that judgment withheld. The forced round supplies it.
      if (aboveFloor.length) {
        const survivors = survivorsOf(aboveFloor)
        if (survivors.length) {
          // The loop already appended and implemented a forced task against this
          // finding and the finding came back: the attempt did not take, and the
          // difference between "nobody tried" and "the loop tried and failed" is the
          // whole value of this handoff. Both sets go in the detail, survivors first.
          return await needsHuman('converge',
            `converge reported converged while still grading ${aboveFloor.length} finding(s) the floor ${SEVERITY_FLOOR} does not tolerate, and ${survivors.length} of them survived a forced convergence round: the loop had already appended a task against each and implemented it with the wall green, and the assessment reports it again. Forced and survived: ${survivors.map(f => `[${f.severity}] ${f.location} (forced in round ${forcedRoundOf(f)})`).join('; ')}. A finding is forced once, so this one is a person's.`,
            survivors.concat(aboveFloor.filter(f => !forcedRoundOf(f))))
        }
        log(`converge round ${round}: converged with nothing appended and ${aboveFloor.length} finding(s) above the floor (${grade}) — appending them as a forced convergence round; ${floorPhrase}, so converge's non-actionable judgment is not this loop's`)
        let fa = await run('forceAppend', `force-append converge ${round}`, forceAppendPrompt(round, aboveFloor), S.forceAppended, 'Converge')
        // Read before `appended`: a forced append that routes a finding to the author
        // returns appended=false by instruction, and that is not a failed write to reconcile.
        const askedF = specChangesOf(fa)
        if (askedF.length) return await needsHuman('converge', specWhy(`the forced append of converge round ${round}`, askedF.length), askedF, SPEC_EDIT_RESTART)
        // A failed append is reconciled and retried once, never escalated blind. The
        // sequence is: one reconcile agent brings tasks.md to a known state, the
        // parse-only `phases` reader certifies that state independently — the same
        // separation the finish wall repair uses, because the agent that cleans up is
        // not the one that may certify the result — and then the loop either
        // implements a phase that turned out to be wholly there, or appends once more
        // against a file that is wholly clean. Exactly one reconcile and one retry;
        // there is no retry of a retry, and the forced-once identity rule still
        // governs which findings may be forced at all.
        const failedAppend = fa.appended ? null : fa
        let recon = null
        // Set only where the certification read has already established the phase, so
        // the loop does not pay a second parse of a file nothing has touched since.
        let certifiedPhase = null
        if (!fa.appended) {
          log(`converge round ${round}: the forced append reported failure (${fa.note || 'no reason given'}) — reconciling ${P.tasks} against git before anything else touches it`)
          recon = await run('reconcileTasks', `reconcile tasks.md after forced append ${round}`, reconcilePrompt(round, aboveFloor, fa), S.reconciled, 'Converge')
          log(`reconcile after forced append ${round}: ${recon.state}${recon.removed ? ', a partial phase was removed' : ''}${recon.commit ? ` (${recon.commit})` : ''}`)
          if (recon.state === 'unsure') {
            // The legitimate escalation on this path, and the only one the reconcile
            // itself can produce: acting on a guess about this file either deletes
            // real tasks or leaves a duplicate phase, and neither is recoverable.
            return await needsHuman('converge',
              `the forced convergence round could not append its ${aboveFloor.length} finding(s) to tasks.md (${fa.note || 'the forced append reported no reason'}), and the reconcile that read tasks.md against git could not establish whether the forced phase is wholly absent or wholly present: ${recon.summary || 'it gave no summary'}. It changed nothing, deliberately — a guess here deletes real tasks or leaves a duplicate phase. What it saw is below, so tasks.md does not need to be worked out from scratch`,
              { state: recon.state, evidence: recon.evidence, summary: recon.summary, appendNote: fa.note || '', findings: aboveFloor })
          }
          // The certification is a different agent, and a parse-only one: the reconcile
          // does not get to be the witness to its own repair.
          const certPhases = await readPhases(`phases after reconciling tasks.md ${round}`, 'Converge')
          const seen = holdsForcedPhase(certPhases, round)
          const disagreement = recon.state === 'present'
            ? (seen.length !== 1
              ? `it reported the phase wholly present, and the reader finds ${seen.length} phase(s) titled for this forced round`
              : (seen[0].taskIds.length !== aboveFloor.length
                ? `it reported the phase wholly present with ${aboveFloor.length} task(s), and the reader finds ${seen[0].taskIds.length}`
                : (seen[0].unchecked !== seen[0].taskIds.length
                  ? `it reported the phase wholly present and unticked, and the reader finds ${seen[0].taskIds.length - seen[0].unchecked} of its ${seen[0].taskIds.length} task(s) already ticked`
                  : '')))
            : (seen.length ? `it reported the phase wholly absent, and the reader still finds ${seen.length} phase(s) titled for this forced round` : '')
          if (disagreement) {
            return await needsHuman('converge',
              `the forced convergence round could not append its ${aboveFloor.length} finding(s) to tasks.md, and the reconcile and the parse-only reader disagree about what is in the file afterwards: ${disagreement}. The loop stops rather than act on either account, because appending over a phase that is there duplicates it and implementing a phase that is not there does nothing. The reconcile's evidence is below`,
              { reconcileState: recon.state, evidence: recon.evidence, summary: recon.summary, appendNote: fa.note || '', findings: aboveFloor })
          }
          if (recon.state === 'present') {
            // The work is in the file and well-formed: the first agent wrote the phase
            // and then failed to say so. Re-appending would be exactly the duplication
            // this path exists to prevent, so the loop proceeds as if it had succeeded.
            log(`reconcile after forced append ${round}: the phase is wholly present as phase ${seen[0].number} with ${seen[0].taskIds.length} unticked task(s) — proceeding to implement it rather than appending it twice`)
            certifiedPhase = seen[0]
            fa = { appended: true, phase: seen[0].number, tasks: recon.taskIds && recon.taskIds.length ? recon.taskIds.map(id => ({ taskId: id, location: '' })) : [], commit: recon.commit || '' }
          } else {
            log(`reconcile after forced append ${round}: tasks.md holds no part of the forced phase${recon.removed ? ' (a partial one was removed)' : ''} — one retry of the forced append, and the loop escalates if that fails too`)
            const retry = await run('forceAppend', `force-append converge ${round} (retry)`, forceAppendPrompt(round, aboveFloor), S.forceAppended, 'Converge')
            const askedRetry = specChangesOf(retry)
            if (askedRetry.length) return await needsHuman('converge', specWhy(`the retried forced append of converge round ${round}`, askedRetry.length), askedRetry, SPEC_EDIT_RESTART)
            if (!retry.appended) {
              return await needsHuman('converge',
                `the forced convergence round could not append its ${aboveFloor.length} finding(s) to tasks.md, and the loop has tried twice: the first append failed (${failedAppend.note || 'no reason given'}), a reconcile read tasks.md against git and left it with no part of the forced phase in it${recon.removed ? ', having removed a partial one' : ''}, and a second append against that clean file failed as well (${retry.note || 'no reason given'}). tasks.md is in the known state the reconcile reports below — it does not need to be worked out`,
                { reconcileState: recon.state, removed: !!recon.removed, evidence: recon.evidence, firstAppendNote: failedAppend.note || '', retryNote: retry.note || '', findings: aboveFloor })
            }
            fa = retry
          }
        }
        // Forced once, whatever the implement pass then does with it: every finding
        // handed to that agent is marked, so a second pass at the same finding is a
        // person's and not another round's.
        for (const f of aboveFloor) {
          const id = findingId(f)
          if (!forcedIds[id]) {
            forcedIds[id] = round
            forcedList.push({ round, severity: f.severity, location: f.location, summary: f.summary })
          }
        }
        log(`converge round ${round}: forced ${fa.tasks ? fa.tasks.length : '?'} task(s) as phase ${fa.phase} (${(fa.tasks || []).map(t => t.taskId).join(', ')}) — each closable by the fix and by nothing else`)
        let fph = certifiedPhase
        if (!fph) {
          fph = await readAppendedPhase(fa.phase, `phases after forced append ${round}`, 'Converge')
          if (!fph) {
            return await needsHuman('converge',
              `the forced convergence round appended phase ${fa.phase} to tasks.md and two parse-only reads of the file did not return it, so there is no phase to hand to implement; the phase is in the file and committed (${fa.commit || 'no commit named'}) and its tasks are unimplemented`,
              { phase: fa.phase, tasks: fa.tasks || [], findings: aboveFloor })
          }
        }
        const fdone = await runPhaseToDone(fph, 'Converge', `forced convergence phase ${fph.number}`, true)
        if (!fdone.ok) return await needsHuman('converge', fdone.why, fdone.detail)
        // The forced round used this round's slot; the next round re-assesses, exactly
        // as it does after an appended one, so maxConvergeRounds bounds both alike.
        continue
      }
      ended = 'converged'
      endingFindings = findings
      log(`converge round ${round}: converged — nothing appended and ${nothingLeft} (${grade})`)
      break
    }
    log(`converge round ${round}: ${last.taskIds ? last.taskIds.length : '?'} tasks appended as phase ${last.phase} (${grade})`)
    // What was appended is implemented even when the loop is about to stop at the
    // floor: the tasks are already in tasks.md, and finish reports them unchecked otherwise.
    const ph = await readAppendedPhase(last.phase, `phases after converge ${round}`, 'Converge')
    if (!ph) {
      return await needsHuman('converge',
        `converge appended ${last.taskIds ? last.taskIds.length : 'some'} task(s) as phase ${last.phase} and two parse-only reads of tasks.md did not return that phase, so there is no phase to hand to implement; the tasks are in the file and unimplemented`,
        { phase: last.phase, taskIds: last.taskIds || [], findings })
    }
    const cdone = await runPhaseToDone(ph, 'Converge', `convergence phase ${ph.number}`)
    if (!cdone.ok) return await needsHuman('converge', cdone.why, cdone.detail)
    // A round that appends tasks and grades nothing has not shown the floor was
    // reached; it has shown nothing. Counted as above the floor, so the loop goes on.
    if (live.length === 0) {
      log(`converge round ${round}: appended tasks as phase ${ph.number} and graded nothing — what is left is unknown, not below the floor, so the loop continues`)
      continue
    }
    // Unreachable under the NONE default: a round that graded nothing has already
    // continued above, and under NONE every graded finding is above the floor. It
    // is the in-loop exit for a run that raised the floor to LOW, MEDIUM or HIGH.
    if (aboveFloor.length === 0) {
      ended = 'severity-floor'
      endingFindings = findings
      log(`converge round ${round}: nothing above ${SEVERITY_FLOOR} (${grade}) — every gap this round graded was appended as phase ${ph.number} and implemented, so the loop stops at the severity floor`)
      break
    }
  }
  if (!ended) {
    // Every round above implemented its appended phase before the loop re-checked, so
    // that round's findings are closed work and cannot say what the cap leaves open.
    // One assess-only round — the shape the review and analyze loops already run as
    // max + 1 — reports what no implement pass has closed.
    const assessRound = state.rounds.converge + 1
    const assess = await run('converge', `converge ${assessRound} (assess only)`, convergePrompt(assessRound, true), S.converged, 'Converge')
    // A question for the author is not an open finding to carry to finish under
    // round-cap: the run would end `done` with it.
    const askedA = specChangesOf(assess)
    if (askedA.length) return await needsHuman('converge', specWhy(`the assess-only converge round ${assessRound}`, askedA.length), askedA, SPEC_EDIT_RESTART)
    const findings = Array.isArray(assess.findings) ? assess.findings : []
    await checkDeferrals(findings, assessRound)
    noteDeferred(findings, assessRound)
    const aboveFloor = findings.filter(f => !deferredOf(f)).filter(aboveFloorSev)
    endingFindings = findings
    if (aboveFloor.length === 0) {
      // Under NONE this round graded nothing at all, so the run stopped because
      // converge found nothing — not because a floor tolerated what it found. The
      // label would otherwise name a floor that tolerates nothing.
      ended = noneFloor ? 'converged' : 'severity-floor'
      log(noneFloor
        ? `converge: ${cfg.maxConvergeRounds} rounds implemented, and the assess-only round after them graded nothing at all — converged`
        : `converge: ${cfg.maxConvergeRounds} rounds implemented, and the assess-only round after them graded nothing above ${SEVERITY_FLOOR} (${gradeOf(findings)}) — stopped at the severity floor`)
    } else {
      // The assess-only round appends nothing by construction, so a finding it reports
      // is never forced here — a forced round exists only inside the loop, where a
      // later round can re-assess what it wrote. The cap stays a reported outcome
      // rather than a human question, and the log says which of the open findings the
      // loop had already forced and lost, because that is what a reader needs.
      const survived = survivorsOf(aboveFloor)
      ended = 'round-cap'
      log(`converge round cap ${cfg.maxConvergeRounds} reached (floor ${SEVERITY_FLOOR}, ${floorPhrase}): the assess-only round after the last implemented phase graded ${aboveFloor.length} open finding(s) (${gradeOf(findings)}), unimplemented${survived.length ? `, ${survived.length} of them already forced and implemented in an earlier round and still reported` : ''} — carried to finish; the wall is the gate`)
    }
  }
  // The findings of whichever assessment ended the loop, never of an earlier one;
  // `forced` is every finding this run appended itself, with the round that did it.
  state.converge = { ended, rounds: state.rounds.converge, floor: SEVERITY_FLOOR, forced: forcedList, deferred: deferredList, deferralsRefused: refusedList, findings: endingFindings }
}

// ---------------------------------------------------------------------------
// Stage: finish
// ---------------------------------------------------------------------------
let finished = null
if (runs('finish')) {
  phase('Finish')
  state.stagesRun.push('finish')
  const P = featurePaths(state.featureDir)
  const finishPrompt = [
    UNATTENDED,
    `Close out the feature on branch ${state.branch || '(current branch)'}:`,
    `1. Run \`${state.wall}\` and wait for it; wallGreen is whether it passed. Do not fix anything.`,
    `2. \`git status --porcelain\` is empty → clean=true. If it is not, commit the leftovers with the message "feature: leftovers after converge" and report clean=true only if that commit succeeded.`,
    `3. Every task in ${P.tasks} is "- [x]" → allTasksChecked=true; otherwise false, and name the unchecked ids in the summary. ${REMOVED_TASK}`,
    cfg.push ? '4. Push the branch: `git push -u origin HEAD`. pushed=true only if the push succeeded.' : '4. Do not push; pushed=false.',
    cfg.mergeInto
      ? `5. Fast-forward \`${cfg.mergeInto}\` onto this branch: \`git checkout ${cfg.mergeInto} && git merge --ff-only ${state.branch} && git push origin ${cfg.mergeInto}\`, then check ${state.branch} out again. merged=true only if every command succeeded; a non-fast-forward is merged=false with the reason in the summary.`
      : '5. Do not merge; merged=false.',
    '6. head is the short sha of the feature branch.',
  ].join('\n')
  finished = await run('finish', 'finish', finishPrompt, S.finished, 'Finish')
  log(`finish: wall ${finished.wallGreen ? 'green' : 'RED'}, ${finished.pushed ? 'pushed' : 'not pushed'}${finished.merged ? `, merged into ${cfg.mergeInto}` : ''}`)
  // A red wall at finish is not a question for a person either: the loop turned this
  // same wall green after every implemented phase, with the same agents, and a wall
  // that was green at the last phase and is red here is a defect in the feature and
  // not a decision (owner's rule, 2026-09-18). So it gets ONE bounded repair pass —
  // and the re-check is a second finish agent rather than the repairing agent's own
  // word, because an agent that repairs a gate is not the one that may declare it
  // green. That separation is the whole safety of this path: the repair prompt
  // enumerates the moves that are forbidden, and the verdict still comes from an
  // agent that only runs the wall and reports. Exactly one repair and one re-verify;
  // a still-red wall after them is the needs-human exit below, which now says the
  // loop tried.
  if (!finished.wallGreen) {
    log('finish: the wall is RED — one fresh-context repair pass, then a second finish agent re-runs the wall to verify')
    const repair = await run('implement', 'finish wall repair', [
      UNATTENDED,
      `The feature ${state.featureDir} on branch ${state.branch || '(current branch)'} is implemented and every convergence round is done, but its definition of done is red: \`${state.wall}\` failed at the close-out check. It was green after the last implemented phase, so something later broke it. Find the root cause in the code and fix it.`,
      `1. Run \`${state.wall}\` and read what fails. What the close-out agent reported: ${finished.summary || '(no summary)'}`,
      `2. Fix the root cause in the code, then run the wall again, up to ${cfg.maxWallAttempts} full attempts.`,
      'How you may NOT make it pass, in any circumstances: skipping, ignoring, disabling, quarantining or deleting a test; adding a suppression, an exclusion, a baseline entry, a traceability waiver row, or an ignore comment; editing the spec.md of the feature directory; lowering a threshold or a coverage figure; relaxing, reordering or removing a gate; editing the wall script, the build file or any gate configuration to stop it reporting; or passing a force flag. A green wall bought any of those ways is a worse outcome than the red wall you were given, and it is the one result this run cannot accept. If the only route you can see is one of them, change nothing, leave the tree as you found it, and return wallGreen=false naming the gate and why.',
      `3. Tick nothing in ${P.tasks} and add no task: this is a repair, not a phase. Commit your fix with a message naming what was broken.`,
      'Return wallGreen as you saw it, an empty unchecked list, the commit sha and a short summary of the root cause. Your verdict is not final — a separate agent re-runs the wall after you.',
    ].join('\n'), S.implemented, 'Finish')
    log(`finish wall repair: the repairing agent saw the wall ${repair.wallGreen ? 'green' : 'RED'} — re-verifying with a finish agent`)
    finished = await run('finish', 'finish (re-verify after wall repair)', finishPrompt, S.finished, 'Finish')
    log(`finish re-verify: wall ${finished.wallGreen ? 'green' : 'RED'}, ${finished.pushed ? 'pushed' : 'not pushed'}${finished.merged ? `, merged into ${cfg.mergeInto}` : ''}`)
    state.finishRepaired = true
  }
}

// The one needs-human exit that does not go through needsHuman():
// finish ran and its wall is red. It gets the same artifact for the same reason — a
// red wall at finish is the whole verdict of the run and it must not live only in the
// invoking session — while this return keeps its own shape, with `handoff` added
// beside the rest. On a `done` return there is nothing to hand off and no agent runs.
const finishNeedsHuman = !!(finished && !finished.wallGreen)
const finishHandoff = finishNeedsHuman
  ? await writeHandoff('finish', state.finishRepaired
    ? `the definition of done is red at finish and the loop has tried twice: \`${state.wall}\` failed at close-out, one fresh-context agent fixed what it could and re-ran it, and the finish agent that re-verified afterwards still reports it red. Neither was permitted to make it pass by weakening a gate`
    : `the definition of done is red at finish: \`${state.wall}\``, {
    summary: finished.summary,
    allTasksChecked: finished.allTasksChecked,
    clean: finished.clean,
    pushed: finished.pushed,
    merged: finished.merged,
    head: finished.head,
    convergeEnded: state.converge ? state.converge.ended : null,
    convergeFindings: state.converge ? state.converge.findings : null,
  })
  : null

return {
  status: finishNeedsHuman ? 'needs-human' : 'done',
  featureDir: state.featureDir,
  branch: state.branch,
  createdBranch: state.createdBranch,
  baseBranch: state.baseBranch,
  baseBranchSource: state.baseBranchSource,
  wall: state.wall,
  rounds: state.rounds,
  reviewPlan: state.reviewPlan,
  tasksUpdate: state.tasksUpdate,
  analysis: state.analysis,
  converge: state.converge,
  implemented: state.implemented,
  finish: finished,
  handoff: finishHandoff,
  stagesRun: state.stagesRun,
}
