# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

scalith is an AI software factory, planned in three stages:

1. Compose spec-kit's steps into workflows so a feature goes from spec to implemented code with less human involvement.
2. A local software factory.
3. A server-hosted AI software factory.

**spec-kit is the current method, not a requirement.** It may be replaced. Keep spec-kit command names, artifact file names and prompts behind a boundary the rest of the code does not depend on.

## Layout and commands

Agent Skills distributed with Vercel's `skills` CLI, one `skills/<name>/SKILL.md` each, all manual-only (`disable-model-invocation: true`). The engineering-decision skills these load alongside (`java-backend-rules`, `money`, …) are in the sibling repo `../skills` (`dulguun0225/skills`).

| Path | What it is |
| --- | --- |
| `skills/build-feature/SKILL.md`, `workflow.mjs` | The unattended feature build: one Claude Code Workflow script, run `from: "implement"` by this skill. Both files are large; read by section |
| `skills/plan-feature/` | Runs the same script `until: "analyze"` and hands the spec's open questions to the domain expert; no script of its own |
| `skills/init-pipeline/` | Sets up a project `/new-java-backend` (in `../skills`) created for the pipeline: copies `project/` (constitution, `.claude/settings.json`, the traceability gate, `scripts/wall-checks.txt`) into it without overwriting, except that an existing `.claude/settings.json` gets `worktree.baseRef` when missing and an existing `scripts/wall-checks.txt` gets its missing lines; appends `CLAUDE.section.md` to its `CLAUDE.md`, then `specify init`; `--update` refreshes the gate in an existing project |
| `BACKLOG.md` | Owed work |

```bash
mise trust && mise install && npm ci   # once per machine; npm ci before any script
npm run check          # skills the CLI discovers; run after any frontmatter edit
npm run gates          # dangling pointers, description budget
node skills/init-pipeline/project/scripts/check-traceability.selftest.mjs   # self-test of the gate init-pipeline installs; CI runs check, gates and this
npm run runs -- --repo <abs path> --since <date>   # report from Workflow run journals in service repos
npm run try -- <name>  # run one skill from the working tree
```

Flags go after `--`; without it npm swallows them. A skill missing from `npm run check` usually means a frontmatter YAML error (an unquoted `: ` in `description`).

## Conventions

- `SKILL.md` holds rules, not history: no dates, decision records, rejected alternatives, run ids or status lines.
- No relative link leaves its own skill directory; `check:pointers` fails the build on one.
- Never state a skill count in prose; run `npm run check`.

## How the skills work

### Pipeline

Three loops over stock spec-kit commands:

1. Domain expert, on the base branch: `/speckit-specify`, `/speckit-clarify` until nothing is left to ask.
2. Technical expert: `/plan-feature` (plan, review-plan, tasks, analyze), on the base branch. Questions that would change the spec go to `QUESTIONS.md` beside the spec, with a recommended answer each; the technical expert sends the domain expert the one `/speckit-clarify` line the file holds, which updates the base branch first and commits and pushes the answered spec, and `/plan-feature` reruns `from: "review-plan"`. Repeat until no question is open: a `MEDIUM` or `LOW` question is also closed when the technical expert or the domain expert says the build may start on its recommended answer.
3. Technical expert: `/build-feature` (`from: "implement"`: implement, converge, finish), on a build branch; finish fast-forwards the base branch to it and deletes it. Headless form: `claude -p "/build-feature" --permission-mode bypassPermissions`.

### How `build-feature/workflow.mjs` works

- A Workflow tool script (`export const meta`, `agent()`, `phase()`, `args`). Stages run in sequence: `preflight → plan → review-plan ⇄ fix-plan → tasks → analyze ⇄ remediate → implement (one agent per phase) → converge ⇄ implement → finish`.
- Every agent is a fresh subagent. The plan, tasks, analyze, implement and converge agents invoke the matching spec-kit skill (`speckit-plan`, `speckit-tasks`, `speckit-analyze`, `speckit-implement`, `speckit-converge`). A fresh-context refutation review (`review-plan`) replaces spec-kit's human gate.
- The Workflow sandbox has no filesystem, no `Date` and no Node APIs; agents do all reads, writes and git. Plain `node --check` rejects the file because of top-level `return`.
- Loop exits: review and analyze stop when a finding repeats from an earlier round; converge stops at `args.severityFloor` (default `NONE`) or `maxConvergeRounds` (6). At `NONE` a run normally ends at the round cap.
- Restart with `args.from: "<stage>"` (`args.wall` required); after the domain expert answers, `plan-feature` restarts `from: "review-plan"`. `resumeFromRunId` replays an interrupted run.
- Returns `status: "done" | "needs-human"`. On `needs-human` after preflight an agent commits `HANDOFF.md` in the feature directory — on the base branch during planning, on the build branch during the build — and `QUESTIONS.md` beside it when the run holds questions for the domain expert. Review-plan, tasks and analyze collect those questions, each graded by what a different answer would undo, and the run stops after analyze while one is open. Only a person leaves a `MEDIUM` or `LOW` question open, recorded as `yes — <who>` in the table in `QUESTIONS.md`; later planning runs carry it. The build stages ask nothing. A start after analyze refuses while `QUESTIONS.md` holds an open question. The invoking session resolves what it can with high confidence, never by editing `spec.md`, records it in `RESOLUTIONS.md` and restarts; only the rest goes to a person.
- Branches: planning runs on the base branch, brought up to date by fast-forward, and commits only in the feature directory plus what the plan step writes outside it (the agent context file's managed section, an admitted constitution amendment, a `docs/GATES.md` entry); before each push `git pull --rebase origin <base>` moves only the run's own commits (up to 3 attempts), and a conflict is aborted and stops the run. The plan review records the spec blob it read in `<featureDir>/spec-reviewed.sha`; a later start whose base spec differs from it, before a build branch exists, restarts at `review-plan`. The build runs on `build/<NNN>-<name>`, made from the up-to-date base once every preflight check has passed and pushed at once, or resumed, with the base merged in, never rebased. A feature's spec is fixed once its build branch exists: a change is a new feature, and a differing base spec is held, never merged. Finish lands only with every task ticked, the wall green and the tree clean: it merges the base in again, runs the wall, fast-forwards the base by a push origin takes only as a fast-forward (up to 3 attempts), and deletes the branch. `mergeInto` may only name the base. Never writes `spec.md`, never rebases shared history or force-pushes, opens no PR. Base branch comes from `args.baseBranch`, else a root `CLAUDE.md` line of exactly `` Base branch: `dev` ``, else `origin/HEAD`, else the single local `main`/`master`/`develop`/`dev`. A base of `main` or `master` stops the run, and `mergeInto` may not name either: service projects work on `dev`, and their `main` takes pull requests from `dev` only. This repo itself works on `main`.
- Run journals are machine-local: `~/.claude/projects/<project path, / replaced by ->/<session id>/workflows/wf_*.json`.

### What a target repo must have

Created by `/new-java-backend` from `dulguun0225/skills`, then set up by `/init-pipeline`, which provides the constitution and the traceability gate: `node scripts/check-traceability.mjs` at the project root, run by the backend wall through `scripts/wall-checks.txt`.

`.specify/` with `.specify/memory/constitution.md`; `.claude/skills/speckit-*/`; a root `CLAUDE.md` naming the definition-of-done command and `` Base branch: `dev` ``; a clean tree and an `origin` remote. `dev` takes direct pushes: the template's ruleset forbids only its deletion and a force-push, and an existing service re-runs `node scripts/apply-ruleset.mjs` to get it. spec-kit's `git` extension is disabled where present (`specify extension disable git`, committed): spec-kit 1.0.8 installs it only with `specify init --extension git`, older releases by default, and its mandatory `before_specify` hook moves `/speckit-specify` onto an `<NNN>-<name>` branch. Prompts assume `java-backend-template` vendored into `backend/`.

### Limits

- Implement is the most expensive stage, converge second; cost is recorded in tokens only.
- A feature whose spec is not ready can use many runs without reaching implement.
- Several mechanisms have been tested only against a stub of the Workflow sandbox, never in a real run.
