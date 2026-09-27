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
| `skills/new-java-backend/` | Project creation: lands `dulguun0225/java-backend-template` at a pinned commit, then `specify init --here` |
| `BACKLOG.md` | Owed work |

```bash
mise trust && mise install && npm ci   # once per machine; npm ci before any script
npm run check          # skills the CLI discovers; run after any frontmatter edit
npm run gates          # dangling pointers, description budget; CI runs check + gates
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
2. Technical expert: `/plan-feature` (plan, review-plan, tasks, analyze). Questions that would change the spec go to `QUESTIONS.md` on the feature branch, with a recommended answer each; the technical expert sends the domain expert the one `/speckit-clarify` line the file holds, the domain expert answers on the base branch and pushes, and `/plan-feature` reruns `from: "review-plan"`. Repeat until a run ends with no question.
3. Technical expert: `/build-feature` (`from: "implement"`: implement, converge, finish). Headless form: `claude -p "/build-feature" --permission-mode bypassPermissions`.

### How `build-feature/workflow.mjs` works

- A Workflow tool script (`export const meta`, `agent()`, `phase()`, `args`). Stages run in sequence: `preflight → plan → review-plan ⇄ fix-plan → tasks → analyze ⇄ remediate → implement (one agent per phase) → converge ⇄ implement → finish`.
- Every agent is a fresh subagent. The plan, tasks, analyze, implement and converge agents invoke the matching spec-kit skill (`speckit-plan`, `speckit-tasks`, `speckit-analyze`, `speckit-implement`, `speckit-converge`). A fresh-context refutation review (`review-plan`) replaces spec-kit's human gate.
- The Workflow sandbox has no filesystem, no `Date` and no Node APIs; agents do all reads, writes and git. Plain `node --check` rejects the file because of top-level `return`.
- Loop exits: review and analyze stop when a finding repeats from an earlier round; converge stops at `args.severityFloor` (default `NONE`) or `maxConvergeRounds` (6). At `NONE` a run normally ends at the round cap.
- Restart with `args.from: "<stage>"` (`args.wall` required); after the domain expert answers, `plan-feature` restarts `from: "review-plan"`. `resumeFromRunId` replays an interrupted run.
- Returns `status: "done" | "needs-human"`. On `needs-human` an agent commits `HANDOFF.md` on the feature branch, and `QUESTIONS.md` beside it when the run holds questions for the domain expert. Review-plan, tasks and analyze collect those questions and the run stops after analyze; converge stops where it finds one; a start after analyze refuses while `QUESTIONS.md` is on the branch. The invoking session resolves what it can with high confidence, never by editing `spec.md`, records it in `RESOLUTIONS.md` and restarts; only the rest goes to a person.
- Never writes `spec.md`, never commits on the base branch, never rebases or force-pushes, opens no PR. Base branch comes from `args.baseBranch`, else a root `CLAUDE.md` line of exactly `` Base branch: `dev` ``, else `origin/HEAD`, else the single local `main`/`master`/`develop`/`dev`.
- Run journals are machine-local: `~/.claude/projects/<project path, / replaced by ->/<session id>/workflows/wf_*.json`.

### What a target repo must have

`.specify/` with `.specify/memory/constitution.md`; `.claude/skills/speckit-*/`; a root `CLAUDE.md` naming the definition-of-done command and the `Base branch:` line; a clean tree and an `origin` remote. Prompts assume `java-backend-template` vendored into `backend/`.

### Limits

- Implement is the most expensive stage, converge second; cost is recorded in tokens only.
- A feature whose spec is not ready can use many runs without reaching implement.
- Several mechanisms have been tested only against a stub of the Workflow sandbox, never in a real run.
