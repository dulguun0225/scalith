# Plan a feature — evidence

For a human deciding whether to trust the directive text. Every claim below is *convention* — a decision recorded with its date and observed ground.

## Call build-feature's script; write no loop

The owner's decision of 2026-09-28: two workflows, one for plan, tasks and analyze and one for implement and converge, over the offered alternative of one run that goes on into implement when no question is open. One script serves both, on the precedent of `converge-feature` (2026-09-18, removed the same day as a duplicate of `build-feature` from implement): the Workflow sandbox has no filesystem and no imports, so a second script would copy preflight, the handoff and the tier table, and every later fix would be made twice. A journal names `build-feature`'s script whichever skill started it; the two are told apart by their arguments, `until: "analyze"` and `from: "implement"`.

## Every spec question goes to the domain expert, all at once

The owner's process, 2026-09-28, in their words: the technical expert "answers all the technical questions that don't change the spec", "accumulates all the required questions for domain expert, saves them in a file, commits, pushes, tells the domain expert". For how the domain expert finds them, the owner chose the file on the feature branch plus a one-line message. `/speckit-clarify` in specify-cli 1.0.12 takes its arguments as "Context for prioritization", asks at most five questions per session, each with a recommended or suggested answer, excludes questions the spec already answers, and writes each answer into the spec's `## Clarifications` and the section it changes — so step 2.2 is step 1's loop with the file as its argument, and no new command. Its prerequisites script resolves the feature from `SPECIFY_FEATURE_DIRECTORY`, then from `.specify/feature.json`, never from the branch; on the base branch that file names whichever feature the domain expert last specified, so the line names the directory.

The session's permission to edit `spec.md` under `build-feature`'s resolution rule (2026-09-22) is reversed by the same decision: questions that change the spec are the domain expert's. The ground that rule rested on — an operator taking the session's recommendation unchanged — is kept by clarify showing that recommendation with each question.
