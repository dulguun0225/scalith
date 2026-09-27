# Backlog

Owed work on the skills in this repo. Rows moved 2026-09-27 from `BACKLOG.md` in `dulguun0225/skills` at `2ab5dc4`. When a row closes, it leaves this page and its record goes to `docs/history/`.

## Observation owed — opened 2026-09-22

The first sweep of the run journals is in [docs/history/runs.md](docs/history/runs.md) and closed
what it could. This it could not.

| Owed | Why it is owed | Watch |
| ---- | -------------- | ----- |
| **A journal that says which skill invoked the run** | Every journal names `build-feature`'s script and `workflowName: build-feature`, including runs started by `converge-feature`, which calls that script. So **`converge-feature` cannot be told from `build-feature` with `from: "converge"`**, and that skill's status line now says the question is unanswerable rather than claiming the negative. The fix is one argument carrying the invoking skill's name. **The owner declined it on 2026-09-22** on the ground that it is a change to the measured system, made before the first measurement had been read — so this row is the decision's record, not a rejection of it | One line in `workflow.mjs` plus one in each skill's invocation block. It buys attribution on run 29 onward and nothing retroactively |

## Prevention owed — opened 2026-09-24

Sweep 2 of [docs/history/runs.md](docs/history/runs.md) decided, for every
`needs-human` stop on record, the earliest stage that could have prevented it. It
applied what was small and certain; these it could not, and each names its stops. Two rows closed 2026-09-25 by the owner's decisions — a blocking finding at the plan review's final round keeps the hand-over to analysis, and a restart over an implemented feature updates `tasks.md` in place — recorded in `skills/build-feature/evidence.md` under that date.

| Owed | Why it is owed | Watch |
| ---- | -------------- | ----- |
| **LOW spec findings in the build** | Whether `build-feature` should keep stopping on a spec-only finding of any severity (`specChangesOf` filters none; LOW items rode in four of the eight spec stops of Sweep 2) or carry MEDIUM and LOW ones to the author on a `done` return. `spec-handoff-questions` (2026-09-26, replacing `spec-readiness` of 2026-09-24) lists every question and stops no build, so it does not decide this | The owner's floor question, in the build |

