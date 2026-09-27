#!/usr/bin/env node
// The dangling-pointer check, from `enforceable-rules` — "Wiring the gates", item 2.
//
// No skill text cites a rule id, a principle by number, or a relative link back
// to material the reader does not have. What it is for: a cited number that does
// not resolve reads as THAT repo's own numbering, which is worse than an
// obviously broken link, and a relative path out of the skill dir resolves to
// nothing at all once the skill is installed — the skill dir is the whole world
// its consumer has.
//
// Exit 1 on any failure. It fails the build; it is not advisory.

import { readFileSync } from "node:fs";
import { basename, join, normalize as normalizePath } from "node:path";
import { fileURLToPath } from "node:url";
import { skillDirs, markdownFiles, fileExists, linesOutsideFences } from "./lib/md.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

// Id prefixes that name numbering no installed skill dir carries. `P-n` was the
// deleted corpus's principle numbering and `B-n` its decision log's; both
// resolve for whoever wrote them and dangle for every reader. The ban is
// absolute, not contingent on whether a definition happens to exist.
const NEVER_SHIPS = /\b([PB]-\d+)\b/g;

// Files that exist in this repository and in no installed skill dir. A skill
// citing one sends its reader to a file they do not have.
const REPO_ONLY_FILES = /\b(BACKLOG\.md|DECISIONS\.md|docs\/history[^\s)]*)/g;

// A rule id is cited in code ticks and defined in bold — `M-35` against
// `**M-35 — ...**`. Requiring the ticks is what separates this set's own
// numbering from the world's: ECJ case C-302/07, JSR-385, AIP-158, BSD-3 and
// MPL-2 all match the bare shape, and all resolve for a reader who has none of
// these skills. The prefix must also be one this set actually defines.
const ID_REFERENCE = /`([A-Z]{1,3}-\d+)`/g;
const ID_DEFINITION = /\*\*\s*`?([A-Z]{1,3}-\d+)`?\s*[—–-]/g;
const LINK = /\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

const skills = skillDirs(ROOT);

// Pass one: every id this skill set defines, and which skill owns it.
const owner = new Map();
for (const { name, dir } of skills) {
  for (const { path } of markdownFiles(dir)) {
    const text = readFileSync(path, "utf8");
    for (const line of linesOutsideFences(text)) {
      for (const m of line.matchAll(ID_DEFINITION)) {
        if (!owner.has(m[1])) owner.set(m[1], name);
      }
    }
  }
}

const namespaces = new Set([...owner.keys()].map((id) => id.split("-")[0]));

const failures = [];
const crossSkill = new Map();

for (const { name, dir } of skills) {
  for (const { name: file, path } of markdownFiles(dir)) {
    const where = (line) => `${name}/${file}:${line}`;
    linesOutsideFences(readFileSync(path, "utf8")).forEach((line, i) => {
      const at = where(i + 1);

      for (const m of line.matchAll(NEVER_SHIPS)) {
        failures.push(`${at} cites \`${m[1]}\` — numbering no installed skill dir carries`);
      }

      for (const m of line.matchAll(REPO_ONLY_FILES)) {
        failures.push(`${at} names \`${m[1]}\` — a file of this repository, not of the skill dir`);
      }

      for (const m of line.matchAll(ID_REFERENCE)) {
        const id = m[1];
        if (/^[PB]-/.test(id)) continue; // already failed above
        if (!namespaces.has(id.split("-")[0])) continue; // an identifier of the world, not of this set
        const home = owner.get(id);
        if (!home) {
          failures.push(`${at} cites \`${id}\`, which no skill in this set defines`);
        } else if (home !== name) {
          const key = `${name} -> ${home}`;
          crossSkill.set(key, (crossSkill.get(key) ?? 0) + 1);
        }
      }

      for (const m of line.matchAll(LINK)) {
        const target = m[1];
        if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("#")) continue;
        const [pathPart] = target.split("#");
        if (!pathPart) continue;
        if (pathPart.startsWith("/")) {
          failures.push(`${at} links to \`${target}\` — an absolute path the installed skill has no root for`);
          continue;
        }
        const resolved = normalizePath(join(dir, pathPart));
        if (!resolved.startsWith(normalizePath(dir))) {
          failures.push(`${at} links to \`${target}\` — outside its own skill dir`);
          continue;
        }
        if (!fileExists(resolved)) {
          failures.push(`${at} links to \`${target}\` — no such file in ${basename(dir)}/`);
        }
      }
    });
  }
}

for (const f of failures) console.log(`FAIL ${f}`);

console.log(
  `\ndangling-pointer: ${skills.length} skill(s) scanned, ${owner.size} rule id(s) ` +
    `defined across them, ${failures.length} failure(s).`,
);

if (crossSkill.size) {
  console.log(
    `\n${crossSkill.size} skill pair(s) cite ids across a dir boundary. Each resolves ` +
      `only if the reader installed both, so each pair is a claim that they ship ` +
      `together — this check verifies the id is defined somewhere, not that the ` +
      `pairing is honest. Pass --pairs to list them.`,
  );
  if (process.argv.includes("--pairs")) {
    for (const [pair, count] of [...crossSkill].sort()) console.log(`  ${pair}  (${count})`);
  }
}

console.log(`
What this check does not decide:
  - whether a reader who installed one skill also installed the skill that owns
    an id it cites; only that the id is defined somewhere in this set
  - whether a cited id is the RIGHT id for the sentence citing it
  - whether prose names a repository file without a path or a link — a skill may
    legitimately tell a reader to write their own CLAUDE.md or README.md
  - any of the five incompleteness checks — all five are about absence
  - whether the marker table is honest, or whether a rule marked off-the-shelf
    has its gate wired
`);

process.exit(failures.length ? 1 : 0);
