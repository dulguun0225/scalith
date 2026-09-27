# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

scalith is an AI software factory, planned in three stages:

1. Compose spec-kit's steps into workflows so a feature goes from spec to implemented code with less human involvement.
2. A local software factory.
3. A server-hosted AI software factory.

**spec-kit is the current method, not a requirement.** It may be replaced. Keep spec-kit command names, artifact file names and prompts behind a boundary the rest of the code does not depend on.

## Layout and commands

Agent Skills distributed with Vercel's `skills` CLI: `skills/<name>/SKILL.md` (loaded when the skill runs) plus `evidence.md` (grounds, for a person; no agent loads it). Moved here 2026-09-27 from the sibling repo `../skills` (`dulguun0225/skills`) at `2ab5dc4`; history before that date is there, and so are the engineering-decision skills these load alongside (`java-backend-rules`, `money`, …).

| Path | What it is |
| --- | --- |
| `skills/build-feature/SKILL.md`, `workflow.mjs` | The unattended feature build: one Claude Code Workflow script. Both files are large; read by section |
| `skills/converge-feature/` | Runs the same script `from: "converge"`, `until: "finish"`; no script of its own |
| `skills/spec-handoff-questions`, `-domain`, `-joint`, `build-feature-prepare` | The four-stage spec handoff that runs before a build |
| `skills/new-java-backend/` | Project creation: lands `dulguun0225/java-backend-template` at a pinned commit, then `specify init --here` |
| `docs/history/runs.md` | Ledger of real runs, and the harvest procedure that turns a sweep into skill edits |
| `docs/history/` (other files) | Decision records per skill family |
| `BACKLOG.md` | Owed work; a closed row leaves it and its record goes to `docs/history/` |

```bash
mise trust && mise install && npm ci   # once per machine; npm ci before any script
npm run check          # skills the CLI discovers; run after any frontmatter edit
npm run gates          # evidence order, dangling pointers, description budget; CI runs check + gates
npm run runs -- --repo <abs path> --since <date>   # report from Workflow run journals in service repos
npm run try -- <name>  # run one skill from the working tree
```

Flags go after `--`; without it npm swallows them. A skill missing from `npm run check` usually means a frontmatter YAML error (an unquoted `: ` in `description`).

## Conventions carried from `dulguun0225/skills`

Its `CLAUDE.md` holds the full authoring rules; these apply to every skill here:

- Directive text in `SKILL.md`, grounds in `evidence.md`. A fix to one must be checked against the other; a stale sentence left in `SKILL.md` is the failure that recurs.
- Each decision carries its date and who made it, and names the rejected default and why it lost.
- Status lines (*decided, not yet validated*, "no run has taken it") are claims too: after a `npm run runs` sweep, re-read every *unrun* / *unmeasured* sentence against what the journals show.
- No relative link leaves its own skill directory; `check:pointers` fails the build on one.
- Never state a skill count in prose; run `npm run check`.

## How the skills work

### Pipeline today

1. Domain expert: `/speckit-specify`, `/speckit-clarify` on the base branch.
2. Spec handoff, writing `HANDOFF-QUESTIONS.md` in the feature directory: `/spec-handoff-questions` → `/spec-handoff-domain` (domain expert) → `/spec-handoff-joint` (both experts, only if needed) → `/spec-handoff-questions` again → `/build-feature-prepare` (technical expert). Derived from eight build stops whose cause was a gap in an already-clarified spec.
3. `/build-feature`, unattended. Headless form: `claude -p "/build-feature" --permission-mode bypassPermissions`.

### How `build-feature/workflow.mjs` works

- A Workflow tool script (`export const meta`, `agent()`, `phase()`, `args`). Stages run in sequence: `preflight → plan → review-plan ⇄ fix-plan → tasks → analyze ⇄ remediate → implement (one agent per phase) → converge ⇄ implement → finish`.
- Every agent is a fresh subagent. The plan, tasks, analyze, implement and converge agents invoke the matching spec-kit skill (`speckit-plan`, `speckit-tasks`, `speckit-analyze`, `speckit-implement`, `speckit-converge`). A fresh-context refutation review (`review-plan`) replaces spec-kit's human gate.
- The Workflow sandbox has no filesystem, no `Date` and no Node APIs; agents do all reads, writes and git. Plain `node --check` rejects the file because of top-level `return`.
- Loop exits: review and analyze stop when a finding repeats from an earlier round; converge stops at `args.severityFloor` (default `NONE`) or `maxConvergeRounds` (6). At `NONE` a run normally ends at the round cap.
- Restart with `args.from: "<stage>"` (`args.wall` required); after a spec edit restart `from: "review-plan"`. `resumeFromRunId` replays an interrupted run.
- Returns `status: "done" | "needs-human"`. On `needs-human` an agent commits `HANDOFF.md` on the feature branch. The invoking session resolves what it can with high confidence, records it in `RESOLUTIONS.md` and restarts; only the rest goes to a person.
- Never writes `spec.md`, never commits on the base branch, never rebases or force-pushes, opens no PR. Base branch comes from `args.baseBranch`, else a root `CLAUDE.md` line of exactly `` Base branch: `dev` ``, else `origin/HEAD`, else the single local `main`/`master`/`develop`/`dev`.
- Run journals are machine-local: `~/.claude/projects/<project path, / replaced by ->/<session id>/workflows/wf_*.json`.

### What a target repo must have

`.specify/` with `.specify/memory/constitution.md`; `.claude/skills/speckit-*/`; a root `CLAUDE.md` naming the definition-of-done command and the `Base branch:` line; a clean tree and an `origin` remote. Prompts assume `java-backend-template` vendored into `backend/`.

### Stated limits

- Implement is the most expensive stage, converge second; cost is recorded in tokens only.
- A feature can use many runs without reaching implement when its spec is not ready (`docs/history/runs.md`, F3).
- Several mechanisms have only been tested against a stub of the Workflow sandbox, never in a real run; each skill's status line says which. Both workflow skills are marked *decided, not yet validated*.
