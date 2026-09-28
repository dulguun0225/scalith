# scalith

An AI software factory. Today it is the owner's spec-kit workflows, packaged as
Agent Skills and installed with Vercel's `skills` CLI; the plan is a local
software factory, then a server-hosted one. spec-kit is the current method and
may be replaced.

The engineering-decision skills these load alongside (`java-backend-rules`,
`money`, `primary-keys` and the rest) are in
[`dulguun0225/skills`](https://github.com/dulguun0225/skills). Every skill here is
manual-only: invoke it by name.

## What is published

| Skill | For an agent about to… |
| ----- | ---------------------- |
| `new-java-backend` | create a Java backend project from nothing — one pinned script lands `dulguun0225/java-backend-template` with every gate wired, then `specify init`, and it stops there: no spec-kit command is part of it or handed on as a next step. Nothing in it is a decision; invoke it by name |
| `plan-feature` | plan one feature from a spec its domain expert clarified, with no human gate — `build-feature`'s script from preflight to analyze: plan, a fresh-context plan review, tasks and analyze. Every finding only the spec can settle becomes a question for the domain expert with a recommended answer; the run plans on the base branch, collects them, works on the recommended answers, and after analyze commits `QUESTIONS.md` beside the spec with one line for the domain expert to paste into Claude Code — stock `/speckit-clarify`, told to update the base branch first and to commit and push the spec at the end, which asks them five at a time and writes the answers into the spec. The build waits for every question until the spec answers it or, for a `MEDIUM` or `LOW` one, a person says the build may start on the recommended answer. Rerun from `review-plan` after they answer, until no question is open; install it **with** `build-feature`; invoke it by name |
| `build-feature` | implement and converge one feature that `plan-feature` left with no open question, with no human gate — the same script from `implement`, on a build branch `build/<NNN>-<name>` that lives only for the build and fixes the feature's spec while it exists: one agent per task phase with the definition of done green after each, then converge ⇄ implement until nothing converge finds is above the severity floor, `args.severityFloor`, `NONE` by default — tolerating nothing, so a long run ends at its round cap with the open findings reported; finish lands only with every task ticked and the wall green, fast-forwards the base branch to the build and deletes the branch. It asks the domain expert nothing, and refuses while `QUESTIONS.md` holds an open question. Where a run stops, the invoking session resolves what it holds a high-confidence recommendation for and restarts; a change to the spec is never the session's, and goes to the domain expert as a question. The file is also the reference for the whole script; invoke it by name |

## Setup on a new machine

```bash
mise trust && mise install   # once per machine: mise refuses to run an untrusted config
npm ci                       # exact tool versions from package-lock.json
npm run check
npm run gates
```

## Commands

| Command | What it does |
| ------- | ------------ |
| `npm run check` | Lists the skills the CLI discovers here. Anything it does not list is invisible to every consumer. |
| `npm run gates` | Dangling pointers and the description budget. Fails the build. |
| `npm run runs` | Reads the Workflow run journals that `plan-feature` and `build-feature` leave behind in real service repositories, and prints one record per run (stage exit, rounds per loop, which mechanisms fired, tokens with coverage, wall-clock), a stage × tier cost table, the findings and exit reasons that recur across runs and across features, and one record per `needs-human` stop read from the service repository's git history — the `HANDOFF.md` commit and the commits between it and the next run on the feature, all git calls read-only (`--repo <abs path>` repeatable, `--since <date>`, `--until <date>` inclusive, `--run <id>`, `--json`). **The only non-synthetic measurement here** — everything above it runs against fixtures or counts text. A report, never a gate: the numbers belong to runs on one machine in repositories this one does not control. The journals are machine-local under `~/.claude/projects/` and are erased with that directory; no journal is committed. |
| `npm run try -- <name>` | Runs one skill straight from the working tree, without installing it. |

Flags go after `--` (`npm run runs -- --since <date>`); without it npm
swallows them.

## Installing from this repo

```bash
npx skills add dulguun0225/scalith -a claude-code -y
npx skills add dulguun0225/skills -a claude-code -y    # the engineering-decision skills
```

## Starting a new Java project

The order is fixed, and the skill comes before spec-kit:

1. In an empty project directory, invoke `/new-java-backend`. It asks for the
   package, artifact name and group, lands the template in `backend/` at its
   pinned commit, runs codegen and `mvn verify`, commits, and runs
   `specify init --here`. It prints the forge and ruleset steps and does not run
   them.
2. Nothing for the constitution. Articles I–VI arrive pre-filled from the
   template and are not re-planned; Article VII is an optional slot that starts
   empty, nothing reads whether it is filled, and it is amended later, as a
   commit with its reason, from the candidates a feature's plan produces.
   `/speckit.constitution` is not a step of starting a project.
3. Three loops, each over stock spec-kit commands:
   - The domain expert, on the base branch: `/speckit.specify`, then
     `/speckit.clarify` until it finds nothing to ask.
   - The technical expert: `/plan-feature` (plan, plan review, tasks, analyze).
     It plans on the base branch and answers every technical question itself;
     each question that would change the spec goes into `QUESTIONS.md` beside
     the spec, with a recommended answer. The technical expert sends the domain
     expert the one line the file holds; the domain expert pastes it into
     Claude Code opened in the project — it is `/speckit-clarify`, told to
     update the base branch first and to commit and push the spec when nothing
     is left to ask — and replies. `/plan-feature` again, from `review-plan`,
     until no question is open. Every question holds the build until the spec answers it; a
     `MEDIUM` or `LOW` one is also released when the technical expert or the
     domain expert says the build may start on the recommended answer, and the
     domain expert can answer it later or never.
   - The technical expert: `/build-feature` (implement, converge, finish), on a
     build branch that finish fast-forwards the base branch to and deletes.

   The plan's Technical Context inherits the platform from the constitution.

Run spec-kit first and the constitution it writes is the one that stays: the
scaffold never overwrites a file, so the platform articles are dropped with a
warning and the plan re-decides the stack the template has already decided.
