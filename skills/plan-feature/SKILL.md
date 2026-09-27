---
name: plan-feature
description: Plan one spec-kit feature from a clarified spec with no human gate, and hand every question the spec leaves to its domain expert in one file. ALWAYS load when asked to plan a feature, to run plan, tasks and analyze on a written spec, or to plan again after the domain expert answered; invoke it by name (/plan-feature).
---
# Plan a feature — plan, tasks and analyze, and the questions for the domain expert

**The process is three loops over stock spec-kit commands (owner's decision, 2026-09-28).** This skill is step 2.1.

| Step | Who | What | Repeat until |
|---|---|---|---|
| 1 | domain expert, on the base branch | `/speckit-specify`, `/speckit-clarify` | clarify finds nothing to ask |
| 2.1 | technical expert | `/plan-feature`: plan, plan review, tasks, analyze | a run ends with no question |
| 2.2 | domain expert, on the base branch | `/speckit-clarify` over `QUESTIONS.md` | clarify finds nothing left to ask |
| 3 | technical expert | `/build-feature`: implement, converge | done |

2.1 and 2.2 alternate until 2.1 ends with no question. Rejected the same day: the four spec handoff skills that stood between steps 1 and 2 (`spec-handoff-questions`, `-domain`, `-joint`, `build-feature-prepare`) — invented stages that predicted what the build would stop on, where the build's own stages now raise the questions (`build-feature` evidence, 2026-09-28).

## Call build-feature's script; write no loop

**Call the Workflow tool with `build-feature`'s `workflow.mjs`, reached as a sibling of this skill's directory, with `until: "analyze"`, and run no `speckit-*` skill from your own context.**

First run, from the base branch or the feature branch, once `spec.md` is written:

```
Workflow({
  scriptPath: "${CLAUDE_SKILL_DIR}/../build-feature/workflow.mjs",
  args: { until: "analyze" }
})
```

After the domain expert has answered, add `from: "review-plan"` and `wall` — the definition-of-done command the project's root `CLAUDE.md` names; a start after preflight must pass it:

```
Workflow({
  scriptPath: "${CLAUDE_SKILL_DIR}/../build-feature/workflow.mjs",
  args: { from: "review-plan", until: "analyze",
          wall: "node backend/scripts/wall.mjs" }
})
```

That start merges the base branch, answers included, into the feature branch, reviews the plan already written against the answered spec and repairs it in place; tasks and analyze run again. `from: "plan"` regenerates the plan and discards every review fix. The stages, their tiers, the review and analyze loops and their stops are `build-feature`'s and stated there. `build-feature` installed beside this skill is a precondition: this skill ships no script, because one script exists and it is that one. A workflow starts only from a script the session may read, so a user-level install under `~/.claude/skills/` needs that directory added first — `/add-dir` with the same path, or a `Read` allow rule — where a project-level install under `.claude/skills/` needs nothing. A missing sibling fails at the Workflow call, which refuses a `scriptPath` it cannot read; `npx skills add dulguun0225/scalith` installs both.

## Every spec question goes to the domain expert, all at once

**The run never edits `spec.md`, and neither do you.** A finding whose only remedy is a change to the spec becomes a question for the domain expert, in plain words, with a recommended answer. Plan review, tasks and analyze collect them instead of stopping at the first, and each later stage works on the recommended answer. After analyze, a run holding any question returns `status: "needs-human"` with `questions` and `clarifyCommand`, and commits and pushes `<featureDir>/QUESTIONS.md` beside `HANDOFF.md` on the feature branch. Then:

1. Send the domain expert the line in `clarifyCommand`, with one sentence saying it is for this feature and runs on the base branch in Claude Code. `QUESTIONS.md` holds the same line and the steps. The domain expert runs it until clarify says nothing is left to ask — five questions per run, each with the recommended answer, every answer written into `spec.md` — commits `spec.md` on the base branch, pushes and replies.
2. When they reply, run this skill again with `from: "review-plan"`.

Rejected the same day by the owner: stopping at the first question, one round trip per stage that finds one; a draft pull request as the channel, a GitHub dependency where the build opens no pull request; the file on the base branch, the technical side's commits on the trunk.

## Every other stop is yours to resolve

**On any other `needs-human` return — a review finding that survived its fix round, a merge conflict, a missing input — apply `build-feature`'s resolution rule: act on every item you hold a high-confidence recommendation for, record it in `<featureDir>/RESOLUTIONS.md`, restart with the arguments the handoff names, and take an item to a person only as that rule says.** The one thing the rule never allows is an edit to `spec.md`: a spec change is a question for the domain expert, sent as above. The rule, its ground and its limits are in `build-feature`; this paragraph is the index, because a session that invokes `/plan-feature` never loads that skill's body, and a rule for what the session does when its own call returns has to be in the text the call was made from.

## What this skill does not do

It does not implement: on `status: "done"` no question is open, a stale `QUESTIONS.md` has been removed, and the next step is `/build-feature`, which refuses while that file is on the branch. A `done` return pushes nothing; `build-feature`'s finish pushes the branch. It does not write the spec, and it does not message anybody: the technical expert sends the line, on whatever channel the team uses.

**Status: *decided, not yet validated*** — written 2026-09-28. The question collection and `QUESTIONS.md` were exercised against a stub of the Workflow sandbox that day and by no run; whether `/speckit-clarify` asks the file's questions before its own is untested. Grounds in [evidence.md](evidence.md).
