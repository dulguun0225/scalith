# spec handoff — authoring record

`spec-handoff-questions`, `spec-handoff-domain`, `spec-handoff-joint`, `build-feature-prepare`. They replace `spec-readiness` (2026-09-24), whose record is the third section of this file.

## 2026-09-26 — a recommendation on every question, made explicit

**Why.** The owner reported a run in which the agent would not give recommendations. The first version (`6e20d93`) said *Recommend nothing* in stage 2; `a614159` reversed it, but stages 2 to 4 still quoted the old rule as *one question at a time, with no recommendation* in their reversal notes, and stage 2 kept *the default is the agent supplying the fact. It lost*, which reads as a ban on the agent answering. Which version the reported run used is not known here; that machine's install was not read.

**Changes.** Stages 2, 3 and 4 state the rule directly: every question row carries a recommended answer, marked a guess where no source supports it; *only you know* or *I cannot recommend* is never one; for an outside fact, the most likely answer and what changes if it is wrong. The old-rule wording is gone from the directive text; the default is named as *ask without recommending* and why it lost. A question moved to Domain+Technical keeps its recommendation. Stage 1's question template and the deferred-fact class say the same; each check line now requires a recommendation that names an answer.

## 2026-09-26 — decide first: the agent answers what it can, a person only what a person alone knows

**Why.** The owner, after the leak fixes below: the handoff exists to take questions off people at plan, tasks and analyze, not to add them; AI is used to take work off people. The leak fixes still left the rule *every gap is a question for a person*. Owner's go, same day, on the proposal: the agent decides every gap it can; a person is asked only for what the agent cannot know.

**The decision, as written:**

- **Stage 1 writes decisions and questions.** Each gap becomes a decision — the sentence `spec.md` gains, with its source (quoted spec, sibling or constitution text, or a named established practice); where no source decides, the reading that loses no data, money or legal standing and is cheapest to reverse, marked as such. A question only on four grounds: an external fact, an owners' conflict with a sibling spec, an irreversible business choice no source settles, a constitution amendment. The four grounds are this pass's wording of the owner's decision. The Caveats entry became a decision deleting the notes. Markers follow the same test. Each section now holds `### Questions` and `### Decisions`, each ordered by `Stops at:` instead of six stage headings; ids `Q<n>` and `A<n>`; decisions start `Answer: proposed`, and completeness now also needs no `proposed` under Domain or Domain+Technical.
- **Reversed:** the 2026-09-24 rule that stage 1 writes no replacement sentence and chooses no reading. The external-fact ground keeps `wf_e68e4e48-4ed`, the one wrong recommendation on record, a question.
- **Stage 2** shows the domain expert one reply with two tables: the open Domain questions with a recommendation each, and the proposed Domain and Domain+Technical decisions with source and, for the latter, consequence in plain words. Disputes only; the rest applied.
- **Stage 3** only for Domain+Technical questions the agent could not decide; stage 2 applied that section's decisions.
- **Stage 4** applies every Technical decision without asking, shows the technical expert the Technical questions with recommendations and the applied decisions as a list; disputes only.

**Sweep.** `README.md` rows for all four and the stage list; `CLAUDE.md` index line; stage 1 evidence: intro, provenance row, a new section for the grounds, the Caveats and replacement-sentence passages, reopen conditions, one *uncertain* claim. `build-feature` names `build-feature-prepare`'s reopen rule, which still exists; left as is.

**Cost**, `npm run tokens`, SKILL.md body per firing: 3,038, 1,009, 827 and 1,031 tokens (questions, domain, joint, prepare), from 2,559, 884, 788 and 905. Descriptions 274, 283, 304 and 293 chars, all left out of the set total. Firing does not apply (`disable-model-invocation: true`).

**Not reviewed.** No adversarial review; no run of this form.

## 2026-09-26 — second report: questions the spec already answers are still asked

**What happened.** The owner reported, after the revision below, that the handoff still asks what the spec already states, and that its purpose is to cut the questions a person meets at the plan and tasks stages. The run was on another machine; its `HANDOFF-QUESTIONS.md` was not read here.

**Leaks found in the text, and the changes:**

- Stage 1 said *report every instance of each class* beside *raise only a real gap*; the class list invites a question per match. Now: search all of `spec.md` (every section, `## Clarifications` included), the constitution and the sibling specs for the answer before writing a question; any answer, uncontradicted, means no question. Then one re-read per drafted question before the file is written, deleting what the spec answers.
- The template's `Already decided by:` field let a question the constitution or a sibling already decided be asked anyway. Field removed; such a question is not raised.
- The sibling class asked about a sibling's answer this spec neither follows nor departs from. Now: contradictions only; the sibling's answer stands on silence. Its evidence instance is a contradiction.
- Stages 2, 3 and 4 said *where the spec already states the answer, recommend that answer* (2 and 4; 3 had nothing), so such questions were shown. Now each first closes them unasked with `Answer: stated in spec: "<quote>" (<location>)`, lists their ids in one line, and shows the rest.
- The rerun could raise a question on a subject already closed. Now it raises only a gap the changed text created, through the same search.

**Sweep.** `README.md` rows for all four; grep for `Already decided`, *neither follows nor departs*, *recommend that answer*: none left. Stage 1's evidence gained the sibling narrowing, two reopen conditions and one *uncertain* claim.

**Cost**, `npm run tokens`, SKILL.md body per firing: 2,559, 884, 788 and 905 tokens (questions, domain, joint, prepare), from 2,359, 769, 658 and 787. Descriptions unchanged. Firing does not apply (`disable-model-invocation: true`).

**Not reviewed.** No adversarial review; no run since.

## 2026-09-26 — first run, and the owner's reversal of the question flow

**What happened.** First real run, the same day the skills were published: `account-metadata`, `specs/002-account-attributes`. Stage 1 wrote 46 questions: 29 Domain, 7 Domain+Technical, 10 Technical (counted in that repository's `HANDOFF-QUESTIONS.md`). Stage 2 showed them one at a time with no recommendation, as written. The owner, who was the domain expert, overrode it: he asked for a recommendation, then objected that the questions were unnecessary. The trigger was Q1, which asked him to confirm the account name's length and characters. FR-009 states both outright; the only reason for the question was an Assumptions note saying the number needs the domain expert's confirmation. By the owner's report, many other questions had the same shape.

**The decisions** (owner's, 2026-09-26):

- **`spec-handoff-questions`: raise only a real gap** — no answer, contradicting statements, a case with no outcome. A question whose answer the spec states definitively is not raised. A confirmation or assumption note beside a stated value is no question of its own; every such note goes into one *Caveats on stated values* question, which stage 2 takes as one row. The *Deferred or assumed fact* class lost "a working value only under Assumptions"; both of its evidence instances (`wf_de4bfd27-d8a` U1, `wf_e68e4e48-4ed`) had no stated value and still fall in the narrowed class.
- **Stages 2, 3 and 4 show every open question at once**, in one compact table: the question in one plain sentence, a recommended answer, and a one-sentence reason naming its source or saying it is a guess, in the expert's language. The expert replies with only the rows he disagrees with; the rest count as accepted. Only what the expert accepted or said is written, and recorded under Clarifications as before. This replaces the one-at-a-time, no-recommendation rule written the same day, whose ground was that an answer accepted unchanged is the agent writing the spec. **Reason for the reversal:** walking the questions one by one without advice wasted the expert's time, and most only re-confirmed the spec. **Cost accepted:** a row the expert passes over puts the agent's answer in the spec; `wf_e68e4e48-4ed`, where the assumed fact was false and only the owner knew, is that cost's instance on record.
- The owner named stages 2 and 3; stage 4 (`build-feature-prepare`) carried the same rule and was changed with them on the owner's instruction to make every dependent update.

**Status lines corrected.** `spec-handoff-questions` and `spec-handoff-domain` said *never run*; both now say they ran once, before this revision. `spec-handoff-joint` and `build-feature-prepare` still have no run.

**Cost**, 2026-09-26 after the edit: descriptions 209, 245, 270 and 272 chars (questions, domain, joint, prepare), all left out of the set total, which stays 7,285 / 8,000. Body per firing, `npm run tokens`, SKILL.md only: 2,359, 769, 658 and 787 tokens, from 2,114, 589, 520 and 637. Firing does not apply (`disable-model-invocation: true`).

**Sweep.** `README.md` rows for all four skills. Grep over the repo for `spec-handoff`, *one at a time* and *no recommendation*: `build-feature/SKILL.md`, `build-feature/evidence.md`, `BACKLOG.md`, `CLAUDE.md` and `scripts/firing-harness.mjs` name the handoff without describing the question flow, and were left as they are.

**Not reviewed.** No adversarial review of the revision.

## 2026-09-26 — the split between a domain expert and a technical expert

**Why.** Owner's report and decision, 2026-09-26. `spec-readiness` wrote one list for one reader, the domain expert. Two failures: the domain expert was asked technical questions he could not answer, and the build stopped for spec changes after he had handed off. Neither is a run id in the run ledger; both are the owner's report, and the skill's evidence marks them *convention*.

**The decision** (owner's, same day): each person works alone wherever possible; the only joint step is for questions that need both; the handoff is complete after stage 3 plus a rerun of stage 1.

| Step | Skill | Who | Works on |
|---|---|---|---|
| 1 | `spec-handoff-questions` | anyone, as a fresh-context reader | writes `<featureDir>/HANDOFF-QUESTIONS.md`: `## Domain`, `## Domain+Technical`, `## Technical` |
| 2 | `spec-handoff-domain` | domain expert alone | `## Domain` |
| 3 | `spec-handoff-joint` | both; skipped when nothing is open | `## Domain+Technical` |
| 1 again | `spec-handoff-questions` | anyone | the answered spec; keeps every answer, appends new questions |
| 4 | `build-feature-prepare` | technical expert alone; refuses unless the handoff is complete | `## Technical` |
| 5 | `build-feature`, unchanged | technical expert | the committed spec |

**Carried from `spec-readiness` into stage 1:** the fresh-context reader, the refutation stance, read-only, the question classes and their eight run ids, verbatim quotation, grading by the stage that would stop, drop nothing, the `If unanswered:` line, no replacement text. The class list became one table with a default section per class.

**Decided by this pass, not by the owner** (each is stated in the directive text):

- **Spec hash leaves out the Status line**: `grep -v '^\*\*Status\*\*:' spec.md | git hash-object --stdin`. The owner placed sign-off (a Status edit) after the rerun; a plain `git hash-object` would then fail stage 4's hash check on every handoff.
- **Header holds one `Run` line per run**; completeness is read from the last one. An open question is one whose line reads `Answer: open`.
- **Each section holds the six stage groups** (preflight, review-plan, tasks, analyze, converge, no stop predicted); a rerun appends a new question at the end of its stage group, so the owner's two rules (order by stage, append on rerun) both hold.
- **A split Technical half carries `Depends on: Q<n>`**, and stage 4 shows that answer first.
- **Status Draft is no longer a question** in the header class; the domain expert sets Status at sign-off, and stage 4 refuses a Draft. Stage 4 also refuses an uncommitted feature directory, so the technical expert works from what the domain expert committed.
- **On a reopen, stage 4 commits the answers it has**, with the moved question, so the domain expert receives them in writing.

**Evidence.** `spec-readiness/evidence.md` moved to `spec-handoff-questions/evidence.md`, adapted: headings follow the new directive sections, the owner's 2026-09-26 decision and the Claude Code docs reading are added to provenance, and the rerun and hash are grounded. **Stages 2 to 4 ship no evidence file.** Their only ground is the owner's decision of 2026-09-26; an evidence file would restate that one sentence and carry no source. Each states its ground in its status line. The one run id they cite, `wf_e68e4e48-4ed`, is grounded in stage 1's evidence, which they name but do not link, since no link leaves a skill dir.

**Status, all four:** *decided, not yet validated*, 2026-09-26. No run has taken them.

### Frontmatter decision

All four are invoked by name only and carry `disable-model-invocation: true`. The Claude Code skills documentation (`code.claude.com/docs/en/skills`, read 2026-09-26) gives the key's row as "Description not in context, full skill loads when you invoke", says it prevents Claude from loading the skill and "also prevents the skill from being preloaded into subagents", and, under hiding skills, "This removes the skill from Claude's context entirely." The same page lists it as a Claude Code extension outside the Agent Skills spec's fields, and says a claude.ai upload or `package_skill.py` refuses such a field with a hard error. The distribution CLI (`skills` 1.5.21) ignores it: `npm run check` lists all four.

Consequence for stage 1: a dispatched reader subagent cannot load the skill through the skill tool, so the invoking context passes it the file's path.

`scripts/description-budget.mjs` now leaves skills with `disable-model-invocation: true` out of the 8,000-char set total; they are still parsed and held to the 400-char cap. The key must be the plain scalar `true` or `false`. Two canaries were added: `manual-only-bad-value` (`yes`, which YAML 1.1 reads as a boolean and 1.2 as a string) must be refused, and `manual-only` must be read as left out of the total. Both were checked blind by breaking each fixture once. The *does not decide* output gained a line: the exclusion rests on the docs, and a client that lists these descriptions anyway pays more than the total says.

### Cost and firing

- **Frontmatter**, `npm run tokens:frontmatter`, 2026-09-26: `build-feature-prepare` 69, `spec-handoff-questions` 68, `spec-handoff-joint` 67, `spec-handoff-domain` 63 tokens; 267 tokens together, left out of the per-session total, which is 1,755 across the 23 listed skills: since 2026-09-26 the report reads `disable-model-invocation: true` and lists these separately, because by the docs their descriptions are not in context.
- **Descriptions**, `npm run check:descriptions`: 229, 209, 215 and 190 chars, all left out of the set total, which is 7,285 / 8,000 (7,614 with `spec-readiness`).
- **Body per firing**, `npm run tokens`: `spec-handoff-questions` 3,963, `build-feature-prepare` 1,063, `spec-handoff-domain` 909, `spec-handoff-joint` 714 (o200k_base). `spec-readiness` was 5,712.
- **Firing: does not apply.** The model cannot invoke these skills, so no unprompted session can load them and a firing rate would measure nothing. The `spec-readiness-1` and `spec-readiness-2` cases were removed from `scripts/firing-cases.json`; the `speckit` fixture stays in `scripts/firing-harness.mjs`, unused, with its comment saying so. The 6/6 below was a rate for `spec-readiness`'s description and says nothing about these.

### Sweep

- `README.md`: the `spec-readiness` row replaced by four rows; step 3 of *Starting a new Java project* names the handoff sequence.
- `BACKLOG.md`, *LOW spec findings in the build*: names `spec-handoff-questions`.
- `build-feature/SKILL.md`: the sentence naming `/spec-readiness` and `READINESS.md` now names the handoff and `HANDOFF-QUESTIONS.md`; the *does not do* sentence says the spec is also the technical expert's for the Technical questions. Its heading *The spec is the domain expert's* was left as it is, a question for the owner.
- `build-feature/evidence.md`: the decided-and-not-applied entry records the replacement.
- `docs/history/runs.md` left as the historical record.
- `CLAUDE.md` *History* list: the line is owed; not edited by the pass that did this, which was a subagent.
- Grep for `spec-readiness`, `READINESS`, *readiness*, *sign-off*, *spec review* over `skills/`, `README.md`, `BACKLOG.md` and `docs/history/`, and a read of each hit: no other sentence says the check is `spec-readiness` or the file `READINESS.md`, outside this file, `runs.md`, the firing fixture comment and the new skills' own references to their predecessor.

### Not reviewed

No adversarial review has been run on the four skills.

## 2026-09-24 — `spec-readiness`, replaced 2026-09-26

The record of the single-reader skill as it was published. Kept unchanged below; where it names `READINESS.md`, the `spec-readiness-*` firing cases or `/spec-readiness`, it describes what existed then.

**Published 2026-09-24.** Owner's decision the same day: a read-only check of a spec-kit `spec.md` that the domain expert runs after `/speckit-clarify` and before handing the spec to `/build-feature`. It returns questions for the author, never edits the spec, and ships as its own skill in this repo. The three placements the backlog row weighed were stock spec-kit, a new skill, and `build-feature`'s preflight. The owner chose the new skill; preflight was rejected because it moves the stop before plan rather than preventing it.

### What the pass decided, and on what

- **Classes from the handoffs, not from the backlog summary.** The eight `HANDOFF.md` files the run ledger's sweep 2 marks target **S** were read in full from git, read-only (`git show <sha>:<path>` in `reference-data` and `customer-party-adapter`). They hold 18 items (counted 2026-09-24). Each item was placed in a class, and each class is a `###` directive in the skill: deferred or assumed value, bound or fact; success criterion without measurement conditions; search, filter and list semantics; guarantee without conditions and edge case without outcome; requirements that disagree, repeat or cite the wrong id; clarify residue; sibling-spec conflict; header the build contradicts. There are two further classes without an item among the eight: markers and placeholders (already a preflight refusal) and the constitution conflict (the owner's request, grounded on the review-spec record). The 003 `RESOLUTIONS.md` supplied the citation-drift instance and the `wf_cc5b26f9-e4b` readings.
- **The removed review-spec stage was recovered from `9e91cdf^:skills/build-feature/workflow.mjs`.** Kept: the fresh-context refutation stance, the full reading of spec, checklist and constitution, and the exact location on every finding. Dropped: the fix prompt that wrote `spec.md`, the round loop (6 → 3 → 1 blocking on `wf_cc1aa65d-148`, no fixed point), the upstream source-faithfulness items (that layer left the service repos 2026-09-21), and "the concrete edit that resolves it".
- **Output: `<featureDir>/READINESS.md`, written by the reader and committed by the author.** A file in the feature directory rather than a chat reply, so that its absence at the build's starting commit is visible. The reader commits nothing, because the author is on the base branch. The file cannot be left untracked by accident: `build-feature` preflight requires `git status --porcelain` to be empty (verified in `workflow.mjs`, 2026-09-24). The header records the spec's `git hash-object`, so a stale list is detectable by one command.
- **Severity: graded by predicted stop, nothing dropped.** `specChangesOf` in `workflow.mjs` filters on nothing, so `build-feature` stops on a spec-only finding of any severity. LOW items were among the spec changes of four of the eight stops. The owner's open question, whether a MEDIUM or LOW spec finding should stop a run, is answered only inside this skill's scope: nothing here stops, and every question is listed. Whether `build-feature` should stop on LOW is still the owner's question, on the backlog row.
- **Questions carry readings, never the replacement sentence.** On `wf_e68e4e48-4ed` the assumed fact was false, and only the owner knew that.
- **One re-run after the answers, then stop.** It catches residue of the new answers. The loop limit is there because the review-spec loop had no fixed point.
- **`new-java-backend` not edited.** Its body does not describe the spec sequence, and its own directive bans naming a `/speckit.*` command as a next step. A sentence naming spec → clarify → spec-readiness → build-feature there would contradict it. The sequence lives in `README.md`, *Starting a new Java project*, step 3.

### Cost and firing

- **Frontmatter: 87 tokens** (name 3, description 77, framing 7), `npm run tokens:frontmatter`, 2026-09-24. Set total 1,842 across the twenty-four skills on that date. **Description: 329 chars**; set total 7,614 / 8,000 by `npm run check:descriptions`, up from 7,285.
- **Body: 5,712 tokens per firing**, `npm run tokens`, o200k_base, 2026-09-24.
- **Firing: 6/6**, cases `spec-readiness-1` and `spec-readiness-2`, three repeats each, first-move mode, `claude-opus-5-5`, Claude Code 2.1.281, linux, 2026-09-24T12:59Z, $1.08. No other skill fired in any of the six, `build-feature` included. The cases run in a new `speckit` fixture (a constitution, two specs, `.specify/feature.json`), added to `scripts/firing-harness.mjs` with the cases, so no existing baseline restarted. Not measured: explore mode, any other model, any real consumer session.
- **Harness change on the way.** The first attempt was refused by the preflight: CLI 2.1.281 exposes `ListAgents` and `Monitor`, which `DENIED` lacked. No case session had been spent. Both were added. This is the guard of 2026-08-03 working as written.
- **Worth loading?** It fires once per feature, at sign-off, plus once per re-run; ten features in three repositories appear in the run journals over 2026-09-17..24 (`npm run runs -- --since 2026-09-17 --json`). Against that, 87 tokens in every session is small. The trade the harvest rule asks about is unmeasured, since no spec has been through the check.

### Sweep

- `README.md`: row in *What is published*; step 3 of *Starting a new Java project* now names `/spec-readiness` between clarify and plan.
- `CLAUDE.md` *History* list: the line for this file is owed. It was not written in this pass because the pass was run by a subagent, and a `CLAUDE.md` edit needs the owner.
- Owed in files this pass was told not to touch, handed back with exact text: `build-feature/SKILL.md` (the author's step before the run) and `build-feature/evidence.md` line listing "a spec-readiness pass the author runs before sign-off" under *decided and not applied* (now published); the backlog row *Spec readiness before sign-off*.
- Grep over `skills/*/SKILL.md`, `README.md` and `CLAUDE.md` for sentences saying no spec check exists: none outside `build-feature`. `build-feature/SKILL.md`'s status line says the run has "no spec review", which is still true of the run and is left alone.

### Not reviewed

No adversarial review has been run on this skill. The directive text was checked against the handoffs by the pass that wrote it. That is the shape this repo's *follow the pointer* class records failing.
