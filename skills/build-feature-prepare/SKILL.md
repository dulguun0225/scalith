---
name: build-feature-prepare
description: Stage 4 of the spec handoff — refuses unless the handoff is complete, then applies the agent's Technical decisions from HANDOFF-QUESTIONS.md and shows the technical expert, alone, only the Technical questions it could not decide, before /build-feature; invoke by name (/build-feature-prepare).
disable-model-invocation: true
---
# Spec handoff, stage 4 — technical decisions and questions

Premise and sequence: `spec-handoff-questions`. The technical expert, alone, answers the questions under `## Technical` of `<featureDir>/HANDOFF-QUESTIONS.md` (the user's feature directory, else `.specify/feature.json`'s); the agent applies the decisions there. **Status: *decided, not yet validated*, 2026-09-26**, owner's decision, never run; checks *convention*.

## Refuse unless complete

**First require all four; on a failure, name it and its fixing step, and stop.**

- The file exists; `git status --porcelain -- <featureDir>` is empty.
- No `Answer: open` or `Answer: proposed` under `## Domain` or `## Domain+Technical`.
- The last `Run` hash equals `grep -v '^\*\*Status\*\*:' <featureDir>/spec.md | git hash-object --stdin`.
- `**Status**:` is not Draft.

The default is to start anyway. It lost: an open domain entry stops the build after the domain expert has left.

## Close what the spec already answers, unasked

**Before anything else, search all of `spec.md` for each open question's answer and each proposed decision's text. An entry the spec answers is neither applied nor shown: set `Answer: stated in spec: "<quoted text>" (<requirement id or section>)` and list its id in one line of the reply.**

The default was to show it with the spec's answer as the recommendation. It lost (owner, 2026-09-26): the expert was still asked what the spec already said.

(Check: no shown row's recommendation is a quotation of the spec — *convention*.)

## Apply the decisions; ask only the questions

**Apply every proposed Technical decision, each after its `Depends on: <id>` entry. Then, in one reply, show the open Technical questions in one compact table, in file order: id, the question in one plain sentence, the recommended answer, and a one-sentence reason naming its source or saying it is a guess; and below it the applied decisions, id and one plain sentence each, with no reply asked. The expert replies with only the rows he disagrees with, in either list; every other row counts as accepted. Write only what he accepted or said.**

**Every question row carries a recommended answer: what the agent would choose and why, marked a guess where no source supports it. "Only you know" or "I cannot recommend" is never a recommendation; for an outside fact, recommend the most likely answer and say what it would change if wrong.**

The default is to ask without recommending. It lost (owner, 2026-09-26): the expert had to work out every answer alone. The cost accepted: a row he passes over puts the agent's text in the spec.

(Check: every question row has a recommended answer that is an answer; every `Answer:` written is the expert's reply, a row he did not dispute, or an applied decision he did not dispute — *convention*.)

## Apply and record

**Apply each answer or decision, or the expert's replacement, in `spec.md` wherever the entry quotes; add `- Q: <question or gap> → A: <answer or decision>` under `## Clarifications`, `### Session <date> (handoff: technical)`; set `Answer: answered in spec, …`, `Answer: applied, …` or `Answer: replaced by the expert, Session <date> (handoff: technical)`, or `Answer: left as written: <reason>`.** A constitution amendment is its own commit with its reason, named in `Answer:`.

(Check: each applied entry has its Session entry — *convention*.)

## A domain decision reopens the handoff

**If a Technical entry turns out to need a domain choice, move it to the questions under `## Domain` with `Moved from Technical <date>: <reason>`, leave it open, tell the technical expert the domain expert answers it in this file, and stop; he commits both files.** Resume: `/spec-handoff-domain`, rerun, sign-off, here.

The default is picking the sensible reading. It lost: that is the plan-decides failure, without domain knowledge.

## Commit, then build

**With nothing open or proposed under `## Technical`, the technical expert commits both files together and runs `/build-feature`,** which reads only the committed spec.

(Check: no `Answer: open` or `Answer: proposed` at `build-feature`'s starting commit — *convention*.)
