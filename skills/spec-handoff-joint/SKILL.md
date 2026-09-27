---
name: spec-handoff-joint
description: Stage 3 of the spec handoff — shows the domain and technical experts together the open Domain+Technical questions in HANDOFF-QUESTIONS.md, those the agent could not decide, as one table with a recommended answer each, and writes what they accept or say into spec.md; invoke by name (/spec-handoff-joint).
disable-model-invocation: true
---
# Spec handoff, stage 3 — the questions that need both experts

Premise and sequence: `spec-handoff-questions`. The domain and technical experts, together, answer the questions under `## Domain+Technical` of `<featureDir>/HANDOFF-QUESTIONS.md` (the user's feature directory, else `.specify/feature.json`'s), the handoff's one joint step; the agent decided every Domain+Technical gap it could, and stage 2 applied those decisions. **Status: *decided, not yet validated*, 2026-09-26**, owner's decision, never run; checks *convention*.

## Skip when nothing is open

**If the file has no `Answer: open` among the questions under `## Domain+Technical`, say the stage is skipped, point to `/spec-handoff-questions`, and stop.**

## Close what the spec already answers, unasked

**Before showing anything, search all of `spec.md` for each open question's answer. A question the spec answers is not shown: set `Answer: stated in spec: "<quoted text>" (<requirement id or section>)` and list its id in one line of the reply.**

The default was to show it with the spec's answer as the recommendation. It lost (owner, 2026-09-26): the expert was still asked what the spec already said.

(Check: no shown row's recommendation is a quotation of the spec — *convention*.)

## Both present, all at once, each with a recommendation

**Show every remaining open question in one compact table, in file order: id, the question in one plain sentence, the recommended answer with its technical consequence, and a one-sentence reason naming its source or saying it is a guess. Use the experts' language and plain terms. The technical expert corrects the facts; the domain expert makes the choice. They reply with only the rows they disagree with; every other row counts as accepted. Write only what they accepted or said.**

The default is to take each half to each person and relay. It lost: here the choice depends on the fact and the fact on the choice, which is why the question was not split.

**Every question row carries a recommended answer: what the agent would choose and why, marked a guess where no source supports it. "Only you know" or "I cannot recommend" is never a recommendation; for an outside fact, recommend the most likely answer and say what it would change if wrong.**

The default is to ask without recommending. It lost (owner, 2026-09-26): the experts had to work out every answer alone. The cost accepted: a row they pass over puts the agent's answer in the spec.

(Check: every row has a recommended answer that is an answer; every `Answer:` written is the experts' reply or the recommendation of a row they did not dispute — *convention*.)

## Apply and record the answer

**Apply each answer in `spec.md` wherever the question quotes. Record `- Q: <question> → A: <answer>` under `## Clarifications`, `### Session <date> (handoff: joint)`. Set `Answer: answered in spec, Session <date> (handoff: joint)`, or `Answer: left as written: <reason>`.** An answer that amends the constitution says so in its `Answer:` line; the amendment is the technical expert's commit, with its reason.

(Check: each question answered in the spec has its Session entry in `spec.md` — *convention*.)

## Next

**Next: `/spec-handoff-questions`, the rerun; then the domain expert's sign-off, per `spec-handoff-domain`. This stage commits nothing.**
