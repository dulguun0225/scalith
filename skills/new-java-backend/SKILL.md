---
name: new-java-backend
description: Take an empty directory to spec-kit's first command for a Java backend, from the pinned dulguun0225/java-backend-template. ALWAYS load before creating a new Java backend repository or project directory, writing a pom.xml or any build file for one, or running /speckit.constitution in a project that has no backend/ yet.
---
# New Java backend — from an empty directory to spec-kit's first command

**Premise, shared with every skill in this set:** the code is written by LLM agents and no human reads it line by line. The consequence for the first session of a project is specific: **scaffolding is not a decision, so nothing an agent writes during it is wanted.** The stack is decided in `backend-stack`, the rules that bind every line are in `java-backend-rules`, and the template `dulguun0225/java-backend-template` is those rules' consequence with every build-enforceable gate wired and green. This skill is the procedure that lands it, and it ends at the commit that follows `specify init --here`; no spec-kit command is part of it.

## Run the script; write nothing

**Run [`scripts/new-backend.mjs`](scripts/new-backend.mjs) from this skill's own directory, with the three inputs the user supplies, and write no file yourself.** The inputs are the base package, the artifact name and the Maven group — the only three things about a scaffold that are the project's to decide, and the agent asks for them rather than inventing them, because the package rename is permanent once the tree exists.

```
node <this skill dir>/scripts/new-backend.mjs --package <pkg> --name <artifact> --group <group> --dir .
```

The default is vendored: the directory is the project root, the template lands in `backend/` by `git subtree add` at the pinned commit, its own `init.mjs` renames the package and lifts the project-level files one level up — root CI with `backend` and `frontend` jobs, the branch ruleset, `compose.yaml`, the `frontend/` stub, the pre-filled spec-kit constitution, the project `CLAUDE.md`. Then jOOQ codegen, `mvn spotless:apply` — the rename moves the project's own imports and re-wraps lines, so the tree is unformatted until the formatter has run — and `mvn verify` run against a real PostgreSQL, and the result is committed as `init: <artifact> from java-backend-template <sha> (mvn verify green)`. `--standalone` is for a repository that *is* the service; `--skip-verify` defers codegen and verify, and the commit message then says so. Preconditions the script checks itself: the directory is empty or absent, `git` and `mvn` are on `PATH`, and verify needs Docker.

The default an agent reaches for — a `pom.xml`, an ArchUnit ban list, a CI file and an error-response skeleton written from the directives in `java-backend-rules` — is rejected on three grounds: it costs the first session, it produces a different ban list each time, and on 2026-09-01 it pinned a superseded Java LTS and a superseded Spring Boot major while passing every gate it had just written. The template is one tree, byte-identical for a given commit, package and name.

The project `CLAUDE.md` it lifts states the trunk in one line, `` Base branch: `main` ``, beside the definition-of-done command, and `main` is the branch the script's `git init -b main` makes; `build-feature` reads that line to find the base branch (2026-09-25). A project whose trunk is named otherwise — renamed after the scaffold, or pushed to a forge whose default is another branch — changes the name between the backticks in the same commit as the rename, together with the trunk named in the root CI trigger and the branch ruleset; the service's own `backend/CLAUDE.md` carries the template's line and is not read.

The pinned commit is `DEFAULT_REF` inside the script, recorded with its source and date in the comment beside it. It moves deliberately, in a commit that says which gate change it brings in; `--ref` overrides it for one run.

(Check: after the run, the directory's `git log` holds the script's `init:` commit and nothing hand-written precedes it; a build file that exists before that commit is the finding — *convention*, 2026-09-16.)

## Stop where the script stops

**Do only the printed next step that has no side effect outside the directory, and hand the rest to the user by name.** The script stops, on purpose, before anything that touches the forge or the wider machine, and prints those steps: `gh repo create`, `node scripts/apply-ruleset.mjs`, `npx skills add dulguun0225/skills`, `npx skills add dulguun0225/scalith`, `specify init --here`. Of these, run `specify init --here` when `specify` is on `PATH` — it seeds only files that are missing, so the pre-filled constitution survives it — and skip each `npx skills add` whose skills are already installed; `dulguun0225/scalith`'s are, if you are reading this. Do not create the forge repository or apply the ruleset unless the user has named the organisation and asked for it in this session.

(Check: the session's tool calls contain no `gh repo create` and no `apply-ruleset` the user did not ask for by name — *convention*.)

## Scaffold before anything writes a constitution; run no spec-kit command

**The skill ends at the `specify init --here` commit: run no `/speckit.*` command after it, and name none as a next step in the closing report.** The default an agent reaches for is to close with "Next step: run `/speckit.constitution`", or to start it, because spec-kit's own banner lists it as step one and Article VII of the lifted constitution sits empty — rejected because at scaffold time nothing exists to put there, and the user is handed a step nobody needs. Article VII is an optional slot for rules the project turns out to need: no gate, test or spec-kit command reads whether it is filled, and an empty one blocks nothing, `build-feature` included. It is amended later, as a commit with its reason, from the candidates a feature's plan produces. The closing report says what was run, what failed, and which forge steps were left to the user, and stops there.

The constitution the template lifts to `.specify/memory/constitution.md` already carries Articles I–VI — the platform, the gates as the review, explicit over silent, the committed contract, the repo shape, features as packages — each restating what `mvn verify` in `backend/` already enforces. They are not re-planned per feature; a plan's Technical Context inherits them.

The ordering that is decided is the other one, and it is the trap this skill's description fires on. Run `/speckit.constitution` before the scaffold and it writes the file from spec-kit's generic template; the scaffold's `init.mjs` never overwrites, so the platform articles are dropped with a warning and `/speckit.plan` re-decides the stack the template has already decided. **Scaffold first, decided 2026-09-16.**

(Check: `.specify/memory/constitution.md` in the project holds the six platform articles verbatim and `init.mjs` printed no constitution warning — *convention*, 2026-09-16. And the session's tool calls hold no `speckit` skill invocation and its closing report names no `/speckit.*` command — *convention*, 2026-09-21; nothing reads a session's closing text, so this is kept as the named default-override alone.)

## What this skill does not do

It does not choose the stack — `backend-stack` does, and it has. It does not state or explain a rule — `java-backend-rules`, `java-backend-api` and `java-backend-observability` do, and the template's own `docs/GATES.md` maps each wired gate to the directive it implements and names what no gate reaches. It does not verify that the template's pins were newest at its recorded date; that is the convention `java-backend-rules` names under its gate-wiring section, performed once in the template and decaying the same way. It does not run on Windows or macOS as a measured fact: the script is Node on the standard library and removes the Linux assumptions that were visible, and the claim that it runs there is the standard library's until someone runs it.

**Status: *decided, not yet validated*** as a skill — the template it lands ran green on Java 25 and Spring Boot 4.1.1 on 2026-09-16, and an agent invoking this skill first created a project on 2026-09-21; that run is where the missing formatter step and the hand-off wording were found, and both are fixed above. **Firing:** meant to be invoked by name (`/new-java-backend`); whether the description earns the load unprompted on "create a new Java backend here" is unmeasured. Grounds and dates in [evidence.md](evidence.md).
