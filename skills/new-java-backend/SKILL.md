---
name: new-java-backend
description: Take an empty directory to spec-kit's first command for a Java backend, from the pinned dulguun0225/java-backend-template, before any /speckit command runs. Invoke by name (/new-java-backend).
disable-model-invocation: true
---
# New Java backend — from an empty directory to spec-kit's first command

The code is written by LLM agents and no human reads it line by line, so scaffolding is not a decision and nothing an agent writes during it is wanted. The stack is decided in `backend-stack`, the rules that bind every line are in `java-backend-rules`, and the template `dulguun0225/java-backend-template` is those rules with every build-enforceable gate wired and green. This skill lands the template and ends at the commit that follows `specify init --here`; no spec-kit command is part of it.

## Run the script; write nothing

**Run [`scripts/new-backend.mjs`](scripts/new-backend.mjs) from this skill's own directory, with the three inputs the user supplies, and write no file yourself.** The inputs are the base package, the artifact name and the Maven group. Ask for them rather than inventing them: the package rename is permanent once the tree exists.

```
node <this skill dir>/scripts/new-backend.mjs --package <pkg> --name <artifact> --group <group> --dir .
```

The default is vendored: the directory is the project root, the template lands in `backend/` by `git subtree add` at the pinned commit, and its own `init.mjs` renames the package and lifts the project-level files one level up — root CI with `backend` and `frontend` jobs, the branch ruleset, `compose.yaml`, the `frontend/` stub, the pre-filled spec-kit constitution, the project `CLAUDE.md`. Then jOOQ codegen, `mvn spotless:apply` (the rename leaves the tree unformatted) and `mvn verify` against a real PostgreSQL, committed as `init: <artifact> from java-backend-template <sha> (mvn verify green)`. `--standalone` is for a repository that *is* the service; `--skip-verify` defers codegen and verify, and the commit message says so. The script checks its own preconditions: the directory is empty or absent, `git` and `mvn` are on `PATH`, and verify needs Docker.

Do not write a `pom.xml`, an ArchUnit ban list, a CI file or an error-response skeleton from the directives in `java-backend-rules`: it costs the first session, produces a different result each time, and pins versions from memory. The template is one tree, byte-identical for a given commit, package and name.

The project `CLAUDE.md` it lifts states the trunk in one line, `` Base branch: `main` ``, beside the definition-of-done command; `main` is the branch the script's `git init -b main` makes, and `build-feature` reads that line to find the base branch. A project whose trunk is named otherwise changes the name between the backticks in the same commit as the rename, together with the trunk named in the root CI trigger and the branch ruleset; the service's own `backend/CLAUDE.md` is not read.

The pinned commit is `DEFAULT_REF` inside the script. Move it in a commit that says which gate change it brings in; `--ref` overrides it for one run.

## Stop where the script stops

**Do only the printed next step that has no side effect outside the directory, and hand the rest to the user by name.** The script stops before anything that touches the forge or the wider machine and prints those steps: `gh repo create`, `node scripts/apply-ruleset.mjs`, `npx skills add dulguun0225/skills`, `npx skills add dulguun0225/scalith`, `specify init --here`. Run `specify init --here` when `specify` is on `PATH` — it seeds only missing files, so the pre-filled constitution survives it — and skip each `npx skills add` whose skills are already installed; `dulguun0225/scalith`'s are, if you are reading this. Do not create the forge repository or apply the ruleset unless the user has named the organisation and asked for it in this session.

## Scaffold before anything writes a constitution; run no spec-kit command

**The skill ends at the `specify init --here` commit: run no `/speckit.*` command after it, and name none as a next step in the closing report.** Do not close with "Next step: run `/speckit.constitution`" even though spec-kit's banner lists it first and Article VII of the lifted constitution is empty: at scaffold time nothing exists to put there. Article VII is an optional slot for rules the project turns out to need; nothing reads whether it is filled, and an empty one blocks nothing. It is amended later, as a commit with its reason, from the candidates a feature's plan produces. The closing report says what was run, what failed, and which forge steps were left to the user, and stops there.

The constitution the template lifts to `.specify/memory/constitution.md` carries Articles I–VI — the platform, the gates as the review, explicit over silent, the committed contract, the repo shape, features as packages — each restating what `mvn verify` in `backend/` enforces. They are not re-planned per feature; a plan's Technical Context inherits them.

Scaffold first. `/speckit.constitution` run before the scaffold writes the file from spec-kit's generic template, and the scaffold's `init.mjs` never overwrites, so the platform articles are dropped with a warning and `/speckit.plan` re-decides the stack the template has already decided.

## What this skill does not do

It does not choose the stack — `backend-stack` does. It does not state or explain a rule — `java-backend-rules`, `java-backend-api` and `java-backend-observability` do, and the template's `docs/GATES.md` maps each wired gate to the directive it implements. It does not verify that the template's pins are newest; that is done once in the template. It has not been run on Windows or macOS: the script is Node on the standard library and avoids the Linux assumptions that were visible.
