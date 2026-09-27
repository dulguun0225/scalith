---
name: spec-handoff-domain
description: Stage 2 of the spec handoff — shows the domain expert, alone, the open Domain questions from HANDOFF-QUESTIONS.md with a recommended answer each and every Domain and Domain+Technical decision in one plain sentence, and writes what he accepts or says into spec.md; invoke by name (/spec-handoff-domain).
disable-model-invocation: true
---
# Spec handoff, stage 2 — the domain expert's check

Premise and sequence: `spec-handoff-questions`. The domain expert, alone, answers the questions under `## Domain` of `<featureDir>/HANDOFF-QUESTIONS.md` (the user's feature directory, else `.specify/feature.json`'s); the agent applies the decisions under `## Domain` and `## Domain+Technical` unless he disputes them. **Status: *decided, not yet validated*, 2026-09-26, revised 2026-09-27**, owner's decision; run once on 2026-09-26 under the earlier one-at-a-time rule, which the owner then reversed twice; the 2026-09-27 form has not run; checks *convention*.

## Refuse with nothing open

**If the file is missing, or has no `Answer: open` under `## Domain` and no `Answer: proposed` under `## Domain` or `## Domain+Technical`, say so, name the next step, and stop.**

## Close what the spec already answers, unasked

**Before showing anything, search all of `spec.md` for each open question's answer and each proposed decision's text. An entry the spec answers is neither applied nor shown: set `Answer: stated in spec: "<quoted text>" (<requirement id or section>)` and list its id in one line of the reply.**

The default was to show it with the spec's answer as the recommendation. It lost (owner, 2026-09-26): the expert was still asked what the spec already said.

(Check: no shown row's recommendation or decision is a quotation of the spec — *convention*.)

## Apply the decisions; ask only the questions

**In one reply, in the expert's language and business terms, show the open Domain questions in one compact table: id, the question in one plain sentence, the recommended answer, and a one-sentence reason naming its source or saying it is a guess. Below it, list every proposed decision under Domain and Domain+Technical: id and one plain sentence each, its source in a few words, and for a Domain+Technical one its consequence; no reply is needed on a decision he agrees with. The expert replies once, with only the rows he disagrees with, in either list; every other row counts as accepted. Write only what he accepted or said.**

The 2026-09-26 form showed the decisions as a second table for review; the owner reported the handoff's rows as questions the spec already answers (2026-09-27), and stage 1 no longer writes a decision the spec answers. A revision the same day listed decisions with a source by id only; it lost the same day (owner): the expert then never saw what the agent wrote into his spec, and had no say on it.

**Every question row carries a recommended answer: what the agent would choose and why, marked a guess where no source supports it. "Only you know" or "I cannot recommend" is never a recommendation; for an outside fact, recommend the most likely answer and say what it would change if wrong.**

The default is to ask without recommending, so the spec holds only the expert's words. It lost (owner, 2026-09-26): the expert had to work out every answer alone, which is the work the handoff exists to take off him. The cost accepted: a row he passes over puts the agent's text in the spec.

(Check: every proposed decision is shown in one plain sentence; every question row has a recommended answer that is an answer; every `Answer:` written is the expert's reply, a row he did not dispute, or an applied decision he did not dispute — *convention*.)

## Apply and record

**Apply each accepted answer or decision, or the expert's replacement, in `spec.md` wherever the entry quotes; add `- Q: <question or gap> → A: <answer or decision>` under `## Clarifications`, `### Session <date> (handoff: domain)`; set `Answer: answered in spec, …`, `Answer: applied, …` or `Answer: replaced by the expert, Session <date> (handoff: domain)`, or `Answer: left as written: <reason>`.**

(Check: each applied entry has its Session entry — *convention*.)

## Technical input moves the entry

**If the expert needs a technical fact (cost, feasibility, a platform rule) to answer a question or to dispute a decision, move it to the questions under `## Domain+Technical` with `Moved from Domain <date>: <reason>` and the agent's recommendation kept, leave it open, go on.** The technical expert confirms the fact at stage 3.

## Sign-off after the rerun

**Next: `/spec-handoff-joint` if Domain+Technical has an open question, else `/spec-handoff-questions`. Once that rerun reports the handoff complete, the domain expert sets `**Status**:` to anything but Draft and commits both files together. This stage commits nothing.**

The default is to sign off now. It lost: joint answers and rerun entries are still his, and meeting them after handoff stops the build.

(Check: `build-feature-prepare` refuses a Draft or uncommitted file — *convention*.)
