# build-feature and converge-feature

*Moved 2026-09-27 from `docs/history/java-backend-template.md` in `dulguun0225/skills` at `2ab5dc4`, sections unchanged. Later records of these two skills are in their `evidence.md` files and in [runs.md](runs.md).*

## `converge-feature`, and the severity floor in `build-feature` — 2026-09-18

*Superseded in its default by "The default severity floor is `NONE`" below: the floor stayed the only stop test, but `LOW` is no longer the default. The ground below stands as the record of why `LOW` was chosen.*

Ground: the product-catalog repo's `001-product-hierarchy`, converged by hand on `main` (head `f2b5f1f`): five converge ⇄ implement passes, no fixed point, the fifth appending nothing only because the operator had stopped applying LOW findings. `build-feature`'s converge loop now carries every gap graded on the analyze scale, stops on `converged` or on a round with nothing above LOW, logs which, defaults to six rounds, and reports reaching the cap as `converge.ended: "round-cap"` on a `done` return — the wall stays the gate, red wall and unchecked appended tasks stay `needs-human`. `converge-feature` is a named entry point to that loop from `converge` to `finish` through the sibling's script, no script of its own; the rejected alternative is `/loop` with a retyped sentence, on the three grounds its SKILL.md states. Both marked *decided, not yet validated*: no scripted run has yet reached the converge stage on this table.

Per-session cost, `npm run tokens:frontmatter`, 2026-09-18, o200k_base: `converge-feature` 114 tokens (name plus description; 119 with framing), set total 4,851 across twenty-three skills, up from 4,581 across twenty-one on 2026-09-16, with `build-feature`'s description edit inside that delta. A per-feature-cadence skill like its sibling; accepted because the alternative was a sentence retyped per feature and per project with no written stop rule. Firing: meant to be invoked by name; unprompted firing on "finish this feature" unmeasured.

## The severity-floor commit reviewed — 2026-09-18

An adversarial review of `cc903d0`, the commit recorded directly above, read against `/speckit-converge`'s own
Steps 4, 5 and 7 rather than against a run. **No run: nothing in that commit or this one has been executed
against the Workflow tool, and both skills stay *decided, not yet validated*.** Eight defects, corrected in one
commit.

Three were in the loop's stop logic, and each would have ended a run early or reported something untrue. The
loop read `outcome` before the floor, and `/speckit-converge` Step 7 defines `converged` as *no **actionable**
findings* while Step 4 surfaces `unrequested` gaps for awareness only — so a HIGH gap graded non-actionable
arrived as `converged` and broke the loop before the floor was consulted; the floor is now the only stop test,
and a `converged` return carrying a finding above it ends the run `needs-human`, because nothing was appended
and the next round would repeat it to the cap. The prompt had written a third severity vocabulary beside Step 5
and the analyze schema's, whose LOW clause — *a gap a person would not notice* — graded exactly the class the
hand-driven 001 run kept finding; the ad-hoc clauses are gone and the prompt names Step 5 as the scale. And the
findings carried at the cap were the ones that round had just implemented, so the log line was false: the cap is
now followed by one assess-only round, the `max + 1` shape the review and analyze loops already use, and its
findings are what the run reports.

Three more were smaller and of the classes this repo already records. `findings: []` satisfied the schema's
`required`, so a round that appended tasks and graded nothing stopped at the floor claiming nothing was above
it — unknown is not below the floor, and that shape now continues the loop. `SEVERITY_FLOOR` was compared with
`!==`, a constant named like a knob that would break silently the day the floor is raised; the comparison is by
rank against the declared order. And the `status: "done"` check in `build-feature`'s SKILL.md claimed the finish
wall is green where an `until` before finish returns `done` with `finish: null`, and claimed *no third exit*
about every way the script can stop, where a throw from `must()` or the argument checks is neither return —
**a check line is directive text and overclaims like any other sentence**, which is the class the repo has
recorded under *follow the pointer*.

The last two were in `converge-feature` and are the *evidence.md fixed, SKILL.md missed* shape in a new
direction — a sibling stating a precondition its neighbour drops. `build-feature` states that a user-level
install under `~/.claude/skills/` needs `/add-dir` or a `Read` allow rule before the Workflow tool will accept
its `scriptPath`; `converge-feature` omitted it and diagnosed the same "cannot read" refusal as a missing
sibling, prescribing `npx skills add`, which does nothing for that cause. And `push` and `mergeInto` were named
without their defaults beside an example running on `branch: "main"`, so following the example pushes `main`
directly with nothing on the page saying so. Both corrected; the missing-sibling sentence stays for its own case.

Per-session cost: no `description` changed, so the frontmatter total is unchanged from the line recorded above.
Firing: unchanged, and still unmeasured for both skills.

## The severity floor became an argument — 2026-09-18

*Superseded in its default by the last entry of this file. Everything else here holds.*

The owner asked for the converge stop level to be chosen per run, `LOW` by default, from both entry points.
**No run: nothing here was executed, and both skills stay *decided, not yet validated*.** `args.severityFloor`
joins `build-feature`'s configuration, uppercased, defaulting to `LOW`, and is checked against the four-value
scale beside the tier rows — before the first agent starts, on the roster's own reasoning: a bad floor must not
cost a run its specify-through-implement spend before it is caught. `converge-feature` carries it in its example
call and names it as the one setting that moves where the loop stops, which is the per-feature call that skill
exists for; it owns no rule about it, and the check stays in the script.

Two things made this a small change rather than a rewrite, and both came from the adversarial review recorded
above. The floor comparison was already by rank against the declared order — written for *the day the floor is
raised to MEDIUM*, which is this one — so the constant became a configuration read and nothing else moved. And
the floor is filtered in the script and never appears in the converge prompt, so moving it cannot move a grade;
that property was not designed for this change but is what makes the argument honest, and it is now stated in
the check line. `converge.floor` on the return already carried the value, so a run's stop level is readable
from its result.

`CRITICAL` was accepted for one edit and refused the same day, when the owner asked whether
`/speckit-converge` has that severity at all. It does: Step 5 grades a constitution MUST violation, or a
`missing`/`contradicts` gap blocking a P1 user story's baseline functionality, as CRITICAL. So a floor there
tolerates every finding the scale has and ends the loop after one round, and it is refused with a message
saying so; the legal floors are `HIGH`, `MEDIUM`, `LOW`. **The first version accepted it because the scale was
read off this script's own schema enum rather than off the skill that grades against it** — *follow the
pointer*, the class this repo has recorded most often after counting, and the second time in two days that a
claim about `/speckit-converge`'s text was written without opening `/speckit-converge`. The other was defect
(2) of the adversarial review above, where a third severity vocabulary was invented beside Step 5's.
Per-session cost unchanged in kind: `build-feature`'s description and `converge-feature`'s are
untouched by this change, deliberately, because both still describe the default truthfully and a description
edit invalidates the firing baseline neither skill has yet measured.

## The example args carried a real feature — 2026-09-18

The owner read `converge-feature`'s `Workflow({…})` block and asked why it names
`specs/001-product-hierarchy`. Because the skill was harvested from that run and the example was copied from
it rather than written. In prose that is provenance and stays — the dated ground for the severity-floor claim,
in this file, in both `evidence.md` files and in the `/loop` rejection. In a fenced call a reader copies it is
a defect: the path resolves in no other repo, and it sat beside `branch: "main"` while `push` defaults to
true, so the copy-paste path pushes the reader's `main`. Now `specs/<nnn>-<feature>` and `<feature-branch>`,
with the sentence below the block rewritten to say finish pushes whatever `branch` names instead of pointing
at the example's `main`. `wall: "node backend/scripts/wall.mjs"` is left real: it is the sibling template's
own path and resolves for the reader this skill is written for.

**The class is the inverse of de-naming.** De-naming strips a real name where the reader needs it; this
leaves a real name where the reader needs a hole. Both are born the same way — writing from the run in front
of you — and the discriminator is whether the text is a claim or a template. A swept grep over `skills/` for
`specs/0`, `featureDir:` and `branch: "main"` found this the only instance. `npm run check` and
`npm run gates` green after; neither reaches the inside of a fenced block, and no gate here ever will.

## The default severity floor is `NONE` — 2026-09-18

The owner reversed the default converge stop level from `LOW` to `NONE` — tolerating nothing — for
`build-feature` and therefore for `converge-feature`, which passes it. The reversal was taken after the
counter-argument was put: the `001-product-hierarchy` run recorded twice above shows converge has no fixed
point, and that is why `LOW` was chosen the same morning. The owner reaffirmed. **The ground it was reversed
on: a tolerated finding is a finding left open, and a stop test that tolerates a class of finding has written
that class out of the definition of done. What the no-fixed-point run shows is that the loop will not
terminate on its own, not that a tolerated finding is closed.** Both earlier entries stand as dated records
and are marked superseded in their default where a reader would otherwise act on them. **No run: nothing here
was executed, and both skills stay *decided, not yet validated*.**

In the script, `NONE` joins `HIGH`, `MEDIUM`, `LOW` as a legal floor and becomes the default; it ranks below
every graded severity (`floorRank = SEVERITY_ORDER.length`), so every graded finding is above it. `CRITICAL`
is still refused on the same Step 5 reading. Nothing about the comparison moved: it was already by rank, and
a severity off the scale (`rank === -1`) still ranks above the floor. Two exits changed meaning rather than
code, and both are now stated where a reader will look. The in-loop `severity-floor` exit is unreachable
under `NONE` — a round that grades nothing already continues as *shown nothing*, and a round that grades
anything has graded above the floor — so it belongs to a run that raised the floor. On the post-cap
assess-only path a zero-finding assessment used to end `severity-floor`; under `NONE` it is labelled
`converged`, because the round found nothing and the other label names a floor that tolerates nothing. Every
log line and the contradiction message that named the floor are floor-aware, so no run prints *nothing above
NONE*.

**The cost is stated rather than argued away.** Under `NONE` the clean `converged` exit needs a round that
appends nothing *and* grades nothing, so a real feature will usually end at `maxConvergeRounds` — unchanged
at 6, and a caller who wants more passes raises the cap, not the floor — with its open findings reported on a
`done` return, or at `needs-human` where converge returns `converged` while still grading a gap. That
`needs-human` was already the contradiction branch; it is now much more likely, because `/speckit-converge`
Step 7 calls a round converged on *no **actionable** findings* and Step 4 surfaces gaps for awareness, and
under this floor the run declines to adopt that judgment. The wall at finish remains the gate.

Per-session cost, `npm run tokens:frontmatter`, 2026-09-18, o200k_base: `build-feature` 132 tokens of name
plus description (139 with framing), `converge-feature` 128 (133 with framing), set total 4,880 across the
skills the script lists, up from 4,851 the same day. **Both descriptions were edited by this change** —
`converge-feature`'s said *until nothing converge reports is above LOW severity*, which the reversal made
false, and `build-feature`'s said the loop *ends when nothing it finds is above LOW severity*. A description
edit invalidates any firing baseline; **neither skill has ever measured one**, so nothing was invalidated in
fact, and the first measurement of either is still owed. **Still true of firing on 2026-09-22; no longer true
of the runs themselves** — the first read of the Workflow journals landed that day and is in
[runs.md](runs.md), which is where every later measurement of these two skills goes.

Exercised, not measured: the exits were driven against a stub of the Workflow sandbox — `NONE` with a clean
round, with one LOW on a `converged` return, with an off-scale severity, the cap with a clean and with a
graded assess-only round, and the same cap shapes at a `LOW` floor — and each produced the `converge.ended`
and the log line the skills claim. That is a reading of the script under stubs, not a run: no Workflow run
has reached the converge stage at any floor. `npm run check` and `npm run gates` green after. **The last
clause was overtaken three days later and the correction is dated 2026-09-22, not here**: nine runs have
since entered at converge — three to the round cap at floor `NONE`, three `converged` at a floor raised to
`LOW` or `MEDIUM`, three to the `needs-human` exit the forced round was written to remove — and the forced
round itself has run seventeen times. [runs.md](runs.md) carries the reading and the run ids.

## 2026-09-21, later still: `build-feature` starts at plan, and the spec is an input it may not write

The owner's decision, settled before the work started: features are no longer specified from a document in
another repository. A domain expert writes `specs/<NNN>-<name>/spec.md` in the service project with stock
`/speckit-specify` and `/speckit-clarify`, so the feature branch, the feature directory and
`.specify/feature.json` exist before any unattended run begins, and the run starts at `/speckit-plan`. The
same day the service repos dropped the upstream-provenance layer of their traceability gate — the pinned
snapshots, the two provenance tables and the refresh script — so everything `build-feature`'s prompts said
about pinning, accounting for and citing an upstream document now names files that do not exist.

`skills/build-feature/workflow.mjs` loses three stages (specify, clarify, and the review that refuted the
spec against its source), their fix agents, their tier rows, their round counter, two schemas, and the
`source` and `shortName` arguments; `STAGES` is `preflight, plan, review-plan, tasks, analyze, implement,
converge, finish`, so `from: "specify"` throws the same way any other unknown stage does. Nothing is kept
behind an argument nobody passes: a stage no run enters is a second way to build a feature that no gate
exercises. The provenance sentences come out of the plan, tasks and implement prompts, and the **waiver**
sentences they were interleaved with stay word for word — a waiver row still originates at the tasks stage
and nowhere else.

Two things replaced them. **Preflight became discovery**, and the discovery half runs on every entry: the
feature directory from `args.featureDir`, else `.specify/feature.json`'s `feature_directory` — which is
where stock spec-kit 1.0.8's `common.sh` reads the current feature from, the branch being a fallback for the
branch name only — else the branch name; the branch from `args.branch` else `git rev-parse`. It refuses when
nothing resolves, when the resolved directory has no readable `spec.md`, when a clarification marker is still
in the spec, and — for a run that actually starts at preflight — when the checkout is on the base branch. A
run that starts later is resuming work that may live on that branch, so it is not refused for it; that is how
`001-product-hierarchy` was converged. The restart defect this closes is old and quiet: `from: "plan"` left
`state.branch` null, the handoff table printed `(unknown)`, and the finish agent was told to fast-forward from
`HEAD@{1}`.

**And the spec is an input the run reads and never writes.** One rendered ban goes into every stage prompt
that can reach the file; the plan-review fixer and the analyze remediator return a finding they cannot resolve
otherwise under `specChanges`, which ends the run addressed to the spec's author; the implement prompt admits
it as the third blocker of a forced convergence task; the wall-repair prompts list a spec edit beside deleting
a test. The rejected alternative is to let the fix agents keep editing it as they always did. It loses on what
the artifact is now for: `spec.md` is the only thing in the feature directory no agent of the run authored,
and an artifact the run may rewrite cannot refute the run.

Needs-human reasons are now thirteen across nineteen exits, five of them preflight's, and `SKILL.md` lists
them; the earlier text said eight across thirteen and had been stale since 2026-09-20. `converge-feature`
passes the same script and needed only its example call and two sentences changed — `featureDir` and `branch`
are now the override rather than the requirement, and its blocked-task sentence gained the third blocker.

Per-session cost, `npm run tokens:frontmatter`, 2026-09-21, o200k_base: `build-feature` 135 tokens of name
plus description (144 with framing), `converge-feature` 124 (133 with framing), set total 4,885 across
twenty-three skills. Both descriptions changed, which invalidates any firing baseline either had — neither has
ever had one measured. `npm run gates` green. The script is exercised by syntax check only, and the check
itself has to be stated honestly: `node --check` rejects this file in both module modes, because the sandbox
evaluates the body inside an async function where its top-level `await` and `return` are legal, so the check
wraps it that way first. **No Workflow run has started from this shape.**

## 2026-09-21, last of the day: the build makes its own branch, syncs it, and distrusts spec-kit's local pointer

The entry above left one assumption in place — that the feature branch exists when the run starts, because its
author made it. The owner's correction: the domain expert may work **only on the base branch** (`dev`), writes
`spec.md` there, and keeps editing it while a build runs. His expectation of the skill, in his words: started on
the base branch, the run ends up on the feature branch, creating it when it does not exist.

Two things were read out of `product-catalog` before anything was written, and the first invalidates part of the
previous entry. `.specify/feature.json` is **git-ignored** (`.specify/.gitignore:6`, spec-kit's own comment
calling it per-checkout state), so it is not a record of the current feature at all — it is whatever this machine
last ran `/speckit-specify` on, which today is `004-product-gl-config` on a repo whose next feature is `005`.
Discovery had put it first. It is now last and never overrides: `args.featureDir`, then the branch name, then —
only on the base branch — the one directory under `specs/` with a non-empty `spec.md` and no `plan.md`, the
feature specified and not yet planned, with zero or several candidates being a `needs-human` exit that lists them
rather than a pick.

The second is that resolving it here was never sufficient. In spec-kit 1.0.8's `.specify/scripts/bash/common.sh`,
`get_feature_paths()` reads `SPECIFY_FEATURE_DIRECTORY`, then `.specify/feature.json`, and nothing else;
`get_current_branch()` returns `$SPECIFY_FEATURE` or the empty string and **never reads git**. So no speckit skill
sees the branch name, no branch name is refused — `feature/005-x` and a bare `005-x` are equally fine, which
settles the naming question the design raised — and a stale pointer sends `/speckit-plan` into the previous
feature's directory however well this script resolved the new one. Preflight therefore writes that one
git-ignored file to match, which is the single write it is allowed. A repository that tracks the file instead gets
the env-var route in the stage prompts, with the caveat stated: `get_feature_paths()` persists the variable into
the file itself unless the caller passed `--no-persist`, which this script cannot prevent.

The base-branch refusal added hours earlier is replaced by the work it was refusing to do. A full preflight on
the base branch checks out `args.branch`, else an existing `feature/<dir>` or `<dir>` local or remote, else a new
`feature/<dir>` — after the dirty-tree check, since all of it moves the tree — and then every entry whose branch
is not the base merges the base in: nothing when it is already an ancestor, `--ff-only` when behind,
`merge --no-edit` when diverged, `merge --abort` plus a `needs-human` with the paths on conflict. Never a rebase;
the branch may be pushed. The merge is conflict-free for the spec by construction, because no stage of the build
writes `spec.md` — and it is what lets the author keep editing on the trunk. A spec that moves under a run
starting later than `plan` is its own exit, restarting `from: "plan"`.

The handoff guard was re-derived rather than reasserted: `HANDOFF.md` is committed on the branch the run is on, so
`writeHandoff` now declines while `state.onBaseBranch` is true as well as when no feature directory is resolved.
A converge run on a trunk-implemented feature keeps its report on the return value and gets no file — named as a
cost, not discovered later.

Needs-human reasons: fifteen across twenty-one exits, seven of them preflight's. Per-session cost,
`npm run tokens:frontmatter`, 2026-09-21, o200k_base: `build-feature` 150 tokens of name plus description (159
with framing), set total 4,900 across twenty-three skills — a second description edit the same day, so any firing
baseline stays unmeasured. `npm run gates` green; the script syntax-checked the wrapped way, no run.

## 2026-09-22: a `needs-human` return is the launching session's to resolve, not to relay

The owner's decision. Ground, one run: it stopped at analyze on three findings whose only remedy was a change to
the spec, and the operator resolved all three by taking the session's own recommendation unchanged — a person
relaying an answer the session already had. The rejected default is what both skills shipped until today, relaying
every `needs-human` return to the person; it lost to the owner's rule of 2026-09-18, *a run never hands back work
it could have done itself*, which had already produced the forced convergence round, the bounded wall repairs and
the reconcile behind a failed append. The return value was the one place that rule stopped applying, because
nothing said it reached past the script. **This extends it from the loop to the session that launched the run.**

**It moves no exit.** `workflow.mjs` stops on exactly the fifteen reasons across twenty-one exits it stopped on
yesterday; what changed is who reads the stop first. The session forms a recommendation per item from the spec,
the constitution, the code and the handoff's quoted evidence, and acts on every one it holds with high
confidence — `spec.md` included — commits it, appends what it did and what it rested on to `<featureDir>/RESOLUTIONS.md`, restarts with
the arguments the handoff already carries, and reports decisions rather than questions. It reaches a person in
three cases only: no recommendation held with high confidence, the same item back after one attempt, or a
resolution that is a move the skill forbids — a weakened gate, a deleted test, a suppression or waiver row, a
force flag, a commit on the base branch, or somebody else's uncommitted tree or merge conflict.

**A first design was written and rejected before this one**, and the diagnosis is the durable part. It added a
dedicated `amend-spec` stage to the script — its own tier row, schema, prompt, audit file and argument — to apply
a `specChanges` finding. The owner rejected it as too specific: *"I wanted a general solution. If the session's
main agent can make a good recommendation just follow it, don't ask for humans."* He is right on shape. The
specific design solved one exit of twenty-one and would have had to be rebuilt per exit; the general rule solves
all of them and touches the script twice. A rule written at the level of the mechanism that produced an instance
ships a mechanism per instance; written at the level of who is standing there when it happens, it ships once.

Three choices. **The rule lives in `SKILL.md`**, because the actor is the invoking session and not an agent the
script dispatches. **`workflow.mjs` changed in one place** — `HANDOFF.md` opened *This run has stopped and is
waiting on a person* and *The decision being asked of you*, false about its own addressee now that the session
reads it first; it names who resolves it, on what test, the three cases that reach a person, and tells a person
arriving at the file to read `RESOLUTIONS.md` first. The restart arguments the session needs were already there.
**The trace is a file, `<featureDir>/RESOLUTIONS.md`**, append-only, not a section of `HANDOFF.md`: the script
overwrites that file at the next exit by design, and the one-attempt-per-item test must be answerable by a session
reading a *fresh* handoff without going through git history. Commit messages alone carry the change, not the item.
The asymmetry the rule has to justify — the session may edit a file no agent of the run may — rests on position:
an agent inside the loop is one the spec is the oracle for, and an artifact the run may rewrite cannot refute the
run, while the session is outside a stopped run and its edit is followed by a restart at the stage the handoff
names, so every gate the edit touches runs again. The restart is the safety.

`converge-feature` carries the rule in its own body, not only as a pointer: a session invoking `/converge-feature`
never loads `build-feature`'s `SKILL.md`, and a rule about what that session does when its own call returns has to
be readable from the text the call was made from. That is the first deliberate duplication between these two
skills, one paragraph, with `build-feature` named as owner beside it.

Per-session cost unchanged: no `description` in this repo was edited, so `tokens:frontmatter` and the
never-measured firing baselines are untouched. `npm run check` lists every skill, none skipped; `npm run gates`
green. **Nothing was executed — no session has applied a resolution under this rule, written a `RESOLUTIONS.md`
or reported a stop as settled.** *Decided, not yet validated.* Unmeasured and worth naming: how often a session
will in fact hold a recommendation with high confidence. The evidence is three items of one stop, all of one kind; whether it holds
for a red finish wall, a reconcile disagreement or a preflight refusal is the first real run's measurement.

## 2026-09-23: `build-feature`'s tier roster is Opus only

The owner's decision: every subagent runs on Opus 5.5, at low, medium or high effort — no Haiku, Sonnet or Fable.
The owner's global agent roster was switched the same day, so the script's roster still matches the roster the
same work runs on anywhere else, which was the 2026-09-18 ground for having one. `ROSTER` in
`skills/build-feature/workflow.mjs` is `opus` at `low`, `medium`, `high`. Mapping: preflight, phases, finish and
handoff, Sonnet low → Opus low; plan and review-plan, Fable low → Opus high; every Opus medium row unchanged.
`tier()` still refuses any other pair from the table or `args.tiers` before the first agent starts, exercised
against a stub that day. The model stays the alias `opus`, not a pinned `claude-opus-5-5`: the Workflow
authoring reference names no accepted values for `agent()`'s `model`, and the Agent tool's `model` is an enum of
aliases. So the alias resolves to Opus 5.5 as of this date, and a later Opus moves every row with no edit.

Swept: `build-feature` `SKILL.md` (roster directive, stage table, the effort rationale that replaced the
unused-tiers paragraph, the handoff agent's tier, the cost status line now saying its figures predate the
table) and `evidence.md` (a new dated entry, and supersession notes on the 2026-09-18 roster entry and the
section summary rather than rewrites); the `workflow.mjs` comments; `converge-feature` `SKILL.md`'s `/loop`
rejection, which named the phases row's tier. Left alone: every probe and firing stamp naming `claude-sonnet-5`,
which records what was run, not what routes, and the model list in `scripts/runs.mjs`, which parses old journals.

Per-session cost unchanged: no `description` edited. **No run has taken the new tiers**: every cost in
[runs](runs.md) predates them, and plan and review-plan at Opus high are the rows to watch, since high effort on
exactly those stages is how the 2026-09-17 runs got expensive, on Fable. *Decided, not yet validated.*

