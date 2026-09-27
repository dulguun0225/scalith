---
name: spec-handoff-questions
description: Stage 1 of the spec handoff — a fresh-context, read-only reading of a clarified spec-kit spec.md that writes HANDOFF-QUESTIONS.md, deciding every gap it can and asking the domain and technical experts only what a person alone knows; invoke by name (/spec-handoff-questions).
disable-model-invocation: true
---
# Spec handoff, stage 1 — decisions and questions

**Premise:** LLM agents write the code and no human reads it, so `spec.md` is the one artifact a person writes; the plan agent answers what it leaves open, unread. **The handoff exists to take questions off people:** it closes before the build what plan, tasks and analyze would stop on, and the agent decides every gap it can.

Sequence (owner, 2026-09-26): this → `spec-handoff-domain`, domain expert alone → `spec-handoff-joint`, both, only if a Domain+Technical question is open → this again → `build-feature-prepare`, technical expert alone → `build-feature`.

Ground: eight `build-feature` stops caused by clarified specs ([evidence.md](evidence.md)). Each check is the written file, *convention*, contrary to this set's rule that a check fails the build. **Status: *decided, not yet validated*, 2026-09-26**; run once that day under the earlier ask-every-gap rule; this decide-first form has not run; no build has followed; no `review-by`, as nothing is *confirmed*.

## Run it in a fresh context

**Run after the last `/speckit-clarify` and after stages 2 and 3, in a context that did not write, clarify or answer the spec: a subagent given the feature directory and this file's path, or a new session. The invoker reads no spec; the reader skips this section.** Effort: `build-feature`'s review-plan row (Opus, high, 2026-09-24).

The default is clarify, or its session, as the check. It lost: all eight specs were clarified; clarify asks at most five questions, skips sibling specs, and reads what the author meant.

(Check: the `Run` line names a subagent or separate session — *convention*.)

## Read the spec, the constitution and the sibling specs, and write only the file

**Read in full `spec.md`, `checklists/requirements.md` if present, `.specify/memory/constitution.md` and every other `specs/*/spec.md`; no plan or code. Write only `HANDOFF-QUESTIONS.md`: no spec edit, `/speckit-*` or commit; later stages apply its decisions.** Feature directory: the user's, else `.specify/feature.json`'s; if neither has a `spec.md`, ask.

Stance: refute that a plan can be written without deciding what the authors have not; it is `build-feature`'s removed review-spec reading, minus its writes and its fix loop, which had no fixed point.

(Check: `git status --porcelain` lists only `HANDOFF-QUESTIONS.md`; `git diff -- <featureDir>/spec.md` is empty — *convention*.)

## What the reader looks for

**Find every gap: no answer in the spec, statements that contradict, or a case with no outcome. Before recording one, search all of `spec.md` for its answer — every requirement, scenario, edge case, entity, success criterion, assumption and `## Clarifications` entry, not only the section quoted — then the constitution and the sibling specs. An answer found anywhere, which no other text contradicts, means no entry. A "needs confirmation" or "assumed" note beside a stated value is no gap in that value.** Brackets: default section, overridden by the section rule; stopping stage.

- **Markers** [D; preflight, *bespoke*]: every `[NEEDS CLARIFICATION]` and unfilled placeholder, listed first.
- **Deferred or assumed fact** [D; review-plan to converge]: a value the spec leaves open, calls undecided, or defers ("at plan stage") with no value stated; an algorithm or standard named without a source. Cite only a real, named source; never invent one. With none, it is an external-fact question, still with a recommended answer. `wf_e68e4e48-4ed`.
- **Caveats on stated values** [D; graded like any other]: one decision for the whole spec, deleting each confirmation or assumption note, quoted with the value it qualifies; the values stand.
- **Criterion without measurement conditions** [split; analyze]: load and wait (D); percentile, concurrency, warm or cold, machine (T); a multiplier's dimension; a manual-work bound is no timing gate. `wf_fbb2141f-8bf`.
- **Search and list semantics** [split; analyze]: case, match position, blank or whitespace query, order, crossing a grouping (D); query-length and page bounds (T). `wf_bc7b0f7c-ce6`.
- **Unconditioned guarantee, edge case without outcome** [D+T; analyze]: "exactly once", "never", "always", "0 missing"; an edge case with no outcome. `wf_e4e27b83-bc3`.
- **Requirements that disagree, repeat or mis-cite** [split; analyze, or review-plan if no plan realises both]: both sides (D); a repeated rule, a wrong cited id, where the intended text is plain (T). `wf_6e72f3dd-930`.
- **Clarify residue** [D; review-plan or analyze]: text keeping a replaced reading; a decision credited to a missing clarification. `wf_115f053c-900`.
- **Sibling-spec conflict** [D; analyze]: a contradiction, both quoted with feature prefix. Where this spec is silent and a sibling decides, the sibling's answer stands; no entry. `wf_a6f3b709-43a`.
- **Constitution conflict** [T if an amendment resolves it, else D+T; review-plan]: a violated article, named; a requirement needing an amendment. `wf_cc1aa65d-148`.
- **Contradicted header** [T; analyze]: a Branch line other than `feature/<feature directory name>`. `wf_de4bfd27-d8a`.

Draft Status is no gap; the domain expert sets it at sign-off.

The default is to leave these to the plan. It lost: a value the run picks lives in its own files, its gates cannot test against them, and a later author change restarts the run at `plan`.

(Check: for each entry, a search of `spec.md`, the constitution and the sibling specs finds no text that answers it — *convention*, read by a person.)

## Decide what the agent can; ask only what a person alone knows

**Record each gap as a decision unless it meets a ground below. A decision is the sentence `spec.md` gains, with its source: the quoted spec, sibling or constitution text it follows from, or a named established practice (a standard, a regulation's text, a platform default). Where no source decides, pick the reading that loses no data, money or legal standing and is cheapest to reverse, and say that no source decides.**

Ask a person only for:

- **An external fact:** a fact about the business or the world that no document read states and no named practice fixes — an existing contract, an outside party's behaviour, whether an algorithm or register the spec assumes exists.
- **An owners' conflict:** this spec contradicts a sibling spec, and one of them must yield.
- **An irreversible choice:** both readings are plausible business choices, no source prefers one, and the wrong one loses data, money or legal standing once the build ships.
- **A constitution amendment** the spec needs.

A marker is a question only on the same grounds; otherwise it becomes a decision.

The default was a question per gap for a person to answer. It lost (owner, 2026-09-26): the first run sent 29 Domain questions, most re-confirming the spec, and the handoff exists to cut questions to people. The cost on record is `wf_e68e4e48-4ed`, a control-digit algorithm the spec assumed and only the owner knew did not exist; that is an external fact and stays a question.

**Before writing the file, re-read `spec.md` once per entry and delete each it answers; turn each question that meets no ground into a decision.**

(Check: each question names its ground; each decision names its source or says none decides — *convention*, read by a person.)

## Which section each entry goes in

**Each entry goes in the one section whose people would answer or dispute it.** Domain (D): business terms, an example per reading ("If someone types `abc`, should `XABC-1` appear?"), no technical word. Technical (T): a technical fact or choice with no business consequence (percentile, page size, Branch line). Domain+Technical (D+T): a domain choice and a technical fact that depend on each other, each reading with its technical consequence.

**A mixed entry whose technical half follows from its domain half is split, the T half carrying `Depends on: <id>`, not made joint.**

The default is one list for one reader, as `spec-readiness` wrote. It lost: the domain expert got technical questions he could not answer, and they stopped the build after his handoff (owner, 2026-09-26).

(Check: no technical term under Domain; a consequence per D+T reading or decision; each split half names its pair — *convention*, read by a person.)

## How each entry is written

**Follow the template, in the spec's language, quoting verbatim. A decision's text is the sentence the spec gains, as the author would write it. A question gives its readings and a recommended answer — the reading the agent would choose — with a one-sentence reason, marked a guess where no source supports it; never "only the expert knows".**

The default was a question with no replacement sentence, so the author never signs the checker's text (owner, 2026-09-24). Reversed by the owner on 2026-09-26: the expert disputes only the rows he disagrees with, and the external facts, where an agent's text was wrong on record, stay questions.

(Check: every quotation passes `grep -F` against the `spec.md` read; every entry has `Stops at:`; every question's `Recommended:` names an answer — *convention*.)

## Grade by what a run would do, and drop nothing

**Give each entry the stage that would stop without it, or *no stop predicted* with reason, and order each list by it; never by severity. Keep every gap whatever its stage.**

The default is a severity floor. It lost: `build-feature` stops on a spec finding of any severity (`specChangesOf` filters nothing), and LOW items were in four of the eight stops.

(Check: each list runs preflight, review-plan, tasks, analyze, converge, no stop predicted — *convention*.)

## The file, and the rerun

**A rerun keeps every entry and `Answer:` unchanged and never reopens a subject an earlier entry closed; a new entry is only a gap the spec's changed text created, through the same search and grounds. It appends new entries at their list's end as `(added <date>)` after the highest id, appends a `Run` line, and reports *handoff complete* or the open D and D+T ids with their next stage. It runs after stage 3 (2 if 3 is skipped), again only if a later stage reopens the handoff; never a loop.**

- **Spec hash:** `grep -v '^\*\*Status\*\*:' spec.md | git hash-object --stdin`; Status excluded so sign-off keeps it valid.
- **Complete:** no `Answer: open` or `Answer: proposed` under D or D+T, and the last `Run` hash equals the spec hash.

```
# Handoff — <featureDir>
Run <date>, <subagent | separate session>; spec hash <hash>; siblings read: <list>

## Domain
### Questions
### Decisions
## Domain+Technical
### Questions
### Decisions
## Technical
### Questions
### Decisions

#### Q<n> — <class>[ (added <date>)]
> <verbatim spec text> (<section>, <requirement id or line>)
<question>
Ground: <external fact | owners' conflict | irreversible choice | constitution amendment>
Readings: <each; under Domain+Technical, with technical consequence>
Recommended: <answer> — <reason | guess>
Depends on: <id>        (split Technical half only)
Stops at: <stage> if unanswered
Answer: open

#### A<n> — <class>[ (added <date>)]
> <verbatim spec text> (<section>, <requirement id or line>)
Gap: <one sentence>
Decision: <the sentence the spec gains>
Source: <quoted text | named practice | none decides: <why this reading>>
Depends on: <id>        (split Technical half only)
Stops at: <stage> without it
Answer: proposed
```

Later stages set `Answer: answered in spec, Session <date> (handoff: domain|joint|technical)` on a question, `Answer: applied, Session <date> (handoff: …)` on a decision, `Answer: replaced by the expert, Session <date> (handoff: …)` on a disputed one, `Answer: stated in spec: "<quote>" (<location>)` on an entry this stage should not have raised, or `Answer: left as written: <reason>`; a moved entry gains `Moved from <section> <date>: <reason>`.

(Check: at stage 4's start the hashes match and every entry has `Answer:` — *convention*; `build-feature-prepare` checks.)

## What this skill does not do

**It gates no build.** A stop outside the classes is a new class, added with its run id. **Whether it prevents a stop, and whether a decision an expert passes over is right, are unmeasured.**
