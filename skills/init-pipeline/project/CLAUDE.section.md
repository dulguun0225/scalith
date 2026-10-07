## Feature pipeline

This project builds features with spec-kit and scalith's `plan-feature` and `build-feature`, set up by
scalith's `init-pipeline`. `build-feature` is one of the tools that read the `Base branch:` line above; the
base branch below is the branch that line names.

The Claude Code session a person runs in this project, which keeps the base branch current as described above,
writes specs on the base branch and never creates or switches to a branch for a spec. At the end of every
`/speckit-specify` or `/speckit-clarify` session that changed a spec, whatever is left to ask, it commits that
spec on the base branch and pushes, again without asking and without mentioning git. If the push is rejected,
it rebases only its own unpushed commit onto the base branch as origin has it and pushes again.

An agent of the `build-feature` or `plan-feature` workflow is not such a session: it runs only the git steps its
prompt names.

A feature's spec is fixed once its build has started: origin has the feature's build branch
`build/<NNN>-<name>`, or every task in its `tasks.md` is ticked. A later change to what that feature does is
specified as a new feature with `/speckit-specify`, and that spec states the change to the earlier feature.

- A feature's `spec.md` is written here and owned here: a domain expert writes `specs/<NNN>-<name>/spec.md`
  with stock spec-kit (`/speckit-specify`, `/speckit-clarify`), build work picks up at `/speckit-plan`, and no
  later stage edits `spec.md`. Nothing is derived from a document in another repository.
- A question about how the service treats a caller's contradictory, ambiguous or invalid input — one variable
  given two values, an idempotency key reused with different content, a line break in an email subject — is
  recommended as: refuse the request with a named error that says what is wrong and what is allowed, never pick
  a value or correct the input (`enforceable-rules`, "Fail loud, never silently wrong"). The recommendation is a
  default offered to the domain expert, not an edit: the answer and `spec.md` stay theirs.
- `node scripts/check-traceability.mjs` is the spec↔code gate. The backend wall runs it: `scripts/wall-checks.txt`
  lists its self-test, `scripts/check-traceability.selftest.mjs`, and then the gate, and
  `node backend/scripts/wall.mjs` runs each listed script from this directory. The gate refuses a bare
  requirement id, resolves every `NNN/FR-nnn` against `specs/<NNN>-<name>/spec.md`, and holds every id of a
  feature whose `tasks.md` is closed to a test citation and every id of a feature that has a `tasks.md` to a
  task naming it. It scans the tracked files under `backend/`, `frontend/`, `.specify/memory/` and `scripts/`,
  and `specs/`; a test citation is one under `backend/src/test/`. Two lists under `specs/` feed it —
  `trace-waivers.tsv` (an id no test claims, `external` or `deferred`, with a reason) and
  `trace-legacy-files.tsv` (files whose bare ids can never move, a shipped migration above all). Neither list is
  shipped and neither is required: the first feature that needs a row is what creates the file. `--report`
  prints the coverage matrix, the spec→tasks gap and the deferred ids. What the gate cannot decide is printed
  on every run and written in the headers of the gate and its self-test.
- A requirement citation written anywhere outside its own `specs/<NNN>-<name>/` directory — code, test, migration
  comment, `backend/docs/GATES.md` — is qualified: `NNN/FR-nnn` / `NNN/SC-nnn`, where `NNN` is the feature
  directory's numeric prefix. Ids collide across features, so a bare `FR-nnn` names one requirement per feature
  and none of them. Inside a feature's own `specs/<NNN>-<name>/` a bare id is legal and means that feature's own,
  so it has to be one that feature's `spec.md` defines; a reference to another feature's id is qualified there
  too, and the spaced form (`NNN` and a space where the slash belongs) is not a citation anywhere. A token
  qualified by something that is **not** a feature prefix — `CAP-NC02-04/FR-034a`, where the qualifier is an
  uppercase letter followed by uppercase letters, digits and hyphens — names a requirement of another document.
  Nothing here declares, pins or resolves such a document, so the token is **prose**: not a citation, not a bare
  id, resolving nothing, covering nothing, planning nothing. The gate recognises the shape only so that it can
  drop it: unrecognised it would read as the bare id it wraps and, inside a feature directory, resolve against
  that feature's own requirement of the same number. A range of ids is written out id by id: a range spelled
  with an en dash is not parsed.
- A waiver row in `specs/trace-waivers.tsv` is three columns — `NNN/ID<TAB>kind<TAB>reason` — and the kind is
  exactly one of two. `external`: the criterion cannot be witnessed from inside this repository at all (a
  consumer service's behaviour, caller topology, a production baseline, an organisational outcome). `deferred`:
  the requirement is specified and deliberately not built yet, and the reason names where that deferral is
  recorded — a named-gap row in `backend/docs/GATES.md`, a scope boundary in the feature's `plan.md`, the owning
  capability — so a reader can go and check it. There is no third kind, and a requirement that is merely
  untested is neither of them: it gets a test. `plan.md` and commit messages stay ungated.
- `.specify/memory/constitution.md` is the spec-kit constitution. Articles I–VI restate what `backend/` already
  enforces and are not re-planned. Article VII holds the rules the project adopts later: each is amended in by
  a commit with its reason when a feature's plan produces a rule that binds more than that feature and passes
  the test the constitution sets for an article. A new project's Article VII is empty, and nobody is owed a
  `/speckit-constitution` run. `/speckit-plan` reads the file and must not re-plan the stack or the gates; a
  plan's Technical Context inherits them.
- `.claude/settings.json` pins `worktree.baseRef: head`: an agent run in an isolated worktree starts from the
  branch you are on, not from the base branch. The unattended build works on `build/<NNN>-<name>` ahead of the
  base branch, so a worktree cut from the base branch lacks the files earlier tasks created and the agent
  silently works on the wrong tree.
  `.claude/worktrees/` is ignored; those worktrees are merged and removed, never committed.

Install the pipeline skills once per machine: `npx skills add dulguun0225/scalith -g -a claude-code -y`.
