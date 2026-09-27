# scalith

An AI software factory. Today it is the owner's spec-kit workflows, packaged as
Agent Skills and installed with Vercel's `skills` CLI; the plan is a local
software factory, then a server-hosted one. spec-kit is the current method and
may be replaced.

These skills moved here on 2026-09-27 from
[`dulguun0225/skills`](https://github.com/dulguun0225/skills) at `2ab5dc4`; their
git history before that date is there. The engineering-decision skills they load
alongside (`java-backend-rules`, `money`, `primary-keys` and the rest) stay there.

## What is published

| Skill | For an agent about to… |
| ----- | ---------------------- |
| `new-java-backend` | create a Java backend project from nothing — one pinned script lands `dulguun0225/java-backend-template` with every gate wired, then `specify init`, and it stops there: no spec-kit command is part of it or handed on as a next step. Nothing in it is a decision; invoke it by name |
| `plan-feature` | plan one feature from a spec its domain expert clarified, with no human gate — `build-feature`'s script from preflight to analyze: plan, a fresh-context plan review, tasks and analyze. Every finding only the spec can settle becomes a question for the domain expert with a recommended answer; the run collects them, works on the recommended answers, and after analyze commits `QUESTIONS.md` on the feature branch with one line for the domain expert to run on the base branch — stock `/speckit-clarify`, which asks them five at a time and writes the answers into the spec. Rerun from `review-plan` after they answer, until a run ends with no question; install it **with** `build-feature`; invoke it by name |
| `build-feature` | implement and converge one feature that `plan-feature` left with no question open, with no human gate — the same script from `implement`: one agent per task phase with the definition of done green after each, then converge ⇄ implement until nothing converge finds is above the severity floor, `args.severityFloor`, `NONE` by default — tolerating nothing, so a long run ends at its round cap with the open findings reported. It refuses while `QUESTIONS.md` is on the branch. Where a run stops, the invoking session resolves what it holds a high-confidence recommendation for and restarts; a change to the spec is never the session's, and goes to the domain expert as a question. The file is also the reference for the whole script; invoke it by name |

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
| `npm run gates` | Evidence order, dangling pointers and the description budget, the same three gates `dulguun0225/skills` runs. Fails the build. |
| `npm run runs` | Reads the Workflow run journals that `plan-feature` and `build-feature` leave behind in real service repositories, and prints one record per run (stage exit, rounds per loop, which mechanisms fired, tokens with coverage, wall-clock), a stage × tier cost table, the findings and exit reasons that recur across runs and across features, and one record per `needs-human` stop read from the service repository's git history — the `HANDOFF.md` commit and the commits between it and the next run on the feature, all git calls read-only (`--repo <abs path>` repeatable, `--since <date>`, `--until <date>` inclusive, `--run <id>`, `--json`). **The only non-synthetic measurement here** — everything above it runs against fixtures or counts text. A report, never a gate: the numbers belong to runs on one machine in repositories this one does not control. The journals are machine-local under `~/.claude/projects/` and are erased with that directory, so the sweep written into `docs/history/runs.md` is the durable record; no journal is committed. |
| `npm run try -- <name>` | Runs one skill straight from the working tree, without installing it. |

Flags go after `--` (`npm run runs -- --since 2026-09-22`); without it npm
swallows them.

## Installing from this repo

```bash
npx skills add dulguun0225/scalith -a claude-code -y
npx skills add dulguun0225/skills -a claude-code -y    # the engineering-decision skills
```

## Starting a new Java project

The order is fixed, decided 2026-09-16, and the skill comes before spec-kit:

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
3. Three loops (decided 2026-09-28), each over stock spec-kit commands:
   - The domain expert, on the base branch: `/speckit.specify`, then
     `/speckit.clarify` until it finds nothing to ask.
   - The technical expert: `/plan-feature` (plan, plan review, tasks, analyze).
     It answers every technical question itself; each question that would
     change the spec goes into `QUESTIONS.md` on the feature branch, with a
     recommended answer. The technical expert sends the domain expert the one
     line the file holds; the domain expert runs it on the base branch — it is
     `/speckit-clarify` — until nothing is left to ask, commits, pushes and
     replies. `/plan-feature` again, from `review-plan`, until a run ends with
     no question.
   - The technical expert: `/build-feature` (implement, converge).

   The plan's Technical Context inherits the platform from the constitution.

Run spec-kit first and the constitution it writes is the one that stays: the
scaffold never overwrites a file, so the platform articles are dropped with a
warning and the plan re-decides the stack the template has already decided.
