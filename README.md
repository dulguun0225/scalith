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
| `spec-handoff-questions` | stage 1 of handing a clarified `spec.md` to the build, split between a domain expert with no technical knowledge and a technical expert with no domain knowledge — a fresh-context, read-only reading of the spec against itself, the constitution and the sibling specs, derived from eight real build stops whose cause was already in the spec's text; it writes `HANDOFF-QUESTIONS.md` in the feature directory in three sections, Domain, Domain+Technical and Technical. For each real gap (no answer, a contradiction, a case with no outcome) that a build stage would stop on and that the spec or the constitution does not already answer, it writes the agent's decision with its source, a sibling spec's answer included; it asks a person only for an outside fact no document states, a conflict with another spec's owners, an irreversible business choice no source settles, or a constitution amendment. Each entry quotes the spec and names the build stage that would stop on it and the finding; a gap no stage would stop on is not written, nothing is dropped by severity, and the spec is never edited. A second fresh context then closes every entry the spec or the constitution already answers. Run again after stages 2 and 3; that rerun keeps every entry and says whether the handoff is complete. Invoke it by name after `/speckit.clarify` |
| `spec-handoff-domain` | stage 2 — entries the spec already answers are closed unasked; the domain expert alone sees, in one reply, the open Domain questions with a recommended answer each and every Domain and Domain+Technical decision in one plain sentence, and replies only to the rows he disagrees with; everything accepted goes into the spec and its Clarifications, and an entry that needs a technical fact moves to the Domain+Technical questions. The domain expert signs off after the rerun. Invoke it by name |
| `spec-handoff-joint` | stage 3 — questions the spec already answers are closed unasked; both experts together get the Domain+Technical questions the agent could not decide in one table, each with a recommended answer, and reply only to the rows they disagree with; skipped when none is open. Invoke it by name |
| `build-feature-prepare` | stage 4 — refuses unless the handoff is complete, then closes unasked the entries the spec already answers, applies the agent's Technical decisions, and shows the technical expert alone those decisions, one plain sentence each, and the Technical questions it could not decide, each with a recommended answer; he replies only to the rows he disagrees with; an entry that needs a domain decision moves back to Domain and reopens the handoff. The technical expert commits and runs `/build-feature`. Invoke it by name |
| `build-feature` | build one feature from a spec its domain expert already wrote, with no human gate — one Workflow script finds the feature from the checkout, makes and syncs its branch, then runs plan, tasks, analyze, implement and converge as fresh subagents on the model and effort each stage earns, reads `spec.md` and never edits it — where a run stops, the invoking session resolves what it holds a high-confidence recommendation for and restarts, that file included, rather than relaying the stop to you — puts a fresh-context refutation review where spec-kit's human gate was, and loops converge and implement until nothing converge finds is above the severity floor, `args.severityFloor`, `NONE` by default — tolerating nothing, so a long run ends at its round cap with the open findings reported; invoke it by name |
| `converge-feature` | converge, finish or close out a feature that is already implemented — the converge ⇄ implement loop of `build-feature` alone, from `converge` to `finish`, through that skill's script, with the severity floor the loop stops at chosen per run and `NONE` by default, tolerating nothing; no script of its own, so install it **with** `build-feature`; invoke it by name |

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
| `npm run runs` | Reads the Workflow run journals that `build-feature` and `converge-feature` leave behind in real service repositories, and prints one record per run (stage exit, rounds per loop, which mechanisms fired, tokens with coverage, wall-clock), a stage × tier cost table, the findings and exit reasons that recur across runs and across features, and one record per `needs-human` stop read from the service repository's git history — the `HANDOFF.md` commit and the commits between it and the next run on the feature, all git calls read-only (`--repo <abs path>` repeatable, `--since <date>`, `--until <date>` inclusive, `--run <id>`, `--json`). **The only non-synthetic measurement here** — everything above it runs against fixtures or counts text. A report, never a gate: the numbers belong to runs on one machine in repositories this one does not control. The journals are machine-local under `~/.claude/projects/` and are erased with that directory, so the sweep written into `docs/history/runs.md` is the durable record; no journal is committed. |
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
3. `/speckit.specify` and `/speckit.clarify`, written by the feature's domain
   expert, then the handoff: `/spec-handoff-questions`, `/spec-handoff-domain`
   (the domain expert alone), `/spec-handoff-joint` (both, only for questions
   that need both), `/spec-handoff-questions` again, and
   `/build-feature-prepare` (the technical expert alone), each answer written
   into the spec before anything plans it; then `/speckit.plan`, `/speckit.tasks`,
   `/speckit.implement` as spec-kit documents them — or `/build-feature`, which runs everything from
   plan onwards (plus analyze and converge) unattended, with a fresh-context
   review where the human gate was and the spec read but never edited by the
   run itself — where a run stops, the invoking session resolves what it holds
   a high-confidence recommendation for, that file included, and restarts. The
   plan's Technical Context inherits the platform from the constitution.

Run spec-kit first and the constitution it writes is the one that stays: the
scaffold never overwrites a file, so the platform articles are dropped with a
warning and the plan re-decides the stack the template has already decided.
