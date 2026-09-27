# What the skills did on real work — the run ledger

`npm run firing` asks whether a skill loads. `npm run probes` asks whether it
needs to exist. The `tokens` family asks what it costs. **None of them observes a
skill doing the work it was written for**, and until 2026-09-22 nothing here did:
`build-feature` and `converge-feature` had been running unattended in two service
repositories for six days, every run leaving a journal, and no journal had been
read back.

`npm run runs` reads them. **Since 2026-09-24 it reads a second source beside
them: each service repository's git history of `<featureDir>/HANDOFF.md`.** Every
`needs-human` exit with a resolved feature directory, off the base branch, commits
that file with the subject `handoff: the <stage> stage stopped and needs a person`;
the report finds that commit for each stop, and lists the commits between it and
the next run on the feature — what somebody changed before restarting, which no
journal records. The git calls are read-only. It is **a report and can never be a gate** — every
number in it is a property of runs that happened on one machine, in repositories
this repo does not control, by an operator who may have intervened by hand
between runs; a threshold on any of it would fail this build for something nobody
in this repo did, which is the check-that-fails-on-noise `guardrails-toolchain`
bans by name. It is not in `npm run gates` and must not be added to it.

**The journals are ephemeral and nothing here commits one.** Claude Code writes
them to `~/.claude/projects/<consumer repo path with "/" replaced by "-">/<sessionId>/workflows/wf_*.json`.
They are machine-local, in no repository, and a cleared projects directory erases
them. **This page is the durable record** — the same arrangement `npm run firing`
has, where the sessions are thrown away and the rates are written down. Owner's
decision, 2026-09-22: no raw-JSON backup is committed anywhere, and
`npm run runs -- --json` exists for piping, not for keeping.

**The defect class this page exists for.** The lapse rule decays a *confirmed*
marker to *convention* once `review-by` passes, with no maintainer action needed.
**Nothing here ever promoted an *unrun* or *unmeasured* claim when a run took
it** — decay was handled in one direction only, and the first read of the banked
journals found a shipped status line calling three mechanisms unrun while one of
them had seventeen firings. A claim that a thing has not happened is as
perishable as a claim that it has.

---

## Sweep 1 — 2026-09-22

**Stamp.** 28 journals, runs `wf_79724f0d-fd4` (2026-09-17) through
`wf_fbb2141f-8bf` (2026-09-22). Repos `netos/netcore-platform/reference-data` (8
runs) and `netos/netcore-platform/product-catalog` (20). One machine, linux
7.1.5 x86_64, Claude Code CLI 2.1.278, Node v26.5.1, one operator. **No control
arm and no repeat**: every claim below is *convention* unless it is a direct
reading of a field, and a number is comparable only to another taken the same
way. Re-run with `npm run runs -- --since 2026-09-17 --until 2026-09-22 --repo
~/repos/netos/netcore-platform/reference-data --repo
~/repos/netos/netcore-platform/product-catalog`; the `--` is required, since
without it npm strips the flag names and the script reads every run unfiltered.
**That window is a superset of this stamp and cannot be narrowed to it**:
`--until` is day-granular and more runs ended on 2026-09-22 after this sweep was
taken, so the command lists 37 runs on 2026-09-24, and this sweep's 28 are the
first 28 of them, through `wf_fbb2141f-8bf` (03:12Z).

### Corpus

```
Corpus: 28 runs, 2026-09-17..2026-09-22, >=28,671,567 over 250/276 agents, 17.5h, 276 agents.
Exits: done=8, harness:killed=1, needs-human@-=1, needs-human@analyze=5, needs-human@converge=3, needs-human@preflight=1, needs-human@review-plan=5, needs-human@review-spec=4
Mechanisms across the corpus: forced=17, wallRepair=0, reconcile=0, assessOnly=4, stallRetry=2

Per feature:
  product-catalog/(unresolved)                         runs= 1 tok=0.04M implement-agents= 0  <- never reached implement
  product-catalog/specs/002-product                    runs= 4 tok=2.04M implement-agents= 6
  product-catalog/specs/003-product-version            runs= 9 tok=9.37M implement-agents=13
  product-catalog/specs/004-product-gl-config          runs= 6 tok=11.59M implement-agents=35
  reference-data/specs/001-company-registry            runs= 8 tok=5.62M implement-agents= 0  <- never reached implement
```

**Every token figure carries its coverage and the reason is not tidiness.**
`tokens` is null on 26 of 276 agents, all of them `state: "done"`, twelve of them
`implement phase`. Per-tier sums equal `totalTokens` exactly, so the nulls
contribute zero: **28.7M is a floor, not a total**, and a bare total would be
wrong by an unknown amount in one direction.

### Stage × tier — the cost table the skill said did not exist

`build-feature/SKILL.md` says *It has no measured cost in this shape yet*. This
is that cost, and it is the run's own arithmetic, not an estimate:

```
stage                           tier               n            tok(cov)   mean tok   mean s  retries
converge                        opus medium       39   5,845,202 (37/39)     157978      256  0
implement phase                 opus medium       54   4,199,203 (42/54)      99981      358  0
review-plan                     fable low         16   2,483,792 (15/16)     165586      303  1
analyze                         opus medium       14   1,723,794 (12/14)     143650      279  1
review-spec                     fable high         7     1,438,100 (7/7)     205443      550  0
fix-spec                        opus medium        9     1,206,834 (9/9)     134093      469  0
fix-plan                        opus medium       14   1,188,196 (13/14)      91400      206  0
phases after forced append      sonnet low        17   1,178,348 (16/17)      73647       40  0
review-plan                     opus high          3       992,253 (3/3)     330751      890  0
remediate                       opus medium       11     972,154 (10/11)      97215      252  0
phases after converge           sonnet low        16     867,639 (15/16)      57843       28  0
force-append converge           opus medium       17     852,978 (16/17)      53311       68  0
review-spec                     fable low          4       780,829 (4/4)     195207      187  0
tasks                           opus medium        6       739,343 (5/6)     147869      320  0
review-spec                     opus high          3       672,994 (3/3)     224331      575  0
converge (assess only)          opus medium        4       550,863 (4/4)     137716      211  0
handoff                         sonnet low        11     488,929 (11/11)      44448       39  0
plan                            opus xhigh         1       441,156 (1/1)     441156     2499  0
finish                          sonnet low         8       390,626 (8/8)      48828       91  0
plan                            fable low          4       382,488 (3/4)     127496      311  0
specify                         opus medium        2       371,022 (2/2)     185511      814  0
preflight                       sonnet low         5       218,649 (5/5)      43730       16  0
clarify                         opus medium        2       216,819 (2/2)     108410      291  0
converge                        opus high          1       199,918 (1/1)     199918      368  0
preflight (discovery and sync)  sonnet low         6       194,779 (5/6)      38956       16  0
phases                          sonnet low         2        74,659 (1/2)      74659       52  0

By tier alone:
  opus medium    n= 172  >=17,866,408 over 152/172 agents             mean=117542  mean_s=283
  fable low      n=  24  >=3,647,109 over 22/24 agents                mean=165778  mean_s=283
  sonnet low     n=  65  >=3,413,629 over 61/65 agents                mean=55961  mean_s=40
  opus high      n=   7  >=1,865,165 over 7/7 agents                  mean=266452  mean_s=680
  fable high     n=   7  >=1,438,100 over 7/7 agents                  mean=205443  mean_s=550
  opus xhigh     n=   1  >=441,156 over 1/1 agents                    mean=441156  mean_s=2499
```

The `opus high`, `fable high` and `opus xhigh` rows are runs from 2026-09-17 and
2026-09-19, before `tier()` was narrowed to the roster's six pairs; a run today
throws on any of them before its first agent starts. They are kept because they
are the only comparison the corpus contains.

### What this sweep changed in the skills

**1. The forced convergence round has run; wall repair and reconcile have not.**
`build-feature/SKILL.md` and `converge-feature/SKILL.md` both carried a sentence
calling the forced round, the bounded wall repairs and the reconcile-behind-a-
failed-append equally unrun. Measured: **17 `force-append converge` dispatches
across 4 runs on 2026-09-20** — `wf_3dc51822-772` (6), `wf_fbb96088-993` (6),
`wf_c6f73cab-e1f` (2), `wf_1ee836c9-35f` (3), all on
`product-catalog/specs/004-product-gl-config` — with **15** `Convergence (forced
round n)` phases implemented and wall green, 17 `phases after forced append`
certifier agents, and **188** entries in `result.converge.forced`. Wall repair:
**0** agents in 28 runs. Reconcile: **0**. *(Follow-up, 2026-09-24: wall repair **1**,
`wf_9e8bb81f-135`, green after the repair; reconcile still **0**, over 49 runs.)*

**The shape was worse than staleness, and that is the finding.** One sentence
marked three mechanisms equally unrun; one had seventeen firings and two had
none. A reader trusting it discounted the mechanism with evidence and trusted the
two without it exactly as much. Both status lines are now split, and each side
carries the run ids and the command that re-runs the count.

Not resolved, and left as owed: **17 dispatches produced 15 implemented forced
phases.** The two-run difference is not explained by anything in the journals.

**2. A question the tier table deferred to "the next run" is answered, as a
direction only.** `SKILL.md` rejected Fable at high and xhigh on 2026-09-17 and
ended *whether low effort brings that spend down is the next run's measurement,
not a claim here*. Fable low: 24 agents, mean 165,778 tokens over 22/24, mean
283 s. Fable high: 7 agents, mean 205,443 over 7/7, mean 550 s. Low is cheaper
per agent and faster. **This is not a controlled comparison** — different
stages, different features, different dates, no repeat — so it ships
*convention*, direction only. Recorded in the skill that way.

**3. The round-cap raise of 2026-09-18 bought rounds and not closure.** `maxReviewRounds`
and `maxAnalyzeRounds` went from 2 to 3 because the 2026-09-17 record showed the
operator resolving five capped runs by hand with one more fix round — a cap of 2
declining work the loop could do. Both skills then carried *no run has taken a third
round*. Measured: **six runs took one** — four at review-plan, one at review-spec, one
at analyze, each dispatching exactly three fix or remediate agents — and **all six
still ended `needs-human` at the cap**. So the paragraph's prediction (a bigger cap
buys rounds rather than closure, because most findings at a cap are holes the previous
fix opened) is confirmed and the hope beside it is not. **The counterfactual is
untaken**: nobody has run a fourth round on any of the six, which is the only thing
that would say whether 3 is a cap or a coincidence. Corrected in
`build-feature/evidence.md` and in the `maxReviewRounds` comment in `workflow.mjs`.

**4. Three more deferred claims answered, all as predicted.** Converge agents do return
graded findings (188 reached `converge.forced`, every one `LOW` on the four runs that
forced anything). The assess-only round has its number: four agents, 550,863 tokens, a
mean near 137,700. And **at the default floor `NONE` no run has ever ended
`converged`** — of seven terminated converge loops, four ended `round-cap` and three
`converged` only at a floor deliberately raised to `LOW` or `MEDIUM`. That is what
`build-feature` said would happen, so it is a confirmed prediction and not a defect.
*(Follow-up, 2026-09-24: three runs have since ended `converged` at `NONE` —
`wf_56a7b40b-9e7`, `wf_fb809526-d13`, `wf_e4af9888-80a` — against five at the round
cap.)*

### F3 — a feature can burn eight runs without reaching implement

`reference-data/specs/001-company-registry`, 2026-09-21..22: **8 runs, 5.62M
tokens, zero `implement` agents in any of them.** Exits: `needs-human` at
preflight ×1, review-plan ×3, analyze ×4. The recurrence block groups two of the
analyze exits on a normalised `result.why` and the review-plan cap exits on
another; read loosely, three of the four analyze exits carry the same sentence
differing only in a count word, and the third is outside the group for exactly
that reason — which is the grouping's stated limit, not a disagreement.

The loop is at a fixed point it cannot leave by itself. **This is the baseline for
the resolution rule of 2026-09-22**, which says the launching session resolves a
`needs-human` return rather than relaying it: as of this sweep no run had been
resolved under it, so 8-runs-no-code is the number the rule has to beat.

*Follow-up, 2026-09-24 (Sweep 2).* The feature left the fixed point on its ninth run,
`wf_9e8bb81f-135`, 2026-09-22 — plan through finish, 44 agents, 5.69M tokens, `done` at
the round cap with the wall green — for 11.32M across nine runs. The three features
started after it that have finished took four, five and nine runs (`reference-data`
002, `customer-party-adapter` 001, `reference-data` 003). What held it there was not
the rule's absence alone: each spec edit restarted the build at `plan`, the plan was
regenerated whole, and the new plan met a new review-plan cap (Sweep 2, *d*, group 3).

### F4 — the resolution record went into the file the skill calls the wrong file

`RESOLUTIONS.md` **has never existed** in either service repository
(`git log --all --diff-filter=A`: three files of that class ever — two
`HANDOFF.md`, one `convergence-rationale.md`). The two resolutions that were
recorded were written by **overwriting `HANDOFF.md`** with `# Resolved — …`
documents, which is precisely the failure `build-feature` names when it chooses a
separate file: *the script overwrites that file at the next exit by design*.

**Stated honestly: the resolution rule is dated 2026-09-22, the day of this
sweep, so 0-for-8 is the behaviour before the rule and not a violation of it.**
What it gives the rule is a baseline. What it also gives is the format that *was*
maintained without anybody enforcing it —
`product-catalog/specs/004-product-gl-config/convergence-rationale.md`: one dated
entry per task id, `**Finding.**` then `**Route taken.**` then `**Reason it is
closed without an edit.**`, naming the governing skill and the constitution
article inline. **The next sweep should compare `RESOLUTIONS.md`'s rate against
that file's, and if the instructed artifact is still unwritten while the
uninstructed one is maintained, the defect is in where the skill put the record.**
No edit is made on that today: one sweep is not evidence about a rule one day old.

*Follow-up, 2026-09-24 (Sweep 2) — the comparison this paragraph asked for.*
`RESOLUTIONS.md` has an entry for all sixteen stops of 2026-09-22..24, in five feature
directories across two repositories, the first at 2026-09-22 08:45Z, and no
`HANDOFF.md` has been overwritten with a resolution since this sweep.
`convergence-rationale.md` exists in one feature directory, `product-catalog` 004,
touched by 22 commits on 2026-09-20..21 while forced tasks were told to write it, and
in no feature since that route was removed. **So the instructed artifact is now the
maintained one, the condition set here for moving the record is not met, and nothing
moves.** The four stops of 2026-09-22 before the first entry, all on
`reference-data` 001, deleted `HANDOFF.md` in the resolution commit instead.

### An observation the harvest has not decided

Of the 14 recurring finding-location groups, **most are `plan.md — named gap n`**:
the forced rounds are forcing tasks against gaps the plan itself declared. Under
floor `NONE` a declared gap grades above the floor, gets forced, and comes back,
because a declared gap is not closable by code in the repository. That is a
candidate for step **d** below — a directive, a constitution article, a template
gate or nothing — and **this page does not decide it.** It is the loudest thing in
the recurrence block and it wants its own pass. *(Decided 2026-09-24 in Sweep 2, d:
nothing — the recurrence predates the 2026-09-20 changes and has not come back.)*

---

## Sweep 2 — 2026-09-24

**Stamp.** 21 journals, runs `wf_9e8bb81f-135` (started 2026-09-22 03:21Z, after
Sweep 1's last run ended at 03:12Z) through `wf_a3a80582-d7a` (2026-09-24 07:25Z).
Repos `netos/netcore-platform/reference-data` (15 runs) and
`netos/netcore-platform/customer-party-adapter` (6; its first run is 2026-09-23, so
reading it since 2026-09-17 adds nothing earlier); `product-catalog` had no run in
the window. One machine, linux 7.1.5 x86_64, Node v26.5.1, one operator; Claude Code
CLI 2.1.278 to 2.1.281, read from each run's session log, since a journal records no
version. **No control arm and no repeat**, so the markers rule is Sweep 1's. Re-run
with `npm run runs -- --since 2026-09-22 --until 2026-09-24`. **That window is a
superset of this stamp by exactly four runs** — `wf_e5ab8e1a-c53`,
`wf_bc7b0f7c-ce6`, `wf_9ecfdaff-a93`, `wf_fbb2141f-8bf`, Sweep 1's last four — because
`--since` compares the day and cannot start mid-day: the verbatim blocks below
include them, and the two derived lines after them do not. The per-stop pass was run
over 2026-09-17..24, **once, as a backfill**: Sweep 1 had no per-stop decision, so
this section decides every stop on record, all 35, and the next sweep decides only
its own.

### Per-run record, corpus and per-feature lines (verbatim, 25 runs)

```
=== Per-run record — 25 run(s), 2026-09-22..2026-09-24 ===

Mechanisms: fc=forced convergence round, wr=wall repair, rc=reconcile after a
failed forced append, ao=assess-only round, sr=stall retry. A second implement
pass over unchecked task ids has no label of its own and is not counted.

2026-09-22 wf_e5ab8e1a-c53   reference-data   001-company-registry   needs-human@analyze
    from=review-plan until=- rounds:analyze=4 floor=- handoff=written+pushed | fc=0 wr=0 rc=0 ao=0 sr=0 | agents=10 >=1,033,408 over 10/10 agents 32m tools=207
    stagesRun: tasks -> analyze
    why: CRITICAL or HIGH analysis findings remain after 3 remediation rounds and 4 analyses: the loop ran a remediation agent over every finding of every roun...

2026-09-22 wf_bc7b0f7c-ce6   reference-data   001-company-registry   needs-human@analyze
    from=review-plan until=- rounds:analyze=1 floor=- handoff=written+pushed | fc=0 wr=0 rc=0 ao=0 sr=0 | agents=5 >=385,101 over 5/5 agents 9m tools=76
    stagesRun: tasks -> analyze
    why: an analysis finding can only be resolved by changing specs/001-company-registry/spec.md, and no stage of this run edits the spec: it is the feature au...

2026-09-22 wf_9ecfdaff-a93   reference-data   001-company-registry   needs-human@review-plan
    from=plan until=- rounds:reviewPlan=4 floor=- handoff=written+pushed | fc=0 wr=0 rc=0 ao=0 sr=1 | agents=10 >=949,661 over 6/10 agents 39m tools=171
    stagesRun: plan
    ! [stall] agent "review-plan 2 (fable low)" stalled (no progress) after 329s — retrying (1/5)
    why: blocking or major findings remain after 3 fix rounds and 4 fresh-context refutation reviews: the loop applied every finding of every round and the rev...

2026-09-22 wf_fbb2141f-8bf   reference-data   001-company-registry   needs-human@analyze
    from=review-plan until=- rounds:analyze=3 floor=- handoff=written+pushed | fc=0 wr=0 rc=0 ao=0 sr=1 | agents=9 >=938,036 over 9/9 agents 30m tools=174
    stagesRun: tasks -> analyze
    ! [stall] agent "analyze 3 (opus medium)" stalled (no progress) after 197s — retrying (1/5)
    why: an analysis finding can only be resolved by changing specs/001-company-registry/spec.md, and no stage of this run edits the spec: it is the feature au...

2026-09-22 wf_9e8bb81f-135   reference-data   001-company-registry   done (round-cap)
    from=plan until=- rounds:reviewPlan=4,analyze=2,converge=6 floor=NONE handoff=- | fc=1 wr=1 rc=0 ao=1 sr=2 | agents=44 >=5,690,836 over 44/44 agents 256m tools=1458
    stagesRun: plan -> tasks -> analyze -> implement -> converge -> finish
    ! phase 2 Foundational (schema swap, access tier, pure tree rules): wall RED, 1 unchecked
    ! converge round cap 6 reached (floor NONE, no finding is tolerated): the assess-only round after the last implemented phase graded 1 open finding(s) (0
    ! [stall] agent "fix-plan 2 (opus medium)" stalled (no progress) after 302s — retrying (1/5)
    ! [stall] agent "review-plan 3 (fable low)" stalled (no progress) after 385s — retrying (1/5)

2026-09-22 wf_5a7bda4e-bf4   reference-data   002-branch-registry    needs-human@preflight
    from=- until=- rounds:none floor=- handoff=written+pushed | fc=0 wr=0 rc=0 ao=0 sr=0 | agents=2 >=82,034 over 2/2 agents 1m tools=12
    stagesRun: preflight
    why: no definition-of-done command: pass args.wall

2026-09-22 wf_115f053c-900   reference-data   002-branch-registry    needs-human@review-plan
    from=preflight until=- rounds:reviewPlan=1 floor=- handoff=written+pushed | fc=0 wr=0 rc=0 ao=0 sr=0 | agents=5 >=703,050 over 5/5 agents 26m tools=132
    stagesRun: preflight -> plan
    why: a review finding of the plan can only be resolved by changing specs/002-branch-registry/spec.md, and no stage of this run edits the spec: it is the fe...

2026-09-22 wf_9b933e37-557   reference-data   002-branch-registry    needs-human@converge
    from=plan until=- rounds:reviewPlan=2,analyze=2,converge=3 floor=- handoff=written+pushed | fc=1 wr=0 rc=0 ao=0 sr=0 | agents=27 >=3,355,733 over 27/27 agents 152m tools=883
    stagesRun: plan -> tasks -> analyze -> implement -> converge
    why: converge reported converged while still grading 1 finding(s) the floor NONE does not tolerate, and 1 of them survived a forced convergence round: the ...

2026-09-22 wf_56a7b40b-9e7   reference-data   002-branch-registry    done (converged)
    from=converge until=- rounds:converge=1 floor=NONE handoff=- | fc=0 wr=0 rc=0 ao=0 sr=0 | agents=3 >=193,350 over 3/3 agents 5m tools=45
    stagesRun: converge -> finish

2026-09-22 wf_5fff4cb2-344   reference-data   003-constant-registry  needs-human@preflight
    from=- until=- rounds:none floor=- handoff=written+pushed | fc=0 wr=0 rc=0 ao=0 sr=0 | agents=2 >=98,827 over 2/2 agents 1m tools=15
    stagesRun: preflight
    why: no definition-of-done command: pass args.wall

2026-09-22 wf_510277de-2c6   reference-data   003-constant-registry  needs-human@review-plan
    from=preflight until=- rounds:reviewPlan=4 floor=- handoff=written+pushed | fc=0 wr=0 rc=0 ao=0 sr=0 | agents=10 >=1,361,339 over 10/10 agents 41m tools=212
    stagesRun: preflight -> plan
    why: blocking or major findings remain after 3 fix rounds and 4 fresh-context refutation reviews: the loop applied every finding of every round and the rev...

2026-09-22 wf_e4e27b83-bc3   reference-data   003-constant-registry  needs-human@analyze
    from=review-plan until=- rounds:analyze=2 floor=- handoff=written+pushed | fc=0 wr=0 rc=0 ao=0 sr=0 | agents=7 >=692,875 over 7/7 agents 22m tools=117
    stagesRun: tasks -> analyze
    why: an analysis finding can only be resolved by changing specs/003-constant-registry/spec.md, and no stage of this run edits the spec: it is the feature a...

2026-09-22 wf_6e72f3dd-930   reference-data   003-constant-registry  needs-human@analyze
    from=plan until=- rounds:reviewPlan=4,analyze=2 floor=- handoff=written+pushed | fc=0 wr=0 rc=0 ao=0 sr=0 | agents=16 >=1,140,516 over 10/16 agents 37m tools=202
    stagesRun: plan -> tasks -> analyze
    why: an analysis finding can only be resolved by changing specs/003-constant-registry/spec.md, and no stage of this run edits the spec: it is the feature a...

2026-09-23 wf_11cbb069-ff1   reference-data   003-constant-registry  needs-human@review-plan
    from=plan until=- rounds:reviewPlan=4 floor=- handoff=written+pushed | fc=0 wr=0 rc=0 ao=0 sr=0 | agents=10 >=1,472,545 over 10/10 agents 47m tools=253
    stagesRun: plan
    why: blocking or major findings remain after 3 fix rounds and 4 fresh-context refutation reviews: the loop applied every finding of every round and the rev...

2026-09-23 wf_a6f3b709-43a   reference-data   003-constant-registry  needs-human@analyze
    from=review-plan until=- rounds:analyze=2 floor=- handoff=written+pushed | fc=0 wr=0 rc=0 ao=0 sr=0 | agents=7 >=755,739 over 7/7 agents 14m tools=78
    stagesRun: tasks -> analyze
    why: an analysis finding can only be resolved by changing specs/003-constant-registry/spec.md, and no stage of this run edits the spec: it is the feature a...

2026-09-23 wf_1a182959-589   customer-party-adapter 001-party-registry     needs-human@preflight
    from=- until=- rounds:none floor=- handoff=written+pushed | fc=0 wr=0 rc=0 ao=0 sr=0 | agents=2 >=75,685 over 2/2 agents 1m tools=7
    stagesRun: preflight
    why: no definition-of-done command: pass args.wall

2026-09-23 wf_85172f44-a39   reference-data   003-constant-registry  needs-human@review-plan
    from=plan until=- rounds:reviewPlan=4 floor=- handoff=written+pushed | fc=0 wr=0 rc=0 ao=0 sr=0 | agents=10 >=1,558,263 over 10/10 agents 49m tools=268
    stagesRun: plan
    why: blocking or major findings remain after 3 fix rounds and 4 fresh-context refutation reviews: the loop applied every finding of every round and the rev...

2026-09-23 wf_e68e4e48-4ed   customer-party-adapter 001-party-registry     needs-human@review-plan
    from=- until=- rounds:reviewPlan=1 floor=- handoff=written+pushed | fc=0 wr=0 rc=0 ao=0 sr=0 | agents=5 >=612,633 over 5/5 agents 22m tools=86
    stagesRun: preflight -> plan
    why: a review finding of the plan can only be resolved by changing specs/001-party-registry/spec.md, and no stage of this run edits the spec: it is the fea...

2026-09-23 wf_0fac1571-831   customer-party-adapter 001-party-registry     harness:killed
    from=plan until=- rounds:(no result) floor=- handoff=- | fc=0 wr=0 rc=0 ao=0 sr=0 | agents=2 >=143,308 over 2/2 agents 2m tools=21

2026-09-23 wf_c3abfa9f-b08   customer-party-adapter 001-party-registry     needs-human@review-plan
    from=plan until=- rounds:reviewPlan=4 floor=- handoff=written+pushed | fc=0 wr=0 rc=0 ao=0 sr=0 | agents=10 >=1,244,486 over 10/10 agents 38m tools=190
    stagesRun: plan
    why: blocking or major findings remain after 3 fix rounds and 4 fresh-context refutation reviews: the loop applied every finding of every round and the rev...

2026-09-23 wf_cc5b26f9-e4b   reference-data   003-constant-registry  needs-human@implement
    from=review-plan until=- rounds:analyze=4 floor=- handoff=written+pushed | fc=0 wr=0 rc=0 ao=0 sr=0 | agents=20 >=2,960,547 over 20/20 agents 112m tools=565
    stagesRun: tasks -> analyze -> implement
    why: tasks of phase 8 (Polish & Cross-Cutting Concerns) stay unchecked after two implement passes over them, both with the wall green: the loop ran the pha...

2026-09-23 wf_fb809526-d13   customer-party-adapter 001-party-registry     done (converged)
    from=review-plan until=- rounds:analyze=1,converge=1 floor=NONE handoff=- | fc=0 wr=0 rc=0 ao=0 sr=0 | agents=15 >=1,589,030 over 15/15 agents 55m tools=314
    stagesRun: tasks -> analyze -> implement -> converge -> finish

2026-09-23 wf_e4af9888-80a   reference-data   003-constant-registry  done (converged)
    from=implement until=- rounds:converge=5 floor=NONE handoff=- | fc=1 wr=0 rc=0 ao=0 sr=0 | agents=18 >=1,124,701 over 18/18 agents 31m tools=191
    stagesRun: implement -> converge -> finish

2026-09-24 wf_88315727-5cb   reference-data   004-calendar-registry  needs-human@preflight
    from=- until=- rounds:none floor=- handoff=written+pushed | fc=0 wr=0 rc=0 ao=0 sr=0 | agents=2 >=76,376 over 2/2 agents 1m tools=7
    stagesRun: preflight
    why: no definition-of-done command: pass args.wall

2026-09-24 wf_a3a80582-d7a   customer-party-adapter 002-party-amendment    needs-human@preflight
    from=- until=- rounds:none floor=- handoff=written+pushed | fc=0 wr=0 rc=0 ao=0 sr=0 | agents=2 >=76,555 over 2/2 agents 1m tools=7
    stagesRun: preflight
    why: no definition-of-done command: pass args.wall

Corpus: 25 runs, 2026-09-22..2026-09-24, >=28,314,634 over 243/253 agents, 17.0h, 253 agents.
Exits: done=4, harness:killed=1, needs-human@analyze=6, needs-human@converge=1, needs-human@implement=1, needs-human@preflight=5, needs-human@review-plan=7
Mechanisms across the corpus: forced=3, wallRepair=1, reconcile=0, assessOnly=1, stallRetry=4
Agent label annotations: "after usage limit"=1

Per feature:
  customer-party-adapter/specs/001-party-registry      runs= 5 tok=3.67M implement-agents= 9
  customer-party-adapter/specs/002-party-amendment     runs= 1 tok=0.08M implement-agents= 0  <- never reached implement
  reference-data/specs/001-company-registry            runs= 5 tok=9.00M implement-agents=14
  reference-data/specs/002-branch-registry             runs= 4 tok=4.33M implement-agents= 9
  reference-data/specs/003-constant-registry           runs= 9 tok=11.17M implement-agents=14
  reference-data/specs/004-calendar-registry           runs= 1 tok=0.08M implement-agents= 0  <- never reached implement

```

Derived from `--json` with the four Sweep 1 runs removed, not script output:
**Sweep 2 exact: 21 runs, >=25,008,428 over 213/219 agents, 15.2h. Exits: done=4,
harness:killed=1, needs-human@analyze=3, @converge=1, @implement=1, @preflight=5,
@review-plan=6. Mechanisms: forced=3, wallRepair=1, reconcile=0, assessOnly=1,
stallRetry=2.** Of the 21, the twelve from `wf_11cbb069-ff1` (2026-09-23 00:38Z) on
ran the Opus-only table of 2026-09-23 — **>=11,689,868 over 103/103 agents, 6.2h**
— and the nine before it the older table.

### Stage × tier (verbatim, 25 runs)

```
=== Stage x tier — tokens and wall-clock per agent ===

stage                           tier               n            tok(cov)   mean tok   mean s  retries
implement phase                 opus medium       45   6,382,116 (45/45)     141825      474  0
review-plan                     fable low         19   3,903,391 (16/19)     243962      529  2
analyze                         opus medium       23   3,400,049 (23/23)     147828      221  1
review-plan                     opus high         13   2,974,559 (13/13)     228812      472  0
converge                        opus medium       16   2,078,637 (16/16)     129915      183  0
fix-plan                        opus medium       24   1,854,603 (21/24)      88314      193  1
tasks                           opus medium       10   1,665,693 (10/10)     166569      352  0
remediate                       opus medium       18   1,493,737 (18/18)      82985      174  0
plan                            opus high          5       800,367 (5/5)     160073      376  0
plan                            fable low          6       701,225 (4/6)     175306      436  0
handoff                         sonnet low        11     459,110 (11/11)      41737       28  0
handoff                         opus low           9       359,580 (9/9)      39953       27  0
preflight (discovery and sync)  opus low           8       292,876 (8/8)      36610        9  0
phases after converge           sonnet low         6       287,239 (6/6)      47873       19  0
preflight (discovery and sync)  sonnet low         9       274,533 (7/9)      39219       22  0
preflight                       sonnet low         4       182,259 (4/4)      45565       24  0
fix-plan minors                 opus medium        3       176,774 (3/3)      58925      105  0
preflight                       opus low           4       151,637 (4/4)      37909       14  0
force-append converge           opus medium        3       113,891 (3/3)      37964       21  0
converge (assess only)          opus medium        1       107,364 (1/1)     107364      233  0
phases after converge           opus low           3       105,961 (3/3)      35320       13  0
phases                          opus low           3       104,530 (3/3)      34843       12  0
phases                          sonnet low         2        97,599 (2/2)      48800       15  0
finish                          sonnet low         2        88,632 (2/2)      44316       89  0
phases after forced append      sonnet low         2        78,419 (2/2)      39210       15  0
implement phase (wall repair)   opus medium        1        74,685 (1/1)      74685      249  0
finish                          opus low           2        70,280 (2/2)      35140       94  0
phases after forced append      opus low           1        34,888 (1/1)      34888       13  0

By tier alone:
  opus medium    n= 144  >=17,347,549 over 141/144 agents             mean=123032  mean_s=290
  fable low      n=  25  >=4,604,616 over 20/25 agents                mean=230231  mean_s=510
  opus high      n=  18  >=3,774,926 over 18/18 agents                mean=209718  mean_s=449
  sonnet low     n=  36  >=1,467,791 over 34/36 agents                mean=43170  mean_s=27
  opus low       n=  30  >=1,119,752 over 30/30 agents                mean=37325  mean_s=22

```

Per-stop summary lines, verbatim: over the window, `Stops: 20; with a handoff commit
in git: 20; none found, so journal-only here: 0; next run stopped at the same stage:
2.` Over the backfill, 2026-09-17..24: `Stops: 35; with a handoff commit in git: 27;
none found, so journal-only here: 8; next run stopped at the same stage: 4.`

### b — status lines the mechanisms column contradicted

Edited, each with its run ids as ground: in `build-feature/SKILL.md`, the status line
(*six runs of the current shape, none reached implement* — twenty-nine have, five
reached implement and four returned `done`; *wall repairs taken by no run* —
`wf_9e8bb81f-135` took one and went green; *the resolution rule has no run behind it,
`RESOLUTIONS.md` never written* — written for all sixteen stops of the window) and the
tier-table sentence *no run has taken this table yet*; in `converge-feature/SKILL.md`,
the status line's wall-repair clause and its count of runs entered at `converge`, and
the cost sentence; in both `evidence.md` files, the summaries that said the same, each
given a dated note rather than rewritten, and a new foot entry in `build-feature`'s.
Sweep 1's own record below the verbatim blocks is left as written and carries dated
follow-ups.

### c — deferred questions

- **The Opus-only table's cost** (*plan and review-plan at Opus high are the rows to
  watch*): answered at *convention*, direction only. Review-plan at Opus high, 13
  agents, mean 228,812 tokens, 472 s; plan at Opus high, 5, mean 160,073, 376 s —
  against 241,039 and 175,306 for the same rows at Fable low over the window's nine
  older runs. High effort there did not repeat the Fable-high spend of 2026-09-17.
- **How often the session holds a recommendation with high confidence**: answered
  from the `RESOLUTIONS.md` files, read 2026-09-24. Sixteen stops, forty-one items
  applied by the session, eight taken to a person, and the person took the session's
  recommendation on all eight — on one of them after first questioning why it had been
  escalated, and on another later correcting a fact only the owner held (the register
  number has no control digit at all). *Convention*: one operator, and the count is a
  reading of prose.
- **Whether a fourth review round closes a capped review** (Sweep 1, item 3): **still
  untaken, though it looked taken.** Sessions applied the fourth review's findings on
  seven review-plan stops and restarted `from: "review-plan"`; that start ran no review
  (d, below), so no fifth review ever read what was applied.
- **`RESOLUTIONS.md` against `convergence-rationale.md`** (F4): answered below F4.
- **Whether a floor of `NONE` ever ends `converged`**: yes, three times —
  `wf_56a7b40b-9e7`, `wf_fb809526-d13`, `wf_e4af9888-80a`, 2026-09-22..23 — against
  five round caps.
- **Still open**: the reconcile behind a failed forced append (never run); the two of
  Sweep 1's seventeen forced dispatches that produced no implemented phase.

### d — every stop, the earliest stage that held what it needed, and one target

The earliest stage is the first whose inputs already held what the stop needed;
*clarify* means the spec text before the run started. Targets: **W** a `build-feature`
stage prompt or script line in `workflow.mjs`; **S** a question the spec should have
answered at specify or clarify; **N** nothing, with the reason. No stop's target was a
consumer constitution article, a `java-backend-template` gate or scaffold, or a
directive in another skill here, so the template was not opened. The eight stops
before 2026-09-18 have no handoff and are decided from the journal's `why` and
`detail` alone; their resolution is unknown except where `build-feature/evidence.md`
records it.

| Run | Stage | Cause | Earliest stage | Target | Applied / owed |
|---|---|---|---|---|---|
| `wf_cc1aa65d-148` | review-spec | cap at 2 fix rounds; last blocker a constitution decision (journal only) | specify | N — the review-spec stage was removed 2026-09-21 | — |
| `wf_e460bffc-289` | review-spec | cap at 2 fix rounds (journal only) | specify | N — stage removed 2026-09-21 | — |
| `wf_3fdb046a-9c1` | review-spec | cap at 2 fix rounds (journal only) | specify | N — stage removed 2026-09-21 | — |
| `wf_543886c7-762` | review-plan | cap at 2 fix rounds (journal only) | plan | W — review and analyze stop rule | owed (cap 2 → 3 on 2026-09-18 did not close it) |
| `wf_9cb9df52-800` | analyze | cap at 2 remediation rounds (journal only) | plan | W — stop rule | owed |
| `wf_6f8b537e-02f` | finish | red wall on a green branch: `state.wall` null on a start after preflight | preflight | W — `args.wall` required after preflight | applied 2026-09-17 |
| `wf_09a20441-453` | converge | `converged` while grading findings, floor `NONE` (journal only) | converge | W — forced convergence round | applied 2026-09-18 |
| `wf_7e4e8726-4b5` | converge | same (journal only) | converge | W — forced round | applied 2026-09-18 |
| `wf_1cb83fc5-585` | converge | same; four LOW mechanical findings, fixed by hand (`45b901e`…`6b8eade`) | converge | W — forced round | applied 2026-09-18 |
| `wf_c6d86c1f-736` | review-spec | cap at 3 fix rounds, 12 items; spec fixed by hand (`ef67016`) | specify | N — stage removed 2026-09-21 | — |
| `wf_327e7ce1-c3a` | review-plan | cap, 9 items; applied by hand, restarted at tasks (`6453228`) | plan | W — stop rule | owed |
| `wf_48e731fc-fb3` | preflight | preflight returned the wall; the script dropped it (`c4b9a16`) | preflight | W — `state.wall` restored | **applied 2026-09-24** |
| `wf_e6f0fb71-2ab` | review-plan | cap, 1 major + 4 minor; restarted at review-plan with nothing applied | plan | W — stop rule | owed |
| `wf_de4bfd27-d8a` | analyze | spec: code-length bound left "to be confirmed before plan"; three FRs stating one rule | clarify | S | owed — spec readiness |
| `wf_c65ab41b-8a6` | review-plan | cap: a lock protocol the review refuted three rounds running; owner replaced it with one write lock (`256abda`) | plan | N — a survivor that needed the owner's design decision; the stop was correct | — |
| `wf_e5ab8e1a-c53` | analyze | cap, 12 items; HIGH on the plan's declared narrowing of FR-024; owner chose to close it (`20b8d50`) | plan | N — a survivor that needed the owner's scope decision; the stop was correct | — |
| `wf_bc7b0f7c-ce6` | analyze | spec: FR-013 search semantics unstated; a code-length decision missing from the clarification log | clarify | S | owed — spec readiness |
| `wf_9ecfdaff-a93` | review-plan | cap, 1 blocking + 5 minor; applied (`d7d558e`) | plan | W — stop rule | owed |
| `wf_fbb2141f-8bf` | analyze | spec: SC-004 without measurement conditions; FR-009 against FR-011 | clarify | S | owed — spec readiness |
| `wf_5a7bda4e-bf4` | preflight | wall dropped by the script | preflight | W — `state.wall` restored | **applied 2026-09-24** |
| `wf_115f053c-900` | review-plan | spec: a reversed clarify answer left four refusals contradicting FR-008 | clarify | S | owed — spec readiness |
| `wf_9b933e37-557` | converge | forced finding survived: `.distinct()` removed at two of three sites | implement (forced phase) | N — the survivor exit worked as written and the session closed it in one line; once, so no prompt change | — |
| `wf_5fff4cb2-344` | preflight | wall dropped by the script | preflight | W — `state.wall` restored | **applied 2026-09-24** |
| `wf_510277de-2c6` | review-plan | cap, 1 major + 4 minor, all new in round 4; applied (`71e771c`) | plan | W — stop rule | owed |
| `wf_e4e27b83-bc3` | analyze | spec: reactivation against status-independent uniqueness; paging bound under edits | clarify | S | owed — spec readiness |
| `wf_6e72f3dd-930` | analyze | spec: open upper bound, SC-004 scale, blank search, SC-001 measurability | clarify | S | owed — spec readiness |
| `wf_11cbb069-ff1` | review-plan | cap, 1 major + 6 minor; applied (`d8f8dcb`) | plan | W — stop rule | owed |
| `wf_a6f3b709-43a` | analyze | spec: a scenario left behind by the session's own clarification; 003/SC-009 against 005/FR-006 (to the owner) | clarify | S | owed — spec readiness |
| `wf_1a182959-589` | preflight | wall dropped by the script | preflight | W — `state.wall` restored | **applied 2026-09-24** |
| `wf_85172f44-a39` | review-plan | cap, 1 major + 7 minor; applied (`b5ef15a`) | plan | W — stop rule | owed |
| `wf_e68e4e48-4ed` | review-plan | spec: a control digit assumed and left "confirmed at plan stage"; the owner: there is none | specify | S | owed — spec readiness |
| `wf_c3abfa9f-b08` | review-plan | cap: round-4 blocking was a spec scenario contradicting FR-008/009, beside two majors; applied (`f0e49a3`, `b7fdcf3`) | plan | W — stop rule | owed |
| `wf_cc5b26f9-e4b` | implement | T104, added by an analysis remediation, waits on the owner's clarify session | analyze (remediation) | W — `NO_TASK_WAITS_ON_A_PERSON` | **applied 2026-09-24** |
| `wf_88315727-5cb` | preflight | wall dropped by the script | preflight | W — `state.wall` restored | **applied 2026-09-24** |
| `wf_a3a80582-d7a` | preflight | wall dropped by the script | preflight | W — `state.wall` restored | **applied 2026-09-24** |

**Tally by target**, read off the table: W 20 — seven applied by this sweep, four
applied before it, nine owed on one row; S 8, owed on one row; N 7. Priority is by
recurrence, and it put the three groups in this order.

**1. Preflight dropped the definition of done — six stops, six features,
`CROSS-FEATURE`, the first run of every feature since 2026-09-21.** Each preflight
agent returned `wall: "node backend/scripts/wall.mjs"`, read from `CLAUDE.md` as its
prompt says, and the script never stored it: `state.wall = p.wall || state.wall` went
out in `c4b9a16` with the block around it. Every resolution was to pass the value the
agent had found. Restored, with `args.wall` winning where given. **Two findings ride
on the fix.** `from: "review-plan"` ran no review: the loop sat inside the plan
stage's guard, so every review-plan stop restarted as its handoff says — seven,
2026-09-21..23 — reached tasks with nothing reviewing what was applied after the
fourth review, which is the property the resolution rule's restart exists for. Split,
applied. And the handoff's journal line fails to name its own run's journal on 25 of
27 handoffs — 23 name an earlier run's, the two first runs in a project found none —
because it takes the newest journal on disk; owed.

**2. The review and analyze loops end at a cap on findings that are not survivors —
nine stops owed, eleven on record, five features, three repositories,
`CROSS-FEATURE`.** Every fix round the journals show applied between four and fifteen
findings, and the loop has no fixed point. Of the eleven, two were survivors a person had to decide
(`wf_c65ab41b-8a6`, `wf_e5ab8e1a-c53`, both **N**) and the stop was right; the other
nine were resolved by applying the last round's findings unchanged, or once by
applying nothing, and the four of them with a `RESOLUTIONS.md` entry sent no item to a
person. The target is the stop
rule in `workflow.mjs` — stop on a survivor, apply a last round of new-only findings
and go on, with the re-review it would need — and it is **the owner's decision**, not a
change made here, because the 2026-09-18 audit put *apply the findings and move on* in
his hands. Owed on `BACKLOG.md`.

**3. The spec already held the question — eight stops, four features, two
repositories.** Every analyze or review-plan stop whose only remedy was a spec change:
a bound or fact the spec itself deferred ("to be confirmed before plan", "confirmed at
plan stage"), a criterion with no measurement conditions, search semantics left
unstated, residue of a reversed clarify answer, two requirements that disagree. The
earliest stage is clarify. Each was resolved within a day; where a `RESOLUTIONS.md`
records it, the session applied the change itself, except two items that went to the
owner, who took the session's recommendation on both. What
made them expensive was the restart: after a spec edit the skill says `from: "plan"`,
the plan is regenerated whole, and on five of eight such restarts the new plan hit a
fresh review-plan cap — on 003 with findings that, in the session's own words, repeat
nothing earlier *because the plan was regenerated* — which is the engine of F3's fixed
point.
Two rows owed: a spec-readiness pass the author runs before sign-off, and the restart
point after the session's own spec edit.

**Also applied, one stop:** `wf_cc5b26f9-e4b` — an analysis remediation wrote T104,
*close only once the owner has run a clarify session on the plan's readings*, and the
run stopped at implement after eight wall-green phases on a task no agent could close;
the owner then confirmed every reading unchanged. The tasks and remediate prompts now
carry `NO_TASK_WAITS_ON_A_PERSON`, and `build-feature/SKILL.md` states the rule with
its check.

**Sweep 1's open observation, decided: nothing.** The fourteen recurring
`plan.md — named gap n` locations are all from the four runs of 2026-09-20 on
`product-catalog` 004, before the same day's two changes — the forced task lost its
written-reason route, and each round after a forced one returns `repeatOf` — and the
window's recurrence block has no finding location spanning two runs. The forced round
still takes plan-declared gaps: `wf_9e8bb81f-135` forced seven, and `wf_e4af9888-80a`
built 003/FR-034, which the owner's clarification had deferred to the first money
feature; the owner kept it. That is what the owner's rule of 2026-09-20 (*a floor of
`NONE` means a LOW finding is fixed*) says should happen, so no directive changes. The
one question it leaves — whether a deferral the owner recorded in the spec's own
clarifications exempts a gap from forcing — is his, and is on `BACKLOG.md` with the
cap rule.

### e — repeats

Neither `REPEAT` group is a resolution that did not take, and nothing went to a person
on the one-attempt ground. `wf_bc7b0f7c-ce6` and `wf_fbb2141f-8bf` share an exit reason
and no item: FR-013 and the code-length log against SC-004's conditions and FR-009.
The 2026-09-17 group on `product-catalog` 003 has no handoffs; the operator resolved
each with one more fix round (`build-feature/evidence.md`, 2026-09-17). Of the four
`REPEAT-STAGE` stops, two have no handoff (`wf_cc1aa65d-148`, `wf_7e4e8726-4b5`), so
whether an item came back is unknown. `wf_e4e27b83-bc3` → `wf_6e72f3dd-930`: no item
repeats, which the session's own `RESOLUTIONS.md` also states. `wf_e5ab8e1a-c53` →
`wf_bc7b0f7c-ce6`: FR-013 was item 5 of the first handoff at MEDIUM, the resolution
commit `20b8d50` did not address it, and it was the second stop's cause — an item left
open in the first window, not one whose resolution failed; `44f88af` closed it and it
did not return.

### f — what this sweep did not reach

- **No run has taken any of the three `workflow.mjs` changes.** The wall line
  and the review-plan gating were driven against a stub of the Workflow sandbox — four
  cases, reproducing both defects on the committed script and passing on the
  corrected one; the prompt change was checked by `grep` only.
- **Whether the sessions' resolutions were right.** They were read, not checked
  against the code. In particular, the seven review-plan resolutions that reached
  tasks unreviewed were not traced forward to see whether analyze or the wall caught
  anything they introduced.
- **The review-plan cap items were read by title and severity, not in full**, except
  where a `RESOLUTIONS.md` entry quotes them; the spec-change stops were read in full.
- **The eight journal-only stops** — decided from `why` alone, their resolution
  unknown except where the evidence file records it.
- **The two harness kills** (`wf_cd9e971a-f52`, `wf_0fac1571-831`; the second was
  stopped by the operator, per its feature's `RESOLUTIONS.md`), the four stall retries
  and the one *after usage limit* label were not examined.
- **The two of Sweep 1's seventeen forced dispatches with no implemented phase** —
  still unexplained, still owed.
- **Whether a MEDIUM or LOW spec finding should stop a run at all.** Several stops in
  group 3 carried one; whether the loop may carry such a finding to the author on a
  `done` return instead is the owner's floor question in another place, and it is on
  the spec-readiness row rather than decided here.
- **Nothing from gaps 1, 2, 6, 7 and 9** — money, skill attribution, the invoking
  skill, wall attempts inside an agent, and why a resolution was chosen outside a
  `RESOLUTIONS.md`.
- **`../java-backend-template` was not opened** — no stop's target landed there.
- **The phase-two `GATES.md` reader** is still unbuilt.

**Decided and applied later on 2026-09-24.** The owner took four of the owed rows and
`build-feature` applied them the same day, stub-tested and unrun: the review and
analyze loops stop on a survivor, not at the cap (group 2); the restart after a spec
edit is `from: "review-plan"` (group 3's second row); a deferral written into
`spec.md` exempts a converge finding from forcing (the open question under Sweep 1's
observation, `wf_e4af9888-80a`); and the handoff names no journal path, since a script
has no handle on its own run id (group 1's third finding). Their rows left
`BACKLOG.md`; spec readiness stays there. Record: `build-feature/evidence.md`, the
2026-09-24 evening entry.

---

## The harvest procedure

Run by an agent, per sweep, not per run. `npm run runs` is one command; steps b,
c, e and f are reading skill text against a table, which is bounded reasoning —
tier `analyst`. Step d reads each stop's handoff and resolution commits out of the
service repository and decides where the stop should have been prevented, which is
a rule decision — tier `principal`.

**Not a skill**, deliberately: a skill costs frontmatter in every session of every
consumer for a job done once a sweep, which is the bad trade `CLAUDE.md` names —
*a skill that adds three hundred tokens to every session and fires on a decision
made twice a year*. **Not a checklist in `CLAUDE.md`** either: that file is loaded
every session and carries only what is needed every session. A section on this
page costs nothing until somebody opens it.

- **a.** `npm run runs -- --since <last sweep's date> --until <today>`, and record
  both dates in the stamp beside the run-id range, which is the only exact bound
  when either day holds runs from outside the sweep. Paste the per-run block, the
  corpus line, the stage × tier table and the per-stop block's summary line into
  a new sweep section, verbatim.
- **b.** **Re-read every status line, and every *unmeasured* / *unrun* / *no run
  has taken* / *no measured cost* sentence, in `build-feature/SKILL.md`,
  `converge-feature/SKILL.md` and both `evidence.md` files against the mechanisms
  column. Any claim the column contradicts is edited, with the run ids as its
  ground.** First, because it is the step that found something on the first pass.
- **c.** Every question the skills defer to a future run — *the next run's
  measurement*, *unmeasured*, *has not taken* — checked against the stage × tier
  table, and either answered with its stamp and its marker, or restated as still
  open. An uncontrolled comparison answers at *convention* and says so.
- **d.** **Every `needs-human` stop in the window**, read from the per-stop
  block: the handoff in full (its `read:` command) and each resolution commit
  (`git -C <repo> show <sha>`), with `RESOLUTIONS.md` where the window has one.
  Per stop, name **the earliest stage whose inputs already held what was
  needed** to avoid the stop, and decide **exactly one** prevention target:
  a question the spec should have answered at `specify` or `clarify`; an article
  in the consumer constitution; a gate or scaffold change in
  `java-backend-template`; a directive in an existing skill here; a
  `build-feature` stage prompt in `workflow.mjs`; or nothing, with the reason —
  irreducible where the stop needed a business value nothing in the repository
  states, or somebody else's uncommitted work or merge conflict. A stop the
  block reports with no handoff is decided from the journal's `result.why` and
  `result.detail` alone, and the sweep says its resolution is unknown.
  **Cross-feature recurrence sets priority, not eligibility**: a stop that
  happened once, or recurs within one feature, gets a decision like any other,
  and a `CROSS-FEATURE` group is decided first. The decisions go into the sweep
  section as one row per stop — run id, stage, earliest stage, target, applied
  or owed. A target decided and not applied is recorded as owed on
  `BACKLOG.md`.
- **e.** Each `REPEAT` group, and each stop flagged `REPEAT-STAGE` whose
  resolution window holds a commit, is a resolution that did not take, so it
  goes to the person under the skill's own one-attempt rule — and this page
  records that it did. `REPEAT-STAGE` is a stage-level flag: whether the *item*
  came back is read by comparing the two handoffs. A `REPEAT-STAGE` stop whose
  window is empty is a restart with nothing changed, not a failed resolution.
- **f.** Write what the sweep did **not** reach. Non-negotiable: the gaps listed
  below are most of any sweep's surface, and a sweep that lists no gaps has
  stopped reading rather than run out of them.

**Markers.** Nothing from this page ships above *primary-source verified*, and
most ships *convention*: one machine, one operator, no control arm, no repeat. A
number without its CLI version and its date is not comparable to any other,
exactly as `docs/history/firing-harness.md` in `dulguun0225/skills` records for firing rates.
Enforcement on the whole procedure is *convention* — no gate reaches it, and the
check is the sweep section being on this page to read.

(Check: each sweep section carries its stamp — date, CLI version, machine, repos
and run-id range — the verbatim script output, and a *did not reach* paragraph;
absence is visible on the page — *convention*, 2026-09-22.)

**Step d covers every stop since 2026-09-24, owner's decision.** Until then it
decided only on `CROSS-FEATURE` groups, so a stop that happened once, or recurred
within one feature — F3's eight runs on one feature among them — got no
prevention decision at all. The per-stop block in `runs.mjs` was written the same
day as its input; nothing in `workflow.mjs` or in the session's behaviour changed.
**Status: *decided, not yet validated*** — first used by Sweep 2, 2026-09-24, over
all 35 stops on record as a one-time backfill; it applied a target for seven stops
and left seventeen owed on two backlog rows, so the step has produced decisions and
none of them has yet been measured by a run. Enforcement *convention*: the check
is the per-stop decision table being in the sweep section.

---

## The gaps — what a journal and the handoff history do not hold

Verified by reading the files, 2026-09-22; the handoff-history entries and the
narrowing of the preview and join entries, 2026-09-24. Each is a thing a sweep
must not claim.

1. **No cost in money.** One undifferentiated token number per agent, with no
   input/output/cache split, so no price table could be applied even if one
   existed — and a price table is a silently-staling dependency in a repo whose
   gates are dependency-free by rule. **Cost here is tokens and wall-clock,
   never dollars.**
2. **No skill attribution.** `grep` for `Skill`, `money-java`, `primary-keys`,
   `business-numbering`, `java-backend-rules` and `measured-defaults` across all
   28 journals returns **nothing**. Which of the other skills reached an implement
   agent is **not observable from a journal at all** — see the phase-two note.
3. **Tokens null on 26 of 276 agents**, all `state: "done"`. Every total is a
   floor, printed with its coverage.
4. **Effort exists only inside the label string** (`analyze 1 (opus medium)`),
   not as a field, so the reader is coupled to `workflow.mjs`'s prose label
   format. A label it cannot parse is reported and counted under `(unparsed)`,
   never dropped, and the script exits 1 — a silently short table is worse than a
   failure.
5. **Prompt and result previews are capped at 401 characters.** A finding
   survives only where the script lifted it into `result.detail` or
   `result.converge.forced`; one a round graded and the script did not surface is
   unrecoverable. **A stop with a handoff has its reported findings in git as
   well**, durable past a cleared projects directory and readable on any clone;
   **a stop without one has them only in the journal.** The handoff renders
   `result.detail` and nothing more — on `wf_e5ab8e1a-c53`, 2026-09-24, twelve
   items in both — so it does not recover a finding the script did not lift.
6. **Which skill invoked the run is not recorded.** Every journal names
   `build-feature`'s script, so a `converge-feature` run is indistinguishable
   from `build-feature` with `from: "converge"`. `converge-feature`'s claim that
   no feature has been converged by invoking it **is not answerable from here**,
   and the skill now says so rather than guessing. Owner's decision, 2026-09-22:
   **no `invokedBy` change to `workflow.mjs`** — the row stays on `BACKLOG.md`.
7. **Wall attempts inside an implement agent are not recorded**, nor is a second
   implement pass over unchecked ids; neither has a label or a log line. Only the
   phase-level wall outcome is observable.
8. **One id joins a journal to a commit, and only one.** Since 2026-09-18 the
   journal's `result.handoff.commit` names the handoff commit's sha, and the
   report verifies it in git before using it. Every other commit — the
   resolution commits included — joins by feature directory plus time.
   `product-catalog` commits carry a `Claude-Session` trailer; the
   `reference-data` ones do not. **The join does not run the other way**: the
   handoff's own *Run journal* line fails to name its run's journal on 25 of 27
   handoffs (read 2026-09-24), so a person holding only the file cannot find the
   journal from it.
9. **Why a resolution was chosen is not in git.** A resolution commit's diff
   shows what changed, not what the confidence behind it rested on; only a
   `RESOLUTIONS.md` entry says that, where one was written.
10. **A stop with no handoff exists only in the journal's return value** — every
    stop before 2026-09-18, and, under the script as it stands, every stop
    before discovery or on the base branch, which commit nothing by design. A cleared projects directory erases
    it.
11. **A decision made in conversation and never committed is invisible.** Git
    holds what was committed; the journal holds what the run returned; a person's
    answer that changed nothing on disk, or changed it in a later commit outside
    the window, is in neither.
12. **The resolution window is bounded by time, not by intent.** It is every
    non-merge commit on the ref between the handoff and the next run's start.
    Where the feature branch is gone from the clone the report reads a ref that
    holds the handoff, usually the base branch, and a stop with no later run
    reads up to that ref's tip — both can pull unrelated work into the window.

---

## The two mechanisms that lost, and why

**A hook.** It addresses exactly one of the gaps listed above — skill attribution — and
loses on three grounds. It must be installed in every consumer repository, which
is the per-consumer-configuration growth law the owner banned for delivery
reappearing for observation. It observes only the next run, where reading
journals gave **28 runs retroactively on the first afternoon**. And it adds a
failure surface inside a 276-agent run in somebody's service repo. The owner's
frontmatter-or-hooks rule is about *delivery* and does not decide this; the rule
that does is that **observation must not require touching the observed system** —
both because the 28 banked runs exist only because nothing had to be installed,
and because a measurement that changes its subject before measuring it has
nothing to compare against.

**The workflow writing a run record into the feature directory.** It changes
`workflow.mjs`, the measured system, before the first measurement; it lands in the
consumer repository, so this repo could not sweep *across* repos, and the
cross-feature recurrence question needs one reader over both; and it would be
written by an LLM agent — the handoff row is Sonnet low — where a journal's
numbers are the harness's own. **And the measured reason: `RESOLUTIONS.md` is
instructed in prose and had been written 0 times in 8 stops at sweep 1,
2026-09-22.** A per-run record
instructed the same way inherits that rate. *(Follow-up, 2026-09-24: that measured
reason no longer holds — `RESOLUTIONS.md` was written for 16 of 16 stops in Sweep 2
(F4). The other grounds stand: the record would change the measured system, land in
the consumer repository, and be written by an agent where the journal's numbers are
the harness's.)*

---

## Phase two — `GATES.md`, and the skill nobody is watching

The journals cannot say whether `money` or `primary-keys` reached an implement
agent (gap 2). The service repos answer a weaker and more useful question
themselves: `backend/docs/GATES.md` — 79 KB in product-catalog, 28 KB in
reference-data — carries `## Wired` and `## Named gaps: directives with no gate
here`, cites this set's directive ids, and names the test hosting each. **A second
reader over those files gives per-directive coverage across consumer repos for
every skill here**, not just these two.

The finding that says it would pay, read off those files 2026-09-22:
**`business-numbering` appears in neither repo's `GATES.md` — not under `Wired`,
not under `Named gaps`** — while `money` (`M-1`, `M-3`, `M-4`, `M-7`, `M-24`;
`M-10`, `M-11`, `M-31`…`M-33`; `M-2` wired, with `M-6`, `M-8`, `M-23`,
`M-35`…`M-43`, `M-12`, `M-13`, `M-15`…`M-18` declared as gaps) and `primary-keys`
(`MigrationConventionsTest`, `IdsTest`, `BanListArchTest.noOrderByIdOutsidePager`
wired, two declared gaps) appear on both sides. **A `business-numbering` violation
in produced code fails no gate and shows in no gap list**, so it is invisible to
the wall and to any coverage reader that trusts the gap section. That asymmetry
is a row on `BACKLOG.md` and the reader is not built.

**What neither reader ever does:** decide whether the produced code obeys a
directive. That is the consumer repo's wall, which was green on the runs it ran
on. The coverage reader reports what is gated; the wall reports compliance; a
directive in neither section of `GATES.md` is reported by nobody, which is the
whole of the finding above.
