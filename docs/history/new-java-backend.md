# new-java-backend

*Moved 2026-09-27 from `docs/history/java-backend-template.md` in `dulguun0225/skills` at `2ab5dc4`, sections unchanged. The template's own record — why it exists, what it wires, its gates — stays there.*

## 2026-09-16, later: the scaffold is a script in the skill

The owner observed that instantiating the template is a fully deterministic process and asked whether the
scripts belong in the skill. The answer split on who executes a script. The template's `scripts/` —
`wall` and the four checks it runs, `init`, and the four under `project-root/scripts/` — are run by
CI or by the forge, and CI has no skill installed; a gate that lives only under `~/.claude/skills/` is a
gate the build cannot run, which is the *unwired gate is a rule described as enforced that is not* defect
`java-backend-rules` names. `init` also rewrites strings that only the template's own files contain, so
the write-once rule makes the template its owner. **What the skill was missing was the one script the agent
runs before a repo exists**, and that is what was added.

`skills/java-backend-rules/scripts/new-backend.mjs` (written as `new-backend.sh` first; see the next section) is the README's four-command sequence as one command:
project root with an empty commit, fetch the template, `git subtree add` it into `backend/` (or
`--standalone`), the template's own `init` script, codegen, `mvn verify`, one commit whose message records the
template sha and whether the wall was run. It stops before `gh repo create`, the ruleset, the skills install
and `specify init`, and prints them, because each has side effects outside the directory. The template is
pinned to a recorded commit (`7ea886b`, the vendoring refactor, at first writing) with `--ref` to override; `main` is what the
README fetched, and two projects scaffolded a week apart from `main` start from different templates.

**Writing it found a defect in the template's README.** Its vendored sequence runs `git subtree add`
directly after `git init -b main`, and `git subtree add` refuses a repository with no `HEAD`
(*working tree has modifications. Cannot add.*, which is not the real reason). Reproduced 2026-09-16; the
script makes an empty commit first and the template README now says so. *A claim to have verified is itself
a claim to check*: the template record above says every shell step was run locally, and it was — inside a
repository that already had commits.

Verified: both modes run against a local clone with `--skip-verify`, producing the expected tree, package
directory and three-commit history; the vendored mode was then run in full, codegen and `mvn verify`
included, green on Java 25 / Maven 3.9.16 with Docker, ending in a clean tree and the commit *init:
some_service_1 from java-backend-template 7ea886bc94bf (mvn verify green)*. Run again against GitHub with the default
ref and no flags (`--package com.acme.orders --name orders`): green, and its tree is file-for-file the local
run's tree with the name substituted. Rejected inputs, a non-empty target, an unreachable sha and an unknown
ref each fail before the template is fetched and remove what the run created; a failure after that leaves
the tree for inspection and says so. `npm run gates` green with the new relative
link; `npm run check` still lists the skill.

**What it costs every session: nothing.** No `description` changed, so `npm run tokens:frontmatter` is
unchanged. The script is not a `.md` file, so `npm run tokens` does not count it and no agent loads it into
context; it is executed, not read. The body grew by one sentence naming it. **Firing: not measured**; the
firing case this record already leaves open is unchanged by a body edit, and is where the script's value
would show — a session that fires the skill on a bare fixture and runs the script writes nothing of its own.

## 2026-09-16, later still: the scripts are Node, not bash

The owner, the same day: *"I don't like shell scripts in the java-backend-template and in the skill. I need
something more cross platform. spec-kit uses uv to distribute already, our skills our distributed via npx."*
The scaffold script is run by an agent on whatever machine the developer has, and this repo's own firing
records are stamped win32; a `.sh` there was a Linux assumption in the one file that most needed not to make
one. The template's `osv-scan.sh` had already made it explicitly: it downloaded `osv-scanner_linux_amd64`
with one checksum.

**Decision: Node, standard library only, no `package.json`, in both repos.** Node is on every machine that
matters by construction: a consumer got the skill through `npx skills add`, and the template's frontend gate
already shelled out to `node -e`. Python via uv was the alternative, rejected because it adds a third runtime
to a Java repo for the sake of eleven helper scripts; spec-kit chose uv because spec-kit is a Python project.
Keeping bash under Git for Windows was the cheaper option, rejected because it works only where the Linux
tooling the scripts assumed (`mapfile`, `mktemp`, `sha256sum`, `python3`, the linux-only binary) happens to
be present, which is the surface the template exists to remove. The zero-dependency rule mirrors this repo's
own *the two gates stay dependency-free*.

What changed in the template (squash-merged to `main` as `4c02812`, PR #7): the ten
`.sh` files under `scripts/` and `project-root/scripts/` are `.mjs`, sharing one `scripts/_lib.mjs` (run,
capture, fail with a status; `mvn`, `npm` and `npx` are `.cmd` files on Windows and are spawned through a
shell there, everything else directly). `wall.mjs` runs the four checks as child `node` processes so each
stays runnable alone. `init.mjs` applies the same substitutions in the same order, line-wise where sed was
line-wise, and skips a file holding a NUL byte; its output was diffed byte-for-byte against `init.sh` on
identical input and matched on every file outside `scripts/`. `mise.toml` pins `node = "24.21.0"` and
`osv-scanner = "2.6.0"` beside Java and Maven; the scan script requires the binary on `PATH` and names
`mise install` when it is missing, so one pin serves every platform and mise's aqua backend verifies the
release checksum where the script used to. Both workflows install the toolchain with `jdx/mise-action`
(SHA-pinned, mise version pinned) from the same file, replacing `setup-java`, with `~/.m2` under
`actions/cache`; the `frontend` job installs only `node`. `apply-ruleset` no longer needs `python3`. Every
`.sh` mention in the template's `README.md`, both `CLAUDE.md`s, `docs/GATES.md`, `pom.xml`, `.squawk.toml`
and the frontend README was rewritten; the GATES row for the scanner now says *pinned in `mise.toml`*
rather than *pinned by checksum*, because the checksum is no longer in a file this repo owns.

In the skill: `new-backend.sh` is `new-backend.mjs`, same flags, same cleanup contract, calling the
template's `init.mjs`; it carries its own twenty lines of spawn helpers rather than importing the
template's, because it runs before the template exists on disk. **`DEFAULT_REF` is `4c02812`**, the squash
commit on `main` after PR #7 merged, so the default passes its reachable-from-`main` check without an
override.

Verified, 2026-09-16, Java 25 / Maven 3.9.16 / Node 24.21.0 (template) and 26.5.1 (skill script, the
machine's own) / osv-scanner 2.6.0 / Docker: `node scripts/wall.mjs` green at the template root, every
step. Forbidden-flag, action-pin and frontend gates each fail on a planted violation, the first also on a
`-javaagent` planted in the lifted `compose.yaml` one level above a vendored `backend/`. The scaffold
script: rejected inputs, a non-empty target, an unknown ref and an unreachable sha fail before the fetch and
remove what the run created; vendored and standalone `--skip-verify` runs give the expected tree, lifted
`project-root/`, renamed package directory and three-commit history; the pinned-sha path was exercised
against a clone whose `main` holds the pin; a full vendored run with codegen and `mvn verify` ended in a
clean tree and *init: some_service_1 from java-backend-template 6a7eb02b37ce (mvn verify green)* — that
verification ran against the pre-squash `port/node-scripts` commit, before `DEFAULT_REF` moved to the
post-merge `4c02812`. `git diff 6a7eb02 4c02812` is the four spec-kit-ordering files (`README.md`,
`project-root/CLAUDE.md`, the constitution header, the `init.mjs` warning branch) and nothing `mvn verify`
or codegen reads, so the verification stands for the build; the scaffold's warning path is not re-run.
**Not
verified: a run on Windows or macOS.** The port removes the Linux assumptions that were visible; the claim
that it runs there is the standard library's, not a measurement, until someone runs it.

Per-session cost: still nothing; no `description` changed. Firing: unchanged, not measured.

## Where the scaffold sits in the spec-kit sequence — 2026-09-16

The owner asked what to do with `/speckit.constitution`, then caught the ordering the first answer had
assumed: *"Backend-template will only run when I hit the implement stage right? Spec-kit has constitution ->
specify -> plan -> tasks -> implement."* If the scaffold ran at implement, the pre-filled constitution would
never reach a project: `init.mjs` lifts `project-root/` without overwriting, so the file `/speckit.constitution`
had already written would be kept and the platform articles dropped with a one-line *kept existing*. The two
consistent orderings were scaffold-then-spec-kit, or spec-kit-first with the platform articles restated as
input to `/speckit.constitution` — which is the paste-into-a-consumer-file mechanism the delivery rule bans.

**Owner decision: scaffold first.** The sequence is `new-backend.mjs`, `specify init --here`,
`/speckit.constitution`, `/speckit.specify`, `/speckit.plan`, `/speckit.tasks`, `/speckit.implement`.
`/speckit.constitution` amends Article VII, the project's own decisions, and leaves I–VI alone; implement is
feature code inside an already-scaffolded `backend/`. Recorded in the template's README, its project
`CLAUDE.md` and the constitution's own header comment, and `new-backend.mjs` now prints `/speckit.constitution`
as the step after `specify init`. `init.mjs` was also changed to warn, rather than merely note, when the kept
file is the constitution, since that is the one file where *kept existing* means the scaffold's decisions did
not land. PR #7 was squash-merged to `main` the same day as `4c02812`, carrying the port and these edits together, and
`DEFAULT_REF` moved to it; the pin-move item recorded above is closed.

## `new-java-backend` — 2026-09-16

The owner, told to invoke `java-backend-rules` to scaffold: *"Or do we create a new skill? That only prepares the
constitution."* Yes. The scaffold instruction sat at the foot of a body that is the ban lists — thousands of
tokens an agent does not need while scaffolding — and behind every one of them, where an agent that has begun a
`pom.xml` reads it too late. `new-java-backend` is the procedure alone: run the script with the three inputs
the user supplies, do the one printed next step that stays inside the directory (`specify init --here`), hand the
rest to the user by name, and stop where `/speckit.constitution` begins with Article VII. `new-backend.mjs`
moved into it, because a skill dir is the whole world its consumer has; `java-backend-rules` now points at the
sibling by name. Marked *decided, not yet validated*: the template has run green and the procedure has been
run by hand, no project has yet been created by an agent invoking it.

Per-session cost, `npm run tokens:frontmatter`, 2026-09-16, o200k_base: `new-java-backend` 147 tokens
(name plus description), set total 4,581 across twenty-one skills, up from 4,434 across twenty. It is an
inception-cadence skill, the class this repo's own rule calls the worst trade; accepted because the alternative
was loading `java-backend-rules` whole at a moment none of its directives bind. Firing: meant to be invoked by
name; unprompted firing on "create a new Java backend here" unmeasured, and the bare-fixture case on the backlog
now has a second candidate skill to point at.

## 2026-09-21, after the day's last: `new-java-backend` stops handing off to `/speckit.constitution`

An agent invoking the skill scaffolded a project, then closed with "Next step: run `/speckit-constitution`", and
on the owner's objection began running it. The owner reported it as the second occurrence and asked for the root
cause rather than another correction. The cause was this repo's own text, read correctly: the skill's third
section was headed *Hand off to /speckit.constitution, Article VII only* and listed the command as the step after
`specify init --here`; `new-backend.mjs` printed it under its next steps; the template's `README.md`, project
`CLAUDE.md` and constitution header comment repeated it. The 2026-09-16 decision above was about which of scaffold
and spec-kit runs first, and the prose built on it turned an ordering into a step.

The step is not needed. Article VII is an optional slot; nothing in the template, in spec-kit 1.0.8 or in
`build-feature` reads whether it is filled. In the projects scaffolded by this date, one's constitution is
unchanged since its `init:` commit, and the other's Article VII was first written from a feature's plan
candidates, after that feature's spec existed — the route `build-feature`'s plan stage already names.

Changed: the section is now *Scaffold before anything writes a constitution; run no spec-kit command*, its
directive ends the skill at the `specify init --here` commit and names the rejected default; its check gained a
second half, *convention*, since nothing reads a session's closing text. The printed line is gone from
`new-backend.mjs`. `README.md` here no longer lists the command as step 2 of starting a project. The description
is untouched, so the frontmatter cost and any firing baseline stand. The template's three sentences change in its
own repo, and `DEFAULT_REF` moves only once that commit is on the template's remote, because the script fetches
the pin from there. A per-project memory note was tried first and does not reach the failure: the next scaffold
runs in a directory that has none.

Found on the same run, not fixed here: neither `new-backend.mjs` nor `init.mjs` formats after the package rename,
so a package that sorts after `java.` fails `spotless:check` and the script stops before its `init:` commit;
`mvn spotless:apply` in `backend/` and a hand-made commit got the run through.

**The pin moved the same day, to `5e75cf7`, for a docs change.** Between the fix above and the template's commit
reaching its remote, the owner scaffolded two more projects from the previous pin, and both carried the old
header, the old `CLAUDE.md` sentence and the old Article VII — the prediction in the paragraph above, observed
within the hour. The template gained a second commit first: Article VII was an empty heading over a comment that
opened with "Add what this product decides" and listed six topics, which the owner named as the thing being read
as "you have to add something here"; it now reads "None. Empty is a complete state for this section". The five
projects scaffolded by then were brought to the same wording by hand, on `main` and `dev`; the one whose Article
VII holds real articles had only its header and `CLAUDE.md` sentence changed. Checked: a `--skip-verify` scaffold
from the new pin into a scratch directory produced the new wording in all three lifted files and printed no
`/speckit.*` step. Not checked: `mvn verify` at the new pin — the diff from `4a1c6fd` touches `README.md`,
`project-root/CLAUDE.md` and `project-root/.specify/memory/constitution.md` and no build input.

**The formatter gap closed the same day; pin `a89bd28`.** `new-backend.mjs` now runs `mvn -q spotless:apply`
between codegen and verify, and prints it in the deferred command under `--skip-verify`; the template's `init.mjs`
message and README procedure say the same, and `init.mjs` itself stays pure Node. Cause: the rename changes where
the project's own imports sort and how long lines wrap, so any package that sorts after `java.` left the tree
unformatted and `spotless:check` refused it. Checked: a full run of the script from this pin for
`mn.netgroup.netcore.fmttest` — codegen, format, `mvn verify` green against PostgreSQL, the script's own `init:`
commit, a clean tree — where the same package shape had stopped at `spotless:check` that morning. The skill's
status line no longer says no agent has created a project with it.

