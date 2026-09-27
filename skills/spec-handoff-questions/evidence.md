# Spec handoff questions — evidence

For a person deciding whether to trust the directive text. The reading rules and the question classes were written 2026-09-24, the date of the owner's decision and of the first read of the eight handoffs, for the single-reader skill `spec-readiness`. The split into three sections and the rerun were decided by the owner on 2026-09-26, when that skill was replaced by this one and the three stages after it. The caveat rule, and the reversal of the later stages' one-at-a-time rule, were decided by the owner the same day, after the first run; then, on the owner's second report that day, the decide-first rule: the agent decides every gap it can and asks a person only on four grounds. No research pass and no refutation panel stands behind any of it.

## Provenance

| Source | What was read | How |
|---|---|---|
| Eight `HANDOFF.md` files, one per stop | the *What the stage reported* section of each, in full | `git show <sha>:<path>` in the service repository, read-only, 2026-09-24 |
| The run ledger, sweep 2 (2026-09-24), per-stop table | the cause, earliest stage and target of each of the 35 stops on record; group 3, *the spec already held the question* | read in the repository these skills distribute from |
| `reference-data` `specs/003-constant-registry/RESOLUTIONS.md` | how the launching session resolved the 003 stops, and on what grounds | `git show HEAD:<path>`, read-only |
| `build-feature`'s `workflow.mjs` before 2026-09-21 (`9e91cdf^`) | the review-spec stage's reviewer and fixer prompts | `git show` in the repository these skills distribute from |
| `build-feature`'s `workflow.mjs` and `evidence.md` at 2026-09-24 | preflight's dirty-tree rule, `specChangesOf`, the review-spec record of 2026-09-17 | read |
| Stock spec-kit 1.0.8 `speckit-clarify` and `speckit-checklist` skills, as installed in `reference-data` | the five-question cap; which files each loads | `grep` over the installed `SKILL.md` files |
| The owner, 2026-09-26 | the two failures of the single-reader skill; the split, the joint step and the completeness rule | the owner's decision, *convention* |
| Claude Code skills documentation, `code.claude.com/docs/en/skills` | the `disable-model-invocation` field | read 2026-09-26 |
| `account-metadata` `specs/002-account-attributes/HANDOFF-QUESTIONS.md`, the first run's output | questions per section (29 Domain, 7 Domain+Technical, 10 Technical); Q1 and the spec text it quotes | read in that repository's working tree, 2026-09-26 |
| The owner, after that run, 2026-09-26 | most Domain questions only re-confirmed the spec; the caveat rule; one table with recommendations in stages 2 to 4 | the owner's decision, *convention* |
| The owner, second report, 2026-09-26 | the handoff still asked what the spec stated; its purpose is fewer questions to people; the agent decides what it can | the owner's decision, *convention* |

The eight stops, with the handoff commit each was read from:

| Run | Date | Repository, feature | Stage | Handoff commit |
|---|---|---|---|---|
| `wf_de4bfd27-d8a` | 2026-09-21 | `reference-data`, 001-company-registry | analyze | `620e54a` |
| `wf_bc7b0f7c-ce6` | 2026-09-22 | `reference-data`, 001-company-registry | analyze | `0bfcb47` |
| `wf_fbb2141f-8bf` | 2026-09-22 | `reference-data`, 001-company-registry | analyze | `5935a86` |
| `wf_115f053c-900` | 2026-09-22 | `reference-data`, 002-branch-registry | review-plan | `c25ad10` |
| `wf_e4e27b83-bc3` | 2026-09-22 | `reference-data`, 003-constant-registry | analyze | `fc4c90f` |
| `wf_6e72f3dd-930` | 2026-09-22 | `reference-data`, 003-constant-registry | analyze | `94a3842` |
| `wf_a6f3b709-43a` | 2026-09-23 | `reference-data`, 003-constant-registry | analyze | `a28087c` |
| `wf_e68e4e48-4ed` | 2026-09-23 | `customer-party-adapter`, 001-party-registry | review-plan | `cfc16bb` |

Dates are the journal's UTC day. The 003 `RESOLUTIONS.md` dates some of the same stops a day later, in local time.

A spec change restarts the run at `plan`, and five of these eight restarts then stopped at a fresh review-plan cap (run ledger, sweep 2, 2026-09-24; moved here from `SKILL.md` on 2026-09-26, not re-counted).

## Run it in a fresh context

The fresh-context premise is `build-feature`'s: on 2026-09-16 two fresh-context reviews found a constitution lagging the plan, a test-property precedence error and an ArchUnit scope error that the writing context had approved (that skill's evidence, 2026-09-16). That is one observation. It is not a measurement that fresh-context review of a *spec* finds more.

Every one of the eight specs had been through `/speckit-clarify` before its run: each of the four features' `spec.md` carries a `### Session 2026-09-21` block under Clarifications at the handoff commit of its first stop (checked 2026-09-24 at `620e54a`, `c25ad10`, `fc4c90f` and `cfc16bb`). Stock `speckit-clarify` 1.0.8 states "Maximum of 5 total questions across the whole session" and loads `.specify/memory/constitution.md`. Neither it nor `speckit-checklist` references any other directory under `specs/`, by `grep` over both installed `SKILL.md` files, 2026-09-24. *Primary-source verified* for spec-kit 1.0.8 only. A later spec-kit may read more.

The tier sentence names `build-feature`'s review-plan row as it stood on 2026-09-24. It follows that table, and the row can move.

The subagent reads this skill by its path because of the frontmatter. The Claude Code skills documentation, read 2026-09-26, gives `disable-model-invocation: true` as "Description not in context, full skill loads when you invoke", describes it as set "to prevent Claude from automatically loading this skill", and says it "Also prevents the skill from being preloaded into subagents". *Primary-source verified*, one reader, for that date. The field is a Claude Code extension: the same page lists it outside the Agent Skills spec's fields, and says a claude.ai upload refuses a field outside the spec.

## Read the spec, the constitution and the sibling specs, and write only the file

The review-spec reviewer prompt, recovered from `9e91cdf^`, opened: "You are a fresh-context reviewer with no memory of how spec.md was written. Your job is to REFUTE the claim that it is a complete, faithful and testable specification of its source. Read-only: change nothing." It read the spec, `checklists/requirements.md` and the constitution in full, and required each finding to name "the exact location and the concrete edit that resolves it". **Kept:** the stance, the full reading, the exact location. **Dropped:** the source-faithfulness items (the upstream-provenance layer they checked was removed from the service repositories on 2026-09-21), the concrete edit, the fix prompt that applied findings to `spec.md` and committed `spec: review round N`, and the round loop.

Why the stage was removed, from `build-feature`'s evidence, 2026-09-21: the spec became an input the run may not write, "the one thing in the feature directory no agent of the run wrote, and therefore the only oracle the run's own gates can be refuted against". The loop record, from the same file: run `wf_cc1aa65d-148`, three spec-review rounds (6 → 3 → 1 blocking), 1.19M subagent tokens; and, over the seven launches of 2026-09-17, most findings at a cap were "holes opened by the previous round's fix".

Code and plan artifacts are left out by decision, 2026-09-24, *convention*. The cost is known: on `wf_6e72f3dd-930` the blank-query answer came from shipped `CompanyService` and `BranchService` code as well as from the sibling specs. This skill reaches that case only through the sibling specs.

## What the reader looks for

The classes are the item-level causes in the eight handoffs, grouped by what the author would have had to write. The sweep-2 table summarises each stop's cause in a single cell. The handoffs hold more than one item per stop: 18 items across the eight, counted 2026-09-24 and re-countable from the table above. Every item fits a class below. No class was added without an item behind it, except the constitution class, which the owner asked for and which rests on the review-spec record instead.

The default section per class is the owner's split of 2026-09-26 applied to these items by the pass that wrote this skill, *convention*. No item was re-read against it.

### Markers and placeholders the build refuses on

Not among the eight, because preflight already refuses on a marker (`build-feature`, *Unattended means the agent decides by a written rule*). The review-spec prompt graded "a [NEEDS CLARIFICATION] or template placeholder left in the spec" blocking.

### A value, bound or fact the spec defers or assumes

- `wf_de4bfd27-d8a` U1 [HIGH]: "the spec records the bound as an unresolved clarification to be confirmed by the domain owner before /speckit-plan, and no functional requirement states any bound, while plan.md R1, data-model.md and migration task T010 all carry ^[A-Z0-9]{1,10}$."
- `wf_bc7b0f7c-ce6` A2 [LOW]: the 1–10 code length is "attributed to a domain-owner confirmation of 2026-09-22, but the Clarifications section records only the 2026-09-21 session".
- `wf_e68e4e48-4ed` item 1: the citizen-number Assumption says "the control-digit algorithm is confirmed at plan stage"; "no published control-digit algorithm exists". The sweep-2 table records the owner's answer: there is none.
- `wf_cc5b26f9-e4b` (target W in the sweep, not S): T104 waited on the owner's answers to plan readings (a)–(d); the owner confirmed all of them on 2026-09-23 (003 `RESOLUTIONS.md`).

Narrowed 2026-09-26 by the owner, after the first run: a value the spec states is no longer a question because a note beside it asks for confirmation. That run's Q1 quoted FR-009, which states the account name's length and characters outright, and an Assumptions note calling the number industry practice that needs the domain expert's confirmation; the note was the only reason for the question. Both instances above still fall in the narrowed class: U1's bound was recorded as unresolved and no requirement stated one, and the control-digit algorithm was deferred to plan stage with none named. The notes are gathered into one Caveats entry rather than ignored, because a note left in the spec is the text U1's reviewer read as an unresolved value; since the decide-first rule it is a decision deleting the notes, not a question. No stop caused by such a note alone is on record; that ground is inference, *convention*.

### A success criterion without its measurement conditions

- `wf_fbb2141f-8bf` A1 [MEDIUM]: SC-004 "states 'one page of list or search in under 1 second at 1,000 companies' with no percentile, concurrency, warmth or hardware condition, so it is not assertable as written." The load (1,000 companies) and the wait (1 second) are stated in business terms; what is missing is technical. It fits the owner's example of a Technical question.
- `wf_6e72f3dd-930` C1 [HIGH]: SC-004 "must say what 'ten times those amounts' measures" — 25,500 rows under one reading, 250,000 under the other.
- `wf_6e72f3dd-930` A3 [LOW]: SC-001 "'under 3 minutes' is not a measurable bound for this feature".
- The review-spec prompt graded "a success criterion with no measure" major.

### Search, filter and list semantics left to the contract

- `wf_bc7b0f7c-ce6` A1 [MEDIUM]: FR-013 "says a company is found by 'part of' its code, name or registration number without stating case sensitivity, match position or a query-length bound".
- `wf_6e72f3dd-930` A2 [HIGH]: FR-014 "must state the outcome of a blank or whitespace-only `q`"; resolved from 001, 002 and their shipped services (003 `RESOLUTIONS.md`).
- The page bound and the cross-grouping listing are T104 readings (a) and (b), `wf_cc5b26f9-e4b`.

### A guarantee without its conditions, an edge case without its outcome

- `wf_e4e27b83-bc3` U2 [HIGH]: "'each value appears exactly once' and '0 duplicated, 0 missing' are unqualified, but a keyset walk over the mutable key … can miss or repeat a row … and the spec's own edge case … leaves the outcome unstated." What a user sees there is a domain choice whose readings differ in technical cost, which fits the owner's example of a Domain+Technical question.

### Requirements that disagree, repeat or cite the wrong id

- `wf_fbb2141f-8bf` A2 [MEDIUM]: FR-009 against FR-011 and FR-013, "reconciled only by SC-003's single sentence and by plan decision D-g".
- `wf_e4e27b83-bc3` U1 [HIGH]: FR-010 "states unconditionally that a deactivated constant MUST be reactivatable"; resolved by stating that uniqueness holds across all rows regardless of status (003 `RESOLUTIONS.md`).
- `wf_6e72f3dd-930` A1 [HIGH]: FR-041 and the non-binding word "riskiest".
- `wf_de4bfd27-d8a` D1 [MEDIUM]: FR-025, FR-026 and FR-027 "restate one rule … in three aspects".
- Citation drift, 003 `RESOLUTIONS.md` at the T104 stop: FR-010 cited FR-021, "This session's own error of that date"; SC-002 repeated FR-019's list.

### Residue of a clarify answer

- `wf_115f053c-900` finding 1: FR-008, FR-009, FR-031 and scenarios 2.4 and 2.6 accept a company code on shape alone, "while those four places still demand a refusal naming an unknown or inactive company".
- `wf_a6f3b709-43a` I1 [HIGH]: scenario 4.10 and the edge case call the range "чөлөөтэй" (free); the session's resolution notes that "the scenario was left behind by that edit".

### A conflict with a sibling spec

- `wf_a6f3b709-43a` C1 [HIGH]: "003 spec.md SC-009 vs specs/005-address-registry/spec.md FR-006: the owners of the two specs must decide which one yields." Taken to the owner, who narrowed 003/SC-009 on 2026-09-23.

Narrowed 2026-09-26 by the owner's second report that the handoff re-asks what the spec states: silence where a sibling decides is no longer a question, and the sibling's answer stands. The one instance above is a contradiction and still falls in the class. No stop caused by silence against a sibling is on record.

### A conflict with the constitution

None of the eight. The ground is the review-spec prompt ("a requirement that violates a constitution article — blocking, and say which article") and `wf_cc1aa65d-148`, whose last blocker was "three Article VII articles written by 002 about tables 003 owns" (`build-feature` evidence, 2026-09-17). Kept because the owner asked for it on 2026-09-24. This is the class with the least ground: *convention*.

### A header the build contradicts

- `wf_de4bfd27-d8a` I2 [LOW]: "Branch reads feature/spec-v1 and Status reads 'Draft'".
- `wf_e4e27b83-bc3` F4 [LOW]: the header "names the branch `feature/spec-03-constant-register` … and Status still reads 'Draft — Ноорог'"; applied by the session (003 `RESOLUTIONS.md`).

The Status half is no longer a question since 2026-09-26: the domain expert sets Status at sign-off, and `build-feature-prepare` refuses a Draft.

## Decide what the agent can; ask only what a person alone knows

The owner's decision, 2026-09-26, *convention*, on the second report that the handoff asked what the spec stated: the handoff exists to cut the questions a person meets at plan, tasks and analyze, so the agent decides every gap it can, and a person sees its decisions only to dispute them. The four grounds for a question are this pass's wording of that decision.

What supports letting the agent decide: by the sweep-2 record, every recommendation a session made on the eight stops' items taken to a person was adopted, and the one later corrected was a fact only the owner held (`wf_e68e4e48-4ed`, the control-digit algorithm). That fact is the *external fact* ground, so the one wrong recommendation on record would still have been a question. Eight items, one team: *uncertain* as a rate.

The fallback reading (loses no data, money or legal standing, cheapest to reverse) is this pass's, *convention*; no stop on record tests it.

## Which section each entry goes in

The owner's decision, 2026-09-26, *convention*, on two observed failures of the single-reader skill `spec-readiness`: the domain expert was asked technical questions he could not answer, and the build stopped for spec changes after he had handed off. Neither is a run id in the ledger; both are the owner's report. The three section definitions, the examples in them and the split rule are the owner's, in his words where the directive quotes an example.

## How each entry is written

The fact that shows what a proposed answer can cost is `wf_e68e4e48-4ed`. The spec assumed a control-digit algorithm, the plan could not find one, and only the owner knew that none exists. By the sweep-2 record, the session's recommendations on the eight items taken to a person were all adopted, one then corrected by a fact only the owner held. That shows sessions recommend well. It does not show that a checker's proposed text is safe for the author to sign. The rule against writing the replacement sentence was the owner's decision (returns questions, never edits), made 2026-09-24, *convention*; the owner reversed it on 2026-09-26 with the decide-first rule. This stage still never edits the spec; it proposes the sentence, and a later stage applies it. Since 2026-09-26 the later stages recommend an answer per question and count a row the expert does not dispute as accepted: the owner's reversal, after the first run, of their one-at-a-time, no-recommendation rule. `wf_e68e4e48-4ed` is the cost that reversal accepts, which is why each recommendation names its source or says it is a guess.

## Grade by what a run would do, and drop nothing

`workflow.mjs` at 2026-09-24: `const specChangesOf = r => (r && Array.isArray(r.specChanges) ? r.specChanges.filter(Boolean) : [])`, and every stage that returns it stops on a non-empty result. No severity is read. *Primary-source verified*, one reader. LOW items were among the spec changes of `wf_de4bfd27-d8a` (I2), `wf_bc7b0f7c-ce6` (A2), `wf_e4e27b83-bc3` (F4) and `wf_6e72f3dd-930` (A3). Whether any of those would have stopped a run on its own was not tested.

## The file, and the rerun

`build-feature` preflight, `workflow.mjs` at 2026-09-24: "`git status --porcelain` must be empty (untracked files under .specify/workflows/runs/ and .claude/worktrees/ do not count). A dirty tree is a problem and you stop there". So an untracked `HANDOFF-QUESTIONS.md` in the feature directory is a preflight refusal. *Primary-source verified* for that date. The author works on the base branch while the build runs (owner's decision, 2026-09-21, recorded in `build-feature`).

The completeness rule (no open Domain or Domain+Technical question, and a rerun that adds none there) is the owner's, 2026-09-26. Encoding it as the last `Run` hash against the current spec is this skill's: a rerun that added an open question leaves that question open, and a spec edited after the last run fails the hash, so the two file conditions cover it. The hash leaves out the Status line so that the sign-off edit, which the owner placed after the rerun, does not fail it. *Convention*.

Preserving questions and appending on a rerun is the owner's decision, 2026-09-26. It replaces `spec-readiness`'s rule that each run replaced the file, which kept the earlier list only in git.

## What this skill does not do

What would reopen a decision here:

- A `build-feature` stop whose cause was in the spec before the run but fits no class above: add the class, with its run id.
- A spec that went through this check and still stopped on a class the check names: the reader missed it, and the finding is about the reading, not the class list.
- A question placed in one section that its people could not answer: the finding is about the section rule.
- A second team, or a spec in another repository: every class comes from one team's specs in two repositories over three days.
- A spec-kit release whose clarify or checklist reads the sibling specs: re-check the default this skill overrides.
- A stop whose cause was a value whose confirmation note the Caveats decision deleted: the caveat rule is wrong.
- A stop, or an expert's later correction, on a decision the agent made where a person alone knew the answer: the four grounds are too narrow.
- Questions reaching a person that meet none of the four grounds: the reading ignored them.
- A build stop on a subject where this spec was silent and a sibling decided: the 2026-09-26 narrowing of the sibling class is wrong.
- A question closed as `stated in spec` whose quoted text did not in fact answer it: the closing search is too loose.
- A recommended answer an expert passed over and later found wrong: the finding is about the 2026-09-26 reversal in stages 2 to 4.

**Not to be cited as evidence that this skill works**: the eight stops. They are the ground it was written from. One spec has been through it (`account-metadata` 002, 2026-09-26), before the caveat rule, and no build has followed.

| Claim | Marker |
|---|---|
| The eight stops' causes were in the spec text before the run | *primary-source verified* — one reader of the handoffs, 2026-09-24 |
| Clarify caps at five questions; neither clarify nor checklist reads sibling specs | *primary-source verified* — spec-kit 1.0.8, 2026-09-24 |
| `build-feature` stops on a spec change of any severity; preflight refuses on a dirty tree | *primary-source verified* — `workflow.mjs`, 2026-09-24 |
| `disable-model-invocation: true` keeps the description out of context and the skill out of subagent preloading | *primary-source verified* — Claude Code skills documentation, 2026-09-26 |
| A fresh context finds what the writing context approved | *convention* — one observation on plans, 2026-09-16 |
| The single-reader list sent technical questions to the domain expert, and the build stopped after his handoff | *convention* — the owner's report, 2026-09-26 |
| Most of the first run's 29 Domain questions only re-confirmed the spec | *convention* — the owner's report, 2026-09-26; Q1 read, the rest not re-read |
| The first run's questions were raised on subjects the spec answered in a section other than the one quoted | *uncertain* — inferred 2026-09-26 from the owner's second report and the Q1 shape; that run's file is on another machine and was not read here |
| An agent's decision, disputed only by exception, is right often enough to replace a question | *uncertain* — eight recommendations on record, one wrong, and that one an external fact |
| The class list covers what a spec lacks | *uncertain* — eight stops, one team |
| Running this check prevents a stop | *uncertain* — run once, no build since |
| Every directive | *convention* — decided 2026-09-24 and 2026-09-26, check is the written artifact |
