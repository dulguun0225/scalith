#!/usr/bin/env node
// The evidence-order check, from `enforceable-rules` — "Wiring the gates", item 1.
//
// Every subheading in an evidence file names a real section of the directive
// text, and those subheadings run in the directive text's order. What it is for:
// an accreting rule set silently reorganises itself by research date, and the
// reader who arrives from a directive heading then cannot find its grounds.
//
// Three exact failure conditions, no similarity heuristics. A drift detector
// scored on heading-name overlap was written first and dropped: every one of
// the five hits it produced against this repo was a coincidence between a
// structural evidence section and a directive of similar vocabulary.
//
// Exit 1 on any failure. It fails the build; it is not advisory.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { skillDirs, fileExists, headings, normalize } from "./lib/md.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

// Skills whose evidence file is organised by research pass rather than by
// directive, so it anchors to nothing and the order half of this check has no
// purchase on it. Declared here rather than inferred, because an evidence file
// that anchors to nothing is exactly what a silent reorganisation looks like —
// the difference is that these were written that way and reviewed that way.
// Adding a name here is a decision; leaving one out fails the build.
//
// Empty here: every evidence file in this repo anchors to its directive text.
const PASS_ORGANISED = new Map([]);

/** Indices of a longest strictly increasing subsequence — the rest are the offenders. */
function longestIncreasing(values) {
  const tails = [];
  const prev = new Array(values.length).fill(-1);
  for (let i = 0; i < values.length; i += 1) {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (values[tails[mid]] < values[i]) lo = mid + 1;
      else hi = mid;
    }
    if (lo > 0) prev[i] = tails[lo - 1];
    tails[lo] = i;
  }
  const keep = new Set();
  let cursor = tails.length ? tails[tails.length - 1] : -1;
  while (cursor !== -1) {
    keep.add(cursor);
    cursor = prev[cursor];
  }
  return keep;
}

function checkSkill(name, dir) {
  const evidencePath = join(dir, "evidence.md");
  if (!fileExists(evidencePath)) return { name, skipped: "no evidence.md" };

  const directive = headings(readFileSync(join(dir, "SKILL.md"), "utf8")).filter((h) => h.level >= 2);
  const evidence = headings(readFileSync(evidencePath, "utf8")).filter((h) => h.level >= 2);
  const directiveNorm = directive.map((h) => normalize(h.text));

  const failures = [];
  const unanchored = [];
  const anchored = [];
  const seen = new Map();

  for (const h of evidence) {
    const norm = normalize(h.text);
    let index = directiveNorm.indexOf(norm);

    if (index === -1) {
      // A merged evidence section — one heading covering two directive sections
      // — still anchors, to the first directive it names in full.
      const contained = directiveNorm
        .map((d, i) => ({ d, i }))
        .filter(({ d }) => d.length > 12 && norm.includes(d));
      if (contained.length) index = contained[0].i;
    }

    if (index === -1) {
      unanchored.push(`evidence.md:${h.line} "${h.text}"`);
      continue;
    }

    if (seen.has(index)) {
      failures.push(
        `evidence.md:${h.line} "${h.text}" anchors to the same SKILL.md section as ` +
          `evidence.md:${seen.get(index)} — one directive's grounds split across two places`,
      );
    }
    seen.set(index, h.line);
    anchored.push({ index, line: h.line, text: h.text });
  }

  const keep = longestIncreasing(anchored.map((a) => a.index));
  anchored.forEach((a, i) => {
    if (keep.has(i)) return;
    failures.push(
      `evidence.md:${a.line} "${a.text}" runs out of the directive text's order ` +
        `(its section is SKILL.md:${directive[a.index].line})`,
    );
  });

  const declared = PASS_ORGANISED.get(name);
  if (!anchored.length && !declared) {
    failures.push(
      `evidence.md anchors to no section of SKILL.md at all — either give its ` +
        `sections the directive headings they ground, or declare it in ` +
        `PASS_ORGANISED in scripts/evidence-order.mjs with the reason`,
    );
  }
  if (anchored.length && declared) {
    failures.push(
      `declared PASS_ORGANISED in scripts/evidence-order.mjs, but ${anchored.length} ` +
        `heading(s) do anchor — the declaration is stale, remove it`,
    );
  }

  return { name, failures, unanchored, anchored: anchored.length, declared };
}

const results = skillDirs(ROOT).map(({ name, dir }) => checkSkill(name, dir));
const checked = results.filter((r) => !r.skipped);
const skipped = results.filter((r) => r.skipped);
let failed = 0;

for (const r of checked) {
  if (!r.failures.length) continue;
  failed += r.failures.length;
  console.log(`\nFAIL ${r.name}`);
  for (const f of r.failures) console.log(`  ${f}`);
}

console.log(
  `\nevidence-order: ${checked.length} skill(s) with an evidence.md checked, ` +
    `${skipped.length} without one skipped, ${failed} failure(s).`,
);

const declared = checked.filter((r) => r.declared);
if (declared.length) {
  console.log(`\nDeclared as organised by research pass, so nothing to order:`);
  for (const r of declared) console.log(`  ${r.name} — ${r.declared}`);
}

const orphans = checked.flatMap((r) => r.unanchored.map((u) => `${r.name}/${u}`));
console.log(
  `\n${orphans.length} evidence heading(s) anchor to no directive section. Not ` +
    `failures: an evidence file legitimately carries provenance, do-not-cite and ` +
    `re-open-trigger sections a SKILL.md has no counterpart for. This check cannot ` +
    `tell one of those from an orphan. Pass --orphans to list them.`,
);
if (process.argv.includes("--orphans")) for (const o of orphans) console.log(`  ${o}`);

console.log(`
What this check does not decide:
  - whether a note is filed under the RIGHT heading; only that the heading
    exists in the directive text and is in order
  - whether an unanchored evidence section should have anchored to something
  - whether the grounds under a heading support the directive above it
  - any of the five incompleteness checks — all five are about absence
  - whether the marker table is honest, or whether a rule marked off-the-shelf
    has its gate wired
`);

process.exit(failed ? 1 : 0);
